use std::path::{Path, PathBuf};

use aws_config::Region;
use aws_sdk_s3::Client;
use aws_sdk_s3::primitives::DateTime;
use color_eyre::eyre::{Result, WrapErr, eyre};
use image::DynamicImage;

const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif", "avif"];

const DEFAULT_PUBLIC_BASE: &str = "https://images.ryuhei373.dev";

// Preview targets a generous-but-bounded resolution; the terminal renderer downsamples further.
// Stays comfortably above any plausible terminal pixel size while keeping wire bytes tiny.
const PREVIEW_WIDTH: u32 = 1024;
const PREVIEW_QUALITY: u32 = 75;

// Bumped when the on-disk dims schema changes (currently a single line of `WxH`).
const DIMS_CACHE_VARIANT: &str = "dims-v1";

#[derive(Debug, Clone)]
pub struct R2Object {
    pub key: String,
    pub size: i64,
    pub last_modified: Option<DateTime>,
}

#[derive(Clone)]
pub struct R2 {
    client: Client,
    http: reqwest::Client,
    bucket: String,
    public_base: String,
    cache_root: PathBuf,
    dims_cache_root: PathBuf,
}

impl R2 {
    pub async fn from_env() -> Result<Self> {
        dotenvy::from_filename(".dev.vars").ok();

        let access_key_id = std::env::var("R2_ACCESS_KEY_ID")
            .wrap_err("R2_ACCESS_KEY_ID is not set (define it in .dev.vars)")?;
        let secret_access_key = std::env::var("R2_SECRET_ACCESS_KEY")
            .wrap_err("R2_SECRET_ACCESS_KEY is not set (define it in .dev.vars)")?;
        let account_id = std::env::var("CLOUDFLARE_ACCOUNT_ID")
            .wrap_err("CLOUDFLARE_ACCOUNT_ID is not set (define it in .dev.vars)")?;
        let bucket = std::env::var("R2_BUCKET")
            .unwrap_or_else(|_| "images-ryuhei373-dev".into());
        let public_base = std::env::var("R2_PUBLIC_BASE")
            .unwrap_or_else(|_| DEFAULT_PUBLIC_BASE.into())
            .trim_end_matches('/')
            .to_string();

        let endpoint = format!("https://{account_id}.r2.cloudflarestorage.com");
        let credentials = aws_sdk_s3::config::Credentials::new(
            access_key_id,
            secret_access_key,
            None,
            None,
            "env",
        );
        let config = aws_sdk_s3::config::Builder::new()
            .region(Region::new("auto"))
            .endpoint_url(&endpoint)
            .credentials_provider(credentials)
            .force_path_style(true)
            .build();

        let http = reqwest::Client::builder()
            .user_agent(concat!("r2-image-picker/", env!("CARGO_PKG_VERSION")))
            .build()
            .wrap_err("building HTTP client")?;

        // Variant goes in the path so changing PREVIEW_WIDTH/QUALITY transparently invalidates old entries.
        let variant = format!("v1-w{PREVIEW_WIDTH}-q{PREVIEW_QUALITY}");
        let base = resolve_cache_root();
        let cache_root = base.join(variant);
        // Dims live under their own variant root; they don't depend on preview width/quality
        // so they survive PREVIEW_* tweaks.
        let dims_cache_root = base.join(DIMS_CACHE_VARIANT);

        Ok(Self {
            client: Client::from_conf(config),
            http,
            bucket,
            public_base,
            cache_root,
            dims_cache_root,
        })
    }

    pub async fn list_images(&self) -> Result<Vec<R2Object>> {
        let mut objects = Vec::new();
        let mut continuation_token: Option<String> = None;

        loop {
            let mut req = self.client.list_objects_v2().bucket(&self.bucket);
            if let Some(token) = &continuation_token {
                req = req.continuation_token(token);
            }
            let result = req.send().await.wrap_err("listing R2 bucket")?;

            for obj in result.contents.unwrap_or_default() {
                let Some(key) = obj.key else { continue };
                if !is_image_key(&key) {
                    continue;
                }
                objects.push(R2Object {
                    key,
                    size: obj.size.unwrap_or(0),
                    last_modified: obj.last_modified,
                });
            }

            if !result.is_truncated.unwrap_or(false) {
                break;
            }
            match result.next_continuation_token {
                Some(t) => continuation_token = Some(t),
                None => break,
            }
        }

        objects.sort_by(|a, b| {
            b.last_modified
                .as_ref()
                .map(|d| d.secs())
                .cmp(&a.last_modified.as_ref().map(|d| d.secs()))
        });

        Ok(objects)
    }

    /// Fetches a downsized preview, using a persistent on-disk cache when available.
    ///
    /// Cache layout: `<cache_root>/<variant>/<sanitized key>` where the variant directory
    /// segment encodes width/quality so changing those constants invalidates old entries.
    /// Network path hits `<public_base>/cdn-cgi/image/width=W,quality=Q/<key>`.
    pub async fn get_preview(&self, key: &str) -> Result<DynamicImage> {
        let cache_path = self.cache_path_for(key);

        if let Ok(bytes) = tokio::fs::read(&cache_path).await {
            if let Ok(img) = image::load_from_memory(&bytes) {
                return Ok(img);
            }
            // Decode failed → treat as a corrupt cache entry and refetch.
        }

        let bytes = self.fetch_preview_bytes(key).await?;

        // Best-effort persist. A disk error here shouldn't block the user from seeing the image.
        let _ = persist(&cache_path, &bytes).await;

        image::load_from_memory(&bytes)
            .wrap_err_with(|| format!("decoding preview {key}"))
    }

    /// Returns the original image's intrinsic dimensions, with a disk-cached fast path.
    ///
    /// On a hit, no network request is made — important because preview is also disk-cached,
    /// so a remote roundtrip just for dims would dominate wall time on warm runs. On a miss,
    /// we hit Cloudflare's `cdn-cgi/image/format=json/<key>` metadata endpoint and persist.
    pub async fn get_original_dimensions(&self, key: &str) -> Result<(u32, u32)> {
        if let Some(cached) = self.read_cached_dims(key).await {
            return Ok(cached);
        }
        let dims = self.fetch_dimensions_remote(key).await?;
        // Best-effort persist. A disk error here shouldn't bubble up to the user.
        let _ = self.persist_dims(key, dims).await;
        Ok(dims)
    }

    async fn read_cached_dims(&self, key: &str) -> Option<(u32, u32)> {
        let path = self.dims_cache_path_for(key);
        let content = tokio::fs::read_to_string(&path).await.ok()?;
        parse_dims_text(&content)
    }

    async fn persist_dims(&self, key: &str, (w, h): (u32, u32)) -> Result<()> {
        let path = self.dims_cache_path_for(key);
        let content = format!("{w}x{h}\n");
        persist(&path, content.as_bytes()).await
    }

    async fn fetch_dimensions_remote(&self, key: &str) -> Result<(u32, u32)> {
        let url = format!(
            "{}/cdn-cgi/image/format=json/{}",
            self.public_base,
            encode_path(key),
        );
        let body = self
            .http
            .get(&url)
            .send()
            .await
            .wrap_err_with(|| format!("requesting metadata {url}"))?
            .error_for_status()
            .wrap_err_with(|| format!("metadata returned non-success for {url}"))?
            .text()
            .await
            .wrap_err_with(|| format!("reading metadata body for {url}"))?;
        let width = parse_int_field(&body, "width")
            .ok_or_else(|| eyre!("metadata missing width: {body}"))?;
        let height = parse_int_field(&body, "height")
            .ok_or_else(|| eyre!("metadata missing height: {body}"))?;
        Ok((width, height))
    }

    async fn fetch_preview_bytes(&self, key: &str) -> Result<Vec<u8>> {
        let url = format!(
            "{}/cdn-cgi/image/width={PREVIEW_WIDTH},quality={PREVIEW_QUALITY}/{}",
            self.public_base,
            encode_path(key),
        );
        let bytes = self
            .http
            .get(&url)
            .send()
            .await
            .wrap_err_with(|| format!("requesting preview {url}"))?
            .error_for_status()
            .wrap_err_with(|| format!("preview returned non-success for {url}"))?
            .bytes()
            .await
            .wrap_err_with(|| format!("reading preview body for {url}"))?;
        Ok(bytes.to_vec())
    }

    fn cache_path_for(&self, key: &str) -> PathBuf {
        join_sanitized(&self.cache_root, key)
    }

    fn dims_cache_path_for(&self, key: &str) -> PathBuf {
        join_sanitized(&self.dims_cache_root, key)
    }
}

/// Joins each `/`-separated segment of `key` onto `root`, skipping empty / `.` / `..`
/// to keep the cache tree confined to its root.
fn join_sanitized(root: &Path, key: &str) -> PathBuf {
    let mut p = root.to_path_buf();
    for segment in key.split('/') {
        if segment.is_empty() || segment == "." || segment == ".." {
            continue;
        }
        p.push(segment);
    }
    p
}

fn resolve_cache_root() -> PathBuf {
    if let Ok(xdg) = std::env::var("XDG_CACHE_HOME") {
        if !xdg.is_empty() {
            return PathBuf::from(xdg).join("r2-image-picker");
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home).join(".cache").join("r2-image-picker");
    }
    PathBuf::from(".r2-image-picker-cache")
}

async fn persist(path: &Path, bytes: &[u8]) -> Result<()> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    // Write to a sibling temp file then rename, so a partial write can never be observed as a hit.
    let tmp = path.with_extension("tmp");
    tokio::fs::write(&tmp, bytes).await?;
    tokio::fs::rename(&tmp, path).await?;
    Ok(())
}

/// Percent-encodes each path segment, preserving the `/` separators that R2 keys use.
fn encode_path(key: &str) -> String {
    key.split('/')
        .map(|segment| {
            let mut out = String::with_capacity(segment.len());
            for byte in segment.bytes() {
                match byte {
                    b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9'
                    | b'-' | b'_' | b'.' | b'~' => out.push(byte as char),
                    _ => out.push_str(&format!("%{byte:02X}")),
                }
            }
            out
        })
        .collect::<Vec<_>>()
        .join("/")
}

/// Lightweight extractor for an integer field in a flat JSON object.
///
/// Returns the **first** textual occurrence of `"<field>": <ascii-digits>`. The
/// implementation is a substring scan, not a real parser, and assumes:
/// - The target field appears at the top level (no logic to skip nested objects
///   or arrays — if a nested `"<field>"` appears earlier in the string, this
///   returns that value).
/// - The value is a non-negative integer with no signs, decimals, or exponents.
/// - Whitespace between the key and `:` and between `:` and the digits is allowed.
///
/// Used to pull `width` / `height` out of Cloudflare's `format=json` response
/// without taking on `serde_json`. Do **not** reuse for endpoints whose JSON
/// nests or repeats the target field — bring in a real parser there.
fn parse_int_field(json: &str, field: &str) -> Option<u32> {
    let needle = format!("\"{field}\"");
    let pos = json.find(&needle)?;
    let after = json[pos + needle.len()..].trim_start();
    let after = after.strip_prefix(':')?.trim_start();
    let end = after.find(|c: char| !c.is_ascii_digit()).unwrap_or(after.len());
    after[..end].parse().ok()
}

/// Parses the on-disk dims sidecar contents (`"WIDTHxHEIGHT\n"`).
fn parse_dims_text(s: &str) -> Option<(u32, u32)> {
    let line = s.trim();
    let (w, h) = line.split_once('x')?;
    Some((w.parse().ok()?, h.parse().ok()?))
}

fn is_image_key(key: &str) -> bool {
    key.rsplit_once('.').is_some_and(|(_, ext)| {
        IMAGE_EXTENSIONS.iter().any(|e| ext.eq_ignore_ascii_case(e))
    })
}

// Nuxt Content v3 の body（minimark 形式）を平文化する
// minimark: 要素は [tag, props, ...children]、テキストは string
type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]];

// テキストとして扱わない要素
const IGNORED_TAGS = new Set(['style', 'script', 'template']);

// 前後で改行しない要素（それ以外はブロックとして扱う）
const INLINE_TAGS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'del', 'dfn', 'em', 'i', 'ins',
  'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var',
]);

const textOf = (node: MinimarkNode): string => {
  if (typeof node === 'string') return node;
  const [tag, , ...children] = node;
  if (IGNORED_TAGS.has(tag)) return '';
  return children.map(textOf).join('');
};

export const minimarkToPlainText = (body: unknown): string => {
  const value = (body as { value?: MinimarkNode[] } | undefined)?.value;
  if (!Array.isArray(value)) return '';

  const blocks: string[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer.trim()) blocks.push(buffer.trim());
    buffer = '';
  };

  const walk = (nodes: MinimarkNode[]) => {
    for (const node of nodes) {
      if (typeof node === 'string') {
        buffer += node;
        continue;
      }
      const [tag, , ...children] = node;
      if (IGNORED_TAGS.has(tag)) continue;
      if (INLINE_TAGS.has(tag)) {
        buffer += textOf(node);
      }
      else if (tag === 'pre') {
        // コードブロックは改行・インデントを保持する
        flush();
        const code = textOf(node).replace(/^\n+|\s+$/g, '');
        if (code) blocks.push(code);
      }
      else {
        flush();
        walk(children);
        flush();
      }
    }
  };

  walk(value);
  flush();
  return blocks.join('\n').trim();
};

<script setup lang="ts">
type SNSLink = {
    name: string
    text: string
    url: string 
}

// const query: QueryBuilderParams = { path: '/blog', sort: [{ createdAt: -1 }] }
const { path } = useRoute(); 
const { data: articles } = await useAsyncData(path, () => queryCollection('blog').select('title', 'path', 'description', 'created_at').order('created_at', 'DESC').all());

const snsLinks: SNSLink[] = [
    { name: 'X', text: '@373_3', url: 'https://x.com/373_3' },
    { name: 'Bluesky', text: '@ryuhei373.dev', url: 'https://bsky.app/profile/ryuhei373.dev' },
    { name: 'Github', text: '@ryuhei373', url: 'https://github.com/ryuhei373' },
]
</script>

<template>
    <div class="mt-8">
        <ul v-for="snslink in snsLinks" :key="snslink.name" class="list-none">
            <li>
                <a :href="snslink.url" target="_blank"
                    class="text-orange hover:text-orange-light dark:text-orange-light dark:hover:text-orange hover:underline">
                    {{ snslink.text }}
                </a> ({{ snslink.name }})
            </li>
        </ul>
    </div>
    <div class="mt-8">
        <div class="-my-8 divide-y divide-base-100 dark:divide-base-700">
            <div v-for="article in articles" :key="article.path" class="py-8 flex flex-wrap md:flex-nowrap">
                <NuxtLink :to="article.path" class="w-full">
                    <h2 class="text-xl font-bold">
                        {{ article.title }}
                    </h2>
                    <PostedDate :created-at="article.created_at" />
                    <p class="pt-4 text-sm leading-loose text-base-600 dark:text-base-500">
                        {{ article.description }}
                    </p>
                    <div
                        class="text-orange hover:text-orange-light dark:text-orange-light dark:hover:text-orange flex items-center justify-end mt-4 gap-2">
                        <span>Read More</span>
                        <svg class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                        </svg>
                    </div>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

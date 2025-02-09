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
        <ul v-for="snsLink in snsLinks" :key="snsLink.name" class="list-none">
            <li>
                <NuxtLink :to="snsLink.url" target="_blank">
                    {{ snsLink.text }}
                </NuxtLink> ({{ snsLink.name }})
            </li>
        </ul>
    </div>
    <div class="mt-8">
        <div class="-my-8 divide-y divide-base-100 dark:divide-base-700">
            <div v-for="article in articles" :key="article.path" class="py-8 flex flex-wrap md:flex-nowrap">
                <NuxtLink :to="article.path" class="w-full">
                    <h2 class="text-light-tx dark:text-dark-tx text-xl font-bold">
                        {{ article.title }}
                    </h2>
                    <PostedDate :created-at="article.created_at" />
                    <p class="pt-4 text-sm leading-loose text-light-tx-2 dark:text-dark-tx-2 ">
                        {{ article.description }}
                    </p>
                    <div
                        class="flex items-center justify-end mt-4 gap-1">
                        <span>Read More</span>
                        <UIcon name="ph:arrow-right-bold" />
                    </div>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

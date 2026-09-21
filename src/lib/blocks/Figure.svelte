<script lang="ts">
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';

	interface Props {
		path?: string;
		alt?: string;
		caption?: string;
	}

	let { path = '', alt = '', caption = '' }: Props = $props();
</script>

<figure>
	{#if path}
		<ResponsiveImage {path} {alt} sizes="(min-width: 48rem) 42rem, 100vw" />
	{/if}
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	figure {
		max-width: 42rem;
		margin-inline: auto;
	}

	figcaption {
		font-size: 0.875rem;
		margin-block-start: 0.5rem;
	}
</style>

<script lang="ts">
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';

	interface Props {
		path?: string;
		alt?: string;
		caption?: string;
	}

	let { path = '', alt = '', caption = '' }: Props = $props();
</script>

<figure class="row">
	<ResponsiveImage {path} {alt} sizes="(min-width: 75rem) 1128px, 100vw" />
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	figcaption {
		font-size: 0.75rem;
		margin-block-start: 0.5rem;
	}
</style>

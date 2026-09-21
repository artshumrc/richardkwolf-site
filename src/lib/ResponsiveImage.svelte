<script lang="ts">
	import { responsiveImage } from '$lib/images.js';

	interface Props {
		path: string;
		alt: string;
		sizes?: string;
		loading?: 'lazy' | 'eager';
	}

	let { path, alt, sizes = '100vw', loading = 'lazy' }: Props = $props();

	const sources = $derived(responsiveImage(path));
</script>

<picture>
	{#if sources.webp}<source type="image/webp" srcset={sources.webp} {sizes} />{/if}
	{#if sources.jpeg}<source type="image/jpeg" srcset={sources.jpeg} {sizes} />{/if}
	<img src={sources.src} {alt} {loading} decoding="async" />
</picture>

<style>
	img {
		display: block;
		width: 100%;
		height: auto;
	}
</style>

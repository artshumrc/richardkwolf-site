<script lang="ts">
	// One gallery image. A committed path renders its responsive renditions; a
	// file chosen moments ago renders from its object URL, because the commit is
	// not serving until the next deploy.
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';

	interface Props {
		path: string;
		alt: string;
		sizes?: string;
		loading?: 'lazy' | 'eager';
		previewUrl?: string;
	}

	let { path, alt, sizes = '100vw', loading = 'lazy', previewUrl }: Props = $props();
</script>

{#if previewUrl}
	<img src={previewUrl} {alt} {loading} decoding="async" />
{:else if path}
	<ResponsiveImage {path} {alt} {sizes} {loading} />
{/if}

<style>
	img {
		display: block;
		width: 100%;
		height: auto;
	}
</style>

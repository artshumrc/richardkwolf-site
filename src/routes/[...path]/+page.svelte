<script lang="ts">
	import { base } from '$app/paths';
	import { Renderer } from 'uncial/render';
	import { blocks, schema } from '$lib/blocks.js';
	import { canonicalUrl } from '$lib/site-origin.js';

	let { data } = $props();

	const canonical = $derived(canonicalUrl(data.path, base));
</script>

<svelte:head>
	<title>{String(data.meta.title ?? 'Untitled page')}</title>
	{#if data.meta.description}
		<meta name="description" content={String(data.meta.description)} />
	{/if}
	<link rel="canonical" href={canonical} />
</svelte:head>

<main>
	<h1>{String(data.meta.title ?? 'Untitled page')}</h1>
	<Renderer content={data.document} {blocks} {schema} />
</main>

<script lang="ts">
	import { base } from '$app/paths';
	import { Renderer } from 'uncial/render';
	import { blocks, schema } from '$lib/blocks.js';
	import { canonicalUrl } from '$lib/site-origin.js';
	import { withBasePaths } from '$lib/rich-links.js';

	let { data } = $props();

	const title = $derived(String(data.meta.title ?? 'Untitled page'));
	const canonical = $derived(canonicalUrl(data.path, base));
	const leadsWithHero = $derived(data.document?.content?.[0]?.type === 'hero');
	const document = $derived(withBasePaths(data.document, base));
</script>

<svelte:head>
	<title>{title}</title>
	{#if data.meta.description}
		<meta name="description" content={String(data.meta.description)} />
	{/if}
	<link rel="canonical" href={canonical} />
</svelte:head>

<main data-pagefind-body>
	<h1 class:visually-hidden={leadsWithHero}>{title}</h1>
	<Renderer content={document} {blocks} {schema} />
</main>

<style>
	h1 {
		max-width: var(--limit);
		margin-inline: auto;
		padding: var(--block-gap) var(--page-gutter) 0;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>

<script lang="ts">
	import { base } from '$app/paths';
	import { Renderer } from 'uncial/render';
	import { blocks, schema } from '$lib/blocks.js';
	import { canonicalUrl } from '$lib/site-origin.js';

	let { data } = $props();

	const title = $derived(String(data.meta.title ?? 'Untitled page'));
	const canonical = $derived(canonicalUrl(data.path, base));
	// A page that opens on a Hero states its title in the Hero's headline. The
	// <h1> stays in the document for readers of the outline and is hidden
	// visually, rather than omitted.
	const leadsWithHero = $derived(data.document?.content?.[0]?.type === 'hero');
</script>

<svelte:head>
	<title>{title}</title>
	{#if data.meta.description}
		<meta name="description" content={String(data.meta.description)} />
	{/if}
	<link rel="canonical" href={canonical} />
</svelte:head>

<main>
	<h1 class:visually-hidden={leadsWithHero}>{title}</h1>
	<Renderer content={data.document} {blocks} {schema} />
</main>

<style>
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

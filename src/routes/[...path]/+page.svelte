<script lang="ts">
	import { Renderer } from 'uncial/render';
	import { blocks, schema } from '$lib/blocks.js';

	let { data } = $props();
</script>

<svelte:head>
	<title>{String(data.meta.title ?? 'Untitled page')}</title>
	{#if data.meta.description}
		<meta name="description" content={String(data.meta.description)} />
	{/if}
</svelte:head>

<main>
	<h1>{String(data.meta.title ?? 'Untitled page')}</h1>
	<Renderer content={data.document} {blocks} {schema} />
</main>

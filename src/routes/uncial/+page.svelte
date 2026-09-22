<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { mountIndexPage } from 'uncial-cms';
	import { blocks, schema } from '$lib/blocks.js';
	import { brokerSessionProvider } from '$lib/github-broker-session.js';

	let { data } = $props();
	let target: HTMLElement;

	onMount(() => {
		// The Index page seeds a new page's document itself, and `mountIndexPage`
		// takes a schema rather than resolving a path-keyed factory: a new page is
		// never the Site document, so the page schema is the right one.
		const handle = mountIndexPage(target, {
			config: data.config,
			blocks,
			schema,
			basePath: base,
			// The local Forge in development signs nobody in.
			sessionProvider: data.config.forge === 'github' ? brokerSessionProvider : undefined
		});
		return () => handle.destroy();
	});
</script>

<svelte:head>
	<title>Site index</title>
	<meta name="description" content="Index of every editable page on this site." />
</svelte:head>

<main>
	<h1>Site index</h1>
	<div bind:this={target}></div>
</main>

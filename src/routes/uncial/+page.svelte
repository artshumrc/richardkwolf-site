<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { mountIndexPage } from 'uncial-cms';
	import { blocks, schema } from '$lib/blocks.js';

	let { data } = $props();
	let target: HTMLElement;

	onMount(() => {
		const handle = mountIndexPage(target, {
			config: data.config,
			blocks,
			schema,
			basePath: base
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

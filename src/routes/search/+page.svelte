<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import PagefindAssets from '$lib/PagefindAssets.svelte';
	import { canonicalUrl } from '$lib/site-origin.js';

	let scripted = $state(false);
	onMount(() => (scripted = true));
</script>

<svelte:head>
	<title>Search</title>
	<meta
		name="description"
		content="Search the prose of Richard K. Wolf's research pages, portfolios and publications."
	/>
	<link rel="canonical" href={canonicalUrl('search', base)} />
</svelte:head>

<PagefindAssets />

<main class="row">
	<h1>Search</h1>
	<div class="search">
		<pagefind-config
			instance="site"
			base-url={`${base}/`}
			bundle-path={`${base}/pagefind/`}
		></pagefind-config>
		{#if scripted}
			<pagefind-input instance="site" placeholder="Search this site"></pagefind-input>
			<pagefind-summary instance="site"></pagefind-summary>
			<pagefind-results instance="site"></pagefind-results>
		{/if}
	</div>
	<noscript>
		<p>
			This site's search needs JavaScript, because the index is queried in your browser rather
			than on a server. With scripting off, the
			<a href="{base}/research/">research pages</a> and the
			<a href="{base}/">homepage</a> are the way in.
		</p>
	</noscript>
</main>

<style>
	main {
		padding-block: 3rem 5rem;
	}

	.search {
		max-width: 42rem;
		margin-top: 2rem;
		--pf-text: var(--ink);
		--pf-text-secondary: var(--ink);
		--pf-text-muted: var(--ink);
		--pf-background: var(--surface);
		--pf-border: var(--rule);
		--pf-border-focus: var(--accent);
		--pf-hover: var(--ground);
		--pf-outline-focus: var(--accent);
	}
</style>

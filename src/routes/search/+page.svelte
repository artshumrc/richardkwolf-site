<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import PagefindAssets from '$lib/PagefindAssets.svelte';
	import { canonicalUrl } from '$lib/site-origin.js';

	// Pagefind is client-side by definition, so the prerendered page carries the
	// <noscript> explanation and mounts the search box only once scripting has
	// proved itself. Emitting the widget statically would leave a reader without
	// JavaScript staring at an empty panel.
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
	<p>
		Search runs in your browser over the text of every page on this site. Diacritics are indexed
		as written, and a query typed without them matches too.
	</p>

	<div class="search">
		<!-- The config element renders nothing and carries the base-aware bundle
		     location, so it is prerendered; the widget itself is not. -->
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

	/* The page sits on the row like every other, but a field and a list of
	   results read badly at the row's full measure. */
	.search {
		max-width: 42rem;
		margin-top: 2rem;
		/* The component UI reads its palette from these, so search inherits the
		   site's scheme instead of shipping a second one. */
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

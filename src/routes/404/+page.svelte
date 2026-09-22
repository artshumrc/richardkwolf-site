<script lang="ts">
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Page not found</title>
	<meta name="description" content="The requested page is not on this site." />
</svelte:head>

<main>
	<h1>Page not found</h1>
	<p>
		That address is not part of this site. Some older addresses have moved; the
		<a href="{base}/research/">research pages</a> and the
		<a href="{base}/">homepage</a> are the places to start.
	</p>
</main>

<style>
	main {
		max-width: 40rem;
		margin: 0 auto;
		padding: 4rem 0;
	}
</style>

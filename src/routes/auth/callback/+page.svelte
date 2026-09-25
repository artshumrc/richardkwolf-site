<script lang="ts">
	import { onMount } from 'svelte';
	import { RELAY_SOURCE, type RelayMessage } from '$lib/github-broker-session.js';

	let orphaned = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const message: RelayMessage = {
			source: RELAY_SOURCE,
			code: params.get('code') ?? '',
			state: params.get('state') ?? '',
			error: params.get('error') ?? '',
			errorDescription: params.get('error_description') ?? ''
		};

		if (!window.opener) {
			orphaned = true;
			return;
		}

		window.opener.postMessage(message, window.location.origin);
		window.close();
	});
</script>

<svelte:head>
	<title>Signing in</title>
	<meta name="description" content="Finishes a sign-in to the page editor." />
	<meta name="robots" content="noindex" />
</svelte:head>

<main>
	{#if orphaned}
		<p>This page finishes a sign-in started in another window. There is nothing to do here.</p>
	{:else}
		<p>Signing in…</p>
	{/if}
</main>

<style>
	main {
		padding: 3rem var(--page-gutter);
		text-align: center;
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="prose-column">
	{#if children}{@render children()}{/if}
</div>

<style>
	.prose-column {
		max-width: 42rem;
		margin-inline: auto;
	}
</style>

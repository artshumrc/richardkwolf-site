<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		updateAttributes?: (attrs: Record<string, unknown>) => void;
	}

	let { children, updateAttributes }: Props = $props();

	const editable = $derived(typeof updateAttributes === 'function');
</script>

<div class="prose-column" data-editable={editable ? '' : undefined}>
	{#if children}{@render children()}{/if}
</div>

<style>
	.prose-column {
		max-width: 42rem;
		margin-inline: auto;
	}
</style>

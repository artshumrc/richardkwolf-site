<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		dropcap?: boolean;
		children?: Snippet;
	}

	let { dropcap = false, children }: Props = $props();
</script>

<div class="row prose-column" class:prose-column--dropcap={dropcap}>
	{#if children}{@render children()}{/if}
</div>

<style>
	.prose-column :global(> *) {
		margin: 0;
	}

	.prose-column :global(> * + *) {
		margin-block-start: 1.125rem;
	}

	.prose-column :global(> * + :is(h3, h4)),
	.prose-column :global(> :is(h2, h3, h4) + *) {
		margin-block-start: var(--block-gap);
	}

	.prose-column :global(> * + h2) {
		margin-block-start: 4.5rem;
	}

	.prose-column--dropcap :global(> p:first-of-type::first-letter) {
		float: left;
		margin-inline-end: 0.07em;
		color: var(--accent);
		font-family: var(--font-display);
		font-size: 6.6em;
		line-height: 0.67;
	}

	@supports (initial-letter: 3) or (-webkit-initial-letter: 3) {
		.prose-column--dropcap :global(> p:first-of-type::first-letter) {
			float: none;
			margin-inline-end: 0.45em;
			-webkit-initial-letter: 3;
			initial-letter: 3;
			font-size: inherit;
			line-height: inherit;
		}
	}
</style>

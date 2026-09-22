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
	/* The browser's own block margins would fight the rhythm set below. */
	.prose-column :global(> *) {
		margin: 0;
	}

	/* Paragraphs of one passage sit close; a heading opens a little space, and
	   a second-level heading opens a section. */
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

	/* The source theme sets an oxblood initial on the paragraph that opens a
	   page — the first paragraph of this Block, which a heading may precede.
	   Sized against the paragraph's own type, so it stays three lines deep at
	   every width. */
	.prose-column--dropcap :global(> p:first-of-type::first-letter) {
		float: left;
		margin-inline-end: 0.07em;
		color: var(--accent);
		font-family: var(--font-display);
		font-size: 6.6em;
		line-height: 0.67;
	}
</style>

<script lang="ts">
	import EditableImage from './EditableImage.svelte';
	import ExternalUrlField from './ExternalUrlField.svelte';
	import { resolveBlockLink } from '$lib/site-routes.js';

	interface Props {
		image?: string;
		alt?: string;
		title?: string;
		blurb?: string;
		link?: string;
		externalUrl?: string;
		updateAttributes?: (attrs: Record<string, unknown>) => void;
	}

	let {
		image = '',
		alt = '',
		title = '',
		blurb = '',
		link = '/',
		externalUrl = '',
		updateAttributes
	}: Props = $props();

	const href = $derived(resolveBlockLink(link, externalUrl));
</script>

<article class="card">
	<EditableImage
		src={image}
		{alt}
		label="card image"
		sizes="(min-width: 48rem) 22rem, 100vw"
		onUpload={updateAttributes ? (src) => updateAttributes({ image: src }) : undefined}
	/>
	<h3 class="card__title">
		{#if href}<a {href}>{title}</a>{:else}{title}{/if}
	</h3>
	{#if blurb}<p class="card__blurb">{blurb}</p>{/if}
	{#if updateAttributes && link === 'external'}
		<ExternalUrlField
			label="External URL"
			value={externalUrl}
			onChange={(url) => updateAttributes?.({ externalUrl: url })}
		/>
	{/if}
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Outweighs ResponsiveImage's own `img` rule, which has equal specificity. */
	.card :global(picture > img) {
		aspect-ratio: 1 / 1;
		object-fit: cover;
	}

	.card__title {
		margin: 0;
		font-size: 1.125rem;
	}

	.card__blurb {
		margin: 0;
		font-size: 0.9375rem;
	}
</style>

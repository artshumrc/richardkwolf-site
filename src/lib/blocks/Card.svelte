<script lang="ts">
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';
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
	<ResponsiveImage
		path={image}
		{alt}
		sizes="(min-width: 75rem) 360px, (min-width: 48rem) 33vw, 100vw"
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
		font-size: 0.875rem;
	}
</style>

<script lang="ts">
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';

	interface Props {
		image?: string;
		alt?: string;
		eyebrow?: string;
		headline?: string;
		lede?: string;
		height?: string;
	}

	let {
		image = '',
		alt = '',
		eyebrow = '',
		headline = '',
		lede = '',
		height = 'standard'
	}: Props = $props();
</script>

<section class="hero" class:hero--full={height === 'full'}>
	<div class="hero__image scrim">
		<ResponsiveImage path={image} {alt} sizes="100vw" loading="eager" />
	</div>
	<div class="hero__content scrim-text" class:scrim-text--small={eyebrow || lede}>
		{#if eyebrow}<p class="hero__eyebrow">{eyebrow}</p>{/if}
		<h2 class="hero__headline">{headline}</h2>
		{#if lede}<p class="hero__lede">{lede}</p>{/if}
	</div>
</section>

<style>
	.hero {
		position: relative;
		display: grid;
		min-height: max(20rem, 45vh);
		background: #141618;
		color: #fff;
	}

	.hero--full {
		min-height: calc(100svh - var(--masthead-height));
	}

	.hero__image {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.hero__image :global(picture) {
		display: block;
		height: 100%;
	}

	.hero__image :global(picture > img) {
		height: 100%;
		object-fit: cover;
	}

	.hero__content {
		z-index: 1;
		align-self: center;
		justify-self: center;
		width: 100%;
		max-width: var(--limit);
		padding: 2rem var(--page-gutter);
		text-align: center;
	}

	.scrim-text--small {
		--scrim-edge: 0.6;
	}

	.hero__eyebrow {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.hero__headline {
		margin: 0;
		color: inherit;
		font-size: clamp(2.125rem, 5.5vw, 4.6875rem);
		font-style: italic;
		line-height: 1.2;
		white-space: pre-line;
	}

	.hero__lede {
		margin: 0.75rem 0 0;
		font-size: 1.125rem;
	}
</style>

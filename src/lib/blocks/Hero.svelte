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
	<div class="hero__image">
		<ResponsiveImage path={image} {alt} sizes="100vw" loading="eager" />
	</div>
	<div class="hero__content">
		{#if eyebrow}<p class="hero__eyebrow">{eyebrow}</p>{/if}
		<!-- The page's own <h1> is visually hidden when a Hero opens the
		document, so this heading states the title once. -->
		<h2 class="hero__headline">{headline}</h2>
		{#if lede}<p class="hero__lede">{lede}</p>{/if}
	</div>
</section>

<style>
	.hero {
		position: relative;
		display: grid;
		min-height: max(20rem, 45vh);
		/* Shows through until the photograph decodes, and behind its edges while
		   a portrait picture is being covered into a landscape band. */
		background: #141618;
		color: #fff;
	}

	/* The opening page of the site, where the source theme gives the banner the
	   whole window below the masthead. */
	.hero--full {
		/* `svh`, so a phone's retracting browser chrome cannot leave the banner
		   taller than the window it is meant to fill. */
		min-height: calc(100svh - var(--masthead-height));
	}

	/* Out of flow, so the photograph's own height never drives the band: the
	   band is sized by `min-height` and by the headline, and the picture is
	   covered into whatever that comes to. */
	.hero__image {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.hero__image :global(picture) {
		display: block;
		height: 100%;
	}

	/* Outweighs ResponsiveImage's own `img` rule, which has equal specificity. */
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
		/* An authored line break is a break; everything else still wraps to the
		   column, so a phone is not held to the desk's line lengths. */
		white-space: pre-line;
	}

	.hero__lede {
		margin: 0.75rem 0 0;
		font-size: 1.125rem;
	}
</style>

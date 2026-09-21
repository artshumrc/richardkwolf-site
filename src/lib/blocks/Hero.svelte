<script lang="ts">
	import EditableImage from './EditableImage.svelte';

	interface Props {
		image?: string;
		alt?: string;
		eyebrow?: string;
		headline?: string;
		lede?: string;
		updateAttributes?: (attrs: Record<string, unknown>) => void;
	}

	let {
		image = '',
		alt = '',
		eyebrow = '',
		headline = '',
		lede = '',
		updateAttributes
	}: Props = $props();
</script>

<section class="hero">
	<div class="hero__image">
		<EditableImage
			src={image}
			{alt}
			label="hero image"
			sizes="100vw"
			loading="eager"
			onUpload={updateAttributes ? (src) => updateAttributes({ image: src }) : undefined}
		/>
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
		background: #1c1c1c;
		color: #fff;
	}

	.hero__image {
		grid-area: 1 / 1;
	}

	/* The upload control shares the Hero's single grid cell with the headline,
	   so it has to sit above it to stay clickable. */
	.hero__image :global(.image-upload) {
		position: relative;
		z-index: 2;
	}

	/* Outweighs ResponsiveImage's own `img` rule, which has equal specificity. */
	.hero__image :global(picture > img) {
		aspect-ratio: 16 / 7;
		object-fit: cover;
		opacity: 0.55;
	}

	.hero__content {
		grid-area: 1 / 1;
		z-index: 1;
		align-self: center;
		justify-self: center;
		max-width: 48rem;
		padding: 2rem 1.5rem;
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
		font-size: clamp(1.75rem, 5vw, 3rem);
		line-height: 1.1;
	}

	.hero__lede {
		margin: 0.75rem 0 0;
		font-size: 1.125rem;
	}
</style>

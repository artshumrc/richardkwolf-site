<script lang="ts">
	import EditableImage from './EditableImage.svelte';

	interface Props {
		image?: string;
		alt?: string;
		headline?: string;
		updateAttributes?: (attrs: Record<string, unknown>) => void;
	}

	let { image = '', alt = '', headline = '', updateAttributes }: Props = $props();
</script>

<section class="band">
	<div class="band__image">
		<EditableImage
			src={image}
			{alt}
			label="band image"
			sizes="100vw"
			onUpload={updateAttributes ? (src) => updateAttributes({ image: src }) : undefined}
		/>
	</div>
	<h2 class="band__headline">{headline}</h2>
</section>

<style>
	.band {
		position: relative;
		display: grid;
		min-height: 22.5rem;
		margin-block-start: 4.5rem;
		background: #141618;
		color: #fff;
	}

	/* Out of flow, for the reason the Hero's picture is. */
	.band__image {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.band__image :global(picture) {
		display: block;
		height: 100%;
	}

	/* Outweighs ResponsiveImage's own `img` rule, which has equal specificity. */
	.band__image :global(picture > img) {
		height: 100%;
		object-fit: cover;
	}

	.band__image :global(.image-upload) {
		position: relative;
		z-index: 2;
	}

	/* A light wash, enough to hold white type over a bright map without
	   dimming the picture the way the Hero's dark ground would. */
	.band__image::after {
		content: '';
		position: absolute;
		inset: 0;
		background: #303133;
		opacity: 0.18;
	}

	.band__headline {
		z-index: 1;
		align-self: center;
		justify-self: center;
		width: 100%;
		max-width: var(--limit);
		margin: 0;
		padding: 2rem var(--page-gutter);
		color: inherit;
		font-size: clamp(2.125rem, 5.5vw, 4.6875rem);
		font-style: italic;
		line-height: 1.2;
		text-align: center;
	}
</style>

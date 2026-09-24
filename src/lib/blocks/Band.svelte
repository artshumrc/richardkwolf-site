<script lang="ts">
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';

	interface Props {
		image?: string;
		alt?: string;
		headline?: string;
	}

	let { image = '', alt = '', headline = '' }: Props = $props();
</script>

<section class="band">
	<div class="band__image">
		<ResponsiveImage path={image} {alt} sizes="100vw" />
	</div>
	<h2 class="band__headline scrim">{headline}</h2>
</section>

<style>
	.band {
		position: relative;
		display: grid;
		min-height: 22.5rem;
		margin-block-start: 4.5rem;
		overflow: clip;
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

	.band__headline {
		z-index: 1;
		align-self: center;
		justify-self: center;
		width: fit-content;
		max-width: min(100%, var(--limit));
		margin: 0;
		padding: 2rem var(--page-gutter);
		color: inherit;
		font-size: clamp(2.125rem, 5.5vw, 4.6875rem);
		font-style: italic;
		line-height: 1.2;
		text-align: center;
	}
</style>

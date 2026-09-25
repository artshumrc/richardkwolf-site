<script lang="ts">
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';
	import { vimeoPlayerUrl } from '$lib/vimeo.js';

	interface Props {
		vimeoId: string;
		poster?: string;
		title: string;
		alt: string;
		sizes?: string;
	}

	let { vimeoId, poster = '', title, alt, sizes = '100vw' }: Props = $props();

	let playing = $state(false);
</script>

<div class="vimeo">
	{#if playing}
		<iframe
			src={vimeoPlayerUrl(vimeoId)}
			title={title || `Vimeo video ${vimeoId}`}
			allow="autoplay; fullscreen; picture-in-picture"
			allowfullscreen
		></iframe>
	{:else}
		<button
			type="button"
			class="vimeo__poster"
			onclick={() => (playing = true)}
			aria-label={title ? `Play “${title}”` : 'Play video'}
		>
			<ResponsiveImage path={poster} {alt} {sizes} />
			<span class="vimeo__play" aria-hidden="true">▶</span>
		</button>
	{/if}
</div>

<style>
	.vimeo {
		position: relative;
		aspect-ratio: 16 / 9;
		background: #1c1c1c;
	}

	iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.vimeo__poster {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}

	.vimeo__poster :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.vimeo__play {
		position: absolute;
		inset: 50% auto auto 50%;
		translate: -50% -50%;
		display: grid;
		place-items: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.65);
		color: #fff;
		font-size: 1.25rem;
		padding-left: 0.2em;
	}

	.vimeo__poster:hover .vimeo__play,
	.vimeo__poster:focus-visible .vimeo__play {
		background: rgb(0 0 0 / 0.85);
	}
</style>

<script lang="ts">
	// Click-to-load Vimeo. The poster is self-hosted and the iframe does not
	// exist until a reader asks for it, so loading a page of ninety thumbnails
	// costs no request to player.vimeo.com.
	import GalleryPicture from './GalleryPicture.svelte';
	import { vimeoPlayerUrl } from '$lib/vimeo.js';

	interface Props {
		vimeoId: string;
		poster?: string;
		title: string;
		alt: string;
		sizes?: string;
		previewUrl?: string;
	}

	let { vimeoId, poster = '', title, alt, sizes = '100vw', previewUrl }: Props = $props();

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
			<GalleryPicture path={poster} {alt} {sizes} {previewUrl} />
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

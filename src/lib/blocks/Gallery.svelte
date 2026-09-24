<script lang="ts">
	// The Gallery: photographs and Vimeo videos in one responsive grid. Items
	// are edited in the attributes panel; the canvas adds only Add video, which
	// fetches the poster from Vimeo. `uncial-cms` is imported inside the handler
	// so the CMS runtime stays out of every reader page's import graph.
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';
	import Lightbox from './Lightbox.svelte';
	import VimeoPlayer from './VimeoPlayer.svelte';
	import { EMPTY_ITEM, itemAlt, type GalleryItem } from '$lib/gallery.js';
	import { siteConfig } from '$lib/site.js';
	import { fetchVimeoPoster, parseVimeoId } from '$lib/vimeo.js';

	interface Props {
		commentary?: string;
		items?: GalleryItem[];
		updateAttributes?: (attrs: Record<string, unknown>) => void;
	}

	let { commentary = '', items = [], updateAttributes }: Props = $props();

	const SIZES = '(min-width: 64rem) 360px, (min-width: 40rem) 45vw, 100vw';

	let lightbox = $state<ReturnType<typeof Lightbox> | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let vimeoInput = $state('');

	async function onAddVideo(): Promise<void> {
		error = null;
		busy = true;
		try {
			const vimeoId = parseVimeoId(vimeoInput);
			if (!vimeoId) throw new Error('That is not a Vimeo id or URL.');
			const { title, file } = await fetchVimeoPoster(vimeoId);
			const { cmsImageSource } = await import('uncial-cms');
			// Only the media dir is read off the config, and it is the same in
			// development; the commit goes through the active editor session.
			const poster = await cmsImageSource(siteConfig).upload!(file);
			updateAttributes?.({
				items: [...items, { ...EMPTY_ITEM, kind: 'vimeo', vimeoId, poster, title }]
			});
			vimeoInput = '';
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'The video could not be added.';
		} finally {
			busy = false;
		}
	}
</script>

<section class="row gallery">
	{#if commentary}<p class="gallery__commentary">{commentary}</p>{/if}

	<ul class="gallery__grid">
		{#each items as item, index (index)}
			<li class="gallery__item">
				<figure>
					{#if item.kind === 'vimeo'}
						<VimeoPlayer
							vimeoId={item.vimeoId}
							poster={item.poster}
							title={item.title}
							alt={itemAlt(item)}
							sizes={SIZES}
						/>
					{:else}
						<button
							type="button"
							class="gallery__thumb"
							onclick={() => lightbox?.open(index)}
							aria-label={item.title ? `View “${item.title}”` : 'View photograph'}
						>
							<ResponsiveImage path={item.path} alt={itemAlt(item)} sizes={SIZES} />
						</button>
					{/if}
					{#if item.title || item.caption}
						<figcaption>
							{#if item.title}<strong>{item.title}</strong>{/if}
							{#if item.caption}<span>{item.caption}</span>{/if}
						</figcaption>
					{/if}
				</figure>

			</li>
		{/each}
	</ul>

	{#if updateAttributes}
		<div class="gallery__tools">
			<label>
				<span>Add a Vimeo video</span>
				<input
					type="text"
					placeholder="110718583"
					bind:value={vimeoInput}
					disabled={busy}
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							onAddVideo();
						}
					}}
				/>
			</label>
			<button type="button" disabled={busy || !vimeoInput.trim()} onclick={onAddVideo}>
				Add video
			</button>
			{#if busy}<span role="status">Working…</span>{/if}
			{#if error}<span role="alert">{error}</span>{/if}
		</div>
	{/if}
</section>

<Lightbox bind:this={lightbox} {items} />

<style>
	.gallery__commentary {
		margin: 0 0 1.5rem;
	}

	/* A grid, not a carousel: the whole gallery is visible at once and
	   collapses to one column on a phone. `auto-fit` rather than `auto-fill`,
	   so a gallery holding one video fills the row instead of sitting in the
	   first of six empty tracks. */
	.gallery__grid {
		display: grid;
		gap: 1.25rem;
		grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
		margin: 0;
		padding: 0;
		list-style: none;
	}

	figure {
		margin: 0;
	}

	.gallery__thumb {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}

	/* `sizes` alone would size a video poster, which carries no CSS width of
	   its own, to the hint rather than to its grid track. */
	.gallery__grid :global(picture),
	.gallery__grid :global(img) {
		width: 100%;
	}

	.gallery__thumb :global(img) {
		aspect-ratio: 4 / 3;
		object-fit: cover;
	}

	figcaption {
		margin-block-start: 0.5rem;
		font-size: 0.75rem;
	}

	figcaption strong {
		display: block;
		font-weight: 600;
	}

	.gallery__tools {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		margin-block-start: 1.25rem;
		font-size: 0.875rem;
	}

	/* The editor is used on a phone as much as at a desk; the controls are sized
	   for a thumb rather than a cursor. */
	.gallery__tools input,
	.gallery__tools button {
		min-height: 2.75rem;
	}

	.gallery__tools button {
		padding-inline: 0.75rem;
	}

	[role='alert'] {
		color: #a11;
	}
</style>

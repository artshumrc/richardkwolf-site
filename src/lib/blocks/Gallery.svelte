<script lang="ts">
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

	const SIZES = '(min-width: 64rem) 280px, (min-width: 40rem) 45vw, 100vw';

	const inline = $derived(items.length === 1 && items[0].kind === 'vimeo' ? items[0] : null);

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

	{#if inline}
		<figure>
			<VimeoPlayer
				vimeoId={inline.vimeoId}
				poster={inline.poster}
				title={inline.title}
				alt={itemAlt(inline)}
				sizes="(min-width: 75rem) 1128px, 100vw"
			/>
			{#if inline.title || inline.caption}<figcaption>{@render caption(inline)}</figcaption>{/if}
		</figure>
	{:else}
		<ul class="gallery__grid">
			{#each items as item, index (index)}
				<li>
					<figure>
						<button
							type="button"
							class="gallery__thumb"
							onclick={() => lightbox?.open(index)}
							aria-label={item.kind === 'vimeo'
								? item.title
									? `Play “${item.title}”`
									: 'Play video'
								: item.title
									? `View “${item.title}”`
									: 'View photograph'}
						>
							<ResponsiveImage
								path={item.kind === 'vimeo' ? item.poster : item.path}
								alt={itemAlt(item)}
								sizes={SIZES}
							/>
							{#if item.kind === 'vimeo'}<span class="gallery__play" aria-hidden="true">▶</span>{/if}
						</button>
						{#if item.title || item.caption}<figcaption>{@render caption(item)}</figcaption>{/if}
					</figure>
				</li>
			{/each}
		</ul>
	{/if}

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

{#snippet caption(item: GalleryItem)}
	{#if item.title}<strong>{item.title}</strong>{:else}{item.caption}{/if}
{/snippet}

{#if !inline}<Lightbox bind:this={lightbox} {items} />{/if}

<style>
	.gallery__commentary {
		margin: 0 0 1.5rem;
	}

	.gallery__grid {
		display: grid;
		gap: 1.25rem;
		grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr));
		margin: 0;
		padding: 0;
		list-style: none;
	}

	figure {
		margin: 0;
	}

	.gallery__thumb {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 4 / 3;
		padding: 0;
		border: 0;
		background: #1c1c1c;
		cursor: pointer;
		overflow: hidden;
	}

	.gallery__thumb :global(picture),
	.gallery__thumb :global(img) {
		width: 100%;
		height: 100%;
	}

	.gallery__thumb :global(img) {
		object-fit: cover;
		transition: scale 0.3s ease;
	}

	.gallery__thumb:hover :global(img),
	.gallery__thumb:focus-visible :global(img) {
		scale: 1.04;
	}

	.gallery__play {
		position: absolute;
		inset: 50% auto auto 50%;
		translate: -50% -50%;
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.65);
		color: #fff;
		padding-left: 0.2em;
	}

	.gallery__thumb:hover .gallery__play,
	.gallery__thumb:focus-visible .gallery__play {
		background: rgb(0 0 0 / 0.85);
	}

	figcaption {
		display: -webkit-box;
		margin-block-start: 0.5rem;
		overflow: hidden;
		font-size: 0.75rem;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	figcaption strong {
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

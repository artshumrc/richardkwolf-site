<script lang="ts">
	// The Gallery: photographs and Vimeo videos in one responsive grid.
	//
	// `items` is a hidden attribute, so the whole array is edited here on the
	// canvas rather than in the attributes panel — gallery editing needs
	// thumbnails. The upload module is imported dynamically, which is what keeps
	// the CMS runtime out of every reader page's import graph.
	import { onDestroy, tick } from 'svelte';
	import GalleryPicture from './GalleryPicture.svelte';
	import Lightbox from './Lightbox.svelte';
	import VimeoPlayer from './VimeoPlayer.svelte';
	import { EMPTY_ITEM, itemAlt, type GalleryItem } from '$lib/gallery.js';
	import { fetchVimeoPoster, parseVimeoId } from '$lib/vimeo.js';

	interface Props {
		commentary?: string;
		items?: GalleryItem[];
		updateAttributes?: (attrs: Record<string, unknown>) => void;
	}

	let { commentary = '', items = [], updateAttributes }: Props = $props();

	const SIZES = '(min-width: 64rem) 360px, (min-width: 40rem) 45vw, 100vw';

	let lightbox = $state<ReturnType<typeof Lightbox> | null>(null);
	let grid = $state<HTMLElement | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let vimeoInput = $state('');
	/** Object URLs keyed by the served path their file was committed to. */
	let previews = $state<Record<string, string>>({});

	onDestroy(() => Object.values(previews).forEach((url) => URL.revokeObjectURL(url)));

	function patchItem(index: number, partial: Partial<GalleryItem>): void {
		updateAttributes?.({
			items: items.map((item, at) => (at === index ? { ...item, ...partial } : item))
		});
	}

	function removeItem(index: number): void {
		updateAttributes?.({ items: items.filter((_, at) => at !== index) });
	}

	/** Swap an item with its neighbour and follow it with the keyboard focus. */
	async function moveItem(index: number, by: number): Promise<void> {
		const target = index + by;
		if (target < 0 || target >= items.length) return;
		const next = [...items];
		[next[index], next[target]] = [next[target], next[index]];
		updateAttributes?.({ items: next });
		await tick();
		grid?.querySelectorAll<HTMLButtonElement>(`[data-move="${by}"]`)[target]?.focus();
	}

	async function onFiles(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		if (files.length === 0) return;
		error = null;
		busy = true;
		// Committed after every file, so a failure part-way through a batch
		// keeps the photographs that already uploaded.
		let next = [...items];

		try {
			const { uploadDownscaledImage } = await import('$lib/image-upload.js');
			for (const file of files) {
				const preview = URL.createObjectURL(file);
				try {
					const path = await uploadDownscaledImage(file);
					previews = { ...previews, [path]: preview };
					next = [...next, { ...EMPTY_ITEM, kind: 'image', path }];
					updateAttributes?.({ items: next });
				} catch (cause) {
					URL.revokeObjectURL(preview);
					throw cause;
				}
			}
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'The upload failed.';
		} finally {
			busy = false;
			input.value = '';
		}
	}

	async function onAddVideo(): Promise<void> {
		error = null;
		busy = true;
		try {
			const vimeoId = parseVimeoId(vimeoInput);
			if (!vimeoId) throw new Error('That is not a Vimeo id or URL.');
			const { title, file } = await fetchVimeoPoster(vimeoId);
			const preview = URL.createObjectURL(file);
			try {
				const { uploadDownscaledImage } = await import('$lib/image-upload.js');
				const poster = await uploadDownscaledImage(file);
				previews = { ...previews, [poster]: preview };
				updateAttributes?.({
					items: [...items, { ...EMPTY_ITEM, kind: 'vimeo', vimeoId, poster, title }]
				});
				vimeoInput = '';
			} catch (cause) {
				URL.revokeObjectURL(preview);
				throw cause;
			}
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'The video could not be added.';
		} finally {
			busy = false;
		}
	}
</script>

<section class="row gallery">
	{#if commentary}<p class="gallery__commentary">{commentary}</p>{/if}

	<ul class="gallery__grid" bind:this={grid}>
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
							previewUrl={previews[item.poster]}
						/>
					{:else}
						<button
							type="button"
							class="gallery__thumb"
							onclick={() => lightbox?.open(index)}
							aria-label={item.title ? `View “${item.title}”` : 'View photograph'}
						>
							<GalleryPicture
								path={item.path}
								alt={itemAlt(item)}
								sizes={SIZES}
								previewUrl={previews[item.path]}
							/>
						</button>
					{/if}
					{#if item.title || item.caption}
						<figcaption>
							{#if item.title}<strong>{item.title}</strong>{/if}
							{#if item.caption}<span>{item.caption}</span>{/if}
						</figcaption>
					{/if}
				</figure>

				{#if updateAttributes}
					<div class="gallery__editor">
						<label>
							Title
							<input
								type="text"
								value={item.title}
								oninput={(event) => patchItem(index, { title: event.currentTarget.value })}
							/>
						</label>
						<label>
							Caption
							<input
								type="text"
								value={item.caption}
								oninput={(event) => patchItem(index, { caption: event.currentTarget.value })}
							/>
						</label>
						<div class="gallery__item-controls">
							<button
								type="button"
								data-move="-1"
								disabled={index === 0}
								onclick={() => moveItem(index, -1)}
							>
								Move earlier
							</button>
							<button
								type="button"
								data-move="1"
								disabled={index === items.length - 1}
								onclick={() => moveItem(index, 1)}
							>
								Move later
							</button>
							<button type="button" onclick={() => removeItem(index)}>Remove</button>
						</div>
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	{#if updateAttributes}
		<div class="gallery__tools">
			<label>
				<span>Add photographs</span>
				<input type="file" accept="image/*" multiple disabled={busy} onchange={onFiles} />
			</label>
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

<Lightbox bind:this={lightbox} {items} {previews} />

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

	.gallery__editor {
		display: grid;
		gap: 0.25rem;
		margin-block-start: 0.5rem;
		font-size: 0.8125rem;
	}

	.gallery__editor input[type='text'] {
		width: 100%;
	}

	.gallery__item-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
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
	.gallery__editor input,
	.gallery__item-controls button,
	.gallery__tools input,
	.gallery__tools button {
		min-height: 2.75rem;
	}

	.gallery__item-controls button,
	.gallery__tools button {
		padding-inline: 0.75rem;
	}

	[role='alert'] {
		color: #a11;
	}
</style>

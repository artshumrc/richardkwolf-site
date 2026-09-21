<script lang="ts">
	// A small custom lightbox over a Gallery's items.
	//
	// `<dialog>.showModal()` supplies the focus trap and the Escape handling, so
	// neither is reimplemented here; what is added is arrow-key navigation and
	// returning focus to whatever opened it.
	import GalleryPicture from './GalleryPicture.svelte';
	import VimeoPlayer from './VimeoPlayer.svelte';
	import { itemAlt, type GalleryItem } from '$lib/gallery.js';

	interface Props {
		items: GalleryItem[];
		previews?: Record<string, string>;
	}

	let { items, previews = {} }: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let index = $state(0);
	// A closed dialog is display:none, but its images would still be fetched, so
	// nothing inside it is rendered until it opens.
	let isOpen = $state(false);
	let opener: HTMLElement | null = null;

	const item = $derived(items[index]);

	export function open(at: number): void {
		index = at;
		isOpen = true;
		opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialog?.showModal();
	}

	function step(by: number): void {
		if (items.length === 0) return;
		index = (index + by + items.length) % items.length;
	}

	function close(): void {
		isOpen = false;
		opener?.focus();
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowRight') step(1);
		else if (event.key === 'ArrowLeft') step(-1);
		else return;
		event.preventDefault();
	}
</script>

<dialog bind:this={dialog} onkeydown={onKeydown} onclose={close} aria-label="Gallery">
	{#if isOpen && item}
		<div class="lightbox">
			<div class="lightbox__media">
				{#if item.kind === 'vimeo'}
					{#key item.vimeoId}
						<VimeoPlayer
							vimeoId={item.vimeoId}
							poster={item.poster}
							title={item.title}
							alt={itemAlt(item)}
							sizes="90vw"
							previewUrl={previews[item.poster]}
						/>
					{/key}
				{:else}
					<GalleryPicture
						path={item.path}
						alt={itemAlt(item)}
						sizes="90vw"
						loading="eager"
						previewUrl={previews[item.path]}
					/>
				{/if}
			</div>
			<div class="lightbox__detail">
				{#if item.title}<h2>{item.title}</h2>{/if}
				{#if item.caption}<p>{item.caption}</p>{/if}
			</div>
			<div class="lightbox__controls">
				<button type="button" onclick={() => step(-1)} disabled={items.length < 2}>
					Previous
				</button>
				<span aria-live="polite">{index + 1} of {items.length}</span>
				<button type="button" onclick={() => step(1)} disabled={items.length < 2}>Next</button>
				<button type="button" class="lightbox__close" onclick={() => dialog?.close()}>
					Close
				</button>
			</div>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		width: min(64rem, 92vw);
		padding: 0;
		border: 0;
		background: #101010;
		color: #f4f4f4;
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.8);
	}

	.lightbox {
		display: grid;
		gap: 1rem;
		padding: 1rem;
	}

	.lightbox__media :global(img) {
		max-height: 70vh;
		width: auto;
		max-width: 100%;
		margin-inline: auto;
		object-fit: contain;
	}

	.lightbox__detail h2 {
		margin: 0;
		font-size: 1.125rem;
	}

	.lightbox__detail p {
		margin: 0.25rem 0 0;
		font-size: 0.9375rem;
	}

	.lightbox__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.lightbox__close {
		margin-inline-start: auto;
	}
</style>

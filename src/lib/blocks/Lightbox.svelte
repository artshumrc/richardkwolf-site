<script lang="ts">
	// A small custom lightbox over a Gallery's items.
	//
	// `<dialog>.showModal()` supplies the focus trap and the Escape handling, so
	// neither is reimplemented here; what is added is arrow-key navigation and
	// returning focus to whatever opened it.
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';
	import VimeoPlayer from './VimeoPlayer.svelte';
	import { itemAlt, type GalleryItem } from '$lib/gallery.js';

	interface Props {
		items: GalleryItem[];
	}

	let { items }: Props = $props();

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

<!-- The dialog itself is the backdrop's hit area — it has no padding, so a click
     that targets it rather than the panel inside came from outside the panel.
     This is the touch equivalent of Escape. -->
<dialog
	bind:this={dialog}
	onkeydown={onKeydown}
	onclose={close}
	onclick={(event) => {
		if (event.target === dialog) dialog?.close();
	}}
	aria-label="Gallery"
>
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
						/>
					{/key}
				{:else}
					<ResponsiveImage path={item.path} alt={itemAlt(item)} sizes="90vw" loading="eager" />
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
		max-width: none;
		max-height: 92dvh;
		padding: 0;
		border: 0;
		background: #101010;
		color: #f4f4f4;
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.8);
	}

	/* The media row is the only one that gives: on a short phone the caption and
	   the controls keep their height and the photograph shrinks to fit. */
	.lightbox {
		display: grid;
		max-height: 92dvh;
		gap: 1rem;
		grid-template-rows: minmax(0, 1fr) auto auto;
		padding: 1rem;
	}

	.lightbox__media {
		display: flex;
		min-height: 0;
		align-items: center;
		justify-content: center;
	}

	.lightbox__media :global(img) {
		max-height: 100%;
		width: auto;
		max-width: 100%;
		object-fit: contain;
	}

	.lightbox__detail {
		max-height: 30dvh;
		overflow-y: auto;
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

	.lightbox__controls button {
		min-height: 2.75rem;
		padding-inline: 1rem;
		border: 1px solid rgb(255 255 255 / 0.35);
		background: none;
		color: inherit;
		font-size: 0.9375rem;
		cursor: pointer;
	}

	.lightbox__controls button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.lightbox__close {
		margin-inline-start: auto;
	}
</style>

<script lang="ts">
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';
	import { itemAlt, type GalleryItem } from '$lib/gallery.js';
	import { vimeoPlayerUrl } from '$lib/vimeo.js';

	interface Props {
		items: GalleryItem[];
	}

	let { items }: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let index = $state(0);
	let isOpen = $state(false);
	let opener: HTMLElement | null = null;
	let touchStart: { x: number; y: number } | null = null;

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

	function onTouchEnd(event: TouchEvent): void {
		if (!touchStart) return;
		const touch = event.changedTouches[0];
		const dx = touch.clientX - touchStart.x;
		const dy = touch.clientY - touchStart.y;
		touchStart = null;
		if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowRight') step(1);
		else if (event.key === 'ArrowLeft') step(-1);
		else return;
		event.preventDefault();
	}
</script>

<dialog
	bind:this={dialog}
	onkeydown={onKeydown}
	onclose={close}
	ontouchstart={(event) => {
		const touch = event.touches[0];
		touchStart = { x: touch.clientX, y: touch.clientY };
	}}
	ontouchend={onTouchEnd}
	onclick={(event) => {
		if (event.target === dialog) dialog?.close();
	}}
	aria-label="Gallery"
>
	{#if isOpen && item}
		<div class="lightbox">
			<div class="lightbox__media">
				{#key index}
					{#if item.kind === 'vimeo'}
						<div class="lightbox__video">
							<iframe
								src={vimeoPlayerUrl(item.vimeoId, true)}
								title={item.title || `Vimeo video ${item.vimeoId}`}
								allow="autoplay; fullscreen; picture-in-picture"
								allowfullscreen
							></iframe>
						</div>
					{:else}
						<ResponsiveImage path={item.path} alt={itemAlt(item)} sizes="94vw" loading="eager" />
					{/if}
				{/key}
			</div>
			<button
				type="button"
				class="lightbox__step lightbox__prev"
				onclick={() => step(-1)}
				disabled={items.length < 2}
				aria-label="Previous"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 5 8 12 15 19" /></svg>
			</button>
			<button
				type="button"
				class="lightbox__step lightbox__next"
				onclick={() => step(1)}
				disabled={items.length < 2}
				aria-label="Next"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 5 16 12 9 19" /></svg>
			</button>
			{#if item.title || item.caption}
				<div class="lightbox__detail">
					{#if item.title}<h2>{item.title}</h2>{/if}
					{#if item.caption}<p>{item.caption}</p>{/if}
				</div>
			{/if}
			<span class="lightbox__count" aria-live="polite">{index + 1} of {items.length}</span>
			<button type="button" class="lightbox__close" onclick={() => dialog?.close()}>
				Close
			</button>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		width: min(72rem, 94%);
		max-width: none;
		height: 92dvh;
		max-height: none;
		padding: 0;
		border: 0;
		background: #101010;
		color: #f4f4f4;
	}

	dialog:focus {
		outline: none;
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.85);
	}

	.lightbox {
		display: grid;
		height: 100%;
		box-sizing: border-box;
		gap: 0.75rem 1rem;
		grid-template:
			'count . close' auto
			'prev media next' minmax(0, 1fr)
			'. detail .' auto
			/ auto minmax(0, 1fr) auto;
		align-items: center;
		padding: 1rem;
	}

	.lightbox__media {
		grid-area: media;
		align-self: stretch;
		display: grid;
		place-items: center;
		min-height: 0;
		container-type: size;
	}

	.lightbox__media :global(img) {
		width: auto;
		max-width: 100cqw;
		max-height: 100cqh;
		object-fit: contain;
	}

	.lightbox__video {
		width: min(100cqw, 100cqh * 16 / 9);
		aspect-ratio: 16 / 9;
		background: #000;
	}

	.lightbox__video iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}

	.lightbox__detail {
		grid-area: detail;
		max-height: 25dvh;
		overflow-y: auto;
	}

	.lightbox__detail h2 {
		margin: 0;
		color: inherit;
		font-size: 1.125rem;
	}

	.lightbox__detail p {
		margin: 0.25rem 0 0;
		font-size: 0.9375rem;
	}

	.lightbox__count {
		grid-area: count;
		font-size: 0.875rem;
		opacity: 0.8;
	}

	button {
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 1px solid rgb(255 255 255 / 0.35);
		background: none;
		color: inherit;
		font: inherit;
		font-size: 0.9375rem;
		cursor: pointer;
	}

	button:hover:not(:disabled),
	button:focus-visible {
		background: rgb(255 255 255 / 0.12);
	}

	button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.lightbox__step {
		width: 3rem;
		height: 3rem;
		display: grid;
		place-items: center;
		padding: 0;
		border-radius: 50%;
	}

	.lightbox__step svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.lightbox__prev {
		grid-area: prev;
	}

	.lightbox__next {
		grid-area: next;
	}

	.lightbox__close {
		grid-area: close;
		justify-self: end;
		padding-inline: 1rem;
	}

	@media (max-width: 40rem) {
		dialog {
			width: 100%;
			height: 100%;
			margin: 0;
		}

		.lightbox {
			grid-template:
				'media media media media' minmax(0, 1fr)
				'detail detail detail detail' auto
				'prev count next close' auto
				/ auto 1fr auto auto;
			padding: 0.75rem;
		}

		.lightbox__count {
			justify-self: center;
		}
	}
</style>

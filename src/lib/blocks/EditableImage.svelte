<script lang="ts">
	// The shared editable-image control. A committed path renders through the
	// Image manifest; a freshly chosen file renders from an object URL, because
	// the commit is not deployed and serving until the next build.
	import { onDestroy } from 'svelte';
	import ResponsiveImage from '$lib/ResponsiveImage.svelte';

	interface Props {
		src?: string;
		alt?: string;
		/** Names this image in the upload control, e.g. "hero image". */
		label: string;
		sizes?: string;
		loading?: 'lazy' | 'eager';
		/** Present only in an Editor variant; its absence hides the upload UI. */
		onUpload?: (src: string) => void;
	}

	let { src = '', alt = '', label, sizes = '100vw', loading = 'lazy', onUpload }: Props = $props();

	let previewUrl = $state<string | null>(null);
	let error = $state<string | null>(null);
	let busy = $state(false);

	function clearPreview(): void {
		if (!previewUrl) return;
		URL.revokeObjectURL(previewUrl);
		previewUrl = null;
	}

	onDestroy(clearPreview);

	async function onFile(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		error = null;
		clearPreview();
		previewUrl = URL.createObjectURL(file);
		busy = true;

		try {
			const { uploadDownscaledImage } = await import('$lib/image-upload.js');
			onUpload?.(await uploadDownscaledImage(file));
		} catch (cause) {
			clearPreview();
			error = cause instanceof Error ? cause.message : 'The upload failed.';
		} finally {
			busy = false;
			input.value = '';
		}
	}
</script>

{#if previewUrl}
	<img src={previewUrl} {alt} />
{:else if src}
	<ResponsiveImage path={src} {alt} {sizes} {loading} />
{/if}

{#if onUpload}
	<div class="image-upload">
		<label>
			<span>{src || previewUrl ? `Replace ${label}` : `Upload ${label}`}</span>
			<input type="file" accept="image/*" disabled={busy} onchange={onFile} />
		</label>
		{#if busy}<span role="status">Preparing image…</span>{/if}
		{#if error}<span role="alert">{error}</span>{/if}
	</div>
{/if}

<style>
	img {
		display: block;
		width: 100%;
		height: auto;
	}

	.image-upload {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		padding: 0.5rem;
		font-size: 0.875rem;
		background: rgb(0 0 0 / 0.6);
		color: white;
	}

	[role='alert'] {
		color: #ffd2d2;
	}
</style>

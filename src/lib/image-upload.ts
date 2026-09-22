// Browser-side image reduction for author uploads.
//
// A camera original is far over the Forge's per-file limit, so the browser caps
// the longest edge, transcodes to WebP whatever came in, then walks quality and
// then dimensions down until the blob fits. `uncial-cms` is imported inside the
// upload function, never at module scope, so this module can be pulled into a
// Block dynamically without dragging the CMS runtime into a reader page.
import { MEDIA_DIR, STATIC_DIR } from '$lib/site.js';

export interface PreparedImage {
	bytes: Uint8Array;
	filename: string;
	contentType: 'image/webp';
	width: number;
	height: number;
}

const MAX_EDGE = 2000;
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;
const SIZE_STEP = 0.85;
const MIN_EDGE = 320;

async function encodeWebp(
	image: ImageBitmap,
	width: number,
	height: number,
	quality: number
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('This browser cannot prepare images for upload.');
	context.drawImage(image, 0, 0, width, height);
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/webp', quality)
	);
	if (!blob || blob.type !== 'image/webp') {
		throw new Error('This browser cannot encode WebP images for upload.');
	}
	return blob;
}

function dimensionsWithin(width: number, height: number, longestEdge: number): [number, number] {
	const sourceEdge = Math.max(width, height);
	if (sourceEdge <= longestEdge) return [width, height];
	const scale = longestEdge / sourceEdge;
	return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

/**
 * Reduce `file` to a WebP blob of at most `maxBytes`, or throw a message the
 * Content Owner can act on. Quality falls first because it costs less detail
 * than shrinking; dimensions only fall once quality has bottomed out.
 */
export async function downscaleImage(
	file: File,
	options: { maxBytes: number }
): Promise<PreparedImage> {
	const image = await createImageBitmap(file);
	let [width, height] = dimensionsWithin(image.width, image.height, MAX_EDGE);
	let quality = INITIAL_QUALITY;

	try {
		while (true) {
			const blob = await encodeWebp(image, width, height, quality);
			if (blob.size <= options.maxBytes) {
				const stem = file.name.replace(/\.[^.]*$/, '') || 'image';
				return {
					bytes: new Uint8Array(await blob.arrayBuffer()),
					filename: `${stem}.webp`,
					contentType: 'image/webp',
					width,
					height
				};
			}
			if (quality - QUALITY_STEP >= MIN_QUALITY) {
				quality -= QUALITY_STEP;
				continue;
			}
			const nextEdge = Math.floor(Math.max(width, height) * SIZE_STEP);
			if (nextEdge < MIN_EDGE) break;
			[width, height] = dimensionsWithin(width, height, nextEdge);
			quality = INITIAL_QUALITY;
		}
	} finally {
		image.close();
	}

	throw new Error(
		`“${file.name}” could not be reduced below the upload limit. Try cropping it first.`
	);
}

/**
 * Reduce a chosen file and commit it content-addressed into the media
 * directory, answering the base-less served path a Block stores.
 */
export async function uploadDownscaledImage(file: File): Promise<string> {
	const { MAX_CONTENT_BYTES, uploadImageAsset } = await import('uncial-cms');
	const prepared = await downscaleImage(file, { maxBytes: MAX_CONTENT_BYTES });
	const result = await uploadImageAsset(
		{
			bytes: prepared.bytes,
			filename: prepared.filename,
			contentType: prepared.contentType
		},
		{ mediaDir: MEDIA_DIR }
	);
	return `/${result.path.replace(new RegExp(`^${STATIC_DIR}/`), '')}`;
}

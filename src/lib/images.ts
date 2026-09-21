// Responsive image lookup over the Image manifest.
//
// The manifest is the image port's output, keyed by the base-less served path
// that Content documents store. This module is the one place a media path is
// prefixed with the base path.
import { base } from '$app/paths';
import manifest from '../../content/image-manifest.json';

export type ImageSource = {
	src: string;
	width: number;
	type: 'image/webp' | 'image/jpeg';
};

export type ManifestEntry = { srcset: ImageSource[] };

export type ResponsiveSources = {
	/** Fallback for the `<img>` element: the widest JPEG rendition. */
	src: string;
	/** `srcset` value, or an empty string when the path has no renditions. */
	webp: string;
	jpeg: string;
};

const entries = manifest as Record<string, ManifestEntry>;

function srcset(sources: ImageSource[]): string {
	return sources.map((source) => `${base}${source.src} ${source.width}w`).join(', ');
}

/**
 * Responsive sources for a served media path. A path the port never saw — a
 * fresh upload awaiting its next deploy, say — degrades to the plain file
 * rather than throwing.
 */
export function responsiveImage(path: string): ResponsiveSources {
	const entry = entries[path];
	if (!entry) return { src: `${base}${path}`, webp: '', jpeg: '' };

	const webp = entry.srcset.filter((source) => source.type === 'image/webp');
	const jpeg = entry.srcset.filter((source) => source.type === 'image/jpeg');
	const widest = jpeg.at(-1) ?? webp.at(-1);
	return {
		src: `${base}${widest?.src ?? path}`,
		webp: srcset(webp),
		jpeg: srcset(jpeg)
	};
}

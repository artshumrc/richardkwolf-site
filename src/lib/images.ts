import { base } from '$app/paths';
import { resolveImageSrc } from 'uncial/render';
import manifest from '../../generated/image-manifest.json';

export type ImageSource = {
	src: string;
	width: number;
	type: 'image/webp' | 'image/jpeg';
};

export type ManifestEntry = { width: number; height: number; srcset: ImageSource[] };

export type ResponsiveSources = {
	src: string;
	webp: string;
	jpeg: string;
};

const entries = manifest as Record<string, ManifestEntry>;

function srcset(sources: ImageSource[]): string {
	return sources.map((source) => `${base}${source.src} ${source.width}w`).join(', ');
}

export function responsiveImage(path: string): ResponsiveSources {
	const entry = entries[path];
	if (!entry) return { src: resolveImageSrc(path, base), webp: '', jpeg: '' };

	const webp = entry.srcset.filter((source) => source.type === 'image/webp');
	const jpeg = entry.srcset.filter((source) => source.type === 'image/jpeg');
	const widest = jpeg.at(-1) ?? webp.at(-1);
	return {
		src: `${base}${widest?.src ?? path}`,
		webp: srcset(webp),
		jpeg: srcset(jpeg)
	};
}

export function coverSizes(path: string, boxHeight: string): string {
	const entry = entries[path];
	if (!entry) return '100vw';
	return `max(100vw, calc(${boxHeight} * ${(entry.width / entry.height).toFixed(3)}))`;
}

export function thumbnailImage(path: string): string {
	const narrowest = entries[path]?.srcset.find((source) => source.type === 'image/webp');
	return resolveImageSrc(narrowest?.src ?? path, base);
}

export function isRendition(path: string): boolean {
	return /-\d+\.(jpg|webp)$/.test(path);
}

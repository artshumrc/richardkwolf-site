// The Gallery item shape, shared by the Block definition and its components.

export interface GalleryItem {
	kind: 'image' | 'vimeo';
	/** Base-less served media path; carried by an image item. */
	path: string;
	/** Carried by a video item. */
	vimeoId: string;
	/** Base-less served media path of a video item's self-hosted poster. */
	poster: string;
	title: string;
	caption: string;
}

export const EMPTY_ITEM: Omit<GalleryItem, 'kind'> = {
	path: '',
	vimeoId: '',
	poster: '',
	title: '',
	caption: ''
};

function isFilled(value: unknown): boolean {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Structural check for the hidden `items` array. An entry missing its `kind`,
 * or the path or id its kind needs, is rejected rather than silently rendered
 * as a broken cell.
 */
export function areGalleryItems(value: unknown): value is GalleryItem[] {
	return (
		Array.isArray(value) &&
		value.every((item) => {
			if (typeof item !== 'object' || item === null) return false;
			const entry = item as Record<string, unknown>;
			if (entry.kind === 'image') return isFilled(entry.path);
			if (entry.kind === 'vimeo') return isFilled(entry.vimeoId);
			return false;
		})
	);
}

/**
 * Alternative text for an item's image. Every gallery image carries some, so
 * the galleries are never silent to a screen reader even where the Content
 * Owner has not yet titled an item.
 */
export function itemAlt(item: GalleryItem): string {
	const written = item.title.trim() || item.caption.trim();
	if (written) return written;
	return item.kind === 'vimeo' ? 'Video still' : 'Fieldwork photograph';
}

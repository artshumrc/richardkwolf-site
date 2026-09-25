export interface GalleryItem {
	kind: 'image' | 'vimeo';
	path: string;
	vimeoId: string;
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

export function itemAlt(item: GalleryItem): string {
	const written = item.title.trim() || item.caption.trim();
	if (written) return written;
	return item.kind === 'vimeo' ? 'Video still' : 'Fieldwork photograph';
}

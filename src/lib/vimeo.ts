const ID_PATTERN = /(?:^|vimeo\.com\/(?:video\/)?)(\d{6,})/;

export function parseVimeoId(input: string): string | null {
	return input.trim().match(ID_PATTERN)?.[1] ?? null;
}

export function vimeoPlayerUrl(id: string, autoplay = false): string {
	return `https://player.vimeo.com/video/${id}?dnt=1${autoplay ? '&autoplay=1' : ''}`;
}

export interface VimeoPoster {
	title: string;
	file: File;
}

export async function fetchVimeoPoster(id: string): Promise<VimeoPoster> {
	const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
		`https://vimeo.com/${id}`
	)}&width=1280`;
	const response = await fetch(endpoint);
	if (!response.ok) {
		throw new Error(`Vimeo has no video ${id}, or it is not embeddable.`);
	}
	const oembed = (await response.json()) as { title?: string; thumbnail_url?: string };
	if (!oembed.thumbnail_url) throw new Error(`Vimeo returned no poster for video ${id}.`);

	const thumbnail = await fetch(oembed.thumbnail_url);
	if (!thumbnail.ok) throw new Error(`Vimeo's poster for video ${id} could not be downloaded.`);
	const blob = await thumbnail.blob();
	return {
		title: oembed.title ?? '',
		file: new File([blob], `vimeo-${id}.jpg`, { type: blob.type || 'image/jpeg' })
	};
}

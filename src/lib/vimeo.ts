// Vimeo id parsing, the Do-Not-Track player URL, and authoring-time poster
// capture through oEmbed.
//
// Nothing here runs on page load: the player URL is only ever built once a
// reader clicks a poster, and the poster fetch only from an Editor variant.

const ID_PATTERN = /(?:^|vimeo\.com\/(?:video\/)?)(\d{6,})/;

/** The bare id in a Vimeo id, `vimeo.com/<id>` URL or player URL. */
export function parseVimeoId(input: string): string | null {
	return input.trim().match(ID_PATTERN)?.[1] ?? null;
}

/**
 * The embed URL, with Do-Not-Track on so the player sets no cookies and
 * reports no session. Only ever assigned to an iframe after a click.
 */
export function vimeoPlayerUrl(id: string): string {
	return `https://player.vimeo.com/video/${id}?dnt=1`;
}

export interface VimeoPoster {
	title: string;
	/** The thumbnail as a file, ready for the same downscale-and-commit path an
	 * author's own upload takes. */
	file: File;
}

/**
 * Fetch a video's title and poster frame from Vimeo's oEmbed endpoint. The
 * source theme's own crops are deliberately not reused: several are small
 * derivatives.
 */
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

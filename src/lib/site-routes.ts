// The link enum offered to the Content Owner, generated from the Content tree.
//
// Internal links are a dropdown of the site's real pages, so a link cannot be
// typed into a 404. `external` is the one escape hatch, and reveals a URL field
// on the Block's canvas rather than in the attributes panel.
import { base } from '$app/paths';

interface ContentMeta {
	title?: unknown;
}

// The Site document holds site-wide metadata and the Image manifest is the
// image port's output; neither renders a page, so neither is a link target.
const metas = import.meta.glob<ContentMeta>(
	[
		'../../content/**/*.json',
		'!../../content/site.json',
		'!../../content/image-manifest.json'
	],
	{ eager: true, import: 'meta' }
);

function routeFor(modulePath: string): string {
	const slug = modulePath.replace(/^.*\/content\//, '').replace(/\.json$/, '');
	return slug === 'index' ? '/' : `/${slug}/`;
}

/** Every reader page of the site, as a dropdown of real link targets. */
export const PAGE_LINK_OPTIONS = Object.entries(metas)
	.map(([modulePath, meta]) => {
		const value = routeFor(modulePath);
		return { value, label: String(meta?.title ?? value) };
	})
	.sort((left, right) => left.label.localeCompare(right.label));

/** The page enum plus the one escape hatch, for Blocks that may link offsite. */
export const LINK_OPTIONS = [
	...PAGE_LINK_OPTIONS,
	{ value: 'external', label: 'External URL' }
];

/**
 * Whether the Content tree holds a homepage. The masthead's wordmark links to
 * `/` only once one exists, so prerendering does not crawl a route with no
 * document behind it.
 */
export const HAS_HOME_PAGE = PAGE_LINK_OPTIONS.some((option) => option.value === '/');

/** The href a Block's link attributes resolve to, base path included. */
export function resolveBlockLink(link: string, externalUrl: string): string {
	if (link === 'external') return externalUrl;
	return link ? `${base}${link}` : '';
}

import { base } from '$app/paths';

interface ContentMeta {
	title?: unknown;
}

const metas = import.meta.glob<ContentMeta>(
	['../../content/**/*.json', '!../../content/site.json'],
	{ eager: true, import: 'meta' }
);

function routeFor(modulePath: string): string {
	const slug = modulePath.replace(/^.*\/content\//, '').replace(/\.json$/, '');
	return slug === 'index' ? '/' : `/${slug}/`;
}

export const PAGE_LINK_OPTIONS = Object.entries(metas)
	.map(([modulePath, meta]) => {
		const value = routeFor(modulePath);
		return { value, label: String(meta?.title ?? value) };
	})
	.sort((left, right) => left.label.localeCompare(right.label));

export const LINK_OPTIONS = [
	...PAGE_LINK_OPTIONS,
	{ value: 'external', label: 'External URL' }
];

export const HAS_HOME_PAGE = PAGE_LINK_OPTIONS.some((option) => option.value === '/');

export function resolveBlockLink(link: string, externalUrl: string): string {
	if (link === 'external') return externalUrl;
	return link ? `${base}${link}` : '';
}

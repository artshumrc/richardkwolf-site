import { env } from '$env/dynamic/public';

export const DEFAULT_SITE_ORIGIN = 'https://www.richardkwolf.com';

export function siteOrigin(): string {
	const configured = env.PUBLIC_SITE_ORIGIN?.trim();
	return (configured || DEFAULT_SITE_ORIGIN).replace(/\/+$/, '');
}

export function canonicalPath(pagePath: unknown): string {
	const raw = String(pagePath ?? '').replace(/^\/+/, '');
	if (raw === '' || raw === 'index' || raw === 'index/') return '/';
	return `/${raw.replace(/\/+$/, '')}/`;
}

export function canonicalUrl(pagePath: unknown, base: string): string {
	return `${siteOrigin()}${base}${canonicalPath(pagePath)}`;
}

// Canonical origin for reader-page metadata.
//
// PUBLIC_SITE_ORIGIN is supplied by CI from the Pages configuration step's
// `origin` output, so a project-URL build emits its own origin instead of
// claiming the custom domain. Local builds fall back to the eventual custom
// domain.
import { env } from '$env/dynamic/public';

/** Custom-domain origin used when PUBLIC_SITE_ORIGIN is unset (local dev). */
export const DEFAULT_SITE_ORIGIN = 'https://www.richardkwolf.com';

/** Build-time site origin with trailing slashes stripped. */
export function siteOrigin(): string {
	const configured = env.PUBLIC_SITE_ORIGIN?.trim();
	return (configured || DEFAULT_SITE_ORIGIN).replace(/\/+$/, '');
}

/** Page path from a Content load (`positions-education-honors/`) to `/positions-education-honors/`. */
export function canonicalPath(pagePath: unknown): string {
	const raw = String(pagePath ?? '').replace(/^\/+/, '');
	if (raw === '' || raw === 'index' || raw === 'index/') return '/';
	return `/${raw.replace(/\/+$/, '')}/`;
}

/** Full canonical URL: origin + base + page path. Base is empty locally. */
export function canonicalUrl(pagePath: unknown, base: string): string {
	return `${siteOrigin()}${base}${canonicalPath(pagePath)}`;
}

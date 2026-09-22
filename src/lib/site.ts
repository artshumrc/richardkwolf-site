// Site-wide CMS declaration and page-classification predicates.
//
// This module carries no Svelte and no SvelteKit in its graph so that both the
// app and `vite.config.ts` can import it. Blocks and schema live in
// `$lib/blocks.js`, which does import Svelte.
import type { SiteOptions, UncialCmsSiteConfig } from 'uncial-cms';
import type { ContentEntry } from 'uncial-cms/sveltekit';

/** Repo-root-relative directory holding Content documents. */
export const CONTENT_DIR = 'content';

/** Directory under `static/` that uploaded media commits into. */
export const STATIC_DIR = 'static';

/** Repo-root-relative media directory served at `/uploads/`. */
export const MEDIA_DIR = `${STATIC_DIR}/uploads`;

/**
 * Content-directory path of the Site document. It is edited like any page but
 * renders no reader page: it holds the site-wide metadata the footer reads and
 * the navigation menu the header renders.
 */
export const SITE_DOCUMENT_PATH = 'site';

function normalize(path: string): string {
	return path.replace(/^\/+|\/+$/g, '');
}

// The review deployment. Moves to Richard's own account once the content
// editing is proven here; see docs/handover.md.
const REPO = 'artshumrc/richardkwolf-site';

/** Options for the Uncial Vite plugin (local Forge in dev, GitHub in build). */
export const siteOptions: SiteOptions = {
	contentDir: CONTENT_DIR,
	mediaDir: MEDIA_DIR,
	github: { repo: REPO, branch: 'main' }
};

/**
 * Shared GitHub Forge configuration. The production build edits through this;
 * development mounts swap in the local Forge per mount point on the dev flag.
 */
export const siteConfig: UncialCmsSiteConfig = {
	forge: 'github',
	repo: REPO,
	branch: 'main',
	contentDir: CONTENT_DIR,
	mediaDir: MEDIA_DIR,
	authWorkerUrl: 'https://uncial-cms-auth.dflood.workers.dev',
	appSlug: 'uncial-cms'
};

/** Whether a Content entry renders a reader page. */
export function isContentPage(entry: ContentEntry): boolean {
	return normalize(entry.path) !== SITE_DOCUMENT_PATH;
}

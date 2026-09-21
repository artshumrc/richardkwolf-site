// Site-wide CMS declaration and page-classification predicates.
//
// This module carries no Svelte and no SvelteKit in its graph so that both the
// app and `vite.config.ts` can import it. Blocks and schema live in
// `$lib/blocks.js`, which does import Svelte.
import type { SiteOptions } from 'uncial-cms';
import type { UncialCmsSiteConfig } from 'uncial-cms';
import type { ContentEntry } from 'uncial-cms/sveltekit';

/** Repo-root-relative directory holding Content documents. */
export const CONTENT_DIR = 'content';

/** Directory under `static/` that uploaded media commits into. */
export const STATIC_DIR = 'static';

/** Repo-root-relative media directory served at `/uploads/`. */
export const MEDIA_DIR = `${STATIC_DIR}/uploads`;

/**
 * Content-directory JSON that is not a Content document. The Image manifest is
 * the image port's output: it renders no reader page, and an Editor variant for
 * it would let a save rewrite it as a Content document, taking every responsive
 * image on the site down. See docs/adr/0001-single-content-addressed-media-tree.
 */
const GENERATED_DOCUMENTS = ['image-manifest'];

function isGenerated(entry: ContentEntry): boolean {
	return GENERATED_DOCUMENTS.includes(entry.path.replace(/^\/+|\/+$/g, ''));
}

// The owning GitHub account is not yet decided (personal account or org).
// OPEN DECISION: replace the placeholder repo below once hosting is settled.
// Nothing in this epic needs the real account; deployment is deferred.
const PLACEHOLDER_REPO = 'TODO-OWNER/richardkwolf-site';

/** Options for the Uncial Vite plugin (local Forge in dev, GitHub in build). */
export const siteOptions: SiteOptions = {
	contentDir: CONTENT_DIR,
	mediaDir: MEDIA_DIR,
	github: { repo: PLACEHOLDER_REPO, branch: 'main' }
};

/**
 * Shared GitHub Forge configuration. The production build edits through this;
 * development mounts swap in the local Forge per mount point on the dev flag.
 */
export const siteConfig: UncialCmsSiteConfig = {
	forge: 'github',
	repo: PLACEHOLDER_REPO,
	branch: 'main',
	contentDir: CONTENT_DIR,
	mediaDir: MEDIA_DIR,
	authWorkerUrl: 'https://uncial-cms-auth.dflood.workers.dev',
	appSlug: 'uncial-cms'
};

/**
 * Whether a Content entry renders a reader page. The Site document will need to
 * be excluded here later.
 */
export function isContentPage(entry: ContentEntry): boolean {
	return !isGenerated(entry);
}

/** Whether a Content entry gets an Editor variant. */
export function isEditablePage(entry: ContentEntry): boolean {
	return !isGenerated(entry);
}

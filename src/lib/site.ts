import type { SiteOptions, UncialCmsSiteConfig } from 'uncial-cms';
import type { ContentEntry } from 'uncial-cms/sveltekit';

export const CONTENT_DIR = 'content';

export const STATIC_DIR = 'static';

export const MEDIA_DIR = `${STATIC_DIR}/uploads`;

export const SITE_DOCUMENT_PATH = 'site';

function normalize(path: string): string {
	return path.replace(/^\/+|\/+$/g, '');
}

const REPO = 'artshumrc/richardkwolf-site';

export const siteOptions: SiteOptions = {
	contentDir: CONTENT_DIR,
	mediaDir: MEDIA_DIR,
	github: { repo: REPO, branch: 'main' }
};

export const siteConfig: UncialCmsSiteConfig = {
	forge: 'github',
	repo: REPO,
	branch: 'main',
	contentDir: CONTENT_DIR,
	mediaDir: MEDIA_DIR,
	authWorkerUrl: '',
	appSlug: 'aws-lambda-broker'
};

export function isContentPage(entry: ContentEntry): boolean {
	return normalize(entry.path) !== SITE_DOCUMENT_PATH;
}

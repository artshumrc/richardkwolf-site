import { dev } from '$app/environment';
import { createContentHandlers } from 'uncial-cms/sveltekit';
import type { UncialCmsSiteConfig } from 'uncial-cms';
import { blocks, schemaFor } from '$lib/blocks.js';
import { CONTENT_DIR, isContentPage, siteConfig } from '$lib/site.js';

const config: UncialCmsSiteConfig = dev
	? { forge: 'local', contentDir: siteConfig.contentDir, mediaDir: siteConfig.mediaDir }
	: siteConfig;

const handlers = createContentHandlers({
	config,
	localContentDir: CONTENT_DIR,
	blocks,
	schema: schemaFor,
	exclude: (entry) => !isContentPage(entry)
});

export const entries = handlers.entries;
export const load = handlers.load;

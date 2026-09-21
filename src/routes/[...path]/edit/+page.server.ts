import { dev } from '$app/environment';
import { createEditorHandlers } from 'uncial-cms/sveltekit';
import type { UncialCmsSiteConfig } from 'uncial-cms';
import { blocks, schemaFor } from '$lib/blocks.js';
import { CONTENT_DIR, isEditablePage, siteConfig } from '$lib/site.js';

const config: UncialCmsSiteConfig = dev
	? { forge: 'local', contentDir: siteConfig.contentDir, mediaDir: siteConfig.mediaDir }
	: siteConfig;

const handlers = createEditorHandlers({
	config,
	localContentDir: CONTENT_DIR,
	blocks,
	schema: schemaFor,
	exclude: (entry) => !isEditablePage(entry)
});

export const entries = handlers.entries;
export const load = handlers.load;

import { dev } from '$app/environment';
import { createIndexHandlers } from 'uncial-cms/sveltekit';
import type { UncialCmsSiteConfig } from 'uncial-cms';
import { blocks, schemaFor } from '$lib/blocks.js';
import { CONTENT_DIR, siteConfig } from '$lib/site.js';

const config: UncialCmsSiteConfig = dev
	? { forge: 'local', contentDir: siteConfig.contentDir, mediaDir: siteConfig.mediaDir }
	: siteConfig;

const handlers = createIndexHandlers({
	config,
	localContentDir: CONTENT_DIR,
	blocks,
	schema: schemaFor
});

export const load = handlers.load;

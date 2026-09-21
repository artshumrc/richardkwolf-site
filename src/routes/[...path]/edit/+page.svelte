<script lang="ts">
	import { dev } from '$app/environment';
	import { EditorPage } from 'uncial-cms/svelte';
	import type { Site, UncialCmsSiteConfig } from 'uncial-cms';
	import { blocks, schemaFor } from '$lib/blocks.js';
	import { CONTENT_DIR, siteConfig } from '$lib/site.js';

	let { data } = $props();

	const config: UncialCmsSiteConfig = dev
		? { forge: 'local', contentDir: siteConfig.contentDir, mediaDir: siteConfig.mediaDir }
		: siteConfig;

	const site: Site = {
		config,
		localOnly: false,
		autosaveMs: undefined,
		localContentDir: CONTENT_DIR
	};
</script>

<main>
	<EditorPage
		{site}
		sourcePath={data.sourcePath}
		pagePath={data.pagePath}
		{blocks}
		schema={schemaFor}
		presentation="bare"
		attributesPanel="overlay"
	/>
</main>

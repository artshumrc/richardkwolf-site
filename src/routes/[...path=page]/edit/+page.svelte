<script lang="ts">
	import { dev } from '$app/environment';
	import { base } from '$app/paths';
	import { EditorPage } from 'uncial-cms/svelte';
	import { cmsImageSource, defineSite, type UncialCmsSiteConfig } from 'uncial-cms';
	import { blocks, schemaFor } from '$lib/blocks.js';
	import { isRendition, thumbnailImage } from '$lib/images.js';
	import { STATIC_DIR, siteConfig, siteOptions } from '$lib/site.js';
	import { brokerSessionProvider } from '$lib/github-broker-session.js';

	let { data } = $props();

	const config: UncialCmsSiteConfig = dev
		? { forge: 'local', contentDir: siteConfig.contentDir, mediaDir: siteConfig.mediaDir }
		: siteConfig;

	const site = { ...defineSite(siteOptions, { dev }), config };

	const cmsImages = cmsImageSource(config, { base, staticDir: STATIC_DIR });
	const imageSource = {
		...cmsImages,
		browse: async () => (await cmsImages.browse!()).filter((path) => !isRendition(path)),
		thumbnail: thumbnailImage
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
		sessionProvider={config.forge === 'github' ? brokerSessionProvider : undefined}
		attributesPanel="overlay"
		{imageSource}
	/>
</main>

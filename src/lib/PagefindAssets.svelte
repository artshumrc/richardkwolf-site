<script lang="ts">
	// Pagefind's bundle is build output, so Vite never sees it and cannot
	// rewrite its URL. The base path differs between the Pages project URL and
	// the custom domain, so both the stylesheet and the module are resolved
	// against `base` at runtime.
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		if (!document.querySelector('link[data-pagefind-styles]')) {
			const stylesheet = document.createElement('link');
			stylesheet.rel = 'stylesheet';
			stylesheet.href = `${base}/pagefind/pagefind-component-ui.css`;
			stylesheet.dataset.pagefindStyles = '';
			document.head.append(stylesheet);
		}
		void import(/* @vite-ignore */ `${base}/pagefind/pagefind-component-ui.js`);
	});
</script>

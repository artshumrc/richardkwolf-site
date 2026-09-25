<script lang="ts">
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

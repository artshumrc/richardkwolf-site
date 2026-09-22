<script lang="ts">
	import '../app.css';
	import SiteFooter from '$lib/SiteFooter.svelte';
	import SiteHeader from '$lib/SiteHeader.svelte';

	let { children } = $props();
</script>

<div class="site">
	<SiteHeader />
	<div class="site__body">
		{@render children()}
	</div>
	<SiteFooter />
</div>

<style>
	.site {
		display: flex;
		min-height: 100vh;
		flex-direction: column;
	}

	/* No gutter here: a Hero and a Band run the full width of the window, and
	   every other Block holds itself to one row's width. */
	.site__body {
		flex: 1;
	}
</style>

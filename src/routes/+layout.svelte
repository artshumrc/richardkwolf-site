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

	.site__body {
		flex: 1;
	}
</style>

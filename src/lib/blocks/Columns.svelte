<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<section class="row columns">
	{@render children?.()}
</section>

<style>
	.columns {
		display: grid;
		gap: var(--block-gap);
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
	}

	@media (max-width: 48rem) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>

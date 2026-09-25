<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		columns?: number;
		children?: Snippet;
	}

	let { columns = 3, children }: Props = $props();
</script>

<section class="row card-row" style:--card-row-columns={columns}>
	{@render children?.()}
</section>

<style>
	.card-row {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(var(--card-row-columns), minmax(0, 1fr));
	}

	@media (max-width: 48rem) {
		.card-row {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>

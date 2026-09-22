<script lang="ts">
	import EditableImage from './EditableImage.svelte';

	interface Props {
		path?: string;
		alt?: string;
		caption?: string;
		updateAttributes?: (attrs: Record<string, unknown>) => void;
	}

	let { path = '', alt = '', caption = '', updateAttributes }: Props = $props();
</script>

<figure class="row">
	<EditableImage
		src={path}
		{alt}
		label="photograph"
		sizes="(min-width: 75rem) 1128px, 100vw"
		onUpload={updateAttributes ? (src) => updateAttributes({ path: src }) : undefined}
	/>
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	figcaption {
		font-size: 0.75rem;
		margin-block-start: 0.5rem;
	}
</style>

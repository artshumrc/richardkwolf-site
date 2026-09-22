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

<figure>
	<EditableImage
		src={path}
		{alt}
		label="photograph"
		sizes="(min-width: 48rem) 42rem, 100vw"
		onUpload={updateAttributes ? (src) => updateAttributes({ path: src }) : undefined}
	/>
	{#if caption}<figcaption>{caption}</figcaption>{/if}
</figure>

<style>
	figure {
		max-width: 42rem;
		margin-inline: auto;
	}

	figcaption {
		font-size: 0.875rem;
		margin-block-start: 0.5rem;
	}
</style>

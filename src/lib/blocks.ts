// Block registry and schema for the site.
import { createBlockRegistry, createSchema } from 'uncial/core';
import { defineSvelteBlock } from 'uncial/runtime/svelte';
import Figure from '$lib/blocks/Figure.svelte';
import Prose from '$lib/blocks/Prose.svelte';

const prose = defineSvelteBlock({
	id: 'prose',
	label: 'Prose',
	description: 'A reading column for long-form prose.',
	attributes: {},
	component: Prose,
	content: { kind: 'flow' }
});

// A single captioned photograph. `path` is a base-less served media path, so
// the block carries no upload UI and no file-input attribute type; the
// responsive renditions come from the Image manifest at render.
const figure = defineSvelteBlock({
	id: 'figure',
	label: 'Figure',
	description: 'A single photograph with a caption.',
	attributes: {
		path: { default: '', required: true, placeholder: '/uploads/<hash>.webp' },
		alt: { default: '', required: true },
		caption: { default: '' }
	},
	component: Figure,
	content: false
});

export const blocks = createBlockRegistry([prose, figure]);

export const schema = createSchema(blocks, {
	metaFields: {
		title: { default: 'Untitled page', required: true },
		description: { default: '', required: false }
	}
});

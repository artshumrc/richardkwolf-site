// Block registry and schema for the site. One Block this slice: the prose
// container, an unrestricted flow with no attributes.
import { createBlockRegistry, createSchema } from 'uncial/core';
import { defineSvelteBlock } from 'uncial/runtime/svelte';
import Prose from '$lib/blocks/Prose.svelte';

const prose = defineSvelteBlock({
	id: 'prose',
	label: 'Prose',
	description: 'A reading column for long-form prose.',
	attributes: {},
	component: Prose,
	content: { kind: 'flow' }
});

export const blocks = createBlockRegistry([prose]);

export const schema = createSchema(blocks, {
	metaFields: {
		title: { default: 'Untitled page', required: true },
		description: { default: '', required: false }
	}
});

// Block registry and schema for the site.
import { createBlockRegistry, createSchema } from 'uncial/core';
import { defineSvelteBlock } from 'uncial/runtime/svelte';
import { LINK_OPTIONS } from '$lib/site-routes.js';
import Card from '$lib/blocks/Card.svelte';
import CardRow from '$lib/blocks/CardRow.svelte';
import Figure from '$lib/blocks/Figure.svelte';
import Hero from '$lib/blocks/Hero.svelte';
import Prose from '$lib/blocks/Prose.svelte';

const nonEmpty = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

const COLUMN_CHOICES = [2, 3, 4];

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

// `image` is a plain string attribute: the upload UI lives inside the block on
// the canvas, so the attributes panel never renders a file input.
const hero = defineSvelteBlock({
	id: 'hero',
	label: 'Hero',
	description: 'A photographic page opener stating the page title.',
	attributes: {
		image: { default: '', required: true, validate: nonEmpty },
		alt: { default: '', required: true, validate: nonEmpty },
		eyebrow: { default: '' },
		headline: { default: '', required: true, validate: nonEmpty },
		lede: { default: '', input: 'textarea' }
	},
	component: Hero,
	content: false
});

const cardRow = defineSvelteBlock({
	id: 'cardRow',
	label: 'Card row',
	description: 'A responsive grid of two, three or four cards.',
	attributes: {
		columns: {
			default: 3,
			options: COLUMN_CHOICES,
			validate: (value: unknown) => COLUMN_CHOICES.includes(Number(value))
		}
	},
	component: CardRow,
	content: { kind: 'flow', allowedBlocks: ['card'] }
});

const card = defineSvelteBlock({
	id: 'card',
	label: 'Card',
	description: 'A linked photographic card for another page on the site.',
	attributes: {
		image: { default: '', required: true, validate: nonEmpty },
		alt: { default: '', required: true, validate: nonEmpty },
		title: { default: '', required: true, validate: nonEmpty },
		blurb: { default: '', input: 'textarea' },
		// The dropdown is generated from the Content tree, so the Content Owner
		// picks a real page. A stored value is only checked for being a path:
		// a card may point at a page a later ticket has yet to author.
		link: { default: '/', required: true, options: LINK_OPTIONS, validate: nonEmpty },
		externalUrl: { default: '', input: 'hidden' }
	},
	component: Card,
	content: false
});

export const blocks = createBlockRegistry([prose, figure, hero, cardRow, card]);

export const schema = createSchema(blocks, {
	metaFields: {
		title: { default: 'Untitled page', required: true },
		description: { default: '', required: false }
	}
});

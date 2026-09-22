// Block registry and schema for the site.
import { createBlockRegistry, createSchema } from 'uncial/core';
import { SITE_DOCUMENT_PATH } from '$lib/site.js';
import { defineSvelteBlock } from 'uncial/runtime/svelte';
import { LINK_OPTIONS, PAGE_LINK_OPTIONS } from '$lib/site-routes.js';
import { areGalleryItems, type GalleryItem } from '$lib/gallery.js';
import {
	areFooterLinks,
	areNavItems,
	type FooterLink,
	type NavItem
} from '$lib/navigation.js';
import Card from '$lib/blocks/Card.svelte';
import CardRow from '$lib/blocks/CardRow.svelte';
import Figure from '$lib/blocks/Figure.svelte';
import Gallery from '$lib/blocks/Gallery.svelte';
import Hero from '$lib/blocks/Hero.svelte';
import Navigation from '$lib/blocks/Navigation.svelte';
import Prose from '$lib/blocks/Prose.svelte';
import SoundCloud from '$lib/blocks/SoundCloud.svelte';

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

// A single captioned photograph. `path` is a base-less served media path with
// no declared input type: the upload UI lives inside the block on the canvas,
// as it does on the Hero and the Card. The responsive renditions come from the
// Image manifest at render.
const figure = defineSvelteBlock({
	id: 'figure',
	label: 'Figure',
	description: 'A single photograph with a caption.',
	attributes: {
		path: { default: '', required: true, validate: nonEmpty },
		alt: { default: '', required: true, validate: nonEmpty },
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
		// picks a real page. A stored value is only checked for being non-empty,
		// so a card whose target has since been deleted still renders.
		link: { default: '/', required: true, options: LINK_OPTIONS, validate: nonEmpty },
		externalUrl: { default: '', input: 'hidden' }
	},
	component: Card,
	content: false
});

// `items` is hidden from the attributes panel and edited entirely on the
// canvas: arranging a gallery needs thumbnails, which the `list` input cannot
// show.
const gallery = defineSvelteBlock({
	id: 'gallery',
	label: 'Gallery',
	description: 'Photographs and videos in one responsive grid, with a lightbox.',
	attributes: {
		commentary: { default: '', input: 'textarea' },
		items: {
			default: [] as GalleryItem[],
			input: 'hidden',
			validate: areGalleryItems
		}
	},
	component: Gallery,
	content: false
});

// The site's last working audio. The widget is third-party, so like a Vimeo
// item it is click-to-load.
const soundcloud = defineSvelteBlock({
	id: 'soundcloud',
	label: 'SoundCloud recording',
	description: 'A SoundCloud track or playlist, loaded only when a reader clicks it.',
	attributes: {
		resource: {
			default: 'track' as 'track' | 'playlist',
			options: ['track', 'playlist'] as const,
			validate: (value: unknown) => value === 'track' || value === 'playlist'
		},
		soundcloudId: { default: '', required: true, validate: nonEmpty },
		title: { default: '' }
	},
	component: SoundCloud,
	content: false
});

// The Site document's navigation. Both lists are `list`-valued so the Content
// Owner edits them as fields; their links are the page enum without the
// external escape hatch, so a menu entry cannot point anywhere but a real page.
const navigation = defineSvelteBlock({
	id: 'navigation',
	label: 'Navigation menu',
	description: "The site's header menu and footer links.",
	attributes: {
		items: {
			default: [] as NavItem[],
			list: {
				itemLabel: 'menu item',
				fields: {
					label: { default: '', placeholder: 'Menu label' },
					link: { default: '/research/', options: PAGE_LINK_OPTIONS },
					parent: { default: '', placeholder: 'Parent label, or blank for a top-level item' }
				}
			},
			validate: areNavItems
		},
		footerLinks: {
			default: [] as FooterLink[],
			list: {
				itemLabel: 'footer link',
				fields: {
					label: { default: '', placeholder: 'Link label' },
					link: { default: '/research/', options: PAGE_LINK_OPTIONS }
				}
			},
			validate: areFooterLinks
		}
	},
	component: Navigation,
	content: false
});

export const blocks = createBlockRegistry([
	prose,
	figure,
	hero,
	cardRow,
	card,
	gallery,
	soundcloud,
	navigation
]);

// One flat metadata set, written out on every document. The site-wide values
// are read from the Site document alone; on a Content page they stay empty.
const metaFields = {
	title: { default: 'Untitled page', required: true },
	description: { default: '', required: false },
	siteName: { default: '' },
	email: { default: '' },
	contactLines: { default: '', input: 'textarea' },
	copyright: { default: '' }
};

/** The schema every Content page is written against. */
export const schema = createSchema(blocks, {
	allowedBlocks: blocks.blocks.map((block) => block.id).filter((id) => id !== 'navigation'),
	metaFields
});

/**
 * The Site document's schema. The navigation Block belongs to it alone, and no
 * page Block belongs on it.
 */
export const siteSchema = createSchema(blocks, {
	allowedBlocks: ['navigation'],
	metaFields
});

/** The schema a document at this site-relative path is written against. */
export function schemaFor(path: string): ReturnType<typeof createSchema> {
	return path.replace(/^\/+|\/+$/g, '') === SITE_DOCUMENT_PATH ? siteSchema : schema;
}

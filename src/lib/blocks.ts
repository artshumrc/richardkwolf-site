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
import Band from '$lib/blocks/Band.svelte';
import Card from '$lib/blocks/Card.svelte';
import CardRow from '$lib/blocks/CardRow.svelte';
import Columns from '$lib/blocks/Columns.svelte';
import Figure from '$lib/blocks/Figure.svelte';
import Gallery from '$lib/blocks/Gallery.svelte';
import Hero from '$lib/blocks/Hero.svelte';
import LocationMap from '$lib/blocks/LocationMap.svelte';
import Navigation from '$lib/blocks/Navigation.svelte';
import Prose from '$lib/blocks/Prose.svelte';
import SoundCloud from '$lib/blocks/SoundCloud.svelte';

const nonEmpty = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

const isCoordinate = (value: unknown) => Number.isFinite(Number(value));

const COLUMN_CHOICES = [2, 3, 4];
const HERO_HEIGHTS = ['standard', 'full'];

const prose = defineSvelteBlock({
	id: 'prose',
	label: 'Prose',
	description: 'A reading column for long-form prose.',
	attributes: {
		dropcap: { default: false }
	},
	component: Prose,
	content: { kind: 'flow' }
});

const figure = defineSvelteBlock({
	id: 'figure',
	label: 'Figure',
	description: 'A single photograph with a caption.',
	attributes: {
		path: { default: '', required: true, input: 'image', validate: nonEmpty },
		alt: { default: '', required: true, validate: nonEmpty },
		caption: { default: '' }
	},
	component: Figure,
	content: false
});

const hero = defineSvelteBlock({
	id: 'hero',
	label: 'Hero',
	description: 'A photographic page opener stating the page title.',
	attributes: {
		image: { default: '', required: true, input: 'image', validate: nonEmpty },
		alt: { default: '', required: true, validate: nonEmpty },
		eyebrow: { default: '' },
		headline: { default: '', required: true, input: 'textarea', validate: nonEmpty },
		lede: { default: '', input: 'textarea' },
		height: {
			default: 'standard',
			options: HERO_HEIGHTS,
			validate: (value: unknown) => HERO_HEIGHTS.includes(String(value))
		}
	},
	component: Hero,
	content: false
});

const band = defineSvelteBlock({
	id: 'band',
	label: 'Band',
	description: 'A full-width photographic band stating a section heading.',
	attributes: {
		image: { default: '', required: true, input: 'image', validate: nonEmpty },
		alt: { default: '', required: true, validate: nonEmpty },
		headline: { default: '', required: true, validate: nonEmpty }
	},
	component: Band,
	content: false
});

const columns = defineSvelteBlock({
	id: 'columns',
	label: 'Columns',
	description: 'Two columns side by side, stacking on a phone.',
	attributes: {},
	component: Columns,
	content: { kind: 'flow', allowedBlocks: ['prose', 'figure', 'gallery'] }
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
		image: { default: '', required: true, input: 'image', validate: nonEmpty },
		alt: { default: '', required: true, validate: nonEmpty },
		title: { default: '', required: true, validate: nonEmpty },
		blurb: { default: '', input: 'textarea' },
		link: { default: '/', required: true, options: LINK_OPTIONS, validate: nonEmpty },
		externalUrl: { default: '', input: 'hidden' }
	},
	component: Card,
	content: false
});

const gallery = defineSvelteBlock({
	id: 'gallery',
	label: 'Gallery',
	description: 'Photographs and videos in one responsive grid, with a lightbox.',
	attributes: {
		commentary: { default: '', input: 'textarea' },
		items: {
			default: [] as GalleryItem[],
			list: {
				itemLabel: 'gallery item',
				fields: {
					kind: { default: 'image', options: ['image', 'vimeo'] },
					path: { default: '', input: 'image' },
					vimeoId: { default: '', placeholder: 'Vimeo id' },
					poster: { default: '', input: 'image' },
					title: { default: '' },
					caption: { default: '' }
				}
			},
			validate: areGalleryItems
		}
	},
	component: Gallery,
	content: false
});

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

const locationMap = defineSvelteBlock({
	id: 'map',
	label: 'Map',
	description: 'A marked location on a map.',
	attributes: {
		lat: { default: 0, required: true, validate: isCoordinate },
		lng: { default: 0, required: true, validate: isCoordinate },
		zoom: { default: 6, validate: (value: unknown) => Number.isInteger(Number(value)) },
		label: { default: '' }
	},
	component: LocationMap,
	content: false
});

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
	band,
	columns,
	cardRow,
	card,
	gallery,
	soundcloud,
	locationMap,
	navigation
]);

const metaFields = {
	title: { default: 'Untitled page', required: true },
	description: { default: '', required: false },
	siteName: { default: '' },
	email: { default: '' },
	contactLines: { default: '', input: 'textarea' },
	copyright: { default: '' }
};

export const schema = createSchema(blocks, {
	allowedBlocks: blocks.blocks.map((block) => block.id).filter((id) => id !== 'navigation'),
	metaFields
});

export const siteSchema = createSchema(blocks, {
	allowedBlocks: ['navigation'],
	metaFields
});

export function schemaFor(path: string): ReturnType<typeof createSchema> {
	return path.replace(/^\/+|\/+$/g, '') === SITE_DOCUMENT_PATH ? siteSchema : schema;
}

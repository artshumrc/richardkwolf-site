// The Site document as the chrome reads it.
//
// The document renders no reader page, so the header and footer read its
// navigation Block's attributes here rather than through a page load.
import siteDocument from '../../content/site.json';
import type { FooterLink, NavItem } from '$lib/navigation.js';

export interface SiteMeta {
	siteName: string;
	email: string;
	/** Postal address, one line per line, as the footer stacks them. */
	contactLines: string;
	copyright: string;
}

interface NavigationAttrs {
	items?: NavItem[];
	footerLinks?: FooterLink[];
}

export const siteMeta = siteDocument.meta satisfies SiteMeta;

const navigation = siteDocument.content.find((node) => node.type === 'navigation')?.attrs as
	| NavigationAttrs
	| undefined;

export const navItems: NavItem[] = navigation?.items ?? [];
export const footerLinks: FooterLink[] = navigation?.footerLinks ?? [];
export const contactLines: string[] = siteMeta.contactLines
	.split('\n')
	.map((line) => line.trim())
	.filter(Boolean);

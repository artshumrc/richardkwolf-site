import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse } from 'node-html-parser';
import { CURRENT_DOCUMENT_VERSION } from 'uncial/core';

const SOURCE_DIR = 'migration/source/pages';
const CONTENT_DIR = 'content';
const TITLE_SUFFIX = ' - Richard K. Wolf';

const SELF_ORIGIN = /^https?:\/\/(?:www\.)?(?:richardkwolf\.com|159\.203\.177\.179)(?=[/?#]|$)/i;

const WP_UPLOADS = /^\/wp-content\//i;

const SITE_WIDE_META = { siteName: '', email: '', contactLines: '', copyright: '' };

const HEADING_TEXT_LIMIT = 80;

const FLOW_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE']);
const MARK_TAGS = new Map([
	['EM', 'italic'],
	['I', 'italic'],
	['STRONG', 'bold'],
	['B', 'bold'],
	['S', 'strike'],
	['STRIKE', 'strike'],
	['DEL', 'strike'],
	['CODE', 'code']
]);

const pagesFile = JSON.parse(readFileSync('migration/pages.json', 'utf8'));
const imageSources = JSON.parse(readFileSync('migration/image-sources.json', 'utf8'));
const pdfSources = JSON.parse(readFileSync('migration/pdf-sources.json', 'utf8'));
const vimeoPosters = JSON.parse(readFileSync('migration/vimeo-posters.json', 'utf8'));

const ABSORBED = { 'tamil-songs': ['tamil'] };

const RETIRED_LINKS = { '/shahd-and-qalabandi/': '/music-of-central-asia/' };

const REPOINTED_PROSE = {
	index: { phrase: 'Ismoil Nazriev', href: '/music-of-central-asia/' }
};

const VIMEO_URL = /player\.vimeo\.com\/video\/(\d+)/;

const text = (value) => (value ?? '').normalize('NFC');

function mediaPath(url) {
	if (!url) return '';
	const key = decodeURI(new URL(url, 'https://www.richardkwolf.com/').pathname).replace(/^\/+/, '');
	return imageSources[key]?.path ?? '';
}

function altFor(path) {
	const alt = pagesFile.alt?.[path];
	if (!alt) throw new Error(`No alt text recorded for ${path}; add it to migration/pages.json`);
	return text(alt);
}

const unported = new Set();

function pdfPath(pathname) {
	return pdfSources[decodeURI(pathname).replace(/^\/+/, '')]?.path ?? '';
}

function rewriteHref(href) {
	const raw = text(href).trim();
	if (!SELF_ORIGIN.test(raw)) return { href: raw, internal: false };
	const url = new URL(raw);
	if (WP_UPLOADS.test(url.pathname)) {
		const path = pdfPath(url.pathname);
		return path ? { href: path, internal: true } : { href: '', internal: false };
	}
	const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
	if (!existsSync(`${CONTENT_DIR}/${path.slice(1, -1)}.json`)) {
		unported.add(path);
		return { href: raw, internal: false };
	}
	return { href: `${path}${url.search}`, internal: true };
}

function retire(href) {
	const raw = text(href ?? '').trim();
	if (!SELF_ORIGIN.test(raw)) return raw;
	const url = new URL(raw);
	const replacement = RETIRED_LINKS[url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`];
	if (!replacement) return raw;
	url.pathname = replacement;
	return url.href;
}

function linkMark(el) {
	const { href, internal } = rewriteHref(retire(el.getAttribute('href')));
	if (!href) return null;
	const target = internal ? null : el.getAttribute('target') || null;
	return {
		type: 'link',
		attrs: { href, target, rel: target ? el.getAttribute('rel') || null : null, title: null, class: null }
	};
}

function mergeText(nodes) {
	const merged = [];
	for (const node of nodes) {
		const last = merged.at(-1);
		if (
			node.type === 'text' &&
			last?.type === 'text' &&
			JSON.stringify(last.marks ?? []) === JSON.stringify(node.marks ?? [])
		) {
			last.text += node.text;
		} else {
			merged.push(node);
		}
	}
	return merged;
}

function inlineNodes(el, marks = []) {
	const out = [];
	for (const child of el.childNodes) {
		if (child.nodeType === 3) {
			const value = text(child.text);
			if (value) out.push(marks.length ? { type: 'text', marks, text: value } : { type: 'text', text: value });
			continue;
		}
		if (child.nodeType !== 1) continue;
		const tag = child.tagName;
		if (tag === 'BR') {
			out.push({ type: 'hardBreak' });
		} else if (tag === 'A') {
			const mark = linkMark(child);
			out.push(...inlineNodes(child, mark ? [...marks, mark] : marks));
		} else if (MARK_TAGS.has(tag)) {
			out.push(...inlineNodes(child, [...marks, { type: MARK_TAGS.get(tag) }]));
		} else {
			out.push(...inlineNodes(child, marks));
		}
	}
	return mergeText(out);
}

function trimInline(nodes) {
	const out = nodes.slice();
	while (out.length && out[0].type === 'hardBreak') out.shift();
	while (out.length && out.at(-1).type === 'hardBreak') out.pop();
	if (out[0]?.type === 'text') out[0].text = out[0].text.replace(/^\s+/, '');
	if (out.at(-1)?.type === 'text') out.at(-1).text = out.at(-1).text.replace(/\s+$/, '');
	return out.filter((node) => node.type !== 'text' || node.text.length);
}

function paragraph(el) {
	const content = trimInline(inlineNodes(el));
	return content.length ? { type: 'paragraph', content } : null;
}

function heading(el, level) {
	const content = trimInline(inlineNodes(el));
	return content.length ? { type: 'heading', attrs: { level }, content } : null;
}

function list(el) {
	const items = [];
	for (const li of el.querySelectorAll(':scope > li')) {
		const content = trimInline(inlineNodes(li));
		if (content.length) items.push({ type: 'listItem', content: [{ type: 'paragraph', content }] });
	}
	if (!items.length) return null;
	return { type: el.tagName === 'OL' ? 'orderedList' : 'bulletList', content: items };
}

function detailList(el) {
	const items = el.querySelectorAll('.detail-container').map((container) => {
		const label = text(container.querySelector('.detail-label')?.text ?? '').trim();
		const value = text(container.querySelector('.detail-value')?.text ?? '').trim();
		if (!label || !value) return null;
		return {
			type: 'listItem',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', marks: [{ type: 'bold' }], text: `${label}: ` },
						{ type: 'text', text: value }
					]
				}
			]
		};
	});
	const content = items.filter(Boolean);
	return content.length ? { type: 'bulletList', content } : null;
}

function flowNode(el) {
	const tag = el.tagName;
	if (tag === 'P') return detailList(el) ?? paragraph(el);
	if (tag === 'BLOCKQUOTE') {
		const inner = el.childNodes.filter((n) => n.nodeType === 1 && FLOW_TAGS.has(n.tagName)).map(flowNode);
		const content = inner.filter(Boolean);
		return content.length ? { type: 'blockquote', content } : null;
	}
	if (tag === 'UL' || tag === 'OL') return list(el);
	return heading(el, Math.min(4, Math.max(2, Number(tag.slice(1)))));
}

function soundcloudBlock(src) {
	const url = new URL(src, 'https://w.soundcloud.com/');
	const resourceUrl = url.searchParams.get('url') ?? '';
	const match = /api\.soundcloud\.com\/(track|playlist)s\/(\d+)/.exec(resourceUrl);
	if (!match) return null;
	return {
		type: 'soundcloud',
		attrs: { resource: match[1], soundcloudId: match[2], title: '' }
	};
}

function figureBlock(wrapper) {
	const img = wrapper.querySelector('img');
	const path = mediaPath(img?.getAttribute('data-guid') || img?.getAttribute('src'));
	if (!path) return null;
	const caption = text(wrapper.querySelector('figcaption')?.text ?? '').trim();
	return { type: 'figure', attrs: { path, alt: altFor(path), caption } };
}

function tileText(tile, anchor) {
	const title = anchor?.getAttribute('data-title') ?? tile.querySelector('.t-entry-title')?.text ?? '';
	const caption = anchor?.getAttribute('data-caption') ?? tile.querySelector('.t-entry-meta')?.text ?? '';
	return {
		title: text(title).replace(/\s+/g, ' ').trim(),
		caption: text(caption).replace(/\s+/g, ' ').trim()
	};
}

function galleryItem(tile) {
	const anchor = tile.querySelector('a.pushed[data-lbox]');
	const iframe = tile.querySelector('iframe');
	const href = anchor?.getAttribute('href') ?? '';
	const { title, caption } = tileText(tile, anchor);

	const vimeoId = (VIMEO_URL.exec(href) ?? VIMEO_URL.exec(iframe?.getAttribute('src') ?? ''))?.[1];
	if (vimeoId) {
		const poster = vimeoPosters[vimeoId];
		return {
			kind: 'vimeo',
			path: '',
			vimeoId,
			poster: poster?.path ?? '',
			title: title || text(poster?.title ?? '').trim(),
			caption
		};
	}

	const path = anchor && (mediaPath(href) || mediaPath(tile.querySelector('img')?.getAttribute('data-guid')));
	return path ? { kind: 'image', path, vimeoId: '', poster: '', title, caption } : null;
}

function cardBlock(tile) {
	const anchor = tile.querySelector('.t-entry-title a') ?? tile.querySelector('a.pushed[href]');
	const { href, internal } = rewriteHref(anchor?.getAttribute('href'));
	const image = mediaPath(tile.querySelector('img')?.getAttribute('data-guid'));
	if (!internal || !image) return null;
	const { title } = tileText(tile, null);
	return {
		type: 'card',
		attrs: {
			image,
			alt: altFor(image),
			title,
			blurb: text(tile.querySelector('.t-entry-excerpt')?.text ?? '').replace(/\s+/g, ' ').trim(),
			link: href,
			externalUrl: ''
		}
	};
}

function mediaGroup(container) {
	const tiles = container.querySelectorAll('.tmb');
	const items = tiles.map(galleryItem).filter(Boolean);
	if (items.length > 0) return { type: 'gallery', attrs: { commentary: '', items } };

	const cards = tiles.map(cardBlock).filter(Boolean);
	if (cards.length === 0) return null;
	return { type: 'cardRow', attrs: { columns: Math.min(Math.max(cards.length, 2), 3) }, content: cards };
}

function singleMedia(wrapper) {
	const iframe = wrapper.querySelector('iframe');
	const anchor = wrapper.querySelector('a.pushed[data-lbox]');
	const vimeoId = (
		VIMEO_URL.exec(iframe?.getAttribute('src') ?? '') ??
		VIMEO_URL.exec(anchor?.getAttribute('href') ?? '')
	)?.[1];
	if (!vimeoId) return figureBlock(wrapper);
	const poster = vimeoPosters[vimeoId];
	const tile = wrapper.querySelector('.tmb');
	const { title, caption } = tile ? tileText(tile, anchor) : { title: '', caption: '' };
	return {
		type: 'gallery',
		attrs: {
			commentary: '',
			items: [
				{
					kind: 'vimeo',
					path: '',
					vimeoId,
					poster: poster?.path ?? '',
					title: title || text(iframe?.getAttribute('title') ?? poster?.title ?? '').trim(),
					caption
				}
			]
		}
	};
}

function splitHeadingLines(source) {
	const spans = source.childNodes.filter((node) => node.nodeType === 1 && node.tagName === 'SPAN');
	for (const span of spans.slice(1)) span.insertAdjacentHTML('beforebegin', '<br>');
}

function extractBody(root) {
	const blocks = [];
	let run = [];
	let label = false;

	const flush = () => {
		if (run.length) blocks.push({ type: 'prose', content: run });
		run = [];
	};
	const write = (node) => {
		run.push(node);
		label = false;
	};
	const push = (block) => {
		if (!block) {
			if (label) run.pop();
			label = false;
			return;
		}
		const previous = blocks.at(-1);
		if (block.type === 'gallery' && run.length === 0 && previous?.type === 'gallery') {
			previous.attrs.items.push(...block.attrs.items);
			return;
		}
		flush();
		blocks.push(block);
		label = false;
	};

	const walk = (el) => {
		for (const child of el.childNodes) {
			if (child.nodeType !== 1) continue;
			const tag = child.tagName;
			if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
			const classes = child.getAttribute('class') ?? '';

			if (classes.includes('row-container') && child.querySelector('a[href^="mailto:"]')) continue;

			if (classes.includes('vc_custom_heading_wrap')) {
				const source = child.querySelector('h1, h2, h3, h4, h5, h6');
				if (!source) continue;
				splitHeadingLines(source);
				const level = Math.min(4, Math.max(2, Number(source.tagName.slice(1))));
				const node =
					text(source.text).trim().length > HEADING_TEXT_LIMIT
						? paragraph(source)
						: heading(source, level);
				if (node) {
					write(node);
					label = node.type === 'heading';
				}
			} else if (classes.includes('owl-carousel-wrapper') || classes.includes('isotope-system')) {
				push(mediaGroup(child));
			} else if (classes.includes('uncode-single-media')) {
				push(singleMedia(child));
			} else if (tag === 'IFRAME') {
				const src = child.getAttribute('src') ?? '';
				if (src.includes('soundcloud.com')) push(soundcloudBlock(src));
			} else if (FLOW_TAGS.has(tag)) {
				const node = flowNode(child);
				if (node) write(node);
			} else {
				walk(child);
			}
		}
	};

	walk(root);
	flush();
	return blocks;
}

function repoint(blocks, slug) {
	const repointing = REPOINTED_PROSE[slug];
	if (!repointing) return;
	const { phrase, href } = repointing;
	const mark = { type: 'link', attrs: { href, target: null, rel: null, title: null, class: null } };

	const link = (nodes) => {
		for (const [index, node] of nodes.entries()) {
			if (node.type !== 'text') {
				if (node.content && link(node.content)) return true;
				continue;
			}
			const at = node.text.indexOf(phrase);
			if (at === -1 || node.marks?.length) continue;
			const parts = [
				{ type: 'text', text: node.text.slice(0, at) },
				{ type: 'text', marks: [mark], text: phrase },
				{ type: 'text', text: node.text.slice(at + phrase.length) }
			].filter((part) => part.text.length > 0);
			nodes.splice(index, 1, ...parts);
			return true;
		}
		return false;
	};

	for (const block of blocks) {
		if (block.content && link(block.content)) return;
	}
	throw new Error(`${slug}: no unlinked mention of "${phrase}" to repoint at ${href}`);
}

function heroBlock(document, title) {
	const banner = document.querySelector('#page-header .header-bg');
	const path = mediaPath(banner?.getAttribute('data-guid'));
	if (!path) return null;
	const headline = text(document.querySelector('#page-header .header-title')?.text ?? '').trim();
	return {
		type: 'hero',
		attrs: { image: path, alt: altFor(path), eyebrow: '', headline: headline || title, lede: '' }
	};
}

function readSource(file) {
	return readFileSync(`${SOURCE_DIR}/${file}.html`, 'utf8').replace(
		/\b(data-title|data-caption)="(.*?)"(?=\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*\s*=|\s*\/?>)/gs,
		(_, name, value) => `${name}="${value.replaceAll('"', '&quot;')}"`
	);
}

function absorb(blocks, slug) {
	const source = extractBody(parse(readSource(slug)).querySelector('.post-content'));
	const items = source.filter((block) => block.type === 'gallery').flatMap((block) => block.attrs.items);
	if (items.length === 0) return;

	const target = blocks.findLast((block) => block.type === 'gallery');
	if (!target) {
		blocks.push({ type: 'gallery', attrs: { commentary: '', items } });
		return;
	}
	const held = new Set(target.attrs.items.map((item) => item.path || item.vimeoId));
	target.attrs.items.push(...items.filter((item) => !held.has(item.path || item.vimeoId)));
}

function portfolioBody(document) {
	const body = document.querySelector('.portfolio-body');
	const sidebar = body.querySelector('.col-widgets-sidebar');
	const info = sidebar.querySelector('.info-content');
	for (const el of info.querySelectorAll('.post-title-wrapper, .post-footer')) el.remove();
	const prose = extractBody(info);
	sidebar.remove();
	return [...prose, ...extractBody(body)];
}

function extract(slug) {
	const page = pagesFile.pages[slug];
	const document = parse(readSource(page?.source ?? slug));
	const rawTitle = text(document.querySelector('title')?.text ?? '').trim();
	const title = rawTitle.endsWith(TITLE_SUFFIX) ? rawTitle.slice(0, -TITLE_SUFFIX.length) : rawTitle;
	const description = text(page?.description ?? '').trim();
	if (!title || !description) throw new Error(`${slug}: both a title and a description are required`);

	const hero = heroBlock(document, title);
	const body = document.querySelector('.post-content')
		? extractBody(document.querySelector('.post-content'))
		: portfolioBody(document);
	for (const source of ABSORBED[slug] ?? []) absorb(body, source);
	repoint(body, slug);

	return {
		type: 'doc',
		version: CURRENT_DOCUMENT_VERSION,
		meta: { title, description, ...SITE_WIDE_META },
		content: hero ? [hero, ...body] : body
	};
}

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(pagesFile.pages);
for (const slug of slugs) {
	const document = extract(slug);
	const file = `${CONTENT_DIR}/${slug}.json`;
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
	console.log(`${slug}: ${document.content.length} blocks`);
}

for (const path of [...unported].sort()) {
	console.warn(`not ported yet, link left absolute: ${path}`);
}

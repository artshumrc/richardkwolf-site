#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const build = resolve(root, 'build');
const routesPath = resolve(import.meta.dirname, 'legacy-routes.json');

const origin = (process.env.PUBLIC_SITE_ORIGIN || 'https://www.richardkwolf.com').replace(/\/+$/, '');
const base = process.env.BASE_PATH ?? '';

const SITE_NAME = 'Richard K. Wolf';

const escapeHtml = (value) =>
	value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

const pagePath = (route) =>
	route === '/' ? join(build, 'index.html') : join(build, route.slice(1), 'index.html');

function existsAsPage(route) {
	try {
		readFileSync(pagePath(route));
		return true;
	} catch {
		return false;
	}
}

function htmlFiles(directory) {
	return readdirSync(directory, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
		.map((entry) => join(entry.parentPath, entry.name));
}

function redirectPage(source, target) {
	const canonical = `${origin}${base}${target}`;
	const href = escapeHtml(`${base}${target}`);
	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Redirecting ${escapeHtml(source)} · ${SITE_NAME}</title>
		<meta name="description" content="${escapeHtml(source)} has moved to ${escapeHtml(target)}.">
		<meta name="robots" content="noindex">
		<meta http-equiv="refresh" content="0; url=${href}">
		<link rel="canonical" href="${escapeHtml(canonical)}">
	</head>
	<body>
		<p>This page has moved to <a href="${href}">${escapeHtml(canonical)}</a>.</p>
	</body>
</html>
`;
}

const legacyRoutes = Object.entries(JSON.parse(readFileSync(routesPath, 'utf8')));

const sources = new Set(legacyRoutes.map(([source]) => source));
for (const [source, target] of legacyRoutes) {
	if (sources.has(target)) {
		throw new Error(`Legacy route ${source} chains to another redirect: ${target}`);
	}
	if (!existsAsPage(target)) {
		throw new Error(`Legacy route ${source} points at ${target}, which is not a built page`);
	}
	if (existsAsPage(source)) {
		throw new Error(`Legacy route ${source} would overwrite a real page`);
	}
}

for (const [source, target] of legacyRoutes) {
	const path = pagePath(source);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, redirectPage(source, target));
}

writeFileSync(join(build, '404.html'), readFileSync(join(build, '404', 'index.html')));

const canonicalUrls = new Set();
const titles = new Map();
for (const path of htmlFiles(build)) {
	const html = readFileSync(path, 'utf8');
	const canonical = html.match(/<link rel="canonical" href="([^"]+)"/u)?.[1];
	if (!canonical || html.includes('http-equiv="refresh"')) continue;
	const title = html.match(/<title>([^<]*)<\/title>/u)?.[1]?.trim();
	const description = html.match(/<meta name="description" content="([^"]*)"/u)?.[1]?.trim();
	if (!title) throw new Error(`${path} has no title`);
	if (!description) throw new Error(`${path} has no description`);
	if (titles.has(title)) throw new Error(`Title "${title}" is shared by ${titles.get(title)} and ${path}`);
	titles.set(title, path);
	canonicalUrls.add(canonical);
}

const urls = [...canonicalUrls].sort();
writeFileSync(
	join(build, 'sitemap.xml'),
	`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `\t<url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}
</urlset>
`
);
writeFileSync(
	join(build, 'robots.txt'),
	`User-agent: *\nAllow: /\nSitemap: ${origin}${base}/sitemap.xml\n`
);

console.log(
	`static-files: ${legacyRoutes.length} legacy routes, ${urls.length} canonical URLs, 404.html, robots.txt`
);

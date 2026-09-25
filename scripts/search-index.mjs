#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import * as pagefind from 'pagefind';

const build = resolve(import.meta.dirname, '..', 'build');
const marker = 'data-pagefind-body';

function markedPages() {
	return readdirSync(build, { recursive: true, withFileTypes: true }).filter(
		(entry) =>
			entry.isFile() &&
			entry.name.endsWith('.html') &&
			readFileSync(join(entry.parentPath, entry.name), 'utf8').includes(marker)
	).length;
}

function indexedPages(output) {
	const entry = JSON.parse(readFileSync(join(output, 'pagefind-entry.json'), 'utf8'));
	return Object.values(entry.languages).reduce((total, language) => total + language.page_count, 0);
}

if (!existsSync(build)) throw new Error('Pagefind runs after Vite has written build/');
const declared = markedPages();
if (declared === 0) throw new Error(`No built reader page declares ${marker}`);

const output = join(build, 'pagefind');
rmSync(output, { recursive: true, force: true });
const { errors: createErrors, index } = await pagefind.createIndex();
if (createErrors.length || !index) {
	throw new Error(`Could not start Pagefind: ${createErrors.join('; ')}`);
}

try {
	const { errors: addErrors } = await index.addDirectory({ path: build });
	if (addErrors.length) throw new Error(`Pagefind indexing failed: ${addErrors.join('; ')}`);
	const { errors: writeErrors } = await index.writeFiles({ outputPath: output });
	if (writeErrors.length) throw new Error(`Pagefind output failed: ${writeErrors.join('; ')}`);
	const indexed = indexedPages(output);
	if (indexed !== declared) {
		throw new Error(
			`${declared} reader pages declare search scope, but Pagefind indexed ${indexed}`
		);
	}
	console.log(`search-index: ${indexed} reader pages -> ${relative('.', output)}`);
} finally {
	await pagefind.close();
}

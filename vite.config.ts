import { sveltekit } from '@sveltejs/kit/vite';
import { uncialCms } from 'uncial-cms/vite';
import { defineConfig } from 'vite';
import { siteOptions } from './src/lib/site.js';

export default defineConfig({
	plugins: [...uncialCms(siteOptions), sveltekit()]
});

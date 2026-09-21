import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build'
		}),
		paths: {
			base: process.env.BASE_PATH ?? '',
			relative: false
		},
		prerender: {
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;

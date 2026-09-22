import { createReadStream, statSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { uncialCms } from 'uncial-cms/vite';
import { defineConfig, type Plugin } from 'vite';
import { siteOptions } from './src/lib/site.js';

const pagefindContentTypes: Record<string, string> = {
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.pagefind': 'application/wasm'
};

/**
 * Serves the Pagefind bundle in development. The index is build output, so the
 * dev server has nothing to serve from `static/`; this hands it the files
 * `pnpm dev`'s preceding build wrote to `build/pagefind`.
 */
function pagefindDevAssets(): Plugin {
	const root = resolve('build/pagefind');
	// The dev server honours BASE_PATH as the build does, so the prefix the
	// client asks under has to be stripped before the path is resolved.
	const prefix = `${(process.env.BASE_PATH ?? '').replace(/\/+$/, '')}/pagefind/`;

	return {
		name: 'rkw:pagefind-dev-assets',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				const requestPath = request.url?.split('?', 1)[0] ?? '';
				if (!requestPath.startsWith(prefix)) return next();

				let requestedPath: string;
				try {
					requestedPath = decodeURIComponent(requestPath.slice(prefix.length));
				} catch {
					response.writeHead(400).end();
					return;
				}

				const path = resolve(root, requestedPath);
				const fromRoot = relative(root, path);
				if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
					response.writeHead(400).end();
					return;
				}

				try {
					if (!statSync(path).isFile()) {
						response.writeHead(404).end();
						return;
					}
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
						response.writeHead(404).end();
						return;
					}
					return next(error);
				}

				response.writeHead(200, {
					'Content-Type': pagefindContentTypes[extname(path)] ?? 'application/octet-stream'
				});
				if (request.method === 'HEAD') {
					response.end();
					return;
				}
				createReadStream(path).pipe(response);
			});
		}
	};
}

export default defineConfig({
	plugins: [...uncialCms(siteOptions), pagefindDevAssets(), sveltekit()],
	// `pnpm dev` builds first so the middleware above has a bundle to serve;
	// nothing under build/ is source, so keep its ~1k files out of the
	// watcher's inotify budget.
	server: { watch: { ignored: ['**/build/**'] } }
});

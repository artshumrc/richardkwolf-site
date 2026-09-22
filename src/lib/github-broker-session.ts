// Sign-in for the deployed editor, against the org's shared broker.
//
// uncial-cms ships a provider for its own auth worker, which mints an
// installation token over a PKCE popup. The broker this site signs in through
// is the artshumrc Lambda (`artshumrc/infrastructure`, `github_broker/`), which
// does one thing: exchange an authorisation code for a user-to-server token,
// because `github.com/login/oauth/access_token` sends no CORS headers and a
// browser cannot make that call itself. Every other request the editor makes
// goes straight to `api.github.com`, which allows any origin. The two brokers'
// wire protocols do not meet, so this provider speaks the Lambda's.

import { base } from '$app/paths';
import type { ForgeSession, GitHubSiteConfig, SessionProvider, UncialCmsSiteConfig } from 'uncial-cms';

/** The shared broker, and the App whose secret it holds. Repoint both together. */
const BROKER_ORIGIN = 'https://github-broker.darthcrimson.org';
const CLIENT_ID = 'Iv23liRxexPEW2AKFG12';

/** Where the App is installed and granted access to this repository. */
export const APP_SLUG = 'aws-lambda-broker';

/** Names this site's own callback message, so no other page's can be mistaken for it. */
const RELAY = 'richardkwolf-github-auth';

/** What the callback page posts back to the window that opened it. */
export interface RelayMessage {
	source: typeof RELAY;
	code: string;
	state: string;
	error: string;
	errorDescription: string;
}

export const RELAY_SOURCE = RELAY;

/** The page GitHub returns to, which exists only to relay and close. */
function callbackUrl(): string {
	return `${window.location.origin}${base}/auth/callback/`;
}

function waitForRelay(popup: Window, state: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			window.removeEventListener('message', onMessage);
			clearInterval(closedPoll);
		};

		const onMessage = (event: MessageEvent) => {
			// The callback page is served from this origin, so anything from
			// elsewhere is not it.
			if (event.origin !== window.location.origin) return;
			const data = event.data as Partial<RelayMessage> | null;
			if (data?.source !== RELAY || typeof data.state !== 'string') return;
			// The whole of the cross-site request forgery protection on a flow
			// GitHub gives no PKCE: a callback this window did not ask for.
			if (data.state !== state) return;
			cleanup();
			if (data.error) {
				reject(new Error(data.errorDescription || `GitHub refused the sign-in (${data.error}).`));
				return;
			}
			if (typeof data.code !== 'string' || data.code === '') {
				reject(new Error('GitHub returned no authorisation code.'));
				return;
			}
			resolve(data.code);
		};

		const closedPoll = setInterval(() => {
			if (!popup.closed) return;
			cleanup();
			reject(new Error('The sign-in popup was closed before completing.'));
		}, 500);

		window.addEventListener('message', onMessage);
	});
}

interface TokenResponse {
	access_token?: string;
	expires_in?: number;
	error?: string;
	error_description?: string;
}

async function exchange(code: string, redirectUri: string): Promise<{ token: string; expiresAt: number | null }> {
	let response: Response;
	try {
		response = await fetch(`${BROKER_ORIGIN}/github/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ client_id: CLIENT_ID, code, redirect_uri: redirectUri })
		});
	} catch {
		throw new Error('The sign-in service could not be reached. Nothing has been signed in to.');
	}

	const body = (await response.json().catch(() => ({}))) as TokenResponse;
	// The broker passes GitHub's status through, and GitHub answers 200 for a
	// refusal, so the body decides rather than the status.
	if (!body.access_token) {
		throw new Error(body.error_description || `Sign-in failed (${body.error ?? response.status}).`);
	}
	return {
		token: body.access_token,
		expiresAt: body.expires_in ? Date.now() + body.expires_in * 1000 : null
	};
}

async function readUser(token: string): Promise<ForgeSession['user']> {
	const response = await fetch('https://api.github.com/user', {
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});
	if (!response.ok) throw new Error(`GitHub rejected the new token (${response.status}).`);
	const user = (await response.json()) as { login: string; id: number; name: string | null };
	return {
		login: user.login,
		name: user.name ?? user.login,
		// The address GitHub attributes a commit to without publishing anything.
		email: `${user.id}+${user.login}@users.noreply.github.com`
	};
}

function isGitHubConfig(config: UncialCmsSiteConfig): config is GitHubSiteConfig {
	return config.forge === 'github';
}

/**
 * Opens GitHub's authorisation screen in a popup, takes the code its callback
 * relays back, and exchanges it at the broker for a token the editor commits
 * with. The token is the signed-in user's own, so what they may edit is what
 * they may already push.
 */
export const brokerSessionProvider: SessionProvider = async (config) => {
	if (!isGitHubConfig(config)) throw new Error('The broker signs in to a GitHub Forge only.');

	const redirectUri = callbackUrl();
	const state = crypto.randomUUID();
	const authorize = new URL('https://github.com/login/oauth/authorize');
	authorize.searchParams.set('client_id', CLIENT_ID);
	authorize.searchParams.set('redirect_uri', redirectUri);
	authorize.searchParams.set('state', state);

	const popup = window.open(authorize.toString(), 'uncial-cms-auth', 'popup,width=640,height=760');
	if (!popup) throw new Error('The sign-in popup was blocked; allow popups for this site.');

	try {
		const code = await waitForRelay(popup, state);
		const { token, expiresAt } = await exchange(code, redirectUri);
		return { token, expiresAt, repo: config.repo, user: await readUser(token) };
	} finally {
		if (!popup.closed) popup.close();
	}
};

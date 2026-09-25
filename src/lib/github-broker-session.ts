import { base } from '$app/paths';
import type { ForgeSession, GitHubSiteConfig, SessionProvider, UncialCmsSiteConfig } from 'uncial-cms';

const BROKER_ORIGIN = 'https://github-broker.darthcrimson.org';
const CLIENT_ID = 'Iv23liRxexPEW2AKFG12';

export const APP_SLUG = 'aws-lambda-broker';

const RELAY = 'richardkwolf-github-auth';

export interface RelayMessage {
	source: typeof RELAY;
	code: string;
	state: string;
	error: string;
	errorDescription: string;
}

export const RELAY_SOURCE = RELAY;

function callbackUrl(): string {
	return `${window.location.origin}${base}/auth/callback/`;
}

function pressToSignIn(): Promise<void> {
	return new Promise((resolve) => {
		const overlay = document.createElement('div');
		overlay.className = 'broker-sign-in';
		const button = document.createElement('button');
		button.type = 'button';
		button.textContent = 'Sign in with GitHub';
		button.addEventListener('click', () => {
			overlay.remove();
			resolve();
		});
		overlay.append(button);
		document.body.append(overlay);
		button.focus();
	});
}

function waitForRelay(popup: Window, state: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			window.removeEventListener('message', onMessage);
			clearInterval(closedPoll);
		};

		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			const data = event.data as Partial<RelayMessage> | null;
			if (data?.source !== RELAY || typeof data.state !== 'string') return;
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
		email: `${user.id}+${user.login}@users.noreply.github.com`
	};
}

function isGitHubConfig(config: UncialCmsSiteConfig): config is GitHubSiteConfig {
	return config.forge === 'github';
}

export const brokerSessionProvider: SessionProvider = async (config) => {
	if (!isGitHubConfig(config)) throw new Error('The broker signs in to a GitHub Forge only.');

	const redirectUri = callbackUrl();
	const state = crypto.randomUUID();
	const authorize = new URL('https://github.com/login/oauth/authorize');
	authorize.searchParams.set('client_id', CLIENT_ID);
	authorize.searchParams.set('redirect_uri', redirectUri);
	authorize.searchParams.set('state', state);

	await pressToSignIn();
	const popup = window.open(authorize.toString(), 'uncial-cms-auth', 'popup,width=640,height=760');
	if (!popup) throw new Error('The sign-in window was blocked; allow popups for this site.');

	try {
		const code = await waitForRelay(popup, state);
		const { token, expiresAt } = await exchange(code, redirectUri);
		return { token, expiresAt, repo: config.repo, user: await readUser(token) };
	} finally {
		if (!popup.closed) popup.close();
	}
};

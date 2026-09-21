<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { navBranches } from '$lib/navigation.js';
	import { HAS_HOME_PAGE } from '$lib/site-routes.js';
	import { navItems, siteMeta } from '$lib/site-document.js';

	const branches = navBranches(navItems);

	// The Editor variant of a page is chrome for the same page, so it marks the
	// page it edits as current.
	const currentPath = $derived(
		`${page.url.pathname.slice(base.length).replace(/edit\/$/, '')}`.replace(/\/*$/, '/')
	);
</script>

<header class="masthead">
	{#if HAS_HOME_PAGE}
		<a class="masthead__brand" href="{base}/">{siteMeta.siteName}</a>
	{:else}
		<span class="masthead__brand">{siteMeta.siteName}</span>
	{/if}
	<nav class="masthead__nav" aria-label="Main">
		<ul class="menu">
			{#each branches as branch (branch.item.label)}
				<li class="menu__item">
					<a
						href="{base}{branch.item.link}"
						aria-current={branch.item.link === currentPath ? 'page' : undefined}
					>
						{branch.item.label}
					</a>
					{#if branch.children.length > 0}
						<ul class="submenu">
							{#each branch.children as child (child.label)}
								<li>
									<a
										href="{base}{child.link}"
										aria-current={child.link === currentPath ? 'page' : undefined}
									>
										{child.label}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
</header>

<style>
	.masthead {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 1.5rem;
		padding: 1rem var(--page-gutter);
		border-bottom: 1px solid var(--rule);
		background: var(--surface);
	}

	.masthead__brand {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: inherit;
		text-decoration: none;
	}

	.menu,
	.submenu {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.menu__item {
		position: relative;
	}

	.menu a {
		display: block;
		padding: 0.35rem 0;
		border-top: 3px solid transparent;
		color: inherit;
		font-family: var(--font-ui);
		font-size: 0.9375rem;
		text-decoration: none;
	}

	.menu a:hover,
	.menu a:focus-visible,
	.menu a[aria-current='page'] {
		border-top-color: var(--accent);
	}

	/* The submenu stays in the tab order while hidden — clipping it rather than
	   removing it is what lets focusing the parent link reveal it, since
	   `visibility: hidden` would make the parent's :focus-within unreachable. */
	.submenu {
		position: absolute;
		z-index: 10;
		top: 100%;
		left: 0;
		display: block;
		min-width: 16rem;
		padding: 0.25rem 0.75rem 0.5rem;
		border: 1px solid var(--rule);
		background: var(--surface);
		opacity: 0;
		transform: translateY(-0.25rem);
		pointer-events: none;
	}

	.menu__item:hover > .submenu,
	.menu__item:focus-within > .submenu {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	@media (max-width: 47.9375rem) {
		/* No room to overlay a submenu, and no header JavaScript to toggle one:
		   both levels are simply stacked. */
		.menu {
			flex-direction: column;
			gap: 0;
		}

		.submenu {
			position: static;
			min-width: 0;
			padding: 0 0 0 1rem;
			border: 0;
			background: none;
			opacity: 1;
			transform: none;
			pointer-events: auto;
		}
	}
</style>

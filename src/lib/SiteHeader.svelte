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

	// The header survives a client-side navigation, so an opened disclosure would
	// otherwise still be covering the page the reader just asked for.
	let menuOpen = $state(false);
</script>

<header class="masthead">
	{#if HAS_HOME_PAGE}
		<a class="masthead__brand" href="{base}/">{siteMeta.siteName}</a>
	{:else}
		<span class="masthead__brand">{siteMeta.siteName}</span>
	{/if}
	<!-- A native disclosure, so the menu collapses on a phone and opens on a tap
	     without a scripted toggle. Where there is room and a pointer, CSS hides
	     the summary and holds the menu open as a horizontal bar. -->
	<details class="masthead__menu" bind:open={menuOpen}>
		<summary class="masthead__toggle">Menu</summary>
		<nav class="masthead__nav" aria-label="Main">
			<ul class="menu">
				{#each branches as branch (branch.item.label)}
					<li class="menu__item">
						<a
							href="{base}{branch.item.link}"
							aria-current={branch.item.link === currentPath ? 'page' : undefined}
							onclick={() => (menuOpen = false)}
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
											onclick={() => (menuOpen = false)}
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
	</details>
</header>

<style>
	/* Mobile-first, and keyed on `hover` as well as width: a wide touch screen
	   needs the disclosure too, since it can never open a hover submenu. */
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

	.masthead__menu {
		flex-basis: 100%;
	}

	.masthead__toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		font-family: var(--font-ui);
		font-size: 0.9375rem;
		list-style: none;
		cursor: pointer;
	}

	.masthead__toggle::-webkit-details-marker {
		display: none;
	}

	.masthead__toggle::after {
		content: '';
		width: 0.5rem;
		height: 0.5rem;
		border-right: 2px solid currentcolor;
		border-bottom: 2px solid currentcolor;
		transform: translateY(-0.15rem) rotate(45deg);
	}

	.masthead__menu[open] > .masthead__toggle::after {
		transform: translateY(0.1rem) rotate(225deg);
	}

	.menu,
	.submenu {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.submenu {
		padding-inline-start: 1rem;
	}

	.menu a {
		display: block;
		/* Padding, not a fixed height: a two-line label on a phone keeps its
		   own tap area rather than being clipped. */
		padding: 0.7rem 0;
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

	@media (min-width: 48rem) and (hover: hover) {
		.masthead__menu {
			flex-basis: auto;
		}

		.masthead__toggle {
			display: none;
		}

		/* Hold the disclosure open. The pseudo-element is the standard route;
		   the rule below it covers engines that still hide the slot instead. */
		.masthead__menu::details-content {
			content-visibility: visible;
			block-size: auto;
		}

		.masthead__menu > .masthead__nav {
			display: block;
		}

		.menu {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0 1.25rem;
		}

		.menu__item {
			position: relative;
		}

		.menu a {
			padding: 0.35rem 0;
		}

		/* The submenu stays in the tab order while hidden — clipping it rather
		   than removing it is what lets focusing the parent link reveal it, since
		   `visibility: hidden` would make the parent's :focus-within
		   unreachable. */
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
	}
</style>

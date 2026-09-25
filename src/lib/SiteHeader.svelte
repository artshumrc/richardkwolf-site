<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { navTree, type NavNode } from '$lib/navigation.js';
	import { HAS_HOME_PAGE } from '$lib/site-routes.js';
	import { navItems, siteMeta } from '$lib/site-document.js';

	const tree = navTree(navItems);

	const currentPath = $derived(
		`${page.url.pathname.slice(base.length).replace(/edit\/$/, '')}`.replace(/\/*$/, '/')
	);

	const contains = (node: NavNode): boolean =>
		node.children.some((child) => child.item.link === currentPath || contains(child));

	let menuOpen = $state(false);
</script>

{#snippet items(nodes: NavNode[])}
	{#each nodes as node (node.item.label)}
		<li class="menu__item" class:menu__item--parent={node.children.length > 0}>
			<a
				href="{base}{node.item.link}"
				aria-current={node.item.link === currentPath ? 'page' : undefined}
				class:menu__link--within={contains(node)}
				onclick={() => (menuOpen = false)}
			>
				{node.item.label}
			</a>
			{#if node.children.length > 0}
				<ul class="submenu">
					{@render items(node.children)}
				</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<header class="masthead">
	{#if HAS_HOME_PAGE}
		<a class="masthead__brand" href="{base}/">{siteMeta.siteName}</a>
	{:else}
		<span class="masthead__brand">{siteMeta.siteName}</span>
	{/if}
	<details class="masthead__menu" bind:open={menuOpen}>
		<summary class="masthead__toggle">Menu</summary>
		<nav class="masthead__nav" aria-label="Main">
			<ul class="menu">
				{@render items(tree)}
				<li class="menu__item">
					<a
						href="{base}/search/"
						aria-current={currentPath === '/search/' ? 'page' : undefined}
						onclick={() => (menuOpen = false)}
					>
						Search
					</a>
				</li>
			</ul>
		</nav>
	</details>
</header>

<style>
	.masthead {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.5rem;
		padding: 1rem var(--page-gutter);
		border-bottom: 1px solid var(--rule);
		background: var(--surface);
		box-shadow: 0 4px 10px -10px rgb(0 0 0 / 0.6);
	}

	.masthead__brand {
		flex: none;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 400;
		color: var(--ink);
		white-space: nowrap;
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

	.menu__item--parent > a::after {
		content: '';
		display: inline-block;
		width: 0.375rem;
		height: 0.375rem;
		margin-inline-start: 0.4em;
		border-right: 1.5px solid currentcolor;
		border-bottom: 1.5px solid currentcolor;
		transform: translateY(-0.1em) rotate(45deg);
	}

	.menu a {
		display: block;
		padding: 0.7rem 0;
		color: var(--ink);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-decoration: none;
	}

	.menu a:hover,
	.menu a:focus-visible,
	.menu a[aria-current='page'],
	.menu a.menu__link--within {
		color: var(--accent);
	}

	@media (min-width: 56rem) and (hover: hover) {
		.masthead {
			flex-wrap: nowrap;
			align-items: stretch;
			justify-content: space-between;
			height: var(--masthead-height);
			padding-block: 0;
			padding-inline: max(var(--page-gutter), (100% - var(--limit)) / 2 + var(--page-gutter));
		}

		.masthead__brand {
			align-self: center;
		}

		.masthead__menu {
			display: flex;
			flex-basis: auto;
		}

		.masthead__toggle {
			display: none;
		}

		.masthead__menu::details-content {
			display: flex;
			content-visibility: visible;
			block-size: auto;
		}

		.masthead__menu > .masthead__nav {
			display: flex;
			align-items: stretch;
		}

		.menu {
			flex-direction: row;
			align-items: stretch;
			justify-content: flex-end;
			gap: 0 1.25rem;
		}

		@media (min-width: 64rem) {
			.menu {
				gap: 0 1.75rem;
			}
		}

		.menu__item {
			position: relative;
		}

		.menu > .menu__item {
			display: flex;
		}

		.menu > .menu__item > a {
			display: flex;
			align-items: center;
			padding: 0;
			border-top: 3px solid transparent;
		}

		.menu > .menu__item > a:hover,
		.menu > .menu__item > a:focus-visible,
		.menu > .menu__item > a[aria-current='page'],
		.menu > .menu__item > a.menu__link--within {
			border-top-color: var(--accent);
		}

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
			box-shadow: 0 6px 16px -12px rgb(0 0 0 / 0.6);
			opacity: 0;
			transform: translateY(-0.25rem);
			pointer-events: none;
		}

		.submenu .submenu {
			top: -0.25rem;
			left: 100%;
			transform: translateX(-0.25rem);
		}

		.submenu a {
			border-top: 0;
			padding: 0.35rem 0;
		}

		.submenu > .menu__item--parent > a {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.submenu > .menu__item--parent > a::after {
			flex: none;
			margin-inline: 0.5em 0.15em;
			transform: rotate(-45deg);
		}

		.menu__item:hover > .submenu,
		.menu__item:focus-within > .submenu {
			opacity: 1;
			transform: none;
			pointer-events: auto;
		}
	}
</style>

<script lang="ts">
	// The Site document's only Block. It renders no reader page — the header and
	// footer read the same attributes directly — so this is purely the canvas
	// view of what the attributes panel is editing.
	import { navBranches, type FooterLink, type NavItem } from '$lib/navigation.js';

	interface Props {
		items?: NavItem[];
		footerLinks?: FooterLink[];
	}

	let { items = [], footerLinks = [] }: Props = $props();

	const branches = $derived(navBranches(items));
</script>

<div class="navigation-preview">
	<p class="navigation-preview__note">
		The header menu and footer links, as the whole site will show them. Edit them in the
		attributes panel.
	</p>
	<ul class="navigation-preview__menu">
		{#each branches as branch (branch.item.label)}
			<li>
				{branch.item.label} <code>{branch.item.link}</code>
				{#if branch.children.length > 0}
					<ul>
						{#each branch.children as child (child.label)}
							<li>{child.label} <code>{child.link}</code></li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
	<p class="navigation-preview__note">Footer links</p>
	<ul class="navigation-preview__menu">
		{#each footerLinks as link (link.label)}
			<li>{link.label} <code>{link.link}</code></li>
		{/each}
	</ul>
</div>

<style>
	.navigation-preview {
		border: 1px dashed currentColor;
		padding: 1rem;
	}

	.navigation-preview__note {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		font-style: italic;
	}

	.navigation-preview__menu {
		margin: 0 0 1rem;
		padding-left: 1.25rem;
	}

	code {
		font-size: 0.8125rem;
		opacity: 0.7;
	}
</style>

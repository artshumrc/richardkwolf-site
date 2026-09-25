<script lang="ts">
	import { navTree, type FooterLink, type NavItem, type NavNode } from '$lib/navigation.js';

	interface Props {
		items?: NavItem[];
		footerLinks?: FooterLink[];
	}

	let { items = [], footerLinks = [] }: Props = $props();

	const tree = $derived(navTree(items));
</script>

{#snippet branch(nodes: NavNode[])}
	{#each nodes as node (node.item.label)}
		<li>
			{node.item.label} <code>{node.item.link}</code>
			{#if node.children.length > 0}
				<ul>{@render branch(node.children)}</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<div class="navigation-preview">
	<p class="navigation-preview__note">
		The header menu and footer links, as the whole site will show them. Edit them in the
		attributes panel.
	</p>
	<ul class="navigation-preview__menu">
		{@render branch(tree)}
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

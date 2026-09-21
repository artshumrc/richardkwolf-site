<script lang="ts">
	import { base } from '$app/paths';
	import { contactLines, footerLinks, siteMeta } from '$lib/site-document.js';
</script>

<footer class="colophon">
	<div class="colophon__columns">
		<nav aria-label="Footer">
			<ul>
				{#each footerLinks as link (link.label)}
					<li><a href="{base}{link.link}">{link.label}</a></li>
				{/each}
			</ul>
		</nav>
		<div>
			<p class="colophon__heading">Contact</p>
			<p><a href="mailto:{siteMeta.email}">{siteMeta.email}</a></p>
		</div>
		<address>
			{#each contactLines as line (line)}
				{line}<br />
			{/each}
		</address>
	</div>
	<p class="colophon__copyright">{siteMeta.copyright}</p>
</footer>

<style>
	.colophon {
		margin-top: 4rem;
		padding: 2.5rem var(--page-gutter) 1.5rem;
		background: var(--ink);
		color: var(--on-ink);
		font-family: var(--font-ui);
		font-size: 0.9375rem;
	}

	.colophon__columns {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		text-align: center;
	}

	.colophon__heading {
		margin: 0;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	p {
		margin: 0;
	}

	address {
		font-style: normal;
	}

	a {
		color: inherit;
	}

	.colophon__copyright {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid rgb(255 255 255 / 0.2);
		font-size: 0.875rem;
	}
</style>

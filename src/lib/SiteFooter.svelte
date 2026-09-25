<script lang="ts">
	import { base } from '$app/paths';
	import { contactLines, footerLinks, siteMeta } from '$lib/site-document.js';
</script>

<footer class="colophon">
	<div class="colophon__band">
		<div class="colophon__columns">
			<nav aria-label="Footer">
				<p class="colophon__heading">Resources</p>
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
	</div>
	<div class="colophon__foot">
		<p class="colophon__copyright">{siteMeta.copyright}</p>
	</div>
</footer>

<style>
	.colophon {
		margin-block-start: 4rem;
		color: var(--on-ink);
		font-size: 1rem;
	}

	.colophon__band {
		padding: 2.5rem 0;
		background: var(--footer);
	}

	.colophon__foot {
		padding: 1.5rem 0;
		background: var(--footer-foot);
	}

	.colophon__band > *,
	.colophon__foot > * {
		max-width: var(--limit);
		margin-inline: auto;
		padding-inline: var(--page-gutter);
	}

	.colophon__columns {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		text-align: center;
	}

	.colophon__heading {
		margin: 0;
		color: var(--body-ink);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
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
		color: var(--body-ink);
		font-style: normal;
	}

	a {
		color: inherit;
		font-weight: 400;
	}

	.colophon__copyright {
		font-size: 0.8125rem;
		text-align: center;
	}
</style>

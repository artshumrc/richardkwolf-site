<script lang="ts">
	interface Props {
		resource?: 'track' | 'playlist';
		soundcloudId?: string;
		title?: string;
	}

	let { resource = 'track', soundcloudId = '', title = '' }: Props = $props();

	let playing = $state(false);

	const widgetUrl = $derived(
		`https://w.soundcloud.com/player/?url=${encodeURIComponent(
			`https://api.soundcloud.com/${resource}s/${soundcloudId}`
		)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false`
	);
</script>

<div class="row soundcloud">
	{#if playing}
		<iframe
			class="soundcloud--{resource}"
			src={widgetUrl}
			title={title || 'SoundCloud recording'}
			allow="autoplay"
		></iframe>
	{:else}
		<button type="button" onclick={() => (playing = true)} disabled={!soundcloudId}>
			<span class="soundcloud__play" aria-hidden="true">▶</span>
			<span>{title || 'Listen on SoundCloud'}</span>
		</button>
	{/if}
</div>

<style>
	iframe {
		display: block;
		width: 100%;
		height: 166px;
		border: 0;
	}

	.soundcloud--playlist {
		height: 450px;
	}

	button {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		width: 100%;
		min-height: 5rem;
		padding: 1rem;
		border: 1px solid #d8d8d8;
		background: #f4f4f4;
		font: inherit;
		text-align: start;
		cursor: pointer;
	}

	.soundcloud__play {
		display: grid;
		place-items: center;
		flex: none;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: #1c1c1c;
		color: #fff;
		padding-left: 0.2em;
	}
</style>

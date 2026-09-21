<script lang="ts">
	// Shown on the canvas only once a link attribute is set to "external", so an
	// internal link stays a dropdown of real pages.
	interface Props {
		label: string;
		value: string;
		onChange: (url: string) => void;
	}

	let { label, value, onChange }: Props = $props();
</script>

<label class="external-url">
	{label}
	<input type="url" {value} oninput={(event) => onChange(event.currentTarget.value)} />
</label>

<style>
	.external-url {
		display: block;
		font-size: 0.875rem;
	}
</style>

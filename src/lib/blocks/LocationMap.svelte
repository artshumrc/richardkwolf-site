<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';

	interface Props {
		lat?: number;
		lng?: number;
		zoom?: number;
		label?: string;
	}

	let { lat = 0, lng = 0, zoom = 6, label = '' }: Props = $props();

	let host: HTMLDivElement;

	onMount(() => {
		let map: import('leaflet').Map | undefined;
		let cancelled = false;

		(async () => {
			const L = (await import('leaflet')).default;
			if (cancelled) return;
			map = L.map(host, { scrollWheelZoom: false }).setView([lat, lng], zoom);
			L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 12,
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(map);
			const marker = L.circleMarker([lat, lng], {
				radius: 7,
				weight: 2,
				color: '#990000',
				fillColor: '#990000',
				fillOpacity: 0.5
			}).addTo(map);
			if (label) marker.bindTooltip(label, { permanent: true, direction: 'right' });
		})();

		return () => {
			cancelled = true;
			map?.remove();
		};
	});
</script>

<div class="row">
	<div class="map" bind:this={host} role="img" aria-label={label ? `Map of ${label}` : 'Map'}></div>
</div>

<style>
	.map {
		height: 20rem;
		background: var(--rule);
	}
</style>

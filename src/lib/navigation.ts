// The navigation menu's shape, shared by the Block definition, the header and
// the footer.

export interface NavItem {
	label: string;
	/** A served page path from the generated link enum, never a typed URL. */
	link: string;
	/** The label of the item this one sits under; empty for a top-level item. */
	parent: string;
}

export interface FooterLink {
	label: string;
	link: string;
}

/** One menu item together with the items naming it as their parent. */
export interface NavNode {
	item: NavItem;
	children: NavNode[];
}

function isFilled(value: unknown): boolean {
	return typeof value === 'string' && value.trim().length > 0;
}

function hasLabelAndLink(value: unknown): value is { label: string; link: string } {
	if (typeof value !== 'object' || value === null) return false;
	const entry = value as Record<string, unknown>;
	return isFilled(entry.label) && isFilled(entry.link);
}

export function areNavItems(value: unknown): value is NavItem[] {
	return Array.isArray(value) && value.every(hasLabelAndLink);
}

export function areFooterLinks(value: unknown): value is FooterLink[] {
	return Array.isArray(value) && value.every(hasLabelAndLink);
}

/**
 * Whether putting `label` under `parentLabel` would close a loop — the parent
 * being the item itself, or sitting under it already.
 */
function wouldCycle(label: string, parentLabel: string, parentOf: Map<string, string>): boolean {
	const seen = new Set([label]);
	let at = parentLabel;
	while (at) {
		if (seen.has(at)) return true;
		seen.add(at);
		at = parentOf.get(at) ?? '';
	}
	return false;
}

/**
 * The flat list as the tree the header renders, nested as deeply as the items
 * name each other. An item whose `parent` matches no label, or whose parent
 * sits under it, is promoted to the top rather than dropped, so a mistyped
 * parent leaves the page reachable.
 */
export function navTree(items: NavItem[]): NavNode[] {
	const nodes = items.map((item) => ({ item, children: [] as NavNode[] }));
	// First of a duplicated label wins, so two items sharing a label cannot
	// make either one's children unreachable.
	const byLabel = new Map<string, NavNode>();
	for (const node of nodes) {
		if (!byLabel.has(node.item.label)) byLabel.set(node.item.label, node);
	}
	const parentOf = new Map([...byLabel].map(([label, node]) => [label, node.item.parent.trim()]));

	const roots: NavNode[] = [];
	for (const node of nodes) {
		const parentLabel = node.item.parent.trim();
		const parent = byLabel.get(parentLabel);
		if (parent && parent !== node && !wouldCycle(node.item.label, parentLabel, parentOf)) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}
	return roots;
}

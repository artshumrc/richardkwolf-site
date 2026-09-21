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

/** A top-level item together with the items naming it as their parent. */
export interface NavBranch {
	item: NavItem;
	children: NavItem[];
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
 * The flat list as the two levels the header renders. An item whose `parent`
 * matches no top-level label is promoted rather than dropped, so a mistyped
 * parent leaves the page reachable.
 */
export function navBranches(items: NavItem[]): NavBranch[] {
	const tops = items.filter((item) => !item.parent.trim());
	const topLabels = new Set(tops.map((item) => item.label));
	const branches = tops.map((item) => ({ item, children: [] as NavItem[] }));
	const byLabel = new Map(branches.map((branch) => [branch.item.label, branch]));

	for (const item of items) {
		const parent = item.parent.trim();
		if (!parent) continue;
		if (topLabels.has(parent)) byLabel.get(parent)?.children.push(item);
		else branches.push({ item, children: [] });
	}
	return branches;
}

interface RichNode {
	marks?: { type: string; attrs?: Record<string, unknown> }[];
	content?: RichNode[];
}

const INTERNAL = /^\/(?!\/)/;

export function withBasePaths<T extends RichNode | undefined>(document: T, base: string): T {
	if (!document || !base) return document;

	const rewrite = (node: RichNode): RichNode => {
		const marks = node.marks?.map((mark) =>
			mark.type === 'link' && typeof mark.attrs?.href === 'string' && INTERNAL.test(mark.attrs.href)
				? { ...mark, attrs: { ...mark.attrs, href: `${base}${mark.attrs.href}` } }
				: mark
		);
		const content = node.content?.map(rewrite);
		return marks || content ? { ...node, ...(marks && { marks }), ...(content && { content }) } : node;
	};

	return rewrite(document) as T;
}

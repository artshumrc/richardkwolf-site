// Base-path resolution for rich-text links.
//
// Content stores internal links as site-relative paths, because the base path
// is a build-time fact and a document must serve both a project URL and a
// custom domain. Uncial's renderer emits a link mark's href verbatim, so the
// prefix is applied to the document handed to the reader page.

interface RichNode {
	marks?: { type: string; attrs?: Record<string, unknown> }[];
	content?: RichNode[];
}

const INTERNAL = /^\/(?!\/)/;

/** The document with every internal rich-text link prefixed by `base`. */
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

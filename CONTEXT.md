# Richard K. Wolf

The personal academic site of Richard K. Wolf, professor of Music and South Asian Studies at Harvard.
It gathers research writing, fieldwork photography and video, and publication offprints for readers, students, and fellow scholars, and it lets the scholar revise every page in place.

## Language

### Editing (inherited from Uncial)

**Content document**:
The stored JSON for one editable page, holding its body together with its descriptive metadata.
It is the single source of truth for that page, and each save replaces it in full.
_Avoid_: Post, record, entry

**Content page**:
The reader-facing page rendered from one Content document.
It carries no editing machinery and is what readers and shared links reach.
_Avoid_: Public page, live page

**Editor variant**:
The edit route paired with one Content page, where that page is revised in place.
Signing in there opens the rich-text editor, and saving commits the underlying document.
_Avoid_: Admin, CMS page

**Block**:
A reusable unit defined once as a Svelte component and registered for use across the site.
The same definition drives the editor canvas and the reader rendering, so authors compose only from known units.
_Avoid_: Widget, section type

**Index page**:
The route that lists every editable page in one place.
It offers creation of new pages and deletion of existing ones, and is a tool for the editor rather than a destination for readers.
_Avoid_: Dashboard, admin home

**Forge**:
The backing store that a save commits to.
In production it is GitHub, while in local development it is the filesystem of the checkout.
_Avoid_: Server, database, backend

**Allowlist**:
The committed JSON naming the origins permitted to broker a token for this repository.
Only a listed origin can open an editing session against the site.
_Avoid_: Whitelist, config

### Site

**Site document**:
The Content document holding site-wide metadata and the navigation menu.
It renders no reader page of its own and is edited only for shared chrome such as the menu and footer details.
_Avoid_: Settings, homepage

**Legacy route**:
A URL the previous WordPress site served that this site answers with a redirect rather than a page.
Each retired address leads to its closest surviving topic, so long-standing citations keep answering.
_Avoid_: Dead link, alias, vanity address

**Content Owner**:
Richard K. Wolf, the scholar whose site this is.
He revises every page through its Editor variant and never authors in markup.
_Avoid_: Admin, webmaster, author when the editing scholar is meant

### Media

**Gallery item**:
One entry in a Gallery, either a photograph or a Vimeo video.
Each item carries its own title and caption and can be reordered alongside its neighbours.
_Avoid_: Slide, attachment, embed

**Image manifest**:
The output of the image port, mapping each served image to its responsive sources.
It is generated data rather than an editable page, and editing it as one would break every responsive image.
_Avoid_: Catalogue, editable page when generated data is meant

### Scholarship

**Research area**:
One named body of inquiry that organises the research pages, such as drumming traditions or lament.
It gathers related essays, galleries, and recordings under a shared heading.
_Avoid_: Topic, category, theme

**Portfolio piece**:
One self-contained multimedia essay in the Portfolios section, joining prose with photographs and video.
It reads as a fieldwork story rather than as a research overview.
_Avoid_: Post, portfolio entry when the essay itself is meant

**Offprint**:
A downloadable copy of a published article or chapter offered for reading.
It lets readers open the scholarship itself rather than a summary of it.
_Avoid_: Reprint, preprint, attachment

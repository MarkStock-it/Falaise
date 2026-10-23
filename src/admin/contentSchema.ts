export type FieldType = 'text' | 'textarea' | 'lines' | 'boolean' | 'image' | 'list'

export type ItemField = {
  path: string
  label: string
  type?: 'text' | 'textarea'
}

export type FieldDef = {
  path: string
  label: string
  type: FieldType
  help?: string
  rows?: number
  itemFields?: ItemField[]
  addLabel?: string
  itemTitle?: (item: Record<string, unknown>) => string
  span?: 1 | 2
}

export type ContentGroup = {
  key:
    | 'site'
    | 'banner'
    | 'hero'
    | 'studio'
    | 'stats'
    | 'print'
    | 'colours'
    | 'editorial'
    | 'drop'
    | 'testimonials'
    | 'closing'
    | 'links'
    | 'footer'
    | 'sizing'
    | 'shipping'
    | 'faq'
    | 'about'
    | 'order'
    | 'policies'
    | 'chrome'
    | 'shop'
    | 'product'
    | 'contact'
    | 'checkout'
    | 'notFound'
  label: string
  blurb: string
  fields: FieldDef[]
}

const linkItem = (path: string, label: string, addLabel: string): FieldDef => ({
  path,
  label,
  type: 'list',
  addLabel,
  itemFields: [
    { path: 'label', label: 'Label' },
    { path: 'href', label: 'Link', type: 'text' },
  ],
  itemTitle: (item) => String(item.label || 'New link'),
})

/** One policy page: a heading, an intro, and repeatable numbered sections. */
const policyFields = (key: 'privacy' | 'terms' | 'returns', label: string): FieldDef[] => [
  { path: `${key}.title`, label: `${label} — heading`, type: 'text' },
  { path: `${key}.lede`, label: `${label} — intro`, type: 'textarea', rows: 3, span: 2 },
  {
    path: `${key}.sections`,
    label: `${label} — sections`,
    type: 'list',
    addLabel: 'Add section',
    itemFields: [
      { path: 'title', label: 'Heading' },
      { path: 'body', label: 'Body', type: 'textarea' },
    ],
    itemTitle: (item) => String(item.title || 'New section'),
  },
]

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    key: 'site',
    label: 'Identity & SEO',
    blurb: 'The name, tagline and metadata used across the storefront.',
    fields: [
      { path: 'name', label: 'Store name', type: 'text' },
      { path: 'tagline', label: 'Tagline', type: 'text' },
      { path: 'city', label: 'City / location', type: 'text' },
      { path: 'metaTitle', label: 'Browser title', type: 'text', span: 2 },
      { path: 'metaDescription', label: 'Search description', type: 'textarea', rows: 3, span: 2 },
      { path: 'ogImage', label: 'Social share image', type: 'image' },
      { path: 'favicon', label: 'Favicon', type: 'image' },
    ],
  },
  {
    key: 'banner',
    label: 'Announcement banner',
    blurb: 'A strip above the header. Off by default; the store shifts to make room when on.',
    fields: [
      { path: 'enabled', label: 'Show the banner', type: 'boolean' },
      { path: 'text', label: 'Banner text', type: 'text', span: 2 },
      { path: 'linkLabel', label: 'Link label', type: 'text' },
      { path: 'linkUrl', label: 'Link URL', type: 'text' },
    ],
  },
  {
    key: 'hero',
    label: 'Hero',
    blurb: 'The opening screen: headline, copy, buttons, spec strip and both photographs.',
    fields: [
      { path: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { path: 'location', label: 'Location label', type: 'text' },
      { path: 'headline', label: 'Headline', type: 'lines', help: 'One line per row.', span: 2 },
      { path: 'body', label: 'Intro copy', type: 'textarea', rows: 3, span: 2 },
      { path: 'primaryCta.label', label: 'Primary button label', type: 'text' },
      { path: 'primaryCta.href', label: 'Primary button link', type: 'text' },
      { path: 'secondaryCta.label', label: 'Secondary link label', type: 'text' },
      { path: 'secondaryCta.href', label: 'Secondary link URL', type: 'text' },
      {
        path: 'specs',
        label: 'Spec strip',
        type: 'list',
        addLabel: 'Add spec',
        itemFields: [
          { path: 'term', label: 'Term' },
          { path: 'value', label: 'Value' },
        ],
        itemTitle: (item) => String(item.term || 'New spec'),
      },
      { path: 'mainImage.src', label: 'Main image', type: 'image' },
      { path: 'mainImage.alt', label: 'Main image alt text', type: 'text' },
      { path: 'mainImage.caption', label: 'Main caption', type: 'text' },
      { path: 'mainImage.note', label: 'Main note', type: 'text' },
      { path: 'insetImage.src', label: 'Inset image', type: 'image' },
      { path: 'insetImage.alt', label: 'Inset image alt text', type: 'text' },
      { path: 'insetImage.caption', label: 'Inset caption', type: 'text' },
      { path: 'insetImage.note', label: 'Inset note', type: 'text' },
    ],
  },
  {
    key: 'studio',
    label: 'Studio section',
    blurb: 'The “one tee, cut once” block on the front page.',
    fields: [
      { path: 'index', label: 'Section label', type: 'text' },
      { path: 'heading', label: 'Heading', type: 'lines', help: 'One line per row.' },
      { path: 'body1', label: 'First paragraph', type: 'textarea', rows: 4, span: 2 },
      { path: 'body2', label: 'Second paragraph', type: 'textarea', rows: 3, span: 2 },
      { path: 'linkLabel', label: 'Link label', type: 'text' },
      { path: 'linkHref', label: 'Link URL', type: 'text' },
    ],
  },
  {
    key: 'stats',
    label: 'Stat strip',
    blurb: 'Four numeric claims under the studio copy.',
    fields: [
      {
        path: '',
        label: 'Stats',
        type: 'list',
        addLabel: 'Add stat',
        itemFields: [
          { path: 'value', label: 'Value' },
          { path: 'label', label: 'Label' },
        ],
        itemTitle: (item) => String(item.value || 'New stat'),
      },
    ],
  },
  {
    key: 'print',
    label: 'Details & print',
    blurb: 'The print photograph and the three detail beats.',
    fields: [
      { path: 'index', label: 'Section label', type: 'text' },
      { path: 'image', label: 'Print photograph', type: 'image' },
      { path: 'alt', label: 'Image alt text', type: 'text' },
      { path: 'captionLeft', label: 'Caption left', type: 'text' },
      { path: 'captionRight', label: 'Caption right', type: 'text' },
      {
        path: 'beats',
        label: 'Detail beats',
        type: 'list',
        addLabel: 'Add beat',
        itemFields: [
          { path: 'index', label: 'Index' },
          { path: 'kicker', label: 'Kicker' },
          { path: 'title', label: 'Title' },
          { path: 'body', label: 'Body', type: 'textarea' },
        ],
        itemTitle: (item) => String(item.title || 'New beat'),
      },
      { path: 'linkLabel', label: 'Link label', type: 'text' },
      { path: 'linkHref', label: 'Link URL', type: 'text' },
    ],
  },
  {
    key: 'colours',
    label: 'Colourways',
    blurb: 'Heading and links for the colour section. Colours come from the featured product.',
    fields: [
      { path: 'index', label: 'Section label', type: 'text' },
      { path: 'heading', label: 'Heading', type: 'text' },
      { path: 'linkLabel', label: 'Link label', type: 'text' },
      { path: 'linkHref', label: 'Link URL', type: 'text' },
      { path: 'productNote', label: 'Product note', type: 'text', span: 2 },
    ],
  },
  {
    key: 'editorial',
    label: 'Editorial band',
    blurb: 'The full-width coast photograph and its headline.',
    fields: [
      { path: 'image', label: 'Background image', type: 'image' },
      { path: 'alt', label: 'Image alt text', type: 'text' },
      { path: 'kicker', label: 'Kicker', type: 'text' },
      { path: 'headline', label: 'Headline', type: 'text' },
      { path: 'lede', label: 'Lede', type: 'textarea', rows: 2, span: 2 },
      { path: 'body', label: 'Body', type: 'textarea', rows: 3, span: 2 },
    ],
  },
  {
    key: 'drop',
    label: 'Drop & order CTA',
    blurb: 'Volume number, ordering copy and the Instagram button label.',
    fields: [
      { path: 'eyebrow', label: 'Section label', type: 'text' },
      { path: 'headline', label: 'Headline', type: 'lines', help: 'One line per row.' },
      { path: 'lede', label: 'Lede', type: 'textarea', rows: 3, span: 2 },
      { path: 'body', label: 'Body', type: 'textarea', rows: 3, span: 2 },
      { path: 'ctaLabel', label: 'Order button label', type: 'text', span: 2 },
    ],
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    blurb: 'Shown between the editorial band and the drop. The section is hidden while empty.',
    fields: [
      {
        path: '',
        label: 'Quotes',
        type: 'list',
        addLabel: 'Add testimonial',
        itemFields: [
          { path: 'quote', label: 'Quote', type: 'textarea' },
          { path: 'author', label: 'Name' },
          { path: 'detail', label: 'Detail (size, city, piece)' },
        ],
        itemTitle: (item) => String(item.author || 'New testimonial'),
      },
    ],
  },
  {
    key: 'closing',
    label: 'Closing note',
    blurb: 'The last statement and its two links.',
    fields: [
      { path: 'index', label: 'Section label', type: 'text' },
      { path: 'statement', label: 'Statement', type: 'textarea', rows: 3, span: 2 },
      { path: 'primaryLabel', label: 'Primary link label', type: 'text' },
      { path: 'primaryHref', label: 'Primary link URL', type: 'text' },
      { path: 'secondaryLabel', label: 'Secondary link label', type: 'text' },
      { path: 'secondaryHref', label: 'Secondary link URL', type: 'text' },
    ],
  },
  {
    key: 'links',
    label: 'Order & contact links',
    blurb: 'Instagram, DM and email used by every order button on the store.',
    fields: [
      { path: 'handle', label: 'Instagram handle', type: 'text' },
      { path: 'instagram', label: 'Instagram profile URL', type: 'text' },
      { path: 'instagramDm', label: 'Direct message URL', type: 'text', span: 2 },
      { path: 'email', label: 'Email (optional)', type: 'text', span: 2 },
    ],
  },
  {
    key: 'footer',
    label: 'Footer',
    blurb: 'Footer copy, address, hours, link columns and the wordmark.',
    fields: [
      { path: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { path: 'tagline', label: 'Tagline', type: 'text' },
      { path: 'messageLabel', label: 'Message link label', type: 'text', span: 2 },
      linkItem('shopLinks', 'Shop column links', 'Add shop link'),
      linkItem('studioLinks', 'Studio column links', 'Add studio link'),
      { path: 'shopHeading', label: 'Shop column heading', type: 'text' },
      { path: 'studioHeading', label: 'Studio column heading', type: 'text' },
      { path: 'ordersHeading', label: 'Orders heading', type: 'text' },
      { path: 'orderNote', label: 'Orders note', type: 'textarea', rows: 3, span: 2 },
      { path: 'addressLabel', label: 'Address label', type: 'text' },
      { path: 'address', label: 'Address', type: 'text' },
      { path: 'hoursLabel', label: 'Hours label', type: 'text' },
      { path: 'hours', label: 'Hours', type: 'text' },
      { path: 'copyright', label: 'Copyright line', type: 'text' },
      { path: 'colophon', label: 'Colophon line', type: 'text' },
      { path: 'wordmark', label: 'Footer wordmark', type: 'image' },
    ],
  },
  {
    key: 'sizing',
    label: 'Size guide',
    blurb:
      'The measurement table in the product size drawer. Keep one row per size; the drawer only shows sizes the product actually has.',
    fields: [
      {
        path: 'note',
        label: 'Fit note',
        type: 'textarea',
        rows: 3,
        span: 2,
        help: 'Shown above the table on the product page.',
      },
      { path: 'unit', label: 'Unit label', type: 'text', help: 'e.g. inches or cm' },
      { path: 'widthLabel', label: 'First column heading', type: 'text' },
      { path: 'lengthLabel', label: 'Second column heading', type: 'text' },
      { path: 'sleeveLabel', label: 'Third column heading', type: 'text' },
      {
        path: 'rows',
        label: 'Measurements',
        type: 'list',
        addLabel: 'Add size',
        itemFields: [
          { path: 'size', label: 'Size' },
          { path: 'width', label: 'Width' },
          { path: 'length', label: 'Length' },
          { path: 'sleeve', label: 'Sleeve' },
        ],
        itemTitle: (item) => String(item.size || 'New size'),
      },
    ],
  },
  {
    key: 'shipping',
    label: 'Shipping & returns',
    blurb:
      'The policy block on every product page and the shipping line in the bag. Use %CITY% for the studio city and %HANDLE% for the Instagram handle.',
    fields: [
      { path: 'heading', label: 'Block heading', type: 'text' },
      { path: 'checkoutLabel', label: 'Bag shipping line', type: 'text' },
      {
        path: 'stockLabel',
        label: 'In-stock label',
        type: 'text',
        span: 2,
        help: 'Shown on product cards and the product page while a size is available.',
      },
      {
        path: 'drawerNote',
        label: 'Bag note',
        type: 'textarea',
        rows: 3,
        span: 2,
        help: 'The line under the bag subtotal, before the order button.',
      },
      {
        path: 'bullets',
        label: 'Policy lines',
        type: 'lines',
        span: 2,
        help: 'One line per row. Each becomes a bullet on the product page.',
      },
      {
        path: 'checkoutNote',
        label: 'Bag payment note',
        type: 'textarea',
        rows: 3,
        span: 2,
      },
    ],
  },
  {
    key: 'faq',
    label: 'Contact FAQ',
    blurb:
      'The questions on the contact page. Hidden while empty. Answers can use %HANDLE% for the Instagram handle.',
    fields: [
      { path: 'heading', label: 'Heading', type: 'text' },
      { path: 'intro', label: 'Intro line', type: 'textarea', rows: 2, span: 2 },
      {
        path: 'questions',
        label: 'Questions',
        type: 'list',
        addLabel: 'Add question',
        itemFields: [
          { path: 'question', label: 'Question' },
          { path: 'answer', label: 'Answer', type: 'textarea' },
        ],
        itemTitle: (item) => String(item.question || 'New question'),
      },
    ],
  },
  {
    key: 'about',
    label: 'Studio page',
    blurb:
      'The /about page: hero, manifesto, the three process passes and the “at a glance” table.',
    fields: [
      { path: 'index', label: 'Page label', type: 'text' },
      { path: 'headline', label: 'Headline', type: 'lines', help: 'One line per row.' },
      { path: 'lede', label: 'Opening paragraph', type: 'textarea', rows: 3, span: 2 },
      { path: 'body', label: 'Second paragraph', type: 'textarea', rows: 4, span: 2 },
      { path: 'manifestoTitle', label: 'Manifesto heading', type: 'text', span: 2 },
      { path: 'manifestoA', label: 'Manifesto paragraph 1', type: 'textarea', rows: 4, span: 2 },
      { path: 'manifestoB', label: 'Manifesto paragraph 2', type: 'textarea', rows: 4, span: 2 },
      {
        path: 'processHeading',
        label: 'Process heading',
        type: 'lines',
        help: 'One line per row.',
      },
      { path: 'processIntro', label: 'Process intro', type: 'textarea', rows: 2, span: 2 },
      {
        path: 'process',
        label: 'Process passes',
        type: 'list',
        addLabel: 'Add pass',
        itemFields: [
          { path: 'index', label: 'Number' },
          { path: 'title', label: 'Title' },
          { path: 'body', label: 'Body', type: 'textarea' },
        ],
        itemTitle: (item) => String(item.title || 'New pass'),
      },
      { path: 'figureCaption', label: 'Studio photograph — caption', type: 'text' },
      { path: 'figureNote', label: 'Studio photograph — note', type: 'text' },
      { path: 'factsHeading', label: 'Facts heading', type: 'text' },
      {
        path: 'facts',
        label: 'At a glance',
        type: 'list',
        addLabel: 'Add fact',
        itemFields: [
          { path: 'term', label: 'Term' },
          { path: 'value', label: 'Value' },
        ],
        itemTitle: (item) => String(item.term || 'New fact'),
      },
      { path: 'factsNote', label: 'Note under the table', type: 'textarea', rows: 3, span: 2 },
      {
        path: 'closingHeadline',
        label: 'Closing headline',
        type: 'lines',
        help: 'One line per row.',
      },
      { path: 'closingBody', label: 'Closing paragraph', type: 'textarea', rows: 3, span: 2 },
    ],
  },
  {
    key: 'order',
    label: 'Order steps',
    blurb:
      'The three-step explanation on the bag and contact pages, plus the pre-filled Instagram message. %HANDLE% is filled automatically.',
    fields: [
      { path: 'dmIntro', label: 'DM opening line', type: 'text', span: 2 },
      { path: 'dmOutro', label: 'DM closing line', type: 'text', span: 2 },
      {
        path: 'checkoutSteps',
        label: 'Bag steps',
        type: 'list',
        addLabel: 'Add step',
        itemFields: [
          { path: 'index', label: 'Number' },
          { path: 'title', label: 'Title' },
          { path: 'body', label: 'Body', type: 'textarea' },
        ],
        itemTitle: (item) => String(item.title || 'New step'),
      },
      {
        path: 'contactSteps',
        label: 'Contact steps',
        type: 'list',
        addLabel: 'Add step',
        itemFields: [
          { path: 'index', label: 'Number' },
          { path: 'title', label: 'Title' },
          { path: 'body', label: 'Body', type: 'textarea' },
        ],
        itemTitle: (item) => String(item.title || 'New step'),
      },
    ],
  },
  {
    key: 'policies',
    label: 'Policies',
    blurb:
      'The /privacy, /terms and /returns pages, linked from the footer of every page. Seeded as drafts — read them before launch. %HANDLE% and %CITY% are filled automatically.',
    fields: [
      {
        path: 'index',
        label: 'Page label',
        type: 'text',
        help: 'Shown above the heading, e.g. Policies / 04.',
      },
      {
        path: 'updated',
        label: 'Updated line',
        type: 'text',
        help: 'Shown top right. Say when the page last changed, or that it is still a draft.',
      },
      {
        path: 'note',
        label: 'Closing note',
        type: 'textarea',
        rows: 3,
        span: 2,
        help: 'Shown at the bottom of every policy page.',
      },
      ...policyFields('privacy', 'Privacy'),
      ...policyFields('terms', 'Terms'),
      ...policyFields('returns', 'Returns'),
    ],
  },
  {
    key: 'chrome',
    label: 'Navigation & labels',
    blurb:
      'The header links and the small structural labels around every page. Change a word here and it changes everywhere it is used.',
    fields: [
      {
        path: 'nav',
        label: 'Header links',
        type: 'list',
        addLabel: 'Add link',
        help: 'Shown in the header and, numbered, in the mobile menu.',
        itemFields: [
          { path: 'label', label: 'Label' },
          { path: 'href', label: 'Link', type: 'text' },
          { path: 'index', label: 'Number' },
        ],
        itemTitle: (item) => String(item.label || 'New link'),
      },
      { path: 'homeLabel', label: 'Product — breadcrumb home', type: 'text' },
      { path: 'seeLabel', label: '“See …” link prefix', type: 'text' },
      { path: 'bagLabel', label: 'Header — bag button', type: 'text' },
      { path: 'bagHeading', label: 'Bag drawer — heading', type: 'text' },
      { path: 'orderHeading', label: 'Checkout — summary heading', type: 'text' },
      { path: 'menuOrdersLabel', label: 'Mobile menu — orders heading', type: 'text' },
      { path: 'menuStudioLabel', label: 'Mobile menu — studio heading', type: 'text' },
      { path: 'shopLinkLabel', label: 'Shop link label', type: 'text' },
      {
        path: 'catalogueLabel',
        label: 'Catalogue label',
        type: 'text',
        help: 'Used beside the collection name on the shop page and where a product has no collection.',
      },
      { path: 'alsoInLabel', label: 'Product — “also in” label', type: 'text' },
      { path: 'colourLabel', label: 'Product — colour label', type: 'text' },
      { path: 'sizeLabel', label: 'Product — size label', type: 'text' },
      { path: 'sizeGuideLabel', label: 'Product — size guide link', type: 'text' },
      { path: 'subtotalLabel', label: 'Bag — subtotal label', type: 'text' },
      { path: 'shippingLabel', label: 'Checkout — shipping label', type: 'text' },
      { path: 'qtyLabel', label: 'Checkout — quantity label', type: 'text' },
      { path: 'closeLabel', label: 'Bag drawer — close button', type: 'text' },
      { path: 'removeLabel', label: 'Bag drawer — remove button', type: 'text' },
      { path: 'backHomeLabel', label: 'Not found — home button', type: 'text' },
      { path: 'shopCollectionLabel', label: 'Shop the collection link', type: 'text' },
      { path: 'contactStudioLabel', label: 'Contact the studio link', type: 'text' },
      { path: 'continueBrowsingLabel', label: 'Bag drawer — continue browsing', type: 'text' },
      { path: 'sendOrderLabel', label: 'Bag drawer — order button', type: 'text' },
      { path: 'viewSummaryLabel', label: 'Checkout — summary toggle', type: 'text' },
      { path: 'emptyBagTitle', label: 'Bag drawer — empty heading', type: 'text' },
      { path: 'emptyBagBody', label: 'Bag drawer — empty line', type: 'textarea', rows: 2, span: 2 },
      { path: 'emptyBagValue', label: 'Checkout — empty bag value', type: 'text' },
      { path: 'shopConstructionIndex', label: 'Shop — construction label', type: 'text' },
      { path: 'shopViewLabel', label: 'Shop — “see every view” link', type: 'text' },
      { path: 'shopWornIndex', label: 'Shop — worn label', type: 'text' },
      { path: 'productWornIndex', label: 'Product — worn label', type: 'text' },
      { path: 'aboutPositionIndex', label: 'Studio page — position label', type: 'text' },
      { path: 'aboutProcessIndex', label: 'Studio page — process label', type: 'text' },
      { path: 'aboutRecordIndex', label: 'Studio page — record label', type: 'text' },
      { path: 'aboutNextIndex', label: 'Studio page — next label', type: 'text' },
      { path: 'contactKicker', label: 'Contact — page kicker', type: 'text' },
      { path: 'contactOrdersIndex', label: 'Contact — orders label', type: 'text' },
      { path: 'contactDirectIndex', label: 'Contact — direct label', type: 'text' },
      { path: 'contactQuestionsIndex', label: 'Contact — questions label', type: 'text' },
      { path: 'checkoutKicker', label: 'Checkout — page kicker', type: 'text' },
      { path: 'checkoutEmptyKicker', label: 'Checkout — empty page kicker', type: 'text' },
      { path: 'checkoutViaLabel', label: 'Checkout — channel label', type: 'text' },
      { path: 'checkoutCurrentBagLabel', label: 'Checkout — empty bag label', type: 'text' },
      { path: 'policyQuestionsLabel', label: 'Policy pages — questions label', type: 'text' },
      { path: 'notFoundKicker', label: 'Not found — page kicker', type: 'text' },
      { path: 'notFoundBrand', label: 'Not found — corner label', type: 'text' },
      { path: 'notFoundTagline', label: 'Not found — tagline', type: 'text' },
    ],
  },
  {
    key: 'shop',
    label: 'Shop page',
    blurb:
      'The copy on /shop: the construction block and the empty-catalogue state. %COLLECTION% and %HANDLE% are filled automatically.',
    fields: [
      {
        path: 'introFallback',
        label: 'Intro when there is no product',
        type: 'textarea',
        rows: 2,
        span: 2,
      },
      { path: 'constructionHeading', label: 'Construction heading', type: 'text', span: 2 },
      {
        path: 'constructionBody',
        label: 'Construction paragraph',
        type: 'textarea',
        rows: 4,
        span: 2,
        help: '%COLLECTION% becomes the collection name.',
      },
      { path: 'wornBody', label: 'Worn paragraph', type: 'textarea', rows: 3, span: 2 },
      { path: 'emptyTitle', label: 'Empty catalogue heading', type: 'text' },
      {
        path: 'emptyBody',
        label: 'Empty catalogue line',
        type: 'textarea',
        rows: 3,
        span: 2,
        help: '%HANDLE% becomes a link to the Instagram DM.',
      },
    ],
  },
  {
    key: 'product',
    label: 'Product page',
    blurb: 'The gallery note and the “worn” section at the bottom of every product page.',
    fields: [
      { path: 'galleryNote', label: 'Gallery note', type: 'text', span: 2 },
      { path: 'wornHeading', label: 'Worn heading', type: 'text' },
      { path: 'lookLabel', label: 'Look label', type: 'text', help: '“Look 01”, “Look 02”…' },
      { path: 'wornBody', label: 'Worn paragraph', type: 'textarea', rows: 3, span: 2 },
      { path: 'frontLabel', label: 'Front view label', type: 'text' },
      { path: 'backLabel', label: 'Back view label', type: 'text' },
      { path: 'edgeLabel', label: 'Seaside caption label', type: 'text', help: '“The edge / Liloan, Cebu”' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact page',
    blurb:
      'The /contact page: hero, the two explainer blocks and the closing line. Orders come from the Order steps group; questions from Contact FAQ.',
    fields: [
      { path: 'headline', label: 'Headline', type: 'lines', help: 'One line per row.' },
      { path: 'lede', label: 'Opening line', type: 'textarea', rows: 2, span: 2 },
      { path: 'body', label: 'Second paragraph', type: 'textarea', rows: 3, span: 2 },
      { path: 'ordersHeading', label: '“Orders” heading', type: 'text' },
      { path: 'ordersBody', label: '“Orders” paragraph', type: 'textarea', rows: 3 },
      { path: 'directHeading', label: '“Direct” heading', type: 'text' },
      { path: 'directBody', label: '“Direct” paragraph', type: 'textarea', rows: 3 },
      { path: 'ordersLabel', label: 'Contact row — orders label', type: 'text' },
      { path: 'instagramLabel', label: 'Contact row — Instagram label', type: 'text' },
      { path: 'emailLabel', label: 'Contact row — email label', type: 'text' },
      { path: 'reachLinkLabel', label: '“Message on Instagram” link', type: 'text' },
      { path: 'addressNote', label: 'Note under the address', type: 'text', span: 2 },
      { path: 'hoursNote', label: 'Note under the hours', type: 'text', span: 2 },
      { path: 'closing', label: 'Closing line', type: 'text', span: 2 },
    ],
  },
  {
    key: 'checkout',
    label: 'Checkout page',
    blurb:
      'The /checkout copy: headline, order note, the empty-bag state and the clipboard help. %HANDLE% is filled automatically.',
    fields: [
      { path: 'headline', label: 'Headline', type: 'lines', help: 'One line per row.' },
      { path: 'lede', label: 'Order note', type: 'textarea', rows: 3, span: 2 },
      { path: 'emptyHeadline', label: 'Empty bag heading', type: 'text', span: 2 },
      { path: 'emptyLedeNone', label: 'Empty bag line — nothing listed', type: 'textarea', rows: 2 },
      { path: 'emptyLedeSingle', label: 'Empty bag line — one product', type: 'textarea', rows: 2 },
      { path: 'emptyLedeMany', label: 'Empty bag line — several products', type: 'textarea', rows: 2 },
      { path: 'emptyCardNote', label: 'Empty bag — side note', type: 'textarea', rows: 3, span: 2 },
      { path: 'copyHelp', label: 'Clipboard note', type: 'textarea', rows: 3, span: 2 },
      { path: 'copyFailed', label: 'Clipboard-blocked note', type: 'textarea', rows: 3, span: 2 },
      { path: 'piecesLabel', label: 'Piece count suffix', type: 'text', help: '“02 pcs”' },
    ],
  },
  {
    key: 'notFound',
    label: 'Not found page',
    blurb: 'The 404 headline and paragraph. The kicker, corner label and tagline are in Navigation & labels.',
    fields: [
      { path: 'headline', label: 'Headline', type: 'lines', help: 'One line per row.' },
      { path: 'body', label: 'Paragraph', type: 'textarea', rows: 3, span: 2 },
    ],
  },
]

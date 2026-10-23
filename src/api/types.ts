export type ColorPhotos = {
  front: string
  back: string
  detail: string
}

export type ColorOption = {
  id: string
  name: string
  hex: string
  photos: ColorPhotos
}

export type Variant = {
  id: string
  colorId: string
  size: string
  available: boolean
  stock?: number
}

export type CollectionRef = {
  id: string
  name: string
  slug: string
}

export type Collection = CollectionRef & {
  description: string
  position: number
  visible: boolean
  productCount: number
}

export type ProductStatus = 'active' | 'hidden' | 'sold_out'

export type Product = {
  id: string
  slug: string
  name: string
  code: string
  tagline: string
  description: string
  details: string[]
  price: number
  priceCents: number
  collection: CollectionRef | null
  collectionId: string | null
  sizes: string[]
  colors: ColorOption[]
  variants: Variant[]
  totalStock?: number
  status: ProductStatus
  manualStatus?: 'active' | 'hidden'
  featured: boolean
  drop: string
  meta: { fabric: string; fit: string; made: string }
  images: ColorPhotos
  createdAt?: string
  updatedAt: string
}

export type Link = { label: string; href: string }
export type PolicySection = { title: string; body: string }
export type PolicyDocument = { title: string; lede: string; sections: PolicySection[] }
export type ImageField = { src: string; alt: string; caption?: string; note?: string }

export type SiteContent = {
  site: {
    name: string
    tagline: string
    city: string
    metaTitle: string
    metaDescription: string
    ogImage: string
    favicon: string
  }
  banner: { enabled: boolean; text: string; linkLabel: string; linkUrl: string }
  hero: {
    eyebrow: string
    location: string
    headline: string[]
    body: string
    primaryCta: Link
    secondaryCta: Link
    specs: { term: string; value: string }[]
    mainImage: Required<ImageField>
    insetImage: Required<ImageField>
  }
  studio: {
    index: string
    heading: string[]
    body1: string
    body2: string
    linkLabel: string
    linkHref: string
  }
  stats: { value: string; label: string }[]
  print: {
    index: string
    image: string
    alt: string
    captionLeft: string
    captionRight: string
    beats: { index: string; kicker: string; title: string; body: string }[]
    linkLabel: string
    linkHref: string
  }
  colours: {
    index: string
    heading: string
    linkLabel: string
    linkHref: string
    productNote: string
  }
  editorial: {
    image: string
    alt: string
    kicker: string
    headline: string
    lede: string
    body: string
  }
  drop: {
    eyebrow: string
    headline: string[]
    lede: string
    body: string
    ctaLabel: string
  }
  testimonials: { quote: string; author: string; detail: string }[]
  closing: {
    index: string
    statement: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel: string
    secondaryHref: string
  }
  links: { instagram: string; instagramDm: string; handle: string; email: string }
  footer: {
    eyebrow: string
    tagline: string
    messageLabel: string
    shopHeading: string
    shopLinks: Link[]
    studioHeading: string
    studioLinks: Link[]
    ordersHeading: string
    orderNote: string
    addressLabel: string
    address: string
    hoursLabel: string
    hours: string
    copyright: string
    colophon: string
    wordmark: string
  }
  sizing: {
    note: string
    unit: string
    widthLabel: string
    lengthLabel: string
    sleeveLabel: string
    rows: { size: string; width: string; length: string; sleeve: string }[]
  }
  shipping: {
    heading: string
    stockLabel: string
    drawerNote: string
    bullets: string[]
    checkoutLabel: string
    checkoutNote: string
  }
  faq: {
    heading: string
    intro: string
    questions: { question: string; answer: string }[]
  }
  about: {
    index: string
    headline: string[]
    lede: string
    body: string
    manifestoTitle: string
    manifestoA: string
    manifestoB: string
    processHeading: string[]
    processIntro: string
    process: { index: string; title: string; body: string }[]
    facts: { term: string; value: string }[]
    figureCaption: string
    figureNote: string
    factsHeading: string
    factsNote: string
    closingHeadline: string[]
    closingBody: string
  }
  order: {
    dmIntro: string
    dmOutro: string
    checkoutSteps: { index: string; title: string; body: string }[]
    contactSteps: { index: string; title: string; body: string }[]
  }
  policies: {
    index: string
    updated: string
    note: string
    privacy: PolicyDocument
    terms: PolicyDocument
    returns: PolicyDocument
  }
  chrome: {
    nav: { label: string; href: string; index: string }[]
    homeLabel: string
    seeLabel: string
    bagLabel: string
    bagHeading: string
    orderHeading: string
    menuOrdersLabel: string
    menuStudioLabel: string
    shopLinkLabel: string
    catalogueLabel: string
    alsoInLabel: string
    colourLabel: string
    sizeLabel: string
    sizeGuideLabel: string
    subtotalLabel: string
    shippingLabel: string
    qtyLabel: string
    closeLabel: string
    removeLabel: string
    backHomeLabel: string
    shopCollectionLabel: string
    contactStudioLabel: string
    continueBrowsingLabel: string
    sendOrderLabel: string
    viewSummaryLabel: string
    emptyBagTitle: string
    emptyBagBody: string
    emptyBagValue: string
    shopConstructionIndex: string
    shopViewLabel: string
    shopWornIndex: string
    productWornIndex: string
    aboutPositionIndex: string
    aboutProcessIndex: string
    aboutRecordIndex: string
    aboutNextIndex: string
    contactKicker: string
    contactOrdersIndex: string
    contactDirectIndex: string
    contactQuestionsIndex: string
    checkoutKicker: string
    checkoutEmptyKicker: string
    checkoutViaLabel: string
    checkoutCurrentBagLabel: string
    policyQuestionsLabel: string
    notFoundKicker: string
    notFoundBrand: string
    notFoundTagline: string
  }
  shop: {
    introFallback: string
    constructionHeading: string
    constructionBody: string
    wornBody: string
    emptyTitle: string
    emptyBody: string
  }
  product: {
    galleryNote: string
    wornHeading: string
    wornBody: string
    lookLabel: string
    frontLabel: string
    backLabel: string
    edgeLabel: string
  }
  contact: {
    headline: string[]
    lede: string
    body: string
    ordersHeading: string
    ordersBody: string
    directHeading: string
    directBody: string
    ordersLabel: string
    instagramLabel: string
    emailLabel: string
    reachLinkLabel: string
    addressNote: string
    hoursNote: string
    closing: string
  }
  checkout: {
    headline: string[]
    lede: string
    emptyHeadline: string
    emptyLedeNone: string
    emptyLedeSingle: string
    emptyLedeMany: string
    emptyCardNote: string
    copyHelp: string
    copyFailed: string
    piecesLabel: string
  }
  notFound: {
    headline: string[]
    body: string
  }
}

export type StoreData = {
  content: SiteContent
  collections: Collection[]
  products: Product[]
  generatedAt: string
}

export type Inquiry = {
  id: string
  name: string
  contact: string
  message: string
  product: string
  status: 'new' | 'replied' | 'closed'
  created_at: string
  updated_at: string
}

export type StockLogEntry = {
  id: number
  variant_id: string | null
  product_id: string | null
  product_name: string
  color_name: string
  size: string
  old_stock: number
  new_stock: number
  reason: string
  created_at: string
}

export type ActivityEntry = {
  id: number
  action: string
  entity: string
  entity_id: string | null
  summary: string
  created_at: string
}

export type Overview = {
  counts: {
    total: number
    active: number
    hidden: number
    soldOut: number
    lowStock: number
  }
  products: Product[]
  lowStock: {
    id: string
    stock: number
    size: string
    product_id: string
    product_name: string
    product_status: string
    color_name: string
    color_id: string
  }[]
  recentStock: StockLogEntry[]
  recentActivity: ActivityEntry[]
  recentInquiries: Inquiry[]
  content: SiteContent
  threshold: number
}

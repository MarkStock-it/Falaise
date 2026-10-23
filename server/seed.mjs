/**
 * Seed data for the FALAISE store.
 *
 * Every value the storefront renders is either a `product` row/variant or a
 * field in one of these content groups. Nothing here is duplicated in JSX:
 * the admin edits these records and the storefront re-reads them.
 */

export const DEFAULT_CONTENT = {
  site: {
    name: 'FALAISE',
    tagline: 'Rompre avec l’ordinaire.',
    city: 'Liloan, Cebu',
    metaTitle: 'FALAISE — Rompre avec l’ordinaire',
    metaDescription:
      'One tee. Two colours. FALAISE Vol. 01 is a heavyweight cotton tee, boxy and cropped, with the words Rompre avec l’ordinaire printed across the back. Order via Instagram.',
    ogImage: '/og/falaise-og.jpg',
    favicon: '/favicon.png',
  },

  banner: {
    enabled: false,
    text: 'Vol. 01 — Le Tee in noir and blanc.',
    linkLabel: '',
    linkUrl: '',
  },

  hero: {
    eyebrow: 'Vol. 01 / Le Tee',
    location: 'Liloan, Cebu',
    headline: ['Rompre', 'avec', 'l’ordinaire.'],
    body: 'One heavyweight cotton tee, cut boxy and cropped. The front stays quiet; the back carries the line. Two colours, one run.',
    primaryCta: { label: 'Shop Le Tee', href: '/product/le-tee' },
    secondaryCta: { label: 'The studio', href: '/about' },
    specs: [
      { term: 'Cut', value: 'Boxy crop / S–XL' },
      { term: 'Cloth', value: 'Heavyweight cotton' },
      { term: 'Colour', value: 'Noir + Blanc' },
    ],
    mainImage: {
      src: '/photos/noir-back.webp',
      alt: 'Le Tee in Noir seen from the back, showing the back print.',
      caption: 'Noir / back print',
      note: 'Look 01',
    },
    insetImage: {
      src: '/photos/blanc-front.webp',
      alt: 'Le Tee in Blanc, front view.',
      caption: 'Blanc / front',
      note: '02',
    },
  },

  studio: {
    index: '01 / The studio',
    heading: ['One tee.', 'Cut once.'],
    body1:
      'FALAISE is a small studio working from Liloan, Cebu. Vol. 01 is a single garment: a heavyweight cotton tee, boxy and cropped, in noir and blanc. The back carries the words Rompre avec l’ordinaire in a hand-set script.',
    body2:
      'There is no seasonal calendar and no second silhouette hidden behind this one. Wear it until it knows you.',
    linkLabel: 'Read the studio notes',
    linkHref: '/about',
  },

  stats: [
    { value: '01', label: 'piece in Vol. 01' },
    { value: '02', label: 'colours, one cut' },
    { value: '01', label: 'screen print, by hand' },
    { value: 'S–XL', label: 'unisex sizing' },
  ],

  print: {
    index: '02 / The details',
    image: '/photos/print-detail.webp',
    alt: 'Close detail of the white back print on black cotton.',
    captionLeft: 'The back / one pass',
    captionRight: 'Screen print',
    beats: [
      {
        index: '01',
        kicker: 'The cut',
        title: 'Boxy, cropped, done.',
        body: 'Heavyweight cotton, cut wide through the body and short at the hem. A tee that sits away from you, not on you. Washed once before it arrives.',
      },
      {
        index: '02',
        kicker: 'The mark',
        title: 'Small at the chest.',
        body: 'An F monogram, printed small at the left chest. Quiet from a distance, legible up close. The rest of the story is on the back.',
      },
      {
        index: '03',
        kicker: 'The back',
        title: 'Rompre avec l’ordinaire.',
        body: 'Break with the ordinary, pulled across the back in a hand-set script. White on noir, black on blanc — one pass, one run.',
      },
    ],
    linkLabel: 'Read the full spec',
    linkHref: '/product/le-tee',
  },

  colours: {
    index: '03 / Vol. 01',
    heading: 'Two colours',
    linkLabel: 'See the full spec',
    linkHref: '/product/le-tee',
    productNote: 'Boxy crop / S–XL',
  },

  editorial: {
    image: '/photos/editorial-seaside.webp',
    alt: 'FALAISE Le Tee worn against the sea wall and the cliff line.',
    kicker: 'The edge / Vol. 01',
    headline: 'The edge is the point.',
    lede: 'Falaise, French for cliff. The place where the ordinary stops.',
    body: 'Vol. 01 takes its name from the edge. One tee, two colours, finished in Cebu and meant to be worn until the script softens.',
  },

  drop: {
    eyebrow: 'The drop',
    headline: ['Vol.', '01'],
    lede: 'One tee. Two colours. One run. Noir and blanc are cut now; DMs are answered every day.',
    body: 'Send the colour and size in an Instagram message. We confirm stock, shipping and payment in the same thread — no checkout, no card form.',
    ctaLabel: 'Order on Instagram',
  },

  testimonials: [],

  closing: {
    index: '05 / A last note',
    statement: 'Break with the ordinary, then wear it in.',
    primaryLabel: 'Shop Vol. 01',
    primaryHref: '/product/le-tee',
    secondaryLabel: 'Ask a question',
    secondaryHref: '/contact',
  },

  links: {
    instagram: 'https://instagram.com/thefalaise.ph',
    instagramDm: 'https://ig.me/m/thefalaise.ph',
    handle: '@thefalaise.ph',
    email: '',
  },

  footer: {
    eyebrow: 'Falaise / Vol. 01',
    tagline: 'One tee. Two colours. Cut once, worn until it knows you.',
    messageLabel: 'Message @thefalaise.ph',
    shopHeading: 'Shop',
    shopLinks: [
      { label: 'Vol. 01', href: '/shop' },
      { label: 'Le Tee — Noir', href: '/product/le-tee' },
      { label: 'Le Tee — Blanc', href: '/product/le-tee?color=blanc' },
      { label: 'Sizing', href: '/product/le-tee' },
    ],
    studioHeading: 'Studio',
    studioLinks: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Instagram', href: 'https://instagram.com/thefalaise.ph' },
    ],
    ordersHeading: 'Orders',
    orderNote:
      'Message us on Instagram to order. Sizing, shipping and payment are settled in the same thread.',
    addressLabel: 'Address',
    address: 'Liloan, Cebu',
    hoursLabel: 'Hours',
    hours: 'Always open',
    copyright: '© 2026 Falaise Studio',
    colophon: 'Independent / Liloan, Cebu',
    wordmark: '/brand/falaise-wordmark-paper.svg',
  },

  /* Copy that used to be hardcoded in JSX. Percent tokens: %HANDLE% and %CITY%. */
  sizing: {
    note: 'Garment measured flat, in inches. Boxy crop fit — take your usual size, or size up for more length through the body.',
    unit: 'inches',
    widthLabel: 'Width',
    lengthLabel: 'Length',
    sleeveLabel: 'Sleeve',
    rows: [
      { size: 'S', width: '19', length: '24', sleeve: '8.5' },
      { size: 'M', width: '20', length: '25', sleeve: '9' },
      { size: 'L', width: '21', length: '26', sleeve: '9.5' },
      { size: 'XL', width: '22', length: '27', sleeve: '10' },
    ],
  },

  shipping: {
    heading: 'Shipping & returns',
    stockLabel: 'In stock / ships in 2–4 days',
    drawerNote:
      'Orders are sent by Instagram DM. We confirm stock, shipping and payment in the same thread.',
    bullets: [
      'Dispatched from %CITY%. Orders are confirmed by DM.',
      'PH delivery in 2–4 working days. Worldwide rates quoted on request.',
      'Unworn, unwashed pieces can be returned within 14 days. Message %HANDLE% so we can expect the parcel.',
    ],
    checkoutLabel: 'Confirmed in DM',
    checkoutNote:
      'Payment is arranged on Instagram. This site does not take card details or charge anything.',
  },

  faq: {
    heading: 'Before you write',
    intro: 'The four things people ask most. If your question is not here, the inbox is open.',
    questions: [
      {
        question: 'How does Le Tee fit?',
        answer:
          'It is a boxy crop: wide through the body, dropped at the shoulder, and cut short at the hem. Sizes run S–XL and are unisex. Take your usual size for the intended fit; size up if you want more length. The size guide on the product page lists width, length and sleeve measured flat in inches.',
      },
      {
        question: 'Where do you ship, and how long does it take?',
        answer:
          'Orders leave Liloan, Cebu. Philippine addresses usually arrive in two to four working days; provincial routes can take a day longer. International shipping is quoted per order by weight. Shipping is confirmed in the DM, never added silently to the bag.',
      },
      {
        question: 'How should I care for the print?',
        answer:
          'Wash cold, inside out, with like colours. Do not bleach, tumble dry hot, or iron directly over the back print. Hang or lay flat to dry. The cotton will soften with wear; the print will settle into the fabric rather than sit on top of it.',
      },
      {
        question: 'Can I return or exchange a tee?',
        answer:
          'Yes — unworn, unwashed, with tags, within 14 days of delivery. Message %HANDLE% first so we can expect the parcel. We cover return shipping if the piece arrived faulty or the wrong item was sent; otherwise return postage is yours.',
      },
    ],
  },

  about: {
    index: 'Studio / 02',
    headline: ['Wear', 'the edge.'],
    lede: 'Falaise is French for the edge of a cliff. A place to stand before the view decides what you do next.',
    body:
      'We took the name as a brief. Vol. 01 is one garment — a heavyweight cotton tee, cut boxy and cropped — in two colours. No season to keep up with. No fourth colour coming later. Just the tee, made properly, until it is gone.',
    manifestoTitle: 'One garment is enough to begin.',
    manifestoA:
      'Most labels start with a range. We started with a tee, because a tee is the hardest thing to get right and the easiest thing to over-design. The body is squared, the shoulder sits low, the hem stops at the waist. The print does the rest.',
    manifestoB:
      '“Rompre avec l’ordinaire” means to break with the ordinary. It is not a slogan we expect anyone to read aloud. It is a reminder placed where only the person behind you can see it. The front stays quiet.',
    processHeading: ['Three passes', 'before a seam.'],
    processIntro: 'A piece moves to the next pass only when the one before it is right. The calendar does not get a vote.',
    process: [
      {
        index: '01',
        title: 'Pattern',
        body: 'Le Tee began as a paper pattern on the long table: shoulder dropped, body squared, hem lifted to the waist. We cut it in calico, wore it, shortened it, and cut it again until the line held without a belt or a tuck.',
      },
      {
        index: '02',
        title: 'Print',
        body: 'The chest mark is small enough to miss at a distance. The back carries “Rompre avec l’ordinaire” in a hand-set script, pulled through a screen so the ink sits in the cotton rather than on top of it.',
      },
      {
        index: '03',
        title: 'Run',
        body: 'Vol. 01 is a limited first run in noir and blanc. Each tee is checked at the neck, hem and print before it is folded. When the run is gone, the next one begins with the same pattern.',
      },
    ],
    facts: [
      { term: 'City', value: 'Liloan, Cebu' },
      { term: 'Volume', value: 'Vol. 01' },
      { term: 'Piece', value: 'Le Tee' },
      { term: 'Colourways', value: 'Noir / Blanc' },
      { term: 'Sizes', value: 'S–XL, unisex' },
      { term: 'Fit', value: 'Boxy crop' },
      { term: 'Print', value: 'Screen print at back' },
    ],
    figureCaption: 'Vol. 01 / worn away from the studio',
    figureNote: 'Noir, size M — 001',
    factsHeading: 'At a glance',
    factsNote:
      'Measurements, fabric and care are listed on the product page. If a size is gone, write to the studio — we will tell you honestly whether it is coming back.',
    closingHeadline: ['See it worn,', 'then choose.'],
    closingBody:
      'Front, back and print detail, photographed on the body in both colours. Read the spec, then choose a size.',
  },

  order: {
    dmIntro: 'Hi FALAISE — I would like to order:',
    dmOutro: 'Please confirm stock, shipping and payment.',
    checkoutSteps: [
      {
        index: '01',
        title: 'Check the bag',
        body: 'Colour, size and quantity. The bag is only a list — nothing is reserved until we reply.',
      },
      {
        index: '02',
        title: 'Send the DM',
        body: 'Copy the order summary, open Instagram and send it to %HANDLE%. One message is enough.',
      },
      {
        index: '03',
        title: 'We settle the rest',
        body: 'We confirm stock and shipping, then send the total and payment details in the same thread.',
      },
    ],
    contactSteps: [
      {
        index: '01',
        title: 'Build the bag',
        body: 'Choose noir or blanc, then a size. The bag keeps the selection while you browse; nothing is reserved yet.',
      },
      {
        index: '02',
        title: 'Send one message',
        body: 'Copy the order summary from the bag and send it to %HANDLE% on Instagram. One DM is enough — no form, no account.',
      },
      {
        index: '03',
        title: 'We reply with the rest',
        body: 'We confirm stock and shipping, then send the total and payment details in the same thread. Only then is the order locked in.',
      },
    ],
  },

  /*
   * The three policy pages: /privacy, /terms and /returns. Seeded as drafts —
   * they describe what this software actually does (no card data, no analytics,
   * admin-only access to inquiries) and carry the promises already made on the
   * product page. The owner reviews them at Admin → Content → Policies.
   */
  policies: {
    index: 'Policies / 04',
    updated: 'Draft copy — confirm with the studio before launch.',
    note: 'Anything unclear, or a request about your own data: message %HANDLE% and a person will answer.',
    privacy: {
      title: 'Privacy',
      lede: 'This site collects as little as a shop can. Orders happen in Instagram, and the studio keeps only what it needs to answer you and send a parcel.',
      sections: [
        {
          title: 'What is held',
          body: 'A name, a contact handle, the message you sent and the piece you asked about. If the order goes ahead, also the delivery address and the payment reference. Nothing else — no account on this site, no card details, no browsing history.',
        },
        {
          title: 'Where it lives',
          body: 'Inquiries are written into the studio’s own database on its own server, readable only through the password-protected admin. No third party holds a copy.',
        },
        {
          title: 'What this site does not do',
          body: 'No analytics, no advertising pixels, no third-party scripts, no tracking cookies. The only cookie is the admin session, and only for the person running the shop.',
        },
        {
          title: 'How long it stays',
          body: 'An inquiry is kept while the order conversation is open, and for as long as the studio needs it for its records after that. Ask for it and it is deleted.',
        },
        {
          title: 'Your requests',
          body: 'Message %HANDLE% to see what is held about you, correct it, or have it deleted. The reply comes from a person, in the same thread.',
        },
      ],
    },
    terms: {
      title: 'Terms',
      lede: 'Plain terms for a plain shop: this site is a catalogue, the order is a conversation, and nothing is charged here.',
      sections: [
        {
          title: 'Who you are buying from',
          body: 'FALAISE, a small studio in %CITY%. The studio is reachable at %HANDLE% on Instagram, which is also where every order is agreed.',
        },
        {
          title: 'The bag is not an order',
          body: 'Adding a piece to the bag reserves nothing. An order exists once the studio has confirmed colour, size, stock, shipping and total in the DM thread.',
        },
        {
          title: 'Prices and payment',
          body: 'Prices are shown in Philippine pesos and can change between drops. Shipping is quoted in the thread and is never added silently. No payment is taken on this site and no card details are ever entered here.',
        },
        {
          title: 'Stock',
          body: 'Vol. 01 is a limited run. If a size sells out between your message and the confirmation, the studio will say so and offer the next best option, or return anything already paid.',
        },
        {
          title: 'The studio may decline',
          body: 'An order can be turned down — a sold-out size, an address the courier cannot reach, or a request that looks like a resale run. Anything already paid is returned in full.',
        },
        {
          title: 'Which law applies',
          body: 'Philippine law, including the Consumer Act. Nothing on this page removes a right you have under it.',
        },
        {
          title: 'Changes',
          body: 'These terms are updated when the shop changes. The version that applies to an order is the one live when the order was confirmed in the DM.',
        },
      ],
    },
    returns: {
      title: 'Returns',
      lede: 'Fourteen days, unworn, with the tags on. A tee that does not fit should not become a tee you never wear.',
      sections: [
        {
          title: 'The window',
          body: 'Fourteen days from delivery. The piece must be unworn, unwashed and still tagged, with the print untouched.',
        },
        {
          title: 'Message first',
          body: 'Write to %HANDLE% before sending anything back, so the studio knows to expect the parcel. The return address is shared in that thread.',
        },
        {
          title: 'Wrong size',
          body: 'Size exchanges are offered while the size you want is still in stock. If it is gone, the piece can be returned for a refund instead.',
        },
        {
          title: 'Faulty or wrong item',
          body: 'If the print, seam or size is not what was agreed, send a photo in the thread. The studio covers the return postage and replaces the piece or refunds it in full.',
        },
        {
          title: 'Change of mind',
          body: 'Return postage is yours unless the piece arrived faulty or the wrong item was sent.',
        },
        {
          title: 'Refunds',
          body: 'Refunds go back to the method used to pay, or as store credit if you prefer. They are sent once the parcel is back and checked.',
        },
        {
          title: 'What cannot come back',
          body: 'Pieces worn, washed, altered, or bought as a final sale. A limited run cannot be reprinted, so a refund replaces the exchange when stock is gone.',
        },
      ],
    },
  },

  /*
   * Navigation and the small structural labels around the pages: the header
   * links, the kicker above each page heading, the numbered section labels and
   * the words inside the bag and checkout. Everything a reader sees that is not
   * body copy lives here, so a label change never needs a developer.
   */
  chrome: {
    nav: [
      { label: 'Shop', href: '/shop', index: '01' },
      { label: 'Studio', href: '/about', index: '02' },
      { label: 'Contact', href: '/contact', index: '03' },
    ],
    homeLabel: 'Home',
    seeLabel: 'See',
    bagLabel: 'Bag',
    bagHeading: 'Your bag',
    orderHeading: 'Your order',
    menuOrdersLabel: 'Orders',
    menuStudioLabel: 'Studio',
    shopLinkLabel: 'Shop Vol. 01',
    catalogueLabel: 'Catalogue',
    alsoInLabel: 'Also in',
    colourLabel: 'Colour',
    sizeLabel: 'Size',
    sizeGuideLabel: 'Size guide',
    subtotalLabel: 'Subtotal',
    shippingLabel: 'Shipping',
    qtyLabel: 'Qty',
    closeLabel: 'Close',
    removeLabel: 'Remove',
    backHomeLabel: 'Back home',
    shopCollectionLabel: 'Shop the collection',
    contactStudioLabel: 'Contact the studio',
    continueBrowsingLabel: 'Continue browsing',
    sendOrderLabel: 'Send order on Instagram',
    viewSummaryLabel: 'View the order summary',
    emptyBagTitle: 'Nothing yet.',
    emptyBagBody: 'The bag is empty. One tee, two colours — start with the noir.',
    emptyBagValue: 'No items',
    shopConstructionIndex: '01 / The construction',
    shopViewLabel: 'See every view',
    shopWornIndex: '03 / Worn',
    productWornIndex: '02 / Worn',
    aboutPositionIndex: '01 / Position',
    aboutProcessIndex: '02 / Process',
    aboutRecordIndex: '03 / The record',
    aboutNextIndex: '04 / Next',
    contactKicker: 'Contact / 03',
    contactOrdersIndex: '01 / Orders',
    contactDirectIndex: '02 / Direct',
    contactQuestionsIndex: '03 / Questions',
    checkoutKicker: 'Order / 01',
    checkoutEmptyKicker: 'Order / 00',
    checkoutViaLabel: 'Via Instagram',
    checkoutCurrentBagLabel: 'Current bag',
    policyQuestionsLabel: 'Questions',
    notFoundKicker: 'Error / 404',
    notFoundBrand: 'Falaise Studio',
    notFoundTagline: 'Off the cliff.',
  },

  /* Page body copy, one group per page. The header nav and the small labels
   * live in `chrome`; this is the prose underneath them. */
  shop: {
    introFallback: 'The catalogue is being restocked. Message the studio for what is available now.',
    constructionHeading: 'One garment, not a range.',
    constructionBody:
      'Everything in %COLLECTION% is cut from the same pattern. The weight sits away from the body, the crop keeps it short, and the print is the only thing that needs to speak.',
    wornBody:
      'Cut once. Worn every week. The boxy body keeps its line whether it is tucked, layered or left alone.',
    emptyTitle: 'Nothing listed yet.',
    emptyBody:
      'No pieces are visible right now. Message %HANDLE% and the studio will tell you what is on the table.',
  },

  product: {
    galleryNote: 'Worn, second and detail views. Every photograph is the piece itself.',
    wornHeading: 'On the edge, off the clock.',
    wornBody:
      'The same piece, worn three ways. Cut once, so it keeps its line whether it is layered or left alone.',
    lookLabel: 'Look',
    frontLabel: 'front',
    backLabel: 'back',
    edgeLabel: 'The edge',
  },

  contact: {
    headline: ['Message', 'the studio.'],
    lede: 'Orders, sizing, shipping, returns — one Instagram thread.',
    body: 'A person reads every message. Usually the same person who checked the print. The account stays open, so write whenever it suits you.',
    ordersHeading: 'How it works',
    ordersBody:
      'Checkout is deliberately human. There is no card field on this site, and no order is final until we have replied.',
    directHeading: 'Reach us',
    directBody:
      'For an existing order, reply in the same DM thread so the details stay together.',
    ordersLabel: 'Orders',
    instagramLabel: 'Instagram',
    emailLabel: 'Email',
    reachLinkLabel: 'Message on Instagram',
    addressNote: 'Full address shared with your order confirmation.',
    hoursNote: 'We reply as soon as we are at the table.',
    closing: 'The inbox is open.',
  },

  checkout: {
    headline: ['Take it', 'to the DMs.'],
    lede: 'Your bag is ready. Send the order to %HANDLE% — we confirm stock, shipping and payment in the same thread.',
    emptyHeadline: 'Nothing to send.',
    emptyLedeNone: 'The bag is empty. Nothing is listed right now.',
    emptyLedeSingle: 'The bag is empty. Vol. 01 is one piece — start there.',
    emptyLedeMany: 'The bag is empty. Start with the collection.',
    emptyCardNote:
      'Orders happen in an Instagram message. We confirm stock, shipping and payment there — no card details are collected on this site.',
    copyHelp:
      'Opening the DM copies your order summary to the clipboard. Paste it into the message — Instagram does not allow a pre-filled DM.',
    copyFailed:
      'Clipboard access was blocked. Select the summary below and copy it manually before opening Instagram.',
    piecesLabel: 'pcs',
  },

  notFound: {
    headline: ['We cut this', 'one out.'],
    body: 'The link may have moved, or the page belongs to a volume we have not made yet. The current piece is one click away.',
  },
}

export const DEFAULT_COLLECTIONS = [
  {
    id: 'col_vol01',
    name: 'Vol. 01',
    slug: 'vol-01',
    description: 'One tee, two colours, one run.',
    position: 1,
    visible: 1,
  },
]

export const DEFAULT_PRODUCTS = [
  {
    id: 'prd_le_tee',
    slug: 'le-tee',
    name: 'Le Tee',
    code: '001',
    tagline: 'Rise above the ordinary.',
    description:
      'One tee, cut boxy and cropped at the waist. Heavyweight cotton with a dry hand, a small FALAISE mark at the chest, and the words “Rise above the ordinary” pulled across the back in a hand-set script. Made to be worn until the print softens.',
    details: [
      'Heavyweight cotton jersey, garment-washed',
      'Boxy crop fit, dropped shoulder',
      'FALAISE mark at the left chest',
      '“Rise above the ordinary” screen print at the back',
      'Unisex sizing S–XL, limited Vol. 01 run',
    ],
    priceCents: 189000,
    collectionId: 'col_vol01',
    status: 'active',
    featured: 1,
    drop: 'VOL. 01',
    fabric: 'Heavyweight cotton',
    fit: 'Boxy crop / true to size',
    made: 'Limited run / Cebu',
    position: 1,
    colors: [
      {
        id: 'clr_noir',
        name: 'Noir',
        hex: '#161616',
        front: '/photos/noir-front.webp',
        back: '/photos/noir-back.webp',
        detail: '/photos/print-detail.webp',
        position: 1,
      },
      {
        id: 'clr_blanc',
        name: 'Blanc',
        hex: '#e8e3d7',
        front: '/photos/blanc-front.webp',
        back: '/photos/blanc-look.webp',
        detail: '/photos/blanc-detail.webp',
        position: 2,
      },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: {
      'clr_noir|S': 4,
      'clr_noir|M': 9,
      'clr_noir|L': 3,
      'clr_noir|XL': 0,
      'clr_blanc|S': 0,
      'clr_blanc|M': 6,
      'clr_blanc|L': 7,
      'clr_blanc|XL': 2,
    },
  },
]

export const LOW_STOCK_THRESHOLD = 3

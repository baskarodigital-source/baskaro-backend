/** Default CMS pages seeded when the collection is empty. */
export const DEFAULT_WEBSITE_PAGES = [
  {
    slug: 'about',
    title: 'About Us',
    summary:
      'BAS karo helps users sell, buy, and repair devices with a simple and trusted experience.',
    body: 'Our focus is transparent pricing, quality checks, and reliable support.',
    isPublished: true,
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    summary: 'Please read these terms carefully before using BAS karo services.',
    body: `1. Introduction
Welcome to BAS karo. These Terms & Conditions govern your use of our website, mobile applications, and services.

2. Eligibility
You must be at least 18 years of age and capable of entering into a binding contract under applicable law.

3. Orders & Payments
All orders are subject to acceptance and inventory availability. Payouts for sell orders are released after successful verification.

4. Device Condition
You agree to provide truthful information about your device. Our team may re-evaluate the device upon receipt.

5. Contact Us
For questions about these terms, contact support@baskaro.com.`,
    isPublished: true,
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    summary: 'Get in touch with us for product, order, or service related help.',
    body: 'Email: support@baskaro.com\nPhone: +91-00000-00000',
    isPublished: true,
  },
  {
    slug: 'new-offers',
    title: 'New Offers',
    summary: 'Check latest deals, cashback, and seasonal offers across gadgets and services.',
    body: 'Browse our homepage and marketplace for the latest promotions.',
    isPublished: true,
  },
  {
    slug: 'partner',
    title: 'Partner',
    summary: 'Explore partnership opportunities with Baskaro for business growth.',
    body: 'Interested in partnering with us? Contact our business team.',
    isPublished: true,
  },
  {
    slug: 'articles',
    title: 'Articles',
    summary: 'Read useful gadget guides, comparisons, and buying tips.',
    body: 'Articles and guides will appear here.',
    isPublished: true,
  },
  {
    slug: 'become-partner',
    title: 'Become Partner',
    summary: 'Join Baskaro as a partner and expand your services with us.',
    body: 'Apply to become a Baskaro partner through our contact form.',
    isPublished: true,
  },
  {
    slug: 'warranty-policy',
    title: 'Warranty Policy',
    summary: 'Warranty coverage for devices sold through Baskaro.',
    body:
      'Devices sold through BAS karo include warranty coverage as per product category and condition. For claim support, keep your order details and invoice ready.',
    isPublished: true,
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    summary: 'How Baskaro collects, uses, and protects your personal information.',
    body: `1. Information We Collect
We collect information you provide when you register, sell or buy a device, or contact support.

2. How We Use Information
We use your information to process transactions, provide support, and improve our services.

3. Data Security
We implement reasonable measures to protect your data.

4. Contact
For privacy requests, email support@baskaro.com.`,
    isPublished: true,
  },
  {
    slug: 'careers',
    title: 'Careers',
    summary: 'Join the Baskaro team across product, operations, and support.',
    body:
      'We are building a strong team across product, operations, customer support, and engineering. Open roles and hiring updates will be listed on this page.',
    isPublished: true,
  },
  {
    slug: 'refer-earn',
    title: 'Refer & Earn',
    summary: 'Invite friends and earn referral rewards on eligible transactions.',
    body:
      'Invite friends to BAS karo and earn referral rewards when they complete eligible transactions. More offers and referral tracking tools will be available here.',
    isPublished: true,
  },
  {
    slug: 'nearby-stores',
    title: 'Nearby Stores',
    summary: 'Find BAS karo partner stores and service centres near you.',
    body:
      'Use the store locator to find partner locations for sell, buy, and repair services. Store listings are managed from the CMS Store Locations tab.',
    isPublished: true,
  },
]

/** Known service marketing pages editable in CMS. */
export const CMS_SERVICE_PAGE_KEYS = [
  { pageKey: 'repair-phone', label: 'Repair Phone — Why Us' },
  { pageKey: 'sell-phone', label: 'Sell Phone — Why Us' },
]

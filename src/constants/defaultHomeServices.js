/**
 * Default rows for GET /api/home-services when the collection is empty (first deploy / local dev).
 * Matches the public homepage “Our Services” carousel.
 */
export const DEFAULT_HOME_SERVICES = [
  {
    label: 'Sell Phone',
    path: '/sell-phone',
    imageUrl: '/hero/sell.png',
    sortOrder: 10,
  },
  {
    label: 'Get estimate',
    path: '/sell-phone',
    imageUrl: '/hero/sell.png',
    sortOrder: 15,
  },
  {
    label: 'Buy Phone',
    path: '/marketplace',
    imageUrl: '/hero/buy.png',
    sortOrder: 20,
  },
  {
    label: 'Repair Phone',
    path: '/repair-phone',
    imageUrl:
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=640&auto=format&fit=crop',
    sortOrder: 30,
  },
  {
    label: 'Find New Phone',
    path: '/find-new-phone',
    imageUrl: '/hero/exchange.png',
    sortOrder: 40,
  },
  {
    label: 'Nearby Stores',
    path: '/nearby-stores',
    imageUrl:
      'https://img.freepik.com/premium-vector/shop-location-icon-3d-illustration-from-online-store-collection-creative-shop-location-3d-icon-web-design-templates-infographics-more_676904-843.jpg?semt=ais_incoming&w=740&q=80',
    sortOrder: 50,
  },
  {
    label: 'Buy Accessories',
    path: '/buy-accessories',
    imageUrl: '/hero/accessories.png',
    sortOrder: 60,
  },
  {
    label: 'Buy Smartwatches',
    path: '/buy-accessories',
    imageUrl:
      'https://img.tatacliq.com/images/i10/437Wx649H/MP000000017249001_437Wx649H_202304181258383.jpeg',
    sortOrder: 70,
  },
]

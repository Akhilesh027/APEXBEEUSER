export type OutletCategory = 'ALL' | 'RESTAURANT' | 'BAKERY' | 'FAST_FOOD';

/**
 * Classifies a food outlet into RESTAURANT, BAKERY, or FAST_FOOD.
 * Safely handles null, undefined, or partial outlet objects.
 */
export const getOutletType = (rest: any): 'RESTAURANT' | 'BAKERY' | 'FAST_FOOD' => {
  if (!rest) return 'RESTAURANT';

  const bType = (rest.businessType || '').toString().toUpperCase();
  const name = (rest.restaurantName || rest.name || '').toString().toLowerCase();
  const cuisine = (Array.isArray(rest.cuisines) ? rest.cuisines.join(' ') : rest.cuisines || '').toString().toLowerCase();

  // 1. Bakery & Sweets
  if (
    bType === 'BAKERY' ||
    bType === 'CAFE_BAKERY' ||
    bType === 'SWEETS' ||
    bType === 'SWEETS_DESSERTS' ||
    bType === 'DESSERTS' ||
    bType === 'CAFE_BAKERY_BEVERAGES' ||
    name.includes('bakery') ||
    name.includes('bakes') ||
    name.includes('sweets') ||
    name.includes('sweet') ||
    name.includes('cake') ||
    name.includes('pastry') ||
    name.includes('biscuit') ||
    cuisine.includes('bakery') ||
    cuisine.includes('sweets') ||
    cuisine.includes('cake') ||
    cuisine.includes('dessert')
  ) {
    return 'BAKERY';
  }

  // 2. Fast Food & Street Food / Cafes
  if (
    bType === 'FAST_FOOD' ||
    bType === 'STREET_FOOD' ||
    bType === 'CAFE' ||
    name.includes('fast food') ||
    name.includes('fastfood') ||
    name.includes('burger') ||
    name.includes('pizza') ||
    name.includes('sandwich') ||
    name.includes('cafe') ||
    name.includes('chai') ||
    name.includes('tea') ||
    name.includes('roll') ||
    name.includes('snack') ||
    name.includes('chaat') ||
    name.includes('momo') ||
    cuisine.includes('fast food') ||
    cuisine.includes('burger') ||
    cuisine.includes('pizza') ||
    cuisine.includes('street food') ||
    cuisine.includes('cafe')
  ) {
    return 'FAST_FOOD';
  }

  // 3. Defaults to Restaurant
  return 'RESTAURANT';
};

/**
 * Checks if Dineout / Table Booking is actively enabled for a venue.
 * Returns true ONLY if dining is actively turned on and the venue is operational.
 */
export const isDineoutEnabled = (venue: any): boolean => {
  if (!venue) return false;

  const isEnabled =
    venue.diningEnabled === true ||
    venue.tableReservationEnabled === true ||
    venue.diningInfo?.diningEnabled === true ||
    venue.diningInfo?.isDiningActive === true;

  if (!isEnabled) return false;
  if (venue.diningEnabled === false) return false;
  if (venue.operationalStatus === 'TEMPORARILY_CLOSED' || venue.operationalStatus === 'PERMANENTLY_CLOSED') return false;
  if (venue.diningInfo && venue.diningInfo.isDiningActive === false) return false;

  return true;
};

interface BookingLinks {
  booking: string;
  expedia: string;
  marriott: string;
  hyatt: string;
  ihg: string;
  viator: string;
}

interface BookingConfig {
  affiliateIds: {
    booking: string;
    expedia: string;
    viator: string;
  };
}

const config: BookingConfig = {
  affiliateIds: {
    booking: process.env.BOOKING_AFFILIATE_ID || '',
    expedia: process.env.EXPEDIA_AFFILIATE_ID || '',
    viator: process.env.VIATOR_PARTNER_ID || ''
  }
};

export async function generateBookingLinks(
  location: string,
  checkinDate: string,
  checkoutDate?: string,
  guests: number = 2
): Promise<BookingLinks> {
  const encodedLocation = encodeURIComponent(location);
  const checkin = formatDate(checkinDate);
  const checkout = formatDate(checkoutDate || getNextDay(checkinDate));

  return {
    booking: buildBookingComLink(encodedLocation, checkin, checkout, guests),
    expedia: buildExpediaLink(encodedLocation, checkin, checkout, guests),
    marriott: buildMarriottLink(encodedLocation, checkin, checkout, guests),
    hyatt: buildHyattLink(encodedLocation, checkin, checkout, guests),
    ihg: buildIHGLink(encodedLocation, checkin, checkout, guests),
    viator: buildViatorLink(encodedLocation)
  };
}

function buildBookingComLink(
  location: string,
  checkin: string,
  checkout: string,
  guests: number
): string {
  const params = new URLSearchParams({
    ss: location,
    checkin: checkin,
    checkout: checkout,
    group_adults: guests.toString(),
    no_rooms: '1',
    selected_currency: 'USD'
  });

  if (config.affiliateIds.booking) {
    params.append('aid', config.affiliateIds.booking);
  }

  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

function buildExpediaLink(
  location: string,
  checkin: string,
  checkout: string,
  guests: number
): string {
  const params = new URLSearchParams({
    destination: location,
    startDate: checkin,
    endDate: checkout,
    rooms: '1',
    adults: guests.toString()
  });

  if (config.affiliateIds.expedia) {
    params.append('affcid', config.affiliateIds.expedia);
  }

  return `https://www.expedia.com/Hotel-Search?${params.toString()}`;
}

function buildMarriottLink(
  location: string,
  checkin: string,
  checkout: string,
  guests: number
): string {
  return `https://www.marriott.com/search/findHotels.mi?` +
    `destinationAddress.city=${location}&` +
    `fromDate=${checkin}&` +
    `toDate=${checkout}&` +
    `numRooms=1&` +
    `numAdults=${guests}`;
}

function buildHyattLink(
  location: string,
  checkin: string,
  checkout: string,
  guests: number
): string {
  return `https://www.hyatt.com/search/simple.jsp?` +
    `location=${location}&` +
    `checkinDate=${checkin}&` +
    `checkoutDate=${checkout}&` +
    `rooms=1&` +
    `adults=${guests}`;
}

function buildIHGLink(
  location: string,
  checkin: string,
  checkout: string,
  guests: number
): string {
  return `https://www.ihg.com/hotels/us/en/find-hotels/hotel/list?` +
    `qDest=${location}&` +
    `qCiD=${checkin.split('-')[2]}&` +
    `qCiMy=${checkin.substring(0, 7)}&` +
    `qCoD=${checkout.split('-')[2]}&` +
    `qCoMy=${checkout.substring(0, 7)}&` +
    `qAdlt=${guests}&` +
    `qRms=1`;
}

function buildViatorLink(location: string): string {
  const params = new URLSearchParams({
    text: location,
    searchType: 'all'
  });

  if (config.affiliateIds.viator) {
    params.append('pid', config.affiliateIds.viator);
  }

  return `https://www.viator.com/searchResults/all?${params.toString()}`;
}

function formatDate(dateString: string): string {
  // Convert to YYYY-MM-DD format
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

function getNextDay(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

export async function trackAffiliateClick(
  platform: string,
  tripId: string,
  userId: string
): Promise<void> {
  // Log affiliate clicks for analytics
  console.log('Affiliate click:', { platform, tripId, userId, timestamp: new Date() });

  // In production: Store in DynamoDB for tracking conversions
}

export async function searchAccommodations(
  location: { lat: number; lng: number },
  checkInDate: string,
  checkOutDate: string,
  preferences?: {
    maxPrice?: number;
    minRating?: number;
    type?: string[];
    amenities?: string[];
  }
): Promise<any[]> {
  // In production, this would call hotel booking APIs
  // For now, return mock data

  const mockOptions = [
    {
      name: 'Comfort Inn & Suites',
      type: 'hotel',
      pricePerNight: 129,
      rating: 4.2,
      amenities: ['WiFi', 'Breakfast', 'Pool', 'Parking'],
      bookingUrl: 'https://example.com/book/comfort-inn'
    },
    {
      name: 'Budget Lodge',
      type: 'motel',
      pricePerNight: 79,
      rating: 3.5,
      amenities: ['WiFi', 'Parking'],
      bookingUrl: 'https://example.com/book/budget-lodge'
    },
    {
      name: 'Cozy Mountain Cabin',
      type: 'airbnb',
      pricePerNight: 175,
      rating: 4.8,
      amenities: ['WiFi', 'Kitchen', 'Hot Tub', 'Mountain View'],
      bookingUrl: 'https://example.com/book/mountain-cabin'
    },
    {
      name: 'Riverside Campground',
      type: 'camping',
      pricePerNight: 35,
      rating: 4.0,
      amenities: ['Restrooms', 'Fire Pits', 'River Access'],
      bookingUrl: 'https://example.com/book/riverside-camp'
    }
  ];

  // Filter based on preferences
  let filtered = mockOptions;

  if (preferences?.maxPrice) {
    filtered = filtered.filter(opt => opt.pricePerNight <= preferences.maxPrice!);
  }

  if (preferences?.minRating) {
    filtered = filtered.filter(opt => opt.rating >= preferences.minRating!);
  }

  if (preferences?.type && preferences.type.length > 0) {
    filtered = filtered.filter(opt => preferences.type!.includes(opt.type));
  }

  return filtered;
}

export async function getRestaurantRecommendations(
  location: { lat: number; lng: number },
  preferences?: {
    cuisine?: string[];
    priceRange?: 1 | 2 | 3 | 4;
    dietary?: string[];
  }
): Promise<any[]> {
  // In production, this would call Yelp or Google Places API

  return [
    {
      name: 'Local Diner',
      cuisine: 'American',
      priceRange: 2,
      rating: 4.3,
      address: '123 Main St',
      phone: '(555) 123-4567',
      hours: '6am - 9pm',
      dietary: ['Vegetarian options']
    },
    {
      name: 'Taco Fiesta',
      cuisine: 'Mexican',
      priceRange: 1,
      rating: 4.5,
      address: '456 Oak Ave',
      phone: '(555) 234-5678',
      hours: '11am - 10pm',
      dietary: ['Vegetarian options', 'Gluten-free options']
    },
    {
      name: 'The Farmhouse',
      cuisine: 'Farm-to-table',
      priceRange: 3,
      rating: 4.7,
      address: '789 Country Rd',
      phone: '(555) 345-6789',
      hours: '5pm - 10pm',
      dietary: ['Vegetarian options', 'Vegan options', 'Gluten-free options']
    }
  ];
}

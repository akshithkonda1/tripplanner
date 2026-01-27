interface BookingLinks {
  [provider: string]: string;
}

interface AccommodationOption {
  name: string;
  type: 'hotel' | 'motel' | 'airbnb' | 'camping';
  pricePerNight: number;
  rating: number;
  amenities: string[];
  bookingUrl: string;
}

export async function generateBookingLinks(
  address: string,
  checkInDate: string,
  checkOutDate?: string
): Promise<BookingLinks> {
  const encodedAddress = encodeURIComponent(address);
  const checkIn = formatDate(checkInDate);
  const checkOut = checkOutDate ? formatDate(checkOutDate) : getNextDay(checkInDate);

  return {
    'Booking.com': `https://www.booking.com/searchresults.html?ss=${encodedAddress}&checkin=${checkIn}&checkout=${checkOut}`,
    'Hotels.com': `https://www.hotels.com/search.do?destination=${encodedAddress}&startDate=${checkIn}&endDate=${checkOut}`,
    'Airbnb': `https://www.airbnb.com/s/${encodedAddress}/homes?checkin=${checkIn}&checkout=${checkOut}`,
    'Expedia': `https://www.expedia.com/Hotel-Search?destination=${encodedAddress}&startDate=${checkIn}&endDate=${checkOut}`
  };
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
): Promise<AccommodationOption[]> {
  // In production, this would call hotel booking APIs
  // For now, return mock data

  const mockOptions: AccommodationOption[] = [
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

  if (preferences?.amenities && preferences.amenities.length > 0) {
    filtered = filtered.filter(opt =>
      preferences.amenities!.some(amenity =>
        opt.amenities.map(a => a.toLowerCase()).includes(amenity.toLowerCase())
      )
    );
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
  // For now, return mock data

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

function getNextDay(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

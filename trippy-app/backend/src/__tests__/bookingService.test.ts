import {
  generateBookingLinks,
  searchAccommodations,
  getRestaurantRecommendations
} from '../services/bookingService';

describe('Booking Service', () => {
  describe('generateBookingLinks', () => {
    it('should generate booking links for all providers', async () => {
      const result = await generateBookingLinks(
        'New York, NY',
        '2024-07-01',
        '2024-07-05'
      );

      expect(result).toHaveProperty('Booking.com');
      expect(result).toHaveProperty('Hotels.com');
      expect(result).toHaveProperty('Airbnb');
      expect(result).toHaveProperty('Expedia');
    });

    it('should encode address in URLs', async () => {
      const result = await generateBookingLinks(
        'New York, NY',
        '2024-07-01',
        '2024-07-05'
      );

      expect(result['Booking.com']).toContain('New%20York');
    });

    it('should include correct dates in URLs', async () => {
      const result = await generateBookingLinks(
        'Test City',
        '2024-07-01',
        '2024-07-05'
      );

      expect(result['Booking.com']).toContain('2024-07-01');
      expect(result['Booking.com']).toContain('2024-07-05');
    });

    it('should use next day when checkout not provided', async () => {
      const result = await generateBookingLinks(
        'Test City',
        '2024-07-01'
      );

      expect(result['Booking.com']).toContain('2024-07-02');
    });
  });

  describe('searchAccommodations', () => {
    it('should return accommodation options', async () => {
      const result = await searchAccommodations(
        { lat: 40.7128, lng: -74.0060 },
        '2024-07-01',
        '2024-07-05'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('pricePerNight');
      expect(result[0]).toHaveProperty('rating');
    });

    it('should filter by max price', async () => {
      const result = await searchAccommodations(
        { lat: 40.7128, lng: -74.0060 },
        '2024-07-01',
        '2024-07-05',
        { maxPrice: 100 }
      );

      result.forEach(accommodation => {
        expect(accommodation.pricePerNight).toBeLessThanOrEqual(100);
      });
    });

    it('should filter by minimum rating', async () => {
      const result = await searchAccommodations(
        { lat: 40.7128, lng: -74.0060 },
        '2024-07-01',
        '2024-07-05',
        { minRating: 4.0 }
      );

      result.forEach(accommodation => {
        expect(accommodation.rating).toBeGreaterThanOrEqual(4.0);
      });
    });

    it('should filter by accommodation type', async () => {
      const result = await searchAccommodations(
        { lat: 40.7128, lng: -74.0060 },
        '2024-07-01',
        '2024-07-05',
        { type: ['hotel'] }
      );

      result.forEach(accommodation => {
        expect(accommodation.type).toBe('hotel');
      });
    });

    it('should filter by amenities', async () => {
      const result = await searchAccommodations(
        { lat: 40.7128, lng: -74.0060 },
        '2024-07-01',
        '2024-07-05',
        { amenities: ['WiFi'] }
      );

      result.forEach(accommodation => {
        expect(
          accommodation.amenities.some(a =>
            a.toLowerCase().includes('wifi')
          )
        ).toBe(true);
      });
    });
  });

  describe('getRestaurantRecommendations', () => {
    it('should return restaurant recommendations', async () => {
      const result = await getRestaurantRecommendations(
        { lat: 40.7128, lng: -74.0060 }
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('cuisine');
      expect(result[0]).toHaveProperty('rating');
    });
  });
});

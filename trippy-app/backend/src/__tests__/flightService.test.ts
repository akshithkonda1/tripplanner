import { buildFlightItinerary } from '../services/flightService';

describe('Flight Service (multi-city, free deep links)', () => {
  it('builds a multi-city Kayak link for the whole trip', () => {
    const itinerary = buildFlightItinerary([
      { from: 'JFK', to: 'LAX', date: '2024-07-01' },
      { from: 'LAX', to: 'JFK', date: '2024-07-10' },
    ]);

    expect(itinerary.legs).toHaveLength(2);
    expect(itinerary.bookingLinks.Kayak).toBe(
      'https://www.kayak.com/flights/JFK-LAX/2024-07-01/LAX-JFK/2024-07-10?sort=price_a'
    );
    expect(itinerary.bookingLinks['Google Flights']).toContain('google.com/travel/flights');
  });

  it('handles a 3-leg trip: home -> NYC -> LA -> home', () => {
    const itinerary = buildFlightItinerary([
      { from: 'MCI', to: 'JFK', date: '2024-08-01' },
      { from: 'JFK', to: 'LAX', date: '2024-08-05' },
      { from: 'LAX', to: 'MCI', date: '2024-08-10' },
    ]);

    expect(itinerary.legs).toHaveLength(3);
    expect(itinerary.legLinks).toHaveLength(3);
    expect(itinerary.bookingLinks.Kayak).toBe(
      'https://www.kayak.com/flights/MCI-JFK/2024-08-01/JFK-LAX/2024-08-05/LAX-MCI/2024-08-10?sort=price_a'
    );
  });

  it('normalizes 3-letter codes to uppercase and keeps city names as-is', () => {
    const itinerary = buildFlightItinerary([
      { from: 'jfk', to: 'New York', date: '2024-07-01' },
    ]);

    expect(itinerary.legs[0].from).toBe('JFK');
    expect(itinerary.legs[0].to).toBe('New York');
  });

  it('produces per-leg links for Kayak, Google Flights, and Skyscanner', () => {
    const itinerary = buildFlightItinerary([{ from: 'JFK', to: 'LAX', date: '2024-07-01' }]);
    const links = itinerary.legLinks[0].links;

    expect(links.Kayak).toBe('https://www.kayak.com/flights/JFK-LAX/2024-07-01?sort=price_a');
    expect(links['Google Flights']).toContain('google.com/travel/flights');
    // Skyscanner uses lowercase codes + YYMMDD.
    expect(links.Skyscanner).toBe('https://www.skyscanner.com/transport/flights/jfk/lax/240701/');
  });

  it('throws when there are no valid legs', () => {
    expect(() => buildFlightItinerary([])).toThrow('at least one valid leg');
  });
});

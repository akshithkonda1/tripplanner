import { HIDDEN_CITY_WARNING } from '../services/listings';
import { fixtureFlights, fixtureStays, searchFlights, searchStays } from '../services/bookingInventory';
import { tagFlightListing } from '../services/travelHacking';

describe('booking inventory', () => {
  it('returns ranked stay cards with Booking.com checkout URLs', async () => {
    const result = await searchStays({
      city: 'Lisbon',
      checkIn: '2026-11-02',
      checkOut: '2026-11-05',
      adults: 4
    });
    expect(result.source).toBe('fixture');
    expect(result.partySize).toBe(4);
    expect(result.nights).toBe(3);
    expect(result.bestValue.length).toBeGreaterThan(3);
    expect(result.bestValue[0].checkoutUrl).toContain('booking.com');
    const three = result.bestValue.find((s) => s.id === 'stay-3star')!;
    const five = result.bestValue.find((s) => s.id === 'stay-5star')!;
    expect(three.totalPrice).toBe(1000);
    expect(five.totalPrice).toBe(1000);
    expect(five.trippyValue).toBeGreaterThan(three.trippyValue);
    expect(result.lowestTotal[0].id).toBe('stay-camp');
    expect(result.travelHacks.some((s) => s.hackTags.includes('apartment'))).toBe(true);
    expect(result.travelHacks.some((s) => s.hackTags.includes('package_combo'))).toBe(true);
  });

  it('tags nearby, flex, midweek, one-ways, open-jaw, and hidden-city fares', async () => {
    const result = await searchFlights({
      from: 'SFO',
      to: 'LIS',
      depart: '2026-11-03',
      returnDate: '2026-11-16',
      adults: 1
    });
    const ids = result.bestValue.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining([
      'flight-exact',
      'flight-alt-origin-OAK',
      'flight-flex',
      'flight-midweek',
      'flight-ow-pair',
      'flight-hidden-city'
    ]));
    const hidden = result.bestValue.find((f) => f.id === 'flight-hidden-city')!;
    expect(hidden.hackTags).toContain('hidden_city');
    expect(hidden.actualGetOff).toBe('LIS');
    expect(hidden.warning).toBe(HIDDEN_CITY_WARNING);
    expect(hidden.checkoutUrl).toContain('flights.booking.com');
    expect(result.travelHacks.length).toBeGreaterThan(0);
    expect(result.lowestTotal[0].totalPrice).toBeLessThan(
      result.bestValue.find((f) => f.id === 'flight-exact')!.totalPrice
    );
  });

  it('puts a warning on tagged hidden-city listings', () => {
    const tagged = tagFlightListing(
      {
        id: 'x',
        provider: 'Booking.com',
        from: 'SFO',
        to: 'MAD',
        via: 'LIS',
        actualGetOff: 'LIS',
        departDate: '2026-11-03',
        totalPrice: 300,
        currency: 'USD',
        isOneWay: true,
        stops: 1,
        checkoutUrl: 'https://flights.booking.com',
        hackTags: ['hidden_city'],
        cabin: 'economy'
      },
      { from: 'SFO', to: 'LIS', depart: '2026-11-03' }
    );
    expect(tagged.warning).toContain('checked bags');
    expect(fixtureStays({
      city: 'Tokyo',
      checkIn: '2026-11-02',
      checkOut: '2026-11-16',
      adults: 2
    }).length).toBeGreaterThan(0);
    expect(fixtureFlights({ from: 'JFK', to: 'LHR', depart: '2026-12-01', adults: 2 })[0].from).toBe('JFK');
  });
});

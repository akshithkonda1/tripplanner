import { cheapFlightHacks, nearbyAirports, resolveAirport } from '../services/travelHacking';

describe('travel hacking', () => {
  it('resolves IATA, city, and "SFO San Francisco" labels', () => {
    expect(resolveAirport('SFO')?.iata).toBe('SFO');
    expect(resolveAirport('San Francisco')?.iata).toBe('SFO');
    expect(resolveAirport('SFO San Francisco')?.iata).toBe('SFO');
    expect(resolveAirport('Lisbon')?.iata).toBe('LIS');
  });

  it('finds nearby cheap airports (SFO ↔ OAK, JFK ↔ EWR)', () => {
    const sfo = resolveAirport('SFO')!;
    const nearby = nearbyAirports(sfo).map((a) => a.iata);
    expect(nearby).toContain('OAK');
    expect(nearby[0]).toBe('OAK');
    expect(nearby).toContain('SJC');

    const jfk = resolveAirport('JFK')!;
    expect(nearbyAirports(jfk).map((a) => a.iata)).toEqual(expect.arrayContaining(['EWR', 'LGA']));
  });

  it('opens Booking.com first, cheapest sort, then the other sites', () => {
    const hacks = cheapFlightHacks('SFO', 'LIS', '2026-11-03', '2026-11-16');
    expect(hacks.length).toBeGreaterThan(6);
    expect(hacks[0].provider).toBe('Booking.com');
    expect(hacks[0].id).toBe('booking-exact');
    expect(hacks[0].url).toContain('flights.booking.com');
    expect(hacks[0].url).toContain('sort=CHEAPEST');
    expect(hacks[0].url).toContain('SFO.AIRPORT-LIS.AIRPORT');
    expect(hacks[0].url).toContain('depart=2026-11-03');
    expect(hacks[0].url).toContain('return=2026-11-16');

    const lastBooking = hacks.map((h) => h.isBooking).lastIndexOf(true);
    const firstOther = hacks.findIndex((h) => !h.isBooking);
    expect(firstOther).toBeGreaterThan(lastBooking);
    expect(hacks.filter((h) => !h.isBooking).map((h) => h.provider)).toEqual([
      'Kayak',
      'Google Flights',
      'Skyscanner',
      'Momondo'
    ]);
  });

  it('includes nearby-airport, flex, midweek, one-way, and open-jaw Booking.com rows', () => {
    const hacks = cheapFlightHacks('San Francisco', 'Lisbon', '2026-11-03', '2026-11-16');
    const ids = hacks.map((h) => h.id);
    expect(ids).toContain('booking-alt-origin-OAK');
    expect(ids).toContain('booking-flex');
    expect(ids).toContain('booking-midweek');
    expect(ids).toContain('booking-ow-out');
    expect(ids).toContain('booking-ow-home');
    expect(ids).toContain('booking-return-nearby');

    const flex = hacks.find((h) => h.id === 'booking-flex')!;
    expect(flex.url).toContain('depart=2026-10-31');
    expect(flex.url).toContain('return=2026-11-19');

    const midweek = hacks.find((h) => h.id === 'booking-midweek')!;
    // 2026-11-03 is a Tuesday already; home shifts to Wednesday 2026-11-18
    expect(midweek.url).toContain('depart=2026-11-03');
    expect(midweek.url).toContain('return=2026-11-18');

    const london = cheapFlightHacks('JFK', 'LHR', '2026-12-01', '2026-12-10');
    const openJaw = london.find((h) => h.id === 'booking-openjaw')!;
    expect(openJaw.url).toContain('type=MULTISTOP');
    expect(openJaw.url).toContain('sort=CHEAPEST');
    expect(london.map((h) => h.id)).toEqual(expect.arrayContaining(['booking-alt-dest-LGW', 'booking-alt-dest-STN']));
  });

  it('never suggests hidden-city / skiplagging', () => {
    const hacks = cheapFlightHacks('JFK', 'LHR', '2026-12-01', '2026-12-10');
    const blob = hacks.map((h) => `${h.title} ${h.why} ${h.id}`).join(' ').toLowerCase();
    expect(blob).not.toMatch(/hidden.?city|skiplag|hidden city/);
  });

  it('still works as a one-way hunt', () => {
    const hacks = cheapFlightHacks('SFO', 'HND', '2026-11-02');
    expect(hacks[0].url).toContain('type=ONEWAY');
    expect(hacks[0].url).toContain('sort=CHEAPEST');
    expect(hacks.find((h) => h.id === 'booking-ow-out')).toBeUndefined();
    expect(hacks.some((h) => h.id === 'kayak')).toBe(true);
  });
});

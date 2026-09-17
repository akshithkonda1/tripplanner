import { gradeStay, rankStays, sortByTotal, stayQuality } from '../services/valueRanker';
import { StayListing } from '../services/listings';

function stay(partial: Partial<StayListing> & Pick<StayListing, 'id' | 'name' | 'stars' | 'guestRating' | 'totalPrice'>): StayListing {
  return {
    city: 'Lisbon',
    provider: 'Booking.com',
    nights: 3,
    currency: 'USD',
    checkoutUrl: 'https://www.booking.com/hotel/pt/example.html',
    rooms: 1,
    propertyType: 'hotel',
    hackTags: [],
    ...partial
  };
}

describe('value ranker', () => {
  it('gives a 5-star more Trippy value than a 3-star at the same $1000 / 3 nights / 4 people', () => {
    const three = gradeStay(
      stay({
        id: 'three',
        name: 'Midtown 3-star',
        stars: 3,
        guestRating: 7,
        totalPrice: 1000
      }),
      4
    );
    const five = gradeStay(
      stay({
        id: 'five',
        name: 'Grand 5-star',
        stars: 5,
        guestRating: 9,
        totalPrice: 1000
      }),
      4
    );

    expect(three.nightly).toBeCloseTo(1000 / 3, 5);
    expect(three.perPersonNight).toBeCloseTo(1000 / 3 / 4, 5);
    expect(five.perPersonNight).toBeCloseTo(three.perPersonNight, 5);
    expect(stayQuality(5, 9)).toBeGreaterThan(stayQuality(3, 7));
    expect(five.trippyValue).toBeGreaterThan(three.trippyValue);
    expect(rankStays([three, five], 4)[0].id).toBe('five');
  });

  it('lets a $120 3-star hostel beat a $1000 5-star on total-cost sort', () => {
    const hostel = stay({
      id: 'hostel',
      name: 'Alfama bunks',
      stars: 3,
      guestRating: 8,
      totalPrice: 120,
      propertyType: 'hostel'
    });
    const five = stay({
      id: 'five',
      name: 'Grand 5-star',
      stars: 5,
      guestRating: 9,
      totalPrice: 1000
    });
    const ranked = [hostel, five].map((s) => gradeStay(s, 4));
    expect(sortByTotal(ranked)[0].id).toBe('hostel');
  });
});

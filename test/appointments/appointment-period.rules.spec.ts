import { describe, expect, it } from '@jest/globals';
import {
  getUtcDateTime,
  periodsOverlap,
} from '../../src/appointments/appointment-period.rules';

function period(startMinute: number, endMinute: number) {
  const dayStart = new Date('2026-11-02T00:00:00.000Z').getTime();

  return {
    startsAt: new Date(dayStart + startMinute * 60_000),
    endsAt: new Date(dayStart + endMinute * 60_000),
  };
}

describe('periodsOverlap', () => {
  it('returns false when the first period is entirely before the second', () => {
    expect(periodsOverlap(period(480, 540), period(600, 660))).toBe(false);
  });

  it('returns false when the first period is entirely after the second', () => {
    expect(periodsOverlap(period(600, 660), period(480, 540))).toBe(false);
  });

  it('returns false when the periods touch at the boundary', () => {
    expect(periodsOverlap(period(480, 540), period(540, 600))).toBe(false);
  });

  it('returns true when one period is contained inside the other', () => {
    expect(periodsOverlap(period(480, 720), period(540, 600))).toBe(true);
  });

  it('returns true when the periods cross one another', () => {
    expect(periodsOverlap(period(480, 600), period(540, 660))).toBe(true);
  });
});

describe('getUtcDateTime', () => {
  it('reads weekday and time directly in UTC', () => {
    expect(getUtcDateTime(new Date('2026-11-02T11:00:00.000Z'))).toEqual({
      weekDay: 1,
      minutes: 11 * 60,
    });
  });

  it('uses the UTC calendar day when an instant crosses midnight', () => {
    expect(getUtcDateTime(new Date('2026-11-03T01:30:00.000Z'))).toEqual({
      weekDay: 2,
      minutes: 90,
    });
  });

  it('rejects an invalid Date instance', () => {
    expect(() => getUtcDateTime(new Date('invalid'))).toThrow(RangeError);
  });
});

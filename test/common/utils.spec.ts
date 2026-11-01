import { describe, expect, it } from '@jest/globals';
import { toAbsoluteDayMinutes } from '../../src/@common/utils/utils';

describe(toAbsoluteDayMinutes.name, () => {
  it.each([
    ['00:00', 1440],
    ['08:00', 480],
    ['08:30', 510],
    ['12:45', 765],
    ['23:59', 1439],
  ])('converte %s para minutos absolutos', (time, expected) => {
    expect(toAbsoluteDayMinutes(time)).toBe(expected);
  });
});

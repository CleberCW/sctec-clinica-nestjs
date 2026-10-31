export interface UtcDateTime {
  weekDay: number;
  minutes: number;
}

/**
 * Reads weekday and wall-clock minutes directly from a UTC timestamp.
 * Schedule weekday and HH:mm values are interpreted in UTC as well.
 */
export function getUtcDateTime(value: Date): UtcDateTime {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError('Data e hora UTC inválidas.');
  }

  return {
    weekDay: value.getUTCDay(),
    minutes: value.getUTCHours() * 60 + value.getUTCMinutes(),
  };
}

export interface AppointmentPeriod {
  startsAt: Date;
  endsAt: Date;
}

/**
 * Uses half-open intervals [start, end): adjacent appointments do not overlap.
 */
export function periodsOverlap(
  first: AppointmentPeriod,
  second: AppointmentPeriod,
): boolean {
  return (
    first.startsAt.getTime() < second.endsAt.getTime() &&
    second.startsAt.getTime() < first.endsAt.getTime()
  );
}

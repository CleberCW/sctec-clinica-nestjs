const CLINIC_TIME_ZONE = 'America/Sao_Paulo';

const WEEKDAY_NUMBER: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface ClinicLocalDateTime {
  weekDay: number;
  minutes: number;
}

/**
 * Converts an absolute instant into the clinic's wall-clock weekday and minutes.
 * Shift definitions are local clock times, while appointment instants are absolute.
 */
export function getClinicLocalDateTime(value: Date): ClinicLocalDateTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);

  const values = new Map(parts.map((part) => [part.type, part.value]));
  const weekday = values.get('weekday');
  const hour = Number(values.get('hour'));
  const minute = Number(values.get('minute'));

  if (
    !weekday ||
    WEEKDAY_NUMBER[weekday] === undefined ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    throw new RangeError('Não foi possível converter o horário para o fuso da clínica.');
  }

  return {
    weekDay: WEEKDAY_NUMBER[weekday],
    minutes: hour * 60 + minute,
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

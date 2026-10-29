export function toAbsoluteDayMinutes(timeString: string): number {
  const [hour, minute] = timeString.split(':').map(Number);

  if (hour === 0 && minute === 0) {
    return 1440;
  }

  return hour * 60 + minute;
}

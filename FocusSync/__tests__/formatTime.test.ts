import { formatDuration, formatTime } from '../utils/formatTime';

describe('time formatting', () => {
  it.each([
    [0, '00:00'],
    [5, '00:05'],
    [65, '01:05'],
    [3600, '60:00'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });

  it.each([
    [25, '25 min'],
    [60, '1h'],
    [90, '1h 30m'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

import { AnalyticsSession, buildWeeklyActivity, calculateAchievements, calculateCurrentStreak } from '../utils/analytics';

const session = (overrides: Partial<AnalyticsSession> = {}): AnalyticsSession => ({
  id: 'session-1',
  realMinutes: 30,
  status: 'completada',
  startedAt: new Date(2026, 8, 24, 10).toISOString(),
  interruptionCount: 0,
  ...overrides,
});

describe('buildWeeklyActivity', () => {
  it('creates seven ordered days ending today', () => {
    const today = new Date(2026, 8, 24, 12);
    const result = buildWeeklyActivity([], today);
    expect(result).toHaveLength(7);
    expect(result[6]).toMatchObject({ date: '2026-09-24', day: 'Jue', minutes: 0 });
  });

  it('groups minutes from sessions on the same day', () => {
    const today = new Date(2026, 8, 24, 12);
    const result = buildWeeklyActivity([
      session(),
      session({ id: 'session-2', realMinutes: 20, startedAt: new Date(2026, 8, 24, 15).toISOString() }),
    ], today);
    expect(result[6].minutes).toBe(50);
  });
});

describe('calculateAchievements', () => {
  it('keeps achievements locked for a new user', () => {
    const result = calculateAchievements([], 0, 0);
    expect(result).toHaveLength(5);
    expect(result.every((achievement) => !achievement.unlocked)).toBe(true);
  });

  it('unlocks session, time, streak, interruption-free and plan achievements', () => {
    const sessions = [
      session({ id: 'one', realMinutes: 30 }),
      session({ id: 'two', realMinutes: 35, startedAt: new Date(2026, 8, 24, 11).toISOString() }),
    ];
    const result = calculateAchievements(sessions, 5, 3);
    expect(result.every((achievement) => achievement.unlocked)).toBe(true);
    expect(result.find((achievement) => achievement.id === 'focused-hour')?.unlockedAt).toBe(sessions[1].startedAt);
  });

  it('does not count cancelled sessions toward achievements', () => {
    const result = calculateAchievements([session({ status: 'cancelada', realMinutes: 120 })], 0, 0);
    expect(result.find((achievement) => achievement.id === 'focused-hour')?.current).toBe(0);
  });
});

describe('calculateCurrentStreak', () => {
  it('counts consecutive completed days including today', () => {
    const today = new Date(2026, 8, 24, 12);
    const sessions = [0, 1, 2].map((daysAgo) => {
      const date = new Date(2026, 8, 24 - daysAgo, 10);
      return session({ id: String(daysAgo), startedAt: date.toISOString() });
    });
    expect(calculateCurrentStreak(sessions, today)).toBe(3);
  });

  it('keeps the streak active when the latest session was yesterday', () => {
    const today = new Date(2026, 8, 24, 12);
    expect(calculateCurrentStreak([
      session({ startedAt: new Date(2026, 8, 23, 10).toISOString() }),
    ], today)).toBe(1);
  });

  it('returns zero when the streak is broken', () => {
    const today = new Date(2026, 8, 24, 12);
    expect(calculateCurrentStreak([
      session({ startedAt: new Date(2026, 8, 20, 10).toISOString() }),
    ], today)).toBe(0);
  });
});

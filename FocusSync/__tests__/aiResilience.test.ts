import { fetchGemini } from '../supabase/functions/generate-study-plan/gemini';
import { buildFeedbackMetrics } from '../supabase/functions/generate-study-plan/metrics';

describe('AI retries', () => {
  const originalFetch = global.fetch;
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { global.fetch = originalFetch; jest.useRealTimers(); });
  const response = (status: number) => ({ status, body: { cancel: jest.fn().mockResolvedValue(undefined) } } as unknown as Response);
  it('retries temporary overload and returns the successful response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(200));
    const pending = fetchGemini('https://example.test', {});
    await jest.runAllTimersAsync();
    expect((await pending).status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  it('stops after three attempts', async () => {
    global.fetch = jest.fn().mockResolvedValue(response(503));
    const pending = fetchGemini('https://example.test', {});
    await jest.runAllTimersAsync();
    expect((await pending).status).toBe(503);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
  it('does not retry invalid credentials', async () => {
    global.fetch = jest.fn().mockResolvedValue(response(403));
    expect((await fetchGemini('https://example.test', {})).status).toBe(403);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

it('includes cancelled study time without counting cancelled sessions as completed', () => {
  const metrics = buildFeedbackMetrics([
    { status: 'completada', planned_minutes: 25, real_minutes: 25 },
    { status: 'cancelada', planned_minutes: 25, real_minutes: 6 },
  ], 8);
  expect(metrics).toMatchObject({ sesiones: 2, completadas: 1, canceladas: 1, minutosPlanificados: 50, minutosEstudiados: 31, interrupciones: 8 });
});

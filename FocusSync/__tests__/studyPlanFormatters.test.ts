import { formatMinutes, getBlockTypeLabel, getDifficultyLabel } from '../utils/studyPlanFormatters';

describe('study plan formatters', () => {
  it.each([
    [30, '30 min'],
    [60, '1h'],
    [150, '2h 30m'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });

  it('returns labels for every difficulty', () => {
    expect(getDifficultyLabel('basico')).toBe('Basico');
    expect(getDifficultyLabel('intermedio')).toBe('Intermedio');
    expect(getDifficultyLabel('avanzado')).toBe('Avanzado');
    expect(getDifficultyLabel('dificil')).toBe('Dificil');
  });

  it('returns labels for every block type', () => {
    expect(getBlockTypeLabel('teoria')).toBe('Teoria');
    expect(getBlockTypeLabel('practica')).toBe('Practica');
    expect(getBlockTypeLabel('descanso')).toBe('Descanso');
  });
});

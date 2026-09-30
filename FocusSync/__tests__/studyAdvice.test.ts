import { buildStudyAdvice, STUDY_ADVICE_COUNT } from '../utils/studyAdvice';
import { Session } from '../types';

const session = (id: string, interruptions: number, status = 'completada'): Session => ({
  id,
  subject: 'Estudio',
  duration: 25,
  completed: status === 'completada' ? 25 : 5,
  interruptions,
  status,
  createdAt: `2026-09-${String(20 - Number(id)).padStart(2, '0')}T12:00:00.000Z`,
});

it('contains twenty local advice rules and does not need an AI request', () => {
  expect(STUDY_ADVICE_COUNT).toBe(20);
  expect(buildStudyAdvice([])).toMatchObject({ id: 'first-session' });
});

it('recognizes a reduction in recent interruptions', () => {
  const sessions = [
    ...Array.from({ length: 5 }, (_, index) => session(String(index), 1)),
    ...Array.from({ length: 5 }, (_, index) => session(String(index + 5), 4)),
  ];
  expect(buildStudyAdvice(sessions)).toMatchObject({ id: 'major-improvement' });
});

it('recommends shorter blocks when interruptions are frequent', () => {
  const sessions = Array.from({ length: 4 }, (_, index) => session(String(index), 6));
  expect(buildStudyAdvice(sessions)).toMatchObject({ id: 'many-interruptions' });
});

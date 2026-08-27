import { PlanDifficulty, StudyBlockType } from '../types';

export const formatMinutes = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

export const getDifficultyLabel = (difficulty: PlanDifficulty) => {
  const labels: Record<PlanDifficulty, string> = {
    basico: 'Basico',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
    dificil: 'Dificil',
  };

  return labels[difficulty];
};

export const getBlockTypeLabel = (type: StudyBlockType) => {
  const labels: Record<StudyBlockType, string> = {
    teoria: 'Teoria',
    practica: 'Practica',
    descanso: 'Descanso',
  };

  return labels[type];
};

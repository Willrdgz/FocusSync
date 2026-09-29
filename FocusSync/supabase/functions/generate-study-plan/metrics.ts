interface SessionMetricsRow { status: string; planned_minutes: number; real_minutes: number }

export function buildFeedbackMetrics(sessions: SessionMetricsRow[], interruptions: number) {
  return {
    periodo: 'Hasta las últimas 100 sesiones finalizadas de los últimos 30 días',
    sesiones: sessions.length,
    completadas: sessions.filter((session) => session.status === 'completada').length,
    canceladas: sessions.filter((session) => session.status === 'cancelada').length,
    minutosPlanificados: sessions.reduce((sum, session) => sum + session.planned_minutes, 0),
    minutosEstudiados: sessions.reduce((sum, session) => sum + session.real_minutes, 0),
    interrupciones: interruptions,
  };
}

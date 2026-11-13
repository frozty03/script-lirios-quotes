const DAY_MS = 86400000;

// Dias de calendário, não milissegundos: horário de verão não desloca a virada.
const calendarDay = (y, m, d) => Math.round(Date.UTC(y, m, d) / DAY_MS);

export function dayIndex(now, startISO) {
  const [y, m, d] = startISO.split('-').map(Number);
  const days = calendarDay(now.getFullYear(), now.getMonth(), now.getDate()) - calendarDay(y, m - 1, d);
  return Math.max(0, days) % 30;
}

export function greeting(now) {
  const h = now.getHours();
  return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite';
}

// semester calculation
export function totalSemesters(degree, meta) {
  return (meta.degrees[degree] || 4) * 2;
}

export function currentSemester(startYear, degree, meta, today = new Date()) {
  const months = (today.getFullYear() - startYear) * 12 + (today.getMonth() + 1) - meta.academic_year_start_month;
  const currentSem =Math.floor(months / 6) + 1;
  if(currentSem>totalSemesters(degree,meta)) return -1;
  return Math.max(1,currentSem);
}

export const batchLabel = (startYear, degree, meta) => `${startYear}-${Number(startYear) + meta.degrees[degree]}`;

export function startYearOptions() {
  const y = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => y - i); // this year back to 7 years ago
}

export function getPMLevel(value) {
  if (value <= 15.0)   return { level: 'ดีมาก', color: '#33CCFF' };
  if (value <= 25.0)   return { level: 'ดี', color: '#22c55e' };
  if (value <= 37.5)   return { level: 'ปานกลาง', color: '#eab308' };
  if (value <= 75)     return { level: 'เริ่มมีผลต่อสุขภาพ', color: '#f97316' };
  return { level: 'มีผลต่อสุขภาพ', color: '#ef4444' };
}

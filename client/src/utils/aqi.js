export function getPMLevel(pm) {
  if (pm <= 12) return { level: 'ดีมาก', color: 'green' };
  if (pm <= 35.4) return { level: 'ปานกลาง', color: 'goldenrod' };
  if (pm <= 55.4) return { level: 'เริ่มมีผลต่อสุขภาพ', color: 'orange' };
  if (pm <= 150.4) return { level: 'ไม่ดี', color: 'red' };
  return { level: 'อันตราย', color: 'purple' };
}

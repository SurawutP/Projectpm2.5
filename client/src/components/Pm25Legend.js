export default function Pm25Legend() {
  const levels = [
    { label: 'ดีมาก', min: 0, max: 12, color: 'green' },
    { label: 'ปานกลาง', min: 12.1, max: 35.4, color: 'goldenrod' },
    { label: 'เริ่มมีผลต่อสุขภาพ', min: 35.5, max: 55.4, color: 'orange' },
    { label: 'ไม่ดี', min: 55.5, max: 150.4, color: 'red' },
    { label: 'อันตราย', min: 150.5, max: 500, color: 'purple' },
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-64 z-[9999]">
      <h4 className="font-bold text-sm mb-2">ระดับมาตรฐาน PM2.5 (µg/m³)</h4>
      <ul className="text-sm space-y-1">
        {levels.map((l, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: l.color }}></span>
            {l.label}: {l.min} - {l.max}
          </li>
        ))}
      </ul>
    </div>
  );
}

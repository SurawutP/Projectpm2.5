import Navbar from "../components/navbar";
import Inputbox from "../components/inputbox";
import { useStore } from '../store/dateStore';

export default function Home() {
  const { startDate, endDate, windData, latitude, longitude } = useStore();

  return (
    <div className="max-w-4xl mx-auto relative">
      <Navbar />
      <Inputbox />

      <div className="mt-4">
        
        
        {windData && windData.error && (
          <div className="text-red-500">เกิดข้อผิดพลาดในการดึงข้อมูล</div>
        )}
      </div>

      {/* ✅ กล่องแสดงมาตรฐาน PM2.5 */}
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-64 text-sm z-50">
        <h4 className="font-bold mb-2">ระดับมาตรฐาน PM2.5 (µg/m³)</h4>
        <ul className="space-y-1">
          <li className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: 'green' }}></span>
            ดีมาก
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: 'goldenrod' }}></span>
            ปานกลาง
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: 'orange' }}></span>
            เริ่มมีผลต่อสุขภาพ
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: 'red' }}></span>
            ไม่ดี
          </li>
          
    
        </ul>
      </div>
    </div>
  );
}

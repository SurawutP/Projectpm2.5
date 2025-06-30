import Navbar from "../components/navbar";
import Inputbox from "../components/inputbox";
import { useStore } from '../store/dateStore';

export default function Home() {
    const { startDate, endDate, windData , latitude, longitude } = useStore();

    return (
        <div className="max-w-4xl mx-auto">
            <Navbar />
            <Inputbox />
            <div className="mt-4">
                <div>StartDate: {startDate || '-'}</div>
                <div>EndDate: {endDate || '-'}</div>
                <div>Latitude: {latitude || 0}</div>
                <div>Longitude: {longitude || 0}</div>
                {windData && !windData.error && windData.daily && (
                    <pre>{JSON.stringify(windData, null, 2)}</pre>
                )}
                {windData && windData.error && (
                    <div className="text-red-500">เกิดข้อผิดพลาดในการดึงข้อมูล</div>
                )}
            </div>
        </div>
    );
}
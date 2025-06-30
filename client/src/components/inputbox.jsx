import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/dateStore';
import {
  MapContainer, TileLayer, Marker, useMapEvents, Popup,
} from 'react-leaflet';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});



function ClickHandler() {
  const {
    setLatitude, setLongitude,
    setWindData,
    startDate,
  } = useStore();

  useMapEvents({
    click(e) {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);

      setLatitude(lat);
      setLongitude(lng);

      // ถ้ามี startDate ดึง API
      if (startDate) {
        fetchWindData(lat, lng, startDate, setWindData);
      }
    },
  });

  return null;
}

async function fetchWindData(lat, lng, startDate, setWindData) {
  // ใช้ startDate เป็นทั้ง start และ end date (วันที่เดียว)
  const url = `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=wind_speed_10m_mean,wind_direction_10m_dominant` +
    `&timezone=Asia%2FBangkok` +
    `&start_date=${startDate}&end_date=${startDate}` +
    `&wind_speed_unit=ms`;

  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (!data?.daily) {
      setWindData({ error: true, message: 'ไม่มีข้อมูลลมในวันนี้' });
      return;
    }
    setWindData(data);
  } catch (err) {
    console.error(err);
    setWindData({ error: true });
  }
}

export default function InputMap() {
  const {
  startDate, setStartDate,
  latitude,  longitude,
  windData, setWindData,
  clearAll,
  areaRai, setAreaRai,
} = useStore();


  // กำหนดวันนี้เป็น default startDate
  useEffect(() => {
    if (!startDate) {
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
    }
  }, [startDate, setStartDate]);

  const center = latitude && longitude
    ? [parseFloat(latitude), parseFloat(longitude)]
    : [13.736717, 100.523186]; // กรุงเทพฯ

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      {/* ฟอร์มเลือกวันที่ (เอา endDate ออก) */}
      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold mb-1">เลือกวันที่</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-1"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            min={todayStr}  // เลือกวันที่ในอดีตไม่ได้
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">ขนาดพื้นที่เผา (ไร่)</label>
          <input
            type="number"
            defaultValue={100}
            min={1}
            step={1}
            className="w-full border border-gray-300 rounded px-3 py-1"
          />
        </div>
      </div>

      {/* แสดง Lat/Lng */}
      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1">Latitude</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-1 bg-gray-100"
            value={latitude}
            readOnly
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Longitude</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-1 bg-gray-100"
            value={longitude}
            readOnly
          />
        </div>
      </div>

      {/* ปุ่มล้าง */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          onClick={clearAll}
        >
          ล้างข้อมูล
        </button>
      </div>

      {/* แผนที่ */}
      <div className="h-[500px] w-full rounded shadow overflow-hidden">
        <MapContainer center={center} zoom={8} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* แสดงหมุดถ้ามี */}
          {latitude && longitude && (
            <Marker position={center} icon={customIcon}>
                <Popup>
                    จุดที่เลือก<br />
                    Lat: {latitude}<br />
                    Lng: {longitude}
                </Popup>
            </Marker>

          )}

          <ClickHandler />
        </MapContainer>
      </div>

    </div>
  );
}

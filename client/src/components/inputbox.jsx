// InputMap.jsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getPMLevel } from '../utils/aqi';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function InputMap() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hour, setHour] = useState(0);
  const [area, setArea] = useState('');
  const [position, setPosition] = useState(null);
  const [result, setResult] = useState(null);
  const markerRef = useRef(null);

  const handleMapClick = (e) => {
    setPosition({ lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) });
    setResult(null);
  };

  function MapClickHandler() {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  }

  const simulate = async () => {
    if (!position) return alert('กรุณาคลิกตำแหน่งบนแผนที่');
    const areaRai = parseFloat(area);
    if (!areaRai || areaRai <= 0) return alert('กรุณากรอกขนาดพื้นที่ (>0)');

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${position.lat}&longitude=${position.lng}` +
      `&hourly=wind_speed_10m,wind_direction_10m,boundary_layer_height&timezone=Asia%2FBangkok&start_date=${date}&end_date=${date}&wind_speed_unit=ms`;

    try {
      const js = await fetch(url).then((r) => r.json());
      const idx = js.hourly?.time?.findIndex((t) => t === `${date}T${hour.toString().padStart(2, '0')}:00`);
      if (idx === -1) throw 'ไม่พบข้อมูลชั่วโมงที่เลือก';

      const U = js.hourly.wind_speed_10m?.[idx];
      const b = js.hourly.boundary_layer_height?.[idx];
      const dir = js.hourly.wind_direction_10m?.[idx];
      if (U === undefined || b === undefined) throw 'ข้อมูลไม่ครบ';

      const acres = areaRai * 0.39525691699605;
      const P = ((4e7 * acres) / 24) / 3600;
      const A = acres * 4046.85642;
      const W = Math.sqrt(A) * (Math.SQRT2 / 2);
      const C0mg = P / (U * W * b);
      const C0ug = C0mg * 1000;
      const level = getPMLevel(C0ug);

      setResult({ C0ug, U, b, dir, level });
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err);
      console.error(err);
    }
  };

  const clearAll = () => {
    setPosition(null);
    setArea('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow">
        <div>
          <label className="font-semibold block mb-1">เลือกวันที่</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded w-full px-3 py-1"
          />
        </div>
        <div>
          <label className="font-semibold block mb-1">เลือกชั่วโมง</label>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="border rounded w-full px-3 py-1"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold block mb-1">ขนาดพื้นที่เผา (ไร่)</label>
          <input
            type="number"
            min="1"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="border rounded w-full px-3 py-1"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={simulate}
            className="bg-green-600 hover:bg-green-700 text-white w-full rounded px-4 py-2"
          >
            จำลองผลกระทบ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow">
        <input
          readOnly
          placeholder="Lat"
          value={position?.lat ?? ''}
          className="border rounded px-3 py-1 bg-gray-100"
        />
        <input
          readOnly
          placeholder="Lng"
          value={position?.lng ?? ''}
          className="border rounded px-3 py-1 bg-gray-100"
        />
      </div>

      <MapContainer center={[13.736717, 100.523186]} zoom={8} style={{ height: '500px' }} className="rounded-xl shadow">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <MapClickHandler />
        {position && (
          <Marker position={[position.lat, position.lng]} icon={markerIcon} ref={markerRef}>
            {result && (
              <Popup>
                <div className="text-sm">
                  ⏰ <strong>เวลา:</strong> {hour.toString().padStart(2, '0')}:00<br />
                  🌬️ <strong>U:</strong> {result.U.toFixed(2)} m/s<br />
                  ⛰️ <strong>b:</strong> {result.b.toFixed(0)} m<br />
                  🧭 <strong>ทิศลม:</strong> {result.dir ?? '--'}°<br />
                  📦 <strong>PM2.5:</strong> {result.C0ug.toFixed(1)} µg/m³<br />
                  🌫️ <strong>ระดับ:</strong>{' '}
                  <span style={{ color: result.level.color }}>{result.level.level}</span>
                </div>
              </Popup>
            )}
          </Marker>
        )}
      </MapContainer>

      {result && (
        <div className="bg-white p-4 rounded-xl shadow text-sm">
          <h2 className="font-semibold mb-2">ผลการจำลอง</h2>
          วันที่: {date} เวลา {hour.toString().padStart(2, '0')}:00<br />
          พิกัด: {position.lat}, {position.lng}<br />
          พื้นที่เผา: {area} ไร่ ({(parseFloat(area) * 0.39525691699605).toFixed(2)} acre)<br />
          U = {result.U.toFixed(2)} m/s &nbsp;|&nbsp; b = {result.b.toFixed(0)} m<br />
          PM2.5 ≈ <span className="font-bold">{result.C0ug.toFixed(1)} µg/m³</span> (<span style={{ color: result.level.color }}>{result.level.level}</span>)
        </div>
      )}

      <div className="text-right">
        <button
          onClick={clearAll}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          ล้างข้อมูล
        </button>
      </div>
    </div>
  );
}
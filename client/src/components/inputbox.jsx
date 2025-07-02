import { useEffect, useState } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useStore } from '../store/dateStore';
import { getPMLevel } from '../utils/aqi';

import icon2x from 'leaflet/dist/images/marker-icon-2x.png';
import icon   from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

const markerIcon = new L.Icon({
  iconUrl: icon,
  iconRetinaUrl: icon2x,
  shadowUrl: shadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

async function getElevation(lat, lng) {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
  try {
    const res = await fetch(url);
    const js = await res.json();
    return js?.elevation?.[0] ?? 10;
  } catch {
    return 10;
  }
}

async function fetchAndCalc({ lat, lng, date, areaRai, setWindData }) {
  const windURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=wind_speed_10m_mean&timezone=Asia%2FBangkok` +
    `&start_date=${date}&end_date=${date}&wind_speed_unit=ms`;

  try {
    const [windRes, elev] = await Promise.all([fetch(windURL), getElevation(lat, lng)]);
    const wind = await windRes.json();
    const U = wind?.daily?.wind_speed_10m_mean?.[0];
    if (!U) { setWindData({ error: true, message: 'ไม่มีข้อมูลลม' }); return; }

    const b = elev;
    const acres = areaRai * 0.39525691699605;
    const P = ((4e7 * acres) / 24) / 3600; // mg/s

    const squareMeters = acres * 4046.85642;
    const width = Math.sqrt(squareMeters);
    const W = width * (Math.SQRT2 / 2);

    const C0 = P / (U * W * b);    // mg/m³
    const C0ug = C0 * 1000;        // µg/m³

    setWindData({ U, b, C0ug });
  } catch (e) {
    console.error(e);
    setWindData({ error: true, message: 'ดึงข้อมูลล้มเหลว' });
  }
}

function ClickHandler({ resetSimulated }) {
  const { setLatitude, setLongitude } = useStore();
  useMapEvents({
    click(e) {
      setLatitude(e.latlng.lat.toFixed(6));
      setLongitude(e.latlng.lng.toFixed(6));
      resetSimulated();
    },
  });
  return null;
}

export default function InputMap() {
  const {
    startDate, setStartDate,
    latitude, longitude,
    areaRai, setAreaRai,
    windData, setWindData,
    clearAll,
  } = useStore();

  const [hasSimulated, setHasSimulated] = useState(false);

  useEffect(() => {
    if (!startDate) {
      setStartDate(new Date().toISOString().slice(0, 10));
    }
  }, [startDate, setStartDate]);

  const center = latitude && longitude
    ? [parseFloat(latitude), parseFloat(longitude)]
    : [13.736717, 100.523186];

  const today = new Date().toISOString().slice(0, 10);

  const handleSimulate = () => {
    if (latitude && longitude && areaRai > 0) {
      fetchAndCalc({
        lat: latitude,
        lng: longitude,
        date: startDate,
        areaRai,
        setWindData: (d) => { setWindData(d); setHasSimulated(true); },
      });
    }
  };

  const handleClear = () => {
    clearAll();
    setHasSimulated(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold mb-1">เลือกวันที่</label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={e => { setStartDate(e.target.value); setHasSimulated(false); }}
            className="w-full border rounded px-3 py-1"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">ขนาดพื้นที่เผา (ไร่)</label>
          <input
            type="number"
            value={areaRai}
            min={1}
            onChange={e => { setAreaRai(Number(e.target.value)); setHasSimulated(false); }}
            className="w-full border rounded px-3 py-1"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSimulate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
          >
            จำลองผลกระทบ
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input readOnly value={latitude} className="border rounded px-3 py-1 bg-gray-100" />
        <input readOnly value={longitude} className="border rounded px-3 py-1 bg-gray-100" />
      </div>

      <div className="h-[500px] w-full rounded shadow overflow-hidden">
        <MapContainer center={center} zoom={8} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {latitude && longitude && hasSimulated && windData && (
            <Marker position={center} icon={markerIcon}>
              <Popup minWidth={240}>
                <div className="text-sm">
                  <strong>Lat:</strong> {latitude}<br />
                  <strong>Lng:</strong> {longitude}<br />
                  {windData?.error ? (
                    <span className="text-red-600">❌ {windData.message}</span>
                  ) : (
                    <>
                      <hr className="my-2" />
                      🌬️ <strong>ความเร็วลม (U):</strong> {windData.U.toFixed(2)} m/s<br />
                      🏔️ <strong>ความสูงผสม (b):</strong> {windData.b} m<br />
                      📦 <strong>PM2.5 (C₀):</strong> {windData.C0ug.toFixed(1)} µg/m³<br />
                      🌫️ <strong>ระดับ:</strong>{' '}
                      <span className="font-semibold" style={{ color: getPMLevel(windData.C0ug).color }}>
                        {getPMLevel(windData.C0ug).level}
                      </span>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          <ClickHandler resetSimulated={() => setHasSimulated(false)} />
        </MapContainer>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleClear}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          ล้างข้อมูล
        </button>
      </div>
    </div>
  );
}

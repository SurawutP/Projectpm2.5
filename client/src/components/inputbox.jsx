import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Check } from "lucide-react";
import { getPMLevel } from "../utils/aqi";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ addMarker }) {
  useMapEvents({
    click(e) {
      addMarker(e.latlng);
    },
  });
  return null;
}

export default function InputMap() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hour, setHour] = useState(0);
  const [markers, setMarkers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const now = new Date();
  const selectedDate = new Date(date + "T00:00:00");
  const isToday =
    now.getFullYear() === selectedDate.getFullYear() &&
    now.getMonth() === selectedDate.getMonth() &&
    now.getDate() === selectedDate.getDate();
  const isBeforeToday =
    selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentHour = now.getHours();
  const disableSimulateBtn = isBeforeToday || (isToday && hour < currentHour);

  const addMarker = (latlng) => {
    const newMarker = {
      id: Date.now(),
      lat: latlng.lat.toFixed(6),
      lng: latlng.lng.toFixed(6),
      area: "",
      result: null,
    };
    setMarkers((prev) => [...prev, newMarker]);
    setSelectedId(newMarker.id);
  };

  const removeMarker = (id) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateArea = (val) => {
    setMarkers((prev) =>
      prev.map((m) =>
        m.id === selectedId ? { ...m, area: val, result: null } : m,
      ),
    );
  };

  const simulate = async () => {
    if (disableSimulateBtn) return alert("ไม่สามารถจำลองเวลาที่ผ่านมาได้");
    const marker = markers.find((m) => m.id === selectedId);
    if (!marker) return alert("กรุณาเลือกหมุด");
    if (!marker.lat || !marker.lng) return alert("ตำแหน่งไม่ถูกต้อง");
    const areaRai = parseFloat(marker.area);
    if (!areaRai || areaRai <= 0) return alert("กรุณากรอกขนาดพื้นที่ (>0)");

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${marker.lat}&longitude=${marker.lng}` +
      `&hourly=wind_speed_10m,wind_direction_10m,boundary_layer_height&timezone=Asia%2FBangkok&start_date=${date}&end_date=${date}&wind_speed_unit=ms`;

    try {
      const js = await fetch(url).then((r) => r.json());
      const idx = js.hourly?.time?.findIndex(
        (t) => t === `${date}T${hour.toString().padStart(2, "0")}:00`,
      );
      if (idx === -1) throw "ไม่พบข้อมูลชั่วโมงที่เลือก";

      const U = js.hourly.wind_speed_10m?.[idx];
      const b = js.hourly.boundary_layer_height?.[idx];
      const dir = js.hourly.wind_direction_10m?.[idx];
      if (U === undefined || b === undefined) throw "ข้อมูลไม่ครบ";

      const acres = areaRai * 0.39525691699605;
      const P = (4e7 * acres) / 24 / 3600;
      const A = acres * 4046.85642;
      const W = Math.sqrt(A) * (Math.SQRT2 / 2);
      const C0mg = P / (U * W * b);
      const C0ug = C0mg * 1000;
      const level = getPMLevel(C0ug);

      const newResult = { C0ug, U, b, dir, level };

      setMarkers((prev) =>
        prev.map((m) =>
          m.id === selectedId ? { ...m, result: newResult } : m,
        ),
      );
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err);
      console.error(err);
    }
  };

  const clearAll = () => {
    setMarkers([]);
    setSelectedId(null);
  };

  const selectedMarker = markers.find((m) => m.id === selectedId);

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* Control Panel */}
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-gray-100 bg-white p-10 shadow-xl duration-300 ">
        <h2 className="mb-4 text-xl font-bold">ตั้งค่าการจำลอง</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              วันที่
            </label>
            <input
              type="date"
              value={date}
              max={now.toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ชั่วโมง
            </label>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const isPastHour =
                  isBeforeToday || (isToday && i < currentHour);
                return (
                  <option
                    key={i}
                    value={i}
                    disabled={isPastHour}
                    className={isPastHour ? "text-gray-400" : ""}
                  >
                    {i.toString().padStart(2, "0")}:00
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ขนาดพื้นที่ (ไร่)
            </label>
            <input
              type="number"
              min="1"
              value={selectedMarker?.area ?? ""}
              onChange={(e) => updateArea(e.target.value)}
              disabled={!selectedMarker}
              placeholder={selectedMarker ? "" : "เลือกหมุดก่อน"}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>
          <div className="space-y-2">
            <button
              onClick={simulate}
              disabled={disableSimulateBtn || !selectedMarker}
              className="w-full rounded-lg bg-green-700 px-4 py-2 font-medium text-white shadow transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-white" />
                <span>จำลองผลกระทบ</span>
              </div>
            </button>

            <button
              onClick={clearAll}
              className="w-full rounded-lg bg-gray-600 px-4 py-2 font-medium text-white shadow transition hover:bg-gray-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              ล้างทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-lg bg-white shadow-lg">
        <MapContainer
          center={[13.736717, 100.523186]}
          zoom={8}
          style={{ height: "500px" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          <MapClickHandler addMarker={addMarker} />
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => setSelectedId(m.id),
              }}
            >
              {m.result && (
                <Popup>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>เวลา:</strong> {hour.toString().padStart(2, "0")}
                      :00
                    </div>
                    <div>
                      <strong>ความเร็วลม:</strong> {m.result.U.toFixed(2)} m/s
                    </div>
                    <div>
                      <strong>ความสูงชั้นขอบเขต:</strong>{" "}
                      {m.result.b.toFixed(0)} m
                    </div>
                    <div>
                      <strong>ทิศลม:</strong> {m.result.dir ?? "--"}°
                    </div>
                    <div>
                      <strong>PM2.5:</strong> {m.result.C0ug.toFixed(1)} µg/m³
                    </div>
                    <div>
                      12 <strong>ระดับ:</strong>{" "}
                      <span style={{ color: m.result.level.color }}>
                        {m.result.level.level}
                      </span>
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Marker List */}
      {markers.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold">รายการหมุด</h2>
          <ul className="max-h-64 space-y-2 overflow-auto">
            {markers.map((m) => (
              <li
                key={m.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  m.id === selectedId ? "bg-green-50" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedId(m.id)}
              >
                <div>
                  <div className="font-medium">
                    พิกัด: {m.lat}, {m.lng}
                  </div>
                  <div className="text-sm text-gray-600">
                    ขนาดพื้นที่: {m.area || "-"} ไร่{" "}
                    {m.result && (
                      <>
                        | PM2.5:{" "}
                        <span style={{ color: m.result.level.color }}>
                          {m.result.C0ug.toFixed(1)} µg/m³
                        </span>{" "}
                        ({m.result.level.level})
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMarker(m.id);
                  }}
                  className="rounded-md bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

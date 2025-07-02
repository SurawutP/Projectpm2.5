import { create } from 'zustand';

export const useStore = create((set) => ({
  /* -------- state -------- */
  startDate : '',
  latitude  : '',
  longitude : '',
  areaRai   : 100,      // ผู้ใช้กรอก
  windData  : null,     // ผลคำนวณหรือ error

  /* -------- actions -------- */
  setStartDate : (v) => set({ startDate : v }),
  setLatitude  : (v) => set({ latitude  : v }),
  setLongitude : (v) => set({ longitude : v }),
  setAreaRai   : (v) => set({ areaRai   : v }),
  setWindData  : (d) => set({ windData  : d }),

  clearAll : () => set({
    latitude : '', longitude : '', windData : null,
  }),
}));

import { create } from "zustand";

export const useStore = create((set) => ({
    startDate: "",
    endDate: "",
    windData: [],
    latitude: 0,
    longitude: 0,
    setStartDate: (date) => set({ startDate: date }),
    setEndDate: (date) => set({ endDate: date }),
    setWindData: (data) => set({ windData: data }),
    setLatitude:(data) => set({ latitude: data }),
    setLongitude:(data) => set({ longitude: data }),
}));

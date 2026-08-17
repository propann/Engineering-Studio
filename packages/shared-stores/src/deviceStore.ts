import { create } from 'zustand';
import type { DeviceInfo } from '@studio-hub/types';

export interface DeviceStore {
  isConnected: boolean;
  deviceInfo: DeviceInfo | null;
  midiDevices: string[];

  connect: (info: DeviceInfo) => void;
  disconnect: () => void;
  setMidiDevices: (devices: string[]) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  isConnected: false,
  deviceInfo: null,
  midiDevices: [],

  connect: (info) =>
    set({
      isConnected: true,
      deviceInfo: info,
    }),

  disconnect: () =>
    set({
      isConnected: false,
      deviceInfo: null,
    }),

  setMidiDevices: (devices) =>
    set({ midiDevices: devices }),
}));

'use client';

import { create } from 'zustand';

export interface DeviceInfo {
  name: string;
  version: string;
  firmwareVersion?: string;
}

interface DeviceStore {
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

  connect: (info: DeviceInfo) =>
    set({
      isConnected: true,
      deviceInfo: info,
    }),

  disconnect: () =>
    set({
      isConnected: false,
      deviceInfo: null,
    }),

  setMidiDevices: (devices: string[]) =>
    set({ midiDevices: devices }),
}));

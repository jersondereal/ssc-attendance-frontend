import axios from "axios";
import { create } from "zustand";
import config from "../config";
import type { DBEvent } from "./types";

interface EventsState {
  events: DBEvent[];
  loading: boolean;
  fetchEvents: () => Promise<void>;
  setEvents: (events: DBEvent[]) => void;
  addEvent: (event: DBEvent) => void;
  updateEvent: (id: string, event: DBEvent) => void;
  removeEvent: (id: string) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  loading: false,

  fetchEvents: async () => {
    set({ loading: true });
    try {
      const res = await axios.get<DBEvent[]>(`${config.API_BASE_URL}/events`);
      set({ events: res.data ?? [], loading: false });
    } catch (err) {
      console.error(err);
      set({ events: [], loading: false });
    }
  },

  setEvents: (events) => set({ events }),

  addEvent: (event) =>
    set((state) => ({ events: [...state.events, event] })),

  updateEvent: (id, updated) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id.toString() === id ? updated : e
      ),
    })),

  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id.toString() !== id),
    })),
}));

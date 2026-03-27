import { create } from 'zustand';
import type { Session, ReplayEvent } from '../services/sessionApi';

interface SessionStore {
  sessions: Session[];
  selectedSessionId: string | null;
  replayEvents: ReplayEvent[];
  cursorIndex: number;
  isPlaying: boolean;
  speed: number;
  canvasSyncEnabled: boolean;

  setSessions: (sessions: Session[]) => void;
  selectSession: (id: string | null) => void;
  setReplayEvents: (events: ReplayEvent[]) => void;
  setCursorIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setCanvasSync: (enabled: boolean) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  selectedSessionId: null,
  replayEvents: [],
  cursorIndex: 0,
  isPlaying: false,
  speed: 1,
  canvasSyncEnabled: false,

  setSessions: (sessions) => set({ sessions }),
  selectSession: (id) => set({ selectedSessionId: id, cursorIndex: 0, isPlaying: false }),
  setReplayEvents: (events) => set({ replayEvents: events }),
  setCursorIndex: (index) => set({ cursorIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSpeed: (speed) => set({ speed }),
  setCanvasSync: (enabled) => set({ canvasSyncEnabled: enabled }),
  reset: () =>
    set({
      sessions: [],
      selectedSessionId: null,
      replayEvents: [],
      cursorIndex: 0,
      isPlaying: false,
      speed: 1,
      canvasSyncEnabled: false,
    }),
}));

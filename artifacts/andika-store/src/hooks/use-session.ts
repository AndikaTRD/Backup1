import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

interface SessionState {
  sessionId: string;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: uuidv4(),
    }),
    {
      name: 'andika-store-session',
    }
  )
);

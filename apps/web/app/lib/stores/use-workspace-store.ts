import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceStore {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      
      // Updates the state AND saves it to localStorage instantly
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
    }),
    {
      name: "taskflow-workspace-storage", // The key used in your browser's local storage
    }
  )
);
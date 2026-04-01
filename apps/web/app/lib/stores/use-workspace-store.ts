import { create } from "zustand";
import { persist } from "zustand/middleware";

// Defining the roles exactly as they appear in your Prisma schema
type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST" | null;

interface WorkspaceStore {
  activeWorkspaceId: string | null;
  currentRole: WorkspaceRole; // 🟢 NEW: Track the user's role
  setActiveWorkspaceId: (id: string) => void;
  setCurrentRole: (role: WorkspaceRole) => void; // 🟢 NEW: Action to update the role
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      currentRole: null, // Defaults to null until the app loads
      
      // Updates the state AND saves it to localStorage instantly
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      
      // 🟢 NEW: Updates the user's role when they switch workspaces
      setCurrentRole: (role) => set({ currentRole: role }),
    }),
    {
      name: "taskflow-workspace-storage",
    }
  )
);
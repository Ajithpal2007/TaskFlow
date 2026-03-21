import { create } from "zustand";

interface UIState {
  // Sidebar State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // Task Modal State (For editing/viewing details)
  selectedTaskId: string | null;
  setSelectedTask: (id: string | null) => void;

  // Modal Visibility States
  isCreateTaskModalOpen: boolean;
  setCreateTaskModalOpen: (open: boolean) => void;
  
  isCreateProjectModalOpen: boolean;
  setCreateProjectModalOpen: (open: boolean) => void;

  isTaskDetailsModalOpen: boolean;
  activeTaskId: string | null;

  openTaskDetails: (taskId: string) => void;
  closeTaskDetails: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Defaults
  
  isSidebarOpen: true,
  selectedTaskId: null,
  isCreateTaskModalOpen: false,
  isCreateProjectModalOpen: false,

  isTaskDetailsModalOpen: false,
  activeTaskId: null,

  //  ACTIONS
  openTaskDetails: (taskId) => set({ isTaskDetailsModalOpen: true, activeTaskId: taskId }),
  closeTaskDetails: () => set({ isTaskDetailsModalOpen: false, activeTaskId: null }),


  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  
  setCreateTaskModalOpen: (open) => set({ isCreateTaskModalOpen: open }),
  
 
  setCreateProjectModalOpen: (open) => set({ isCreateProjectModalOpen: open }),
}));
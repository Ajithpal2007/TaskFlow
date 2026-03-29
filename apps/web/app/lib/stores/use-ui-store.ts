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

  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;

  isTaskDetailsOpen: boolean;
  

  openTaskDetails: (taskId: string) => void;
  closeTaskDetails: () => void;

  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Defaults
  
  isSidebarOpen: true,
  selectedTaskId: null,
  isCreateTaskModalOpen: false,
  isCreateProjectModalOpen: false,
  isTaskDetailsModalOpen: false,
  activeTaskId: null,
  isTaskDetailsOpen: false,
  
  activeThreadId: null,


  //  ACTIONS
  openTaskDetails: (taskId) => set({ isTaskDetailsModalOpen: true, activeTaskId: taskId }),
  closeTaskDetails: () => set({ isTaskDetailsModalOpen: false, activeTaskId: null }),


  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  
  setCreateTaskModalOpen: (open) => set({ isCreateTaskModalOpen: open }),
  
 
  setCreateProjectModalOpen: (open) => set({ isCreateProjectModalOpen: open }),

  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),



  setActiveThreadId: (id) => set({ activeThreadId: id }),
}));
import create from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set((state) => ({ ...state, user })),
    }),
    {
      name: "user-store", // unique name of the store
      getStorage: () => localStorage, // specify the storage to use (localStorage is the default)
    }
  )
);

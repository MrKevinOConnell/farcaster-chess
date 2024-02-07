import create from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    (set) => ({
      user: null,
      invitedUser: null,
      qrCode: null,
      openSignerModal: false,
      setOpenSignerModal: (openSignerModal) =>
        set((state) => ({ ...state, openSignerModal })),
      setQrCode: (qrCode) => set((state) => ({ ...state, qrCode })),
      setInvitedUser: (invitedUser) =>
        set((state) => ({ ...state, invitedUser })),
      setUser: (user) => set((state) => ({ ...state, user })),
      openChallengeModal: false,
      openLichessModal: false,
      setLichessModal: (openLichessModal) =>
        set((state) => ({ ...state, openLichessModal })),
      setChallengeModal: (openChallengeModal) =>
        set((state) => ({ ...state, openChallengeModal })),
    }),
    {
      name: "user-store", // unique name of the store
      getStorage: () => localStorage, // specify the storage to use (localStorage is the default)
    }
  )
);

import { create } from 'zustand'

export type CursorMode = 'default' | 'link' | 'drag' | 'view' | 'hidden'

type UiState = {
  menuOpen: boolean
  cursor: CursorMode
  cursorLabel: string
  setMenuOpen: (open: boolean) => void
  setCursor: (mode: CursorMode, label?: string) => void
  resetCursor: () => void
}

export const useUi = create<UiState>((set) => ({
  menuOpen: false,
  cursor: 'default',
  cursorLabel: '',
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setCursor: (cursor, cursorLabel = '') => set({ cursor, cursorLabel }),
  resetCursor: () => set({ cursor: 'default', cursorLabel: '' }),
}))

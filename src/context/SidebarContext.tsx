import { createContext, useContext, type ReactNode } from 'react'

interface SidebarContextType {
  sidebarContent: ReactNode
  setSidebarContent: (content: ReactNode) => void
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebarContext = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider')
  }
  return context
}
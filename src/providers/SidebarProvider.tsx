import { useState, type ReactNode } from 'react'
import { SidebarContext } from '../context/SidebarContext'

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarContent, setSidebarContent] = useState<ReactNode>(null)

  return (
    <SidebarContext.Provider value={{ sidebarContent, setSidebarContent }}>
      {children}
    </SidebarContext.Provider>
  )
}
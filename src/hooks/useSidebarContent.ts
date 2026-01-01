import { useEffect, type ReactNode } from 'react'
import { useSidebarContext } from '../context/SidebarContext'

export function useSidebarContent(factory: () => ReactNode) {
  const { setSidebarContent } = useSidebarContext()

  useEffect(() => {
    setSidebarContent(factory())
    return () => setSidebarContent(null)
  }, [factory, setSidebarContent])
}


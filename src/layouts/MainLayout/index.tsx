import { Box } from '@mui/material'
import { useState } from 'react'
import { SidebarLayout } from '../SidebarLayout/index.tsx'
import { Outlet } from 'react-router-dom'
import { useSidebarContext } from '../../context/SidebarContext.tsx'

export const MainLayout = () => {
  const [sideBarCollapsed, setSidebarCollapsed] =  useState(false)
  const { sidebarContent } = useSidebarContext()
  return (
    <Box display="flex" height="100vh" width="100vw">
      <SidebarLayout collapsed={sideBarCollapsed} onToggle={()=> setSidebarCollapsed(!sideBarCollapsed)} >
         {sidebarContent}
      </SidebarLayout>
      <Box sx={{transition: 'width 0.3s', width: `calc(100% - ${sideBarCollapsed ? 120 : 220}px)` }}>
        <Outlet />
      </Box>
    </Box>
  )
}
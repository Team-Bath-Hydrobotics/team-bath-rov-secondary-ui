import { useSidebarContent } from '../../hooks/useSidebarContent'
import { useCallback } from 'react'
import { MainContentLayout } from '../../layouts/MainContentLayout'

// This should be be replaced with an actual imported component
const CoPilotSidebarNav = () => (
  <>
  Camera and telemetry selectors
  </>
)

export const CoPilot = () => {
    const sidebarFactory = useCallback(
  () => <CoPilotSidebarNav />,
  []
)
useSidebarContent(sidebarFactory)
  return (
    <MainContentLayout name="CoPilot"/>
  )
}
import{ MainContentLayout } from '../../layouts/MainContentLayout'
import { useSidebarContent } from '../../hooks/useSidebarContent'
import { useCallback } from 'react'

const TelemetrySidebarNav = () => (
  <>
  Telemetry selectors
  </>
)
export const Telemetry = () => {

   const sidebarFactory = useCallback(
    () => <TelemetrySidebarNav />,
    []
   )
  useSidebarContent(sidebarFactory)

  return (
    <MainContentLayout name="Telemetry"/>
  )
}
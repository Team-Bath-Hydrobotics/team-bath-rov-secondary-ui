import { Box } from '@mui/material';
import { SidebarToggleButton } from '../../components/Toggles';
import SideBarMenuLayout from '../SideBarMenuLayout/index.tsx';
import { VerticalNav } from '../../components/VerticalNav';
interface SidebarLayoutProps {
  collapsed: boolean;
  onToggle: () => void;
  width?: number;
  children?: React.ReactNode;
}

export const SidebarLayout = ({
  collapsed,
  onToggle,
  width = 220,
  children,
}: SidebarLayoutProps) => {
  return (
    <Box
      width={collapsed ? 120 : width}
      display="flex"
      flexDirection="column"
      sx={{
        transition: 'width 0.3s, height 0.3s',
        padding: '8px',
        backgroundColor: 'primary.dark',
      }}
    >
      <SidebarToggleButton collapsed={collapsed} onToggle={onToggle} />

      <Box
        flexGrow={1}
        overflow="auto"
        sx={{
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <SideBarMenuLayout>
          <VerticalNav collapsed={collapsed} />
        </SideBarMenuLayout>
        {children}
      </Box>
    </Box>
  );
};

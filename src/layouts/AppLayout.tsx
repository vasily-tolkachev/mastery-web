import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import { AppBar, Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Paper, Toolbar, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';

const sidebarItems = [
  { label: 'Home', path: '/home', icon: <HomeRoundedIcon fontSize="small" /> },
  { label: 'Learning', path: '/learning', icon: <SchoolRoundedIcon fontSize="small" /> },
  { label: 'Programs', path: '/programs', icon: <MenuBookRoundedIcon fontSize="small" /> },
  { label: 'Progress', path: '/progress', icon: <InsightsRoundedIcon fontSize="small" /> },
  { label: 'Goals', path: '/goals', icon: <TrackChangesRoundedIcon fontSize="small" /> },
  { label: 'Settings', path: '/settings', icon: <SettingsRoundedIcon fontSize="small" /> },
] as const;

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/home' && location.pathname.startsWith(`${path}/`));

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SchoolRoundedIcon fontSize="small" color="primary" />
            <Typography variant="h6" component="div">
              Mastery
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar sx={{ minHeight: 64 }} />

      <Box
        component="div"
        sx={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Paper component="nav" aria-label="Primary navigation" square elevation={0} sx={{ borderRight: 1, borderColor: 'divider' }}>
          <List dense disablePadding>
            {sidebarItems.map((item, index) => (
              <Box key={item.label}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive(item.path)}
                  aria-label={`Go to ${item.label}`}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
                {index === 3 ? <Divider /> : null}
              </Box>
            ))}
          </List>
        </Paper>

        <Box component="main" sx={{ p: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Product Shell
          </Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

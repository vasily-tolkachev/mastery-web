import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import { AppBar, Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Paper, Toolbar, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';

const sidebarItems = [
  { label: 'Home', icon: <HomeRoundedIcon fontSize="small" /> },
  { label: 'Learning', icon: <SchoolRoundedIcon fontSize="small" /> },
  { label: 'Programs', icon: <MenuBookRoundedIcon fontSize="small" /> },
  { label: 'Progress', icon: <InsightsRoundedIcon fontSize="small" /> },
  { label: 'Goals', icon: <TrackChangesRoundedIcon fontSize="small" /> },
  { label: 'Settings', icon: <SettingsRoundedIcon fontSize="small" /> },
] as const;

export function AppLayout({ children }: PropsWithChildren) {
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
        sx={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Paper square elevation={0} sx={{ borderRight: 1, borderColor: 'divider' }}>
          <List dense disablePadding>
            {sidebarItems.map((item, index) => (
              <Box key={item.label}>
                <ListItemButton selected={item.label === 'Learning'}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
                {index === 3 ? <Divider /> : null}
              </Box>
            ))}
          </List>
        </Paper>

        <Box sx={{ p: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Product Shell
          </Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

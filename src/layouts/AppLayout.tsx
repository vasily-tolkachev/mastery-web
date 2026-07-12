import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { AppBar, Box, Divider, FormControl, IconButton, InputLabel, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Paper, Select, Toolbar, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/AppThemeContext';

const sidebarItems = [
  { label: 'Home', path: '/home', icon: <HomeRoundedIcon fontSize="small" /> },
  { label: 'Learning', path: '/learning', icon: <SchoolRoundedIcon fontSize="small" /> },
  { label: 'Programs', path: '/programs', icon: <MenuBookRoundedIcon fontSize="small" /> },
  { label: 'Progress', path: '/progress', icon: <InsightsRoundedIcon fontSize="small" /> },
  { label: 'Quests', path: '/quests', icon: <AutoStoriesRoundedIcon fontSize="small" /> },
  { label: 'Goals', path: '/goals', icon: <TrackChangesRoundedIcon fontSize="small" /> },
  { label: 'Settings', path: '/settings', icon: <SettingsRoundedIcon fontSize="small" /> },
] as const;

export function AppLayout({ children }: PropsWithChildren) {
  const { logout } = useAuth();
  const { modeSetting, accent, darkTheme, setModeSetting, setAccent, setDarkTheme } = useAppTheme();
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/home' && location.pathname.startsWith(`${path}/`));

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="fixed" color="transparent" elevation={0}>
        <Toolbar sx={{ minHeight: { xs: 112, sm: 64 }, alignItems: { xs: 'flex-start', sm: 'center' }, py: { xs: 1, sm: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SchoolRoundedIcon fontSize="small" color="primary" />
            <Typography variant="h6" component="div">
              Mastery
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <FormControl size="small" sx={{ minWidth: { xs: 122, sm: 98 } }}>
              <InputLabel id="theme-mode-label">Mode</InputLabel>
              <Select
                labelId="theme-mode-label"
                label="Mode"
                value={modeSetting}
                onChange={(e) => setModeSetting(e.target.value as 'system' | 'light' | 'dark')}
              >
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: 132, sm: 104 } }}>
              <InputLabel id="theme-accent-label">Theme</InputLabel>
              <Select
                labelId="theme-accent-label"
                label="Theme"
                value={accent}
                onChange={(e) =>
                  setAccent(
                    e.target.value as
                      | 'cyan'
                      | 'indigo'
                      | 'emerald'
                      | 'amber'
                      | 'rose'
                      | 'slate'
                      | 'violet'
                      | 'teal'
                      | 'sky'
                      | 'lime'
                      | 'orange'
                      | 'fuchsia'
                      | 'red'
                      | 'blue',
                  )
                }
              >
                <MenuItem value="cyan">Cyan</MenuItem>
                <MenuItem value="indigo">Indigo</MenuItem>
                <MenuItem value="emerald">Emerald</MenuItem>
                <MenuItem value="amber">Amber</MenuItem>
                <MenuItem value="rose">Rose</MenuItem>
                <MenuItem value="slate">Slate</MenuItem>
                <MenuItem value="violet">Violet</MenuItem>
                <MenuItem value="teal">Teal</MenuItem>
                <MenuItem value="sky">Sky</MenuItem>
                <MenuItem value="lime">Lime</MenuItem>
                <MenuItem value="orange">Orange</MenuItem>
                <MenuItem value="fuchsia">Fuchsia</MenuItem>
                <MenuItem value="red">Red</MenuItem>
                <MenuItem value="blue">Blue</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: 136, sm: 116 } }}>
              <InputLabel id="theme-dark-label">Dark</InputLabel>
              <Select
                labelId="theme-dark-label"
                label="Dark"
                value={darkTheme}
                onChange={(e) =>
                  setDarkTheme(e.target.value as 'midnight' | 'graphite' | 'ocean' | 'forest' | 'violet' | 'espresso')
                }
              >
                <MenuItem value="midnight">Midnight</MenuItem>
                <MenuItem value="graphite">Graphite</MenuItem>
                <MenuItem value="ocean">Ocean</MenuItem>
                <MenuItem value="forest">Forest</MenuItem>
                <MenuItem value="violet">Violet</MenuItem>
                <MenuItem value="espresso">Espresso</MenuItem>
              </Select>
            </FormControl>
            <IconButton aria-label="Logout" onClick={logout}>
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar sx={{ minHeight: { xs: 112, sm: 64 } }} />

      <Box
        component="div"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '260px 1fr' },
          minHeight: { xs: 'calc(100vh - 112px)', sm: 'calc(100vh - 64px)' },
        }}
      >
        <Paper
          component="nav"
          aria-label="Primary navigation"
          square
          elevation={0}
          sx={{
            borderRight: { xs: 0, md: 1 },
            borderBottom: { xs: 1, md: 0 },
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <List
            dense
            disablePadding
            sx={{
              display: { xs: 'flex', md: 'block' },
              overflowX: { xs: 'auto', md: 'visible' },
              whiteSpace: { xs: 'nowrap', md: 'normal' },
            }}
          >
            {sidebarItems.map((item, index) => (
              <Box key={item.label} sx={{ minWidth: { xs: 128, md: 'auto' } }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive(item.path)}
                  aria-label={`Go to ${item.label}`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  sx={{ px: { xs: 1.5, md: 2 }, py: { xs: 1.25, md: 1 } }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: { xs: '1rem', md: '0.95rem' },
                      },
                    }}
                  />
                </ListItemButton>
                {index === 3 ? <Divider sx={{ display: { xs: 'none', md: 'block' } }} /> : null}
              </Box>
            ))}
          </List>
        </Paper>

        <Box component="main" sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

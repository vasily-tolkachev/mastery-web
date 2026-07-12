import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ColorLensRoundedIcon from '@mui/icons-material/ColorLensRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { AppBar, Box, Divider, FormControl, IconButton, InputLabel, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Select, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import type { MouseEvent, PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/AppThemeContext';

const sidebarItems = [
  { label: 'Главная', path: '/home', icon: <HomeRoundedIcon fontSize="small" /> },
  { label: 'Обучение', path: '/learning', icon: <SchoolRoundedIcon fontSize="small" /> },
  { label: 'Программы', path: '/programs', icon: <MenuBookRoundedIcon fontSize="small" /> },
  { label: 'Прогресс', path: '/progress', icon: <InsightsRoundedIcon fontSize="small" /> },
  { label: 'Квесты', path: '/quests', icon: <AutoStoriesRoundedIcon fontSize="small" /> },
  { label: 'Цели', path: '/goals', icon: <TrackChangesRoundedIcon fontSize="small" /> },
  { label: 'Настройки', path: '/settings', icon: <SettingsRoundedIcon fontSize="small" /> },
] as const;

export function AppLayout({ children }: PropsWithChildren) {
  const { logout } = useAuth();
  const { modeSetting, accent, darkTheme, setModeSetting, setAccent, setDarkTheme } = useAppTheme();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [themeAnchor, setThemeAnchor] = useState<null | HTMLElement>(null);
  const [pagesAnchor, setPagesAnchor] = useState<null | HTMLElement>(null);
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/home' && location.pathname.startsWith(`${path}/`));
  const openThemeMenu = (event: MouseEvent<HTMLElement>) => setThemeAnchor(event.currentTarget);
  const closeThemeMenu = () => setThemeAnchor(null);
  const openPagesMenu = (event: MouseEvent<HTMLElement>) => setPagesAnchor(event.currentTarget);
  const closePagesMenu = () => setPagesAnchor(null);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="fixed" color="transparent" elevation={0}>
        <Toolbar
          sx={{
            minHeight: { xs: 52, sm: 64 },
            alignItems: 'center',
            py: 0,
            px: { xs: 1, sm: 2 },
            flexDirection: 'row',
            gap: 0.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: 'auto', sm: 'auto' }, minWidth: 0 }}>
            <SchoolRoundedIcon fontSize="small" color="primary" />
            <Typography variant="subtitle1" component="div" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
              Mastery
            </Typography>
          </Box>
          {isMobile ? (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.25 }}>
              <IconButton aria-label="Страницы" onClick={openPagesMenu} size="small" sx={{ p: 0.5 }}>
                <MenuRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Тема" onClick={openThemeMenu} size="small" sx={{ p: 0.5 }}>
                <ColorLensRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Выйти" onClick={logout} size="small" sx={{ p: 0.5 }}>
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel id="theme-mode-label">Режим</InputLabel>
                <Select
                  labelId="theme-mode-label"
                  label="Режим"
                  value={modeSetting}
                  onChange={(e) => setModeSetting(e.target.value as 'system' | 'light' | 'dark')}
                >
                  <MenuItem value="system">Системный</MenuItem>
                  <MenuItem value="light">Светлый</MenuItem>
                  <MenuItem value="dark">Тёмный</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="theme-accent-label">Тема</InputLabel>
                <Select
                  labelId="theme-accent-label"
                  label="Тема"
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
                  <MenuItem value="cyan">Циан</MenuItem>
                  <MenuItem value="indigo">Индиго</MenuItem>
                  <MenuItem value="emerald">Изумруд</MenuItem>
                  <MenuItem value="amber">Янтарь</MenuItem>
                  <MenuItem value="rose">Роза</MenuItem>
                  <MenuItem value="slate">Сланец</MenuItem>
                  <MenuItem value="violet">Фиолет</MenuItem>
                  <MenuItem value="teal">Бирюза</MenuItem>
                  <MenuItem value="sky">Небо</MenuItem>
                  <MenuItem value="lime">Лайм</MenuItem>
                  <MenuItem value="orange">Оранжевый</MenuItem>
                  <MenuItem value="fuchsia">Фуксия</MenuItem>
                  <MenuItem value="red">Красный</MenuItem>
                  <MenuItem value="blue">Синий</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel id="theme-dark-label">Тёмная</InputLabel>
                <Select
                  labelId="theme-dark-label"
                  label="Тёмная"
                  value={darkTheme}
                  onChange={(e) =>
                    setDarkTheme(e.target.value as 'midnight' | 'graphite' | 'ocean' | 'forest' | 'violet' | 'espresso')
                  }
                >
                  <MenuItem value="midnight">Ночь</MenuItem>
                  <MenuItem value="graphite">Графит</MenuItem>
                  <MenuItem value="ocean">Океан</MenuItem>
                  <MenuItem value="forest">Лес</MenuItem>
                  <MenuItem value="violet">Фиолет</MenuItem>
                  <MenuItem value="espresso">Эспрессо</MenuItem>
                </Select>
              </FormControl>
              <IconButton aria-label="Выйти" onClick={logout}>
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Menu anchorEl={pagesAnchor} open={Boolean(pagesAnchor)} onClose={closePagesMenu}>
        {sidebarItems.map((item) => (
          <MenuItem key={item.path} component={Link} to={item.path} onClick={closePagesMenu} selected={isActive(item.path)}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={themeAnchor} open={Boolean(themeAnchor)} onClose={closeThemeMenu}>
        <Box sx={{ p: 1.5, width: 280, display: 'grid', gap: 1.25 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="theme-mode-mobile-label">Режим</InputLabel>
            <Select
              labelId="theme-mode-mobile-label"
              label="Режим"
              value={modeSetting}
              native
              onChange={(e) => setModeSetting(e.target.value as 'system' | 'light' | 'dark')}
            >
              <option value="system">Системный</option>
              <option value="light">Светлый</option>
              <option value="dark">Тёмный</option>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="theme-accent-mobile-label">Тема</InputLabel>
            <Select
              labelId="theme-accent-mobile-label"
              label="Тема"
              value={accent}
              native
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
              <option value="cyan">Циан</option>
              <option value="indigo">Индиго</option>
              <option value="emerald">Изумруд</option>
              <option value="amber">Янтарь</option>
              <option value="rose">Роза</option>
              <option value="slate">Сланец</option>
              <option value="violet">Фиолет</option>
              <option value="teal">Бирюза</option>
              <option value="sky">Небо</option>
              <option value="lime">Лайм</option>
              <option value="orange">Оранжевый</option>
              <option value="fuchsia">Фуксия</option>
              <option value="red">Красный</option>
              <option value="blue">Синий</option>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="theme-dark-mobile-label">Тёмная</InputLabel>
            <Select
              labelId="theme-dark-mobile-label"
              label="Тёмная"
              value={darkTheme}
              native
              onChange={(e) =>
                setDarkTheme(e.target.value as 'midnight' | 'graphite' | 'ocean' | 'forest' | 'violet' | 'espresso')
              }
            >
              <option value="midnight">Ночь</option>
              <option value="graphite">Графит</option>
              <option value="ocean">Океан</option>
              <option value="forest">Лес</option>
              <option value="violet">Фиолет</option>
              <option value="espresso">Эспрессо</option>
            </Select>
          </FormControl>
        </Box>
      </Menu>

      <Toolbar sx={{ minHeight: { xs: 52, sm: 64 } }} />

      <Box
        component="div"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '260px 1fr' },
          minHeight: { xs: 'calc(100vh - 52px)', sm: 'calc(100vh - 64px)' },
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        {!isMobile ? (
          <Paper
          component="nav"
          aria-label="Основная навигация"
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
              display: 'block',
              overflowX: 'visible',
              whiteSpace: 'normal',
            }}
          >
            {sidebarItems.map((item, index) => (
              <Box key={item.label}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive(item.path)}
                  aria-label={`Перейти: ${item.label}`}
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
        ) : null}

        <Box component="main" sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.default', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

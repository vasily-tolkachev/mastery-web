import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_CLIENT_ID } from '../config/env';
import { useAuth } from '../auth/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = 'google-gsi-client';
let googleInitialized = false;
let googleCredentialHandler: ((credential: string) => void) | null = null;

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity script'));
    document.head.appendChild(script);
  });
}

async function waitForGoogleIdentitySdk(timeoutMs = 5000): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (window.google?.accounts?.id) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Google Identity SDK is not available.');
}

export function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    googleCredentialHandler = async (credential: string) => {
      try {
        await loginWithGoogle(credential);
        navigate('/quests', { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Login failed');
      }
    };

    const mount = async () => {
      setError(null);
      if (!GOOGLE_CLIENT_ID) {
        setError('Missing GOOGLE_CLIENT_ID in frontend env.');
        return;
      }
      try {
        await loadGoogleScript();
        await waitForGoogleIdentitySdk();
        const target = document.getElementById('google-signin-button');
        if (!target || !window.google?.accounts?.id) {
          setError('Google Identity SDK is not available.');
          return;
        }
        if (!googleInitialized) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (!response.credential) {
                return;
              }
              void googleCredentialHandler?.(response.credential);
            },
          });
          googleInitialized = true;
        }
        target.innerHTML = '';
        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to initialize Google login');
      }
    };
    void mount();
    return () => {
      googleCredentialHandler = null;
    };
  }, [loginWithGoogle, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, backgroundColor: '#f3f4f6' }}>
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 420, p: 3, border: 1, borderColor: 'divider', backgroundColor: '#fff' }}>
        <Typography variant="h5">Sign In</Typography>
        <Typography variant="body2" color="text.secondary">
          Continue with Google to access Mastery.
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Box id="google-signin-button" sx={{ minHeight: 42 }} />
        <Button variant="text" onClick={() => navigate('/quests', { replace: true })}>
          Continue without login
        </Button>
      </Stack>
    </Box>
  );
}

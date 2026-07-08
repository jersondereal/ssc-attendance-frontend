interface Config {
  API_BASE_URL: string;
  ENV: 'development' | 'production';
  ENABLE_EASTER_EGG: boolean;
  ENABLE_IMAGE_UPLOAD: boolean;
}

const frontendURL = 'essu-ssc.vercel.app';

// Get the current hostname and protocol
const getBaseUrl = () => {
  // Env override — set VITE_API_BASE_URL in frontend/.env.local to use local backend via tunnel
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL as string;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Production
  if (hostname === frontendURL) {
    return 'https://ssc-attendance-backend.onrender.com/api';
  }

  // Local dev (localhost or LAN IP)
  if (hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return `${protocol}//${hostname}:5000/api`;
  }

  // Tunnel or any other external host — use production backend
  return 'https://ssc-attendance-backend.onrender.com/api';
};

const config: Config = {
  API_BASE_URL: getBaseUrl(),
  ENV: window.location.hostname === frontendURL ? 'production' : 'development',
  // Set VITE_ENABLE_EASTER_EGG=false in frontend/.env.local to hide the Students table easter egg row.
  ENABLE_EASTER_EGG: import.meta.env.VITE_ENABLE_EASTER_EGG !== 'false',
  // Disabled by default (ImgBB rate limits). Set VITE_ENABLE_IMAGE_UPLOAD=true in frontend/.env.local to re-enable.
  ENABLE_IMAGE_UPLOAD: import.meta.env.VITE_ENABLE_IMAGE_UPLOAD === 'true',
};

export default config; 
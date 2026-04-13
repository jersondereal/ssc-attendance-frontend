interface Config {
  API_BASE_URL: string;
  ENV: 'development' | 'production';
}

const frontendURL = 'essu-ssc.vercel.app';

// Get the current hostname and protocol
const getBaseUrl = () => {
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
};

export default config; 
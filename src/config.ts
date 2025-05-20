interface Config {
  API_BASE_URL: string;
  ENV: 'development' | 'production';
}

// Get the current hostname and protocol
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Production
  if (hostname === 'ssc-attendance-sigma.vercel.app') {
    return 'https://ssc-attendance-backend.onrender.com/api';
  }

  // Development environment
  return `${protocol}//${hostname}:5000/api`;
};

const config: Config = {
  API_BASE_URL: getBaseUrl(),
  ENV: window.location.hostname === 'ssc-attendance-sigma.vercel.app' ? 'production' : 'development',
};

export default config; 
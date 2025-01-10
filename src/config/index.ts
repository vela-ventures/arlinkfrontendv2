const isTestEnv = import.meta.env.VITE_ENV === 'test';

export const GITHUB_CLIENT_ID = isTestEnv 
  ? import.meta.env.VITE_GITHUB_CLIENT_ID 
  : "Iv23linjZLxHZeHfSgqB";
  
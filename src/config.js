// 检查是否设置了必要的环境变量
const requiredEnvVars = [
  'VITE_DEEPSEEK_API_KEY',
  'VITE_API_BASE_URL',
  'VITE_MODEL_NAME',
  'VITE_API_HOST'
];

const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export const API_CONFIG = {
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  baseURL: import.meta.env.VITE_API_BASE_URL,
  modelName: import.meta.env.VITE_MODEL_NAME,
  apiHost: import.meta.env.VITE_API_HOST
};

export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any).__LIFEOS_API_URL__) || 'https://lifeos-api-yzb6.onrender.com/api/v1',
  hubUrl: (typeof window !== 'undefined' && (window as any).__LIFEOS_HUB_URL__) || 'https://lifeos-api-yzb6.onrender.com/hubs/lifeos'
};

export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any).__LIFEOS_API_URL__) || 'http://localhost:5080/api/v1',
  hubUrl: (typeof window !== 'undefined' && (window as any).__LIFEOS_HUB_URL__) || 'http://localhost:5080/hubs/lifeos'
};

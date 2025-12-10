// Utilidad para verificar si estamos en modo mock
export function isMockMode(): boolean {
  return process.env.USE_MOCK === 'true';
}








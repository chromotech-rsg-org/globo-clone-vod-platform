// Configuration for authentication redirects
export const getAuthRedirectUrl = (path: string = '/') => {
  // Always use production domain for auth redirects
  const baseUrl = 'https://minhaconta.agromercado.tv.br';
  return `${baseUrl}${path}`;
};
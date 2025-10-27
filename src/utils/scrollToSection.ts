/**
 * Scroll suave para uma seção específica da página
 * @param sectionId - ID da seção (sem o #)
 */
export const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
};

/**
 * Navega para uma seção com hash, garantindo scroll mesmo na mesma página
 * @param navigate - Função de navegação do react-router-dom
 * @param path - Caminho com hash (ex: "/#plans")
 * @param currentPath - Caminho atual da página
 */
export const navigateToSection = (
  navigate: (path: string) => void,
  path: string,
  currentPath: string
) => {
  const [pathname, hash] = path.split('#');
  const sectionId = hash || '';
  
  // Se já está na mesma página, apenas rola para a seção
  if (currentPath === pathname || currentPath === '/') {
    setTimeout(() => scrollToSection(sectionId), 100);
  } else {
    // Se está em outra página, navega e aguarda o carregamento
    navigate(path);
    setTimeout(() => scrollToSection(sectionId), 300);
  }
};

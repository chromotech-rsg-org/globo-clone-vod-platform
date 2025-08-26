
import { useEffect } from 'react';
import { useCustomizations } from '@/hooks/useCustomizations';

export const useCustomizationTheme = () => {
  const { customizations } = useCustomizations();

  useEffect(() => {
    if (!customizations) return;

    const root = document.documentElement;

    // Apply background colors
    customizations.forEach(custom => {
      if (custom.element_type === 'color' && custom.element_value) {
        switch (custom.element_key) {
          case 'page_background':
            root.style.setProperty('--page-bg', custom.element_value);
            document.body.style.backgroundColor = custom.element_value;
            break;
          case 'card_background':
            root.style.setProperty('--card-bg', custom.element_value);
            break;
          case 'table_background':
            root.style.setProperty('--table-bg', custom.element_value);
            break;
          case 'menu_background':
            root.style.setProperty('--menu-bg', custom.element_value);
            break;
          case 'primary_color':
            root.style.setProperty('--primary', custom.element_value);
            break;
          case 'secondary_color':
            root.style.setProperty('--secondary', custom.element_value);
            break;
        }
      }
    });

    // Apply custom CSS if any
    const customCss = customizations
      .filter(c => c.element_type === 'css')
      .map(c => c.element_value)
      .join('\n');

    if (customCss) {
      let styleElement = document.getElementById('custom-theme-styles');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-theme-styles';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = customCss;
    }
  }, [customizations]);
};

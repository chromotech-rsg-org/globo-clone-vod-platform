
import { useEffect } from 'react';
import { useCustomizations } from '@/hooks/useCustomizations';

export const useCustomizationTheme = () => {
  const { customizations } = useCustomizations('global');

  useEffect(() => {
    if (!customizations || Object.keys(customizations).length === 0) return;

    const root = document.documentElement;

    // Apply background colors by checking the customizations object
    Object.entries(customizations).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        // Parse the key to determine the element type
        if (key.includes('page_background')) {
          root.style.setProperty('--page-bg', value);
          document.body.style.backgroundColor = value;
        } else if (key.includes('card_background')) {
          root.style.setProperty('--card-bg', value);
        } else if (key.includes('table_background')) {
          root.style.setProperty('--table-bg', value);
        } else if (key.includes('menu_background')) {
          root.style.setProperty('--menu-bg', value);
        } else if (key.includes('primary_color')) {
          root.style.setProperty('--primary', value);
        } else if (key.includes('secondary_color')) {
          root.style.setProperty('--secondary', value);
        }
      }
    });

    // Apply custom CSS if any
    const customCssKeys = Object.keys(customizations).filter(key => key.includes('css'));
    const customCss = customCssKeys
      .map(key => customizations[key])
      .filter(value => value && typeof value === 'string')
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

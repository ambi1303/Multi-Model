import { useEffect } from 'react';
import { useTheme } from './ThemeContext';

const ThemeHandler = () => {
  const { mode } = useTheme();

  useEffect(() => {
    const body = document.body;
    if (mode === 'light') {
      body.classList.add('light');
    } else {
      body.classList.remove('light');
    }
  }, [mode]);

  return null;
};

export default ThemeHandler; 
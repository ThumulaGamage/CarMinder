import { useColorScheme } from 'react-native';

const common = {
  borderRadius: 12,
  spacing: 16,
  font: {
    size: 16,
    weight: '600',
  },
};

const light = {
  mode: 'light',
  background: '#FFFFFF',
  card: '#F5F5F5',
  primary: '#2196F3',
  secondary: '#E3F2FD',
  text: '#000000',
  buttonText: '#FFFFFF',
  primaryDark: 'rgb(2, 24, 191)',
  inputBackground: '#E3F2FD',
  ...common,
};

const dark = {
  mode: 'dark',
  background: '#000000',
  card: '#1E1E1E',
  primary: '#2196F3',
  secondary: '#1565C0',
  text: '#FFFFFF',
  buttonText: '#FFFFFF',
   primaryDark: 'rgb(46, 87, 250)',
  inputBackground: 'rgb(0, 0, 0)',
  ...common,
};

const Themes = { light, dark };

export default function useTheme() {
  const scheme = useColorScheme();
  return Themes[scheme] || Themes.light;
}


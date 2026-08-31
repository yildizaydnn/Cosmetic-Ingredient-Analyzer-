import { Platform } from 'react-native';

const fontFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const Typography = {
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  h2: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  h3: {
    fontFamily,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  subtitle: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
};

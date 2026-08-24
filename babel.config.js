module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
      },
    ],
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
          '@atoms': './src/atoms',
          '@molecules': './src/molecules',
          '@organisms': './src/organisms',
          '@features': './src/features',
          '@services': './src/services',
          '@config': './src/config',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@design': './src/design-system',
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    ],
    'react-native-reanimated/plugin', // Must be last plugin
  ],
};

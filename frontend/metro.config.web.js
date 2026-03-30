// Metro config for web compatibility with react-native-maps
module.exports = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      // Disable react-native-maps on web
      if (platform === 'web' && moduleName === 'react-native-maps') {
        return {
          type: 'empty',
        };
      }
      // Default behavior for other modules
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

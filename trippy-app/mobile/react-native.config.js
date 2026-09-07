const path = require('path');

// Resolve via require.resolve rather than a hardcoded relative path because
// npm workspace hoisting can place this package in either mobile/node_modules
// or the workspace root's node_modules depending on what else depends on it.
const vectorIconsFontsPath = path.join(
  path.dirname(require.resolve('react-native-vector-icons/package.json')),
  'Fonts'
);

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true
    }
  },
  assets: [vectorIconsFontsPath]
}

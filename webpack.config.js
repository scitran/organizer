var webpack = require('webpack');

module.exports = {
    entry: './app/renderer.js',
    output: {
      path: __dirname + '/build',
      filename: 'app.bundle.js',
      publicPath: 'http://localhost:8080/build'
    },
    // resolve: {
    //   modulesDirectories: ["web_modules", "node_modules"]
    // },
    module: {
    },
    target: 'electron-renderer'
};

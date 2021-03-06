/* global __dirname */
'use strict';

module.exports = {
  entry: './app/renderer.js',
  output: {
    path: __dirname + '/build',
    filename: 'app.bundle.js',
    publicPath: 'http://localhost:8181/build'
  },
  devtool: '#cheap-source-map',
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loaders: ['eslint'],
        // define an include so we check just the files we need
        exclude: /node_modules/
      }
    ],
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.scss$/, loaders: ['style', 'css', 'sass'] },
      { test: /\.html$/, loader: 'raw-loader'}
    ],
    // workaround to solve https://github.com/webpack/webpack/issues/138
    noParse: /node_modules\/json-schema\/lib\/validate\.js/
  },
  eslint: {
    failOnWarning: false,
    failOnError: true
  },
  resolve: {
    extensions: ['', '.js']
  },
  target: 'electron-renderer'
};

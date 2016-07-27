/* global __dirname */
'use strict';

module.exports = {
  entry: './app/renderer.js',
  output: {
    path: __dirname + '/build',
    filename: 'app.bundle.js',
    publicPath: 'http://localhost:8080/build'
  },
  devtool: '#cheap-source-map',
  module: {
    preLoaders: [
      {
        test: /\.jsx?$/,
        loaders: ['eslint'],
        // define an include so we check just the files we need
        exclude: /node_modules/
      }
    ],
    loaders: [
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  eslint: {
    failOnWarning: false,
    failOnError: true
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  target: 'electron-renderer'
};

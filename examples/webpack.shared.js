const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

const NODE_MODULES = '../node_modules';
const MY_LIB_DIR = '../lib';

module.exports = (dir,whitelist=[],allNE=false) => ({
  entry: slsw.lib.entries,
  target: 'node',
  externals: allNE ? [] : [nodeExternals({modulesDir: path.join(dir, NODE_MODULES), whitelist })],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: [dir, path.join(dir, MY_LIB_DIR)],
      exclude: /node_modules/,
    }]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(dir, '.webpack'),
    filename: '[name].js'
  }
});
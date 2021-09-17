const path = require('path');

module.exports = {
  entry: './test/dev.ts',
  devtool: 'inline-source-map',
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'dev.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

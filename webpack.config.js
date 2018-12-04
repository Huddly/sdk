const path = require('path');

module.exports = {
  entry: './src/index.ts',
  externals: ['adm-zip', 'readline'],
  output: {
    path: path.resolve(__dirname, 'bundle'),
    filename: 'bundle.js',
    libraryTarget: 'var',
    library: 'SDK',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    taskpane: './src/taskpane/index.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'taskpane/index.html',
      template: './src/taskpane/index.html',
      chunks: ['taskpane']
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 34567,
    https: true,
    devMiddleware: {
      publicPath: '/'
    }
  }
};

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './widget/src/index.tsx',
  output: {
    path: path.resolve(__dirname, '../public/widget'),
    filename: 'live-chat-widget.js',
    library: 'LiveChatWidget',
    libraryTarget: 'umd',
    publicPath: '/widget/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './widget/src/index.html',
      filename: 'demo.html',
    }),
  ],
  optimization: {
    minimize: true,
  },
  externals: {
    // Don't bundle these dependencies - load from CDN or host page
  },
}
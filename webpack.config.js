const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/google-autocomplete.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'google-autocomplete.min.js',
    library: {
      name: 'GoogleAutoComplete',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ],
  },
  // externals: {
  //   '@googlemaps/js-api-loader': {
  //     commonjs: '@googlemaps/js-api-loader',
  //     commonjs2: '@googlemaps/js-api-loader',
  //     amd: '@googlemaps/js-api-loader',
  //     root: ['google', 'maps', 'plugins']
  //   }
  // },
  resolve: {
    extensions: ['.js', '.css']
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'demo'),
    },
    compress: true,
    port: 3000,
    open: true
  }
}; 
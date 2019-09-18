module.exports = {
  mode: 'production',
  entry: './vue-module-info.json',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\/vue-module-info\.json$/,
        loader: '@codeciting/vue-module-webpack-loader',
        type: 'javascript/auto',
        options: {
          export: 'web'
        }
      }
    ]
  }
}

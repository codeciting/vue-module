'use strict';

const webpack = require('webpack')

webpack(require('./webpack.config'), (err, stats) => {
  console.log(stats.toString({
    colors: true
  }))
})

// describe('vue-module-webpack-loader', () => {
//     it('needs tests');
// });

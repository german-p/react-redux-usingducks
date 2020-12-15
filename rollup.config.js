import babel from 'rollup-plugin-babel';

module.exports = {
  input: 'src/usingDucks.js',
  output: [{
    file: 'dist/index.js',
    format: 'cjs',
  }, {
    file: 'dist/index.es.js',
    format: 'esm',
  }],
  external: ['react-redux-async-action'],
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};

const StyleDictionary = require('style-dictionary');

module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'styles/',
      files: [
        {
          destination: 'design-tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'lib/',
      files: [
        {
          destination: 'design-tokens.ts',
          format: 'javascript/es6',
        },
      ],
    },
  },
};
// Bridge to eslint.config.mjs for tooling expecting eslint.config.js
module.exports = import('./eslint.config.mjs').then(m => m.default);

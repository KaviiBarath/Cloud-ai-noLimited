import path from 'node:path';
import { fileURLToPath } from 'node:url';
import serverConfig from './server/eslint.config.js';
import clientConfig from './client/eslint.config.js';
import cliConfig from './cli/eslint.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function prefixFiles(prefix, files) {
  if (!files) return undefined;
  const flat = Array.isArray(files) ? files.flat(Infinity) : [files];
  return flat.map(f => `${prefix}/${f}`);
}

function scopeConfig(prefix, configs) {
  const dir = path.resolve(__dirname, prefix);
  return configs.map(cfg => {
    if (cfg.ignores && !cfg.files && !cfg.rules && !cfg.languageOptions) {
      return {
        ...cfg,
        ignores: cfg.ignores.map(ign => `${prefix}/${ign}`),
      };
    }
    const files = prefixFiles(prefix, cfg.files) || [`${prefix}/**/*.{ts,tsx}`];
    return {
      ...cfg,
      files,
      languageOptions: {
        ...cfg.languageOptions,
        parserOptions: {
          ...cfg.languageOptions?.parserOptions,
          tsconfigRootDir: dir,
        },
      },
    };
  });
}

export default [
  ...scopeConfig('server', serverConfig),
  ...scopeConfig('client', clientConfig),
  ...scopeConfig('cli', cliConfig),
];

import type { Options } from 'tsup';

// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'tsup';

export default defineConfig((options: Options) => ({
  ...options,
  entry: ['src/index.ts'],
  treeshake: true,
  format: ['esm', 'cjs'],
  silent: !options.watch,
  minify: false,
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  shims: true,
  cjsInterop: true,
}));

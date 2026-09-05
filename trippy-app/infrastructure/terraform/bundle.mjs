// Bundles the backend Lambda handlers into deployable artifacts for Terraform.
//
// Each source file is bundled once into build/dist/<source>/index.js (CommonJS,
// minified, arm64-friendly). The AWS SDK v3 is provided by the Lambda runtime
// so it is marked external; axios and uuid are bundled in. Terraform's
// archive_file data source zips each build/dist/<source> directory.
//
// Run from the infrastructure/ directory (so esbuild resolves from its
// node_modules):  node terraform/bundle.mjs   (or: npm run tf:build)
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const lambdasDir = path.resolve(here, '../../backend/src/lambdas');
const distRoot = path.join(here, 'build', 'dist');

// Distinct source files. Multiple Lambda functions reuse these bundles by
// pointing at different named exports (see functions map in main.tf).
const sources = [
  'chatHandler',
  'tripPlanner',
  'tripManagement',
  'connectionHandler',
];

fs.rmSync(distRoot, { recursive: true, force: true });

for (const name of sources) {
  const outfile = path.join(distRoot, name, 'index.js');
  await build({
    entryPoints: [path.join(lambdasDir, `${name}.ts`)],
    outfile,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    minify: true,
    legalComments: 'none',
    external: ['@aws-sdk/*'],
  });
  console.log(`bundled ${name} -> ${path.relative(process.cwd(), outfile)}`);
}

console.log('Lambda bundles ready in', path.relative(process.cwd(), distRoot));

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { globSync } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const outDir = path.join(repoRoot, 'release');
  ensureDir(outDir);

  // 1) Build JS bundle and copy assets to bundle/
  run('node', ['esbuild.config.js'], { cwd: repoRoot });
  run('node', ['scripts/copy_bundle_assets.js'], { cwd: repoRoot });

  // 2) Compile to self-contained executables using Bun
  const targets = [
    { target: 'bun-linux-x64', outfile: 'qwen-linux-x64' },
    { target: 'bun-linux-arm64', outfile: 'qwen-linux-arm64' },
    { target: 'bun-darwin-x64', outfile: 'qwen-macos-x64' },
    { target: 'bun-darwin-arm64', outfile: 'qwen-macos-arm64' },
    { target: 'bun-windows-x64', outfile: 'qwen-windows-x64.exe' },
  ];

  const entry = path.join(repoRoot, 'bundle', 'gemini.js');

  for (const { target, outfile } of targets) {
    console.log(`\n==> Building ${target}`);
    run('bun', [
      'build',
      entry,
      '--compile',
      `--target=${target}`,
      '--outfile',
      path.join(outDir, outfile),
    ]);
  }

  // Copy runtime assets alongside binaries for runtime discovery
  const bundleDir = path.join(repoRoot, 'bundle');
  if (existsSync(bundleDir)) {
    // Copy all files in bundle (e.g., .vsix, .sb) into release dir
    for (const file of globSync('*', { cwd: bundleDir })) {
      const from = path.join(bundleDir, file);
      const to = path.join(outDir, file);
      cpSync(from, to, { recursive: true });
    }
  }

  console.log(`\nAll binaries are in: ${outDir}`);
}

main();



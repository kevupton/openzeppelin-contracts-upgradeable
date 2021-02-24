#!/usr/bin/env node

// This script removes the build artifacts of ignored contracts.

const fs = require('fs');
const path = require('path');
const match = require('micromatch');

function readJSON (path) {
  return JSON.parse(fs.readFileSync(path));
}

const pkgFiles = readJSON('package.json').files;

// Get only negated patterns.
const ignorePatterns = pkgFiles
  .filter(pat => pat.startsWith('!'))
// Remove the negation part. Makes micromatch usage more intuitive.
  .map(pat => pat.slice(1));

const ignorePatternsSubtrees = ignorePatterns
// Add **/* to ignore all files contained in the directories.
  .concat(ignorePatterns.map(pat => path.join(pat, '**/*')))
  .map(p => p.replace(/^\//, ''));

const buildinfo = 'artifacts/build-info';
const filenames = fs.readdirSync(buildinfo);
if (filenames.length !== 1) {
  throw new Error(`There should only be one file in ${buildinfo}`);
}
const solcOutput = readJSON(path.join(buildinfo, filenames[0])).output;

const artifactsDir = 'build/contracts';

let n = 0;

for (const sourcePath in solcOutput.contracts) {
  const ignore = match.any(sourcePath, ignorePatternsSubtrees);
  if (ignore) {
    for (const contract in solcOutput.contracts[sourcePath]) {
      fs.unlinkSync(path.join(artifactsDir, contract + '.json'));
      n += 1;
    }
  }
}

console.error(`Removed ${n} mock artifacts`);

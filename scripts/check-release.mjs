#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const EXPECTED_PACKAGE_NAME = 'mrx-ai';

function normalizePublishedVersions(value, source) {
  const versions = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? [value]
      : value && typeof value === 'object' && Array.isArray(value.versions)
        ? value.versions
        : null;

  if (versions === null) {
    throw new Error(`${source} must contain a JSON array of npm versions.`);
  }

  return versions.map((version) => {
    if (typeof version !== 'string' || semver.valid(version) === null) {
      throw new Error(`${source} contains an invalid semantic version: ${String(version)}`);
    }
    return version;
  });
}

/**
 * Decide whether package metadata represents a publishable npm release.
 *
 * @param {{ name?: unknown, version?: unknown }} packageJson
 * @param {string[]} publishedVersions
 * @param {{ currentGitHead?: string, publishedGitHead?: string }} options
 * @returns {{ name: string, version: string, tag: 'beta' | 'latest', shouldPublish: boolean, shouldRelease: boolean }}
 */
export function evaluateRelease(packageJson, publishedVersions = [], options = {}) {
  const { name, version } = validatePackageMetadata(packageJson);
  const registryVersions = normalizePublishedVersions(publishedVersions, 'Published versions');
  const tag = semver.prerelease(version) === null ? 'latest' : 'beta';

  if (registryVersions.includes(version)) {
    const shouldRelease =
      Boolean(options.currentGitHead) && options.currentGitHead === options.publishedGitHead;
    return { name, version, tag, shouldPublish: false, shouldRelease };
  }

  const comparisonVersions =
    tag === 'latest'
      ? registryVersions.filter((publishedVersion) => semver.prerelease(publishedVersion) === null)
      : registryVersions;
  const latestPublishedVersion = comparisonVersions.toSorted(semver.rcompare)[0];
  if (latestPublishedVersion && !semver.gt(version, latestPublishedVersion)) {
    throw new Error(
      `Version ${version} is not an increment over the latest published version ${latestPublishedVersion}.`,
    );
  }

  return { name, version, tag, shouldPublish: true, shouldRelease: true };
}

function validatePackageMetadata(packageJson) {
  const name = packageJson?.name;
  const version = packageJson?.version;

  if (name !== EXPECTED_PACKAGE_NAME) {
    throw new Error(
      `Refusing to publish package "${String(name)}"; expected "${EXPECTED_PACKAGE_NAME}".`,
    );
  }

  if (typeof version !== 'string' || semver.valid(version) === null) {
    throw new Error(`Invalid semantic version in package.json: ${String(version)}`);
  }

  return { name, version };
}

function parseJson(raw, source) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse JSON from ${source}: ${detail}`);
  }
}

function readPublishedVersions(filePath) {
  const raw = readFileSync(filePath, 'utf8').trim();
  if (raw === '') return [];
  return normalizePublishedVersions(parseJson(raw, filePath), filePath);
}

function queryPublishedVersions(packageName) {
  let stdout;
  try {
    stdout = execFileSync('npm', ['view', packageName, 'versions', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr).trim()
        : String(error);
    throw new Error(`Could not query published npm versions for ${packageName}: ${stderr}`);
  }

  const raw = stdout.trim();
  if (raw === '') return [];
  return normalizePublishedVersions(parseJson(raw, 'npm view'), 'npm view');
}

function queryPublishedGitHead(packageName, version) {
  try {
    const stdout = execFileSync('npm', ['view', `${packageName}@${version}`, 'gitHead', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (stdout === '') return undefined;
    const value = parseJson(stdout, 'npm view gitHead');
    return typeof value === 'string' ? value : undefined;
  } catch (error) {
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr).trim()
        : String(error);
    throw new Error(`Could not query npm gitHead for ${packageName}@${version}: ${stderr}`);
  }
}

function parseArguments(argv) {
  let versionsFile = process.env.MRX_RELEASE_VERSIONS_FILE;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--versions-file') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('--versions-file requires a path.');
      }
      versionsFile = value;
      index += 1;
      continue;
    }

    if (argument.startsWith('--versions-file=')) {
      versionsFile = argument.slice('--versions-file='.length);
      if (!versionsFile) throw new Error('--versions-file requires a path.');
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return { versionsFile };
}

function emitGitHubOutput(result) {
  if (!process.env.GITHUB_OUTPUT) return;

  appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `name=${result.name}`,
      `version=${result.version}`,
      `tag=${result.tag}`,
      `should_publish=${String(result.shouldPublish)}`,
      `should_release=${String(result.shouldRelease)}`,
      '',
    ].join('\n'),
  );
}

function main() {
  const { versionsFile } = parseArguments(process.argv.slice(2));
  const packagePath = path.resolve(process.cwd(), 'package.json');
  const packageJson = parseJson(readFileSync(packagePath, 'utf8'), packagePath);
  validatePackageMetadata(packageJson);
  const publishedVersions = versionsFile
    ? readPublishedVersions(path.resolve(process.cwd(), versionsFile))
    : queryPublishedVersions(EXPECTED_PACKAGE_NAME);
  const currentGitHead = process.env.RELEASE_SHA;
  const publishedGitHead =
    !versionsFile && publishedVersions.includes(packageJson.version)
      ? queryPublishedGitHead(EXPECTED_PACKAGE_NAME, packageJson.version)
      : undefined;
  const result = evaluateRelease(packageJson, publishedVersions, {
    currentGitHead,
    publishedGitHead,
  });

  emitGitHubOutput(result);
  console.log(
    result.shouldPublish
      ? `[release-check] ${result.name}@${result.version} will publish with dist-tag ${result.tag}.`
      : `[release-check] ${result.name}@${result.version} is already published; skipping.`,
  );
}

const isCli =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  try {
    main();
  } catch (error) {
    console.error(`[release-check] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

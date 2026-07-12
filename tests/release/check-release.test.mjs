import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { evaluateRelease } from '../../scripts/check-release.mjs';

const packageJson = (version, name = 'mrx-ai') => ({ name, version });

test('approves a stable version increment with the latest tag', () => {
  assert.deepEqual(evaluateRelease(packageJson('2.0.0'), ['1.9.0', '1.9.1']), {
    name: 'mrx-ai',
    version: '2.0.0',
    tag: 'latest',
    shouldPublish: true,
    shouldRelease: true,
  });
});

test('approves a prerelease increment with the beta tag', () => {
  assert.deepEqual(evaluateRelease(packageJson('2.0.0-beta.1'), ['1.9.1']), {
    name: 'mrx-ai',
    version: '2.0.0-beta.1',
    tag: 'beta',
    shouldPublish: true,
    shouldRelease: true,
  });
});

test('skips a version that already exists in the registry', () => {
  assert.deepEqual(evaluateRelease(packageJson('1.9.1'), ['1.9.0', '1.9.1']), {
    name: 'mrx-ai',
    version: '1.9.1',
    tag: 'latest',
    shouldPublish: false,
    shouldRelease: false,
  });
});

test('rejects an unexpected package name', () => {
  assert.throws(
    () => evaluateRelease(packageJson('2.0.0', 'not-mrx'), ['1.9.1']),
    /expected "mrx-ai"/,
  );
});

test('rejects an invalid package version', () => {
  assert.throws(() => evaluateRelease(packageJson('next'), ['1.9.1']), /Invalid semantic version/);
});

test('rejects a rollback from the latest published version', () => {
  assert.throws(
    () => evaluateRelease(packageJson('1.8.0'), ['1.9.0', '1.9.1']),
    /not an increment over the latest published version 1\.9\.1/,
  );
});

test('approves the first release when the registry is empty', () => {
  assert.deepEqual(evaluateRelease(packageJson('1.0.0'), []), {
    name: 'mrx-ai',
    version: '1.0.0',
    tag: 'latest',
    shouldPublish: true,
    shouldRelease: true,
  });
});

test('allows a stable hotfix below a higher prerelease line', () => {
  assert.deepEqual(evaluateRelease(packageJson('1.9.2'), ['1.9.1', '2.0.0-beta.1']), {
    name: 'mrx-ai',
    version: '1.9.2',
    tag: 'latest',
    shouldPublish: true,
    shouldRelease: true,
  });
});

test('repairs a missing GitHub release when npm gitHead matches the verified commit', () => {
  assert.deepEqual(
    evaluateRelease(packageJson('1.9.1'), ['1.9.1'], {
      currentGitHead: 'abc123',
      publishedGitHead: 'abc123',
    }),
    {
      name: 'mrx-ai',
      version: '1.9.1',
      tag: 'latest',
      shouldPublish: false,
      shouldRelease: true,
    },
  );
});

test('CLI accepts a versions file and writes GitHub Actions outputs', () => {
  const fixtureDirectory = mkdtempSync(path.join(tmpdir(), 'mrx-release-check-'));
  const scriptPath = fileURLToPath(new URL('../../scripts/check-release.mjs', import.meta.url));
  const versionsPath = path.join(fixtureDirectory, 'versions.json');
  const outputPath = path.join(fixtureDirectory, 'github-output.txt');

  try {
    writeFileSync(
      path.join(fixtureDirectory, 'package.json'),
      JSON.stringify(packageJson('2.0.0')),
    );
    writeFileSync(versionsPath, JSON.stringify(['1.9.1']));

    const result = spawnSync(process.execPath, [scriptPath, '--versions-file', versionsPath], {
      cwd: fixtureDirectory,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: outputPath },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      readFileSync(outputPath, 'utf8'),
      'name=mrx-ai\nversion=2.0.0\ntag=latest\nshould_publish=true\nshould_release=true\n',
    );
  } finally {
    rmSync(fixtureDirectory, { recursive: true, force: true });
  }
});

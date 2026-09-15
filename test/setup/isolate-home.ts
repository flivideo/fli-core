// Tests never touch the live estate, the real ~/.config/appydave or the real ~/.fli.
//
// Two mechanisms, both per test file:
// 1. HOME points at an empty temp directory, so every *default* path resolves to a fixture.
// 2. The fs functions src/ and the tests use are wrapped (test/helpers/guard.ts): a call whose path is inside the real
//    ~/dev/video-projects, ~/.config/appydave or ~/.fli throws before it reaches the disk (F11).
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll } from 'vitest';

const realHome = process.env.FLI_CORE_REAL_HOME ?? os.homedir();
process.env.FLI_CORE_REAL_HOME = realHome;

const { installLiveEstateGuard } = await import('../helpers/guard.js');
installLiveEstateGuard();

const fakeHome = mkdtempSync(path.join(os.tmpdir(), 'fli-core-home-'));
process.env.HOME = fakeHome;

if (os.homedir() === realHome) {
  throw new Error(
    'isolate-home: os.homedir() still points at the real home; refusing to run tests.',
  );
}

afterAll(() => {
  rmSync(fakeHome, { recursive: true, force: true });
});

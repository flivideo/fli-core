// Tests never touch the live estate, the real ~/.config/appydave or the real ~/.fli.
// Every test file runs with HOME pointed at an empty temp directory, so even a default path resolves to a fixture.
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll } from 'vitest';

const realHome = process.env.FLI_CORE_REAL_HOME ?? os.homedir();
process.env.FLI_CORE_REAL_HOME = realHome;

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

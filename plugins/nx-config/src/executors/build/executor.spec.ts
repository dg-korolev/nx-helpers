import { workspaceRoot } from '@nx/devkit';
// import { RestoreFn } from 'mocked-env';

jest.setTimeout(60 * 1000);

describe('Build Executor', () => {
  // let restore: RestoreFn;

  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(() => true);
    jest.spyOn(console, 'log').mockImplementation(() => true);
    jest.spyOn(console, 'warn').mockImplementation(() => true);
  });

  beforeEach(() => {
    // workaround for https://github.com/nrwl/nx/issues/20330
    if (process.cwd() !== workspaceRoot) {
      process.chdir(workspaceRoot);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // restore();
  });

  it('should pass', () => {
    expect(true).toBeTruthy();
  });

  // it('can run', async () => {
  //   // const output = await run(options);
  //   // expect(output.success).toBe(true);
  // });
});

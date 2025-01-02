import { workspaceRoot } from '@nx/devkit';
import { ConfigBuilder } from '../executor';
import { configTree, testContext } from './constext.spec';
import { BuildExecutorSchema } from '../schema';
import { unlinkSync } from 'node:fs';
import { IFsWrapper } from '../fsWrapper';

jest.setTimeout(60 * 1000);

const makeBaseFsWrapperMock = (overrideMock: (IFsWrapper) => Partial<IFsWrapper>): IFsWrapper => {
  const baseMock = {
    getFilesByPathPattern(pattern: string[], _: { ignore: string | string[] }): string[] {
      if (pattern[0].includes('wallet-api')) {
        return ['apps/wallet-api/config1.ts'];
      }

      if (pattern[0].includes('libs/shared/config')) {
        return [];
      }

      if (pattern[0].includes('libs/wallet/database')) {
        return ['libs/wallet/database/config1.ts'];
      }

      if (pattern[0].includes('libs/wallet/kafka')) {
        return ['libs/wallet/kafka/config1.ts', 'libs/wallet/kafka/config2.ts'];
      }

      expect(pattern).toBe('empty');
    },
    existsFile(_: string): boolean {
      return false;
    },
    readFile(filePath: string): Buffer {
      if (filePath === 'apps/wallet-api/config1.ts') {
        return Buffer.from(configTree.apps.walletApi.config1, 'utf-8');
      }
      if (filePath === 'libs/wallet/database/config1.ts') {
        return Buffer.from(configTree.libs.wallet.database.config1, 'utf-8');
      }
      if (filePath === 'libs/wallet/kafka/config1.ts') {
        return Buffer.from(configTree.libs.wallet.kafka.config1, 'utf-8');
      }
      if (filePath === 'libs/wallet/kafka/config2.ts') {
        return Buffer.from(configTree.libs.wallet.kafka.config2, 'utf-8');
      }
      expect(filePath).toBe('empty');
    },
    writeFile(_: string, __: string): void {
      throw new Error('not implemented');
    },
    deleteFile(path: string): void {
      return unlinkSync(path);
    },
  };

  const overidedBaseMock = overrideMock(baseMock);

  return {
    ...baseMock,
    ...overidedBaseMock,
  };
};

describe('Build Executor', () => {
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

  it('correct for snapshots', async () => {
    const tcOptions = {
      envFileSnapshot: 'env/snapshot.env',
      buildDependenciesSnapshot: true,
    } as BuildExecutorSchema;
    testContext.target.options = tcOptions;

    const fsWrapperMock: IFsWrapper = makeBaseFsWrapperMock(() => ({
      writeFile(filePath: string, text: string): void {
        if (filePath.includes('wallet/database')) {
          expect(filePath).toEqual('libs/wallet/database/' + tcOptions.envFileSnapshot);
          expect(text).toEqual('DB_HOST=\nDB_PORT=\nDB_USER=\nDB_PASS=\n');
          return;
        }
        if (filePath.includes('wallet/kafka')) {
          expect(filePath).toEqual('libs/wallet/kafka/' + tcOptions.envFileSnapshot);
          expect(text).toEqual('APP_NAME=\nKAFKA_BROKERS=\nKAFKA_CONSUMER_BATCH_SIZE=\n');
          return;
        }
        if (filePath.includes('wallet-api')) {
          expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileSnapshot);
          expect(text).toEqual(
            "# Project: 'wallet-api'\n" +
              'APP_NAME=\n' +
              'APP_PORT=\n' +
              '\n' +
              "# Project: 'wallet-database'\n" +
              'DB_HOST=\n' +
              'DB_PORT=\n' +
              'DB_USER=\n' +
              'DB_PASS=\n' +
              '\n' +
              "# Project: 'wallet-kafka'\n" +
              'APP_NAME=\n' +
              'KAFKA_BROKERS=\n' +
              'KAFKA_CONSUMER_BATCH_SIZE=\n' +
              '\n'
          );
          return;
        }

        expect(true).toBeFalsy();
      },
    }));

    const configBuilder = new ConfigBuilder(fsWrapperMock);

    configBuilder.build(tcOptions, testContext);
  });

  it('correct for snapshots with buildDependenciesSnapshot=false', async () => {
    const tcOptions = {
      envFileSnapshot: 'env/snapshot.env',
    } as BuildExecutorSchema;
    testContext.target.options = tcOptions;

    const fsWrapperMock: IFsWrapper = makeBaseFsWrapperMock(() => ({
      writeFile(filePath: string, text: string): void {
        if (filePath.includes('wallet-api')) {
          expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileSnapshot);
          expect(text).toEqual(
            "# Project: 'wallet-api'\n" +
              'APP_NAME=\n' +
              'APP_PORT=\n' +
              '\n' +
              "# Project: 'wallet-database'\n" +
              'DB_HOST=\n' +
              'DB_PORT=\n' +
              'DB_USER=\n' +
              'DB_PASS=\n' +
              '\n' +
              "# Project: 'wallet-kafka'\n" +
              'APP_NAME=\n' +
              'KAFKA_BROKERS=\n' +
              'KAFKA_CONSUMER_BATCH_SIZE=\n' +
              '\n'
          );
          return;
        }

        expect(true).toBeFalsy();
      },
    }));

    const configBuilder = new ConfigBuilder(fsWrapperMock);

    configBuilder.build(tcOptions, testContext);
  });

  it('correct for sync file', async () => {
    const tcOptions = {
      envFileToSync: 'local.env',
    } as BuildExecutorSchema;
    testContext.target.options = tcOptions;

    const fsWrapperMock: IFsWrapper = makeBaseFsWrapperMock(() => ({
      writeFile(filePath: string, text: string): void {
        if (filePath.includes('wallet-api')) {
          if (filePath.includes(tcOptions.envFileSnapshot)) {
            expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileSnapshot);
            expect(text).toEqual(
              "# Project: 'wallet-api'\n" +
                'APP_NAME=\n' +
                'APP_PORT=\n' +
                '\n' +
                "# Project: 'wallet-database'\n" +
                'DB_HOST=\n' +
                'DB_PORT=\n' +
                'DB_USER=\n' +
                'DB_PASS=\n' +
                '\n' +
                "# Project: 'wallet-kafka'\n" +
                'APP_NAME=\n' +
                'KAFKA_BROKERS=\n' +
                'KAFKA_CONSUMER_BATCH_SIZE=\n' +
                '\n'
            );
            return;
          }
          if (filePath.includes(tcOptions.envFileToSync)) {
            expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileToSync);
            expect(text).toEqual(
              "# Project: 'wallet-api'\n" +
                'APP_NAME=\n' +
                'APP_PORT=\n' +
                '\n' +
                "# Project: 'wallet-database'\n" +
                'DB_HOST=\n' +
                'DB_PORT=\n' +
                'DB_USER=\n' +
                'DB_PASS=\n' +
                '\n' +
                "# Project: 'wallet-kafka'\n" +
                'KAFKA_BROKERS=\n' +
                'KAFKA_CONSUMER_BATCH_SIZE=\n' +
                '\n'
            );
            return;
          }
        }

        expect(filePath).toBeFalsy();
      },
      deleteFile(path: string): void {
        return unlinkSync(path);
      },
    }));

    const configBuilder = new ConfigBuilder(fsWrapperMock);

    configBuilder.build(tcOptions, testContext);
  });

  it('correct for sync file with overwrite', async () => {
    const tcOptions = {
      syncEnv: true,
      envFileToSync: 'local.env',
    } as BuildExecutorSchema;
    testContext.target.options = tcOptions;

    const fsWrapperMock: IFsWrapper = makeBaseFsWrapperMock((baseMock) => ({
      existsFile(filePath: string): boolean {
        if (filePath.includes(tcOptions.envFileToSync)) {
          expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileToSync);
          return true;
        }
        return baseMock.existsFile(filePath);
      },
      readFile(filePath: string): Buffer {
        if (filePath.includes(tcOptions.envFileToSync)) {
          expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileToSync);
          return Buffer.from(
            "# Project: 'wallet-api'\n" +
              'APP_NAME=\n' +
              'APP_PORT=\n' +
              '\n' +
              "# Project: 'wallet-database'\n" +
              'DB_HOST=\n' +
              'DB_PORT=\n' +
              'DB_USER=\n' +
              'DB_PASS=\n' +
              '\n' +
              "# Project: 'wallet-kafka'\n" +
              'APP_NAME=\n' +
              'KAFKA_BROKERS=\n' +
              'KAFKA_CONSUMER_BATCH_SIZE=\n' +
              '\n',
            'utf-8'
          );
        }
        return baseMock.readFile(filePath);
      },
      writeFile(filePath: string, text: string): void {
        if (filePath.includes('wallet-api')) {
          if (filePath.includes(tcOptions.envFileSnapshot)) {
            expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileSnapshot);
            expect(text).toEqual(
              "# Project: 'wallet-api'\n" +
                'APP_NAME=\n' +
                'APP_PORT=\n' +
                '\n' +
                "# Project: 'wallet-database'\n" +
                'DB_HOST=\n' +
                'DB_PORT=\n' +
                'DB_USER=\n' +
                'DB_PASS=\n' +
                '\n' +
                "# Project: 'wallet-kafka'\n" +
                'APP_NAME=\n' +
                'KAFKA_BROKERS=\n' +
                'KAFKA_CONSUMER_BATCH_SIZE=\n' +
                '\n'
            );
            return;
          }
          if (filePath.includes(tcOptions.envFileToSync)) {
            expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileToSync);
            expect(text).toEqual(
              "# Project: 'wallet-api'\n" +
                'APP_NAME=\n' +
                'APP_PORT=\n' +
                '\n' +
                "# Project: 'wallet-database'\n" +
                'DB_HOST=\n' +
                'DB_PORT=\n' +
                'DB_USER=\n' +
                'DB_PASS=\n' +
                '\n' +
                "# Project: 'wallet-kafka'\n" +
                'KAFKA_BROKERS=\n' +
                'KAFKA_CONSUMER_BATCH_SIZE=\n' +
                '\n'
            );
            return;
          }
        }

        expect(filePath).toBeFalsy();
      },
      deleteFile(filePath: string): void {
        expect(filePath).toBe('apps/wallet-api/' + tcOptions.envFileToSync);
      },
    }));

    const configBuilder = new ConfigBuilder(fsWrapperMock);

    configBuilder.build(tcOptions, testContext);
  });

  it('correct for sync file with partial overwrite', async () => {
    const tcOptions = {
      syncEnv: true,
      envFileToSync: 'local.env',
    } as BuildExecutorSchema;
    testContext.target.options = tcOptions;

    const fsWrapperMock: IFsWrapper = makeBaseFsWrapperMock((baseMock) => ({
      existsFile(filePath: string): boolean {
        if (filePath.includes(tcOptions.envFileToSync)) {
          expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileToSync);
          return true;
        }
        return baseMock.existsFile(filePath);
      },
      readFile(filePath: string): Buffer {
        if (filePath.includes(tcOptions.envFileToSync)) {
          expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileToSync);
          return Buffer.from(
            'SOME_ENV_KEY=\n' +
              "# Project: 'wallet-api'\n" +
              'APP_NAME=\n' +
              'APP_PORT=8080\n' +
              '\n' +
              "# Project: 'wallet-kafka'\n" +
              'APP_NAME=wallet-api\n' +
              'KAFKA_CONSUMER_BATCH_SIZE=1234\n' +
              '\n',
            'utf-8'
          );
        }
        return baseMock.readFile(filePath);
      },
      writeFile(filePath: string, text: string): void {
        if (filePath.includes('wallet-api')) {
          if (filePath.includes(tcOptions.envFileSnapshot)) {
            expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileSnapshot);
            expect(text).toEqual(
              "# Project: 'wallet-api'\n" +
                'APP_NAME=\n' +
                'APP_PORT=\n' +
                '\n' +
                "# Project: 'wallet-database'\n" +
                'DB_HOST=\n' +
                'DB_PORT=\n' +
                'DB_USER=\n' +
                'DB_PASS=\n' +
                '\n' +
                "# Project: 'wallet-kafka'\n" +
                'APP_NAME=\n' +
                'KAFKA_BROKERS=\n' +
                'KAFKA_CONSUMER_BATCH_SIZE=\n' +
                '\n'
            );
            return;
          }
          if (filePath.includes(tcOptions.envFileToSync)) {
            expect(filePath).toEqual('apps/wallet-api/' + tcOptions.envFileToSync);
            expect(text).toEqual(
              '# Unknown ENV\n' +
                'SOME_ENV_KEY=\n' +
                '\n' +
                "# Project: 'wallet-api'\n" +
                'APP_NAME=wallet-api\n' +
                'APP_PORT=8080\n' +
                '\n' +
                "# Project: 'wallet-database'\n" +
                'DB_HOST=\n' +
                'DB_PORT=\n' +
                'DB_USER=\n' +
                'DB_PASS=\n' +
                '\n' +
                "# Project: 'wallet-kafka'\n" +
                'KAFKA_BROKERS=\n' +
                'KAFKA_CONSUMER_BATCH_SIZE=1234\n' +
                '\n'
            );
            return;
          }
        }

        expect(filePath).toBeFalsy();
      },
      deleteFile(filePath: string): void {
        expect(filePath).toBe('apps/wallet-api/' + tcOptions.envFileToSync);
      },
    }));

    const configBuilder = new ConfigBuilder(fsWrapperMock);

    configBuilder.build(tcOptions, testContext);
  });
});

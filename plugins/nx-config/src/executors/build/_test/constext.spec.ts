import { ExecutorContext } from '@nx/devkit';

export const configTree = {
  apps: {
    walletApi: {
      config1: `
        import * as process from 'node:process';

        export const config = {
          client: process.env.APP_NAME,
          appPort: process.env.APP_PORT || 3000,
        };

      `,
    },
  },
  libs: {
    shared: {
      config1: {},
    },
    wallet: {
      database: {
        config1: `
            import * as process from 'node:process';

            export const config = {
              host: process.env.DB_HOST,
              port: process.env.DB_PORT,
              user: process.env.DB_USER,
              pass: process.env.DB_PASS,
            };

          `,
      },
      kafka: {
        config1: `
            import process from 'node:process';

            export const config = {
              client: process.env.APP_NAME,
              brokers: process.env.KAFKA_BROKERS,
            };

          `,
        config2: `
            import process from 'node:process';

            export const config = {
              kafkaConsumerBatchSize: process.env['KAFKA_CONSUMER_BATCH_SIZE'],
            };

          `,
      },
    },
  },
};

export const testContext = {
  root: '/Users/admin/WebstormProjects/monorepo',
  target: {
    executor: '@nx-helpers/nx-config:build',
    cache: false,
    options: {},
    configurations: {},
  },
  projectsConfigurations: {
    projects: {
      'wallet-database': {
        root: 'libs/wallet/database',
        targets: {},
        name: 'wallet-database',
        $schema: '../../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'libs/wallet/database/src',
        projectType: 'library',
        tags: [],
        implicitDependencies: [],
      },
      'shared-config': {
        root: 'libs/shared/config',
        targets: {},
        name: 'shared-config',
        $schema: '../../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'libs/shared/config/src',
        projectType: 'library',
        tags: [],
        implicitDependencies: [],
      },
      'wallet-api': {
        root: 'apps/wallet-api',
        projectType: 'application',
        targets: {
          'generate-env': {
            executor: '@nx-helpers/nx-config:build',
            cache: false,
            options: {},
            configurations: {},
          },
        },
        name: 'wallet-api',
        $schema: '../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'apps/wallet-api/src',
        tags: [],
        implicitDependencies: [],
      },
      'nx-config': {
        root: 'plugins/nx-config',
        name: 'nx-config',
        targets: {},
        $schema: '../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'plugins/nx-config/src',
        projectType: 'library',
        tags: [],
        implicitDependencies: [],
      },
      'wallet-kafka': {
        root: 'libs/wallet/kafka',
        targets: {},
        name: 'wallet-kafka',
        $schema: '../../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'libs/wallet/kafka/src',
        projectType: 'library',
        tags: [],
        implicitDependencies: [],
      },
      'deploy-tool': {
        root: 'tools/deploy',
        targets: {},
        name: 'deploy-tool',
        implicitDependencies: [],
        tags: [],
      },
      '@monorepo/source': {
        root: '.',
        includedScripts: [],
        name: '@monorepo/source',
        targets: {},
        sourceRoot: '.',
        projectType: 'library',
        $schema: 'node_modules/nx/schemas/project-schema.json',
        implicitDependencies: [],
        tags: [],
      },
    },
    version: 2,
  },
  nxJsonConfiguration: {
    $schema: './node_modules/nx/schemas/nx-schema.json',
  },
  workspace: {
    projects: {
      'wallet-database': {
        root: 'libs/wallet/database',
        targets: {},
        name: 'wallet-database',
        $schema: '../../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'libs/wallet/database/src',
        projectType: 'library',
        tags: [],
        implicitDependencies: [],
      },
      'shared-config': {
        root: 'libs/shared/config',
        targets: {},
        name: 'shared-config',
        $schema: '../../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'libs/shared/config/src',
        projectType: 'library',
        tags: [],
        implicitDependencies: [],
      },
      'wallet-api': {
        root: 'apps/wallet-api',
        projectType: 'application',
        targets: {
          'generate-env': {
            executor: '@nx-helpers/nx-config:build',
            cache: false,
            options: {},
            configurations: {},
          },
        },
        name: 'wallet-api',
        $schema: '../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'apps/wallet-api/src',
        tags: [],
        implicitDependencies: [],
      },
      'nx-config': {
        root: 'plugins/nx-config',
        name: 'nx-config',
        targets: {},
        $schema: '../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'plugins/nx-config/src',
        projectType: 'library',
        tags: [],
        implicitDependencies: [],
      },
      'wallet-kafka': {
        root: 'libs/wallet/kafka',
        targets: {},
        name: 'wallet-kafka',
        $schema: '../../../node_modules/nx/schemas/project-schema.json',
        sourceRoot: 'libs/wallet/kafka/src',
        projectType: 'library',
        tags: [],
        implicitDependencies: [],
      },
      'deploy-tool': {
        root: 'tools/deploy',
        targets: {},
        name: 'deploy-tool',
        implicitDependencies: [],
        tags: [],
      },
      '@monorepo/source': {
        root: '.',
        includedScripts: [],
        name: '@monorepo/source',
        targets: {},
        sourceRoot: '.',
        projectType: 'library',
        $schema: 'node_modules/nx/schemas/project-schema.json',
        implicitDependencies: [],
        tags: [],
      },
    },
    version: 2,
    $schema: './node_modules/nx/schemas/nx-schema.json',
  },
  projectName: 'wallet-api',
  targetName: 'generate-env',
  projectGraph: {
    nodes: {
      'wallet-database': {
        name: 'wallet-database',
        type: 'lib',
        data: {
          root: 'libs/wallet/database',
          targets: {},
          name: 'wallet-database',
          $schema: '../../../node_modules/nx/schemas/project-schema.json',
          sourceRoot: 'libs/wallet/database/src',
          projectType: 'library',
          tags: [],
          implicitDependencies: [],
        },
      },
      'shared-config': {
        name: 'shared-config',
        type: 'lib',
        data: {
          root: 'libs/shared/config',
          targets: {},
          name: 'shared-config',
          $schema: '../../../node_modules/nx/schemas/project-schema.json',
          sourceRoot: 'libs/shared/config/src',
          projectType: 'library',
          tags: [],
          implicitDependencies: [],
        },
      },
      'wallet-api': {
        name: 'wallet-api',
        type: 'app',
        data: {
          root: 'apps/wallet-api',
          projectType: 'application',
          targets: {
            'generate-env': {
              executor: '@nx-helpers/nx-config:build',
              cache: false,
              options: {},
              configurations: {},
            },
          },
          name: 'wallet-api',
          $schema: '../../node_modules/nx/schemas/project-schema.json',
          sourceRoot: 'apps/wallet-api/src',
          tags: [],
          implicitDependencies: [],
        },
      },
      'nx-config': {
        name: 'nx-config',
        type: 'lib',
        data: {
          root: 'plugins/nx-config',
          name: 'nx-config',
          targets: {},
          $schema: '../../node_modules/nx/schemas/project-schema.json',
          sourceRoot: 'plugins/nx-config/src',
          projectType: 'library',
          tags: [],
          implicitDependencies: [],
        },
      },
      'wallet-kafka': {
        name: 'wallet-kafka',
        type: 'lib',
        data: {
          root: 'libs/wallet/kafka',
          targets: {},
          name: 'wallet-kafka',
          $schema: '../../../node_modules/nx/schemas/project-schema.json',
          sourceRoot: 'libs/wallet/kafka/src',
          projectType: 'library',
          tags: [],
          implicitDependencies: [],
        },
      },
      'deploy-tool': {
        name: 'deploy-tool',
        type: 'lib',
        data: {
          root: 'tools/deploy',
          targets: {},
          name: 'deploy-tool',
          implicitDependencies: [],
          tags: [],
        },
      },
      '@monorepo/source': {
        name: '@monorepo/source',
        type: 'lib',
        data: {
          root: '.',
          includedScripts: [],
          name: '@monorepo/source',
          targets: {},
          sourceRoot: '.',
          projectType: 'library',
          $schema: 'node_modules/nx/schemas/project-schema.json',
          implicitDependencies: [],
          tags: [],
        },
      },
    },
    dependencies: {
      'wallet-database': [
        {
          source: 'wallet-database',
          target: 'shared-config',
          type: 'static',
        },
        {
          source: 'wallet-database',
          target: 'npm:joi',
          type: 'static',
        },
      ],
      'shared-config': [
        {
          source: 'shared-config',
          target: 'npm:joi',
          type: 'static',
        },
      ],
      'wallet-api': [
        {
          source: 'wallet-api',
          target: 'shared-config',
          type: 'static',
        },
        {
          source: 'wallet-api',
          target: 'npm:joi',
          type: 'static',
        },
        {
          source: 'wallet-api',
          target: 'wallet-kafka',
          type: 'static',
        },
        {
          source: 'wallet-api',
          target: 'wallet-database',
          type: 'static',
        },
        {
          source: 'wallet-api',
          target: 'npm:@nx/webpack',
          type: 'static',
        },
      ],
      'nx-config': [
        {
          source: 'nx-config',
          target: 'npm:@nx/devkit',
          type: 'static',
        },
        {
          source: 'nx-config',
          target: 'npm:tslib',
          type: 'static',
        },
        {
          source: 'nx-config',
          target: 'npm:glob',
          type: 'static',
        },
        {
          source: 'nx-config',
          target: 'npm:lodash',
          type: 'static',
        },
        {
          source: 'nx-config',
          target: 'npm:nx',
          type: 'static',
        },
      ],
      'wallet-kafka': [
        {
          source: 'wallet-kafka',
          target: 'shared-config',
          type: 'static',
        },
        {
          source: 'wallet-kafka',
          target: 'npm:joi',
          type: 'static',
        },
      ],
      'deploy-tool': [
        {
          source: 'deploy-tool',
          target: 'npm:yargs',
          type: 'static',
        },
        {
          source: 'deploy-tool',
          target: 'npm:@types/node',
          type: 'static',
        },
        {
          source: 'deploy-tool',
          target: 'npm:rimraf',
          type: 'static',
        },
      ],
      '@monorepo/source': [
        {
          source: '@monorepo/source',
          target: 'npm:@nx/jest',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:bluebird',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:csvtojson',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:joi',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:lodash',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:reflect-metadata',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:rxjs',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:tslib',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:undici',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:uuid',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx-helpers/nx-config',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@jscutlery/semver',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/devkit',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/eslint-plugin',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/js',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/linter',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/nest',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/node',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/plugin',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/web',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/webpack',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@nx/workspace',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@types/bluebird',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@types/jest',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@types/lodash',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@types/node',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@types/uuid',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@types/yargs',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@typescript-eslint/eslint-plugin',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:@typescript-eslint/parser',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:ci-info',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:eslint',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:eslint-config-prettier',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:glob',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:jest',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:jest-environment-jsdom',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:jest-environment-node',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:nx',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:prettier',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:protoc-gen-js',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:rimraf',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:ts-jest',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:ts-node',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:ts-proto',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:typescript',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:verdaccio',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:webpack-cli',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:yargs',
          type: 'static',
        },
        {
          source: '@monorepo/source',
          target: 'npm:process',
          type: 'static',
        },
      ],
      'npm:@babel/code-frame': [
        {
          source: 'npm:@babel/code-frame',
          target: 'npm:@babel/helper-validator-identifier',
          type: 'static',
        },
        {
          source: 'npm:@babel/code-frame',
          target: 'npm:js-tokens',
          type: 'static',
        },
        {
          source: 'npm:@babel/code-frame',
          target: 'npm:picocolors',
          type: 'static',
        },
      ],
    },
    version: '6.0',
  },
  cwd: '/Users/admin/WebstormProjects/monorepo',
  isVerbose: false,
} as unknown as ExecutorContext;

describe('empty', () => {
  it('empty', async () => {
    return;
  });
});

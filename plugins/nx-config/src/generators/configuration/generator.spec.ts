import { addProjectConfiguration, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { configurationGenerator } from './generator';
import { ConfigurationGeneratorSchema } from './schema';

describe('configuration generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  test.each([[1, 'myapp', 'docker', undefined, 'docker', undefined]])(
    '%d - given projectName=%s',
    async (_, projectName) => {
      const options: ConfigurationGeneratorSchema = { project: projectName };

      addProjectConfiguration(tree, projectName, { root: `apps/${projectName}` });

      await configurationGenerator(tree, options);

      const project = readProjectConfiguration(tree, projectName);

      expect(project.targets).toMatchObject({
        'config-generator': {
          executor: '@nx-helpers/nx-config:generate',
          options: {
            envFileSnapshot: 'snapshot.env',
            buildDependenciesSnapshot: false,
            syncEnv: false,
            envFileToSync: 'local.env',
          },
        },
      });
    }
  );
});

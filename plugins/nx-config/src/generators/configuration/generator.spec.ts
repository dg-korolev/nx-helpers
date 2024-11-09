import { Tree, addProjectConfiguration, readProjectConfiguration } from '@nx/devkit';
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
        'generate-env': {
          executor: '@nx-helpers/nx-config:generate',
          cache: false,
        },
      });
    }
  );
});

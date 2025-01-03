import { formatFiles, readProjectConfiguration, Tree, updateProjectConfiguration } from '@nx/devkit';
import { ConfigurationGeneratorSchema } from './schema';

export async function configurationGenerator(tree: Tree, options: ConfigurationGeneratorSchema) {
  const project = readProjectConfiguration(tree, options.project);

  updateProjectConfiguration(tree, options.project, {
    ...project,
    targets: {
      ...project.targets,
      'config-generator': {
        executor: '@nx-helpers/nx-config:build',
        options: {
          envFileSnapshot: 'snapshot.env',
          buildDependenciesSnapshot: false,
          syncEnv: false,
          envFileToSync: 'local.env',
        },
      },
    },
  });

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}

export default configurationGenerator;

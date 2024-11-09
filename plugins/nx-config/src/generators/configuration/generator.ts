import { formatFiles, readProjectConfiguration, Tree, updateProjectConfiguration } from '@nx/devkit';
import { ConfigurationGeneratorSchema } from './schema';

export async function configurationGenerator(tree: Tree, options: ConfigurationGeneratorSchema) {
  const project = readProjectConfiguration(tree, options.project);

  updateProjectConfiguration(tree, options.project, {
    ...project,
    targets: {
      ...project.targets,
      'generate-env': {
        executor: '@nx-helpers/nx-config:generate',
        cache: false,
        options: {
          envFile: 'example.env',
        },
      },
    },
  });

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}

export default configurationGenerator;

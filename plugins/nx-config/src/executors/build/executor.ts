import { BuildExecutorSchema } from './schema';
import { ExecutorContext, ProjectConfiguration, ProjectGraph } from '@nx/devkit';
import { arrayUniq } from './utils';
import {
  EnvRowComment,
  EnvRowEnv,
  EnvRowList,
  EnvRowSpace,
  EnvType,
  NewProjectEnvConfig,
  ProjectEnvConfig,
} from './types';
import { FsWrapper, IFsWrapper } from './fsWrapper';

const defaultExampleEnvFile = 'snapshot.env';

export default async function runExecutor(options: BuildExecutorSchema, ctx: ExecutorContext) {
  const configBuilder = new ConfigBuilder(new FsWrapper());
  return configBuilder.build(options, ctx);
}

export class ConfigBuilder {
  constructor(private readonly fsWrp: IFsWrapper) {}

  build(options: BuildExecutorSchema, ctx: ExecutorContext) {
    if (!options.envFileSnapshot) {
      options.envFileSnapshot = defaultExampleEnvFile;
    }

    const targetProject = ctx.projectsConfigurations.projects[ctx.projectName];

    const targetProjectEnvConfig = this.buildProjectEnvConfig(targetProject, options);
    const dependenciesProjectsEnvConfig = this.buildDependenciesProjectsEnvConfig(ctx, options);
    if (options.buildDependenciesSnapshot) {
      this.writeDependenciesSnapshot(dependenciesProjectsEnvConfig, options);
    }

    this.writeProjectEnvConfigToFile(
      this.mergeTargetProjectEnvConfigWithDependency(targetProjectEnvConfig, dependenciesProjectsEnvConfig, false),
      options.envFileSnapshot
    );

    if (options.syncEnv && options.envFileToSync) {
      this.syncConfigFile(targetProjectEnvConfig, dependenciesProjectsEnvConfig, options);
    }

    return { success: 1 };
  }

  mergeTargetProjectEnvConfigWithDependency(
    targetProjectEnvConfig: ProjectEnvConfig,
    dependenciesProjectsEnvConfig: ProjectEnvConfig[],
    distinct: boolean
  ): ProjectEnvConfig {
    const fullEnvList: EnvRowList = [];
    fullEnvList.push(this.buildProjectTitle(targetProjectEnvConfig.project.name), ...targetProjectEnvConfig.envList, {
      type: EnvType.Space,
    } as EnvRowSpace);
    dependenciesProjectsEnvConfig.forEach((projectEnvCfg) => {
      fullEnvList.push(this.buildProjectTitle(projectEnvCfg.project.name), ...projectEnvCfg.envList, {
        type: EnvType.Space,
      } as EnvRowSpace);
    });
    if (!distinct) {
      return NewProjectEnvConfig(targetProjectEnvConfig.project, fullEnvList);
    }

    return NewProjectEnvConfig(targetProjectEnvConfig.project, this.distinctEnvList(fullEnvList));
  }

  distinctEnvList(envList: EnvRowList): EnvRowList {
    const uniqEnvList: EnvRowList = [];
    const envKeysDuplicateMap = new Map<string, boolean>();
    envList.forEach((envRow) => {
      if (envRow.type !== EnvType.Env) {
        uniqEnvList.push(envRow);
        return;
      }
      if (envKeysDuplicateMap.has(envRow.key)) {
        return;
      }
      uniqEnvList.push(envRow);
      envKeysDuplicateMap.set(envRow.key, true);
    });
    return uniqEnvList;
  }

  buildProjectEnvConfig(project: ProjectConfiguration, options: BuildExecutorSchema): ProjectEnvConfig {
    const projectEnvList = this.buildProjectEnvList(project, options.envFileSnapshot);
    if (projectEnvList.length > 0) {
      return NewProjectEnvConfig(project, projectEnvList);
    }
    return NewProjectEnvConfig(project, []);
  }

  buildDependenciesProjectsEnvConfig(ctx: ExecutorContext, options: BuildExecutorSchema): ProjectEnvConfig[] {
    const projectDependenciesList = this.getProjectDependenciesList({
      projectName: ctx.projectName,
      projectGraph: ctx.projectGraph,
    });

    if (!projectDependenciesList.length) return [];

    const projectDependenciesListSorted = projectDependenciesList
      .sort()
      .map((projectName) => ctx.projectsConfigurations.projects[projectName]);

    const projectDependenciesEnvConfig: ProjectEnvConfig[] = [];
    projectDependenciesListSorted.forEach((project) => {
      const projectEnvConfig = this.buildProjectEnvConfig(project, options);
      if (projectEnvConfig.envList.length) {
        projectDependenciesEnvConfig.push(projectEnvConfig);
      }
    });
    return projectDependenciesEnvConfig;
  }

  writeDependenciesSnapshot(projectsEnvConfig: ProjectEnvConfig[], options: BuildExecutorSchema) {
    projectsEnvConfig.forEach((projectEnvConfig) => {
      this.writeProjectEnvConfigToFile(projectEnvConfig, options.envFileSnapshot);
    });
  }

  writeProjectEnvConfigToFile(projectEnvConfig: ProjectEnvConfig, fileName: string) {
    const projectEnvConfigSnapshotPath = this.getProjectConfigPath(projectEnvConfig.project, fileName);
    this.removeFileIfExist(projectEnvConfigSnapshotPath);
    this.fsWrp.writeFile(projectEnvConfigSnapshotPath, this.concatEnvList(projectEnvConfig.envList));
  }

  existsProjectFile(project: ProjectConfiguration, fileName: string): boolean {
    const projectEnvConfigSnapshotPath = this.getProjectConfigPath(project, fileName);
    return this.fsWrp.existsFile(projectEnvConfigSnapshotPath);
  }

  buildProjectTitle(projectName: string): EnvRowComment {
    return { type: EnvType.Comment, value: ` Project: '${projectName}'` };
  }

  buildProjectEnvList(project: ProjectConfiguration, envFileSnapshot: string): EnvRowList {
    const projectEnvKeys = this.extractProjectEnvKeys(project);
    const projectEnvList = this.parseProjectEnvFile(project, envFileSnapshot);
    return this.buildNewEnvListWithInheritance(projectEnvKeys, projectEnvList);
  }

  syncConfigFile(
    targetProjectEnvConfig: ProjectEnvConfig,
    dependenciesProjectsEnvConfig: ProjectEnvConfig[],
    options: BuildExecutorSchema
  ) {
    const targetProjectMergedEnvConfig = this.mergeTargetProjectEnvConfigWithDependency(
      targetProjectEnvConfig,
      dependenciesProjectsEnvConfig,
      true
    );
    if (!this.existsProjectFile(targetProjectEnvConfig.project, options.envFileToSync)) {
      this.writeProjectEnvConfigToFile(targetProjectMergedEnvConfig, options.envFileToSync);
      return;
    }

    const currentEnvList = this.parseProjectEnvFile(targetProjectMergedEnvConfig.project, options.envFileToSync);

    const currentEnvValuesMap = new Map<string, string>(
      this.filterEnvList(currentEnvList, EnvType.Env).map((envRow) => [envRow.key, envRow.value])
    );

    const mergedEnvList: EnvRowList = [];
    targetProjectMergedEnvConfig.envList.forEach((envRow) => {
      if (envRow.type !== EnvType.Env) {
        mergedEnvList.push(envRow);
        return;
      }
      const value = currentEnvValuesMap.has(envRow.key) ? currentEnvValuesMap.get(envRow.key) : envRow.value;
      mergedEnvList.push({ ...envRow, value });
    });

    const parsedKeysSet = new Set<string>();
    targetProjectMergedEnvConfig.envList.forEach((envRow) => {
      if (envRow.type == EnvType.Env) {
        parsedKeysSet.add(envRow.key);
      }
    });

    const unknownEnvList: EnvRowList = [];
    currentEnvList.forEach((envRow) => {
      if (envRow.type === EnvType.Env && !parsedKeysSet.has(envRow.key)) {
        unknownEnvList.push(envRow);
      }
    });
    if (unknownEnvList.length) {
      unknownEnvList.unshift({ type: EnvType.Comment, value: ' Unknown ENV' } as EnvRowComment);
      unknownEnvList.push({ type: EnvType.Space } as EnvRowSpace);
    }

    const newEnvList = this.distinctEnvList(
      this.cleanEnvList([...unknownEnvList, ...mergedEnvList, { type: EnvType.Space } as EnvRowSpace])
    );

    this.writeProjectEnvConfigToFile(
      NewProjectEnvConfig(targetProjectEnvConfig.project, newEnvList),
      options.envFileToSync
    );
  }

  getProjectConfigPath(project: ProjectConfiguration, fileName: string): string {
    return `${project.root}/${fileName}`;
  }

  removeFileIfExist(pathToFile: string): void {
    if (this.fsWrp.existsFile(pathToFile)) this.fsWrp.deleteFile(pathToFile);
  }

  filterEnvList<
    T extends EnvRowList[number]['type'],
    R extends T extends EnvType.Env ? EnvRowEnv[] : T extends EnvType.Comment ? EnvRowComment[] : EnvRowSpace[]
  >(envList: EnvRowList, type: T): R {
    return envList.filter((row) => row.type === type) as R;
  }

  concatEnvList(envList: EnvRowList): string {
    return envList.reduce((acc, envRow) => {
      switch (envRow.type) {
        case EnvType.Env: {
          return acc.concat(`${envRow.key}=${envRow.value}\n`);
        }
        case EnvType.Comment: {
          return acc.concat(`#${envRow.value}\n`);
        }
        case EnvType.Space: {
          return acc.concat(`\n`);
        }
        default: {
          throw new Error('!!!!!!!');
        }
      }
    }, '');
  }

  parseEnvFileByPath(configFilePath: string): EnvRowList {
    if (!this.fsWrp.existsFile(configFilePath)) return [];
    return this.parseEnvFile(this.fsWrp.readFile(configFilePath));
  }

  parseProjectEnvFile(project: ProjectConfiguration, envFileName: string): EnvRowList {
    const envFilePath = this.getProjectConfigPath(project, envFileName);
    return this.parseEnvFileByPath(envFilePath);
  }

  parseEnvFile(buffer: Buffer): EnvRowList {
    const fileData = buffer.toString().trim();

    if (!fileData) return [];

    const parsedEnvList: EnvRowList = [];

    fileData.split('\n').forEach((str) => {
      const isComment = /(^|\n)\s*#.*/.test(str);
      if (isComment) {
        parsedEnvList.push({ type: EnvType.Comment, value: str.replace(/\s*#/g, '') });
      } else {
        const formattedStr = ((str: string) => {
          const strTrim = str.trim();
          const strArr = strTrim.split('=');
          strArr[0] = strArr[0].replace(/\s+/g, '');
          return strArr.join('=').replace(/=+/g, '=');
        })(str);

        if (!formattedStr) {
          parsedEnvList.push({ type: EnvType.Space });
        }

        const formattedSubstrings = formattedStr.split('=');

        const [envKey, envValue = ''] = formattedSubstrings;

        if (!envKey) return;

        const isValidEnvKey = /^[A-Za-z][A-Za-z0-9_]*$/.test(envKey);
        if (!isValidEnvKey) return;

        parsedEnvList.push({ type: EnvType.Env, key: envKey, value: envValue });
      }
    });

    return parsedEnvList;
  }

  cleanEnvList(envList: EnvRowList): EnvRowList {
    let prevLineIsEmpty = false;

    return envList
      .map((envRow) => {
        if (envRow.type === EnvType.Comment || envRow.type === EnvType.Env) {
          prevLineIsEmpty = false;
          return envRow;
        } else {
          if (prevLineIsEmpty) {
            return null;
          }
          prevLineIsEmpty = true;
          return envRow;
        }
      })
      .filter((v) => v !== null);
  }

  buildNewEnvListWithInheritance(envKeys: string[], envList: EnvRowList): EnvRowList {
    const envListMap = new Map<string, EnvRowEnv>();
    envList.forEach((envRow) => {
      if (envRow.type == EnvType.Env) {
        envListMap.set(envRow.key, envRow);
      }
    });

    const newEnvList: EnvRowList = [];
    envKeys.forEach((envKey) => {
      let envRow: EnvRowEnv = null;
      if (envListMap.has(envKey)) {
        envRow = envListMap.get(envKey);
      } else {
        envRow = {
          type: EnvType.Env,
          key: envKey,
          value: '',
        };
      }
      newEnvList.push(envRow);
    });

    return newEnvList;
  }

  extractProjectEnvKeys(project: ProjectConfiguration): string[] {
    const filesListToParseEnv = this.fsWrp.getFilesByPathPattern([`${project.root}/**/*.{js,ts}`], {
      ignore: `node_modules/**`,
    });

    const parsedEnvKeysList = arrayUniq(
      filesListToParseEnv.sort().reduce((acc, fileName) => {
        const envList = this.extractEnvKeysFromFile(fileName);
        return acc.concat(envList);
      }, [])
    );

    return parsedEnvKeysList;
  }

  extractEnvKeysFromFile(filePath: string): string[] {
    const file = this.fsWrp.readFile(filePath).toString();
    if (!file) return [];
    return [...file.matchAll(/process\.env(\[(["'`])|\.)([a-zA-Z_][a-zA-Z_0-9]*)\2/g)].map((v) => v[3]);
  }

  getProjectDependenciesList(params: { projectName: string; projectGraph: ProjectGraph }) {
    const { projectName, projectGraph } = params;

    const projectDependenciesList = (projectGraph.dependencies[projectName] ?? []).filter((d) => {
      return projectGraph.nodes[d.target];
    });

    const childProjectDependenciesList = projectDependenciesList
      .map((pjDep) => this.getProjectDependenciesList({ projectName: pjDep.target, projectGraph }))
      .reduce((acc, childProjectDependencies) => acc.concat(childProjectDependencies), []);

    return arrayUniq([...projectDependenciesList.map((pjDep) => pjDep.target), ...childProjectDependenciesList]);
  }
}

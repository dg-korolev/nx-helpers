import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { readFileSync } from 'fs';
import { BuildExecutorSchema } from './schema';
import { ExecutorContext, ProjectConfiguration, ProjectGraph } from '@nx/devkit';
import { globSync } from 'glob';
import { arrayUniq } from './utils';

const defaultGenerateConfigFileName = 'generated-example.env';

export default async function runExecutor(options: BuildExecutorSchema, ctx?: ExecutorContext) {
  const targetProject = ctx.projectsConfigurations.projects[ctx.projectName];

  const targetProjectGeneratedConfigPath = getProjectGeneratedConfigPath(targetProject);

  removeFileIfExist(targetProjectGeneratedConfigPath);

  const projectDependenciesList = getProjectDependenciesList({
    projectName: ctx.projectName,
    projectGraph: ctx.projectGraph,
  });

  if (!projectDependenciesList.length) return { success: true };

  const targetProjectConfigEnvListArray: EnvList[] = [];

  [
    targetProject,
    ...projectDependenciesList.sort().map((projectName) => ctx.projectsConfigurations.projects[projectName]),
  ].forEach((project) => {
    const parsedEnvKeysList = extractEnvKeysFromProject(project);

    if (!parsedEnvKeysList.length) return;

    const projectGeneratedConfigPath = getProjectGeneratedConfigPath(project);

    const parsedEnvRowsList = parseEnvFile(projectGeneratedConfigPath);

    const newEnvRowsList = assignKeysToEnvList(parsedEnvRowsList, parsedEnvKeysList);

    const cleanedEnvRowsList = cleanEnvList(newEnvRowsList);

    writeFileSync(projectGeneratedConfigPath, concatEnvList(cleanedEnvRowsList));

    targetProjectConfigEnvListArray.push([
      { type: 'comment', value: ` Project: '${project.name}'` },
      ...cleanedEnvRowsList,
    ]);
  });

  const targetProjectGeneratedConfig = targetProjectConfigEnvListArray
    .map((envList) => concatEnvList(envList))
    .join('\n');

  writeFileSync(targetProjectGeneratedConfigPath, targetProjectGeneratedConfig);

  const projectDevelopmentEnvConfigPath = getProjectDevelopmentEnvConfigPath(targetProject, options.envFile);

  if (!existsSync(projectDevelopmentEnvConfigPath)) {
    writeFileSync(projectDevelopmentEnvConfigPath, targetProjectGeneratedConfig);
  } else {
    const parsedKeysSet = new Set(
      targetProjectConfigEnvListArray.reduce((acc, envList) => {
        return acc.concat(filterEnvList(envList, 'env').map((row) => row.key));
      }, [] as string[])
    );

    const existedEnvRowsList = parseEnvFile(projectDevelopmentEnvConfigPath).map((row) => {
      if (row.type !== 'env') return row;
      const isExistAtParsedKeys = parsedKeysSet.has(row.key);
      if (isExistAtParsedKeys) return row;
      return { type: 'comment', value: `#->${row.key}=${row.value}` } as EnvRowComment;
    });

    const existedKeysSet = new Set(filterEnvList(existedEnvRowsList, 'env').map((row) => row.key));

    const targetProjectConfigEnvListMixed: EnvRowEnv[][] = [];

    targetProjectConfigEnvListArray.filter((projectConfigEnvList) => {
      const envRows: EnvRowEnv[] = filterEnvList(projectConfigEnvList, 'env');
      const notExistedEnvRows = envRows.filter((row) => !existedKeysSet.has(row.key));
      if (notExistedEnvRows.length) targetProjectConfigEnvListMixed.push(notExistedEnvRows);
    });

    const newTargetProjectGeneratedConfig = targetProjectConfigEnvListMixed
      .map((envList) => [...envList, { type: 'space' } as EnvRowSpace])
      .reduce((acc, list) => acc.concat(list), []);

    const newTargetProjectGeneratedKeysSet = new Set();

    const uniqNewTargetProjectGeneratedConfig = newTargetProjectGeneratedConfig.filter((row) => {
      if (row.type !== 'env') return true;
      if (newTargetProjectGeneratedKeysSet.has(row.key)) return false;
      newTargetProjectGeneratedKeysSet.add(row.key);
      return true;
    });

    writeFileSync(
      projectDevelopmentEnvConfigPath,
      concatEnvList([
        ...cleanEnvList(existedEnvRowsList),
        { type: 'space' } as EnvRowSpace,
        ...cleanEnvList(uniqNewTargetProjectGeneratedConfig),
      ])
    );
  }

  return { success: 1 };
}

function getProjectGeneratedConfigPath(project: ProjectConfiguration): string {
  return `${project.root}/${defaultGenerateConfigFileName}`;
}

function getProjectDevelopmentEnvConfigPath(project: ProjectConfiguration, fileName: string): string {
  return `${project.root}/${fileName}`;
}

function removeFileIfExist(pathToFile: string): void {
  if (existsSync(pathToFile)) unlinkSync(pathToFile);
}

function filterEnvList<
  T extends EnvList[number]['type'],
  R extends T extends 'env' ? EnvRowEnv[] : T extends 'comment' ? EnvRowComment[] : EnvRowSpace[]
>(envList: EnvList, type: T): R {
  return envList.filter((row) => row.type === type) as R;
}

function concatEnvList(envList: EnvList): string {
  return envList.reduce((acc, envRow) => {
    switch (envRow.type) {
      case 'env': {
        return acc.concat(`${envRow.key}=${envRow.value}\n`);
      }
      case 'comment': {
        return acc.concat(`#${envRow.value}\n`);
      }
      case 'space': {
        return acc.concat(`\n`);
      }
      default: {
        throw new Error('!!!!!!!');
      }
    }
  }, '');
}

function parseEnvFile(configFilePath: string): EnvList {
  if (!existsSync(configFilePath)) return [];

  const generatedExampleEnvFile = readFileSync(configFilePath).toString().trim();

  if (!generatedExampleEnvFile) return [];

  const parsedEnvList: EnvList = [];

  generatedExampleEnvFile.split('\n').forEach((str) => {
    const isComment = /(^|\n)\s*#.*/.test(str);
    if (isComment) {
      parsedEnvList.push({ type: 'comment', value: str.replace(/\s*#/g, '') });
    } else {
      const formattedStr = ((str: string) => {
        const strTrim = str.trim();
        const strArr = strTrim.split('=');
        strArr[0] = strArr[0].replace(/\s+/g, '');
        return strArr.join('=').replace(/=+/g, '=');
      })(str);

      if (!formattedStr) {
        parsedEnvList.push({ type: 'space' });
      }

      const formattedSubstrings = formattedStr.split('=');

      const [envKey, envValue = ''] = formattedSubstrings;

      if (!envKey) return;

      const isValidEnvKey = /^[A-Za-z][A-Za-z0-9_]*$/.test(envKey);
      if (!isValidEnvKey) return;

      // const isValidEnvValue = !envValue || /^[A-Za-z0-9'"_-]*$/.test(envValue);

      parsedEnvList.push({ type: 'env', key: envKey, value: envValue });
    }
  });

  return parsedEnvList;
}

function cleanEnvList(envList: EnvList): EnvList {
  let prevLineIsEmpty = false;

  return envList
    .map((envRow) => {
      if (envRow.type === 'comment' || envRow.type === 'env') {
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

function assignKeysToEnvList(envList: EnvList, envKeys: string[]): EnvList {
  const envListWithoutDeletedKeys = envList.filter((envRow) => envRow.type !== 'env' || envKeys.includes(envRow.key));

  const existedEnvKeys = new Set(
    (envListWithoutDeletedKeys.filter((envRow) => envRow.type === 'env') as EnvRowEnv[]).map((envRow) => envRow.key)
  );

  const newEnvKeys = envKeys.filter((envKey) => !existedEnvKeys.has(envKey));

  const newEnvRows: EnvRowEnv[] = newEnvKeys.map((envKey) => ({
    type: 'env',
    key: envKey,
    value: '',
  }));

  return [...envListWithoutDeletedKeys, ...newEnvRows];
}

function extractEnvKeysFromProject(project: ProjectConfiguration): string[] {
  const filesListToParseEnv = globSync([`${project.root}/**/*.{js,ts}`], {
    ignore: `node_modules/**`,
  });

  const parsedEnvKeysList = arrayUniq(
    filesListToParseEnv.reduce((acc, fileName) => {
      const envList = extractEnvKeysFromFile(fileName);
      return acc.concat(envList);
    }, [])
  );

  return parsedEnvKeysList;
}

function extractEnvKeysFromFile(filePath: string): string[] {
  const file = readFileSync(filePath).toString();
  if (!file) return [];
  return [...file.matchAll(/process\.env(\[(["'`])|\.)([a-zA-Z_][a-zA-Z_0-9]*)\2/g)].map((v) => v[3]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getAppProject(ctx?: ExecutorContext) {
  const appTargets = Object.values(ctx.taskGraph.tasks).filter((target) => {
    return target.projectRoot.split('/')[0] === 'apps' && target.target.target === 'generate-env';
  });

  if (appTargets.length !== 1) {
    if (appTargets.length === 0) console.error('App not found!');
    else console.error(`Detected app counts ${appTargets.length} not equal 1.`);
    process.exit(1);
  }

  const projectRootPath = appTargets[0].projectRoot;

  return Object.values(ctx.projectsConfigurations.projects).find((project) => project.root === projectRootPath);
}

function getProjectDependenciesList(params: { projectName: string; projectGraph: ProjectGraph }) {
  const { projectName, projectGraph } = params;

  const projectDependenciesList = (projectGraph.dependencies[projectName] ?? []).filter((d) => {
    return projectGraph.nodes[d.target];
  });

  const childProjectDependenciesList = projectDependenciesList
    .map((pjDep) => getProjectDependenciesList({ projectName: pjDep.target, projectGraph }))
    .reduce((acc, childProjectDependencies) => acc.concat(childProjectDependencies), []);

  return arrayUniq([...projectDependenciesList.map((pjDep) => pjDep.target), ...childProjectDependenciesList]);
}

type EnvList = Array<EnvRowSpace | EnvRowComment | EnvRowEnv>;

type EnvRowSpace = {
  type: 'space';
};

type EnvRowComment = {
  type: 'comment';
  value: string;
};

type EnvRowEnv = {
  type: 'env';
  key: string;
  value: string;
};

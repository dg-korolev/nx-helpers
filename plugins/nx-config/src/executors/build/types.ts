import { ProjectConfiguration } from '@nx/devkit';

export type EnvRowList = Array<EnvRow>;

export type EnvRow = EnvRowSpace | EnvRowComment | EnvRowEnv;

export enum EnvType {
  Space = 0,
  Comment = 1,
  Env = 2,
}

export type EnvRowSpace = {
  type: EnvType.Space;
};

export type EnvRowComment = {
  type: EnvType.Comment;
  value: string;
};

export type EnvRowEnv = {
  type: EnvType.Env;
  key: string;
  value: string;
};

export type ProjectEnvConfig = {
  project: ProjectConfiguration;
  envList: EnvRowList;
};

export function NewProjectEnvConfig(project: ProjectConfiguration, envList: EnvRowList): ProjectEnvConfig {
  return {
    project,
    envList,
  };
}

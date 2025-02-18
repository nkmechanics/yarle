import fsExtra from 'fs-extra';
import fs from 'fs';
import * as path from 'path';

import { Path } from '../paths';
import { yarleOptions } from '../yarle';

import { getNoteFileName, getNoteName } from './filename-utils';
import { loggerInfo } from './loggerInfo';
import { logger } from './logger';
import { OutputFormat } from './../output-format';

export const paths: Path = {};

export const getResourceDir = (dstPath: string, note: any): string => {
  // return getNoteName(dstPath, note).replace(/\s/g, '_');
  return getNoteName(dstPath, note);
};

const getFilePath = (dstPath: string, note: any): string => {
  return `${dstPath}${path.sep}${getNoteFileName(dstPath, note)}`;
};

export const getMdFilePath = (note: any): string => {
  return getFilePath(paths.mdPath, note);
};

export const getHtmlFilePath = (note: any): string => {
  return getFilePath(paths.resourcePath, note).replace(/\.md$/, '.html');
};

export const getHtmlFileLink = (note: any): string => {
  const filePath = getHtmlFilePath(note);

  return `.${filePath.slice(paths.resourcePath.lastIndexOf(path.sep))}`;
};

const clearDistDir = (dstPath: string): void => {
  if (fs.existsSync(dstPath)) {
    fsExtra.removeSync(dstPath);
  }
  fs.mkdirSync(dstPath);
};

export const getRelativeResourceDir = (note: any): string => {
  const enexFolder = `${path.sep}${yarleOptions.resourcesDir}`;
  if (yarleOptions.haveGlobalResources) {
    return `..${enexFolder}`;
  }

  return yarleOptions.haveEnexLevelResources
    ? `.${enexFolder}`
    : `.${enexFolder}${path.sep}${getResourceDir(paths.mdPath, note)}`;
};

export const getAbsoluteResourceDir = (note: any): string => {
  if (yarleOptions.haveGlobalResources) {
    return path.resolve(paths.resourcePath, '..', '..', yarleOptions.resourcesDir);
  }

  return yarleOptions.haveEnexLevelResources
    ? paths.resourcePath
    : `${paths.resourcePath}${path.sep}${getResourceDir(paths.mdPath, note)}`;
};

const resourceDirClears = new Map<string, number>();
export const clearResourceDir = (note: any): void => {
  const resPath = getAbsoluteResourceDir(note);
  if (!resourceDirClears.has(resPath)) {
    resourceDirClears.set(resPath, 0);
  }

  const clears = resourceDirClears.get(resPath);
  // we're sharing a resource dir, so we can can't clean it more than once
  if ((yarleOptions.haveEnexLevelResources || yarleOptions.haveGlobalResources) && clears >= 1) {
    return;
  }

  clearDistDir(resPath);
  resourceDirClears.set(resPath, clears + 1);
};

export const clearResourceDistDir = (): void => {
  clearDistDir(paths.resourcePath);
};
export const clearMdNotesDistDir = (): void => {
  clearDistDir(paths.mdPath);
};

export const setPaths = (enexSource: string): void => {
  // loggerInfo('setting paths');
  const enexFolder = enexSource.split(path.sep);
  // loggerInfo(`enex folder split: ${JSON.stringify(enexFolder)}`);
  const enexFile = (enexFolder.length >= 1 ?  enexFolder[enexFolder.length - 1] : enexFolder[0]).split('.')[0];
  // loggerInfo(`enex file: ${enexFile}`);

  const outputDir = path.isAbsolute(yarleOptions.outputDir)
    ? yarleOptions.outputDir
    : `${process.cwd()}${path.sep}${yarleOptions.outputDir}`;

  paths.mdPath = `${outputDir}${path.sep}notes${path.sep}`;
  paths.resourcePath = `${outputDir}${path.sep}notes${path.sep}${yarleOptions.resourcesDir}`;

  // loggerInfo(`Skip enex filename from output? ${yarleOptions.skipEnexFileNameFromOutputPath}`);
  if (!yarleOptions.skipEnexFileNameFromOutputPath) {
    paths.mdPath = `${paths.mdPath}${enexFile}`;
    // loggerInfo(`mdPath: ${paths.mdPath}`);
    paths.resourcePath = `${outputDir}${path.sep}notes${path.sep}${enexFile}${path.sep}${yarleOptions.resourcesDir}`;
  }

  if (yarleOptions.outputFormat === OutputFormat.LogSeqMD) {
    const folderName = yarleOptions.logseqSettings.journalNotes ? 'journal' : 'pages';
    paths.mdPath = `${outputDir}${path.sep}${folderName}${path.sep}`;
    paths.resourcePath = `${outputDir}${path.sep}${yarleOptions.resourcesDir}`;
  }

  fsExtra.mkdirsSync(paths.mdPath);
  if ((!yarleOptions.haveEnexLevelResources && !yarleOptions.haveGlobalResources) || 
    yarleOptions.outputFormat === OutputFormat.LogSeqMD) {
    fsExtra.mkdirsSync(paths.resourcePath);
  }
  loggerInfo(`path ${paths.mdPath} created`);
  // clearDistDir(paths.simpleMdPath);
  // clearDistDir(paths.complexMdPath);
};

export const getNotesPath = (): string => {
  return paths.mdPath;
};

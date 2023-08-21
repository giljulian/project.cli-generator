import inquirer from 'inquirer';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs-extra';
import { promisify } from 'util';
import { Octokit } from 'octokit';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const githubToken = process.env.GITHUB_TOKEN;
const githubUsername = process.env.GITHUB_USERNAME;
const targetFolderPath = path.join(__dirname, 'generated-projects');

const octokit = new Octokit({ auth: githubToken });

async function generateCode(boilerplate, projectName) {
  const boilerplatePath = path.join(__dirname, `packages/${boilerplate}-boilerplate`);
  const projectFolderPath = path.join(__dirname, `generated-projects/${projectName}`);
  
  // Create new project folder
  await fs.mkdir(projectFolderPath);

  // Copy boilerplate code to target folder
  await fs.copy(boilerplatePath, projectFolderPath);
}

async function initializeRepository(projectName) {
  process.chdir(`${targetFolderPath}/${projectName}`);
  const git = simpleGit(`${targetFolderPath}/${projectName}`);

  // Initialize a new Git repository
  await git.init();
  console.log({git});

  return git;
}

async function commitChanges(git, commitMessage) {
  await git.add('--all');
  await git.commit(commitMessage);
}

async function pushToRepository(git, projectName) {
  console.log({git, projectName});
  const { data } = await octokit.rest.repos.createForAuthenticatedUser({ name: projectName });
  console.log({ data });
  const remoteRepo = data.ssh_url;
  // const remoteRepo = data.clone_url;

  await git.addRemote('origin', remoteRepo);
  await git.push('origin', 'main');
}

// Example usage with inquirer prompt and simple-git
async function runCodeGenerator() {
  const boilerplates = ['react', 'vue', 'angular'];

  const answers = await inquirer.prompt([
    { type: 'list', name: 'boilerplate', message: 'Select a boilerplate:', choices: boilerplates },
    { type: 'input', name: 'projectName', message: 'Enter the project name:' },
  ]);

  const { boilerplate, projectName } = answers;

  await generateCode(boilerplate, projectName);

  const git = await initializeRepository(projectName);
  await commitChanges(git, 'Initial commit');

  const shouldPush = await inquirer.prompt([
    { type: 'confirm', name: 'pushToRepo', message: 'Would you like to push to a remote repository?', default: false },
  ]);

  if (shouldPush.pushToRepo) {
    await pushToRepository(git, projectName);
  }
}

runCodeGenerator().catch(console.error);
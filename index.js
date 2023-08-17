// ... Previous code
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

const packagesPath = path.join(__dirname, 'packages');
const generatedProjectsPath = path.join(__dirname, 'generated-projects'); // New folder

const git = simpleGit();

const mkdirAsync = promisify(fs.mkdir);
const copyAsync = promisify(fs.copy);

const { GITHUB_TOKEN, GITHUB_USERNAME } = process.env;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN , // Replace with your personal access token
});

const questions = [
  {
    type: 'list',
    name: 'template',
    message: 'Select a template:',
    choices: ['react', 'angular', 'svelte'],
  },
  {
    type: 'input',
    name: 'projectName',
    message: 'Enter a project name:',
  },
];

inquirer.prompt(questions).then(async (answers) => {
  const { template, projectName } = answers;
  
  const templatePath = path.join(packagesPath, `${template}-boilerplate`);
  const projectFolderPath = path.join(generatedProjectsPath, projectName);

  // Create the new project folder
  await mkdirAsync(projectFolderPath);

  // Copy the template files to the new project folder
  await copyAsync(templatePath, projectFolderPath);

  // Change directory to the newly created project
  process.chdir(projectFolderPath);
  
  // Initialize a new Git repository
  await git.init();

  console.log('Project setup completed!');

  // // List the contents before pushing
  // const contentsBeforePush = await fs.readdir(projectFolderPath);
  // console.log('Contents before pushing:');
  // console.log(contentsBeforePush);

  // Create a new repository on GitHub
  const repoName = projectName.toLowerCase().replace(/\s/g, '-');
  try {
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description: `A new project using ${template} template`,
    });

    console.log('New project folder path:', projectFolderPath);
    console.log('Current working directory after changing:', process.cwd());

    // Initialize and configure simple-git
    const repo = git.init();
    
    // Add the contents of the output folder to Git
    const outputFolderContents = await fs.readdir(projectFolderPath);
    console.log({ outputFolderContents });
    await repo.add(outputFolderContents);
    await repo.commit('Initial commit'); // Commit with a message

    const remotes = await repo.getRemotes();
    const originRemoteExists = remotes.some((remote) => remote.name === `origin-${repoName}`);

    if (!originRemoteExists) {
      console.log('ADD THE REMOTE');
      // await repo.addRemote(`origin-${repoName}`, `git@github.com:${GITHUB_USERNAME}/${repoName}.git`);
    }

    // Push to the remote repository
    console.log('MAKE THE PUSH');
    // await repo.push(`origin-${repoName}`, 'main');

    console.log(`GitHub repository ${repoName} created and files pushed!`);
  } catch (error) {
    console.error('Error creating repository:', error);
  }
});

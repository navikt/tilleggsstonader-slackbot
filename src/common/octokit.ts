import { Octokit } from 'octokit';

const dotenv = require('dotenv');
dotenv.config();

if (!process.env['GITHUB_TOKEN']) {
    throw Error('Missing env GITHUB_TOKEN');
}
export const octokit = new Octokit({
    auth: process.env['GITHUB_TOKEN'],
});

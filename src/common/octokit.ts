import { Octokit } from 'octokit';
import { components } from '@octokit/openapi-types';

const dotenv = require('dotenv');
dotenv.config();

if (!process.env['GITHUB_TOKEN']) {
    throw Error('Missing env GITHUB_TOKEN');
}
export const octokit = new Octokit({
    auth: process.env['GITHUB_TOKEN'],
});

const headers = {
    'X-GitHub-Api-Version': '2022-11-28',
};

export type Repo = components['schemas']['repo-search-result-item'];
export type Pr = components['schemas']['pull-request'];
export type PrReview = components['schemas']['pull-request-review'];

export interface PrMedReviews {
    pr: Pr;
    reviews: PrReview[];
}

export const hentRepos = (q: string) =>
    octokit
        .request('GET /search/repositories', {
            q: q,
            headers: headers,
        })
        .then((res) => res.data.items as Repo[]);

export const hentPrs = (repo: Repo) =>
    octokit
        .request(`GET /repos/${repo.full_name}/pulls`, {
            headers: headers,
        })
        .then((res) => res.data as Pr[]);

export const hentReviews = (repo: string, number: number): Promise<PrReview[]> =>
    octokit
        .request(`GET /repos/${repo}/pulls/${number}/reviews`, {
            headers: headers,
        })
        .then((res) => res.data as PrReview[]);

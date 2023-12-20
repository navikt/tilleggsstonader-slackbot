import { octokit } from '../common/octokit';
import { components } from '@octokit/openapi-types';
import { RepoStatus, Status } from './typer';

const dotenv = require('dotenv');
dotenv.config();

type Repo = components['schemas']['repo-search-result-item'];
type Pr = components['schemas']['pull-request'];
type PrReview = components['schemas']['pull-request-review'];

interface PrMedReviews {
    pr: Pr;
    reviews: PrReview[];
}

const headers = {
    'X-GitHub-Api-Version': '2022-11-28',
};

// Finner repos som er tagget med tilleggsstonader
const hentRepos = () =>
    octokit
        .request('GET /search/repositories', {
            q: 'owner:navikt+topic:tilleggsstonader',
            headers: headers,
        })
        .then((res) => res.data.items as Repo[]);

const hentPrs = (repo: Repo) =>
    octokit
        .request(`GET /repos/${repo.full_name}/pulls`, {
            headers: headers,
        })
        .then((res) => ({ repo, prs: res.data as Pr[] }));

const hentReviews = (repo: string, pr: Pr): Promise<PrMedReviews> =>
    octokit
        .request(`GET /repos/${repo}/pulls/${pr.number}/reviews`, {
            headers: headers,
        })
        .then((res) => ({ pr, reviews: res.data as PrReview[] }));

const erGodkjent = (pr: PrMedReviews) => pr.reviews.some((r) => r.state === 'APPROVED');
const harReviews = (pr: PrMedReviews) => pr.reviews.length > 0;
const harIkkeReviews = (pr: PrMedReviews) => !harReviews(pr);
const erIkkeGodkjent = (pr: PrMedReviews) => harReviews(pr) && !erGodkjent(pr);

const erDependabot = (pr: Pr) => pr.user.login === 'dependabot[bot]';

const hentRepoMedStatus = async (repo: Repo, prs: Pr[]): Promise<RepoStatus> => {
    const brukerPrs = prs.filter((pr: Pr) => !erDependabot(pr));
    const prMedReviews = await Promise.all(brukerPrs.map((pr) => hentReviews(repo.full_name, pr)));
    return {
        navn: repo.name,
        pullsUrl: repo.pulls_url,
        prs: prMedReviews.map((pr) => ({
            tittel: pr.pr.title,
            url: pr.pr.url,
            erGodkjent: erGodkjent(pr),
        })),
        antallGodkjente: prMedReviews.filter(erGodkjent).length,
        antallVenter: prMedReviews.filter(harIkkeReviews).length,
        antallUnderArbeid: prMedReviews.filter(erIkkeGodkjent).length,
        antallDependabot: prs.filter(erDependabot).length,
    };
};

const initTotal = {
    antallGodkjente: 0,
    antallVenter: 0,
    antallUnderArbeid: 0,
    antallDependabot: 0,
};

const beregnTotal = (repos: RepoStatus[]): Status =>
    repos.reduce(
        (acc, r) => ({
            antallGodkjente: acc.antallGodkjente + r.antallGodkjente,
            antallVenter: acc.antallVenter + r.antallVenter,
            antallUnderArbeid: acc.antallUnderArbeid + r.antallUnderArbeid,
            antallDependabot: acc.antallDependabot + r.antallDependabot,
        }),
        initTotal
    );

export const hentRepoStatus = async () => {
    const repos = await hentRepos();
    const prs = await Promise.all(repos.map((repo) => hentPrs(repo)));
    const statuser = await Promise.all(prs.map((pr) => hentRepoMedStatus(pr.repo, pr.prs)));
    return {
        repos: statuser,
        total: beregnTotal(statuser),
    };
};

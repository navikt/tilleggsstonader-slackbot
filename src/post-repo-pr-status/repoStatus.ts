import { hentRepos, PullRequest, Repo } from '../common/octokit';
import { RepoStatus, Status } from './typer';

const initTotal: Status = {
    antallGodkjente: 0,
    antallVenter: 0,
    antallUnderArbeid: 0,
    antallFraBots: 0,
};

const erGodkjent = (pr: PullRequest) => pr.approved;
const harReviews = (pr: PullRequest) => pr.totalReviews > 0;
const harIkkeReviews = (pr: PullRequest) => !harReviews(pr);
const erIkkeGodkjent = (pr: PullRequest) => harReviews(pr) && !erGodkjent(pr);

const erDependabot = (pr: PullRequest) => pr.author === 'dependabot';
const erGithubActionsBot = (pr: PullRequest) => pr.author === 'github-actions';

const tilRepoMedStatus = (repo: Repo): RepoStatus => {
    const { pullRequests } = repo;
    const ikkeFraBots = pullRequests.filter((pr) => !erDependabot(pr) && !erGithubActionsBot(pr));
    const prsFraBots = pullRequests.filter(erDependabot || erGithubActionsBot)
    return {
        name: repo.name,
        pullsUrl: repo.url + '/pulls',
        prs: ikkeFraBots,
        prsFraBots: prsFraBots,
        antallGodkjente: ikkeFraBots.filter(erGodkjent).length,
        antallVenter: ikkeFraBots.filter(harIkkeReviews).length,
        antallUnderArbeid: ikkeFraBots.filter(erIkkeGodkjent).length,
        antallFraBots: prsFraBots.length,
    };
};

const beregnTotal = (repos: RepoStatus[]): Status =>
    repos.reduce(
        (acc, r) => ({
            antallGodkjente: acc.antallGodkjente + r.antallGodkjente,
            antallVenter: acc.antallVenter + r.antallVenter,
            antallUnderArbeid: acc.antallUnderArbeid + r.antallUnderArbeid,
            antallFraBots: acc.antallFraBots + r.antallFraBots,
        }),
        initTotal
    );

export const hentRepoStatus = async () => {
    const repos = await hentRepos();

    const reposMedStatus = repos.map(tilRepoMedStatus);
    return {
        repos: reposMedStatus,
        total: beregnTotal(reposMedStatus),
    };
};

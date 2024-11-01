import { hentRepos, PullRequest, Repo } from '../common/octokit';
import { RepoStatus, Status } from './typer';

const initTotal: Status = {
    antallGodkjente: 0,
    antallVenter: 0,
    antallUnderArbeid: 0,
    antallDependabot: 0,
};

const erGodkjent = (pr: PullRequest) => pr.approved;
const harReviews = (pr: PullRequest) => pr.totalReviews > 0;
const harIkkeReviews = (pr: PullRequest) => !harReviews(pr);
const erIkkeGodkjent = (pr: PullRequest) => harReviews(pr) && !erGodkjent(pr);

const erDependabot = (pr: PullRequest) => pr.author === 'dependabot';

const tilRepoMedStatus = (repo: Repo): RepoStatus => {
    const { pullRequests } = repo;
    const ikkeDependabotPrs = pullRequests.filter((pr) => !erDependabot(pr));
    return {
        name: repo.name,
        pullsUrl: repo.url + '/pulls',
        prs: ikkeDependabotPrs,
        prsDependabot: pullRequests.filter(erDependabot),
        antallGodkjente: ikkeDependabotPrs.filter(erGodkjent).length,
        antallVenter: ikkeDependabotPrs.filter(harIkkeReviews).length,
        antallUnderArbeid: ikkeDependabotPrs.filter(erIkkeGodkjent).length,
        antallDependabot: pullRequests.filter((p) => erDependabot(p)).length,
    };
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

    const reposMedStatus = repos.map(tilRepoMedStatus);
    return {
        repos: reposMedStatus,
        total: beregnTotal(reposMedStatus),
    };
};

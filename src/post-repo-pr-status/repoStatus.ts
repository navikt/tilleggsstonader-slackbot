import { hentPrs, hentRepos, hentReviews, Pr, PrMedReviews, Repo } from '../common/octokit';
import { RepoStatus, Status } from './typer';

interface RepoMedPrReviews {
    repo: Repo;
    prs: PrMedReviews[];
}

const initTotal: Status = {
    antallGodkjente: 0,
    antallVenter: 0,
    antallUnderArbeid: 0,
    antallDependabot: 0,
};

const erGodkjent = (pr: PrMedReviews) => pr.reviews.some((r) => r.state === 'APPROVED');
const harReviews = (pr: PrMedReviews) => pr.reviews.length > 0;
const harIkkeReviews = (pr: PrMedReviews) => !harReviews(pr);
const erIkkeGodkjent = (pr: PrMedReviews) => harReviews(pr) && !erGodkjent(pr);

const erDependabot = (pr: Pr) => pr.user.login === 'dependabot[bot]';

const tilRepoMedStatus = (repoMedPrs: RepoMedPrReviews): RepoStatus => {
    const { repo, prs } = repoMedPrs;
    const ikkeDependabotPrs = prs.filter((p) => !erDependabot(p.pr));
    return {
        navn: repo.name,
        pullsUrl: repo.html_url + '/pulls',
        prs: ikkeDependabotPrs.map((pr) => ({
            tittel: pr.pr.title,
            url: pr.pr.html_url,
            erGodkjent: erGodkjent(pr),
        })),
        antallGodkjente: ikkeDependabotPrs.filter(erGodkjent).length,
        antallVenter: ikkeDependabotPrs.filter(harIkkeReviews).length,
        antallUnderArbeid: ikkeDependabotPrs.filter(erIkkeGodkjent).length,
        antallDependabot: prs.filter((p) => erDependabot(p.pr)).length,
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

const hentPrsMedReviews = async (repo: Repo): Promise<PrMedReviews[]> => {
    const repoPrs = await hentPrs(repo);
    return Promise.all(
        repoPrs.map(async (pr) => {
            const reviews = erDependabot(pr) ? [] : await hentReviews(repo.full_name, pr.number);
            return { pr, reviews };
        })
    );
};

export const hentPrsTilRepos = (repos: Repo[]): Promise<RepoMedPrReviews[]> =>
    Promise.all(
        repos.map(async (repo) => {
            const prs = await hentPrsMedReviews(repo);
            return { repo, prs };
        })
    );

export const hentRepoStatus = async () => {
    const repoMedStatus: RepoMedPrReviews[] = await hentRepos(
        'owner:navikt+topic:tilleggsstonader'
    ).then(hentPrsTilRepos);
    const repos: RepoStatus[] = repoMedStatus.map((repo) => tilRepoMedStatus(repo));

    return {
        repos: repos,
        total: beregnTotal(repos),
    };
};

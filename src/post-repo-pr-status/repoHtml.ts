import { hentRepoStatus } from './repoStatus';
import { RepoStatus } from './typer';
import { PullRequest } from '../common/octokit';

export const genererHtml = async (): Promise<String> => {
    const { repos } = await hentRepoStatus();
    const reposHtml = repos.sort(sorterPrs).map((repo) => repoHtml(repo));
    const dependabotPrs = repos.sort(sorterDependabotPrs).map((repo) => repoMedDependabotPrs(repo));
    return `<html lang="no">
                <body>
                    ${reposHtml.join('\n')}
                    <div style="font-size: 22px">Dependabot</div>
                    ${dependabotPrs.join('\n')}
                </body>
            </html>`;
};

const repoHtml = (repo: RepoStatus) => {
    const title = `<span style="font-size: ${headerSize(repo)}px"><a href="${repo.pullsUrl}">${
        repo.name
    }</a></span>`;
    const subtitle = `${
        repo.antallDependabot > 0
            ? '<span style="font-size: 12px"> (Dependabots:' + repo.antallDependabot + ')</span>'
            : ''
    }`;
    return `<div>${title}${subtitle}${listPrs(repo.prs)}</div>`;
};

const repoMedDependabotPrs = (repo: RepoStatus) => {
    if (repo.prsDependabot.length === 0) return null;
    const title = `<span><a href="${repo.pullsUrl}">${repo.name}</a></span>`;
    return `<div style="font-size: 14px">${title}${listPrs(repo.prsDependabot)}</div>`;
};

const headerSize = (repo: RepoStatus): number => {
    if (repo.prs.length > 0) {
        return 22;
    } else if (repo.antallDependabot > 0) {
        return 14;
    } else {
        return 12;
    }
};

const listPrs = (pullRequests: PullRequest[]) => {
    return `<ul>
        ${pullRequests
            .map((pr) => {
                const checkIcon = `${pr.approved ? '<span>&#9989;</span>' : ''}`;
                const prTitle = `<a href="${pr.url}">${pr.title}</a>`;
                return `<li>${prTitle} ${checkIcon} ${pr.author} (${antallDager(
                    pr
                )} dager siden)</li>`;
            })
            .join('\n')}
    </ul>`;
};

const DØGN_I_MS = 1000 * 3600 * 24;
const antallDager = (pr: PullRequest) =>
    Math.floor(
        (new Date().getTime() - new Date(pr.createdAt.substring(0, 10)).getTime()) / DØGN_I_MS
    );

const sorterPrs = (a: RepoStatus, b: RepoStatus) => {
    if (a.prs.length !== b.prs.length) {
        return b.prs.length - a.prs.length;
    } else {
        return a.name.localeCompare(b.name);
    }
};

const sorterDependabotPrs = (a: RepoStatus, b: RepoStatus) => {
    return a.name.localeCompare(b.name);
};

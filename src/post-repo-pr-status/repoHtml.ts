import { hentRepoStatus } from './repoStatus';
import { RepoStatus } from './typer';
import { PullRequest } from '../common/octokit';

export const genererHtml = async (): Promise<String> => {
    const { repos } = await hentRepoStatus();
    const reposHtml = repos.sort(sorterPrs).map((repo) => repoHtml(repo));
    const dependabotPrs = repos.sort(sorterDependabotPrs).map((repo) => repoMedDependabotPrs(repo));
    return `<html lang="no">
                <head>
                    <title>PR-status for Tilleggsstønader</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap" rel="stylesheet">
                    <style>
                        :root {
                            --bg-color: #ffffff;
                            --text-color: #000000;
                            --link-color: #0969da;
                            --link-hover-color: #0550ae;
                            --draft-bg: #6a737d;
                            --draft-text: white;
                            --toggle-bg: #e0e0e0;
                            --toggle-hover-bg: #d0d0d0;
                        }

                        body.dark-mode {
                            --bg-color: #0d1117;
                            --text-color: #e6edf3;
                            --link-color: #8ab4f8;
                            --link-hover-color: #adc6ff;
                            --draft-bg: #8b949e;
                            --draft-text: #0d1117;
                            --toggle-bg: #30363d;
                            --toggle-hover-bg: #484f58;
                        }

                        body {
                            font-family: 'Source Sans 3', sans-serif;
                            background-color: var(--bg-color);
                            color: var(--text-color);
                            transition: background-color 0.3s ease, color 0.3s ease;
                        }

                        a {
                            color: var(--link-color);
                            text-decoration: none;
                        }

                        a:hover {
                            color: var(--link-hover-color);
                            text-decoration: underline;
                        }

                        .theme-toggle {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background-color: var(--toggle-bg);
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: 'Source Sans 3', sans-serif;
                            font-size: 14px;
                            color: var(--text-color);
                            transition: background-color 0.2s ease;
                        }

                        .theme-toggle:hover {
                            background-color: var(--toggle-hover-bg);
                        }

                        .draft-badge {
                            background-color: var(--draft-bg);
                            color: var(--draft-text);
                        }
                    </style>
                </head>
                <body>
                    <button class="theme-toggle" onclick="toggleTheme()">🌓</button>
                    ${reposHtml.join('\n')}
                    <div style="font-size: 22px">Fra bots</div>
                    ${dependabotPrs.join('\n')}
                    <script>
                        // Last inn lagret tema ved sideinnlasting
                        (function() {
                            const savedTheme = localStorage.getItem('theme');
                            if (savedTheme === 'dark') {
                                document.body.classList.add('dark-mode');
                            }
                        })();

                        function toggleTheme() {
                            const body = document.body;
                            body.classList.toggle('dark-mode');
                            
                            // Lagre valget i localStorage
                            const isDark = body.classList.contains('dark-mode');
                            localStorage.setItem('theme', isDark ? 'dark' : 'light');
                        }
                    </script>
                </body>
            </html>`;
};

const repoHtml = (repo: RepoStatus) => {
    const title = `<span style="font-size: ${headerSize(repo)}px"><a href="${repo.pullsUrl}">${
        repo.name
    }</a></span>`;
    const subtitle = `${
        repo.antallFraBots > 0
            ? '<span style="font-size: 12px"> (Fra bots:' + repo.antallFraBots + ')</span>'
            : ''
    }`;
    return `<div>${title}${subtitle}${listPrs(repo.prs)}</div>`;
};

const repoMedDependabotPrs = (repo: RepoStatus) => {
    if (repo.prsFraBots.length === 0) return null;
    const title = `<span><a href="${repo.pullsUrl}">${repo.name}</a></span>`;
    return `<div style="font-size: 14px">${title}${listPrs(repo.prsFraBots)}</div>`;
};

const headerSize = (repo: RepoStatus): number => {
    if (repo.prs.length > 0) {
        return 22;
    } else if (repo.antallFraBots > 0) {
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
                const draftBadge = `${pr.isDraft ? `<span class="draft-badge" style="padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 4px;">DRAFT</span>` : ''}`;
                const prTitle = `<a href="${pr.url}">${pr.title}</a>`;
                return `<li>${draftBadge}${prTitle} ${checkIcon} ${pr.author} (${antallDager(
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

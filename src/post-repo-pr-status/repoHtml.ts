import { hentRepoStatus } from './repoStatus';
import { RepoStatus } from './typer';
import { PullRequest } from '../common/octokit';
import { hentPakkeVersjoner, PakkeVersjon } from '../pakke-versjoner/pakkeVersjoner';
import { copilotIcon } from '../assets/copilotIcon.js';

export const genererHtml = async (): Promise<String> => {
    const { repos } = await hentRepoStatus();
    const pakkeVersjoner = await hentPakkeVersjoner();
    const sortedRepos = repos.sort(sorterPrs);
    const reposWithPrs = sortedRepos.filter((r) => r.prs.length > 0);
    const reposWithBotPrs = sortedRepos.filter((r) => r.prsFraBots.length > 0);
    const reposUtenPrsHtml = reposUtenPrListe(
        sortedRepos.filter((r) => r.prs.length === 0 && r.prsFraBots.length === 0)
    );
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

                        body.dark-mode .copilot-icon {
                            filter: invert(1);
                        }

                        .draft-badge {
                            background-color: var(--draft-bg);
                            color: var(--draft-text);
                        }

                        table {
                            border-collapse: collapse;
                            margin: 6px 0 14px 0;
                            width: 100%;
                            max-width: 1250px;
                        }

                        td.pr-title, th.pr-title {
                            min-width: 300px;
                        }

                        th, td {
                            border-bottom: 1px solid rgba(127, 127, 127, 0.3);
                            color: var(--text-color);
                            font-size: 14px;
                            padding: 6px 8px;
                            text-align: left;
                            vertical-align: top;
                        }

                        th {
                            font-weight: 600;
                        }

                        tr:nth-child(even) {
                            background-color: rgba(127, 127, 127, 0.08);
                        }
                    </style>
                </head>
                <body>
                    <button class="theme-toggle" onclick="toggleTheme()">🌓</button>
                    ${allPrsTable(reposWithPrs)}
                    ${botPrsTable(reposWithBotPrs)}
                    ${reposUtenPrsHtml}
                    ${pakkeversjonHtml(pakkeVersjoner)}
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

const allPrsTable = (repos: RepoStatus[]): string => {
    if (repos.length === 0) return '';
    const allPrs = repos.flatMap((repo) => repo.prs.map((pr) => ({ pr, repo })));
    const rows = allPrs
        .sort((a, b) => antallDager(b.pr) - antallDager(a.pr))
        .map(({ pr, repo }) => prRow(pr, repo));
    return `<div style="font-size: 22px">Åpne PR-er</div>
    <table>
        <thead>
            <tr>
                <th>Repo</th>
                <th class="pr-title">PR</th>
                <th>Forfatter</th>
                <th>Alder</th>
                <th>Kommentarer</th>
                <th>Checks</th>
                <th>Godkjent?</th>
            </tr>
        </thead>
        <tbody>
            ${rows.join('\n')}
        </tbody>
    </table>`;
};

const botPrsTable = (repos: RepoStatus[]): string => {
    if (repos.length === 0) return '';
    const allPrs = repos.flatMap((repo) => repo.prsFraBots.map((pr) => ({ pr, repo })));
    const rows = allPrs
        .sort((a, b) => antallDager(b.pr) - antallDager(a.pr))
        .map(({ pr, repo }) => prRow(pr, repo));
    return `<div style="font-size: 22px; margin-top: 32px">Bot-PR-er</div>
    <table>
        <thead>
            <tr>
                <th>Repo</th>
                <th class="pr-title">PR</th>
                <th>Forfatter</th>
                <th>Alder</th>
                <th>Kommentarer</th>
                <th>Checks</th>
                <th>Godkjent?</th>
            </tr>
        </thead>
        <tbody>
            ${rows.join('\n')}
        </tbody>
    </table>`;
};

const prRow = (pr: PullRequest, repo: RepoStatus): string => {
    const repoLink = `<a href="${repo.pullsUrl}">${repo.name}</a>`;
    const draftBadge = pr.isDraft
        ? `<span class="draft-badge" style="padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 4px;">DRAFT</span>`
        : '';
    const prTitle = `<a href="${pr.url}">${pr.title}</a>`;
    const humanComments = pr.issueComments + pr.reviewComments;
    const copilotSuffix =
        pr.copilotComments > 0
            ? ` <span style="color: #8b949e;">(${pr.copilotComments} ${copilotIcon})</span>`
            : '';
    const comments =
        humanComments > 0 || pr.copilotComments > 0
            ? `<span>${humanComments > 0 ? `${humanComments} 💬 ` : ''}${copilotSuffix}</span>`
            : '';
    const reviewIcon = pr.approved ? '&#9989;' : '';
    return `<tr>
                        <td>${repoLink}</td>
                        <td class="pr-title">${draftBadge}${prTitle}</td>
                        <td>${pr.author}</td>
                        <td>${antallDager(pr)} d</td>
                        <td>${comments}</td>
                        <td>${checksIkon(pr.checksState)}</td>
                        <td>${reviewIcon}</td>
                    </tr>`;
};

const reposUtenPrListe = (repos: RepoStatus[]): string => {
    if (repos.length === 0) return '';
    const items = repos
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => `<li><a href="${r.pullsUrl}">${r.name}</a></li>`)
        .join('\n');
    return `<div style="margin-top: 16px"><div style="font-size: 22px;">Ingen åpne PRer</div><ul style="font-size: 14px; margin: 4px 0 0 0">${items}</ul></div>`;
};

const checksIkon = (checksState: string | null) => {
    switch (checksState) {
        case 'SUCCESS':
            return '&#9989;';
        case 'FAILURE':
        case 'ERROR':
            return '&#10060;';
        case 'PENDING':
        case 'EXPECTED':
            return '&#128993;';
        case null:
            return '&#9203;';
        default:
            return '&#9203;';
    }
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

const formaterDato = (isoDate: string): string => {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    return d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const pakkeversjonHtml = (pakker: PakkeVersjon[]): string => {
    const rader = pakker
        .map((p) => {
            const navnCelle = p.url
                ? `<a href="${p.url}">${p.navn}</a>`
                : p.navn;
            return `<tr>
                <td>${navnCelle}</td>
                <td>${p.versjon}</td>
                <td>${formaterDato(p.publisert)}</td>
                <td><pre style="margin:0; font-size:12px; white-space: pre-wrap">${p.beskrivelse}</pre></td>
            </tr>`;
        })
        .join('\n');
    return `<div style="font-size: 22px; margin-top: 32px">Siste pakkeversjoner</div>
    <table>
        <thead>
            <tr>
                <th>Pakke</th>
                <th>Versjon</th>
                <th>Publisert</th>
                <th>Endringer</th>
            </tr>
        </thead>
        <tbody>
            ${rader}
        </tbody>
    </table>`;
};

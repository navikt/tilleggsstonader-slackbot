import { Block, KnownBlock, WebAPICallResult } from '@slack/web-api';
import { hentRepoStatus } from './repoStatus';
import { RepoStatus, Status } from './typer';
import { slackClient } from '../common/slack';
import { PullRequest } from '../common/octokit';

const KANAL = 'tilleggsstønader-dev';

interface WebAPICallResultMedTs extends WebAPICallResult {
    ts: string;
}

const statusDetalj = (antall: number, tekst: string) => (antall > 0 ? `${tekst}: ${antall}` : null);
const statusTilTekst = (status: Status) =>
    (
        [
            statusDetalj(status.antallVenter, 'Mangler review'),
            statusDetalj(status.antallUnderArbeid, 'Under arbeid'),
            statusDetalj(status.antallGodkjente, 'Godkjente'),
            statusDetalj(status.antallDependabot, 'Dependabot'),
        ].filter((d) => d) as string[]
    ).join('\n');

const okEmoji = ':white_check_mark:';

// Prøver å sortere repos, med dependabot nederst
const mapStatusSortValue = (status: Status) => {
    if (status.antallGodkjente) {
        return 3;
    } else if (status.antallVenter || status.antallUnderArbeid) {
        return 2;
    } else if (status.antallDependabot) {
        return 1;
    } else {
        return 0;
    }
};

const sortByStatus = (first: Status, second: Status) =>
    mapStatusSortValue(second) - mapStatusSortValue(first);

const mapRepoStatus = (repo: RepoStatus) => {
    if (repo.antallVenter || repo.antallUnderArbeid) {
        return ':construction:';
    } else if (repo.antallDependabot) {
        return ':dependabot:';
    } else if (repo.antallGodkjente) {
        return ':checkered_flag:';
    } else {
        return ':question:';
    }
};

const mapPrStatus = (pr: PullRequest) => (pr.approved ? okEmoji : ':construction:');

const repoHarIngenPrsBlock = [
    {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `${okEmoji}`,
        },
    },
];
const dividerBlock = { type: 'divider' };
const lagSlackMelding = (repo: RepoStatus): (KnownBlock | Block)[] => {
    if (!repo.prs.length && repo.antallDependabot === 0) {
        return repoHarIngenPrsBlock;
    }
    const initBlock = {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*<${repo.pullsUrl}|${repo.name}>*\n${statusTilTekst(repo)}`,
        },
    };
    const prBlocks = repo.prs
        .map((pr) => [
            dividerBlock,
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${mapPrStatus(pr)} *<${pr.url}|${pr.title}>*`,
                },
            },
        ])
        .flat();
    return [dividerBlock, initBlock, ...prBlocks];
};

export const postRepoStatusTilSlack = async () => {
    const { total, repos } = await hentRepoStatus();

    const hovedpost = (await slackClient.chat.postMessage({
        channel: KANAL,
        icon_emoji: ':github:',
        username: 'PR status',
        text: statusTilTekst(total),
    })) as WebAPICallResultMedTs;

    console.log(`Laget tråd ${hovedpost.ts}`);

    for (const repo of repos.sort(sortByStatus)) {
        const statusEmoji = mapRepoStatus(repo);

        await slackClient.chat.postMessage({
            channel: KANAL,
            blocks: lagSlackMelding(repo),
            icon_emoji: statusEmoji,
            username: repo.name,
            thread_ts: hovedpost.ts,
            text: 'dummy-text',
        });
    }
};

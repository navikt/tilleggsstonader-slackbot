import { graphql } from '@octokit/graphql';

const dotenv = require('dotenv');
dotenv.config();

const headers = {
    Authorization: `Bearer ${process.env['GITHUB_TOKEN']}`,
};

interface LatestReleaseResponse {
    kontrakter: { latestRelease: ReleaseNode | null };
    libs: { latestRelease: ReleaseNode | null };
}

interface ReleaseNode {
    tagName: string;
    body: string;
    publishedAt: string;
    url: string;
}

export interface PakkeVersjon {
    navn: string;
    versjon: string;
    beskrivelse: string;
    publisert: string;
    url: string;
}

const query = /* GraphQL */ `
query {
    kontrakter: repository(owner: "navikt", name: "tilleggsstonader-kontrakter") {
        latestRelease {
            tagName
            body: description
            publishedAt
            url
        }
    }
    libs: repository(owner: "navikt", name: "tilleggsstonader-libs") {
        latestRelease {
            tagName
            body: description
            publishedAt
            url
        }
    }
}
`;

const tilPakkeVersjon = (navn: string, release: ReleaseNode | null): PakkeVersjon => {
    if (!release) {
        return { navn, versjon: '—', beskrivelse: 'Ingen release funnet', publisert: '', url: '' };
    }
    return {
        navn,
        versjon: release.tagName,
        beskrivelse: release.body ?? '',
        publisert: release.publishedAt,
        url: release.url,
    };
};

export const hentPakkeVersjoner = async (): Promise<PakkeVersjon[]> => {
    try {
        const data = (await graphql(query, { headers })) as LatestReleaseResponse;
        return [
            tilPakkeVersjon('tilleggsstonader-kontrakter', data.kontrakter.latestRelease),
            tilPakkeVersjon('tilleggsstonader-libs', data.libs.latestRelease),
        ];
    } catch (err) {
        console.error('Feil ved henting av pakkeversjon:', err);
        return [
            { navn: 'tilleggsstonader-kontrakter', versjon: '—', beskrivelse: 'Feil ved henting', publisert: '', url: '' },
            { navn: 'tilleggsstonader-libs', versjon: '—', beskrivelse: 'Feil ved henting', publisert: '', url: '' },
        ];
    }
};

import { PullRequest } from '../common/octokit';

export interface Status {
    antallGodkjente: number;
    antallVenter: number;
    antallUnderArbeid: number;
    antallFraBots: number;
}

/**
 * @param prs populeres ikke med dependabotprs
 */
export type RepoStatus = {
    name: string;
    pullsUrl: string;
    prs: PullRequest[];
    prsFraBots: PullRequest[];
} & Status;

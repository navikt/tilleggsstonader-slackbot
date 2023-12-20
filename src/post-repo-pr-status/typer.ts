export interface Status {
    antallGodkjente: number;
    antallVenter: number;
    antallUnderArbeid: number;
    antallDependabot: number;
}

export interface PrStatus {
    tittel: string;
    url: string;
    erGodkjent: boolean;
}

/**
 * @param prs populeres ikke med dependabotprs
 */
export type RepoStatus = {
    navn: string;
    pullsUrl: string;
    prs: PrStatus[];
} & Status;

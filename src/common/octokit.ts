import { graphql } from '@octokit/graphql';

const dotenv = require('dotenv');
dotenv.config();

if (!process.env['GITHUB_TOKEN']) {
    throw Error('Missing env GITHUB_TOKEN');
}

export const headers = {
    Authorization: `Bearer ${process.env['GITHUB_TOKEN']}`,
};

interface GraphqlReponse {
    search: {
        repos: {
            repo: {
                name: string;
                url: string;
                pullRequests: {
                    nodes: {
                        title: string;
                        url: string;
                        author: {
                            login: string;
                        };
                        createdAt: string;
                        reviewDecision: string;
                        reviews: {
                            totalCount: number;
                        };
                    }[];
                };
            };
        }[];
    };
}

export interface PullRequest {
    title: string;
    url: string;
    author: string;
    createdAt: string;
    totalReviews: number;
    approved: boolean;
}

export interface Repo {
    name: string;
    url: string;
    pullRequests: PullRequest[];
}

const query = /* GraphQl */ `
query {
search(type: REPOSITORY, query: "owner:navikt topic:tilleggsstonader", first: 50) {
    repos: edges {
        repo: node {
            ... on Repository {
                name
                url
                pullRequests(first: 50, states: OPEN) {
                    nodes {
                        title
                        url
                        author {
                            login
                        }
                        reviewDecision
                        createdAt
                        reviews(first: 0) {
                            totalCount
                        }
                    }
                }
            }
        }
    }
}
}
`;

export const hentRepos = async (): Promise<Repo[]> => {
    const { search } = (await graphql(query, { headers })) as GraphqlReponse;
    return search.repos.map((repo) => ({
        name: repo.repo.name,
        url: repo.repo.url,
        pullRequests: repo.repo.pullRequests.nodes.map((pr) => ({
            title: pr.title,
            url: pr.url,
            author: pr.author.login,
            createdAt: pr.createdAt,
            totalReviews: pr.reviews.totalCount,
            approved: pr.reviewDecision === 'APPROVED',
        })),
    }));
};

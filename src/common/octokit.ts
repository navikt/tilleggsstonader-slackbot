import { graphql } from '@octokit/graphql';

const dotenv = require('dotenv');
dotenv.config();

if (!process.env['GITHUB_TOKEN']) {
    throw Error('Missing env GITHUB_TOKEN');
}

const headers = {
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
                        isDraft: boolean;
                        comments: {
                            nodes: {
                                author: {
                                    login: string;
                                } | null;
                            }[];
                        };
                        reviewThreads: {
                            nodes: {
                                comments: {
                                    nodes: {
                                        author: {
                                            login: string;
                                        } | null;
                                    }[];
                                };
                            }[];
                        };
                        reviews: {
                            totalCount: number;
                        };
                        commits: {
                            nodes: {
                                commit: {
                                    statusCheckRollup: {
                                        state: string;
                                    } | null;
                                };
                            }[];
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
    issueComments: number;
    reviewComments: number;
    copilotComments: number;
    approved: boolean;
    isDraft: boolean;
    checksState: string | null;
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
                        isDraft
                        comments(first: 25) {
                            nodes {
                                author {
                                    login
                                }
                            }
                        }
                        reviewThreads(first: 25) {
                            nodes {
                                comments(first: 1) {
                                    nodes {
                                        author {
                                            login
                                        }
                                    }
                                }
                            }
                        }
                        reviews(first: 0) {
                            totalCount
                        }
                        commits(last: 1) {
                            nodes {
                                commit {
                                    statusCheckRollup {
                                        state
                                    }
                                }
                            }
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
        pullRequests: repo.repo.pullRequests.nodes.map((pr) => {
            const isCopilot = (login: string | undefined) =>
                (login ?? '').toLowerCase().includes('copilot');

            const issueCommentLogins = pr.comments.nodes.map((c) => c.author?.login);
            const reviewThreadLogins = pr.reviewThreads.nodes.map(
                (t) => t.comments.nodes[0]?.author?.login
            );
            const allLogins = [...issueCommentLogins, ...reviewThreadLogins];

            return {
                title: pr.title,
                url: pr.url,
                author: pr.author.login,
                createdAt: pr.createdAt,
                totalReviews: pr.reviews.totalCount,
                issueComments: issueCommentLogins.filter((l) => !isCopilot(l)).length,
                reviewComments: reviewThreadLogins.filter((l) => !isCopilot(l)).length,
                copilotComments: allLogins.filter(isCopilot).length,
                approved: pr.reviewDecision === 'APPROVED',
                isDraft: pr.isDraft,
                checksState: pr.commits.nodes[0]?.commit.statusCheckRollup?.state ?? null,
            };
        }),
    }));
};

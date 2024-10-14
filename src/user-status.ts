import { graphql } from '@octokit/graphql';
import { headers } from './common/octokit';

const login = 'eirarset';
const authorId = 'MDQ6VXNlcjIxMjIwNDY3';

const query = /* GraphQl */ `
query {
user(login: "${login}") {
    repositoriesContributedTo(first: 100, contributionTypes: [COMMIT]) {
      nodes {
        name
        owner {
          login
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history(author: { id: "${authorId}" }) {
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

interface Commits {
    user: {
        repositoriesContributedTo: {
            nodes: {
                name: string;
                owner: { login: string };
                defaultBranchRef: {
                    target: {
                        history: { totalCount: number };
                    };
                };
            }[];
        };
    };
}

const commitsQuery = (owner: string, repo: string, cursor: any) => {
    return `
 {
    repository(owner: "${owner}", name: "${repo}") {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100, after: ${cursor ? `"${cursor}"` : null}) {  # Change this to adjust the number of commits fetched
                nodes {
                  committedDate
                  author {
                    user{login}
                  }
                  additions
                  deletions
                  changedFiles
                  parents {
                    totalCount  # Number of parent commits
                 }
                }
                pageInfo {
                hasNextPage
                endCursor  # Cursor for the next page of results
              }
              }
            }
          }
        }
  }
 }
 `;
};

interface CommitInfo {
    committedDate: string;
    author: { user: { login: string } };
    additions: number;
    deletions: number;
    changedFiles: number;
    parents: {
        totalCount: number;
    };
}

interface CommitsInfo {
    repository: {
        defaultBranchRef: {
            target: {
                history: {
                    nodes: CommitInfo[];
                    pageInfo: {
                        hasNextPage: boolean;
                        endCursor: number;
                    };
                };
            };
        };
    };
}

async function fetchAllCommits(owner: string, repo: string) {
    let allCommits: CommitInfo[] = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
        const { repository } = (await graphql(commitsQuery(owner, repo, cursor), {
            headers,
        })) as CommitsInfo;

        const commits = repository.defaultBranchRef.target.history;

        allCommits = allCommits.concat(
            commits.nodes
                .filter((pr) => pr.author.user?.login === login)
                .filter((pr) => pr.parents.totalCount < 2)
        );

        hasNextPage = commits.pageInfo.hasNextPage;
        cursor = commits.pageInfo.endCursor;
    }

    return allCommits;
}

function handle(prs: CommitInfo[]): { additions: number; deletions: number; createdAt: Date[] } {
    const additions = prs.reduce((acc, curr) => acc + curr.additions, 0);
    const deletions = prs.reduce((acc, curr) => acc + curr.deletions, 0);
    console.log(` Additions: ${additions}`);
    console.log(` Deletions: ${deletions}`);
    return {
        additions: additions,
        deletions: deletions,
        createdAt: prs.map((pr) => new Date(pr.committedDate)),
    };
}

const analyzeDays = (dates: Date[]) => {
    const dayOfWeekCount: { [key in number]: number } = {};
    const hourOfDayCount: { [key in number]: number } = {};

    for (const date of dates) {
        const dayOfWeek = date.getDay();
        const hourOfDay = date.getHours();
        dayOfWeekCount[dayOfWeek] = (dayOfWeekCount[dayOfWeek] || 0) + 1;
        hourOfDayCount[hourOfDay] = (hourOfDayCount[hourOfDay] || 0) + 1;
    }

    const dager = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    const readableDayOfWeekCount = Object.entries(dayOfWeekCount).reduce(
        (acc, entry) => {
            // @ts-ignore
            const entryElement = entry[0] as number;
            acc[dager[entryElement]] = entry[1];
            return acc;
        },
        {} as { [key in string]: number }
    );

    console.log('Antall per dag i uka:');
    ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'].forEach((dag) => {
        console.log(` ${dag}: ${readableDayOfWeekCount[dag] ?? 0}`);
    });

    console.log('Antall per time på dagen:');
    for (let a = 0; a < 24; a++) {
        const antall = hourOfDayCount[`${a}`] ?? 0;
        console.log(` ${a}: ${antall}`);
    }
};

async function hentRepositories() {
    const { user } = (await graphql(query, { headers })) as Commits;
    return user.repositoriesContributedTo.nodes
        .filter((node) => node.owner.login === 'navikt')
        .sort(
            (a, b) =>
                a.defaultBranchRef.target.history.totalCount -
                b.defaultBranchRef.target.history.totalCount
        );
}

export const analyze = async () => {
    const repositories = await hentRepositories();
    let additions = 0;
    let deletions = 0;
    let createdAt: Date[] = [];

    for (const node of repositories) {
        console.log(`${node.name}: ${node.defaultBranchRef.target.history.totalCount}`);
        if (node.name.indexOf('tilleggsstonader') > -1 || node.name.indexOf('familie') > -1) {
            const commits = await fetchAllCommits(node.owner.login, node.name);
            const res = handle(commits);
            additions += res.additions;
            deletions += res.deletions;
            createdAt.push(...res.createdAt);
        }
    }

    const totalCount = repositories.reduce(
        (acc, curr) => acc + curr.defaultBranchRef.target.history.totalCount,
        0
    );
    console.log('...');
    console.log(`TotalCount: ${totalCount}`);
    console.log(`Total additions: ${additions}`);
    console.log(`Total deletions: ${deletions}`);

    analyzeDays(createdAt);
};

analyze();

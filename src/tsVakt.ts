import { slackClient } from './common/slack';

const vakt = [
    'U015NN0KN79',
    'U8QJ01P7C',
    'U8PC8ALE4',
    'U02BG835PU5',
    'U01BH55AZSR',
    'U012ZRS991A',
    'U012ZRS991A',
];

/**
 * Setter usergroup til vakt for gitt dag.
 * På mandag settes indeks 0
 */
export const settVaktForDagen = () => {
    const day = new Date().getDay(); // søndag = 0
    const vaktIndeks = day === 0 ? 6 : day - 1;

    slackClient.usergroups.users.update({
        usergroup: 'S078P8P6EUU',
        users: vakt[vaktIndeks],
    });
};

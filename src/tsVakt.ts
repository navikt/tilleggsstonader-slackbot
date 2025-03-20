import { slackClient } from './common/slack';

const vakt = [
    'U02BG835PU5',
    'U07H14VA9MK',
    'U012ZRS991A',
    'U015NN0KN79',
    'U0261H41RPA',
    'U0261H41RPA',
    'U0261H41RPA',
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

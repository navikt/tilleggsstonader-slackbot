import * as express from 'express';
import cron from 'node-cron';
import { slackClient } from './common/slack';
import * as bodyParser from 'body-parser';
import { params } from './constants';
import { genererHtml } from './post-repo-pr-status/repoHtml';
import { settVaktForDagen } from './tsVakt';

const sendSpørsmålOmKontordag = (kanal: string, kanalId: string) => {
    slackClient.chat
        .postMessage({
            channel: kanal,
            text: `Hvor jobber du fra i morgen?`,
            icon_emoji: params.office,
        })
        .then((response) => {
            if (response.ts !== undefined) {
                slackClient.reactions.add({
                    channel: kanalId,
                    name: 'teamsonen',
                    timestamp: response.ts,
                });
                slackClient.reactions.add({
                    channel: kanalId,
                    name: 'annet-sted',
                    timestamp: response.ts,
                });
                slackClient.reactions.add({
                    channel: kanalId,
                    name: 'fya1',
                    timestamp: response.ts,
                });
                slackClient.reactions.add({
                    channel: kanalId,
                    name: 'away',
                    timestamp: response.ts,
                });
            }
            return response;
        });
};

cron.schedule('0 12 * * 0-4', () => {
    console.log('Sender spørsmål om kontordag');
    sendSpørsmålOmKontordag('team_tilleggsstønader', 'C049HPU424F');
});

cron.schedule('0 6 * * *', () => {
    console.log('Setter vakt');
    settVaktForDagen();
});

const PORT = process.env.PORT || 3001;
const app = express();

app.get('/isAlive', (req, res) => {
    res.status(200).send();
});

app.use(bodyParser.json({ limit: '20mb' }));

app.get('/kontordag', (_, res) => {
    sendSpørsmålOmKontordag('team_tilleggsstønader', 'C049HPU424F');
    res.status(200).send();
});

app.get('/repos', async (_, res) => {
    const html = await genererHtml();
    res.status(200).send(html);
});

app.get('/vakt', async (_, res) => {
    settVaktForDagen();
    res.status(200).send();
});

app.listen(PORT, () => {
    console.log(`Chatbot lytter på port ${PORT}`);
});

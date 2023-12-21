import * as express from 'express';
import cron from 'node-cron';
import { slackClient } from './common/slack';
import * as bodyParser from 'body-parser';
import { params } from './constants';

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

cron.schedule('0 13 * * 0-4', () => {
    console.log('Sender spørsmål om kontordag');
    sendSpørsmålOmKontordag('team_tilleggsstønader', 'C049HPU424F');
});

const PORT = process.env.PORT || 3000;
const app = express();

app.get('/isAlive', (req, res) => {
    res.status(200).send();
});

app.use(bodyParser.json({ limit: '20mb' }));

app.get('/kontordag', (_, res) => {
    sendSpørsmålOmKontordag('team_tilleggsstønader', 'C049HPU424F');
    res.status(200).send();
});

app.listen(PORT, () => {
    console.log(`Chatbot lytter på port ${PORT}`);
});

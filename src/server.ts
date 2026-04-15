import express, { Request, Response } from 'express';
import cron from 'node-cron';
import { slackClient } from './common/slack';
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

const PORT = process.env.PORT || 3000;
const app = express();

app.get('/isAlive', (_req: Request, res: Response): void => {
    res.status(200).send();
});

app.use(express.json({ limit: '20mb' }));

app.get('/kontordag', (_req: Request, res: Response): void => {
    sendSpørsmålOmKontordag('team_tilleggsstønader', 'C049HPU424F');
    res.status(200).send();
});

app.get('/repos', async (_req: Request, res: Response): Promise<void> => {
    const html = await genererHtml();
    res.status(200).send(html);
});

app.get('/vakt', async (_req: Request, res: Response): Promise<void> => {
    settVaktForDagen();
    res.status(200).send();
});

app.listen(PORT, () => {
    console.log(`Chatbot lytter på port ${PORT}`);
});

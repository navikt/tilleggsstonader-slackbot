const {WebClient} = require('@slack/web-api');
const dotenv = require('dotenv');
const cron = require('node-cron');
const express = require('express');
const bodyParser = require('body-parser');

const {params} = require('./constants');

dotenv.config();

const token = process.env.BOT_TOKEN;

// Initialize
const web = new WebClient(token);

const sendSpørsmålOmKontordag = (kanal, kanalId) => {
    web.chat
        .postMessage({
            channel: kanal,
            text: `Hvor jobber du fra i morgen?`,
            icon_emoji: params.office,
        })
        .then((response) => {
            if (response.ts !== undefined) {
                web.reactions.add({
                    channel: kanalId,
                    name: 'teamsonen',
                    timestamp: response.ts,
                });
                web.reactions.add({
                    channel: kanalId,
                    name: 'annet-sted',
                    timestamp: response.ts,
                });
                web.reactions.add({
                    channel: kanalId,
                    name: 'fya1',
                    timestamp: response.ts,
                });
                web.reactions.add({
                    channel: kanalId,
                    name: 'away',
                    timestamp: response.ts,
                });
            }
            return response
        })
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

app.use(bodyParser.json({limit: '20mb'}));


app.get('/kontordag', (req, res) => {
    sendSpørsmålOmKontordag('team_tilleggsstønader', 'C049HPU424F')
    res.status(200).send();
});

app.listen(PORT, () => {
    console.log(`Chatbot lytter på port ${PORT}`);
});

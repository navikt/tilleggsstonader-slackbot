import { WebClient } from '@slack/web-api';

const token = process.env.BOT_TOKEN;
if (!token) {
    throw Error('Missing env BOT_TOKEN');
}

export const slackClient = new WebClient(token);

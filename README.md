# tilleggsstonader-slackbot
Slackbot for Team tilleggsstønader


### cron-repo-pr-status
Cronjob som poster til slack om pr-status for våre repos
Henter repositories som er tagget med tilleggsstonader

Trenger en `.env` fil med
* `GITHUB_TOKEN=<PAT-token med tilgang til public repos>`
* `BOT_TOKEN=<slack token under OAuth & Permissions på slack config for bot>`
* Kjør `yarn repo-prs-status`
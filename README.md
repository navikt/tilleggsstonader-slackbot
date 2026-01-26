# tilleggsstonader-slackbot
Slackbot og side med oversikt over PR-er for Team tilleggsstønader

Start applikasjonen med
`yarn build && yarn start:dev`

### cron-repo-pr-status
Cronjob som poster til slack om pr-status for våre repos
Henter repositories som er tagget med tilleggsstonader

Trenger en `.env` fil med
* `GITHUB_TOKEN=<PAT-token med tilgang til public repos>`
* `BOT_TOKEN=<slack token under OAuth & Permissions på slack config for bot>`

### Info over pull requests for repos
  * Gå til `http://localhost:3000/repos`

## Kode generert av GitHub Copilot
Dette repoet bruker GitHub Copilot til å generere kode.
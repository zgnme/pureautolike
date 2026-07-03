# Telegram Feedback Notifications

PureAutoLike can send GitHub feedback events to Telegram through GitHub Actions.
No third-party GitHub Action is used; the workflow calls Telegram Bot API
directly.

## What Triggers A Telegram Message

The workflow `.github/workflows/telegram-feedback.yml` listens for:

- new or reopened GitHub issues;
- new issue comments;
- new or answered GitHub Discussions, if Discussions are enabled later;
- new Discussion comments;
- manual `workflow_dispatch` tests.

## Required GitHub Secrets

Add these repository secrets in GitHub:

- `TELEGRAM_BOT_TOKEN`: Telegram bot token from BotFather.
- `TELEGRAM_CHAT_ID`: personal chat id, group id, or channel id where feedback
  should be sent.
- `TELEGRAM_THREAD_ID`: optional topic id for Telegram forum groups.

GitHub UI path:

`Repository -> Settings -> Secrets and variables -> Actions -> New repository secret`

GitHub CLI alternative:

```bash
gh secret set TELEGRAM_BOT_TOKEN --repo zgnme/pureautolike --body '<bot token>'
gh secret set TELEGRAM_CHAT_ID --repo zgnme/pureautolike --body '<chat id>'
gh secret set TELEGRAM_THREAD_ID --repo zgnme/pureautolike --body '<thread id>'
```

Skip `TELEGRAM_THREAD_ID` if messages go to a normal personal chat or group.

## Getting The Chat ID

1. Create a bot with Telegram BotFather and copy the token.
2. Open a chat with the bot and send any message, for example `/start`.
3. Open:
   `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Find `message.chat.id` in the JSON response.

For groups, add the bot to the group first, send a message in the group, then
call `getUpdates`. Group chat ids are usually negative numbers.

## Test

After secrets are configured, run the workflow manually:

```bash
gh workflow run telegram-feedback.yml \
  --repo zgnme/pureautolike \
  -f message='PureAutoLike Telegram feedback test'
```

Or use GitHub UI:

`Repository -> Actions -> Telegram feedback notifications -> Run workflow`

## Built-In GitHub Notifications

GitHub also has built-in notifications without Telegram:

- watch the repository with `Watch -> All Activity`;
- enable email notifications in GitHub account notification settings;
- install GitHub Mobile and enable push notifications.

Telegram is still useful because it keeps feedback next to the existing
PureAutoLike operational alerts.

# Features:

- <details>
    <summary>
      Inline search - search manga in any chat.
    </summary>
    <img src="https://i.postimg.cc/N0pMD78j/image.png" alt="Search">
  </details>
- <details>
    <summary>
      Favorites - like the manga so you can easily open or share it.
    </summary>
    <img src="https://i.postimg.cc/Hk0ZyCCj/Screenshot-from-2020-11-22-21-05-13.png" alt="Favorites">
  </details>
- <details>
    <summary>
      Read manga directly in the telegram app, no need to open a browser.
    </summary>
    <img src="https://i.postimg.cc/G36TNCVw/image.png" alt="Instant preview">
  </details>
- Discover new doujins with /rand command.
- Open doujins using code or link, send multiple codes in one message.
- <details>
    <summary>
      Database - Bot works even if nhentai is down (more than 500k doujins are saved).
    </summary>
    <img src="https://i.imgur.com/eh69bTA.png" alt="Database screnshot">
  </details>
- <details>
    <summary>
      Translated into Russian and Spanish
    </summary>https://i.imgur.com/eh69bTA.png
    <img src="https://i.postimg.cc/7Zs7Y2hd/image.png" alt="Language selection">
  </details>

## One-Click Deploy Button
### Pre-reqs for deploying this project to replit.com:

- Create [Replit](https://replit.com/signup) account (free)
- Configure a writable path for the SQLite database file (default: `./data/bot.sqlite`)
- Get bot token from [@BotFather](https://t.me/BotFather)

## Local development (Bun)

```bash
bun install
bun run preview
```

## Proxy Support (Optional)

All manga sources support optional proxy via [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr) to bypass Cloudflare protection.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SOURCE_FLARESOLVERR_URL` | FlareSolverr endpoint (e.g., `http://127.0.0.1:8191`). Falls back to `FLARESOLVERR_URL`. |
| `SOURCE_PROXY_URL` | Optional upstream proxy for FlareSolverr (e.g., `http://127.0.0.1:8888`). |
| `SOURCE_MAX_TIMEOUT_MS` | Max timeout for FlareSolverr requests (default: `60000`). |

### Running with FlareSolverr

```bash
# Start FlareSolverr (Docker)
docker run -d --name flaresolverr -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest

# Run the bot with proxy enabled
SOURCE_FLARESOLVERR_URL=http://127.0.0.1:8191 bun run preview
```

Without these variables set, sources make direct HTTP requests (no proxy).

On replit.com you may need to run `npm install node && npm install && npm run build` before starting for the first time

[![Run on replit.com](https://replit.com/badge/github/sleroq/nhentai-telegram-bot)](https://replit.com/github/sleroq/nhentai-telegram-bot)

## Development progress:

- [ ] User-related features
	- [ ] ability to set filter and random only in specific tags
	- [ ] ability to exclude tags from random
	- [ ] button to delete all user data in settings
	- [ ] button to clear history in settings
	- [ ] redesign settings
	- [x] add answerCallbackQuery() to prevent infinite loading on buttons
- [ ] instance features
    - [ ] support for readonly connection with database
    - [x] ability to connect to multiple databases
    - [x] generate webhook urls automatically from built in env variables on [perl.it](http://perl.it)
- [ ] Tanslations
	- [x] Finish translations in the search
	- [ ] Indonesian
	- [ ] German
- [ ] add actual logging
- [x] proxy support via FlareSolverr for all sources
- [ ] switch from [telegraf](https://github.com/telegraf/telegraf) to [grammy](https://grammy.dev/)
- [x] typescript!
    - [x] inline search
    - [x] random
    - [x] text handler (by code)
    - [x] likes
    - [x] help & settings
    - [x] "fix" button
    - [x] /zip command
- [ ] find alternative for [telegra.ph](http://telegra.ph) and implement as a fallback (for hosting images)
- [ ] create new website with fancy stats

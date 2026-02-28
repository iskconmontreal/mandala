# Mandala

Frontend for ISKCON Montreal temple management — donations, expenses, members, tax receipts. Talks to [Goloka](https://github.com/iskconmontreal/goloka) backend.

## Stack

Jekyll 4.3 static site, [Sprae](https://github.com/dy/sprae) reactivity, vanilla ES modules. No bundler, no build step.

## Setup

Prerequisites: Ruby, Bundler, Node.js.

```sh
bundle install
npm install
```

Generate self-signed SSL cert for local HTTPS (required for tests):

```sh
mkdir -p .ssl
openssl req -x509 -newkey rsa:2048 -keyout .ssl/key.pem -out .ssl/cert.pem -days 365 -nodes -subj '/CN=localhost'
```

## Dev server

```sh
npm start          # https://localhost:4000 (HTTPS, required for tests)
npm run start:http # http://localhost:4000  (HTTP, live reload)
```

## Local backend

Point to a local Goloka instance via browser console:

```js
localStorage.setItem('mandala_api', 'http://localhost:8080')
```

Revert to production:

```js
localStorage.removeItem('mandala_api')
```

## Tests

Playwright, Chromium. Requires HTTPS dev server running.

```sh
npm test       # headless
npm run test:ui # interactive UI
```

<p align=center><a href="https://github.com/krishnized/license/">ॐ</a></p>

# Faith Toluwanimi — Portfolio

A personal portfolio for Faith Toluwanimi, focused on full-stack engineering, backend development and mobile app development.

## Stack

- Node.js and Express 5
- EJS templates
- HTML, CSS and vanilla JavaScript
- MongoDB / SQL / Firebase project experience

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add the environment values you use.
4. Start the app: `npm start`
5. Open `http://localhost:3000`

The portfolio homepage is rendered from `views/index.ejs`. Static assets live in `public/`, and the complete project catalogue is loaded from `GET /api/projects`. Visitors can search and filter projects by category. The floating AI assistant uses `POST /api/chat` and answers from the public profile, project catalogue, case studies and mobile-project data. Configure `GEMINI_API_KEY` in the deployment environment to enable AI replies; without it, the assistant displays a clear setup message.

## Environment variables

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO` — contact form email delivery.
- `GEMINI_API_KEY` — enables the portfolio AI assistant (Gemini).

Never commit real credentials or API keys.


## Portfolio sections

- `/` — personal introduction, complete searchable project catalogue and AI portfolio assistant
- `/work/:slug` — project case studies
- `/mobile` — Flutter and Dart projects, with honest progress labels
- `/journal` — engineering notes
- `/journal/:slug` — individual journal articles

## Quality checks

Run `npm test` to execute the Node.js route and API smoke tests. Run `npm install` after pulling changes so the EJS dependency is reflected in your local lockfile, then run `npm test` and `npm start`.

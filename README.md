# Orbit — Recovery Companion

A full-stack web application that helps users track progress in overcoming addictive behaviors — with a gentle onboarding flow, daily check-ins, streak tracking with gamification (orbs), community support, educational lessons, coach messaging, and private UrgeWatch self-awareness tools.

> Built as a hackathon project.

## ✨ Features

- **Onboarding flow** — personalized setup (habit, triggers, goals)
- **Daily check-ins** — mood, urge levels, triggers, wins, relapse tracking
- **Streaks & gamification** — current/longest streaks, earnable orbs
- **Community** — anonymous posts with tags, likes, threaded replies
- **Lessons** — educational content on recovery
- **Coach messaging** — supportive conversational guidance
- **UrgeWatch** — optional camera-based pulse estimate, sleep and motion context, timestamped urge/calm labels, personal baseline patterns, guided pause tools, and CSV export

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Wouter, TanStack Query, Tailwind CSS v4, shadcn/ui, Framer Motion |
| Backend | Node.js, Express 5, TypeScript (ESM), REST API |
| Database | PostgreSQL via Drizzle ORM, Zod validation |
| Build | Vite |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development (client + server)
npm run dev
```

The app runs on `http://localhost:5000` in development.
The current server uses in-memory storage, so no database is needed to run it. Data resets whenever the server restarts. `npm run db:push` is only for setting up the PostgreSQL schema and requires a `DATABASE_URL`; it does not switch the app to persistent storage.

### Testing UrgeWatch on a phone

1. Start the app with `npm run dev` and open the workspace's HTTPS web preview on your phone. Camera and motion access require a secure HTTPS page; `localhost` is suitable only for testing on the same device.
2. Open **Urges** from the bottom navigation. Enter last night's sleep, then start the 45-second check-in and allow camera and motion access when asked.
3. Cover the rear camera and flash with a fingertip and hold still. The browser processes the frames locally; it saves the comparison if either method returns an estimate and asks you to retry if both fail.
4. The same capture runs Orbit's red-channel estimator and a browser port of PPGbetter's luminance-peak method. To compare accuracy, enter a pulse value from a separate monitor measured at the same time; agreement between the two camera estimates alone does not establish accuracy.
5. Add an urge or calm label to connect the moment to the latest Orbit reading. Use **Export CSV** to save readings and comparisons, or **Delete my data** to remove UrgeWatch records from that browser.

UrgeWatch stores readings, estimator comparisons, optional reference values, labels, and the optional support-person number in this browser's local storage. Camera frames are processed in memory and are not saved or uploaded. Clearing browser/site data removes the records. The pulse/HRV estimates are not medically validated and must not be used for diagnosis or treatment. Personal baseline rules need at least three readings; the experimental browser-based pattern model needs at least 30 labeled readings with both urge and calm examples.

## 📁 Project Structure

```
├── client/        # React frontend (pages, components, hooks)
├── server/        # Express API (routes, storage, auth)
├── shared/        # Shared Drizzle schema + types
├── script/        # Build scripts
└── drizzle.config.ts
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server + client |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run check` | TypeScript type-check |
| `npm run db:push` | Push Drizzle schema to database |

## 📄 License

MIT — see [LICENSE](LICENSE).

The PPGbetter-derived comparison method has a separate attribution and license note in [PPGbetter-NOTICE.md](client/src/lib/PPGbetter-NOTICE.md).

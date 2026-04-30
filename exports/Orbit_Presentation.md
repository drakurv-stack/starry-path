# Orbit — Recovery Companion

A calm, gentle web app that helps people overcome addictive behaviors and build healthier habits. Designed with a soft, space-themed look so the experience feels supportive rather than clinical.

---

## The Idea

Recovery is hard, and most existing apps feel cold or judgmental. Orbit is built around three quiet beliefs:

1. **Small wins matter.** Every check-in, every focused minute, every honest moment counts.
2. **Relapse is not failure.** The app never shames the user — it helps them get back up.
3. **You are not alone.** Anonymous community support is one tap away.

---

## What's Inside the App

### 1. Gentle Onboarding
A four-step welcome that introduces the user to the app's tone. Soft animations, a calming color palette, and language that meets the user where they are.

### 2. Daily Check-In
Each day the user logs:
- **Mood** — how they feel emotionally
- **Urge level** — how strong their cravings are
- **Triggers** — what set them off
- **Wins** — what they're proud of

This data feeds the streak system and gives the user a clear view of their patterns.

### 3. Streaks & Orbs (Gamification)
- **Current streak** and **longest streak** tracked automatically
- **Orbs** are earned for consistency — a soft form of XP that doesn't feel like pressure
- A **"free since"** date keeps the journey visible

### 4. Focus Mode (the centerpiece)
A productivity timer designed for people who struggle with focus and impulse control. While the timer runs:
- A glowing **Focus Aura** ring tracks the session
- A rotating **coach message** appears every 35 seconds with quiet encouragement
- The user can log **distractions** (tap a button when their mind wanders) or do a **physical reset** (a quick grounding exercise) — both award XP

### 5. The Growth System (built this session)
Focus Mode now feeds a long-term growth journey:
- **XP rules:** +1 per logged distraction, +2 per physical reset, +1 per 10 minutes focused
- **Levels:** every 50 XP unlocks a new level
- **Six stages** of identity: Spark → Ember → Glow → Beam → Star → Master
- **Five milestones** to unlock along the way:
  - First Control
  - Resistance Up
  - Focus Identity
  - Deep Work
  - Mastery
- A **level-up modal** celebrates each new stage
- A **weekly growth summary** shows up after each session
- All growth data is saved offline in the browser, so it survives refreshes

### 6. Community Support
A safe, anonymous space where users can:
- Share short posts tagged with what they're going through
- Like and reply to others
- Find people on a similar journey

### 7. Learn
Bite-sized lessons about urges, triggers, the science of habit, and recovery techniques. Completed lessons are tracked.

### 8. AI Coach
A messaging interface for talking through hard moments with a coach that responds in a calm, non-judgmental tone.

### 9. Panic Button
One tap during a strong urge opens an immediate rescue flow with breathing exercises and grounding tools.

---

## The Design

- **Dark space theme** — deep navy/purple background with soft glows
- **Glassmorphism** — frosted-glass cards that feel light and modern
- **Gradient accents** — purple-to-pink buttons that pop without being loud
- **Mobile-first layout** — every screen is sized for a phone in one hand
- **Micro-animations** — gentle transitions that make the app feel alive without being distracting

---

## The Technology

| Layer | Tools |
|---|---|
| Frontend | React 18, TypeScript, Wouter (routing), Tailwind CSS v4 |
| UI Kit | shadcn/ui components on Radix UI primitives |
| Animations | Framer Motion |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL with Drizzle ORM |
| Validation | Zod for type-safe schemas shared between client and server |
| Storage | Browser localStorage for personal data + PostgreSQL for shared content |
| Build | Vite |

The whole project is written in **TypeScript end-to-end** — the same data shapes are used on the frontend and backend, so bugs are caught at compile time instead of in production.

---

## Why Orbit Stands Out

- It treats the user as a **person**, not a patient.
- Gamification is **soft** — it celebrates progress without punishing setbacks.
- Focus Mode merges **productivity** and **recovery** into one experience.
- The whole app works **offline-first** in the browser, so a user's progress is never lost.

---

*Orbit is a working prototype. Every screen shown is functional and built from the ground up.*

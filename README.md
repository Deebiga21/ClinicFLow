# Clinic Queue Manager

A live digital queue manager for a neighbourhood clinic — receptionist screen and patient waiting-room screen, synced in real time over WebSockets.

## What this solves

Paper token slips and shouting → a receptionist adds a patient and assigns a token in seconds; a patient-facing screen shows the current token and a real, computed wait time, updating instantly with no page refresh.

## Stack

- **Backend:** Express.js + Socket.io + MongoDB (Mongoose)
- **Frontend:** React (Vite) + Socket.io-client

## Project structure

```
clinic-queue/
├── backend/
│   ├── models/
│   │   ├── Token.js              # one doc per patient/token
│   │   └── ClinicSettings.js     # avg consultation time, token counter
│   ├── routes/
│   │   └── queue.js              # all queue API endpoints
│   ├── utils/
│   │   └── queueHelpers.js       # builds queue state + computes wait times
│   ├── test/
│   │   ├── fakeModel.js          # in-memory Mongoose stand-in for testing
│   │   └── queue.test.js         # integration tests (33 checks, see below)
│   ├── server.js                 # Express + Socket.io entry point
│   └── .env                      # MONGO_URI, PORT
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx
        │   ├── ReceptionistScreen.jsx
        │   └── PatientScreen.jsx
        ├── hooks/
        │   └── useQueueSocket.js # shared socket + state hook
        └── config.js
```

## Setup

### 1. MongoDB

You need a running MongoDB instance. Easiest options:

- **Local install:** [MongoDB Community Edition](https://www.mongodb.com/docs/manual/installation/) — runs at `mongodb://127.0.0.1:27017` by default
- **MongoDB Atlas (free tier, no local install):** create a cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), grab the connection string

### 2. Backend

```bash
cd backend
npm install
```

Edit `.env` if you're using Atlas instead of local Mongo:
```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/clinic_queue
PORT=5000
```

Run it:
```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start        # plain node
```

You should see:
```
Server running on http://localhost:5000
MongoDB connected
```

**Run the test suite** (no MongoDB needed — it uses an in-memory fake):
```bash
npm test
```
Expect `33 passed, 0 failed`. This exercises the real route logic and wait-time math — see "How this was verified" below.

### 3. Frontend

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

## Demo flow

1. Open `http://localhost:5173/#/desk` (receptionist) in one tab
2. Open `http://localhost:5173/#/waiting-room` (patient screen) in another tab, side by side
3. On the receptionist screen, type a name, hit Enter — token #1 appears in the waiting list instantly on the patient screen
4. Click **Call next** — the patient screen's "Now serving" number updates immediately, no refresh
5. Add 2–3 more patients, watch their estimated wait times increase down the list
6. Adjust **consultation time** — watch wait estimates recalculate live

## How the wait time is computed (not hardcoded)

```
estimatedWait = remainingTimeForCurrentPatient + (peopleAheadInLine × avgConsultationTime)
```

- `remainingTimeForCurrentPatient` is derived from `avgConsultationTime - (now - calledAt)`, using the real timestamp the current patient was called
- `peopleAheadInLine` is a live count from the actual waiting queue in MongoDB, not a stored number

This is recalculated fresh on every `buildQueueState()` call — see `backend/utils/queueHelpers.js`.

## Concurrency & edge cases handled

- **Token numbering** uses MongoDB's atomic `$inc` via `findOneAndUpdate`, so two receptionists adding patients at the same instant can never collide on a token number
- **Call next with an empty queue** completes the current patient and safely sets `currentToken: null` — no crash
- **Rapid double-clicking "Call next"** is guarded both client-side (button disables while a request is in flight) and is safe server-side regardless, since each call only promotes one patient
- **Skip / no-show** is tracked as a separate status from `done`, so it doesn't pollute "patients served" stats
- **Reset** clears all tokens and resets the counter — useful for demo runs

## How this was verified

I don't have a MongoDB instance available in my sandbox to test against directly, so I built a lightweight in-memory stand-in (`test/fakeModel.js`) that implements the exact same Mongoose query methods my routes use (`find`, `findOne`, `findOneAndUpdate`, `create`, `countDocuments`, `deleteMany`, chained `.sort()`/`.lean()`), and ran the **real route handlers** (`routes/queue.js`) against it over actual HTTP requests.

This caught and fixed real bugs before you'd hit them — for example, an early version of the fake model didn't support `.lean()` chained off `findOne()`, which immediately surfaced a `TypeError` matching exactly how the real code calls it.

33 checks cover: token assignment and atomic numbering, queue ordering, wait-time math across multiple waiting patients, call-next/skip/reset transitions, and input validation (empty names, negative consultation times).

**What I haven't been able to verify:** the actual MongoDB driver connection itself (network/auth/schema validation at the DB layer) and the Socket.io live-sync in a real browser — both require your machine to test, since MongoDB's servers aren't reachable from my sandbox. Please run `npm test` and then the demo flow above to confirm those pieces before relying on this for your submission.

## Known limitations / things to consider before submitting

- No authentication on the receptionist screen — anyone with the URL can manage the queue. Fine for a single-clinic demo, not for production.
- `io.emit()` broadcasts to **all** connected clients globally — for multi-clinic support you'd want `io.to(roomId).emit(...)` with rooms per clinic.
- The "remaining time for current patient" estimate assumes consultations run roughly on schedule; if a consultation runs long, the wait estimate decays to 0 rather than going negative, which is a reasonable but debatable choice.

# ClinicFlow v2 — Setup

## Backend
```
cd backend
npm install            # adds bcryptjs + jsonwebtoken
npm run dev
```
.env already contains a dev `JWT_SECRET` — change it for production.

## Frontend
```
cd frontend
npm install            # adds framer-motion + lucide-react
npm run dev
```

## What's new
- **Real JWT auth** — patient + staff register/login, stored in MongoDB (bcrypt hashed).
- **Sidebar shell** with role-aware navigation, theme toggle (light/dark), logout.
- **Staff-to-Patient micro-chat** — real-time via Socket.io rooms (`token:N`), persisted.
- **In-app notifications** — toasts broadcast on add / call-next / checkout (demo-safe, no SMS API).
- **Dynamic wait times** — already computed from real data, now exposed on its own dashboard.
- **Instant Digital Check-Out** — patient closes their own visit in one tap.
- **Settings page** with theme + account.
- **Tasteful animations** via framer-motion (fade-up, pop, slide-in).

## Demo flow (60 s)
1. Open `/#/register?role=staff` — sign up as a nurse (e.g. `nurse1`).
2. New tab → `/#/register?role=patient` — sign up as a patient.
3. Nurse adds a patient at the desk → token #1 is issued.
4. Patient links token #1 from the Waiting Room.
5. Nurse clicks **Call next** → patient gets a live toast + chat unlocks.
6. They chat live, then patient hits **Check out** → counter ticks.

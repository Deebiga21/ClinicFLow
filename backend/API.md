# ClinicFlow Backend — API Reference (v4)

Base URL: `http://localhost:5000/api`

Auth: `Authorization: Bearer <jwt>` on all protected routes.

Roles: `patient` | `staff` | `admin`

---

## Auth  `/auth`

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/auth/register` | — | `{username, password, role, displayName}` | roles: patient/staff/admin |
| POST | `/auth/login` | — | `{username, password}` | returns `{token, user}` |
| GET  | `/auth/me` | ✓ | — | current user profile |
| PUT  | `/auth/me` | ✓ | `{displayName, email, phone, bio, department, ...}` | update profile |
| PUT  | `/auth/me/password` | ✓ | `{currentPassword, newPassword}` | change own password |
| POST | `/auth/link-token` | patient | `{tokenNumber}` | link patient to queue token |

---

## Queue  `/queue`

| Method | Path | Auth | Body/Query | Notes |
|--------|------|------|------|-------|
| GET  | `/queue` | — | `?doctorId=` | global or per-doctor state |
| POST | `/queue/add` | staff/admin | `{patientName, doctorId?, doctorName?, department?}` | create token |
| POST | `/queue/call-next` | staff/admin | `{doctorId?}` | advance queue |
| POST | `/queue/skip` | staff/admin | `{doctorId?}` | skip current patient |
| PUT  | `/queue/settings` | staff/admin | `{avgConsultationTime}` | global avg time |
| POST | `/queue/checkout` | ✓ | `{tokenNumber}` | patient self-checkout |
| POST | `/queue/reset` | staff/admin | — | clear all tokens |

---

## Doctors  `/doctors`

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET  | `/doctors` | — | — | list all doctors |
| GET  | `/doctors/:id` | — | — | single doctor |
| POST | `/doctors` | staff/admin | `{name, department, specialization?, roomNumber?, avgConsultationTime?}` | create |
| PUT  | `/doctors/:id` | staff/admin | any doctor fields | update |
| DELETE | `/doctors/:id` | admin | — | delete |
| POST | `/doctors/:id/toggle-availability` | staff/admin | — | flip isAvailable |

---

## Appointments  `/appointments`

| Method | Path | Auth | Body/Query | Notes |
|--------|------|------|------|-------|
| GET  | `/appointments` | ✓ | `?date=&doctorId=&status=` | filtered list |
| GET  | `/appointments/today` | ✓ | — | today's appointments |
| GET  | `/appointments/:id` | ✓ | — | single |
| POST | `/appointments` | staff/admin | `{patientName, patientPhone?, patientEmail?, doctorId, scheduledDate, scheduledTime, reason?}` | book |
| PUT  | `/appointments/:id` | staff/admin | any appt fields | update |
| POST | `/appointments/:id/checkin` | staff/admin | — | convert to live queue token |
| DELETE | `/appointments/:id` | staff/admin | — | cancel (soft delete) |

---

## Visit Records  `/visits`

| Method | Path | Auth | Query | Notes |
|--------|------|------|------|-------|
| GET  | `/visits` | ✓ | `?patientName=&doctorId=&from=&to=&userId=&page=&limit=` | search history |
| GET  | `/visits/me` | patient | — | own visit history |
| GET  | `/visits/:id` | ✓ | — | single record |
| PUT  | `/visits/:id` | staff/admin | `{diagnosis?, prescription?, notes?}` | add clinical notes |

---

## Analytics  `/analytics`

| Method | Path | Auth | Query | Notes |
|--------|------|------|------|-------|
| GET  | `/analytics/daily` | staff/admin | `?date=YYYY-MM-DD` | daily stats |
| GET  | `/analytics/range` | staff/admin | `?from=&to=` | multi-day, daily counts, dept breakdown, peak hours |
| GET  | `/analytics/doctors` | staff/admin | `?date=` | per-doctor patient count + avg times |

---

## Admin  `/admin`

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET  | `/admin/overview` | admin | — | system health snapshot |
| GET  | `/admin/activity` | admin | `?hours=24` | recent token activity log |
| GET  | `/admin/users` | admin | — | all users |
| POST | `/admin/users` | admin | `{username, password, role, displayName?, department?}` | create staff/admin |
| PUT  | `/admin/users/:id` | admin | `{role?, displayName?, department?, isActive?, email?, phone?}` | update user |
| POST | `/admin/users/:id/reset-password` | admin | `{newPassword}` | force reset |
| DELETE | `/admin/users/:id` | admin | — | deactivate user |

---

## Socket.io Events

### Client → Server
| Event | Payload | Action |
|-------|---------|--------|
| `chat:join` | `{tokenNumber}` | join per-token room |
| `chat:leave` | `{tokenNumber}` | leave room |
| `chat:send` | `{tokenNumber, text, senderRole, senderName}` | send message |
| `doctor:join` | `{doctorId}` | join doctor room for filtered updates |

### Server → Client
| Event | Payload | Who receives |
|-------|---------|-------------|
| `queueUpdated` | full queue state | everyone |
| `notify` | `{tone, title, message, ...}` | everyone or targeted room |
| `chat:message` | message object | token room |

---

## New Models Summary

### Doctor
`name`, `department`, `specialization`, `roomNumber`, `isAvailable`, `avgConsultationTime`

### Appointment
`patientName`, `patientPhone`, `patientEmail`, `doctorId`, `department`, `scheduledDate`, `scheduledTime`, `reason`, `status` (scheduled/checked_in/in_consultation/completed/cancelled/no_show), `linkedTokenNumber`, `notes`

### VisitRecord  *(auto-created on every token completion/skip)*
`tokenNumber`, `patientName`, `patientUserId`, `doctorId`, `doctorName`, `department`, `appointmentId`, `arrivedAt`, `calledAt`, `completedAt`, `waitDurationMinutes`, `consultDurationMinutes`, `diagnosis`, `prescription`, `notes`, `status`

### Token  *(updated)*
Now includes `doctorId`, `doctorName`, `department`, `appointmentId`, `patientUserId`

### User  *(updated)*
Now includes `admin` role and `isActive` flag

# FocusFlow 2.0 — Backend Reminders & Cloud Functions

This directory provides the production-ready Firebase Cloud Functions and Cloud Scheduler backend for **FocusFlow 2.0 Smart Reminders**.

## Overview

The backend automatically identifies due task reminders and dispatches Web Push notifications via Firebase Cloud Messaging (FCM) to the user's registered devices.

### Architecture
- **Firestore Data Source**: Collection group `reminders` (`users/{uid}/reminders/{taskId}`).
- **Task Verification**: Validates that the task still exists, belongs to the intended user, and is not completed or moved to Trash before delivering notifications.
- **Idempotency & Concurrency Safety**: Atomically transitions reminder state (`pending` -> `processing` -> `sent` / `cancelled` / `failed`) to prevent duplicate notification deliveries.
- **Token Lifecycle**: Automatically removes stale or expired FCM tokens (`messaging/registration-token-not-registered`).
- **Bounded Retries**: Automatically caps retries at 3 attempts for transient network issues to prevent infinite retry storms.

---

## Prerequisites for Deployment

1. **Firebase Blaze Plan**:
   - Google Cloud requires the Blaze (pay-as-you-go) plan for Firebase Cloud Functions v2 and Cloud Scheduler.
   - Note: Free tiers within the Blaze plan include 2M Cloud Function invocations and 3 free Cloud Scheduler jobs per month.
   - Upgrade at: [Firebase Console](https://console.firebase.google.com/project/focusflow-0703/usage/details).

2. **Firebase CLI**:
   - Install the CLI if not already installed:
     ```bash
     npm install -g firebase-tools
     ```
   - Authenticate with your Google account:
     ```bash
     firebase login
     ```

3. **FCM Web Push Credentials (VAPID Key)**:
   - In the Firebase Console:
     1. Go to **Project Settings** -> **Cloud Messaging**.
     2. Under **Web configuration**, click **Generate key pair** in the **Web Push certificates** section.
     3. Copy the public key pair and add it to your `.env` file in the `client/` workspace:
        ```env
        VITE_FIREBASE_VAPID_KEY=your_public_vapid_key_here
        ```

---

## Deployment Steps

1. Navigate to the `functions/` directory:
   ```bash
   cd functions
   npm install
   npm run build
   ```

2. Deploy the functions to your Firebase project:
   ```bash
   firebase deploy --only functions
   ```

3. Verify deployment in the Firebase Console:
   - Under **Functions**, verify:
     - `checkDueRemindersScheduled` (Scheduled every 1 minute)
     - `checkDueRemindersHttp` (HTTPS trigger for manual testing)

---

## Local Development & Emulators

You can test the Cloud Functions locally using the Firebase Emulator Suite:

```bash
firebase emulators:start --only functions,firestore
```

---

## Client Fallback Behavior

If the Firebase Blaze plan or Cloud Functions are not yet deployed:
- FocusFlow 2.0 continues operating safely.
- Scheduled reminders are recorded and persisted in Firestore under `users/{uid}/reminders`.
- When FocusFlow is open in a browser, the in-app foreground reminder monitor evaluates due reminders and delivers native desktop browser notifications and FocusFlow toast alerts with direct task deep-links.

# cards

## Firebase setup

This app expects Firebase config in Vite environment variables.

1. Copy `.env.example` to `.env.local`.
2. In Firebase Console, open your project and go to Project settings > General.
3. Under Your apps (Web app), copy the Firebase SDK config values.
4. Fill these keys in `.env.local`:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Restart the dev server after editing environment files:

```bash
npm run dev
```

# Firebase Deployment Guide

## Setting Environment Variables

### Option 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **App Hosting** (or **Hosting** if using traditional hosting)
4. Click on your app/environment
5. Go to **Environment variables** or **Configuration**
6. Add each environment variable:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT` (as a JSON string for Admin SDK)

### Option 2: Using apphosting.yaml

The `apphosting.yaml` file defines which environment variables are needed. You still need to set the actual values in the Firebase Console, but the YAML file documents what's required.

### Option 3: Firebase CLI (for traditional hosting)

If using traditional Firebase Hosting (not App Hosting), you can set build-time variables:

```bash
# Set environment variables for build
export NEXT_PUBLIC_FIREBASE_API_KEY="your-key"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
# ... etc

# Then build and deploy
npm run build
firebase deploy
```

## Getting Your Firebase Configuration Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select **Project settings**
5. Scroll down to **Your apps** section
6. If you have a web app, click on it to see the config
7. If you don't have a web app, click **Add app** > **Web** (</>) to create one
8. Copy the values from the `firebaseConfig` object

## Getting Service Account Key (for Admin SDK)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ > **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Convert the entire JSON to a single-line string and set it as `FIREBASE_SERVICE_ACCOUNT` environment variable

**Important**: Never commit the service account key to version control!

## Deployment Steps

1. Set all environment variables in Firebase Console
2. Run `firebase deploy` or deploy through the Firebase Console
3. The build process will use the environment variables you set

## Troubleshooting

### Build fails with "invalid-api-key"
- Ensure `NEXT_PUBLIC_FIREBASE_API_KEY` is set in Firebase Console
- Check that the value is not empty
- Verify the API key is correct for your project

### Build fails during prerendering
- This is normal for pages that use Firebase client SDK
- The lazy initialization in `firebaseClient.ts` should handle this
- Pages marked with `export const dynamic = "force-dynamic"` won't be prerendered

### Admin SDK not working
- Ensure `FIREBASE_SERVICE_ACCOUNT` is set as a JSON string (not a file path)
- The JSON should be a single-line string with escaped quotes
- Verify the service account has the necessary permissions


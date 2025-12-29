# Firebase Deployment Guide

## Setting Environment Variables

### Option 1: Using Firebase Secrets (Recommended for App Hosting)

**Firebase Secrets** are stored in Google Secret Manager and are the recommended way to handle sensitive configuration in Firebase App Hosting.

#### Step 1: Create Secrets in Google Secret Manager

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **Secret Manager** (search for it in the top search bar)
4. Click **CREATE SECRET** for each of the following:
   - Secret name: `NEXT_PUBLIC_FIREBASE_API_KEY` (must match exactly)
     - Secret value: Your Firebase API key
   - Secret name: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - Secret value: Your Firebase auth domain (e.g., `your-project.firebaseapp.com`)
   - Secret name: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - Secret value: Your Firebase project ID
   - Secret name: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - Secret value: Your Firebase storage bucket (e.g., `your-project.appspot.com`)
   - Secret name: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - Secret value: Your Firebase messaging sender ID
   - Secret name: `NEXT_PUBLIC_FIREBASE_APP_ID`
     - Secret value: Your Firebase app ID
   - Secret name: `FIREBASE_SERVICE_ACCOUNT`
     - Secret value: Your service account JSON as a single-line string (see "Getting Service Account Key" below)

**Important**: The secret names MUST match exactly what's in `apphosting.yaml` (case-sensitive).

#### Step 2: Verify apphosting.yaml Configuration

Your `apphosting.yaml` should reference these secrets. The file is already configured correctly if it looks like:

```yaml
env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    secret: NEXT_PUBLIC_FIREBASE_API_KEY
    availability:
      - BUILD
      - RUNTIME
  # ... etc
```

The `secret:` field should match the secret name in Google Secret Manager.

#### Step 3: Grant Access (if needed)

Firebase App Hosting service account needs access to read the secrets:
1. In Secret Manager, click on each secret
2. Go to **PERMISSIONS** tab
3. Ensure the Firebase App Hosting service account has "Secret Manager Secret Accessor" role
4. The service account email format is usually: `service-<project-number>@gcp-sa-apphosting.iam.gserviceaccount.com`

### Option 2: Using Environment Variables (Alternative)

If you prefer not to use Secrets, you can set environment variables directly:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **App Hosting**
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

**Note**: If using environment variables instead of secrets, you'll need to update `apphosting.yaml` to remove the `secret:` lines and just use `variable:`.

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
7. **Convert the entire JSON to a single-line string** and set it as `FIREBASE_SERVICE_ACCOUNT` environment variable

### Formatting the Service Account JSON

The `FIREBASE_SERVICE_ACCOUNT` secret must be the **entire JSON object as a single-line string**, without any extra quotes around it.

**Correct format:**
```
{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Incorrect formats (DO NOT USE):**
- ❌ `"{...}"` (with quotes around the JSON)
- ❌ `'{...}'` (with single quotes)
- ❌ Multi-line JSON (must be single line)
- ❌ Escaped quotes like `\"` (use actual quotes in the JSON)

**How to convert:**
1. Open the downloaded JSON file
2. Remove all line breaks and extra spaces
3. The result should be one continuous line
4. Copy that entire line and paste it as the secret value
5. **Do NOT add quotes around it** - Firebase Secrets will handle the string encoding

**Important**: Never commit the service account key to version control!

## Deployment Steps

1. Set all environment variables in Firebase Console
2. Run `firebase deploy` or deploy through the Firebase Console
3. The build process will use the environment variables you set

## Troubleshooting

### Login not working / "invalid-api-key" error

If you're using **Firebase Secrets** and login isn't working:

1. **Verify secrets exist in Secret Manager**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/) > Secret Manager
   - Ensure all secrets are created with exact names matching `apphosting.yaml`

2. **Check secret names match exactly**:
   - Secret names in Google Secret Manager must match the `secret:` field in `apphosting.yaml`
   - They are case-sensitive (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY` not `next_public_firebase_api_key`)

3. **Verify BUILD availability**:
   - `NEXT_PUBLIC_*` variables MUST be available during BUILD phase
   - In `apphosting.yaml`, ensure `availability: [BUILD, RUNTIME]` is set for all `NEXT_PUBLIC_*` variables
   - Without BUILD availability, Next.js can't embed them in the client bundle

4. **Check permissions**:
   - Firebase App Hosting service account needs "Secret Manager Secret Accessor" role
   - In Secret Manager, go to each secret > PERMISSIONS tab and verify access

5. **Debug endpoint**:
   - Visit `/api/debug/env` on your deployed site (if enabled)
   - This shows which environment variables are loaded
   - Set `ENABLE_DEBUG_ENV=true` in your environment to enable in production

6. **Check build logs**:
   - In Firebase Console > App Hosting > your app > Builds
   - Look for errors about missing environment variables
   - Check if secrets are being accessed during build

### Build fails with "invalid-api-key"
- Ensure `NEXT_PUBLIC_FIREBASE_API_KEY` secret exists in Google Secret Manager
- Verify the secret name matches exactly in `apphosting.yaml`
- Check that the secret value is not empty
- Verify the API key is correct for your project
- Ensure the secret is available during BUILD phase

### Build fails during prerendering
- This is normal for pages that use Firebase client SDK
- The lazy initialization in `firebaseClient.ts` should handle this
- Pages marked with `export const dynamic = "force-dynamic"` won't be prerendered

### Admin SDK not working
- Ensure `FIREBASE_SERVICE_ACCOUNT` secret exists in Google Secret Manager
- The secret value should be the entire service account JSON as a single-line string
- Verify the service account has the necessary permissions
- Check that the secret is available during RUNTIME phase

### Environment variables not loading
- If using secrets: Verify they're created in Google Secret Manager with exact names
- If using env vars: Check they're set in Firebase Console > App Hosting > Environment variables
- Secret names and variable names are case-sensitive
- Re-deploy after creating/updating secrets or environment variables


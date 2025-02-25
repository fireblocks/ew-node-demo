import admin from "firebase-admin";
import * as serviceAccount from "../../secrets/service-account-key.json";
import * as firebase_secrets from "../../secrets/firebase-auth-secrets";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
  }),
});

const firebaseUid = process.env.FIREBASE_UID;
let issuedToken: string;

async function getFirebaseAuthToken(uid: string): Promise<string> {
  const API_KEY = firebase_secrets.API_KEY;

  try {
    const customToken = await admin.auth().createCustomToken(uid);

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error: ${errorData.error.message}`);
    }

    const data = await response.json();
    // console.log("Firebase ID Token:", data.idToken);
    return data.idToken;
  } catch (error) {
    console.error("Error exchanging token:", error);
  }
}

export async function getToken(forceNew = false): Promise<string> {
  if (forceNew || !issuedToken) {
    issuedToken = await getFirebaseAuthToken(firebaseUid);
  }
  return issuedToken;
}

export async function setCustomClaim(
  uid: string,
  claimKey: string,
  claimValue: string
) {
  try {
    // Fetch current custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Update claims
    const updatedClaims =
      claimValue === "CLEAR"
        ? null
        : { ...currentClaims, [claimKey]: claimValue };
    await admin.auth().setCustomUserClaims(uid, updatedClaims);

    console.log(
      `Custom claim for user '${uid}' has been ${
        claimValue === "CLEAR"
          ? "cleared"
          : `set to [${claimKey}]: '${claimValue}'`
      }`
    );
  } catch (error) {
    console.error(
      `Error setting custom claim for user '${uid}' [${claimKey}: ${claimValue}]`,
      error
    );
  }
}

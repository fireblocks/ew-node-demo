import admin from "firebase-admin";
import * as serviceAccount from "../../secrets/service-account-key.json";
import * as firebase_secrets from "../../secrets/firebase-auth-secrets";
import * as jwt from "jsonwebtoken";
import { ENV } from "../config";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
  }),
});

const firebaseUid = ENV.FIREBASE_UID;
const TokenData = {
  idToken: "",
  exp: 0,
  iat: 0,
};

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
    return data.idToken;
  } catch (error) {
    console.error("Error exchanging token:", error);
  }
}

export async function getToken(forceNew = false): Promise<string> {
  const currentTime = Math.floor(Date.now() / 1000);
  if (!TokenData.idToken) {
    forceNew = true;
  }

  if (TokenData.idToken) {
    const timeRemaining = TokenData.exp - currentTime;
    const tokenLifespan = TokenData.exp - TokenData.iat;
    // 90% of the token's lifespan
    if (timeRemaining < tokenLifespan * 0.1) {
      forceNew = true;
    }
  }

  if (forceNew) {
    try {
      TokenData.idToken = await getFirebaseAuthToken(firebaseUid);
      const decoded = jwt.decode(TokenData.idToken, {
        json: true,
      }) as jwt.JwtPayload;
      TokenData.exp = decoded.exp;
      TokenData.iat = decoded.iat;
    } catch (error) {
      console.error("Error getting new Firebase Auth token:", error);
      throw error;
    }
  }

  // console.log("Firebase ID Token:", TokenData.idToken);
  return TokenData.idToken;
}

export async function getCustomClaim(uid: string, claimKey: string): Promise<string | null> {
  try {
    const user = await admin.auth().getUser(uid);
    const customClaims = user.customClaims || {};
    return customClaims[claimKey] || null;
  } catch (error) {
    console.error(`Error getting custom claim for user '${uid}' [${claimKey}]`, error);
    return null;
  }
}

export async function setCustomClaim(uid: string, claimKey: string, claimValue: string) {
  try {
    // Fetch current custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Update claims
    const updatedClaims =
      claimValue === "CLEAR" ? null : { ...currentClaims, [claimKey]: claimValue };
    await admin.auth().setCustomUserClaims(uid, updatedClaims);

    console.log(
      `Custom claim for user '${uid}' has been ${
        claimValue === "CLEAR" ? "cleared" : `set to [${claimKey}]: '${claimValue}'`
      }`
    );
  } catch (error) {
    console.error(
      `Error setting custom claim for user '${uid}' [${claimKey}: ${claimValue}]`,
      error
    );
  }
}

import { config } from "dotenv";
import { CommandFlags } from "./utils/commands";

function loadEnvironmentConfig(envName?: string) {
  const envPath = envName ? `.env.${envName}` : ".env";

  const result = config({
    path: envPath,
    override: true,
  });

  if (result.error) {
    console.error(
      `Error loading ${envName} environment variables${
        envPath ? ` from: ${envPath}` : ""
      }:`,
      result.error
    );
  } else {
    console.log(`Loaded environment configuration from: ${envPath}`);
  }
}

const envName = process.argv.includes(CommandFlags.ENV)
  ? process.argv[process.argv.indexOf(CommandFlags.ENV) + 1]
  : undefined;

loadEnvironmentConfig(envName);

export const ENV = {
  DEFAULT_PASSPHRASE: process.env.DEFAULT_PASSPHRASE,
  DEFAULT_PASSPHRASE_ID: process.env.DEFAULT_PASSPHRASE_ID,
  ENV: process.env.ENV,
  AUTH_CLIENT_ID: process.env.AUTH_CLIENT_ID,
  FIREBASE_UID: process.env.FIREBASE_UID,
};

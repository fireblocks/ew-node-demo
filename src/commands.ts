import { EmbeddedWallet } from "@fireblocks/embedded-wallet-sdk";
import {
  ConsoleLoggerFactory,
  getFireblocksNCWInstance,
  IFireblocksNCW,
  TEnv,
} from "@fireblocks/ncw-js-sdk";
import { getToken } from "./utils/firebase-auth";
import inquirer from "inquirer";
import { getDeviceId } from "./utils/utils";
import {
  FileSystemSecureStorageProvider,
  FileSystemStorageProvider,
} from "./utils/sdk-storage";
let ew: EmbeddedWallet | null = null;

const env = process.env;
export const commands: Record<string, Function> = {};

commands["Init EW"] = async () => {
  if (ew) {
    console.log("EW already initialized");
    return;
  }
  ew = new EmbeddedWallet({
    env: env.ENV as TEnv,
    logger: ConsoleLoggerFactory(),
    authClientId: env.AUTH_CLIENT_ID,
    authTokenRetriever: {
      getAuthToken: getToken,
    },
    reporting: { enabled: false },
  });
  console.log("EW initialized");
};

commands["init core"] = async () => {
  const { deviceId } = await inquirer.prompt([
    {
      type: "input",
      name: "deviceId",
      message: "Enter device ID",
      default: getDeviceId(),
    },
  ]);

  if (getFireblocksNCWInstance(deviceId)) {
    console.log("Core already initialized");
    return;
  }
  await ew.initializeCore({
    deviceId,
    eventsHandler: {
      handleEvent: console.log,
    },
    storageProvider: new FileSystemStorageProvider("storage/public"),
    secureStorageProvider: new FileSystemSecureStorageProvider(
      "storage/secure"
    ),
  });
  console.log("Core initialized");
};

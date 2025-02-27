import { runPrompt } from "./prompt";

export const state = {
  initEW: false,
  initCore: false,
  walletId: undefined,
  coreDeviceId: undefined,
};

process.on("uncaughtException", (error) => {
  if (error instanceof Error && error.name === "ExitPromptError") {
    // noop; silence this error
  } else {
    // Rethrow unknown errors
    throw error;
  }
});

runPrompt();

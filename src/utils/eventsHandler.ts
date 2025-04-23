import { TEvent } from "@fireblocks/ncw-js-sdk";
import { IEventsHandler } from "@fireblocks/ncw-js-sdk/dist/types/interfaces";
import { printEvent } from "./display";

export class EventsHandler implements IEventsHandler {
  public handleEvent(event: TEvent): void {
    const data = this.getEventData(event);
    printEvent(event.type, data);
  }

  private getEventData(event: TEvent): unknown {
    switch (event.type) {
      case "key_descriptor_changed": {
        return event.keyDescriptor;
      }
      case "key_takeover_changed": {
        return event.keyTakeover;
      }
      case "transaction_signature_changed": {
        return event.transactionSignature;
      }
      case "keys_backup": {
        return event.keysBackup;
      }
      case "keys_recovery": {
        return event.keyDescriptor;
      }
      case "join_wallet_descriptor": {
        return event.joinWalletDescriptor;
      }
      default: {
        return event;
      }
    }
  }
}

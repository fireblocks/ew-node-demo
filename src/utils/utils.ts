import fs from "fs";
import path from "path";
import crypto from "crypto";

const filePath = "storage/DEVICE_ID.txt";
const dirPath = path.dirname(filePath);

export function getDeviceId(overrideDeviceId?: string, failOnEmpty = false) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (overrideDeviceId) {
    fs.writeFileSync(filePath, overrideDeviceId);
    console.log("DeviceId overridden: " + overrideDeviceId);
    return overrideDeviceId;
  }

  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf-8") === "") {
    if (failOnEmpty) {
      throw new Error("Device ID not found");
    }
    const newDeviceId = crypto.randomUUID();
    fs.writeFileSync(filePath, newDeviceId);
    console.log("New deviceId generated and saved: " + newDeviceId);
    return newDeviceId;
  }

  return fs.readFileSync(filePath, "utf-8");
}

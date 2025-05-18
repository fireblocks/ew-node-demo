import fs from "fs";
import path from "path";

const devicePath = "storage/LATEST_DEVICE_ID.txt";
const walletPath = "storage/WALLET_IDS.txt";

export function getDeviceId() {
  return getFileContent(devicePath);
}

export function setDeviceId(content: string) {
  return overrideFile(devicePath, content);
}

export function addWalletId(name: string, uuid: string) {
  if (!fs.existsSync(walletPath)) {
    appendFile(walletPath, "# name,uuid\n");
  }

  const content = `${name},${uuid}\n`;
  return appendFile(walletPath, content);
}

export function getWalletIds() {
  if (!fs.existsSync(walletPath)) {
    return;
  }
  const content = getFileContent(walletPath);
  return content
    ? content
        .split("\n")
        .filter(line => !line.startsWith("#"))
        .map(line => {
          const [name, uuid] = line.split(",");
          return { name, uuid };
        })
    : [];
}

function getFileContent(filePath: string): string {
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf-8") === "") {
    return null;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return content.endsWith("\n") ? content.slice(0, -1) : content;
}

function appendFile(filePath: string, content: string) {
  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.appendFileSync(filePath, content);
  console.log(`FS: ${filePath} updated ` + content);
  return content;
}

function overrideFile(filePath: string, content: string) {
  const dirPath = path.dirname(filePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(filePath, content);
  console.log(`FS: ${filePath} updated ` + content);
  return content;
}

import crypto from "node:crypto";
import fs from "node:fs/promises";

class GmMode {
  constructor() {
    this.ALGORITHM = "aes-256-cbc";
    this.ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "base64");
    this.IV_LENGTH = 16;

    this.tagOpen = "{{< gm >}}";
    this.tagClose = "{{< /gm >}}";
    this.regexpEnc = new RegExp(
      `(?<=${this.tagOpen}\\s*)(?<gmText>[^\\s][\\S\\s]+[^\\s])(?=\\s*${this.tagClose})`,
      "g",
    );
    // See ./assets/js/gameMasterMode.js
    this.regexpDec = new RegExp(
      `(?<gmText>([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?\\|([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?)`,
      "g",
    );

    this.dir = "content";
  }

  #encrypt(_, gmText) {
    let iv = crypto.randomBytes(this.IV_LENGTH);
    let cipher = crypto.createCipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(gmText);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString("base64") + "|" + encrypted.toString("base64")}`;
  }

  #decrypt(text) {
    let textParts = text.split("|");
    let iv = Buffer.from(textParts.shift(), "base64");
    let encryptedText = Buffer.from(textParts.shift(), "base64");
    let decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      this.ENCRYPTION_KEY,
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return `${decrypted.toString()}`;
  }

  async encryptContents() {
    const paths = await fs.readdir(this.dir, {
      recursive: true,
      withFileTypes: true,
    });
    paths.forEach(async (path) => {
      const pathStr = `${path.parentPath}/${path.name}`;
      if ((await fs.stat(pathStr)).isFile()) {
        let contents = await fs.readFile(pathStr, { encoding: "utf-8" });
        if (!contents.match(this.regexpDec)) {
          contents = contents.replaceAll(
            this.regexpEnc,
            this.#encrypt.bind(this),
          );
          await fs.writeFile(pathStr, contents);
        }
      }
    });
  }

  async decryptContents() {
    const paths = await fs.readdir(this.dir, {
      recursive: true,
      withFileTypes: true,
    });
    paths.forEach(async (path) => {
      const pathStr = `${path.parentPath}/${path.name}`;
      if (pathStr.includes(".md") || pathStr.includes(".html")) {
        let contents = await fs.readFile(pathStr, { encoding: "utf-8" });
        if (contents.match(this.regexpDec)) {
          contents = contents.replaceAll(
            this.regexpDec,
            this.#decrypt.bind(this),
          );
          await fs.writeFile(pathStr, contents);
        }
      }
    });
  }
}

switch (process.argv[2]) {
  case "enc": {
    const gmMode = new GmMode();
    await gmMode.encryptContents();
    break;
  }
  case "dec": {
    const gmMode = new GmMode();
    await gmMode.decryptContents();
    break;
  }
  default:
    console.log(
      `
            Usage:
                gmMode.js enc  - Encrypt for push to github and use by remote Site
                gmMode.js dec  - Decrypt for pull to edit locally
        `.trim(),
    );
    break;
}

import crypto from "crypto";
import fs from "fs/promises";
import showError from "./show-errors.mjs";

export default async function calcHash(filePath) {
  try {
    await fs.access(filePath);
    const content = await fs.readFile(filePath, "utf-8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    console.log(hash);
  } catch (err) {
    showError(err, "hash");
  }
}

import fs from "fs/promises";
import showError from "./show-errors.mjs";

export default async function createNewFile(newFileName) {
  async function writeFile() {
    try {
      await fs.writeFile(newFileName, "");
      console.log(`New file ${newFileName} was created`);
    } catch (err) {
      showError(err);
    }
  }
  try {
    const newFileNameCheck = await fs.stat(newFileName);
    if (newFileNameCheck.isDirectory()) {
      console.log(
        `Operation failed. You are trying to create a file without extension while having a directory with the same name already`
      );
    } else {
      await writeFile();
    }
  } catch (err) {
    await writeFile();
    showError(err, "ignore");
  }
}

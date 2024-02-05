import fs from "fs/promises";
import showError from "./show-errors.mjs";
import path from "path";

export default async function removeFile(pathToAfile) {
  try {
    const newLocationChecked = await fs.stat(pathToAfile);
    const fileName = path.win32.basename(pathToAfile);
    if (newLocationChecked.isFile()) {
      try {
        await fs.unlink(pathToAfile);
        console.log(`file ${fileName} was successfully removed`);
      } catch (err) {
        showError(err);
      }
    } else if (newLocationChecked.isDirectory()) {
      console.log(`Operation failed. You are trying to remove a directory`);
    }
  } catch (err) {
    showError(err);
  }
}

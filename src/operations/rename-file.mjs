import fs from "fs/promises";
import path from "path";
import { join } from "path";
import showError from "./show-errors.mjs";

export default async function renameFile(oldFilePath, newName) {
  async function rename(dirName, oldFileName) {
    try {
      await fs.rename(oldFilePath, join(dirName, newName)).then(() => {
        console.log(
          `File was successfully renamed from ${oldFileName} to ${newName}`
        );
      });
    } catch (err) {
      if (err.code === "EPERM") {
        console.log(
          `Operation failed. You can't have a file without extention and a folder with the same name at the same time`
        );
      } else {
        showError(err);
      }
    }
  }

  try {
    const oldFileChecked = await fs.stat(oldFilePath);
    if (oldFileChecked.isFile()) {
      const fileName = path.win32.basename(oldFilePath);
      const dirName = path.dirname(oldFilePath);
      try {
        const newNameCheck = await fs.stat(join(dirName, newName));
        if (newNameCheck.isFile()) {
          console.log(`Operation failed. ${newName} already exists`);
        } else if (newNameCheck.isDirectory()) {
          await rename(dirName, fileName);
        }
      } catch (err) {
        await rename(dirName, fileName);
        showError(err, "ignore");
      }
    } else {
      console.log(
        `Operation failed. You are trying to rename a folder, not a file`
      );
    }
  } catch (err) {
    showError(err);
  }
}

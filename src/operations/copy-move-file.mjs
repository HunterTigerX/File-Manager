import fs from "fs/promises";
import path from "path";
import { join } from "path";
import { createReadStream } from "fs";
import { createWriteStream } from "fs";
import showError from "./show-errors.mjs";

export default async function copyMoveFile(oldFile, newLocation, command) {
  try {
    const oldFileChecked = await fs.stat(oldFile);
    if (oldFileChecked.isFile()) {
      try {
        const newLocationChecked = await fs.stat(newLocation);
        if (newLocationChecked.isDirectory()) {
          const fileName = path.win32.basename(oldFile);
          const fileStream = createReadStream(oldFile);
          const writeStream = createWriteStream(join(newLocation, fileName));
          if (
            path.resolve(oldFile) === path.resolve(join(newLocation, fileName))
          ) {
            console.log(
              "Operation failed. Are you trying to move a file to the same folder?"
            );
          } else {
            fileStream.pipe(writeStream);
            return new Promise((resolve, reject) => {
              fileStream.on("end", async () => {
                const operationName = command === "mv" ? "Moving" : "Copying";
                console.log(
                  `${operationName} file ${fileName} to ${newLocation} was successful`
                );
                if (command === "mv") {
                  try {
                    await fs.unlink(oldFile);
                  } catch (err) {
                    showError(err);
                  }
                }
                resolve();
              });

              fileStream.on("error", (error) => {
                reject(error);
              });
            });
          }
        } else {
          console.log(`Operation failed. ${newLocation} is not a directory`);
        }
      } catch (err) {
        showError(err, "copyMove");
      }
    } else {
      console.log(`Operation failed. ${oldFile} is a directory, not a file`);
    }
  } catch (err) {
    showError(err);
  }
}

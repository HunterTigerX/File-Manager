import fs from "fs/promises";
import { createReadStream } from "fs";
import showError from "./show-errors.mjs";

export default async function readFile(filteredPath) {
  try {
    const testedPath = await fs.stat(filteredPath);

    if (testedPath.isDirectory()) {
      console.log(
        "Operation failed. You entered a path to a directory, not a path to a file"
      );
    } else {
      const fileStream = createReadStream(filteredPath);
      return new Promise((resolve, reject) => {
        fileStream.on("data", (data) => {
          process.stdout.write(data);
        });

        fileStream.on("end", () => {
          process.stdout.write("\n");
          resolve();
        });

        fileStream.on("error", (error) => {
          reject(error);
        });
      });
    }
  } catch (err) {
    showError(err);
  }
}

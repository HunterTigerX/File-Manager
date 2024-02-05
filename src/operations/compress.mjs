import { createReadStream } from "fs";
import { createWriteStream } from "fs";
import fs from "fs/promises";
import zlib from "zlib";
import path from "path";
import { join } from "path";
import showError from "./show-errors.mjs";
export default async function compressionHub(pathToFile, pathToFolder) {
  function compress(output) {
    const streamInput = createReadStream(pathToFile);
    const streamOutput = createWriteStream(output);
    const gzip = zlib.createBrotliCompress();
    streamInput.pipe(gzip).pipe(streamOutput);
    console.log(`file was successfully compressed`);
  }

  try {
    const checkedFile = await fs.stat(pathToFile);
    const firstFileNameOnly = path.parse(pathToFile).name;

    if (checkedFile.isFile()) {
      try {
        const checkedFolder = await fs.stat(pathToFolder);
        // something that was used as a second argument already exists
        if (checkedFolder.isDirectory()) {
          // User used path as a second argument and we are autogenerating name
          pathToFolder = join(pathToFolder, `${firstFileNameOnly}.br`);
          compress(pathToFolder);
        } else if (checkedFolder.isFile()) {
          if (pathToFile === pathToFolder) {
            console.log(
              "Operation failed. Please, don't compress the file into itself"
            );
          } else {
            compress(pathToFolder);
          }
        }
      } catch (err) {
        // No file or directory was found that was used as a second argument
        if (err !== "ENOENT") {
          compress(pathToFolder);
        } else {
          showError(err);
        }
      }
    } else {
      console.log(
        "Operation failed. Your are using path to directory as a first argument, not a path to a file"
      );
    }
  } catch (err) {
    showError(err);
  }
}

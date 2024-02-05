import os from "os";
import readline from "readline";
import path from "path";
import { join } from "path";
import fs from "fs/promises";

import listDirectoriesAndFiles from "./operations/ls.mjs";
import systemInfo from "./operations/sys-info.mjs";
import calcHash from "./operations/hash-calc.mjs";
import showError from "./operations/show-errors.mjs";
import createNewFile from "./operations/create-file.mjs";
import showCommands from "./operations/help.mjs";
import renameFile from "./operations/rename-file.mjs";
import removeFile from "./operations/remove-file.mjs";
import compressionHub from "./operations/compress.mjs";
import decompressionHub from "./operations/decompress.mjs";
import readFile from "./operations/read-file.mjs";
import copyMoveFile from "./operations/copy-move-file.mjs";

const usernameUnredacted = process.argv.slice(2).toString();
const startDirectory = os.homedir();
let currentDirectory = os.homedir();
let pathSeparator;
if (startDirectory.includes("\\")) {
  pathSeparator = "\\";
} else if (startDirectory.includes("/")) {
  pathSeparator = "/";
}
const singleLineCommands = ["ls", "up", "help"];
const oneArgumentCommands = ["cd", "cat", "add", "rm", "os", "hash"];
const multiArgumentsCommands = ["rn", "cp", "mv", "compress", "decompress"];

let greeting = 0;
let username;
let readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function setUsername() {
  if (usernameUnredacted.includes("--username=")) {
    username = usernameUnredacted.replace("--username=", "");
    console.log(`Welcome to the File Manager, ${username}!`);
  } else {
    console.log(
      `Please provide correct syntax with a username (e.g. npm run start -- --username=Student1)`
    );
  }
}
setUsername();

function showCurrentPath() {
  console.log(`You are currently in ${currentDirectory}`);
}

function interfaceIntroMessage() {
  if (greeting === 0) {
    showCurrentPath();
    greeting = 1;
  }
  return "Please print a command and wait for result\n";
}

function goodByeMessage() {
  console.log(`\nThank you for using File Manager, ${username}, goodbye!`);
}

async function checkExistence(filteredPath) {
  try {
    const testedPath = await fs.stat(filteredPath);

    if (testedPath.isDirectory()) {
      currentDirectory = filteredPath;
    } else {
      console.log(
        "Operation failed. You entered a path to a file, not a path to a directory"
      );
    }
  } catch (err) {
    showError(err);
  }
}

async function createNewPath(pathToCheck) {
  if (path.isAbsolute(pathToCheck) && pathToCheck !== pathSeparator) {
    if (pathToCheck[0] === pathSeparator) {
      return join(currentDirectory, pathToCheck);
    } else {
      return pathToCheck;
    }
  } else {
    return join(currentDirectory, pathToCheck);
  }
}

function userInteraction() {
  readlineInterface.question(interfaceIntroMessage(), async (text) => {
    text = path.normalize(text);

    const regex = /[^\s"]+|"([^"]*)"/gi;
    let match;
    const result = [];

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        // Argument in a quotes ("")
        result.push(match[1]);
      } else {
        // Arguments without quotes
        result.push(match[0]);
      }
    }

    const command = result[0] ? result[0].toString("").toLowerCase() : null;
    const argument1 = result[1] ? result[1].toString("") : null;
    const argument2 = result[2] ? result[2].toString("") : null;

    if (text.trim() === ".exit" || command === ".exit") {
      goodByeMessage();
      readlineInterface.close();
    } else {
      if (singleLineCommands.includes(command)) {
        if (command === "ls") {
          await listDirectoriesAndFiles(currentDirectory);
        } else if (command === "up") {
          if (
            path.resolve(currentDirectory) ===
            path.resolve(join(currentDirectory, `..${pathSeparator}`))
          ) {
            console.log(
              "Operation failed. You are already at the top directory"
            );
          } else {
            currentDirectory = join(currentDirectory, `..${pathSeparator}`);
          }
        } else if (command === "help") {
          showCommands();
        }
      } else if (oneArgumentCommands.includes(command)) {
        if (command === text.trim().toLowerCase() || !argument1) {
          console.log(
            `Operation failed. Your ${text.trim()} argument is empty`
          );
        } else {
          if (command === "cd") {
            await checkExistence(await createNewPath(argument1), command);
          } else if (command === "cat") {
            await readFile(await createNewPath(argument1), command);
            readFile;
          } else if (command === "add") {
            await createNewFile(await createNewPath(argument1));
          } else if (command === "rm") {
            await removeFile(await createNewPath(argument1));
          } else if (command === "os") {
            await systemInfo(argument1, startDirectory);
          } else if (command === "hash") {
            await calcHash(await createNewPath(argument1));
          }
        }
      } else if (multiArgumentsCommands.includes(command)) {
        if (!argument2) {
          console.log("Operation failed. Second argument is missing");
        } else {
          if (command === "rn") {
            if (argument2.includes(pathSeparator)) {
              console.log(
                "Operation failed. Second argument should be a new file name, not a path"
              );
            } else {
              await renameFile(await createNewPath(argument1), argument2);
            }
          } else if (command === "cp" || command === "mv") {
            await copyMoveFile(
              await createNewPath(argument1),
              await createNewPath(argument2),
              command
            );
          } else if (command === "compress") {
            await compressionHub(
              await createNewPath(argument1),
              await createNewPath(argument2)
            );
          } else if (command === "decompress") {
            await decompressionHub(
              await createNewPath(argument1),
              await createNewPath(argument2)
            );
          }
        }
      } else {
        console.log(
          "Invalid input. You can use help command for more information"
        );
      }
      showCurrentPath();
      userInteraction();
    }
  });
}

userInteraction();

readlineInterface.on("SIGINT", function () {
  goodByeMessage();
  readlineInterface.close();
});

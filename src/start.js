import os from "os";
import readline from "readline";
import path from "path";
import { join } from "path";
// import fs from "fs";
import fs from "fs/promises";
import { createReadStream } from "fs";
import { createWriteStream } from "fs";

const usernameUnredacted = process.argv.slice(2).toString();
const rootDirectory = os.homedir();
let currentDirectory = os.homedir();
let pathSeparator;
if (rootDirectory.includes("\\")) {
  pathSeparator = "\\";
} else if (rootDirectory.includes("/")) {
  pathSeparator = "/";
}
const singleLineCommands = ["ls", "up"];
const multiLineCommands = [
  "cd",
  "cat",
  "add",
  "rn",
  "cp",
  "mv",
  "rm",
  "os",
  "hash",
  "compress",
  "decompress",
];

let greeting = 0;
let username;
let readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (usernameUnredacted.includes("--username=")) {
  username = usernameUnredacted.replace("--username=", "");
  //   console.log(`Welcome to the File Manager, ${username}!`);
} else {
  //   console.log(
  //     `Please provide correct syntax with a username (e.g. npm run start -- --username=Student1)`
  //   );
}

function goUp() {
  currentDirectory = join(currentDirectory, `..${pathSeparator}`);
}

function goodByeMessage() {
  //   console.log(`Thank you for using File Manager, ${username}, goodbye!`);
}

function operationFailedMessage() {
  //   console.log("Operation failed");
}

async function checkExistence(filteredPath, functionName) {
  try {
    const testedPath = await fs.stat(filteredPath);

    if (testedPath.isDirectory()) {
      if (functionName === "cat") {
        console.log("You entered a path to a directory, not a path to a file");
      } else if (functionName === "cd") {
        currentDirectory = filteredPath;
      }
    } else {
      if (functionName === "cd") {
        console.log("You entered a path to a file, not a path to a directory");
      } else if (functionName === "cat") {
        return await readFile(filteredPath);
      }
    }
  } catch (err) {
    console.log("No such file or directory exists");
  }
}

async function createNewPath(pathToCheck) {
  if (path.isAbsolute(pathToCheck)) {
    return pathToCheck;
  } else {
    return join(currentDirectory, pathToCheck);
  }
}

async function checkPathType(newPath, functionName) {
  if (path.isAbsolute(newPath)) {
    const absolutePathLength = rootDirectory.length;
    const pathToCheck = newPath.slice(0, absolutePathLength);
    if (path.resolve(rootDirectory) !== path.resolve(pathToCheck)) {
      console.log(`Your absolute path must start with ${rootDirectory}`);
    } else {
      await checkExistence(newPath, functionName);
    }
  } else {
    await checkExistence(join(currentDirectory, newPath), functionName);
  }
}

async function listDirectoriesAndFiles() {
  class newListEntry {
    constructor(Name, Type) {
      this.Name = Name;
      this.Type = Type;
    }
  }

  try {
    const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
    const results = [];

    entries.forEach(async (entry) => {
      if (entry.isDirectory()) {
        results.push(new newListEntry(entry.name, "directory"));
      } else if (entry.isFile()) {
        results.push(new newListEntry(entry.name, "file"));
      }
    });

    results.sort((a, b) => {
      if (a.Type === b.Type) {
        return a.Name.localeCompare(b.Name);
      }
      return a.Type.localeCompare(b.Type);
    });

    console.table(results);
  } catch (error) {
    console.error("Ошибка при чтении содержимого директории", error);
  }
}

async function readFile(pathToFile) {
  const fileStream = createReadStream(pathToFile);
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

async function createNewFile(newFileName) {
  try {
    await fs.writeFile(join(currentDirectory, newFileName), "");
    console.log(`New file ${newFileName} was created`);
  } catch (err) {
    console.log(err);
  }
}

async function renameFile(oldName, newName) {
  let newCopyDirectory;
  let realOldName = oldName;
  if (oldName.includes(pathSeparator)) {
    newCopyDirectory = oldName.split(pathSeparator);
    realOldName = newCopyDirectory.pop();
    newCopyDirectory = newCopyDirectory.join(pathSeparator);
  } else {
    newCopyDirectory = currentDirectory;
  }

  try {
    await fs.access(join(currentDirectory, newCopyDirectory, newName));
    try {
      const newNameCheck = await fs.stat(
        join(currentDirectory, newCopyDirectory, newName)
      );
      if (newNameCheck.isFile()) {
        console.log(`${newName} already exists`);
      } else if (!newNameCheck.isFile()) {
        console.log(
          `${newName} already exists and ${newName} is a directory, not a file`
        );
      }
    } catch (err) {
      console.log(err);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      try {
        const oldNameCheck = await fs.stat(join(currentDirectory, oldName));
        if (oldNameCheck.isFile()) {
          fs.rename(
            join(currentDirectory, oldName),
            join(currentDirectory, newCopyDirectory, newName),
            (error) => {
              if (error) {
                console.log(error);
              }
            }
          );
          console.log(
            `File was successfully renamed from ${realOldName} to ${newName}`
          );
        } else {
          console.log(`${oldName} is a directory, not a file`);
        }
      } catch (err) {
        console.log(err);
        console.log(`${join(currentDirectory, oldName)} do not exist`);
      }
    } else {
      console.log(error);
    }
  }
}

async function copyMoveFile(oldFile, newLocation, command) {
  try {
    const newLocationChecked = await fs.stat(newLocation);

    if (newLocationChecked.isDirectory()) {
      try {
        const oldFileChecked = await fs.stat(oldFile);
        if (oldFileChecked.isFile()) {
          const fileName = path.win32.basename(oldFile);
          const fileStream = createReadStream(oldFile);
          const writeStream = createWriteStream(join(newLocation, fileName));
          fileStream.pipe(writeStream);
          return new Promise((resolve, reject) => {
            fileStream.on("end", async () => {
              console.log(
                `Copying file ${fileName} to ${newLocation} was successful`
              );
              if (command === "mv") {
                try {
                  await fs.unlink(oldFile);
                } catch (err) {
                  console.log(err);
                }
              }
              resolve();
            });

            fileStream.on("error", (error) => {
              reject(error);
            });
          });
        } else {
          console.log(`${oldFile} is a directory, not a file`);
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          console.log(`File that you are trying to copy does not exist`);
        } else {
          console.log(err);
        }
      }
    } else {
      console.log(`${newLocation} is not a directory`);
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(`The directory or a file do not exist at ${newLocation}`);
    } else {
      console.log(err); // Убрать потом
    }
  }
}

async function removeFile(pathToAfile) {
  try {
    const newLocationChecked = await fs.stat(pathToAfile);
    const fileName = path.win32.basename(pathToAfile);
    if (newLocationChecked.isFile()) {
      try {
        await fs.unlink(pathToAfile);
        console.log(`file ${fileName} was successfully removed`);
      } catch (err) {
        console.log(err);
      }
    } else if (newLocationChecked.isDirectory()) {
      console.log(`You are trying to remove a directory`);
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(`File that you are trying to remove does not exist`);
    } else {
      console.log(err);
    }
  }
}

function userInteraction() {
  readlineInterface.question(interfaceIntroMessage(), async (text) => {
    text = text
      .toLowerCase()
      .trimStart()
      .replaceAll("/", pathSeparator)
      .replaceAll("\\", pathSeparator);

    // Существует path.delimiter
    // Существует path.normalize(path)

    const regex = /[^\s"]+|"([^"]*)"/gi;
    let match;
    const result = [];

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        // Argument in a quotes ("")
        result.push(match[1]);
      } else {
        // Arguments without quotes ("")
        result.push(match[0]);
      }
    }

    const command = result[0] ? result[0].toString("") : null;
    const argument1 = result[1] ? result[1].toString("") : null;
    const argument2 = result[2] ? result[2].toString("") : null;

    if (text === ".exit") {
      goodByeMessage();
      readlineInterface.close();
    } else {
      if (
        command === text.trim() &&
        !singleLineCommands.includes(command) &&
        multiLineCommands.includes(command)
      ) {
        console.log(`Your ${text.trim()} path is empty`);
      } else if (command === "up") {
        if (path.resolve(rootDirectory) === path.resolve(currentDirectory)) {
          console.log("You are already at the top directory");
        } else {
          goUp();
        }
      } else if (command === "cd") {
        const path = text.slice(3, text.length);
        await checkPathType(path, "cd");
      } else if (command === "ls") {
        await listDirectoriesAndFiles();
      } else if (command === "cat") {
        const path = text.slice(4, text.length);
        await checkPathType(path, "cat");
      } else if (command === "add") {
        const fileName = text.slice(4, text.length);
        await createNewFile(fileName);
      } else if (command === "rn") {
        const oldName = argument1;
        const newName = argument2;
        if (newName.includes(pathSeparator)) {
          console.log(
            "Second argument should be a new file name, not a path with a file name"
          );
        } else if (argument1 && argument2) {
          await renameFile(oldName, newName);
        } else {
          console.log("Old or new name is missing");
        }
      } else if (command === "cp" || command === "mv") {
        const oldPath = argument1;
        const newPath = argument2;
        if (oldPath && newPath) {
          await copyMoveFile(
            await createNewPath(oldPath),
            await createNewPath(newPath),
            command
          );
        } else {
          console.log("Old or new path is missing");
        }
      } else if (command === "rm") {
        if (argument1) {
          await removeFile(await createNewPath(argument1));
        } else {
          console.log("Please enter a path to a file or a file name");
        }
      } else {
        // console.log("Invalid input");
        // showCurrentPath();
      }
      showCurrentPath();
      userInteraction();
    }
  });
}

function interfaceIntroMessage() {
  if (greeting === 0) {
    showCurrentPath();
    greeting = 1;
  }
  return "\n";
  // return "Please print commands and wait for result\n";
}

function showCurrentPath() {
  console.log(`You are currently in ${currentDirectory}`);
}

userInteraction();

readlineInterface.on("SIGINT", function () {
  goodByeMessage();
  readlineInterface.close();
});

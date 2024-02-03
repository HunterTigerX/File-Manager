import os from "os";
import readline from "readline";
import path from "path";
import { join } from "path";
// import fs from "fs";
import fs from "fs/promises";

const usernameUnredacted = process.argv.slice(2).toString();
const rootDirectory = os.homedir();
let currentDirectory = os.homedir();
let pathSeparator;
if (rootDirectory.includes("\\")) {
  pathSeparator = "\\";
} else if (rootDirectory.includes("/")) {
  pathSeparator = "/";
}

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

async function checkIfPathExists(newPath) {
  async function checkExistence(filteredPath) {
    try {
      const testedPath = await fs.stat(filteredPath);
      if (testedPath.isDirectory()) {
        currentDirectory = filteredPath;
      } else {
        console.log("You entered a path to a file, not a path to a directory");
      }
    } catch (err) {
      console.log("No such file or directory");
    }
  }

  if (path.isAbsolute(newPath)) {
    const absolutePathLength = rootDirectory.length;
    const pathToCheck = newPath.slice(0, absolutePathLength);

    if (path.resolve(rootDirectory) !== path.resolve(pathToCheck)) {
      console.log(`Your absolute path must start with ${rootDirectory}`);
    } else {
      await checkExistence(newPath);
    }
  } else {
    await checkExistence(join(currentDirectory, newPath));
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

function userInteraction() {
  readlineInterface.question(interfaceIntroMessage(), async (text) => {
    if (text === ".exit") {
      goodByeMessage();
      readlineInterface.close();
    } else {
      if (text === "up") {
        if (path.resolve(rootDirectory) === path.resolve(currentDirectory)) {
          console.log("You are already at the top of directory");
        } else {
          goUp();
        }
      } else if (text.slice(0, 3) === "cd ") {
        const path = text.slice(3, text.length);
        await checkIfPathExists(path);
      } else if (
        text.slice(0, 2) === "ls" &&
        text.replace(/\s/g, "") === "ls"
      ) {
        await listDirectoriesAndFiles();
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
  //   return "Please print commands and wait for result\n";
}

function showCurrentPath() {
  console.log(`You are currently in ${currentDirectory}`);
}

userInteraction();

readlineInterface.on("SIGINT", function () {
  goodByeMessage();
  readlineInterface.close();
});

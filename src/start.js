import os from "os";
import readline from "readline";
import path from "path";
import { join } from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import { createWriteStream } from "fs";
import { EOL } from "os";
import crypto from "crypto";
import zlib from "zlib";

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

if (usernameUnredacted.includes("--username=")) {
  username = usernameUnredacted.replace("--username=", "");
  //   console.log(`Welcome to the File Manager, ${username}!`);
} else {
  //   console.log(
  //     `Please provide correct syntax with a username (e.g. npm run start -- --username=Student1)`
  //   );
}

function showCommands() {
  console.log("Here is a list of commands that you can use");
  console.log("up");
  console.log("cd path_to_directory");
  console.log("ls");
  console.log("cat path_to_file");
  console.log("add new_file_name");
  console.log("rn path_to_file new_filename");
  console.log("cp path_to_file path_to_new_directory");
  console.log("mv path_to_file path_to_new_directory");
  console.log("rm path_to_file");
  console.log("os --EOL");
  console.log("os --cpus");
  console.log("os --homedir");
  console.log("os --username");
  console.log("os --architecture");
  console.log("hash path_to_file");
  console.log("compress path_to_file path_to_destination");
  console.log("decompress path_to_file path_to_destination");
  console.log(
    'default compress extention is ".br" if full path was not specified'
  );
}

function goUp() {
  currentDirectory = join(currentDirectory, `..${pathSeparator}`);
}

function goodByeMessage() {
  //   console.log(`Thank you for using File Manager, ${username}, goodbye!`);
}

function showError(err, todo) {
  if (err.code === "ENOENT" && todo === "copyMove") {
    console.log(
      `There is no such directory to copy to or you used a path to a file instead of a path to directory`
    );
  } else if (err.code === "ENOENT" && todo !== 'ignore') {
    console.log(`File or directory is missing`);
  } else {
    console.log(err);
  }
}



async function checkExistence(filteredPath, functionName) {
  
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
    showError(err);
  }
}

async function createNewPath(pathToCheck) {
  if (path.isAbsolute(pathToCheck) && pathToCheck !== pathSeparator) {
    return pathToCheck;
  } else {
    return join(currentDirectory, pathToCheck);
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
  } catch (err) {
    showError(err);
  }
}

async function createNewFile(newFileName) {
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
      console.log(`You are trying to create a directory, not a file`);
    } else {
      await writeFile();
    }
  } catch (err) {
    await writeFile();
    if (err.code !== "ENOENT") {
      console.log(err);
    }
  }
}

async function renameFile(oldFilePath, newName) {
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
          `You can't have a file without extention and a folder with the same name at the same time`
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
          console.log(`${newName} already exists`);
        } else if (newNameCheck.isDirectory()) {
          await rename(dirName, fileName);
        }
      } catch (err) {
        await rename(dirName, fileName);
        if (err.code !== "ENOENT") {
          showError(err, fileName);
        }
      }
    } else {
      console.log(`You are trying to rename a folder, not a file`);
    }
  } catch (err) {
    showError(err);
  }
}

async function copyMoveFile(oldFile, newLocation, command) {
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
            console.log("Are you trying to move a file to the same folder?");
          } else {
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
          console.log(`${newLocation} is not a directory`);
        }
      } catch (err) {
        showError(err, "copyMove");
      }
    } else {
      console.log(`${oldFile} is a directory, not a file`);
    }
  } catch (err) {
    showError(err);
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
        showError(err);
      }
    } else if (newLocationChecked.isDirectory()) {
      console.log(`You are trying to remove a directory`);
    }
  } catch (err) {
    showError(err);
  }
}

async function calcHash(filePath) {
  console.log(filePath);
  try {
    await fs.access(filePath);
    const content = await fs.readFile(filePath, "utf-8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    console.log(hash);
  } catch (err) {
    showError(err);
  }
}

async function systemInfo(argument) {
  if (argument === "--EOL") {
    if (EOL === "\r\n") {
      console.log("Your default system End-Of-Line is \\r\\n");
    } else if (EOL === "\r") {
      console.log("Your default system End-Of-Line is \\r");
    } else if (EOL === "\n") {
      console.log("Your default system End-Of-Line is \\n");
    }
  } else if (argument === "--cpus") {
    const cpuCores = os.cpus().length;
    console.log(`Total number of CPU's cores - ${cpuCores}`);
    os.cpus().map((core, index) => {
      console.log(
        `Core ${index + 1} name is ${core.model} and it's clock rate is ${
          Math.round(core.speed * 0.1) / 100
        }GHz`
      );
    });
  } else if (argument === "--homedir") {
    console.log(`Your home directory is ${startDirectory}`);
  } else if (argument === "--username") {
    console.log(
      `Your username is ${os.userInfo().username} and your machine name is ${
        os.hostname
      }`
    );
  } else if (argument === "--architecture") {
    console.log(`Your CPU architecture is ${process.arch}`);
  } else {
    console.log("wrong argument, type helf for the list of supported commands");
  }
}

async function compressionHub(pathToFile, pathToFolder) {
  function compress(output) {
    const streamInput = createReadStream(pathToFile);
    const streamOutput = createWriteStream(output);
    const gzip = zlib.createBrotliCompress();
    streamInput.pipe(gzip).pipe(streamOutput);
    console.log(`file was successfully compressed`)
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
          compress(pathToFolder);
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
        "Your are using path to directory as a first argument, not a path to a file"
      );
    }
  } catch (err) {
    showError(err);
  }
}

async function decompressionHub(pathToFile, pathToFolder) {
  function decompress(output) {
    const streamInput = createReadStream(pathToFile);
    const streamOutput = createWriteStream(output);
    const gunzip = zlib.createBrotliDecompress();
    streamInput.pipe(gunzip).pipe(streamOutput);
    console.log(`file was successfully decompressed`)
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
          pathToFolder = join(pathToFolder, `${firstFileNameOnly}.txt`);
          decompress(pathToFolder);
        } else if (checkedFolder.isFile()) {
          decompress(pathToFolder);
        }
      } catch (err) {
        // No file or directory was found that was used as a second argument
        if (err !== "ENOENT") {
          decompress(pathToFolder);
        } else {
          showError(err);
        }
      }
    } else {
      console.log(
        "Your are using path to directory as a first argument, not a path to a file"
      );
    }
  } catch (err) {
    showError(err);
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
        // Arguments without quotes ("")
        result.push(match[0]);
      }
    }

    const command = result[0] ? result[0].toString("").toLowerCase() : null;
    const argument1 = result[1] ? result[1].toString("") : null;
    const argument2 = result[2] ? result[2].toString("") : null;

    if (text === ".exit") {
      goodByeMessage();
      readlineInterface.close();
    } else {
      if (singleLineCommands.includes(command)) {
        if (command === "ls") {
          await listDirectoriesAndFiles();
        } else if (command === "up") {
          if (
            path.resolve(currentDirectory) ===
            path.resolve(join(currentDirectory, `..${pathSeparator}`))
          ) {
            console.log("You are already at the top directory");
          } else {
            goUp();
          }
        } else if (command === "help") {
          showCommands();
        }
      } else if (oneArgumentCommands.includes(command)) {
        if (command === text.trim().toLowerCase() || !argument1) {
          console.log(`Your ${text.trim()} argument is empty`);
        } else {
          if (command === "cd" || command === "cat") {
            await checkExistence(await createNewPath(argument1), command);
          } else if (command === "add") {
            await createNewFile(await createNewPath(argument1));
          } else if (command === "rm") {
            await removeFile(await createNewPath(argument1));
          } else if (command === "os") {
            await systemInfo(argument1);
          } else if (command === "hash") {
            await calcHash(await createNewPath(argument1));
          }
        }
      } else if (multiArgumentsCommands.includes(command)) {
        if (!argument2) {
          console.log("Second argument is missing");
        } else {
          if (command === "rn") {
            // peredelat
            if (argument2.includes(pathSeparator)) {
              console.log(
                "Second argument should be a new file name, not a path with a file name"
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
        console.log("Invalid input");
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
  // return "Please print a command and wait for result\n";
}

function showCurrentPath() {
  console.log(`You are currently in ${currentDirectory}`);
}

userInteraction();

readlineInterface.on("SIGINT", function () {
  goodByeMessage();
  readlineInterface.close();
});

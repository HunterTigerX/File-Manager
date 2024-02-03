import os from "os";
import readline from "readline";
// import fs from "fs";

const usernameUnredacted = process.argv.slice(2).toString();
let currentDirectory = os.homedir();

let greeting = 0;
let username;
let readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (usernameUnredacted.includes("--username=")) {
  username = usernameUnredacted.replace("--username=", "");
  console.log(`Welcome to the File Manager, ${username}!`);
} else {
  console.log(
    `Please provide correct syntax with a username (e.g. npm run start -- --username=Student1)`
  );
}

function goodByeMessage() {
  console.log(`Thank you for using File Manager, ${username}, goodbye!`);
}

function operationFailedMessage() {
  console.log("Operation failed");
}

function userInteraction() {
  readlineInterface.question(interfaceIntroMessage(), (text) => {
    if (text === ".exit") {
      goodByeMessage();
      readlineInterface.close();
    } else {
      if (text === "testCommand") {
      } else {
        console.log("Invalid input");
      }
      userInteraction();
    }
  });
}

function interfaceIntroMessage() {
  if (greeting === 0) {
    showCurrentPath();
    greeting = 1;
  }
  return "Please print commands and wait for result\n";
}

function showCurrentPath() {
  console.log(`You are currently in ${currentDirectory}`);
}

userInteraction();

readlineInterface.on("SIGINT", function () {
  goodByeMessage();
  readlineInterface.close();
});

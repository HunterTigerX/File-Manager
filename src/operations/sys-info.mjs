import os from "os";
import { EOL } from "os";

export default async function systemInfo(argument, startDirectory) {
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
    console.log(
      "Operation failed. Wrong argument, type help for the list of supported commands"
    );
  }
}

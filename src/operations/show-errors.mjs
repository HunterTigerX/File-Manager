export default function showError(err, todo) {
  if (err.code === "Z_BUF_ERROR" && todo === "decompression") {
    console.log(
      "Operation failed. Maybe you are trying to decompress the uncompressed file."
    );
  } else if (
    (err.code === "ERR_PADDING_1" || err.code === "ERR_PADDING_2") &&
    todo === "decompression"
  ) {
    console.log(
      "Operation failed. Maybe you compressed file but something inside it was changed after compression or this file was compressed, then decompressed and was not compressed after that."
    );
  } else if (err.code === "ENOENT" && todo === "copyMove") {
    console.log(
      `Operation failed. There is no such directory to copy to or you used a path to a file instead of a path to directory`
    );
  } else if (
    err.code === "ENOENT" &&
    todo !== "copyMove" &&
    todo !== "ignore"
  ) {
    console.log(`Operation failed. File or directory is missing.`);
  } else if (err.code === "EISDIR" && todo === "hash") {
    console.log("Operation failed. Are you trying to hash a directory?");
  } else if (err.code === "EPERM") {
    console.log(
      `Operation failed. The file is probably protected and you don't have enough permissions.`
    );
  } else if (err.code !== "ENOENT") {
    console.log(`Operation failed. ${err}`);
  }
}

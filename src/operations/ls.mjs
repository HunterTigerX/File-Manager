import fs from "fs/promises";
import showError from "./show-errors.mjs";

export default async function listDirectoriesAndFiles(currentDirectory) {
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
    // return Promise.resolve(console.table(results));
  } catch (err) {
    showError(err);
  }
}

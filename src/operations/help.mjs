export default function showCommands() {
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
    'If compressed extension was not specified and there are folder with the same name, extension ".br" would be used'
  );
}

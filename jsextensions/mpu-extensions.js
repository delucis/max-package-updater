/*
  mpu-extensions.js
  doesn’t do much — posts package information Max window on startup
*/

// post package details to Max window on startup
var mpu = new packageInfo();
post("\n" + mpu.name + ", v" + mpu.version);
post("\n     ", mpu.author, "\n");
post("\n     ", mpu.dir, "\n");

function packageInfo() {
  // get path to this package
  var thisFile = new File("mpu-extensions.js");
  var regex = /([^\/\\]*)$/i;
  var packageDir = thisFile.foldername.replace(regex, '');
  // load package.json to retrieve details
  var packageInfo = new Dict;
  packageInfo.import_json(packageDir + "package.json");
  // export package information as variables
  this.dir = packageDir;
  this.name = packageInfo.get("name");
  this.version = packageInfo.get("version");
  this.author = packageInfo.get("author");
}

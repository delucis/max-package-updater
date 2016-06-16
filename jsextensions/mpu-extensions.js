/*
  mpu-extensions.js
  doesn’t do much — posts package information Max window on startup
*/

autowatch = 1;

// post package details to Max window on startup
var lPinfo = new localPackageInfo();
var rPinfo = new remotePackage(lPinfo);
post("\n" + lPinfo.name + ", v" + lPinfo.version);
post("\n     ", lPinfo.author, "\n");
post("\n     ", lPinfo.dir, "\n");


/**
* localPackageInfo()
* returns an object with information from local package.json
*
* usage:
* var o = new localPackageInfo();
*
* o.author   = (string)  author information from package.json
* o.dict     = (dict)    dictionary containing entire contents of package.json
* o.dir      = (string)  absolute path to local package directory
* o.name     = (string)  local package name
* o.version  = (string)  local package version
*
*/
function localPackageInfo() {
  // get path to this package
  var thisFile = new File("mpu-extensions.js");
  var regex = /([^\/\\]*)$/i;
  var packageDir = thisFile.foldername.replace(regex, "");
  // load package.json to retrieve details
  var localPackageInfo = new Dict;
  localPackageInfo.import_json(packageDir + "package.json");
  // export package information as variables
  this.dir = packageDir;
  this.name = localPackageInfo.get("name");
  this.version = localPackageInfo.get("version");
  this.author = localPackageInfo.get("author");
  this.dict = localPackageInfo;
}

/**
* remotePackageInfo(response)
* returns an object with information from remote package.json
*
* arguments:
* response   = (object)  a response object handed off from requestRemotePackage()
*
* usage:
* var o = new remotePackageInfo(response);
*
* o.author   = (string)  author information from remote package.json
* o.dict     = (dict)    dictionary containing entire contents of remote package.json
* o.name     = (string)  remote package name
* o.version  = (string)  remote package version
*
*/
function remotePackageInfo(response) {
  // Make sure server responded with valid JSON
  try { JSON.parse(response); }
	catch (e) {
		error("Error: server response is not JSON...");
		return false;
	}
  // parse server response into dictionary
  var remotePackageInfo = new Dict;
  remotePackageInfo.parse(response);
  this.name = remotePackageInfo.get("name");
  this.version = remotePackageInfo.get("version");
  this.author = remotePackageInfo.get("author");
  this.dict = remotePackageInfo;
}

/**
* requestRemotePackage(localPackageInfo, request, callback)
* request a remote package.json
*
* arguments:
* localPackageInfo  = (object)    as returned by localPackageInfo()
* request           = (string)    variable name to hold our request
* callback          = (function)  handle the server response
*
* usage:
* requestRemotePackage(localPackageInfo, function() {
*   // handle response
* });
*
*/
function requestRemotePackage(localPackageInfo, callback) {
  // make sure a callback function is provided
  if (!callback || typeof callback !== "function") {
    error("Error: no callback function defined for requestRemotePackage()...");
    return false;
  }
  // figure out what URL to query based on local package.json
  var packageInfoURL = getPackageInfoURL(localPackageInfo);
  if (packageInfoURL) {
    // create new request object
    request = new XMLHttpRequest();
    // request the URL of the remote package.json
    request.open("GET", packageInfoURL);
    // set callback function
    request.onreadystatechange = callback;
    // trigger request
    request.send();
  } else {
    return false;
  }
}

/**
* getPackageInfoURL(localPackageInfo)
* returns a string containing the URL to a remote package.json by parsing
* local package.json for “package-info” and “repository” fields
*
* arguments:
* localPackageInfo  = (object) as returned by localPackageInfo()
*
* usage:
* var localInfo = new localPackageInfo();
* var repoURL = getPackageInfoURL(localInfo);
* => https://raw.githubusercontent.com/username/reponame/master/package.json
*
* s          = (string)   URL of package.json resource
*            = (boolean)  false if synthesis not possible
*
*/
function getPackageInfoURL(localPackageInfo) {
  // retrieve data from local package.json
  var repositoryField = localPackageInfo.dict.get("repository");
  var packageInfoField = localPackageInfo.dict.get("package-info");
  // initialise variables
  var repositoryString = null;
  var packageInfoURL = null;

  if (packageInfoField) {
    // process "package-info" field in package.json
    if (typeof packageInfoField === "string") {
      // if "package-info" field is a string, use it as the remote package.json URL
      packageInfoURL = packageInfoField;
    } else {
      error("Error: package.json “package-info” field is not a string...\n");
      return false;
    }
  }
  else if (repositoryField) {
    // process "repository" field in package.json
    if (typeof repositoryField === "string") {
      // if "repository" field in package.json is a simple string
      repositoryString = repositoryField;
    } else if (repositoryField.get("url") && typeof repositoryField.get("url") === "string") {
      // if "repository" field is an object with a "url" property that is a string
      repositoryString = repositoryField.get("url");
    } else {
      // otherwise (for now) shrug and give up
      error("Error: package.json “repository” field is neither a string nor contains a url field...\n");
      return false;
    }
    // format URL from repository field content
    packageInfoURL = synthesisePackageInfoURL(repositoryString);
  }
  else {
    // if no "repository" field is found in package.json
    error("Error: package.json doesn’t contain a “repository” field...\n");
    return false;
  }

  if (packageInfoURL) {
    if (validateURL(packageInfoURL)) {
      // if the synthesised or retrieved URL is valid, return it
      return packageInfoURL;
    } else {
      // if packageInfoURL is not a valid URL, return false
      error("Error:", packageInfoURL, "is not a valid URL...\n");
      return false;
    }
  }
  else {
    error("Error: packageInfoURL is undefined...\n")
    return false;
  }
}

/**
* synthesisePackageInfoURL(repositoryString)
* returns a string containing the URL to a remote repository’s package.json
*
* arguments:
* repositoryString  = (string)  can be shorthand, e.g. “username/reponame”,
*                               or longer git URL, e.g.
*                               “https://github.com/username/reponame.git”
*
* usage:
* var myRepo = 'username/reponame';
* var s = synthesisePackageInfoURL(myRepo);
* => https://raw.githubusercontent.com/username/reponame/master/package.json
*
* s          = (string)   URL of package.json resource
*            = (boolean)  false if synthesis not possible
*
*/
function synthesisePackageInfoURL(repositoryString) {
  if (typeof repositoryString !== "string" || repositoryString === null) {
    error("Error: formatRepositoryString() expects argument to be of type string...")
    return false;
  }
  // patterns to match
  var gitRepoRegX = new RegExp("^([A-Z0-9\-_]+)\/([A-Z0-9\-_]+)$", "i");
  var gitURLRegX = new RegExp("^(?:(?:git\\+)?https?:\/\/(?:www\.)?github\.com\/([A-Z0-9\-_]+\/[A-Z0-9\-_]+)(?:\/|.git)?)$", "i");
  // variable to hold username/repository slug
  var repoSlug = null;

  if (gitRepoRegX.test(repositoryString)) {
    // if string is in "username/repository" GitHub format
    repoSlug = repositoryString;
  } else if (gitURLRegX.test(repositoryString)) {
    // if string is a GitHub URL from which we can retrieve a "username/repository" slug
    repoSlug = repositoryString.match(gitURLRegX)[1];
  } else {
    // (for now) if neither a github.com URL nor repository slug, throw error
    error("Error: package.json “repository” field could not be parsed...\n");
    return false;
  }

  var gitHubURL = "https://raw.githubusercontent.com/" + repoSlug + "/master/package-info.json";
  return gitHubURL;
}

/**
* validateURL(url)
* returns true if provided string is a valid URL
*
* arguments:
* url        = (string)
*
* usage:
* var myURL = "https://bitly.com/";
* var b  = validateURL(myURL);
* => true
*
* b          = (boolean)  true if valid URL, otherwise false
*
*/
function validateURL(url) {
  if (typeof url !== "string" || url === null) {
    error("Error: validateURL() expects argument to be of type string...")
    return false;
  }
  // Regular Expression for URL validation by Diego Perini. License: MIT
  // https://gist.github.com/dperini/729294
  var urlRegX = new RegExp("^(?:(?:https?|ftp)://)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$", "i");
  return urlRegX.test(url);
}

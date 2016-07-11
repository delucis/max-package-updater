/*
  mpu-extensions.js
  doesn’t do much — posts package information Max window on startup
*/

autowatch = 1;

// initialise Mgraphics
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

// post package details to Max window on startup
var lPinfo = new localPackageInfo();
post("\n" + lPinfo.name + ", v" + lPinfo.version);
post("\n     ", lPinfo.author, "\n");
post("\n     ", lPinfo.dir, "\n");

// initialise request/remote package variables
var rPinfo;
var request;

// request remote package information
function checkForUpdates() {
  requestRemotePackage(lPinfo, function () {
    rPinfo = new remotePackageInfo(request.response);
    if (validateRemotePackageInfo(lPinfo, rPinfo)) {
      // compare versions (or pass function)
      if (isUpdateAvailable(lPinfo, rPinfo)) {
        button.instances.current = button.instances.installUpdate;
        post("An update is available!");
      } else {
        button.instances.current = button.instances.checkUpToDate;
        post("Your package is up-to-date.");
      }
    } else {
      error("Error: failed to retrieve remote package.json...\n");
    }
    mgraphics.redraw();
  });
}

// variables for use in mgraphics
var MPU = new Object;
var margins = {
  x:        30,
  y:        20
}
var colors = {
  bg:       [1.,    1.,    1.,    1.],
  reverse:  [1.,    1.,    1.,    1.],
  text:     [0.15,  0.15,  0.15,  1.],
  success:  [0.54,  0.75,  0.38,  1.],
  info:     [0.33,  0.54,  0.73,  1.],
  neutral:  [0.88,  0.88,  0.88,  1.],
  danger:   [0.82,  0.41,  0.42,  1.]
}
var fontFamily = {
  light:    "Lato Regular",
  regular:  "Lato Semibold",
  bold:     "Lato Heavy"
}
var fontSizes = {
  h1:       "28",
  h2:       "15",
  p:        "14"
}
var button = new Button([margins.x, 150, 285, 45]);

function paint() {
  // draw package name heading
  drawH1(lPinfo.name ? lPinfo.name : "<unknown>", [0, 0]);
  // draw "local version" subheading
  drawH2("local version", [0, 60]);
  // draw local version number
  drawP(lPinfo.version ? lPinfo.version : "<unknown>", [0, 90]);
  // draw remote version number, if known
  if (rPinfo && rPinfo.version) {
    drawH2("remote version", [155, 60]);
    drawP(rPinfo.version, [155, 90]);
  }
  // draw button
  drawButton(button);
}

function drawH1(text, pos) {
  drawText(text, pos, fontFamily.bold, fontSizes.h1, colors.text);
}

function drawH2(text, pos) {
  drawText(text, pos, fontFamily.light, fontSizes.h2, colors.info);
}

function drawP(text, pos) {
  drawText(text, pos, fontFamily.regular, fontSizes.p, colors.text);
}

function drawText(text, pos, font, size, color) {
  mgraphics.select_font_face(font);
  mgraphics.set_font_size(size);
  mgraphics.move_to(margins.x + pos[0], margins.y + pos[1] + mgraphics.font_extents()[0]);
  mgraphics.set_source_rgba(color);
  mgraphics.text_path(text);
  mgraphics.fill();
}

/**
* drawButton(btn)
* paint the call-to-action button using Mgraphics from a
* button object generated using Button()
*
* arguments:
* btn               = (object)  button object generated with Button()
*
* usage:
* myButton = new Button([20, 150, 285, 45]);
* drawButton(myButton);
* => renders the button in its current state in the JSUI object
*
*/
function drawButton(btn) {
  // Move text down 1 pixel and lighten background colour on mouse hover
  var textOffset;
  if (btn.state === 1) {
    btn.instances.current.background[3] = 0.8;
    textOffset = 1;
  } else {
    btn.instances.current.background[3] = 1.;
    textOffset = 0;
  }
  // Draw button rectangle
  mgraphics.set_source_rgba(btn.instances.current.background);
  mgraphics.rectangle(btn.rect);
  mgraphics.fill();
  // Draw button text
  mgraphics.select_font_face(fontFamily.bold);
  mgraphics.set_font_size(fontSizes.p);
  // Calculate text position
  var Xcoord = margins.x + (btn.rect[2] / 2) - (mgraphics.text_measure(btn.instances.current.text)[0] / 2);
  var Ycoord = margins.y + btn.rect[1] + (mgraphics.font_extents()[0] / 2) + textOffset;
  mgraphics.move_to(Xcoord, Ycoord);
  mgraphics.set_source_rgba(btn.instances.current.color);
  mgraphics.text_path(btn.instances.current.text);
  mgraphics.fill();
}

/**
* Button(rect, [currentInstance])
* returns a javascript object with properties that define the main
* call-to-action button
*
* arguments:
* rect              = (array)   [x, y, width, height] defining button rectangle
* currentInstance   = (string)  member of this.instances that is active (optional)
*
* usage:
* button = new Button([20, 150, 285, 45]);
* button => {
*   rect: [20, 150, 285, 45],
*   state: 0,
*   instances: {
*     // series of instances created using buttonInstance()
*     ...
*     // `instances.current` is set to `instances.checkForUpdates` by default.
*     current: {
*       text: "Check for updates",
*       color: [1, 1, 1, 1],
*       background: [0.33,  0.54,  0.73,  1.],
*       action: checkForUpdates,
*       enabled: true
*     }
*   }
* }
*
*/
function Button(rect, currentInstance) {
  this.rect = rect;
  this.state = 0;
  this.instances = new Object();
  this.instances.checkForUpdates = new buttonInstance(
    "Check for updates",
    colors.reverse,
    colors.info,
    checkForUpdates
  );
  this.instances.checkingForUpdates = new buttonInstance(
    "Checking for updates...",
    colors.text,
    colors.neutral
  );
  this.instances.checkUpToDate = new buttonInstance(
    "Your package is up to date!",
    colors.text,
    colors.neutral
  );
  this.instances.checkFailed = new buttonInstance(
    "Couldn’t check for updates… Try again?",
    colors.reverse,
    colors.danger,
    checkForUpdates
  );
  this.instances.installUpdate = new buttonInstance(
    "Install update",
    colors.reverse,
    colors.success,
    installUpdate
  );
  this.instances.installingUpdate = new buttonInstance(
    "Installing update...",
    colors.text,
    colors.neutral
  );
  this.instances.installSucceeded = new buttonInstance(
    "Update installed!",
    colors.text,
    colors.neutral
  );
  this.instances.installFailed = new buttonInstance(
    "Update installation failed…",
    colors.reverse,
    colors.danger
  );
  if (currentInstance && this.instances[currentInstance]) {
    this.instances.current = this.instances[currentInstance];
  } else {
    this.instances.current = this.instances.checkForUpdates;
  }
}

/**
* buttonInstance(text, color, background, [action])
* returns a javascript object with properties that define an instance
* of the main call-to-action button
*
* arguments:
* text              = (string)    text to be displayed on the button
* color             = (array)     RGBA colour definition for button text
* background        = (array)     RGBA colour definition for button background
* action [optional] = (function)  function that is called on click
*
* usage:
* myButton = new buttonInstance("I’m a button!", [0, 0, 0, 1], [0.5, 1, 0.5, 1], clickFunction);
* myButton => {
*   text: "I’m a button!",
*   color: [0, 0, 0, 1],
*   background: [0.5, 1, 0.5, 1],
*   action: clickFunction,
*   enabled: true
* }
*
* The `enabled` property is set to true if an `action` is provided, false if not.
*
*/
function buttonInstance(text, color, background, action) {
  this.text = text;
  this.color = color;
  this.background = background;
  if (action) {
    this.action = action;
    this.enabled = true;
  } else {
    this.enabled = false;
  }
}

/**
* isOnButton(x, y, btn)
* returns true if point [x, y] is within the bounds of the Button() provided
* as the the third argument (specifically reads from btn.rect)
*
* arguments:
* x                 = (number)    X co-ordinate of point to test
* y                 = (number)    Y co-ordinate of point to test
* btn               = (object)    button object as created by Button()
*
* usage:
* isOnButton(10, 10, Button([0, 0, 245, 45]));
* => true
* isOnButton(300, 300, Button([0, 0, 245, 45]));
* => false
*
*/
function isOnButton(x, y, btn) {
  var inXBounds = (x >= btn.rect[0]) && (x <= btn.rect[0] + btn.rect[2]);
  var inYBounds = (y >= btn.rect[1]) && (y <= btn.rect[1] + btn.rect[3]);
  return inXBounds && inYBounds;
}

/**
* JSUI MOUSE INTERACTION EVENTS
*
* onidle(), onclick(), ondrag()
* handle interaction with the call-to-action button.
*
*/
function onidle(x, y) {
  if (isOnButton(x, y, button) && button.state !== 1 && button.instances.current.enabled) {
    // when mouse first hovers over button
    button.state = 1;
    mgraphics.redraw();
    post(button.state, "\n");
  } else if (button.state !== 0) {
    // when mouse first leaves button
    button.state = 0;
    mgraphics.redraw();
    post(button.state, "\n");
  }
}
function onclick(x, y) {
  if (isOnButton(x, y, button) && button.state !== 2 && button.instances.current.enabled) {
    // when mouse first clicks on button
    button.state = 2;
    if (button.instances.current.action === checkForUpdates) {
      button.instances.current.action();
      button.instances.current = button.instances.checkingForUpdates;
    } else if (button.call === installUpdate) {
      button.instances.current.action();
      button.instances.current = button.instances.installingUpdate;
    }
    mgraphics.redraw();
    post(button.state, "\n");
  } else if (button.state !== 0) {
    // when click is not on the button
    button.state = 0;
    mgraphics.redraw();
    post(button.state, "\n");
  }
}
function ondrag(x, y, click) {
  if (isOnButton(x, y, button) && click === 1 && button.state !== 2 && button.instances.current.enabled) {
    // when mouse first clicks on button
    button.state = 2;
    mgraphics.redraw();
    post(button.state, "\n");
  } else if (click === 0 && button.state !== 0) {
    // when mouse finishes clicking (on mouse up)
    button.state = 0;
    mgraphics.redraw();
    post(button.state, "\n");
  }
}

function installUpdate() {
  post("Installing update...\n");
}

/**
* validateRemotePackageInfo(localPackageInfo, remotePackageInfo)
* returns true if remote package is defined, specifies the same name as the
* local package, and contains a version field
*
* arguments:
* localPackageInfo  = (object)  as returned by localPackageInfo()
* remotePackageInfo = (object)  as returned by remotePackageInfo(response)
*
* usage:
* if(validateRemotePackageInfo(localPackageInfo, remotePackageInfo)) {
*   // operate on valid package
* } else {
*   // throw invalid package error
* }
*
*/
function validateRemotePackageInfo(localPackageInfo, remotePackageInfo) {
  if (typeof remotePackageInfo === 'undefined' || remotePackageInfo === null) {
    error("Error: remote package undefined...\n");
    return false;
  } else if (remotePackageInfo.name !== localPackageInfo.name) {
    error("Error: the remote package’s name, ‘" + remotePackageInfo.name + "’, does not match the local package ‘" + lPinfo.name + "’...\n");
    return false;
  } else if (!remotePackageInfo.version) {
    error("Error: remote package.json doesn’t contain a version field...\n");
    return false;
  } else {
    return true;
  }
}

/**
* isUpdateAvailable(localPackageInfo, remotePackageInfo)
* returns true if remote package version is greater than that of local package
*
* arguments:
* localPackageInfo  = (object)  as returned by localPackageInfo()
* remotePackageInfo = (object)  as returned by remotePackageInfo(response)
*
* usage:
* if(isUpdateAvailable(localPackageInfo, remotePackageInfo)) {
*   // celebrate! an update is available
* }
*
*/
function isUpdateAvailable(localPackageInfo, remotePackageInfo) {
  var localVersion = new SemVer(localPackageInfo.version);
  var remoteVersion = new SemVer(remotePackageInfo.version);
  if (remoteVersion.major > localVersion.major) {
    return true;
  } else if (remoteVersion.major === localVersion.major && remoteVersion.minor > localVersion.minor) {
    return true;
  } else if (remoteVersion.major === localVersion.major && remoteVersion.minor === localVersion.minor && remoteVersion.patch > localVersion.patch) {
    return true;
  } else {
    return false;
  }
}

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
  var thisFileName = jsarguments[0];
  var thisFile = new File(thisFileName);
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
		error("Error: server response is not JSON...\n");
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
    error("Error: no callback function defined for requestRemotePackage()...\n");
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
  var packageInfoField = localPackageInfo.dict.get("config::mpu::package-info");
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
    error("Error: packageInfoURL is undefined...\n");
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
    error("Error: formatRepositoryString() expects argument to be of type string...");
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

  var gitHubURL = "https://raw.githubusercontent.com/" + repoSlug + "/master/package.json";
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
    error("Error: validateURL() expects argument to be of type string...");
    return false;
  }
  // Regular Expression for URL validation by Diego Perini. License: MIT
  // https://gist.github.com/dperini/729294
  var urlRegX = new RegExp("^(?:(?:https?|ftp)://)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$", "i");
  return urlRegX.test(url);
}

/**
* SemVer(version)
* returns an object with details of a semantic version number
*
* arguments:
* version     = (string)
*
* usage:
* var myPackageVersion = 'v0.7.9-beta';
* var sv = new SemVer(myPackageVersion);
*
* sv.version  = (string) '0.7.9'
* sv.major    = (number)  0
* sv.minor    = (number)  7
* sv.patch    = (number)  9
*
*/
function SemVer(version) {
  if (typeof version !== 'string') {
    error("Error: cleanSemVer() needs a string to operate on...\n");
    return false;
  }
  // match valid semantic version strings (based on the LOOSE regular expression in npm/node-semver)
  var semVerRegX = new RegExp("^[v=\\s]*([0-9]+)\\.([0-9]+)\\.([0-9]+)(?:-?((?:[0-9]+|\\d*[a-zA-Z-][a-zA-Z0-9-]*)(?:\\.(?:[0-9]+|\\d*[a-zA-Z-][a-zA-Z0-9-]*))*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$");
  // remove any surrounding whitespace from version string, and test against regular expression
  var v = version.trim().match(semVerRegX);
  if (!v) {
    console.error("Error: ‘" + v + "’ could not be parsed as a semantic version...\n");
    return false;
  }
  this.major = +v[1];
  this.minor = +v[2];
  this.patch = +v[3];
  this.version = this.major + '.' + this.minor + '.' + this.patch;
}

/*
  isURL.js
  test whether a string is a valid URL
  Chris Swithinbank <swithinbank@gmail.com> http://www.chrisswithinbank.net
*/

autowatch = 1;

inlets = 1;
outlets = 1;
setinletassist(0, "symbol to be validated as a URL");
setoutletassist(0, "boolean result: 1 = valid URL; 0 = not valid");

// Regular Expression for URL validation
//
// Author: Diego Perini
// Updated: 2010/12/05
// License: MIT
//
// https://gist.github.com/dperini/729294
//
var pattern = new RegExp(
  "^" +
    // protocol identifier
    "(?:(?:https?|ftp)://)" +
    // user:pass authentication
    "(?:\\S+(?::\\S*)?@)?" +
    "(?:" +
      // IP address exclusion
      // private & local networks
      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
    "|" +
      // host name
      "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
      // domain name
      "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
      // TLD identifier
      "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
      // TLD may end with dot
      "\\.?" +
    ")" +
    // port number
    "(?::\\d{2,5})?" +
    // resource path
    "(?:[/?#]\\S*)?" +
  "$", "i"
);

// Test any input against
function anything() {
  if (arguments.length > 0 && messagename !== 'msg_int' && messagename !== 'msg_float' && messagename !== 'list') {
    error("Warning: the string provided contains a space...\nOnly testing: “" + messagename + "”");
  }
  outlet(0, pattern.test(messagename));
}

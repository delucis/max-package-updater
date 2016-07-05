inlets = 1;
outlets = 1;

/*
* MaxUnzip()
*/
(function (GLOBAL) {
  var MaxUnzip = function (argument) {
    if (typeof argument === "string") {
      var fileObj = new File(argument);
      this.File = new MaxUnzip.FileClass(fileObj);
    } else if (typeof argument === "object") {
      this.File = new MaxUnzip.FileClass(argument);
    } else {
      return;
    }
  }
  GLOBAL.MaxUnzip = MaxUnzip;
  MaxUnzip.LOCAL_SIG = 0x04034b50;
  MaxUnzip.DIRECTORY_SIG = 0x02014b50;
  MaxUnzip.EXTENDED_SIG = 0x08074b50;

  MaxUnzip.prototype = {
    printHeaders: function () {
      this.indexHeaders();
      if (this.local) {
        post("Local header count:", this.local.length, "\n");
      }
      if (this.directory) {
        post("Directory headers at:", this.directory, "\n");
      }
    },

    indexHeaders: function () {
      this.local = [];
      this.directory = [];
      var eof = this.File.getBytesSize();
      for (var i = 0; i < eof; i++) {
        var n = this.File.getByteRangeAsNumber(i, 4);
        if (n === MaxUnzip.LOCAL_SIG) {
          // Build local file object, parsing header.
          var entry = new Object();
          entry.index = i;
          entry.signature = n;

          entry.versionNeeded = this.File.getNextBytesAsNumber(2);
          entry.bitFlag = this.File.getNextBytesAsNumber(2);
          entry.compressionMethod = this.File.getNextBytesAsNumber(2);
          entry.timeBlob = this.File.getNextBytesAsNumber(4);

          entry.crc32 = this.File.getNextBytesAsNumber(4);
          entry.compressedSize = this.File.getNextBytesAsNumber(4);
          entry.uncompressedSize = this.File.getNextBytesAsNumber(4);

          entry.fileNameLength = this.File.getNextBytesAsNumber(2);
          entry.extraFieldLength = this.File.getNextBytesAsNumber(2);
          entry.fileName = this.File.getNextBytesAsString(entry.fileNameLength);
          entry.extra = this.File.getNextBytesAsString(entry.extraFieldLength);

          // Check if ZIP is using trailing data descriptor (extended header)
          // to specify CRC-32, compressed size, and uncompressed size
          if ((entry.bitFlag & 0x0008) === 0x0008) {
            entry.usingDataDescriptor = true;
            // Save current read position in file
            var readPosition = this.File.getByteIndex();
            // Loop forward through bytes, to find extended header signature
            for ( ; i < eof; i++) {
              n = this.File.getByteRangeAsNumber(i, 4);
              if (n === MaxUnzip.EXTENDED_SIG) {
                entry.crc32 = this.File.getNextBytesAsNumber(4);
                entry.compressedSize = this.File.getNextBytesAsNumber(4);
                entry.uncompressedSize = this.File.getNextBytesAsNumber(4);
                break;
              }
            }
            // Reset read position to end of local header/start of file data.
            this.File.setByteIndex(readPosition);
          } else {
            entry.usingDataDescriptor = false;
          }

          // Read compressed data.
          entry.data = this.File.getNextBytesAsString(entry.compressedSize);

          // Add entry object to array of local files
          this.local.push(entry);

          // Move loop counter to end of file data.
          i = this.File.getByteIndex() - 1;
        } else if (n === MaxUnzip.DIRECTORY_SIG) {
          this.directory.push(i);
          i += 45;
        }
      }
    },

    isZipFile: function () {
      return this.File.getByteRangeAsNumber(0, 4) === MaxUnzip.LOCAL_SIG;
    }
  }

  MaxUnzip.FileClass = function (FileObj) {
    this.File = FileObj;
    this.resetByteIndex();
  }

  MaxUnzip.FileClass.prototype = {
    getBytesSize: function () {
      return this.File.eof;
    },

    resetByteIndex: function () {
      this.setByteIndex(0);
    },

    setByteIndex: function (index) {
      this.File.position = index;
    },

    getByteIndex: function () {
      return this.File.position;
    },

    shiftByteIndex: function (steps) {
      setByteIndex(getByteIndex() + steps);
    },

    getNextBytesAsNumber: function (steps) {
      // return 16- or 32-bit integer depending on step-size
      switch (steps) {
        case 4:
          // one step is 8-bits, so 4 steps = 32-bit
          return this.File.readint32(1);
          break;
        case 2:
        default:
          // 2 steps = 16-bit
          return this.File.readint16(1);
          break;
      }
    },

    getByteRangeAsNumber: function (index, steps) {
      // move to requested file position
      this.setByteIndex(index);
      return this.getNextBytesAsNumber(steps);
    },

    getNextBytesAsString: function (steps) {
      // return string of length specified by steps
      return this.File.readstring(steps);
    },

    getByteRangeAsString: function (index, steps) {
      // move to requested file position
      this.setByteIndex(index);
      return this.getNextBytesAsString(steps);
    }
  }

}(this));

/*
* Some simple functions to test MaxUnzip()
*/
function isZIP(path) {
  var testFile = new File(path);
  var parser = new MaxUnzip(testFile);
  post(testFile.filename, parser.isZipFile() ? "is a ZIP.\n" : "isn’t a ZIP.\n");
}

function printHeaders(path) {
  var testFile = new File(path);
  var parser = new MaxUnzip(testFile);
  parser.printHeaders();
}

function indexHeaders(path) {
  var testFile = new File(path);
  var parser = new MaxUnzip(testFile);
  parser.indexHeaders();
}

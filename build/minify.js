var script      = process.argv[2],
    http        = require("http"),
    queryString = require("querystring"),
    fs          = require("fs");

if (!script) {
  throw "No script url given";
}

function post(code, callback) {
  // Build the post string from an object
  var postData = queryString.stringify({
    compilation_level:  "SIMPLE_OPTIMIZATIONS",
    output_format:      "text",
    output_info:        "compiled_code",
    warning_level:      "QUIET",
    js_code:            code
  });

  // An object of options to indicate where to post to
  var postOptions = {
    host: "closure-compiler.appspot.com",
    port: "80",
    path: "/compile",
    method: "POST",
    headers: {
      "Content-Type":   "application/x-www-form-urlencoded",
      "Content-Length": postData.length
    }
  };
  
  // Set up the request
  var request = http.request(postOptions, function(response) {
    var responseText = [];
    response.setEncoding("utf8");
    response.on("data", function(data) {
      responseText.push(data);
    });
    response.on("end", function() {
      callback(responseText.join(""));
    });
  });
  
  // Post the data
  request.write(postData);
  request.end();
}

function readFile(filePath, callback) {
  // This is an async file read
  fs.readFile(filePath, "utf-8", function (err, data) {
    if (err) {
      // If this were just a small part of the application, you would
      // want to handle this differently, maybe throwing an exception
      // for the caller to handle. Since the file is absolutely essential
      // to the program's functionality, we're going to exit with a fatal
      // error instead.
      console.log("FATAL An error occurred trying to read in the file: " + err);
      process.exit(-2);
    }
    // Make sure there's data before we post it
    if (data) {
      callback(data);
    } else {
      console.log("No data to post");
      process.exit(-1);
    }
  });
}

function writeFile(filePath, data, callback) {
  fs.writeFile(filePath, data, "utf-8", callback);
}


// Ok GO!
readFile(script, function(code) {
  post(code, function(code) {
    var output = script.replace(/\.js/, ".min.js");
    writeFile(output, code);
  });
});

module("wysihtml5.dom.Sandbox", {
  teardown: function() {
    var iframe;
    while (iframe = document.querySelector("iframe.wysihtml5-sandbox")) {
      iframe.parentNode.removeChild(iframe);
    }
  },
  
  getCharset: function(doc) {
    var charset = doc.characterSet || doc.charset;
    if (/unicode|utf-8/.test(charset)) {
      return "utf-8";
    }
    return charset;
  },
  
  eval: function(iframeWindow, code) {
    try {
      return iframeWindow.execScript ? iframeWindow.execScript(code) : iframeWindow.eval(code);
    } catch(e) {
      return null;
    }
  },
  
  isUnset: function(evalCode, iframeWindow) {
    var value = this.eval(iframeWindow, evalCode);
    return !value || value == wysihtml5.EMPTY_FUNCTION;
  }
});


asyncTest("Basic Test", function() {
  expect(8);
  
  var sandbox = new wysihtml5.dom.Sandbox(function(param) {
    equal(param, sandbox, "The parameter passed into the readyCallback is the sandbox instance");
    
    var iframes = document.querySelectorAll("iframe.wysihtml5-sandbox");
    equal(iframes.length, 1, "iFrame sandbox inserted into dom tree");
    
    var iframe = iframes[iframes.length - 1],
        isIframeInvisible = iframe.width == 0 && iframe.height == 0 && iframe.frameBorder == 0;
    ok(isIframeInvisible, "iframe is not visible");
    
    var isSandboxed = iframe.getAttribute("security") == "restricted";
    ok(isSandboxed, "iFrame is sandboxed");
    
    var isWindowObject = sandbox.getWindow().setInterval && sandbox.getWindow().clearInterval;
    ok(isWindowObject, "wysihtml5.Sandbox.prototype.getWindow() works properly");
    
    var isDocumentObject = sandbox.getDocument().appendChild && sandbox.getDocument().body;
    ok(isDocumentObject, "wysihtml5.Sandbox.prototype.getDocument() works properly");
    
    equal(sandbox.getIframe(), iframe, "wysihtml5.Sandbox.prototype.getIframe() returns the iframe correctly");
    equal(typeof(sandbox.getWindow().onerror), "function", "window.onerror is set");
    
    start();
  });
  
  sandbox.insertInto(document.body);
});


asyncTest("Security test #1", function() {
  expect(14);
  
  var that = this;
  
  var sandbox = new wysihtml5.dom.Sandbox(function() {
    var iframeWindow = sandbox.getWindow();
    
    var isSafari = wysihtml5.browser.USER_AGENT.indexOf("Safari") !== -1 && wysihtml5.browser.USER_AGENT.indexOf("Chrome") === 1;
    
    if (isSafari) {
      // This test fails in Safari 5, as it's impossible to unset a cookie there
      ok(true, "Cookie is NOT unset (but that's expected in Safari)");
    } else {
      ok(that.isUnset("document.cookie", iframeWindow), "Cookie is unset");
    }
    
    ok(that.isUnset("document.open", iframeWindow),         "document.open is unset");
    ok(that.isUnset("document.write", iframeWindow),        "document.write is unset");
    ok(that.isUnset("window.parent", iframeWindow),         "window.parent is unset");
    ok(that.isUnset("window.opener", iframeWindow),         "window.opener is unset");
    ok(that.isUnset("window.localStorage", iframeWindow),   "localStorage is unset");
    ok(that.isUnset("window.globalStorage", iframeWindow),  "globalStorage is unset");
    ok(that.isUnset("window.XMLHttpRequest", iframeWindow), "XMLHttpRequest is an empty function");
    ok(that.isUnset("window.XDomainRequest", iframeWindow), "XDomainRequest is an empty function");
    ok(that.isUnset("window.alert", iframeWindow),          "alert is an empty function");
    ok(that.isUnset("window.prompt", iframeWindow),         "prompt is an empty function");
    ok(that.isUnset("window.openDatabase", iframeWindow),   "window.openDatabase is unset");
    ok(that.isUnset("window.indexedDB", iframeWindow),      "window.indexedDB is unset");
    ok(that.isUnset("window.postMessage", iframeWindow),    "window.openDatabase is unset");
    
    start();
  });
  
  sandbox.insertInto(document.body);
});


asyncTest("Security test #2", function() {
  expect(2);
  
  var sandbox = new wysihtml5.dom.Sandbox(function() {
    var html = '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" onerror="#{script}" onload="try { window.parent._hackedCookie=document.cookie; } catch(e){}; try { window.parent._hackedVariable=1; } catch(e) {}">';
    sandbox.getDocument().body.innerHTML = html;
    
    setTimeout(function() {
      equal(window._hackedCookie   || "", "", "Cookie can't be easily stolen");
      equal(window._hackedVariable || 0, 0, "iFrame has no access to parent");
      
      start();
    }, 2000);
  });
  
  sandbox.insertInto(document.body);
});


asyncTest("Check charset & doctype", function() {
  expect(3);
  
  var that = this;
  
  var sandbox = new wysihtml5.dom.Sandbox(function() {
    var iframeDocument = sandbox.getDocument(),
        isQuirksMode   = iframeDocument.compatMode == "BackCompat";
    
    ok(!isQuirksMode, "iFrame isn't in quirks mode");
    equal(that.getCharset(iframeDocument), that.getCharset(document), "Charset correctly inherited by iframe");
    
    iframeDocument.body.innerHTML = '<meta charset="iso-8859-1">&uuml;';
    
    setTimeout(function() {
      equal(that.getCharset(iframeDocument), that.getCharset(document), "Charset isn't overwritten");
      start();
    }, 500);
  });
  
  sandbox.insertInto(document.body);
});


asyncTest("Check insertion of single stylesheet", function() {
  expect(1);
  
  new wysihtml5.dom.Sandbox(function(sandbox) {
    var doc = sandbox.getDocument();
    equal(doc.getElementsByTagName("link").length, 1, "Correct amount of stylesheets inserted into the dom tree");
    start();
  }, {
    stylesheets: "https://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/blitzer/jquery-ui.css"
  }).insertInto(document.body);
});


asyncTest("Check insertion of multiple stylesheets", function() {
  expect(1);
  
  new wysihtml5.dom.Sandbox(function(sandbox) {
    var doc = sandbox.getDocument();
    equal(doc.getElementsByTagName("link").length, 2, "Correct amount of stylesheets inserted into the dom tree");
    start();
  }, {
    stylesheets: [
      "https://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/blitzer/jquery-ui.css",
      "https://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/excite-bike/jquery-ui.css"
    ]
  }).insertInto(document.body);
});


asyncTest("Check X-UA-Compatible", function() {
  expect(1);
  
  new wysihtml5.dom.Sandbox(function(sandbox) {
    var doc                 = sandbox.getDocument(),
        docMode             = doc.documentMode;
    
    ok(doc.documentMode === document.documentMode, "iFrame is in in the same document mode as the parent site");
    start();
  }).insertInto(document.body);
});
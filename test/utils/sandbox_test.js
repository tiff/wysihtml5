module("wysihtml5.utils.Sandbox", {
  teardown: function() {
    $$("iframe.wysihtml5-sandbox").invoke("stopObserving").invoke("remove");
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
    return !value || value == Prototype.emptyFunction;
  }
});


test("Basic Test", function() {
  expect(8);
  stop(5000);
  
  var sandbox = new wysihtml5.utils.Sandbox(function(param) {
    equals(param, sandbox, "The parameter passed into the readyCallback is the sandbox instance");
    
    var iframes = $$("iframe.wysihtml5-sandbox");
    equals(iframes.length, 1, "iFrame sandbox inserted into dom tree");
    
    var iframe = iframes.last(),
        isIframeInvisible = iframe.width == iframe.height == iframe.frameBorder == 0;
    ok(isIframeInvisible, "iframe is not visible");
    
    var isSandboxed = iframe.getAttribute("security") == "restricted";
    ok(isSandboxed, "iFrame is sandboxed");
    
    var isWindowObject = sandbox.getWindow().setInterval && sandbox.getWindow().clearInterval;
    ok(isWindowObject, "wysihtml5.Sandbox.prototype.getWindow() works properly");
    
    var isDocumentObject = sandbox.getDocument().appendChild && sandbox.getDocument().body;
    ok(isDocumentObject, "wysihtml5.Sandbox.prototype.getDocument() works properly");
    
    equals(sandbox.getIframe(), iframe, "wysihtml5.Sandbox.prototype.getIframe() returns the iframe correctly");
    ok(Object.isFunction(sandbox.getWindow().onerror), "window.onerror is set");
    
    start();
  }, { insertInto: document.body });
});


test("Security test #1", function() {
  expect(14);
  stop(5000);
  
  var sandbox = new wysihtml5.utils.Sandbox(function() {
    var iframeWindow = sandbox.getWindow();
    
    if (Prototype.Browser.WebKit || !window.chrome) {
      // This test fails in Safari 5, as it's impossible to unset a cookie there
      ok(true, "Cookie is NOT unset (but expected in Safari)");
    } else {
      ok(this.isUnset("document.cookie", iframeWindow), "Cookie is unset");
    }
    
    ok(this.isUnset("document.open", iframeWindow), "document.open is unset");
    ok(this.isUnset("document.write", iframeWindow), "document.write is unset");
    ok(this.isUnset("window.parent", iframeWindow), "window.parent is unset");
    ok(this.isUnset("window.opener", iframeWindow), "window.opener is unset");
    ok(this.isUnset("window.localStorage", iframeWindow), "localStorage is unset");
    ok(this.isUnset("window.globalStorage", iframeWindow), "globalStorage is unset");
    ok(this.isUnset("window.XMLHttpRequest", iframeWindow), "XMLHttpRequest is an empty function");
    ok(this.isUnset("window.XDomainRequest", iframeWindow), "XDomainRequest is an empty function");
    ok(this.isUnset("window.alert", iframeWindow), "alert is an empty function");
    ok(this.isUnset("window.prompt", iframeWindow), "prompt is an empty function");
    ok(this.isUnset("window.openDatabase", iframeWindow), "window.openDatabase is unset");
    ok(this.isUnset("window.indexedDB", iframeWindow), "window.indexedDB is unset");
    ok(this.isUnset("window.postMessage", iframeWindow), "window.openDatabase is unset");
    
    start();
  }.bind(this), { insertInto: document.body });
});


test("Security test #2", function() {
  expect(2);
  stop(5000);
  
  var sandbox = new wysihtml5.utils.Sandbox(function() {
    var html = '<img src="#{data_uri}" onerror="#{script}" onload="#{script}">'.interpolate({
          script:   "try { window.parent._hackedCookie=document.cookie; } catch(e){}; try { window.parent._hackedVariable=1; } catch(e) {}",
          data_uri: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        });
    
    sandbox.getDocument().body.innerHTML = html;
    
    (function() {
      equals(window._hackedCookie || "", "", "Cookie can't be easily stolen");
      equals(window._hackedVariable || 0, 0, "iFrame has no access to parent");
      
      start();
    }).delay(2);
  }.bind(this), { insertInto: document.body });
});


test("Check charset & doctype", function() {
  expect(3);
  stop(5000);
  
  var sandbox = new wysihtml5.utils.Sandbox(function() {
    var iframeDocument = sandbox.getDocument(),
        isQuirksMode   = iframeDocument.compatMode == "BackCompat";
    
    ok(!isQuirksMode, "iFrame isn't in quirks mode");
    equals(this.getCharset(iframeDocument), this.getCharset(document), "Charset correctly inherited by iframe");
    
    iframeDocument.body.innerHTML = '<meta charset="iso-8859-1">&uuml;';
    
    setTimeout(function() {
      equals(this.getCharset(iframeDocument), this.getCharset(document), "Charset isn't overwritten");
      start();
    }.bind(this), 500);
  }.bind(this), { insertInto: document.body });
});


test("Check insertion of single stylesheet", function() {
  stop(5000);
  expect(1);
  
  new wysihtml5.utils.Sandbox(function(sandbox) {
    var doc = sandbox.getDocument();
    equals(doc.getElementsByTagName("link").length, 1, "Correct amount of stylesheets inserted into the dom tree");
    start();
  }, {
    insertInto:  document.body,
    stylesheets: "https://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/blitzer/jquery-ui.css"
  });
});


test("Check insertion of multiple stylesheets", function() {
  stop(5000);
  expect(1);
  
  new wysihtml5.utils.Sandbox(function(sandbox) {
    var doc = sandbox.getDocument();
    equals(doc.getElementsByTagName("link").length, 2, "Correct amount of stylesheets inserted into the dom tree");
    start();
  }, {
    insertInto:  document.body,
    stylesheets: [
      "https://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/blitzer/jquery-ui.css",
      "https://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/excite-bike/jquery-ui.css"
    ]
  });
});


test("Check X-UA-Compatible meta tag #1", function() {
  stop(5000);
  expect(2);
  
  new wysihtml5.utils.Sandbox(function(sandbox) {
    var doc                 = sandbox.getDocument(),
        metaTags            = $A(doc.getElementsByTagName("meta")),
        uaCompatibleMetaTag = metaTags.find(function(metaTag) { return metaTag.httpEquiv === "X-UA-Compatible"; });
    ok(uaCompatibleMetaTag, "X-UA-Compatible meta tag found");
    if (uaCompatibleMetaTag) {
      equals(uaCompatibleMetaTag.getAttribute("content"), "IE=Edge", "X-UA-Compatible correctly set");
    }
    start();
  }, {
    insertInto:  document.body
  });
});


test("Check X-UA-Compatible meta tag #2", function() {
  stop(5000);
  expect(3);
  
  new wysihtml5.utils.Sandbox(function(sandbox) {
    var doc                 = sandbox.getDocument(),
        docMode             = doc.documentMode || 7,
        metaTags            = $A(doc.getElementsByTagName("meta")),
        uaCompatibleMetaTag = metaTags.find(function(metaTag) { return metaTag.httpEquiv === "X-UA-Compatible"; });
        
    ok(uaCompatibleMetaTag, "X-UA-Compatible meta tag found");
    
    ok(docMode === 7 || docMode === 9, "iFrame is in in IE7 or IE9 mode");
    if (uaCompatibleMetaTag) {
      equals(uaCompatibleMetaTag.getAttribute("content"), "IE=7", "X-UA-Compatible correctly set");
    }
    start();
  }, {
    insertInto:   document.body,
    uaCompatible: "IE=7"
  });
});
/**
 * Sandbox for executing javascript, parsing css styles and doing dom operations in a safe way
 *
 * Browser Compatibility:
 *  - Secure in MSIE 6+, but only when the user hasn't made changes to his security level "restricted"
 *  - Partially secure in other browsers (Firefox, Opera, Safari, Chrome, ...)
 *
 * Please note that this class can't benefit from the HTML5 sandbox attribute for the following reasons:
 *    - sandboxing doesn't work correctly with inlined content (src="javascript:'<html>...</html>'")
 *    - sandboxing of physical documents causes that the dom isn't accessible anymore from the outside (iframe.contentWindow, ...)
 *    - setting the "allow-same-origin" flag would fix that, but then still javascript and dom events refuse to fire
 *    - therefore the "allow-scripts" flag is needed, which then would inactivate any security, as the js executed inside the iframe
 *      can do anything as if the sandbox attribute wasn't set
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Function} [readyCallback] Method that gets invoked when the sandbox is ready
 * @param {Object} [config] Optional parameters, see defaultConfig property for more info
 *
 * @example
 *    new wysihtml5.utils.Sandbox(function(sandbox) {
 *      sandbox.getWindow().document.body.innerHTML = '<img src=foo.gif onerror="alert(document.cookie)">';
 *    });
 */
wysihtml5.utils.Sandbox = Class.create(
  /** @scope wysihtml5.utils.Sandbox.prototype */ {
  
  defaultConfig: {
    insertInto:   null,       // Element (id or direct object reference) where to insert the sandbox into
    context:      document,   // Object of document where to insert the sandbox in
    uaCompatible: "IE=Edge"   // X-UA-Compatible meta tag value (Document compatibility mode)
  },
  
  initialize: function(readyCallback, config) {
    this.callback = readyCallback || Prototype.emptyFunction;
    this.config   = Object.extend(Object.clone(this.defaultConfig), config);
    this.iframe   = this._createIframe();
    
    if (typeof(this.config.insertInto) === "string") {
      this.config.insertInto = this.config.context.getElementById(this.config.insertInto);
    }
    
    if (this.config.insertInto) {
      this.config.insertInto.appendChild(this.iframe);
    }
  },
  
  getIframe: function() {
    return this.iframe;
  },
  
  getWindow: function() {
    this._readyError();
  },
  
  getDocument: function() {
    this._readyError();
  },
  
  destroy: function() {
    var iframe = this.getIframe();
    iframe.parentNode.removeChild(iframe);
  },
  
  _readyError: function() {
    throw new Error("wysihtml5.Sandbox: Sandbox iframe isn't loaded yet");
  },
  
  /**
   * Creates the sandbox iframe
   *
   * Some important notes:
   *  - We can't use HTML5 sandbox for now:
   *    setting it causes that the iframe's dom can't be accessed from the outside
   *    Therefore we need to set the "allow-same-origin" flag which enables accessing the iframe's dom
   *    But then there's another problem, DOM events (focus, blur, change, keypress, ...) aren't fired.
   *    In order to make this happen we need to set the "allow-scripts" flag.
   *    A combination of allow-scripts and allow-same-origin is almost the same as setting no sandbox attribute at all.
   *  - Chrome & Safari, doesn't seem to support sandboxing correctly when the iframe's html is inlined (no physical document)
   *  - IE needs to have the security="restricted" attribute set before the iframe is 
   *    inserted into the dom tree
   *  - Believe it or not but in IE "security" in document.createElement("iframe") is false, even
   *    though it supports it
   *  - When an iframe has security="restricted", in IE eval() & execScript() don't work anymore
   *  - IE doesn't fire the onload event when the content is inlined in the src attribute, therefore we rely
   *    on the onreadystatechange event
   */
  _createIframe: function() {
    var iframe = this.config.context.createElement("iframe");
    iframe.className = "wysihtml5-sandbox";
    iframe.setAttribute("security", "restricted");
    iframe.setAttribute("allowTransparency", "true");
    iframe.setAttribute("frameBorder", "0");
    iframe.setAttribute("width", "0");
    iframe.setAttribute("height", "0");
    iframe.setAttribute("marginWidth", "0");
    iframe.setAttribute("marginHeight", "0");
    
    // Setting the src like this prevents ssl warnings in IE6
    if (!wysihtml5.browserSupports.emptyIframeSrcInHttpsContext()) {
      iframe.src = "javascript:'<html></html>'";
    }
    
    iframe.onload = function() {
      iframe.onreadystatechange = iframe.onload = null;
      this._onLoadIframe(iframe);
    }.bind(this);
    
    iframe.onreadystatechange = function() {
      if (/loaded|complete/.test(iframe.readyState)) {
        iframe.onreadystatechange = iframe.onload = null;
        this._onLoadIframe(iframe);
      }
    }.bind(this);
    
    return iframe;
  },
  
  /**
   * Callback for when the iframe has finished loading
   */
  _onLoadIframe: function(iframe) {
    // don't resume when the iframe got unloaded (eg. by removing it from the dom)
    if (!wysihtml5.utils.contains(document.documentElement, iframe)) {
      return;
    }
    
    var context        = this.config.context,
        iframeWindow   = iframe.contentWindow,
        iframeDocument = iframe.contentDocument || iframe.contentWindow.document,
        charset        = context.characterSet || context.charset || "utf-8",
        sandboxHtml    = this._getHtml({
          charset:      charset,
          stylesheets:  this.config.stylesheets,
          uaCompatible: this.config.uaCompatible
        });
    
    // Create the basic dom tree including proper DOCTYPE and charset
    iframeDocument.open("text/html", "replace");
    iframeDocument.write(sandboxHtml);
    iframeDocument.close();
    
    this.getWindow = function() { return iframeWindow; };
    this.getDocument = function() { return iframeDocument; };
    
    // Catch js errors and pass them to the parent's onerror event
    // addEventListener("error") doesn't work properly in some browsers
    // TODO: apparently this doesn't work in IE9!
    iframeWindow.onerror = function(errorMessage, fileName, lineNumber) {
      throw new Error("wysihtml5.Sandbox: " + errorMessage, fileName, lineNumber);
    };
    
    if (!wysihtml5.browserSupports.sandboxedIframes()) {
      // Unset a bunch of sensitive variables
      // Please note: This isn't hack safe!  
      // It more or less just takes care of basic attacks and prevents accidental theft of sensitive information
      // IE is secure though, which is the most important thing, since IE is the only browser, who
      // takes over scripts & styles into contentEditable elements when copied from external websites
      // or applications (Microsoft Word, ...)
      [
        "parent", "top", "opener", "frameElement", "frames",
        "localStorage", "globalStorage", "sessionStorage", "indexedDB"
      ].each(function(property) {
        this._unset(iframeWindow, property);
      }.bind(this));

      [
        "open", "close", "openDialog", "showModalDialog",
        "alert", "confirm", "prompt",
        "openDatabase", "postMessage",
        "XMLHttpRequest", "XDomainRequest"
      ].each(function(property) {
        this._unset(iframeWindow, property, Prototype.emptyFunction);
      }.bind(this));

      [
        "referrer",
        "write", "open", "close"
      ].each(function(property) {
        this._unset(iframeDocument, property);
      }.bind(this));

      // This doesn't work in Safari 5 
      // See http://stackoverflow.com/questions/992461/is-it-possible-to-override-document-cookie-in-webkit
      this._unset(iframeDocument, "cookie", "", true);
    }
    
    this.loaded = true;
    
    // Trigger the callback
    setTimeout(function() { this.callback(this); }.bind(this), 0);
  },
  
  _getHtml: function(templateVars) {
    if (templateVars.stylesheets) {
      templateVars.stylesheets = [templateVars.stylesheets].flatten().map(function(stylesheet) {
        return '<link rel="stylesheet" href="' + stylesheet + '">';
      }).join("");
    } else {
      templateVars.stylesheets = "";
    }
    
    return (
      '<!DOCTYPE html><html><head>'
      + '<meta http-equiv="X-UA-Compatible" content="#{uaCompatible}"><meta charset="#{charset}">#{stylesheets}</head>'
      + '<body></body></html>'
    ).interpolate(templateVars);
  },
  
  /**
   * Method to unset/override existing variables
   * @example
   *    // Make cookie unreadable and unwritable
   *    this._unset(document, "cookie", "", true);
   */
  _unset: function(object, property, value, setter) {
    try { object[property] = value; } catch(e) {}
    
    try { object.__defineGetter__(property, function() { return value; }); } catch(e) {}
    if (setter) {
      try { object.__defineSetter__(property, function() {}); } catch(e) {}
    }
    
    // IE9 crashes when setting a getter via Object.defineProperty on XMLHttpRequest or XDomainRequest
    // See https://connect.microsoft.com/ie/feedback/details/650112
    // or try the POC http://tifftiff.de/ie9_crash/
    var causesBrowserCrash = Prototype.Browser.IE && (property === "XMLHttpRequest" || property === "XDomainRequest");
    if (!causesBrowserCrash) {
      try {
        var config = {
          get: function() { return value; }
        };
        if (setter) {
          config.set = function() {};
        }
        Object.defineProperty(object, property, config);
      } catch(e) {}
    }
  }
});
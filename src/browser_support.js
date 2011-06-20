/**
 * Detect browser support for specific features
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 */
wysihtml5.browserSupports = {
  TEST_ELEMENT: document.createElement("div"),
  
  // Static variable needed, publicly accessible, to be able override it in unit tests
  USER_AGENT: navigator.userAgent,
  
  /**
   * Exclude browsers that are not capable of displaying and handling
   * contentEditable as desired:
   *    - iPhone, iPad (tested iOS 4.2.2) and Android (tested 2.2) refuse to make contentEditables focusable
   *    - IE < 8 create invalid markup and crash randomly from time to time
   *
   * @return {Boolean}
   */
  contentEditable: function() {
    var userAgent                   = this.USER_AGENT.toLowerCase(),
        // Essential for making html elements editable
        hasContentEditableSupport   = "contentEditable" in this.TEST_ELEMENT,
        // Following methods are needed in order to interact with the contentEditable area
        hasEditingApiSupport        = document.execCommand && document.queryCommandSupported && document.queryCommandState,
        // document selector apis are only supported by IE 8+, Safari 4+, Chrome and Firefox 3.5+
        hasQuerySelectorSupport     = document.querySelector && document.querySelectorAll,
        // contentEditable is unusable in mobile browsers (tested iOS 4.2.2, Android 2.2, Opera Mobile)
        isIncompatibleMobileBrowser = (userAgent.include("webkit") && userAgent.include("mobile")) || userAgent.include("opera mobi");
    
    return hasContentEditableSupport
      && hasEditingApiSupport
      && hasQuerySelectorSupport
      && !isIncompatibleMobileBrowser;
  },
  
  /**
   * Whether the browser supports sandboxed iframes
   * Currently only IE 6+ offers such feature <iframe security="restricted">
   *
   * http://msdn.microsoft.com/en-us/library/ms534622(v=vs.85).aspx
   * http://blogs.msdn.com/b/ie/archive/2008/01/18/using-frames-more-securely.aspx
   *
   * HTML5 sandboxed iframes are still buggy and their DOM is not reachable from the outside (except when using postMessage)
   */
  sandboxedIframes: function() {
    return Prototype.Browser.IE;
  },
  
  /**
   * IE6+7 throw a mixed content warning when the src of an iframe
   * is empty/unset or about:blank
   * window.querySelector is implemented as of IE8
   */
  emptyIframeSrcInHttpsContext: function() {
    return "querySelector" in document;
  },
  
  /**
   * Whether the caret is correctly displayed in contentEditable elements
   * Firefox sometimes shows a huge caret in the beginning after focusing
   */
  caretInEmptyContentEditableCorrectly: function() {
    return !Prototype.Browser.Gecko;
  },
  
  /**
   * Opera and IE are the only browsers who offer the css value
   * in the original unit, thx to the currentStyle object
   * All other browsers provide the computed style in px via window.getComputedStyle
   */
  computedStyleInPercent: function() {
    return "currentStyle" in this.TEST_ELEMENT;
  },
  
  /**
   * Whether the browser inserts a <br> when pressing enter in a contentEditable element
   */
  lineBreaksOnReturn: function() {
    return Prototype.Browser.Gecko;
  },
  
  placeholderOn: function(element) {
    return "placeholder" in element;
  },
  
  event: function(eventName) {
    var element = this.TEST_ELEMENT;
    return "on" + eventName in element || (function() {
      element.setAttribute("on" + eventName, "return;");
      return typeof(element["on" + eventName]) === "function";
    })();
  },
  
  /**
   * Opera doesn't correctly fire focus/blur events when clicking in- and outside of iframe
   */
  eventsInIframeCorrectly: function() {
    return !Prototype.Browser.Opera;
  },
  
  /**
   * Chrome & Safari only fire the ondrop/ondragend/... events when the ondragover event is cancelled
   * with event.preventDefault
   * Firefox 3.6 fires those events anyway, but the mozilla doc says that the dragover/dragenter event needs
   * to be cancelled
   */
  onDropOnlyWhenOnDragOverIsCancelled: function() {
    return Prototype.Browser.WebKit || Prototype.Browser.Gecko;
  },
  
  htmlDataTransfer: function() {
    try {
      // Firefox doesn't support dataTransfer in a safe way, it doesn't strip script code in the html payload (like Chrome does)
      return Prototype.Browser.WebKit && (window.Clipboard || window.DataTransfer).prototype.getData;
    } catch(e) {
      return false;
    }
  },
  
  /**
   * Everything below IE9 doesn't know how to treat HTML5 tags
   *
   * @param {Object} context The document object on which to check HTML5 support
   *
   * @example
   *    wysihtml5.browserSupports.html5Tags(document);
   */
  html5Tags: function(context) {
    var element = context.createElement("div"),
        html5   = "<article>foo</article>";
    element.innerHTML = html5;
    return element.innerHTML.toLowerCase() === html5;
  },
  
  /**
   * Checks whether a document supports a certain queryCommand
   * In particular, Opera needs a reference to a document that has a contentEditable in it's dom tree
   * in oder to report correct results
   *
   * @param {Object} doc Document object on which to check for a query command
   * @param {String} command The query command to check for
   * @return {Boolean}
   *
   * @example
   *    wysihtml5.browserSupports.command(document, "bold");
   */
  command: (function() {
    // Following commands are supported but contain bugs in some browsers
    var buggyCommands = {
      // formatBlock fails with some tags (eg. <blockquote>)
      "formatBlock":          Prototype.Browser.IE,
       // When inserting unordered or ordered lists in Firefox, Chrome or Safari, the current selection or line gets
       // converted into a list (<ul><li>...</li></ul>, <ol><li>...</li></ol>)
       // IE and Opera act a bit different here as they convert the entire content of the current block element into a list
      "insertUnorderedList":  Prototype.Browser.IE || Prototype.Browser.Opera,
      "insertOrderedList":    Prototype.Browser.IE || Prototype.Browser.Opera
    };
    
    return function(doc, command) {
      var isBuggy = buggyCommands[command];
      if (isBuggy) {
        return false;
      } else {
        // Firefox throws errors when invoking queryCommandSupported or queryCommandEnabled
        return Try.these(
          function() { return doc.queryCommandSupported(command); },
          function() { return doc.queryCommandEnabled(command); }
        ) || false;
      }
    };
  })(),
  
  /**
   * IE: URLs starting with:
   *    www., http://, https://, ftp://, gopher://, mailto:, new:, snews:, telnet:, wasis:, file://,
   *    nntp://, newsrc:, ldap://, ldaps://, outlook:, mic:// and url: 
   * will automatically be auto-linked when either the user inserts them via copy&paste or presses the
   * space bar when the caret is directly after such an url.
   * This behavior cannot easily be avoided in IE < 9 since the logic is hardcoded in the mshtml.dll
   * (related blog post on msdn
   * http://blogs.msdn.com/b/ieinternals/archive/2009/09/17/prevent-automatic-hyperlinking-in-contenteditable-html.aspx).
   */
  autoLinkingInContentEditable: function() {
    return Prototype.Browser.IE;
  },
  
  /**
   * As stated above, IE auto links urls typed into contentEditable elements
   * Since IE9 it's possible to prevent this behavior
   */
  disablingOfAutoLinking: function() {
    return this.command(document, "AutoUrlDetect");
  },
  
  /**
   * IE leaves an empty paragraph in the contentEditable element after clearing it
   * Chrome/Safari sometimes an empty <div>
   */
  clearingOfContentEditableCorrectly: function() {
    return Prototype.Browser.Gecko || Prototype.Browser.Opera || Prototype.Browser.WebKit;
  },
  
  /**
   * IE gives wrong results for getAttribute
   */
  getAttributeCorrectly: function() {
    var td = document.createElement("td");
    return td.getAttribute("rowspan") != "1";
  },
  
  /**
   * When clicking on images in IE, Opera and Firefox, they are selected, which makes it easy to interact with them.
   * Chrome and Safari both don't support this
   */
  selectingOfImagesInContentEditableOnClick: function() {
    return Prototype.Browser.Gecko || Prototype.Browser.IE || Prototype.Browser.Opera;
  },
  
  /**
   * When the caret is in an empty list (<ul><li>|</li></ul>) which is the first child in an contentEditable container
   * pressing backspace doesn't remove the entire list as done in other browsers
   */
  clearingOfListsInContentEditableCorrectly: function() {
    return Prototype.Browser.IE || Prototype.Browser.WebKit || Prototype.Browser.Gecko;
  },
  
  /**
   * All browsers except Safari and Chrome automatically scroll the range/caret position into view
   */
  autoScrollIntoViewOfCaret: function() {
    return !Prototype.Browser.WebKit;
  },
  
  /**
   * Check whether the browser automatically closes tags that don't need to be opened
   */
  closingOfUnclosedTags: function() {
    var testElement = this.TEST_ELEMENT.cloneNode(false),
        returnValue,
        innerHTML;
    
    testElement.innerHTML = "<p><div></div>";
    innerHTML             = testElement.innerHTML.toLowerCase();
    returnValue           = innerHTML === "<p></p><div></div>" || innerHTML === "<p><div></div></p>";
    
    // Cache result by overwriting current function
    this.closingOfUnclosedTags = function() { return returnValue; };
    
    return returnValue;
  },
  
  /**
   * Whether the browser supports the native document.getElementsByClassName which returns live NodeLists
   */
  getElementsByClassName: function() {
    return String(document.getElementsByClassName).indexOf("[native code]") !== -1;
  },
  
  /**
   * As of now (19.04.2011) only supported by Firefox 4 and Chrome
   * See https://developer.mozilla.org/en/DOM/Selection/modify
   */
  selectionModify: function() {
    return ("getSelection" in window) && ("modify" in window.getSelection());
  }
};
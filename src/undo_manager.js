/**
 * Undo Manager for wysihtml5
 * slightly inspired by http://rniwa.com/editing/undomanager.html#the-undomanager-interface
 */
(function(wysihtml5) {
  var Z_KEY               = 90,
      Y_KEY               = 89,
      BACKSPACE_KEY       = 8,
      DELETE_KEY          = 46,
      MAX_HISTORY_ENTRIES = 25,
      DATA_ATTR_NODE      = "data-wysihtml5-selection-node",
      DATA_ATTR_OFFSET    = "data-wysihtml5-selection-offset",
      UNDO_HTML           = '<span id="_wysihtml5-undo" class="_wysihtml5-temp">' + wysihtml5.INVISIBLE_SPACE + '</span>',
      REDO_HTML           = '<span id="_wysihtml5-redo" class="_wysihtml5-temp">' + wysihtml5.INVISIBLE_SPACE + '</span>',
      dom                 = wysihtml5.dom;
  
  function cleanTempElements(doc) {
    var tempElement;
    while (tempElement = doc.querySelector("._wysihtml5-temp")) {
      tempElement.parentNode.removeChild(tempElement);
    }
  }
  
  wysihtml5.UndoManager = wysihtml5.lang.Dispatcher.extend(
    /** @scope wysihtml5.UndoManager.prototype */ {
    constructor: function(editor) {
      this.editor = editor;
      this.composer = editor.composer;
      this.element = this.composer.element;
      
      this.position = 0;
      this.historyStr = [];
      this.historyDom = [];
      
      this.transact();
      
      this._observe();
    },
    
    _observe: function() {
      var that      = this,
          doc       = this.composer.sandbox.getDocument(),
          lastKey;
          
      // Catch CTRL+Z and CTRL+Y
      dom.observe(this.element, "keydown", function(event) {
        if (event.altKey || (!event.ctrlKey && !event.metaKey)) {
          return;
        }
        
        var keyCode = event.keyCode,
            isUndo = keyCode === Z_KEY && !event.shiftKey,
            isRedo = (keyCode === Z_KEY && event.shiftKey) || (keyCode === Y_KEY);
        
        if (isUndo) {
          that.undo();
          event.preventDefault();
        } else if (isRedo) {
          that.redo();
          event.preventDefault();
        }
      });
      
      // Catch delete and backspace
      dom.observe(this.element, "keydown", function(event) {
        var keyCode = event.keyCode;
        if (keyCode === lastKey) {
          return;
        }
        
        lastKey = keyCode;
        
        if (keyCode === BACKSPACE_KEY || keyCode === DELETE_KEY) {
          that.transact();
        }
      });
      
      // Now this is very hacky:
      // These days browsers don't offer a undo/redo event which we could hook into
      // to be notified when the user hits undo/redo in the contextmenu.
      // Therefore we simply insert two elements as soon as the contextmenu gets opened.
      // The last element being inserted will be immediately be removed again by a exexCommand("undo")
      //  => When the second element appears in the dom tree then we know the user clicked "redo" in the context menu
      //  => When the first element disappears from the dom tree then we know the user clicked "undo" in the context menu
      if (wysihtml5.browser.hasUndoInContextMenu()) {
        var interval, observed, cleanUp = function() {
          cleanTempElements(doc);
          clearInterval(interval);
        };
        
        dom.observe(this.element, "contextmenu", function() {
          cleanUp();
          that.composer.selection.executeAndRestoreSimple(function() {
            if (that.element.lastChild) {
              that.composer.selection.setAfter(that.element.lastChild);
            }

            // enable undo button in context menu
            doc.execCommand("insertHTML", false, UNDO_HTML);
            // enable redo button in context menu
            doc.execCommand("insertHTML", false, REDO_HTML);
            doc.execCommand("undo", false, null);
          });

          interval = setInterval(function() {
            if (doc.getElementById("_wysihtml5-redo")) {
              cleanUp();
              that.redo();
            } else if (!doc.getElementById("_wysihtml5-undo")) {
              cleanUp();
              that.undo();
            }
          }, 400);

          if (!observed) {
            observed = true;
            dom.observe(document, "mousedown", cleanUp);
            dom.observe(doc, ["mousedown", "paste", "cut", "copy"], cleanUp);
          }
        });
      }
      
      this.editor
        .on("newword:composer", function() {
          that.transact();
        })
        
        .on("beforecommand:composer", function() {
          that.transact();
        });
    },
    
    transact: function() {
      var previousHtml      = this.historyStr[this.position - 1],
          currentHtml       = this.composer.getValue();
      
      if (currentHtml === previousHtml) {
        return;
      }
      
      var length = this.historyStr.length = this.historyDom.length = this.position;
      if (length > MAX_HISTORY_ENTRIES) {
        this.historyStr.shift();
        this.historyDom.shift();
        this.position--;
      }
      
      this.position++;
      
      var range   = this.composer.selection.getRange(),
          node    = range.startContainer || this.element,
          offset  = range.startOffset    || 0,
          element,
          position;
      
      if (node.nodeType === wysihtml5.ELEMENT_NODE) {
        element = node;
      } else {
        element  = node.parentNode;
        position = this.getChildNodeIndex(element, node);
      }
      
      element.setAttribute(DATA_ATTR_OFFSET, offset);
      if (typeof(position) !== "undefined") {
        element.setAttribute(DATA_ATTR_NODE, position);
      }
      
      var clone = this.element.cloneNode(!!currentHtml);
      this.historyDom.push(clone);
      this.historyStr.push(currentHtml);
      
      element.removeAttribute(DATA_ATTR_OFFSET);
      element.removeAttribute(DATA_ATTR_NODE);
    },
    
    undo: function() {
      this.transact();
      
      if (!this.undoPossible()) {
        return;
      }
      
      this.set(this.historyDom[--this.position - 1]);
      this.editor.fire("undo:composer");
    },
    
    redo: function() {
      if (!this.redoPossible()) {
        return;
      }
      
      this.set(this.historyDom[++this.position - 1]);
      this.editor.fire("redo:composer");
    },
    
    undoPossible: function() {
      return this.position > 1;
    },
    
    redoPossible: function() {
      return this.position < this.historyStr.length;
    },
    
    set: function(historyEntry) {
      this.element.innerHTML = "";
      
      var i = 0,
          childNodes = historyEntry.childNodes,
          length = historyEntry.childNodes.length;
      
      for (; i<length; i++) {
        this.element.appendChild(childNodes[i].cloneNode(true));
      }
      
      // Restore selection
      var offset,
          node,
          position;
      
      if (historyEntry.hasAttribute(DATA_ATTR_OFFSET)) {
        offset    = historyEntry.getAttribute(DATA_ATTR_OFFSET);
        position  = historyEntry.getAttribute(DATA_ATTR_NODE);
        node      = this.element;
      } else {
        node      = this.element.querySelector("[" + DATA_ATTR_OFFSET + "]") || this.element;
        offset    = node.getAttribute(DATA_ATTR_OFFSET);
        position  = node.getAttribute(DATA_ATTR_NODE);
        node.removeAttribute(DATA_ATTR_OFFSET);
        node.removeAttribute(DATA_ATTR_NODE);
      }
      
      if (position !== null) {
        node = this.getChildNodeByIndex(node, +position);
      }
      
      this.composer.selection.set(node, offset);
    },
    
    getChildNodeIndex: function(parent, child) {
      var i           = 0,
          childNodes  = parent.childNodes,
          length      = childNodes.length;
      for (; i<length; i++) {
        if (childNodes[i] === child) {
          return i;
        }
      }
    },
    
    getChildNodeByIndex: function(parent, index) {
      return parent.childNodes[index];
    }
  });
})(wysihtml5);

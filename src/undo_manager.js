/**
 * Undo Manager for wysihtml5
 * slightly inspired by http://rniwa.com/editing/undomanager.html#the-undomanager-interface
 */
(function(wysihtml5) {
  var Z_KEY               = 90,
      Y_KEY               = 89,
      BACKSPACE_KEY       = 8,
      DELETE_KEY          = 46,
      MAX_HISTORY_ENTRIES = 30,
      CARET_PLACEHOLDER   = "_wysihtml5-caret-placeholder",
      UNDO_HTML           = '<span id="_wysihtml5-undo" class="_wysihtml5-temp">' + wysihtml5.INVISIBLE_SPACE + '</span>',
      REDO_HTML           = '<span id="_wysihtml5-redo" class="_wysihtml5-temp">' + wysihtml5.INVISIBLE_SPACE + '</span>',
      dom                 = wysihtml5.dom;
  
  function cleanTempElements(doc) {
    var tempElement;
    while (tempElement = doc.querySelector("._wysihtml5-temp")) {
      tempElement.parentNode.removeChild(tempElement);
    }
  }
  
  function silentRemove(element) {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  
  wysihtml5.UndoManager = wysihtml5.lang.Dispatcher.extend(
    /** @scope wysihtml5.UndoManager.prototype */ {
    constructor: function(editor) {
      this.editor = editor;
      this.composer = editor.composer;
      this.element = this.composer.element;
      
      var initialValue = this.composer.getValue();
      this.history = [initialValue];
      this.historyWithCaret = [initialValue];
      this.position = 1;
      
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
        .observe("newword:composer", function() {
          that.transact();
        })
        
        .observe("beforecommand:composer", function() {
          that.transact();
        });
    },
    
    transact: function() {
      var previousHtml  = this.history[this.position - 1],
          currentHtml   = this.composer.getValue(),
          doc           = this.composer.sandbox.getDocument(),
          that          = this;
      
      if (currentHtml == previousHtml) {
        return;
      }
      
      var length = this.history.length = this.historyWithCaret.length = this.position;
      if (length > MAX_HISTORY_ENTRIES) {
        this.history.shift();
        this.historyWithCaret.shift();
        this.position--;
      }
      
      this.position++;
          
      this.composer.selection.executeAndRestoreSimple(function() {
        var placeholder = doc.createElement("span");
        placeholder.id = CARET_PLACEHOLDER;
        that.composer.selection.insertNode(placeholder);
        that.history.push(currentHtml);
        that.historyWithCaret.push(that.composer.getValue());
        silentRemove(placeholder);
      });
    },
    
    undo: function() {
      this.transact();
      
      if (!this.undoPossible()) {
        return;
      }
      
      this.set(this.historyWithCaret[--this.position - 1]);
      this.editor.fire("undo:composer");
    },
    
    redo: function() {
      if (!this.redoPossible()) {
        return;
      }
      
      this.set(this.historyWithCaret[++this.position - 1]);
      this.editor.fire("redo:composer");
    },
    
    undoPossible: function() {
      return this.position > 1;
    },
    
    redoPossible: function() {
      return this.position < this.history.length;
    },
    
    set: function(html) {
      this.composer.setValue(html);
      var placeholder = this.composer.sandbox.getDocument().getElementById(CARET_PLACEHOLDER);
      if (placeholder) {
        this.composer.selection.setAfter(placeholder);
        silentRemove(placeholder);
      } else {
        this.editor.focus(true);
      }
    }
  });
})(wysihtml5);

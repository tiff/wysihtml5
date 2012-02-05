/**
 * Rich Text Query/Formatting Commands
 * 
 * @author Christopher Blum <christopher.blum@xing.com>
 */
wysihtml5.commands = {
  initialize: function(editor) {
    this.editor   = editor;
    this.element  = editor.composer.element;
    this.doc      = this.element.ownerDocument;
  },
  
  /**
   * Check whether the browser supports the given command
   *
   * @param {Object} element The element which has contentEditable=true
   * @param {String} command The command string which to check (eg. "bold", "italic", "insertUnorderedList")
   * @example
   *    wysihtml5.commands.supports("createLink");
   */
  support: function(command) {
    return wysihtml5.browser.supportsCommand(this.doc, command);
  },
  
  /**
   * Check whether the browser supports the given command
   *
   * @param {Object} element The element which has contentEditable=true
   * @param {String} command The command string which to execute (eg. "bold", "italic", "insertUnorderedList")
   * @param {String} [value] The command value parameter, needed for some commands ("createLink", "insertImage", ...), optional for commands that don't require one ("bold", "underline", ...)
   * @example
   *    wysihtml5.commands.exec("insertImage", "http://a1.twimg.com/profile_images/113868655/schrei_twitter_reasonably_small.jpg");
   */
  exec: function(command, value) {
    var obj     = this[command],
        method  = obj && obj.exec;
    
    this.editor.fire("beforecommand:composer");
    
    if (method) {
      return method.call(obj, this.element, command, value);
    } else {
      try {
        // try/catch for buggy firefox
        return this.doc.execCommand(command, false, value);
      } catch(e) {}
    }
    
    this.editor.fire("aftercommand:composer");
  },
  
  /**
   * Check whether the current command is active
   * If the caret is within a bold text, then calling this with command "bold" should return true
   *
   * @param {Object} element The element which has contentEditable=true
   * @param {String} command The command string which to check (eg. "bold", "italic", "insertUnorderedList")
   * @param {String} [commandValue] The command value parameter (eg. for "insertImage" the image src)
   * @return {Boolean} Whether the command is active
   * @example
   *    var isCurrentSelectionBold = wysihtml5.commands.state("bold");
   */
  state: function(command, commandValue) {
    var obj     = this[command],
        method  = obj && obj.state;
    if (method) {
      return method.call(obj, this.element, command, commandValue);
    } else {
      try {
        // try/catch for buggy firefox
        return this.doc.queryCommandState(command);
      } catch(e) {
        return false;
      }
    }
  },
  
  /**
   * Get the current command's value
   *
   * @param {Object} element The element which has contentEditable=true
   * @param {String} command The command string which to check (eg. "formatBlock")
   * @return {String} The command value
   * @example
   *    var currentBlockElement = wysihtml5.commands.value("formatBlock");
   */
  value: function(command) {
    var obj     = this[command],
        method  = obj && obj.value;
    if (method) {
      method(this.element, command);
    } else {
      try {
        // try/catch for buggy firefox
        return this.doc.queryCommandValue(command);
      } catch(e) {
        return null;
      }
    }
  }
};
/**
 * Toolbar
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Object} parent Reference to instance of Editor instance
 * @param {Element} container Reference to the toolbar container element
 *
 * @example
 *    <div id="toolbar">
 *      <a data-wysihtml5-command="createLink">insert link</a>
 *      <a data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h1">insert h1</a>
 *    </div>
 *
 *    <script>
 *      var toolbar = new wysihtml5.toolbar.Toolbar(editor, $("toolbar"));
 *    </script>
 */
wysihtml5.toolbar.Toolbar = Class.create(
  /** @scope wysihtml5.toolbar.Toolbar.prototype */ {
  initialize: function(parent, container) {
    this.parent     = parent;
    this.container  = $(container);
    this.composer   = parent.composer;
    
    this._getLinks("command");
    this._getLinks("action");
    
    this._observe();
    this.show();
    
    this.container.select("[data-wysihtml5-command=insertSpeech]").each(function(link) {
      new wysihtml5.toolbar.Speech(this, link);
    }.bind(this));
  },
  
  _getLinks: function(type) {
    var links   = this[type + "Links"] = this.container.select("a[data-wysihtml5-" + type + "]"),
        mapping = this[type + "Mapping"] = {};
    links.each(function(link) {
      var name    = link.getAttribute("data-wysihtml5-" + type),
          value   = link.getAttribute("data-wysihtml5-" + type + "-value"),
          dialog  = this._getDialog(link, name);
      
      mapping[name + ":" + value] = {
        link:   link,
        name:   name,
        value:  value,
        dialog: dialog,
        state:  false
      };
    }, this);
  },
  
  _getDialog: function(link, command) {
    var dialogElement = this.container.down("[data-wysihtml5-dialog='" + command + "']"),
        sandboxDoc    = this.composer.sandbox.getDocument(),
        dialog,
        caretBookmark;
    if (dialogElement) {
      dialog = new wysihtml5.toolbar.Dialog(link, dialogElement);
      
      dialog.observe("show", function() {
        caretBookmark = wysihtml5.utils.caret.getBookmark(sandboxDoc);
      });
      
      dialog.observe("save", function(attributes) {
        this.parent.focus(false);
        
        if (caretBookmark) {
          wysihtml5.utils.caret.setBookmark(caretBookmark);
        }
        this._execCommand(command, attributes);
      }.bind(this));
      
      dialog.observe("cancel", function() {
        this.parent.focus(false);
      }.bind(this));
    }
    return dialog;
  },
  
  /**
   * @example
   *    var toolbar = new wysihtml5.Toolbar();
   *    // Insert a <blockquote> element or wrap current selection in <blockquote>
   *    toolbar.execCommand("formatBlock", "blockquote");
   */
  execCommand: function(command, commandValue) {
    if (this.commandsDisabled) {
      return;
    }
    
    var commandObj = this.commandMapping[command + ":" + commandValue];
    
    // Show dialog when available
    if (commandObj && commandObj.dialog && !commandObj.state) {
      commandObj.dialog.show();
    } else {
      this._execCommand(command, commandValue);
    }
  },
  
  _execCommand: function(command, commandValue) {
    // Make sure that composer is focussed (false => don't move caret to the end)
    this.parent.focus(false);
    
    wysihtml5.commands.exec(this.composer.element, command, commandValue);
    this._updateLinkStates();
  },
  
  execAction: function(action) {
    switch(action) {
      case "change_view":
        if (this.parent.currentView === this.parent.textarea) {
          this.parent.fire("change_view", "composer");
        } else {
          this.parent.fire("change_view", "textarea");
        }
        break;
    }
  },
  
  _observe: function() {
    // 'javascript:;' and unselectable=on Needed for IE, but done in all browsers to make sure that all get the same css applied
    // (you know, a:link { ... } doesn't match anchors with missing href attribute)
    var links = [this.commandLinks, this.actionLinks].flatten();
    links.invoke("setAttribute", "href", "javascript:;");
    links.invoke("setAttribute", "unselectable", "on");
    
    // Needed for opera
    this.container.on("mousedown", "[data-wysihtml5-command]", function(event) { event.preventDefault(); });
    
    this.container.on("click", "[data-wysihtml5-command]", function(event) {
      var link          = event.target,
          command       = link.getAttribute("data-wysihtml5-command"),
          commandValue  = link.getAttribute("data-wysihtml5-command-value");
      this.execCommand(command, commandValue);
      event.preventDefault();
    }.bind(this));
    
    this.container.on("click", "[data-wysihtml5-action]", function(event) {
      var action = event.target.getAttribute("data-wysihtml5-action");
      this.execAction(action);
      event.preventDefault();
    }.bind(this));
    
    this.parent.observe("focus:composer", function() {
      this.bookmark = null;
      clearInterval(this.interval);
      this.interval = setInterval(this._updateLinkStates.bind(this), 500);
    }.bind(this));
    
    this.parent.observe("blur:composer", function() {
      clearInterval(this.interval);
    }.bind(this));
    
    this.parent.observe("destroy:composer", function() {
      clearInterval(this.interval);
    }.bind(this));
    
    this.parent.observe("change_view", function(event) {
      var currentView       = event.memo,
          disabledClassName = "wysihtml5-commands-disabled";
      // Set timeout needed in order to let the blur event fire first
      setTimeout(function() {
        this.commandsDisabled = (currentView !== "composer");
        this._updateLinkStates();
        if (this.commandsDisabled) {
          this.container.addClassName(disabledClassName);
        } else {
          this.container.removeClassName(disabledClassName);
        }
      }.bind(this), 0);
    }.bind(this));
  },
  
  _updateLinkStates: function() {
    var activeClassName   = "wysihtml5-command-active",
        disabledClassName = "wysihtml5-command-disabled",
        element           = this.composer.element,
        commandMapping    = this.commandMapping,
        i,
        state,
        command;
    // every millisecond counts... this is executed quite often
    // no library .each(), just a native speedy-gonzales "for"-loop
    for (i in commandMapping) {
      command = commandMapping[i];
      if (this.commandsDisabled) {
        state = false;
        command.link.addClassName(disabledClassName);
        if (command.dialog) {
          command.dialog.hide();
        }
      } else {
        state = wysihtml5.commands.state(element, command.name, command.value);
        if (Object.isArray(state)) {
          // Grab first and only object/element in state array, otherwise convert state into boolean
          // to avoid showing a dialog for multiple selected elements which may have different attributes
          // eg. when two links with different href are selected, the state will be an array consisting of both link elements
          // but the dialog interface can only update one
          state = state.length === 1 ? state[0] : true;
        }
        command.link.removeClassName(disabledClassName);
      }
      
      if (command.state === state) {
        continue;
      }
      
      command.state = state;
      if (state) {
        command.link.addClassName(activeClassName);
        if (command.dialog) {
          if (typeof(state) === "object") {
            command.dialog.show(state);
          } else {
            command.dialog.hide();
          }
        }
      } else {
        command.link.removeClassName(activeClassName);
        if (command.dialog) {
          command.dialog.hide();
        }
      }
    }
  },
  
  show: function() {
    this.container.show();
  },
  
  hide: function() {
    this.container.hide();
  }
});
/**
 * WYSIHTML5 Editor
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} textareaElement Reference to the textarea which should be turned into a rich text interface
 * @param {Object} [config] See defaultConfig object below for explanation of each individual config option
 *
 * @events
 *    load
 *    beforeload (for internal use only)
 *    focus
 *    focus:composer
 *    focus:textarea
 *    blur
 *    blur:composer
 *    blur:textarea
 *    change
 *    change:composer
 *    change:textarea
 *    paste
 *    paste:composer
 *    paste:textarea
 *    newword:composer
 *    destroy:composer
 *    change_view
 */
wysihtml5.Editor = (function() {
  var defaultConfig = {
    // Give the editor a name, the name will also be set as class name on the iframe and on the iframe's body 
    name:                 null,
    // Whether the editor should look like the textarea (by adopting styles)
    style:                true,
    // Id of the toolbar element, pass falsey value if you don't want any toolbar logic
    toolbar:              null,
    // Whether urls, entered by the user should automatically become clickable-links
    autoLink:             true,
    // Object which includes parser rules to apply when html gets inserted via copy & paste
    parserRules:          null,
    // Parser method to use when the user inserts content via copy & paste
    parser:               wysihtml5.utils.sanitizeHTML || Prototype.K,
    // Class name which should be set on the contentEditable element in the created sandbox iframe, can be styled via the 'stylesheets' option
    composerClassName:    "wysihtml5-editor",
    // Class name to add to the body when the wysihtml5 editor is supported
    bodyClassName:        "wysihtml5-supported",
    // Array (or single string) of stylesheet urls to be loaded in the editor's iframe
    stylesheets:          [],
    // Placeholder text to use, defaults to the placeholder attribute on the textarea element
    placeholderText:      null,
    // Whether the composer should allow the user to manually resize images, tables etc.
    allowObjectResizing:  true
  };
  
  // Incremental instance id
  var instanceId = new Date().getTime();
  
  return Class.create(
    /** @scope wysihtml5.Editor.prototype */ {
    initialize: function(textareaElement, config) {
      this._instanceId      = ++instanceId;
      this.textareaElement  = $(textareaElement);
      this.config           = Object.extend(Object.clone(defaultConfig), config);
      this.textarea         = new wysihtml5.views.Textarea(this, this.textareaElement, this.config);
      this.currentView      = this.textarea;
      this._isCompatible    = wysihtml5.browserSupports.contentEditable();
      
      // Sort out unsupported browsers here
      if (!this._isCompatible) {
        (function() { this.fire("beforeload").fire("load"); }).bind(this).defer();
        return;
      }
      
      // Add class name to body, to indicate that the editor is supported
      $(document.body).addClassName(this.config.bodyClassName);
      
      this.composer = new wysihtml5.views.Composer(this, this.textareaElement, this.config);
      this.currentView = this.composer;
      
      if (Object.isFunction(this.config.parser)) {
        this._initParser();
      }
      
      this.observe("beforeload", function() {
        this.synchronizer = new wysihtml5.utils.Synchronizer(this, this.textarea, this.composer);
        if (this.config.toolbar) {
          this.toolbar = new wysihtml5.toolbar.Toolbar(this, this.config.toolbar);
        }
      }.bind(this));
      
      try {
        console.log("Heya! This page is using wysihtml5 for rich text editing. Check out https://github.com/xing/wysihtml5");
      } catch(e) {}
    },
    
    isCompatible: function() {
      return this._isCompatible;
    },
    
    observe: function() {
      Element.observe.apply(Element, this._getEventArguments(arguments));
      return this;
    },

    fire: function() {
      Element.fire.apply(Element, this._getEventArguments(arguments));
      return this;
    },

    stopObserving: function() {
      Element.stopObserving.apply(Element, this._getEventArguments(arguments));
      return this;
    },

    /**
     * Builds an array that can be passed into Function.prototyope.apply
     * when called on Element.observe, Element.stopObserving, Element.fire
     */
    _getEventArguments: function(args) {
      args = $A(args);
      if (args[0]) {
        args[0] = "wysihtml5:" + this._instanceId + ":" + args[0];
      }
      return [document.documentElement, args].flatten();
    },

    clear: function() {
      this.currentView.clear();
      return this;
    },

    getValue: function(parse) {
      return this.currentView.getValue(parse);
    },

    setValue: function(html, parse) {
      if (!html) {
        return this.clear();
      }
      this.currentView.setValue(html, parse);
      return this;
    },

    focus: function(setToEnd) {
      this.currentView.focus(setToEnd);
      return this;
    },

    /**
     * Deactivate editor (make it readonly)
     */
    disable: function() {
      this.currentView.disable();
      return this;
    },
    
    /**
     * Activate editor
     */
    enable: function() {
      this.currentView.enable();
      return this;
    },
    
    isEmpty: function() {
      return this.currentView.isEmpty();
    },
    
    hasPlaceholderSet: function() {
      return this.currentView.hasPlaceholderSet();
    },
    
    parse: function(htmlOrElement) {
      var returnValue = this.config.parser(htmlOrElement, this.config.parserRules, this.composer.sandbox.getDocument(), true);
      if (typeof(htmlOrElement) === "object") {
        wysihtml5.quirks.redraw(htmlOrElement);
      }
      return returnValue;
    },
    
    /**
     * Prepare html parser logic
     *  - Loads parser rules if config.parserRules is a string
     *  - Observes for paste and drop
     */
    _initParser: function() {
      if (typeof(this.config.parserRules) === "string") {
        new Ajax.Request(this.config.parserRules, {
          method:   "get",
          onCreate: function() {
            this.config.parserRules = defaultConfig.parserRules;
          }.bind(this),
          onSuccess: function(transport) {
            this.config.parserRules = transport.responseJSON || transport.responseText.evalJSON();
          }.bind(this)
        });
      }
      
      this.observe("paste:composer", function() {
        var keepScrollPosition = true;
        wysihtml5.utils.caret.executeAndRestore(this.composer.sandbox.getDocument(), function() {
          wysihtml5.quirks.cleanPastedHTML(this.composer.element);
          this.parse(this.composer.element);
        }.bind(this), keepScrollPosition);
      }.bind(this));
      
      this.observe("paste:textarea", function() {
        var value   = this.textarea.getValue(),
            newValue;
        newValue = this.parse(value);
        this.textarea.setValue(newValue);
      }.bind(this));
    }
  });
})();
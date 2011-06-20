/**
 * Class that takes care that the value of the composer and the textarea is always in sync
 */
wysihtml5.utils.Synchronizer = Class.create(
  /** @scope wysihtml5.utils.Synchronizer.prototype */ {
  INTERVAL: 400,
  
  initialize: function(parent, textarea, composer) {
    this.parent   = parent;
    this.textarea = textarea;
    this.composer = composer;
    
    this._observe();
  },
  
  /**
   * Sync html from composer to textarea
   * Takes care of placeholders
   * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the textarea
   */
  fromComposerToTextarea: function(shouldParseHtml) {
    this.textarea.setValue(this._trim(this.composer.getValue()), shouldParseHtml);
  },
  
  /**
   * Sync value of textarea to composer
   * Takes care of placeholders
   * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the composer
   */
  fromTextareaToComposer: function(shouldParseHtml) {
    var textareaValue = this.textarea.getValue();
    if (textareaValue) {
      this.composer.setValue(textareaValue, shouldParseHtml);
    } else {
      this.composer.clear();
      this.parent.fire("set_placeholder");
    }
  },
  
  /**
   * Invoke syncing based on view state
   * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the composer/textarea
   */
  sync: function(shouldParseHtml) {
    if (this.parent.currentView.name == "textarea") {
      this.fromTextareaToComposer(shouldParseHtml);
    } else {
      this.fromComposerToTextarea(shouldParseHtml);
    }
  },
  
  /**
   * Initializes interval-based syncing
   * also makes sure that on-submit the composer's content is synced with the textarea
   * immediately when the form gets submitted
   */
  _observe: function() {
    var interval,
        form          = this.textarea.element.up("form"),
        startInterval = function() {
          interval = setInterval(function() { this.fromComposerToTextarea(); }.bind(this), this.INTERVAL);
        }.bind(this),
        stopInterval  = function() {
          clearInterval(interval);
          interval = null;
        };
    
    startInterval();
    
    if (form) {
      // If the textarea is in a form make sure that after onreset and onsubmit the composer
      // has the correct state
      form.observe("submit", function() { this.sync(true); }.bind(this));
      form.observe("reset", function() { this.fromTextareaToComposer.bind(this).defer(); }.bind(this));
    }
    
    this.parent.observe("change_view", function(event) {
      var view = event.memo;
      if (view == "composer" && !interval) {
        this.fromTextareaToComposer(true);
        startInterval();
      } else if (view == "textarea") {
        this.fromComposerToTextarea(true);
        stopInterval();
      }
    }.bind(this));
    
    this.parent.observe("destroy:composer", stopInterval);
  },
  
  /**
   * Normalizes white space in the beginning and end
   * This: "     foo    " will become: " foo "
   */
  _trim: (function() {
    var WHITE_SPACE_START = /^\s+/,
        WHITE_SPACE_END   = /\s+$/;
    return function(str) {
      return str.replace(WHITE_SPACE_START, " ").replace(WHITE_SPACE_END, " ");
    };
  })()
});
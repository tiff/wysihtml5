/**
 * Toolbar Dialog
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} link The toolbar link which causes the dialog to show up
 * @param {Element} container The dialog container
 *
 * @example
 *    <!-- Toolbar link -->
 *    <a data-wysihtml5-command="insertImage">insert an image</a>
 *
 *    <!-- Dialog -->
 *    <div data-wysihtml5-dialog="insertImage" style="display: none;">
 *      <label>
 *        URL: <input data-wysihtml5-dialog-field="src" value="http://">
 *      </label>
 *      <label>
 *        Alternative text: <input data-wysihtml5-dialog-field="alt" value="">
 *      </label>
 *    </div>
 *
 *    <script>
 *      var dialog = new wysihtml5.toolbar.Dialog(
 *        $$("[data-wysihtml5-command='insertImage']").first(),
 *        $$("[data-wysihtml5-dialog='insertImage']").first()
 *      );
 *      dialog.observe("save", function(attributes) {
 *        // do something
 *      });
 *    </script>
 */
wysihtml5.toolbar.Dialog = Class.create(
  /** @scope wysihtml5.toolbar.Dialog.prototype */ {
  initialize: function(link, container) {
    this.link       = link;
    this.container  = container;
  },
  
  _observe: function() {
    if (this._observed) {
      return;
    }
    
    var callbackWrapper = function(event) {
      var attributes = this._serialize();
      if (attributes == this.elementToChange) {
        this.fire("edit", attributes);
      } else {
        this.fire("save", attributes);
      }
      this.hide();
      event.stop();
    }.bind(this);
    
    this.link.on("click", function(event) {
      if (this.link.hasClassName("wysihtml5-command-dialog-opened")) {
        setTimeout(this.hide.bind(this), 0);
      }
    }.bind(this));
    
    this.container.on("keydown", function(event) {
      if (event.keyCode === Event.KEY_RETURN) {
        callbackWrapper(event);
      }
      if (event.keyCode === Event.KEY_ESC) {
        this.hide();
      }
    }.bind(this));
    
    this.container.on("click", "[data-wysihtml5-dialog-action=save]", callbackWrapper);
    this.container.on("click", "[data-wysihtml5-dialog-action=cancel]", function(event) {
      this.fire("cancel");
      this.hide();
      event.stop();
    }.bind(this));
    
    this.container.select("input, select, textarea").invoke("on", "change", function() {
      clearInterval(this.interval);
    }.bind(this));
    
    this._observed = true;
  },
  
  /**
   * Grabs all fields in the dialog and puts them in key=>value style in an object which
   * then gets returned
   */
  _serialize: function() {
    var data = this.elementToChange || {};
    this.container.select("[data-wysihtml5-dialog-field]").each(function(field) {
      data[field.getAttribute("data-wysihtml5-dialog-field")] = field.getValue();
    });
    return data;
  },
  
  /**
   * Takes the attributes of the "elementToChange"
   * and inserts them in their corresponding dialog input fields
   * 
   * Assume the "elementToChange" looks like this:
   *    <a href="http://www.google.com" target="_blank">foo</a>
   *
   * and we have the following dialog:
   *    <input type="text" data-wysihtml5-dialog-field="href" value="">
   *    <input type="text" data-wysihtml5-dialog-field="target" value="">
   * 
   * after calling _interpolate() the dialog will look like this
   *    <input type="text" data-wysihtml5-dialog-field="href" value="http://www.google.com">
   *    <input type="text" data-wysihtml5-dialog-field="target" value="_blank">
   *
   * Basically it adopted the attribute values into the corresponding input fields
   *
   */
  _interpolate: function() {
    var focusedElement = document.querySelector(":focus");
    this.container.select("[data-wysihtml5-dialog-field]").each(function(field) {
      // Never change elements where the user is currently typing
      if (field === focusedElement) {
        return;
      }
      var fieldName = field.getAttribute("data-wysihtml5-dialog-field"),
          newValue  = this.elementToChange ? (this.elementToChange[fieldName] || "") : field.defaultValue;
      field.setValue(newValue);
    }.bind(this));
  },
  
  observe: function(eventName, handler) {
    this.container.on("dialog:" + eventName, function(event) { handler(event.memo); });
  },
  
  fire: function(eventName, data) {
    this.container.fire("dialog:" + eventName, data);
  },
  
  /**
   * Show the dialog element
   */
  show: function(elementToChange) {
    this.elementToChange = elementToChange;
    this._observe();
    this._interpolate();
    if (elementToChange) {
      this.interval = setInterval(this._interpolate.bind(this), 500);
    }
    this.link.addClassName("wysihtml5-command-dialog-opened");
    this.container.show();
    this.fire("show");
    var firstField = this.container.down("input, select, textarea");
    if (firstField && !elementToChange) {
      try {
        firstField.focus();
      } catch(e) {}
    }
  },
  
  /**
   * Hide the dialog element
   */
  hide: function() {
    clearInterval(this.interval);
    this.elementToChange = null;
    this.link.removeClassName("wysihtml5-command-dialog-opened");
    this.container.hide();
    this.fire("hide");
  }
});
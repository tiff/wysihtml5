wysihtml5.views.Textarea = wysihtml5.views.View.extend(
  /** @scope wysihtml5.views.Textarea.prototype */ {
  name: "textarea",
  
  constructor: function(parent, textareaElement, config) {
    this.base(parent, textareaElement, config);
    
    this._observe();
  },
  
  clear: function() {
    this.element.value = "";
  },
  
  getValue: function(parse) {
    var value = this.isEmpty() ? "" : this.element.value;
    if (parse) {
      value = this.parent.parse(value);
    }
    return value;
  },
  
  setValue: function(html, parse) {
    if (parse) {
      html = this.parent.parse(html);
    }
    this.element.value = html;
  },
  
  hasPlaceholderSet: function() {
    var supportsPlaceholder = wysihtml5.browser.supportsPlaceholderAttributeOn(this.element),
        placeholderText     = this.element.getAttribute("placeholder") || null,
        value               = this.element.value,
        isEmpty             = !value;
    return (supportsPlaceholder && isEmpty) || (value === placeholderText);
  },
  
  isEmpty: function() {
    return !wysihtml5.lang.string(this.element.value).trim() || this.hasPlaceholderSet();
  },
  
  _observe: function() {
    var element = this.element,
        parent  = this.parent,
        eventMapping = {
          focusin:  "focus",
          focusout: "blur"
        },
        /**
         * Calling focus() or blur() on an element doesn't synchronously trigger the attached focus/blur events
         * This is the case for focusin and focusout, so let's use them whenever possible, kkthxbai
         */
        events = wysihtml5.browser.supportsEvent("focusin") ? ["focusin", "focusout", "change"] : ["focus", "blur", "change"];
    
    parent.on("beforeload", function() {
      wysihtml5.dom.observe(element, events, function(event) {
        var eventName = eventMapping[event.type] || event.type;
        parent.fire(eventName).fire(eventName + ":textarea");
      });
      
      wysihtml5.dom.observe(element, ["paste", "drop"], function() {
        setTimeout(function() { parent.fire("paste").fire("paste:textarea"); }, 0);
      });
    });
  }
});
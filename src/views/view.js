/**
 * TODO: the following methods still need unit test coverage
 */
wysihtml5.views.View = Base.extend(
  /** @scope wysihtml5.views.View.prototype */ {
  constructor: function(parent, textareaElement, config) {
    this.parent   = parent;
    this.element  = textareaElement;
    this.config   = config;
    
    this._observeViewChange();
  },
  
  _observeViewChange: function() {
    var that = this;
    this.parent.on("beforeload", function() {
      that.parent.on("change_view", function(view) {
        if (view === that.name) {
          that.parent.currentView = that;
          that.show();
          // Using tiny delay here to make sure that the placeholder is set before focusing
          setTimeout(function() { that.focus(); }, 0);
        } else {
          that.hide();
        }
      });
    });
  },
  
  focus: function() {
    if (this.element.ownerDocument.querySelector(":focus") === this.element) {
      return;
    }
    
    try { this.element.focus(); } catch(e) {}
  },
  
  hide: function() {
    this.element.style.display = "none";
  },
  
  show: function() {
    this.element.style.display = "";
  },
  
  disable: function() {
    this.element.setAttribute("disabled", "disabled");
  },
  
  enable: function() {
    this.element.removeAttribute("disabled");
  }
});
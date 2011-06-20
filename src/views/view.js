/**
 * TODO: the following methods still need unit test coverage
 */
wysihtml5.views.View = Class.create(
  /** @scope wysihtml5.views.View.prototype */ {
  initialize: function(parent, textareaElement, config) {
    this.parent   = parent;
    this.element  = textareaElement;
    this.config   = config;
    
    this._observeViewChange();
  },
  
  _observeViewChange: function() {
    this.parent.observe("beforeload", function() {
      this.parent.observe("change_view", function(event) {
        var view = event.memo;
        if (view === this.name) {
          this.parent.currentView = this;
          this.show();
          // Using defer() here to make sure that the placeholder is set before focusing
          this.focus.bind(this).defer();
        } else {
          this.hide();
        }
      }.bind(this));
    }.bind(this));
  },
  
  focus: function() {
    if (this.element.ownerDocument.querySelector(":focus") === this.element) {
      return;
    }
    
    try { this.element.focus(); } catch(e) {}
  },
  
  hide: function() {
    this.element.hide();
  },
  
  show: function() {
    this.element.show();
  },
  
  disable: function() {
    this.element.setAttribute("disabled", "disabled");
  },
  
  enable: function() {
    this.element.removeAttribute("disabled");
  }
});
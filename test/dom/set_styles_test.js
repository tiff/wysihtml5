module("wysihtml5.dom.setStyles", {
  setup: function() {
    this.element = document.createElement("div");
    document.body.appendChild(this.element);
  },
  
  teardown: function() {
    this.element.parentNode.removeChild(this.element);
  }
});

test("Basic test", function() {
  wysihtml5.dom.setStyles("text-align: right; float: left").on(this.element);
  equals(wysihtml5.dom.getStyle("text-align").from(this.element), "right");
  equals(wysihtml5.dom.getStyle("float").from(this.element),      "left");
  
  wysihtml5.dom.setStyles({ "float": "right" }).on(this.element);
  equals(wysihtml5.dom.getStyle("float").from(this.element), "right");
});
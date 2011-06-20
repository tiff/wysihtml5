module("wysihtml5.copyStyles", {
  setup: function() {
    this.div        = new Element("div");
    this.span       = new Element("span", { id: "wysihtml5-test-span" });
    this.anotherDiv = new Element("div");
    this.iframe     = new Element("iframe", { src: "javascript:'<html></html>'" });
    
    $(document.body)
      .insert(this.div)
      .insert(this.span)
      .insert(this.anotherDiv)
      .insert(this.iframe);
  },
  
  teardown: function() {
    [this.div, this.span, this.anotherDiv, this.iframe].invoke("remove");
  },
  
  insertCss: function(css) {
    var styleElement = new Element("style", { type: "text/css" });
    if (styleElement.styleSheet) {
      styleElement.styleSheet.cssText = css;
    } else {
      styleElement.appendChild(document.createTextNode(css));
    }
    $$("head, body")[0].insert(styleElement);
  }
});


test("Basic Tests", function() {
  this.div.setStyle({ width: "400px", height: "200px", textAlign: "right", "float": "left" });
  
  wysihtml5.utils.copyStyles("width", "height", "text-align", "float").from(this.div).to(this.span);
  
  equals(this.span.getStyle("width"), "400px", "Width correctly copied");
  equals(this.span.getStyle("height"), "200px", "Height correctly copied");
  equals(this.span.getStyle("text-align"), "right", "Text-align correctly copied");
  equals(this.span.getStyle("float"), "left", "Float correctly copied");
});


test("Whether it copies native user agent styles", function() {
  wysihtml5.utils.copyStyles("display").from(this.span).to(this.div);
  
  equals(this.div.getStyle("display"), "inline", "Display correctly copied");
});


test("Advanced tests", function() {
  this.span.style.cssText = "color: rgb(255, 0, 0); -moz-border-radius: 5px 5px 5px 5px;";
  this.div.style.cssText = "color: rgb(0, 255, 0); text-decoration: underline;";
  
  wysihtml5.utils
    .copyStyles(["color", "-moz-border-radius", "unknown-style"])
    .from(this.span)
    .to(this.div)
    .andTo(this.anotherDiv);
  
  // Opera and IE internally convert color values either to rgb or hexcode, and some version of IE either
  // strip or add white spaces between rgb values
  var divColor = this.div.getStyle("color").replace(/\s+/g, "");
  ok(divColor == "rgb(255,0,0)" || divColor == "#ff0000", "First div has correct color");
  
  var anotherDivColor = this.anotherDiv.getStyle("color").replace(/\s+/g, "");
  ok(anotherDivColor == "rgb(255,0,0)" || anotherDivColor == "#ff0000", "Second div has correct color");
  
  equals(this.div.getStyle("textDecoration"), "underline", "Text-decoration hasn't been overwritten");
  
  if ("MozBorderRadius" in this.div.style) {
    equals(this.div.getStyle("-moz-border-radius"), "5px 5px 5px 5px", "First div has correct border-radius");
    equals(this.anotherDiv.getStyle("-moz-border-radius"), "5px 5px 5px 5px", "Second div has correct border-radius");
  }
});


test("Test copying styles from one element to another element which is in an iframe", function() {
  expect(1);
  stop(2000);
  
  // Timeout needed to make sure that the iframe is ready
  setTimeout(function() {
    var iframeDocument = this.iframe.contentWindow.document,
        iframeElement = iframeDocument.createElement("div");
    
    iframeDocument.body.appendChild(iframeElement);
    this.span.style.cssText = "float: left;";
    
    wysihtml5.utils
      .copyStyles("float")
      .from(this.span)
      .to(iframeElement);
    
    equals(iframeElement.style.styleFloat || iframeElement.style.cssFloat, "left", "Element in iframe correctly got css float copied over");
    
    start();
  }.bind(this), 1000);
});


test("Test copying styles that were set via style element", function() {
  this.insertCss("span#wysihtml5-test-span { font-size: 16px; }");
  
  wysihtml5.utils
    .copyStyles("font-size")
    .from(this.span)
    .to(this.div);
  
  equals(this.div.getStyle("font-size"), "16px", "Font-size correctly copied");
});
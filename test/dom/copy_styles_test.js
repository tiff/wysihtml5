module("wysihtml5.dom.copyStyles", {
  setup: function() {
    this.div        = document.createElement("div");
    this.span       = document.createElement("span");
    this.anotherDiv = document.createElement("div");
    this.iframe     = document.createElement("iframe");
    
    this.span.id = "wysihtml5-test-span";
    this.iframe.id = "javascript:'<html></html>'";
    
    document.body.appendChild(this.div);
    document.body.appendChild(this.span);
    document.body.appendChild(this.anotherDiv);
    document.body.appendChild(this.iframe);
  },
  
  teardown: function() {
    this.div.parentNode.removeChild(this.div);
    this.span.parentNode.removeChild(this.span);
    this.anotherDiv.parentNode.removeChild(this.anotherDiv);
    this.iframe.parentNode.removeChild(this.iframe);
  }
});


test("Basic Tests", function() {
  this.div.style.cssText = "width: 400px; height: 200px; text-align: right; float: left;";
  
  wysihtml5.dom.copyStyles(["width", "height", "text-align", "float"]).from(this.div).to(this.span);
  
  equal(wysihtml5.dom.getStyle("width")      .from(this.span), "400px",  "Width correctly copied");
  equal(wysihtml5.dom.getStyle("height")     .from(this.span), "200px",  "Height correctly copied");
  equal(wysihtml5.dom.getStyle("text-align") .from(this.span), "right",  "Text-align correctly copied");
  equal(wysihtml5.dom.getStyle("float")      .from(this.span), "left",   "Float correctly copied");
});


test("Whether it copies native user agent styles", function() {
  wysihtml5.dom.copyStyles(["display"]).from(this.span).to(this.div);
  
  equal(wysihtml5.dom.getStyle("display").from(this.div), "inline", "Display correctly copied");
});


test("Advanced tests", function() {
  this.span.style.cssText = "color: rgb(255, 0, 0); -moz-border-radius: 5px 5px 5px 5px;";
  this.div.style.cssText  = "color: rgb(0, 255, 0); text-decoration: underline;";
  
  wysihtml5.dom
    .copyStyles(["color", "-moz-border-radius", "unknown-style"])
    .from(this.span)
    .to(this.div)
    .andTo(this.anotherDiv);
  
  // Opera and IE internally convert color values either to rgb or hexcode, and some version of IE either
  // strip or add white spaces between rgb values
  var divColor = wysihtml5.dom.getStyle("color").from(this.div).replace(/\s+/g, "");
  ok(divColor == "rgb(255,0,0)" || divColor == "#ff0000", "First div has correct color");
  
  var anotherDivColor = wysihtml5.dom.getStyle("color").from(this.anotherDiv).replace(/\s+/g, "");
  ok(anotherDivColor == "rgb(255,0,0)" || anotherDivColor == "#ff0000", "Second div has correct color");
  
  equal(wysihtml5.dom.getStyle("text-decoration").from(this.div), "underline", "Text-decoration hasn't been overwritten");
  
  if ("MozBorderRadius" in this.div.style) {
    equal(wysihtml5.dom.getStyle("-moz-border-radius").from(this.div),        "5px 5px 5px 5px", "First div has correct border-radius");
    equal(wysihtml5.dom.getStyle("-moz-border-radius").from(this.anotherDiv), "5px 5px 5px 5px", "Second div has correct border-radius");
  }
});


asyncTest("Test copying styles from one element to another element which is in an iframe", function() {
  expect(1);
  
  var that = this;
  
  // Timeout needed to make sure that the iframe is ready
  setTimeout(function() {
    var iframeDocument = that.iframe.contentWindow.document,
        iframeElement = iframeDocument.createElement("div");
    
    iframeDocument.body.appendChild(iframeElement);
    that.span.style.cssText = "float: left;";
    
    wysihtml5.dom
      .copyStyles(["float"])
      .from(that.span)
      .to(iframeElement);
    
    equal(iframeElement.style.styleFloat || iframeElement.style.cssFloat, "left", "Element in iframe correctly got css float copied over");
    
    start();
  }, 1000);
});


test("Test copying styles that were set via style element", function() {
  wysihtml5.dom
    .insertCSS(["span#wysihtml5-test-span { font-size: 16px; }"])
    .into(document);
  
  wysihtml5.dom
    .copyStyles(["font-size"])
    .from(this.span)
    .to(this.div);
  
  equal(
    wysihtml5.dom.getStyle("font-size").from(this.div), "16px", "Font-size correctly copied"
  );
});
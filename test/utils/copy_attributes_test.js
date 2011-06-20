module("wysihtml5.utils.copyAttributes", {
  setup: function() {
    this.div        = new Element("div");
    this.span       = new Element("span");
    this.anotherDiv = new Element("div");
    this.iframe     = new Element("iframe", { src: "javascript:'<html></html>'" });
    
    $(document.body).insert(this.iframe);
  },
  
  teardown: function() {
    this.iframe.remove();
  }
});


test("Basic Tests", function() {
  var attributes = { title: "foobar", lang: "en", className: "foo bar" };
  this.div.writeAttribute(attributes);
  
  wysihtml5.utils.copyAttributes("title", "lang", "className").from(this.div).to(this.span);
  
  equals(this.span.title, attributes.title, "Title correctly copied");
  equals(this.span.lang, attributes.lang, "Lang correctly copied");
  equals(this.span.className, attributes.className, "Text-align correctly copied");
});


test("Test copying attributes from one element to another element which is in an iframe", function() {
  expect(1);
  stop(2000);
  
  // Timeout needed to make sure that the iframe is ready
  setTimeout(function() {
    var iframeDocument = this.iframe.contentWindow.document,
        iframeElement = iframeDocument.createElement("div");
    
    iframeDocument.body.appendChild(iframeElement);
    this.span.title = "heya!";
    
    wysihtml5.utils
      .copyAttributes("title")
      .from(this.span)
      .to(iframeElement);
    
    equals(iframeElement.title, "heya!", "Element in iframe correctly got attributes copied over");
    
    start();
  }.bind(this), 1000);
});
module("wysihtml5.dom.getStyle", {
  setup: function() {
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
  },
  
  teardown: function() {
    this.container.parentNode.removeChild(this.container);
  }
});


test("Basic test", function() {
  wysihtml5.dom.insertCSS([
    ".test-element-2 { position: absolute }"
  ]).into(document);
  
  this.container.innerHTML = '<span class="test-element-1" style="float:left;">hello</span>';
  this.container.innerHTML += '<span class="test-element-2">hello</span>';
  this.container.innerHTML += '<i></i>';
  this.container.innerHTML += '<div></div>';
  
  equal(
    wysihtml5.dom.getStyle("float").from(this.container.getElementsByTagName("span")[0]),
    "left"
  );
  
  equal(
    wysihtml5.dom.getStyle("position").from(this.container.getElementsByTagName("span")[1]),
    "absolute"
  );
  
  equal(
    wysihtml5.dom.getStyle("display").from(this.container.getElementsByTagName("div")[0]),
    "block"
  );
  
  equal(
    wysihtml5.dom.getStyle("display").from(this.container.getElementsByTagName("i")[0]),
    "inline"
  );
});


test("Textarea width/height when value causes overflow", function() {
  var textarea = document.createElement("textarea");
  textarea.style.width = "500px";
  textarea.style.height = "200px";
  textarea.value = Array(500).join("Lorem ipsum dolor foo bar");
  this.container.appendChild(textarea);
  
  equal(wysihtml5.dom.getStyle("width")  .from(textarea), "500px");
  equal(wysihtml5.dom.getStyle("height") .from(textarea), "200px");
});
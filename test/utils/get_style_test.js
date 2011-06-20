module("wysihtml5.utils.getStyle", {
  setup: function() {
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
  },
  
  teardown: function() {
    this.container.parentNode.removeChild(this.container);
  }
});


test("Basic test", function() {
  wysihtml5.utils.insertRules([
    ".test-element-2 { position: absolute }"
  ]).into(document);
  
  this.container.innerHTML = '<span class="test-element-1" style="float:left;">hello</span>';
  this.container.innerHTML += '<span class="test-element-2">hello</span>';
  this.container.innerHTML += '<i></i>';
  this.container.innerHTML += '<div></div>';
  
  equals(
    wysihtml5.utils.getStyle(this.container.getElementsByTagName("span")[0], "float"),
    "left"
  );
  
  equals(
    wysihtml5.utils.getStyle(this.container.getElementsByTagName("span")[1], "position"),
    "absolute"
  );
  
  equals(
    wysihtml5.utils.getStyle(this.container.getElementsByTagName("div")[0], "display"),
    "block"
  );
  
  equals(
    wysihtml5.utils.getStyle(this.container.getElementsByTagName("i")[0], "display"),
    "inline"
  );
});


test("Textarea width/height when value causes overflow", function() {
  var textarea = document.createElement("textarea");
  textarea.style.width = "500px";
  textarea.style.height = "200px";
  textarea.value = Array(500).join("Lorem ipsum dolor foo bar");
  this.container.appendChild(textarea);
  
  equals(wysihtml5.utils.getStyle(textarea, "width"), "500px");
  equals(wysihtml5.utils.getStyle(textarea, "height"), "200px");
});
module("wysihtml5 - Incompatible", {
  setup: function() {
    this.originalSupportCheck = wysihtml5.browser.supported;
    wysihtml5.browser.supported = function() { return false; };
    
    this.textareaElement = document.createElement("textarea");
    document.body.appendChild(this.textareaElement);
  },
  
  teardown: function() {
    wysihtml5.browser.supported = this.originalSupportCheck;
    this.textareaElement.parentNode.removeChild(this.textareaElement);
  }
});


asyncTest("Basic test", function() {
  expect(12);
  
  var that = this;
  
  var oldIframesLength = document.getElementsByTagName("iframe").length;
  
  var oldInputsLength = document.getElementsByTagName("input").length;
  
  var editor = new wysihtml5.Editor(this.textareaElement);
  editor.on("load", function() {
    ok(true, "'load' event correctly triggered");
    ok(!wysihtml5.dom.hasClass(document.body, "wysihtml5-supported"), "<body> didn't receive the 'wysihtml5-supported' class");
    ok(!editor.isCompatible(), "isCompatible returns false when rich text editing is not correctly supported in the current browser");
    equal(that.textareaElement.style.display, "", "Textarea is visible");
    ok(!editor.composer, "Composer not initialized");
    
    equal(document.getElementsByTagName("iframe").length, oldIframesLength, "No hidden field has been inserted into the dom");
    equal(document.getElementsByTagName("input").length,  oldInputsLength,  "Composer not initialized");
    
    var html = "foobar<br>";
    editor.setValue(html);
    equal(that.textareaElement.value, html);
    equal(editor.getValue(), html);
    editor.clear();
    equal(that.textareaElement.value, "");
    
    editor.on("focus", function() {
      ok(true, "Generic 'focus' event fired");
    });
    
    editor.on("focus:textarea", function() {
      ok(true, "Specific 'focus:textarea' event fired");
    });
    
    editor.on("focus:composer", function() {
      ok(false, "Specific 'focus:composer' event fired, and that's wrong, there shouldn't be a composer element/view");
    });
    
    QUnit.triggerEvent(that.textareaElement, wysihtml5.browser.supportsEvent("focusin") ? "focusin" : "focus");
    
    start();
  });
});
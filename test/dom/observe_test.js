module("wysihtml5.dom.observe", {
  setup: function() {
    this.container  = document.createElement("div");
    this.element    = document.createElement("textarea");
    this.container.appendChild(this.element);
    document.body.appendChild(this.container);
  },
  
  teardown: function() {
    this.container.parentNode.removeChild(this.container);
    
    var iframe;
    while (iframe = document.querySelector("iframe.wysihtml5-sandbox")) {
      iframe.parentNode.removeChild(iframe);
    }
  }
});


test("Basic test", function() {
  expect(4);
  
  var element = this.element;
  
  wysihtml5.dom.observe(element, ["mouseover", "mouseout"], function(event) {
    ok(true, "'" + event.type + "' correctly fired");
  });
  
  wysihtml5.dom.observe(element, "click", function(event) {
    equal(event.target, element, "event.target or event.srcElement are set");
    ok(true, "'click' correctly fired");
  });
  
  QUnit.triggerEvent(element, "mouseover");
  QUnit.triggerEvent(element, "mouseout");
  QUnit.triggerEvent(element, "click");
});


test("Test stopPropagation and scope of event handler", function(event) {
  expect(2);
  var element = this.element;
  
  wysihtml5.dom.observe(this.container, "click", function(event) {
    ok(false, "The event shouldn't have been bubbled!");
  });
  
  wysihtml5.dom.observe(this.element, "click", function(event) {
    event.stopPropagation();
    equal(this, element, "Event handler bound to correct scope");
    ok(true, "stopPropagation correctly fired");
  });
  
  QUnit.triggerEvent(this.element, "click");
});

test("Test detaching events", function() {
  expect(0);
  var eventListener = wysihtml5.dom.observe(this.element, "click", function() {
    ok(false, "This should not be triggered");
  });
  
  eventListener.stop();
  QUnit.triggerEvent(this.element, "click");
});

asyncTest("Advanced test observing within a sandboxed iframe", function() {
  expect(2);
  
  var sandbox = new wysihtml5.dom.Sandbox(function() {
    var element = sandbox.getDocument().createElement("div");
    sandbox.getDocument().body.appendChild(element);
    wysihtml5.dom.observe(element, ["click", "mousedown"], function(event) {
      ok(true, "'" + event.type + "' correctly fired");
    });
    QUnit.triggerEvent(element, "click");
    QUnit.triggerEvent(element, "mousedown");
    
    start();
  });
  
  sandbox.insertInto(document.body);
});
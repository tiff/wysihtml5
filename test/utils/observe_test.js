module("wysihtml5.utils.observe", {
  setup: function() {
    this.container  = new Element("div");
    this.element    = new Element("textarea");
    this.container.insert(this.element);
    $(document.body).insert(this.container);
  },
  
  teardown: function() {
    this.container.remove();
    $$("iframe.wysihtml5-sandbox").invoke("stopObserving").invoke("remove");
  }
});


test("Basic test", function() {
  expect(4);
  
  wysihtml5.utils.observe(this.element, ["mouseover", "mouseout"], function(event) {
    ok(true, "'" + event.type + "' correctly fired");
  });
  
  wysihtml5.utils.observe(this.element, "click", function(event) {
    equals(event.target, this.element, "event.target or event.srcElement are set");
    ok(true, "'click' correctly fired");
  }.bind(this));
  
  QUnit.triggerEvent(this.element, "mouseover");
  QUnit.triggerEvent(this.element, "mouseout");
  QUnit.triggerEvent(this.element, "click");
});


test("Test stopPropagation and scope of event handler", function(event) {
  expect(2);
  var element = this.element;
  
  wysihtml5.utils.observe(this.container, "click", function(event) {
    ok(false, "The event shouldn't have been bubbled!");
  });
  
  wysihtml5.utils.observe(this.element, "click", function(event) {
    event.stopPropagation();
    equals(this, element, "Event handler bound to correct scope");
    ok(true, "stopPropagation correctly fired");
  });
  
  QUnit.triggerEvent(this.element, "click");
});

test("Test detaching events", function() {
  var eventListener = wysihtml5.utils.observe(this.element, "click", function() {
    ok(false, "This should not be triggered");
  });
  
  eventListener.stop();
  QUnit.triggerEvent(this.element, "click");
});

test("Advanced test observing within a sandboxed iframe", function() {
  expect(2);
  stop(2000);
  
  var sandbox = new wysihtml5.utils.Sandbox(function() {
    var element = sandbox.getDocument().createElement("div");
    sandbox.getDocument().body.appendChild(element);
    wysihtml5.utils.observe(element, ["click", "mousedown"], function(event) {
      ok(true, "'" + event.type + "' correctly fired");
    });
    QUnit.triggerEvent(element, "click");
    QUnit.triggerEvent(element, "mousedown");
    
    start();
  }, { insertInto: document.body });
});
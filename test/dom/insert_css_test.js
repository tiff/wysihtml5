if (wysihtml5.browser.supported()) {

  module("wysihtml5.dom.insertCSS", {
    teardown: function() {
      var iframe;
      while (iframe = document.querySelector("iframe.wysihtml5-sandbox")) {
        iframe.parentNode.removeChild(iframe);
      }
    }
  });

  asyncTest("Basic Tests", function() {
    expect(3);
  
    new wysihtml5.dom.Sandbox(function(sandbox) {
      var doc     = sandbox.getDocument(),
          body    = doc.body,
          element = doc.createElement("sub");
    
      body.appendChild(element);
    
      wysihtml5.dom.insertCSS([
        "sub  { display: block; text-align: right; }",
        "body { text-indent: 50px; }"
      ]).into(doc);
    
      equal(wysihtml5.dom.getStyle("display")    .from(element), "block");
      equal(wysihtml5.dom.getStyle("text-align") .from(element), "right");
      equal(wysihtml5.dom.getStyle("text-indent").from(element), "50px");
    
      start();
    }).insertInto(document.body);
  });

  asyncTest("Check whether CSS is inserted before any loaded stylesheets", function() {
    expect(1);
  
    new wysihtml5.dom.Sandbox(function(sandbox) {
      var doc = sandbox.getDocument();
      
      wysihtml5.dom.insertCSS([".foo {}"]).into(doc);
      
      ok(doc.querySelector("style[type='text/css'] + link[rel=stylesheet]"), "CSS has been inserted before any included stylesheet");
      
      start();
    },  {
      stylesheets: "https://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/blitzer/jquery-ui.css"
    }).insertInto(document.body);
  });
  
}
if (wysihtml5.browser.supported()) {
  module("wysihtml5.Editor", {
    setup: function() {
      wysihtml5.dom.insertCSS([
        "#wysihtml5-test-textarea { width: 200px; height: 100px; margin-top: 5px; font-style: italic; border: 2px solid red; border-radius: 2px; }",
        "#wysihtml5-test-textarea:focus { margin-top: 10px; }"
      ]).into(document);

      this.textareaElement        = document.createElement("textarea");
      this.textareaElement.id     = "wysihtml5-test-textarea";
      this.textareaElement.title  = "Please enter your foo";
      this.textareaElement.value  = "hey tiff, what's up?";
      
      this.form = document.createElement("form");
      this.form.onsubmit = function() { return false; };
      this.form.appendChild(this.textareaElement);
      
      this.originalBodyClassName = document.body.className;
      
      document.body.appendChild(this.form);
    },

    teardown: function() {
      var leftover;
      while (leftover = document.querySelector("iframe.wysihtml5-sandbox, input[name='_wysihtml5_mode']")) {
        leftover.parentNode.removeChild(leftover);
      }
      this.form.parentNode.removeChild(this.form);
      document.body.className = this.originalBodyClassName;
    },

    getComposerElement: function() {
      return this.getIframeElement().contentWindow.document.body;
    },

    getIframeElement: function() {
      var iframes = document.querySelectorAll("iframe.wysihtml5-sandbox");
      return iframes[iframes.length - 1];
    }
  });
  
  asyncTest("Basic test", function() {
    expect(16);
    
    var that = this;
    
    var editor = new wysihtml5.Editor(this.textareaElement);
    editor.observe("load", function() {
      var iframeElement   = that.getIframeElement(),
          composerElement = that.getComposerElement(),
          textareaElement = that.textareaElement;
      ok(true, "Load callback triggered");
      ok(wysihtml5.dom.hasClass(document.body, "wysihtml5-supported"), "<body> received correct class name");
      equal(textareaElement.style.display, "none", "Textarea not visible");
      ok(iframeElement.style.display, "", "Editor iFrame is visible");
      equal(editor.currentView.name, "composer", "Current view is 'composer'");
      
      // Make textarea visible for a short amount of time, in order to calculate dimensions properly
      textareaElement.style.display = "";
      deepEqual(
        [iframeElement.offsetHeight,    iframeElement.offsetWidth],
        [textareaElement.offsetHeight,  textareaElement.offsetWidth],
        "Editor has the same dimensions as the original textarea"
      );
      textareaElement.style.display = "none";
      
      var hiddenField = textareaElement.nextSibling;
      equal(hiddenField.name, "_wysihtml5_mode", "Hidden field has correct name");
      equal(hiddenField.value, "1", "Hidden field has correct value");
      equal(hiddenField.type, "hidden", "Hidden field is actually hidden");
      equal(textareaElement.nextSibling.nextSibling, iframeElement, "Editor iframe is inserted after the textarea");
      equal(composerElement.getAttribute("contentEditable"), "true", "Body element in iframe is editable");
      equal(editor.textarea.element, textareaElement, "Textarea correctly available on editor instance");
      equal(editor.composer.element, composerElement, "contentEditable element available on editor instance");
      equal(wysihtml5.dom.getStyle("font-style").from(composerElement), "italic", "Correct font-style applied to editor element");
      
      if ("borderRadius" in document.createElement("div").style) {
        expect(17);
        ok(wysihtml5.dom.getStyle("border-top-right-radius").from(iframeElement).indexOf("2px") !== -1, "border-radius correctly copied");
      }
      
      equal(composerElement.innerHTML.toLowerCase(), "hey tiff, what's up?", "Copied the initial textarea value to the editor");
      ok(wysihtml5.dom.hasClass(composerElement, "wysihtml5-editor"), "Editor element has correct class name");
      
      start();
    });
  });


  asyncTest("Check setting of name as class name on iframe and iframe's body", function() {
    expect(4);
    
    this.textareaElement.className = "death-star";
    
    var that   = this,
        name   = "star-wars-input",
        editor = new wysihtml5.Editor(this.textareaElement, { name: "star-wars-input" });
    
    editor.observe("load", function() {
      var iframeElement   = that.getIframeElement(),
          composerElement = that.getComposerElement(),
          textareaElement = that.textareaElement;
      ok(wysihtml5.dom.hasClass(iframeElement, name), "iFrame has adopted name as className");
      ok(wysihtml5.dom.hasClass(composerElement, name), "iFrame's body has adopted name as className");
      ok(wysihtml5.dom.hasClass(composerElement, "death-star"), "iFrame's body has adopted the textarea className");
      ok(!wysihtml5.dom.hasClass(textareaElement, name), "Textarea has not adopted name as className");
      start();
    });
  });


  asyncTest("Check textarea with box-sizing: border-box;", function() {
    expect(1);
    
    var that = this;
    
    wysihtml5.dom.setStyles({
      MozBoxSizing:     "border-box",
      WebkitBoxSizing:  "border-box",
      MsBoxSizing:      "border-box",
      boxSizing:        "border-box"
    }).on(this.textareaElement);
  
    var editor = new wysihtml5.Editor(this.textareaElement);
    editor.observe("load", function() {
      // Make textarea visible for a short amount of time, in order to calculate dimensions properly
      that.textareaElement.style.display = "";
      deepEqual(
        [that.getIframeElement().offsetWidth, that.getIframeElement().offsetHeight],
        [that.textareaElement.offsetWidth,    that.textareaElement.offsetHeight],
        "Editor has the same dimensions as the original textarea"
      );
      that.textareaElement.style.display = "none";
    
      start();
    });
  });


  asyncTest("Check whether attributes are copied", function() {
    expect(1);
    
    var that = this;
    
    var editor = new wysihtml5.Editor(this.textareaElement);
    editor.observe("load", function() {
      equal(that.getComposerElement().title, that.textareaElement.title, "Editor got attributes copied over from textarea");
      start();
    });
  });


  asyncTest("Check events", function() {
    expect(8);
    
    var that = this;
    
    var editor = new wysihtml5.Editor(this.textareaElement);
    
    editor.observe("beforeload", function() {
      ok(true, "'beforeload' event correctly fired");
    });
    
    editor.observe("load", function() {
      var composerElement = that.getComposerElement(),
          iframeElement   = that.getIframeElement();
      
      editor.observe("focus", function() {
        ok(true, "'focus' event correctly fired");
      });
      
      editor.observe("blur", function() {
        ok(true, "'blur' event correctly fired");
      });
      
      editor.observe("change", function() {
        ok(true, "'change' event correctly fired");
      });
      
      editor.observe("paste", function() {
        ok(true, "'paste' event correctly fired");
      });
      
      editor.observe("drop", function() {
        ok(true, "'drop' event correctly fired");
      });
      
      editor.observe("custom_event", function() {
        ok(true, "'custom_event' correctly fired");
      });
      
      QUnit.triggerEvent(composerElement, "focus");
      editor.stopObserving("focus");
      
      // Modify innerHTML in order to force 'change' event to trigger onblur
      composerElement.innerHTML = "foobar";
      QUnit.triggerEvent(composerElement, "blur");
      QUnit.triggerEvent(composerElement, "focusout");
      equal(wysihtml5.dom.getStyle("margin-top").from(iframeElement), "5px", ":focus styles are correctly unset");
      QUnit.triggerEvent(composerElement, "paste");
      QUnit.triggerEvent(composerElement, "drop");
      
      editor.fire("custom_event");
      
      // Delay teardown in order to avoid unwanted js errors caused by a too early removed sandbox iframe
      // which then causes js errors in Safari 5
      setTimeout(function() { start(); }, 100);
    });
  });


  asyncTest("Check sync (basic)", function() {
    expect(1);
    
    var that = this;
    
    var editor = new wysihtml5.Editor(this.textareaElement);
    editor.observe("load", function() {
      var html = "<p>hello foobar, what up?</p>";
      that.getComposerElement().innerHTML = html;
    
      setTimeout(function() {
        equal(that.textareaElement.value.toLowerCase(), html.toLowerCase(), "Editor content got correctly copied over to original textarea");
        start();
      }, 500);
    });
  });
  
  
  asyncTest("Check sync (advanced)", function() {
    expect(5);
    
    var that = this;
    
    var editor = new wysihtml5.Editor(this.textareaElement, {
      parserRules: { tags: { "strong": true } }
    });
    
    editor.observe("load", function() {
      var html = "<strong>timmay!</strong>",
          composerElement = that.getComposerElement();
      composerElement.innerHTML = html;
      
      setTimeout(function() {
        equal(that.textareaElement.value.toLowerCase(), html.toLowerCase(), "Editor content got correctly copied over to original textarea");
        
        composerElement.innerHTML = "<font color=\"red\">hey </font><strong>helen!</strong>";
        editor.fire("change_view", "textarea");
        equal(that.textareaElement.value.toLowerCase(), "hey <strong>helen!</strong>", "Editor got immediately copied over to textarea after switching the view");
        
        that.textareaElement.value = "<i>hey </i><strong>richard!</strong>";
        editor.fire("change_view", "composer");
        equal(composerElement.innerHTML.toLowerCase(), "hey <strong>richard!</strong>", "Textarea sanitized and copied over it's value to the editor after switch");
        
        composerElement.innerHTML = "<i>hey </i><strong>timmay!</strong>";
        QUnit.triggerEvent(that.form, "submit");
        equal(that.textareaElement.value.toLowerCase(), "hey <strong>timmay!</strong>", "Textarea gets the sanitized content of the editor onsubmit");
        
        setTimeout(function() {
          that.form.reset();
          
          // Timeout needed since reset() isn't executed synchronously
          setTimeout(function() {
            equal(wysihtml5.dom.getTextContent(composerElement), "", "Editor is empty after reset");
            start();
          }, 100);
          
        }, 500);
        
      }, 500);
      
    });
  });
  
  
  asyncTest("Check placeholder", function() {
    expect(13);
    
    var that = this;
    
    var placeholderText = "enter text ...";
    this.textareaElement.value = "";
    this.textareaElement.setAttribute("placeholder", "enter text ...");
    
    var editor = new wysihtml5.Editor(this.textareaElement);
    editor.observe("load", function() {
      var composerElement = that.getComposerElement();
      equal(wysihtml5.dom.getTextContent(composerElement), placeholderText, "Placeholder text correctly copied into textarea");
      ok(wysihtml5.dom.hasClass(composerElement, "placeholder"), "Editor got 'placeholder' css class");
      ok(editor.hasPlaceholderSet(), "'hasPlaceholderSet' returns correct value when placeholder is actually set");
      editor.fire("focus:composer");
      equal(wysihtml5.dom.getTextContent(composerElement), "", "Editor is empty after focus");
      ok(!wysihtml5.dom.hasClass(composerElement, "placeholder"), "Editor hasn't got 'placeholder' css class");
      ok(!editor.hasPlaceholderSet(), "'hasPlaceholderSet' returns correct value when placeholder isn't actually set");
      editor.fire("blur:composer");
      equal(wysihtml5.dom.getTextContent(composerElement), placeholderText, "Editor restored placeholder text after unfocus");
      editor.fire("focus:composer");
      equal(wysihtml5.dom.getTextContent(composerElement), "");
      composerElement.innerHTML = "some content";
      editor.fire("blur:composer");
      equal(wysihtml5.dom.getTextContent(composerElement), "some content");
      ok(!wysihtml5.dom.hasClass(composerElement, "placeholder"), "Editor hasn't got 'placeholder' css class");
      editor.fire("focus:composer");
      // Following html causes innerText and textContent to report an empty string
      var html = '<img>';
      composerElement.innerHTML = html;
      editor.fire("blur:composer");
      equal(composerElement.innerHTML.toLowerCase(), html, "HTML hasn't been cleared even though the innerText and textContent properties indicate empty content.");
      ok(!wysihtml5.dom.hasClass(composerElement, "placeholder"), "Editor hasn't got 'placeholder' css class");
      
      setTimeout(function() {
        that.form.reset();
        
        // Timeout needed since reset() isn't executed synchronously
        setTimeout(function() {
          equal(wysihtml5.dom.getTextContent(composerElement), placeholderText, "After form reset the editor has the placeholder as content");
          start();
        }, 100);
        
      }, 500);
    });
  });
  
  
  asyncTest("Check public api", function() {
    expect(14);
    
    var that = this;
    
    var editor = new wysihtml5.Editor(this.textareaElement, {
      parserRules:        { tags: { p: { rename_tag: "div" } } },
      bodyClassName:      "editor-is-supported",
      composerClassName:  "editor"
    });
    
    editor.observe("load", function() {
      ok(editor.isCompatible(), "isCompatible() returns correct value");
      ok(wysihtml5.dom.hasClass(document.body, "editor-is-supported"), "<body> received correct class name");
      
      var composerElement = that.getComposerElement();
      editor.clear();
      equal(wysihtml5.dom.getTextContent(composerElement), "", "Editor empty after calling 'clear'");
      ok(wysihtml5.dom.hasClass(composerElement, "editor"), "Composer element has correct class name");
      
      var html = "hello <strong>foo</strong>!";
      editor.setValue(html);
      equal(composerElement.innerHTML.toLowerCase(), html, "Editor content correctly set after calling 'setValue'");
      ok(!editor.isEmpty(), "'isEmpty' returns correct value when the composer element isn't actually empty");
      
      var value = editor.getValue();
      equal(value.toLowerCase(), html, "Editor content correctly returned after calling 'getValue'");
      
      editor.clear();
      value = editor.getValue();
      equal(value, "");
      ok(editor.isEmpty(), "'isEmpty' returns correct value when the composer element is actually empty");
      
      equal(editor.parse("<p>foo</p>").toLowerCase(), "<div>foo</div>", "'parse' returns correct value");
      
      // Check disable/enable
      editor.disable();
      ok(!composerElement.getAttribute("contentEditable"), "When disabled the composer hasn't the contentEditable attribute");
      equal(composerElement.getAttribute("disabled"), "disabled", "When disabled the composer has the disabled=\"disabled\" attribute");
      
      editor.enable();
      equal(composerElement.getAttribute("contentEditable"), "true", "After enabling the editor the contentEditable property is true");
      ok(!composerElement.getAttribute("disabled"), "After enabling the disabled attribute is unset");
      
      start();
    });
  });
  
  
  asyncTest("Parser (default parser method with parserRules as object", function() {
    expect(2);
    
    var parserRules = {
      tags: {
        div: true,
        p: { rename_tag: "div" },
        span: true,
        script: undefined
      }
    };
    
    var input   = "<p>foobar</p>",
        output  = "<div>foobar</div>";
    
    var editor = new wysihtml5.Editor(this.textareaElement, {
      parserRules: parserRules
    });
    
    editor.observe("load", function() {
      equal(editor.config.parserRules, parserRules, "Parser rules correctly set on config object");
      // Invoke parsing via second parameter of setValue()
      editor.setValue(input, true);
      equal(editor.getValue().toLowerCase(), output, "HTML got correctly parsed within setValue()");
      start();
    });
  });
  
  
  asyncTest("Parser (custom parser method with parserRules as object", function() {
    expect(7);
    
    var that        = this,
        parserRules = { script: undefined },
        input       = this.textareaElement.value,
        output      = input;
    
    var editor = new wysihtml5.Editor(this.textareaElement, {
      parserRules: parserRules,
      parser:      function(html, rules, context) {
        equal(html.toLowerCase(), input, "HTML passed into parser is equal to the one which just got inserted");
        equal(rules, parserRules, "Rules passed into parser are equal to those given to the editor");
        equal(context, that.getIframeElement().contentWindow.document, "Context passed into parser is equal the document object of the editor's iframe");
        return html.replace(/\<script\>.*?\<\/script\>/gi, "");
      }
    });
    
    editor.observe("load", function() {
      input   = "<p>foobar</p><script>alert(1);</script>";
      output  = "<p>foobar</p>";
      
      // Invoke parsing via second parameter of setValue()
      editor.setValue(input, true);
      equal(editor.getValue().toLowerCase(), output, "HTML got correctly parsed within setValue()");
      
      start();
    });
  });
  
  
  asyncTest("Inserting an element which causes the textContent/innerText of the contentEditable element to be empty works correctly", function() {
    expect(2);
    
    var that = this;
    
    var editor = new wysihtml5.Editor(this.textareaElement);
    editor.observe("load", function() {
      var html            = '<img>',
          composerElement = that.getComposerElement(),
          textareaElement = that.textareaElement;
      composerElement.innerHTML = html;
      
      // Fire events that could cause a change in the composer
      QUnit.triggerEvent(composerElement, "keypress");
      QUnit.triggerEvent(composerElement, "keyup");
      QUnit.triggerEvent(composerElement, "cut");
      QUnit.triggerEvent(composerElement, "blur");
      
      setTimeout(function() {
        equal(composerElement.innerHTML.toLowerCase(), html, "Composer still has correct content");
        equal(textareaElement.value.toLowerCase(), html, "Textarea got correct value");
        start();
      }, 500);
    });
  });
  
  
  asyncTest("Check for stylesheets", function() {
    expect(5);
    
    var that = this;
    
    var stylesheetUrls = [
      "http://yui.yahooapis.com/2.8.2r1/build/reset/reset-min.css",
      "http://yui.yahooapis.com/2.8.0/build/reset/reset-min.css"
    ];
    
    var editor = new wysihtml5.Editor(this.textareaElement, {
      stylesheets: stylesheetUrls
    });
    
    editor.observe("load", function() {
      var iframeElement = that.getIframeElement(),
          iframeDoc     = iframeElement.contentWindow.document,
          linkElements  = iframeDoc.getElementsByTagName("link");
      equal(linkElements.length, 2, "Correct amount of stylesheets inserted into the dom tree");
      equal(linkElements[0].getAttribute("href"), stylesheetUrls[0]);
      equal(linkElements[0].getAttribute("rel"), "stylesheet");
      equal(linkElements[1].getAttribute("href"), stylesheetUrls[1]);
      equal(linkElements[1].getAttribute("rel"), "stylesheet");
      start();
    });
  });
  
  
  asyncTest("Check config.supportTouchDevices = false", function() {
    expect(2);
    
    var that = this;
    
    var originalIsTouchDevice = wysihtml5.browser.isTouchDevice;
    wysihtml5.browser.isTouchDevice = function() { return true; };
    
    var editor = new wysihtml5.Editor(this.textareaElement, {
      supportTouchDevices: false
    });
    
    editor.observe("load", function() {
      ok(!that.getIframeElement(), "No editor iframe has been inserted");
      equal(that.textareaElement.style.display, "", "Textarea is visible");
      
      wysihtml5.browser.isTouchDevice = originalIsTouchDevice;
      
      start();
    });
  });
}
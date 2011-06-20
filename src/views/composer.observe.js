/**
 * Taking care of events
 *  - Simulating 'change' event on contentEditable element
 *  - Handling drag & drop logic
 *  - Catch paste events
 *  - Dispatch proprietary newword:composer event
 *  - Keyboard shortcuts
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 */
wysihtml5.views.Composer.addMethods({
  observe: (function() {
    /**
     * Map keyCodes to query commands
     */
    var shortcuts = {
      "66": "bold",     // B
      "73": "italic",   // I
      "85": "underline" // U
    };
    
    return function() {
      var state               = this.getValue(),
          iframe              = this.sandbox.getIframe(),
          element             = this.element,
          focusBlurElement    = wysihtml5.browserSupports.eventsInIframeCorrectly() ? element : this.sandbox.getWindow(),
          // Firefox < 3.5 doesn't support the drop event, instead it supports a so called "dragdrop" event which behaves almost the same
          pasteEvents         = wysihtml5.browserSupports.event("drop") ? ["drop", "paste"] : ["dragdrop", "paste"];
      
      // --------- destroy:composer event ---------
      wysihtml5.utils.observe(iframe, "DOMNodeRemoved", function() {
        clearInterval(domNodeRemovedInterval);
        this.parent.fire("destroy:composer");
      }.bind(this));
      
      // DOMNodeRemoved event is not supported in IE 8
      var domNodeRemovedInterval = setInterval(function() {
        if (!wysihtml5.utils.contains(document.documentElement, iframe)) {
          clearInterval(domNodeRemovedInterval);
          this.parent.fire("destroy:composer");
        }
      }.bind(this), 250);
      
      
      // --------- Focus & blur logic ---------
      wysihtml5.utils.observe(focusBlurElement, "focus", function() {
        this.parent.fire("focus").fire("focus:composer");

        // Delay storing of state until all focus handler are fired
        // especially the one which resets the placeholder
        (function() { state = this.getValue(); }).bind(this).defer();
      }.bind(this));

      wysihtml5.utils.observe(focusBlurElement, "blur", function() {
        if (state != this.getValue()) {
          this.parent.fire("change").fire("change:composer");
        }
        this.parent.fire("blur").fire("blur:composer");
      }.bind(this));

      // --------- Drag & Drop logic ---------
      wysihtml5.utils.observe(element, "dragenter", function() {
        this.parent.fire("unset_placeholder");
      }.bind(this));

      if (wysihtml5.browserSupports.onDropOnlyWhenOnDragOverIsCancelled()) {
        wysihtml5.utils.observe(element, ["dragover", "dragenter"], function(event) {
          event.preventDefault();
        }.bind(this));
      }
      
      wysihtml5.utils.observe(element, pasteEvents, function(event) {
        var dataTransfer = event.dataTransfer,
            data;
        
        if (dataTransfer && wysihtml5.browserSupports.htmlDataTransfer()) {
          data = dataTransfer.getData("text/html") || dataTransfer.getData("text/plain");
        }
        if (data) {
          element.focus();
          wysihtml5.commands.exec(element, "insertHTML", data);
          this.parent.fire("paste").fire("paste:composer");
          event.stopPropagation();
          event.preventDefault();
        } else {
          setTimeout(function() {
            this.parent.fire("paste").fire("paste:composer");
          }.bind(this), 0);
        }
      }.bind(this));

      // --------- neword event ---------
      Event.KEY_SPACE = Event.KEY_SPACE || 32;
      wysihtml5.utils.observe(element, "keyup", function(event) {
        var keyCode = event.keyCode;
        if (keyCode == Event.KEY_SPACE || keyCode == Event.KEY_RETURN) {
          this.parent.fire("newword:composer");
        }
      }.bind(this));

      this.parent.observe("paste:composer", function() {
        setTimeout(function() { this.parent.fire("newword:composer"); }.bind(this), 0);
      }.bind(this));

      // --------- Make sure that images are selected when clicking on them ---------
      if (!wysihtml5.browserSupports.selectingOfImagesInContentEditableOnClick()) {
        wysihtml5.utils.observe(element, "mousedown", function(event) {
          var target = event.target;
          if (target.nodeName == "IMG") {
            wysihtml5.utils.caret.selectNode(target);
            event.preventDefault();
          }
        });
      }

      // --------- Shortcut logic ---------
      wysihtml5.utils.observe(element, "keydown", function(event) {
        var keyCode  = event.keyCode,
            command  = shortcuts[keyCode.toString()];
        if ((event.ctrlKey || event.metaKey) && command) {
          wysihtml5.commands.exec(element, command);
          event.preventDefault();
        }
      });
      
      // --------- Make sure that when pressing backspace/delete on selected images deletes the image and it's anchor ---------
      wysihtml5.utils.observe(element, "keydown", function(event) {
        var target  = wysihtml5.utils.caret.getSelectedNode(element.ownerDocument, true),
            keyCode = event.keyCode,
            parent;
        if (target && target.nodeName == "IMG" && (keyCode == 8 || keyCode == 46)) { // 8 => backspace, 46 => delete
          parent = target.parentNode;
          // delete the <img>
          parent.removeChild(target);
          // and it's parent <a> too if it hasn't got any other child nodes
          if (parent.nodeName == "A" && !parent.firstChild) {
            parent.parentNode.removeChild(parent);
          }
          
          setTimeout(function() { wysihtml5.quirks.redraw(element); }, 0);
          event.preventDefault();
        }
      });
      
      // --------- Show url in tooltip when hovering links or images ---------
      var titlePrefixes = {
        IMG: "Image: ",
        A:   "Link: "
      };
      wysihtml5.utils.observe(element, "mouseover", function(event) {
        var target   = event.target,
            nodeName = target.nodeName,
            title;
        if (nodeName !== "A" && nodeName !== "IMG") {
          return;
        }
        
        title = titlePrefixes[nodeName] + (target.getAttribute("href") || target.getAttribute("src"));
        target.setAttribute("title", title);
      });
    };
  })()
});
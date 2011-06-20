wysihtml5.views.Composer.addMethods({
  style: (function() {
    var HOST_TEMPLATE   = new Element("div"),
        /**
         * Styles to copy from textarea to the composer element
         */
        TEXT_FORMATTING = [
          "background-color",
          "color", "cursor",
          "font-family", "font-size", "font-style", "font-variant", "font-weight",
          "line-height", "letter-spacing",
          "text-align", "text-decoration", "text-indent", "text-rendering",
          "word-break", "word-wrap", "word-spacing"
        ],
        /**
         * Styles to copy from textarea to the iframe
         */
        BOX_FORMATTING = [
          "background-color",
          "border-collapse",
          "border-bottom-color", "border-bottom-style", "border-bottom-width",
          "border-left-color", "border-left-style", "border-left-width",
          "border-right-color", "border-right-style", "border-right-width",
          "border-top-color", "border-top-style", "border-top-width",
          "clear", "display", "float",
          "margin-bottom", "margin-left", "margin-right", "margin-top",
          "outline-color", "outline-offset", "outline-width", "outline-style",
          "padding-left", "padding-right", "padding-top", "padding-bottom",
          "position", "top", "left", "right", "bottom", "z-index",
          "vertical-align", "text-align",
          "-webkit-box-sizing", "-moz-box-sizing", "-ms-box-sizing", "box-sizing",
          "-webkit-box-shadow", "-moz-box-shadow", "-ms-box-shadow","box-shadow",
          "width", "height"
        ],
        /**
         * Styles to sync while the window gets resized
         */
        RESIZE_STYLE = [
          "width", "height",
          "top", "left", "right", "bottom"
        ],
        ADDITIONAL_CSS_RULES = [
          "html             { height: 100%; }",
          "body             { min-height: 100%; padding: 0; margin: 0; margin-top: -1px; padding-top: 1px; }",
          Prototype.Browser.Gecko ?
            "body.placeholder { color: graytext !important; }" : 
            "body.placeholder { color: #a9a9a9 !important; }",
          "body[disabled]   { background-color: #eee !important; color: #999 !important; cursor: default !important; }",
          // Ensure that user see's broken images and can delete them
          "img:-moz-broken  { -moz-force-broken-image-icon: 1; height: 24px; width: 24px; }"
        ];
    
    /**
     * With "setActive" IE offers a smart way of focusing elements without scrolling them into view:
     * http://msdn.microsoft.com/en-us/library/ms536738(v=vs.85).aspx
     *
     * Other browsers need a more hacky way: (pssst don't tell my mama)
     * In order to prevent the element being scrolled into view when focusing it, we simply
     * Move it out of the scrollable area, focus it, and reset it's position
     */
    var focusWithoutScrolling = function(element) {
      if (element.setActive) {
        element.setActive();
      } else {
        var elementStyle = element.style,
            originalScrollTop = document.documentElement.scrollTop || document.body.scrollTop,
            originalScrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft,
            originalStyles = {
              position:         elementStyle.position,
              top:              elementStyle.top,
              left:             elementStyle.left,
              WebkitUserSelect: elementStyle.WebkitUserSelect
            };
        
        // Don't ask why but temporarily setting -webkit-user-select to none makes the whole thing performing smoother
        element.setStyle({ position: "absolute", top: "-99999px", left: "-99999px", WebkitUserSelect: "none" });
        element.focus();
        element.setStyle(originalStyles);
        if (window.scrollTo) {
          // Some browser extensions unset this method to prevent annoyances
          // "Better PopUp Blocker" for Chrome http://code.google.com/p/betterpopupblocker/source/browse/trunk/blockStart.js#100
          // Issue: http://code.google.com/p/betterpopupblocker/issues/detail?id=1
          window.scrollTo(originalScrollLeft, originalScrollTop);
        }
      }
    };
    
    return function() {
      var originalActiveElement = document.querySelector(":focus"),
          textareaElement       = this.textarea.element,
          hasPlaceholder        = textareaElement.hasAttribute("placeholder"),
          originalPlaceholder   = hasPlaceholder && textareaElement.getAttribute("placeholder");
      this.focusStylesHost      = this.focusStylesHost  || HOST_TEMPLATE.clone();
      this.blurStylesHost       = this.blurStylesHost   || HOST_TEMPLATE.clone();
      
      // Remove placeholder before copying (as the placeholder has an affect on the computed style)
      if (hasPlaceholder) {
        textareaElement.removeAttribute("placeholder");
      }
      
      if (textareaElement === originalActiveElement) {
        textareaElement.blur();
      }
      
      // --------- iframe styles (has to be set before editor styles, otherwise IE9 sets wrong fontFamily on blurStylesHost) ---------
      wysihtml5.utils.copyStyles(BOX_FORMATTING).from(textareaElement).to(this.iframe).andTo(this.blurStylesHost);
      
      // --------- editor styles ---------
      wysihtml5.utils.copyStyles(TEXT_FORMATTING).from(textareaElement).to(this.element).andTo(this.blurStylesHost);
      
      // --------- apply standard rules ---------
      wysihtml5.utils.insertRules(ADDITIONAL_CSS_RULES).into(this.element.ownerDocument);
      
      // --------- :focus styles ---------
      focusWithoutScrolling(textareaElement);
      wysihtml5.utils.copyStyles(BOX_FORMATTING).from(textareaElement).to(this.focusStylesHost);
      wysihtml5.utils.copyStyles(TEXT_FORMATTING).from(textareaElement).to(this.focusStylesHost);
      
      // Make sure that we don't change the display style of the iframe when copying styles oblur/onfocus
      // this is needed for when the change_view event is fired where the iframe is hidden and then
      // the blur event fires and re-displays it
      var boxFormattingStyles = BOX_FORMATTING.without("display");
      
      // --------- restore focus ---------
      if (originalActiveElement) {
        originalActiveElement.focus();
      } else {
        textareaElement.blur();
      }
      
      // --------- restore placeholder ---------
      if (hasPlaceholder) {
        textareaElement.setAttribute("placeholder", originalPlaceholder);
      }
      
      // When copying styles, we only get the computed style which is never returned in percent unit
      // Therefore we've to recalculate style onresize
      if (!wysihtml5.browserSupports.computedStyleInPercent()) {
        Event.observe(window, "resize", function() {
          var originalDisplayStyle = wysihtml5.utils.getStyle(textareaElement, "display");
          textareaElement.style.display = "";
          wysihtml5.utils.copyStyles(RESIZE_STYLE)
            .from(textareaElement)
            .to(this.iframe)
            .andTo(this.focusStylesHost)
            .andTo(this.blurStylesHost);
          textareaElement.style.display = originalDisplayStyle;
        }.bind(this));
      }
      
      // --------- Sync focus/blur styles ---------
      this.parent.observe("focus:composer", function() {
        wysihtml5.utils.copyStyles(boxFormattingStyles).from(this.focusStylesHost).to(this.iframe);
        wysihtml5.utils.copyStyles(TEXT_FORMATTING).from(this.focusStylesHost).to(this.element);
      }.bind(this));

      this.parent.observe("blur:composer", function() {
        wysihtml5.utils.copyStyles(boxFormattingStyles).from(this.blurStylesHost).to(this.iframe);
        wysihtml5.utils.copyStyles(TEXT_FORMATTING).from(this.blurStylesHost).to(this.element);
      }.bind(this));
      
      return this;
    };
  })()
});
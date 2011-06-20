/**
 * Method to set dom events
 *
 * Prototype's original Element.observe doesn't work correctly when used
 * on elements in iframes whose ownerDocument isn't the same as the one where prototype is loaded
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @example
 *    wysihtml5.utils.observe(iframe.contentWindow.document.body, ["focus", "blur"], function() { ... });
 */
wysihtml5.utils.observe = function(element, eventNames, handler) {
  eventNames = [eventNames].flatten();
  eventNames.each(function(eventName) {
    if (element.addEventListener) {
      element.addEventListener(eventName, handler, false);
    } else {
      handler = handler.bind(element);
      handler = handler.wrap(function(proceed, event) {
        if (!("target" in event)) {
          event.target = event.srcElement;
        }
        event.preventDefault = event.preventDefault || function() {
          this.returnValue = false;
        };
        event.stopPropagation = event.stopPropagation || function() {
          this.cancelBubble = true;
        };
        proceed(event);
      });
      element.attachEvent("on" + eventName, handler);
    }
  });
  
  return {
    stop: function() {
      eventNames.each(function(eventName) {
        if (element.addEventListener) {
          element.removeEventListener(eventName, handler, false);
        } else {
          element.detachEvent("on" + eventName, handler);
        }
      });
    }
  };
};

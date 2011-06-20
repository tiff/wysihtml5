/**
 * @license CSS Class Applier module for Rangy.
 * Adds, removes and toggles CSS classes on Ranges and Selections
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Depends on Rangy core.
 *
 * Copyright 2011, Tim Down
 * Licensed under the MIT license.
 * Version: 1.1
 * Build date: 12 March 2011
 *
 * Adjusted by Christopher Blum <christopher.blum@xing.com> to match WYSIHTML5 logic
 * in order to be able ...
 *    - to use custom tags
 *    - to detect and replace similar css classes via reg exp
 */
rangy.createModule("CssClassApplier", function(api, module) {
    api.requireModules( ["WrappedSelection", "WrappedRange"] );

    var dom = api.dom;
    
    var defaultTagName = "span";

    function trim(str) {
        return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    function hasClass(el, cssClass, regExp) {
        if (!el.className) {
          return false;
        }
        
        var matchingClassNames = el.className.match(regExp) || [];
        return matchingClassNames[matchingClassNames.length - 1] === cssClass;
    }

    function addClass(el, cssClass, regExp) {
        if (el.className) {
            removeClass(el, regExp);
            el.className += " " + cssClass;
        } else {
            el.className = cssClass;
        }
    }

    function removeClass(el, regExp) {
        if (el.className) {
            el.className = el.className.replace(regExp, "");
        }
    }
    
    function hasSameClasses(el1, el2) {
        return el1.className.replace(/\s+/, " ") == el2.className.replace(/\s+/, " ");
    }

    function replaceWithOwnChildren(el) {
        var parent = el.parentNode;
        while (el.hasChildNodes()) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    }

    function elementsHaveSameNonClassAttributes(el1, el2) {
        if (el1.attributes.length != el2.attributes.length) return false;
        for (var i = 0, len = el1.attributes.length, attr1, attr2, name; i < len; ++i) {
            attr1 = el1.attributes[i];
            name = attr1.name;
            if (name != "class") {
                attr2 = el2.attributes.getNamedItem(name);
                if (attr1.specified != attr2.specified) return false;
                if (attr1.specified && attr1.nodeValue !== attr2.nodeValue) return false;
            }
        }
        return true;
    }

    function isSplitPoint(node, offset) {
        if (dom.isCharacterDataNode(node)) {
            if (offset == 0) {
                return !!node.previousSibling;
            } else if (offset == node.length) {
                return !!node.nextSibling;
            } else {
                return true;
            }
        }

        return offset > 0 && offset < node.childNodes.length;
    }

    function splitNodeAt(node, descendantNode, descendantOffset) {

        var newNode;
        if (dom.isCharacterDataNode(descendantNode)) {
            if (descendantOffset == 0) {
                descendantOffset = dom.getNodeIndex(descendantNode);
                descendantNode = descendantNode.parentNode;
            } else if (descendantOffset == descendantNode.length) {
                descendantOffset = dom.getNodeIndex(descendantNode) + 1;
                descendantNode = descendantNode.parentNode;
            } else {
                newNode = dom.splitDataNode(descendantNode, descendantOffset);
            }
        }
        if (!newNode) {
            newNode = descendantNode.cloneNode(false);
            if (newNode.id) {
                newNode.removeAttribute("id");
            }
            var child;
            while ((child = descendantNode.childNodes[descendantOffset])) {

                newNode.appendChild(child);
            }
            dom.insertAfter(newNode, descendantNode);
        }
        return (descendantNode == node) ? newNode : splitNodeAt(node, newNode.parentNode, dom.getNodeIndex(newNode));
    }
    
    function Merge(firstNode) {
        this.isElementMerge = (firstNode.nodeType == 1);
        this.firstTextNode = this.isElementMerge ? firstNode.lastChild : firstNode;
        this.textNodes = [this.firstTextNode];
    }

    Merge.prototype = {
        doMerge: function() {
            var textBits = [], textNode, parent, text;
            for (var i = 0, len = this.textNodes.length; i < len; ++i) {
                textNode = this.textNodes[i];
                parent = textNode.parentNode;
                textBits[i] = textNode.data;
                if (i) {
                    parent.removeChild(textNode);
                    if (!parent.hasChildNodes()) {
                        parent.parentNode.removeChild(parent);
                    }
                }
            }
            this.firstTextNode.data = text = textBits.join("");
            return text;
        },

        getLength: function() {
            var i = this.textNodes.length, len = 0;
            while (i--) {
                len += this.textNodes[i].length;
            }
            return len;
        },

        toString: function() {
            var textBits = [];
            for (var i = 0, len = this.textNodes.length; i < len; ++i) {
                textBits[i] = "'" + this.textNodes[i].data + "'";
            }
            return "[Merge(" + textBits.join(",") + ")]";
        }
    };

    function CssClassApplier(tagNames, cssClass, similarClassRegExp, normalize) {
        this.tagNames = tagNames || [defaultTagName];
        this.cssClass = cssClass || "";
        this.similarClassRegExp = similarClassRegExp;
        this.normalize = normalize;
        this.applyToAnyTagName = false;
    }

    CssClassApplier.prototype = {
        getAncestorWithClass: function(node) {
            var cssClassMatch;
            while (node) {
                cssClassMatch = this.cssClass ? hasClass(node, this.cssClass, this.similarClassRegExp) : true;
                if (node.nodeType == 1 && dom.arrayContains(this.tagNames, node.tagName.toLowerCase()) && cssClassMatch) {
                    return node;
                }
                node = node.parentNode;
            }
            return false;
        },

        // Normalizes nodes after applying a CSS class to a Range.
        postApply: function(textNodes, range) {
            var firstNode = textNodes[0], lastNode = textNodes[textNodes.length - 1];

            var merges = [], currentMerge;

            var rangeStartNode = firstNode, rangeEndNode = lastNode;
            var rangeStartOffset = 0, rangeEndOffset = lastNode.length;

            var textNode, precedingTextNode;

            for (var i = 0, len = textNodes.length; i < len; ++i) {
                textNode = textNodes[i];
                precedingTextNode = this.getAdjacentMergeableTextNode(textNode.parentNode, false);
                if (precedingTextNode) {
                    if (!currentMerge) {
                        currentMerge = new Merge(precedingTextNode);
                        merges.push(currentMerge);
                    }
                    currentMerge.textNodes.push(textNode);
                    if (textNode === firstNode) {
                        rangeStartNode = currentMerge.firstTextNode;
                        rangeStartOffset = rangeStartNode.length;
                    }
                    if (textNode === lastNode) {
                        rangeEndNode = currentMerge.firstTextNode;
                        rangeEndOffset = currentMerge.getLength();
                    }
                } else {
                    currentMerge = null;
                }
            }

            // Test whether the first node after the range needs merging
            var nextTextNode = this.getAdjacentMergeableTextNode(lastNode.parentNode, true);
            if (nextTextNode) {
                if (!currentMerge) {
                    currentMerge = new Merge(lastNode);
                    merges.push(currentMerge);
                }
                currentMerge.textNodes.push(nextTextNode);
            }

            // Do the merges
            if (merges.length) {
                for (i = 0, len = merges.length; i < len; ++i) {
                    merges[i].doMerge();
                }
                // Set the range boundaries
                range.setStart(rangeStartNode, rangeStartOffset);
                range.setEnd(rangeEndNode, rangeEndOffset);
            }

        },
        
        getAdjacentMergeableTextNode: function(node, forward) {
            var isTextNode = (node.nodeType == 3);
            var el = isTextNode ? node.parentNode : node;
            var adjacentNode;
            var propName = forward ? "nextSibling" : "previousSibling";
            if (isTextNode) {
                // Can merge if the node's previous/next sibling is a text node
                adjacentNode = node[propName];
                if (adjacentNode && adjacentNode.nodeType == 3) {
                    return adjacentNode;
                }
            } else {
                // Compare element with its sibling
                adjacentNode = el[propName];
                if (adjacentNode && this.areElementsMergeable(node, adjacentNode)) {
                    return adjacentNode[forward ? "firstChild" : "lastChild"];
                }
            }
            return null;
        },
        
        areElementsMergeable: function(el1, el2) {
            return dom.arrayContains(this.tagNames, (el1.tagName || "").toLowerCase())
              && dom.arrayContains(this.tagNames, (el2.tagName || "").toLowerCase())
              && hasSameClasses(el1, el2)
              && elementsHaveSameNonClassAttributes(el1, el2);
        },

        createContainer: function(doc) {
            var el = doc.createElement(this.tagNames[0]);
            if (this.cssClass) {
              el.className = this.cssClass;
            }
            return el;
        },

        applyToTextNode: function(textNode) {
            var parent = textNode.parentNode;
            if (parent.childNodes.length == 1 && dom.arrayContains(this.tagNames, parent.tagName.toLowerCase())) {
                if (this.cssClass) {
                  addClass(parent, this.cssClass, this.similarClassRegExp);
                }
            } else {
                var el = this.createContainer(dom.getDocument(textNode));
                textNode.parentNode.insertBefore(el, textNode);
                el.appendChild(textNode);
            }
        },

        isRemovable: function(el) {
            return dom.arrayContains(this.tagNames, el.tagName.toLowerCase()) && trim(el.className) == this.cssClass;
        },

        undoToTextNode: function(textNode, range, ancestorWithClass) {
            if (!range.containsNode(ancestorWithClass)) {
                // Split out the portion of the ancestor from which we can remove the CSS class
                var ancestorRange = range.cloneRange();
                ancestorRange.selectNode(ancestorWithClass);

                if (ancestorRange.isPointInRange(range.endContainer, range.endOffset) && isSplitPoint(range.endContainer, range.endOffset)) {
                    splitNodeAt(ancestorWithClass, range.endContainer, range.endOffset);
                    range.setEndAfter(ancestorWithClass);
                }
                if (ancestorRange.isPointInRange(range.startContainer, range.startOffset) && isSplitPoint(range.startContainer, range.startOffset)) {
                    ancestorWithClass = splitNodeAt(ancestorWithClass, range.startContainer, range.startOffset);
                }
            }
            
            if (this.similarClassRegExp) {
              removeClass(ancestorWithClass, this.similarClassRegExp);
            }
            if (this.isRemovable(ancestorWithClass)) {
                replaceWithOwnChildren(ancestorWithClass);
            }
        },

        applyToRange: function(range) {
            var textNodes = range.getNodes([3]);
            if (!textNodes.length) {
              try {
                var node = this.createContainer(range.endContainer.ownerDocument);
                range.surroundContents(node);
                this.selectNode(range, node);
                return;
              } catch(e) {}
            }
            
            range.splitBoundaries();
            textNodes = range.getNodes([3]);
            
            if (textNodes.length) {
                var textNode;

                for (var i = 0, len = textNodes.length; i < len; ++i) {
                    textNode = textNodes[i];
                    if (!this.getAncestorWithClass(textNode)) {
                        this.applyToTextNode(textNode);
                    }
                }
                
                range.setStart(textNodes[0], 0);
                textNode = textNodes[textNodes.length - 1];
                range.setEnd(textNode, textNode.length);
                
                if (this.normalize) {
                    this.postApply(textNodes, range);
                }
            }
        },

        undoToRange: function(range) {
            var textNodes = range.getNodes([3]), textNode, ancestorWithClass;
            if (textNodes.length) {
              range.splitBoundaries();
              textNodes = range.getNodes([3]);
            } else {
              var doc = range.endContainer.ownerDocument,
                  node = doc.createTextNode("\uFEFF");
              range.insertNode(node);
              range.selectNode(node);
              textNodes = [node];
            }
            
            for (var i = 0, len = textNodes.length; i < len; ++i) {
                textNode = textNodes[i];
                ancestorWithClass = this.getAncestorWithClass(textNode);
                if (ancestorWithClass) {
                    this.undoToTextNode(textNode, range, ancestorWithClass);
                }
            }
            
            if (len == 1) {
                this.selectNode(range, textNodes[0]);
            } else {
                range.setStart(textNodes[0], 0);
                textNode = textNodes[textNodes.length - 1];
                range.setEnd(textNode, textNode.length);

                if (this.normalize) {
                    this.postApply(textNodes, range);
                }
            }
        },
        
        selectNode: function(range, node) {
          var isElement       = node.nodeType === 1,
              canHaveHTML     = "canHaveHTML" in node ? node.canHaveHTML : true,
              content         = isElement ? node.innerHTML : node.data,
              isEmpty         = (content === "" || content === "\uFEFF");

          if (isEmpty && isElement && canHaveHTML) {
              // Make sure that caret is visible in node by inserted a zero width no breaking space
              try { node.innerHTML = "\uFEFF"; } catch(e) {}
          }
          range.selectNodeContents(node);
          if (isEmpty && isElement) {
              range.collapse(false);
          } else if (isEmpty) {
              range.setStartAfter(node);
              range.setEndAfter(node);
          }
        },
        
        getTextSelectedByRange: function(textNode, range) {
            var textRange = range.cloneRange();
            textRange.selectNodeContents(textNode);

            var intersectionRange = textRange.intersection(range);
            var text = intersectionRange ? intersectionRange.toString() : "";
            textRange.detach();

            return text;
        },

        isAppliedToRange: function(range) {
            var ancestors = [],
                ancestor,
                textNodes = range.getNodes([3]);
            if (!textNodes.length) {
              var ancestor = this.getAncestorWithClass(range.startContainer);
              return ancestor ? [ancestor] : false;
            }
            
            for (var i = 0, len = textNodes.length, selectedText; i < len; ++i) {
                selectedText = this.getTextSelectedByRange(textNodes[i], range);
                ancestor = this.getAncestorWithClass(textNodes[i]);
                if (selectedText != "" && !ancestor) {
                    return false;
                } else {
                    ancestors.push(ancestor);
                }
            }
            return ancestors;
        },

        toggleRange: function(range) {
            if (this.isAppliedToRange(range)) {
                this.undoToRange(range);
            } else {
                this.applyToRange(range);
            }
        }
    };

    function createCssClassApplier(tagNames, cssClass, classRegExp, normalize) {
        return new CssClassApplier(tagNames, cssClass, classRegExp, normalize);
    }

    CssClassApplier.util = {
        hasClass: hasClass,
        addClass: addClass,
        removeClass: removeClass,
        hasSameClasses: hasSameClasses,
        replaceWithOwnChildren: replaceWithOwnChildren,
        elementsHaveSameNonClassAttributes: elementsHaveSameNonClassAttributes,
        splitNodeAt: splitNodeAt
    };

    api.CssClassApplier = CssClassApplier;
    api.createCssClassApplier = createCssClassApplier;
});

/**
 * @license Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Copyright 2011, Tim Down
 * Licensed under the MIT license.
 * Version: 1.1
 * Build date: 12 March 2011
 */
var rangy = (function() {


    var OBJECT = "object", FUNCTION = "function", UNDEFINED = "undefined";

    var domRangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer", "START_TO_START", "START_TO_END", "END_TO_START", "END_TO_END"];

    var domRangeMethods = ["setStart", "setStartBefore", "setStartAfter", "setEnd", "setEndBefore",
        "setEndAfter", "collapse", "selectNode", "selectNodeContents", "compareBoundaryPoints", "deleteContents",
        "extractContents", "cloneContents", "insertNode", "surroundContents", "cloneRange", "toString", "detach"];

    var textRangeProperties = ["boundingHeight", "boundingLeft", "boundingTop", "boundingWidth", "htmlText", "text"];

    // Subset of TextRange's full set of methods that we're interested in
    var textRangeMethods = ["collapse", "compareEndPoints", "duplicate", "getBookmark", "moveToBookmark",
        "moveToElementText", "parentElement", "pasteHTML", "select", "setEndPoint"];

    /*----------------------------------------------------------------------------------------------------------------*/

    // Trio of functions taken from Peter Michaux's article:
    // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
    function isHostMethod(o, p) {
        var t = typeof o[p];
        return t == FUNCTION || (!!(t == OBJECT && o[p])) || t == "unknown";
    }

    function isHostObject(o, p) {
        return !!(typeof o[p] == OBJECT && o[p]);
    }

    function isHostProperty(o, p) {
        return typeof o[p] != UNDEFINED;
    }

    // Creates a convenience function to save verbose repeated calls to tests functions
    function createMultiplePropertyTest(testFunc) {
        return function(o, props) {
            var i = props.length;
            while (i--) {
                if (!testFunc(o, props[i])) {
                    return false;
                }
            }
            return true;
        };
    }

    // Next trio of functions are a convenience to save verbose repeated calls to previous two functions
    var areHostMethods = createMultiplePropertyTest(isHostMethod);
    var areHostObjects = createMultiplePropertyTest(isHostObject);
    var areHostProperties = createMultiplePropertyTest(isHostProperty);

    var api = {
        initialized: false,
        supported: true,

        util: {
            isHostMethod: isHostMethod,
            isHostObject: isHostObject,
            isHostProperty: isHostProperty,
            areHostMethods: areHostMethods,
            areHostObjects: areHostObjects,
            areHostProperties: areHostProperties
        },

        features: {},

        modules: {},
        config: {
            alertOnWarn: false
        }
    };

    function fail(reason) {
        window.alert("Rangy not supported in your browser. Reason: " + reason);
        api.initialized = true;
        api.supported = false;
    }

    api.fail = fail;

    function warn(reason) {
        var warningMessage = "Rangy warning: " + reason;
        if (api.config.alertOnWarn) {
            window.alert(warningMessage);
        } else if (typeof window.console != UNDEFINED && typeof window.console.log != UNDEFINED) {
            window.console.log(warningMessage);
        }
    }

    api.warn = warn;

    // Initialization
    function init() {
        if (api.initialized) {
            return;
        }
        var testRange;
        var implementsDomRange = false, implementsTextRange = false;

        // First, perform basic feature tests

        if (isHostMethod(document, "createRange")) {
            testRange = document.createRange();
            if (areHostMethods(testRange, domRangeMethods) && areHostProperties(testRange, domRangeProperties)) {
                implementsDomRange = true;
            }
            testRange.detach();
        }

        var body = isHostObject(document, "body") ? document.body : document.getElementsByTagName("body")[0];

        if (body && isHostMethod(body, "createTextRange")) {
            testRange = body.createTextRange();
            if (areHostMethods(testRange, textRangeMethods) && areHostProperties(testRange, textRangeProperties)) {
                implementsTextRange = true;
            }
        }

        if (!implementsDomRange && !implementsTextRange) {
            fail("Neither Range nor TextRange are implemented");
        }

        api.initialized = true;
        api.features = {
            implementsDomRange: implementsDomRange,
            implementsTextRange: implementsTextRange
        };

        // Initialize modules and call init listeners
        var allListeners = moduleInitializers.concat(initListeners);
        for (var i = 0, len = allListeners.length; i < len; ++i) {
            try {
                allListeners[i](api);
            } catch (ex) {
                if (isHostObject(window, "console") && isHostMethod(window.console, "log")) {
                    console.log("Init listener threw an exception. Continuing.", ex);
                }

            }
        }
    }

    // Allow external scripts to initialize this library in case it's loaded after the document has loaded
    api.init = init;

    var initListeners = [];
    var moduleInitializers = [];

    // Execute listener immediately if already initialized
    api.addInitListener = function(listener) {
        if (api.initialized) {
            listener(api);
        } else {
            initListeners.push(listener);
        }
    };

    var createMissingNativeApiListeners = [];

    api.addCreateMissingNativeApiListener = function(listener) {
        createMissingNativeApiListeners.push(listener);
    };

    function createMissingNativeApi(win) {
        win = win || window;
        init();

        // Notify listeners
        for (var i = 0, len = createMissingNativeApiListeners.length; i < len; ++i) {
            createMissingNativeApiListeners[i](win);
        }
    }

    api.createMissingNativeApi = createMissingNativeApi;

    /**
     * @constructor
     */
    function Module(name) {
        this.name = name;
        this.initialized = false;
        this.supported = false;
    }

    Module.prototype.fail = function(reason) {
        this.initialized = true;
        this.supported = false;

        throw new Error("Module '" + this.name + "' failed to load: " + reason);
    };

    Module.prototype.createError = function(msg) {
        return new Error("Error in Rangy " + this.name + " module: " + msg);
    };

    api.createModule = function(name, initFunc) {
        var module = new Module(name);
        api.modules[name] = module;

        moduleInitializers.push(function(api) {
            initFunc(api, module);
            module.initialized = true;
            module.supported = true;
        });
    };

    api.requireModules = function(modules) {
        for (var i = 0, len = modules.length, module, moduleName; i < len; ++i) {
            moduleName = modules[i];
            module = api.modules[moduleName];
            if (!module || !(module instanceof Module)) {
                throw new Error("Module '" + moduleName + "' not found");
            }
            if (!module.supported) {
                throw new Error("Module '" + moduleName + "' not supported");
            }
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Wait for document to load before running tests

    var docReady = false;

    var loadHandler = function(e) {

        if (!docReady) {
            docReady = true;
            if (!api.initialized) {
                init();
            }
        }
    };

    // Test whether we have window and document objects that we will need
    if (typeof window == UNDEFINED) {
        fail("No window found");
        return;
    }
    if (typeof document == UNDEFINED) {
        fail("No document found");
        return;
    }

    if (isHostMethod(document, "addEventListener")) {
        document.addEventListener("DOMContentLoaded", loadHandler, false);
    }

    // Add a fallback in case the DOMContentLoaded event isn't supported
    if (isHostMethod(window, "addEventListener")) {
        window.addEventListener("load", loadHandler, false);
    } else if (isHostMethod(window, "attachEvent")) {
        window.attachEvent("onload", loadHandler);
    } else {
        fail("Window does not have required addEventListener or attachEvent method");
    }

    return api;
})();
rangy.createModule("DomUtil", function(api, module) {

    var UNDEF = "undefined";
    var util = api.util;

    // Perform feature tests
    if (!util.areHostMethods(document, ["createDocumentFragment", "createElement", "createTextNode"])) {
        module.fail("document missing a Node creation method");
    }

    if (!util.isHostMethod(document, "getElementsByTagName")) {
        module.fail("document missing getElementsByTagName method");
    }

    var el = document.createElement("div");
    if (!util.areHostMethods(el, ["insertBefore", "appendChild", "cloneNode"] ||
            !util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]))) {
        module.fail("Incomplete Element implementation");
    }

    var textNode = document.createTextNode("test");
    if (!util.areHostMethods(textNode, ["splitText", "deleteData", "insertData", "appendData", "cloneNode"] ||
            !util.areHostObjects(el, ["previousSibling", "nextSibling", "childNodes", "parentNode"]) ||
            !util.areHostProperties(textNode, ["data"]))) {
        module.fail("Incomplete Text Node implementation");
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Removed use of indexOf because of a bizarre bug in Opera that is thrown in one of the Acid3 tests. Haven't been
    // able to replicate it outside of the test. The bug is that indexOf return -1 when called on an Array that contains
    // just the document as a single element and the value searched for is the document.
    var arrayContains = /*Array.prototype.indexOf ?
        function(arr, val) {
            return arr.indexOf(val) > -1;
        }:*/

        function(arr, val) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === val) {
                    return true;
                }
            }
            return false;
        };

    function getNodeIndex(node) {
        var i = 0;
        while( (node = node.previousSibling) ) {
            i++;
        }
        return i;
    }

    function getCommonAncestor(node1, node2) {
        var ancestors = [], n;
        for (n = node1; n; n = n.parentNode) {
            ancestors.push(n);
        }

        for (n = node2; n; n = n.parentNode) {
            if (arrayContains(ancestors, n)) {
                return n;
            }
        }

        return null;
    }

    function isAncestorOf(ancestor, descendant, selfIsAncestor) {
        var n = selfIsAncestor ? descendant : descendant.parentNode;
        while (n) {
            if (n === ancestor) {
                return true;
            } else {
                n = n.parentNode;
            }
        }
        return false;
    }

    function getClosestAncestorIn(node, ancestor, selfIsAncestor) {
        var p, n = selfIsAncestor ? node : node.parentNode;
        while (n) {
            p = n.parentNode;
            if (p === ancestor) {
                return n;
            }
            n = p;
        }
        return null;
    }

    function isCharacterDataNode(node) {
        var t = node.nodeType;
        return t == 3 || t == 4 || t == 8 ; // Text, CDataSection or Comment
    }

    function insertAfter(node, precedingNode) {
        var nextNode = precedingNode.nextSibling, parent = precedingNode.parentNode;
        if (nextNode) {
            parent.insertBefore(node, nextNode);
        } else {
            parent.appendChild(node);
        }
        return node;
    }

    function splitDataNode(node, index) {
        var newNode;
        if (node.nodeType == 3) {
            newNode = node.splitText(index);
        } else {
            newNode = node.cloneNode();
            newNode.deleteData(0, index);
            node.deleteData(0, node.length - index);
            insertAfter(newNode, node);
        }
        return newNode;
    }

    function getDocument(node) {
        if (node.nodeType == 9) {
            return node;
        } else if (typeof node.ownerDocument != UNDEF) {
            return node.ownerDocument;
        } else if (typeof node.document != UNDEF) {
            return node.document;
        } else if (node.parentNode) {
            return getDocument(node.parentNode);
        } else {
            throw new Error("getDocument: no document found for node");
        }
    }

    function getWindow(node) {
        var doc = getDocument(node);
        if (typeof doc.defaultView != UNDEF) {
            return doc.defaultView;
        } else if (typeof doc.parentWindow != UNDEF) {
            return doc.parentWindow;
        } else {
            throw new Error("Cannot get a window object for node");
        }
    }

    function getIframeDocument(iframeEl) {
        if (typeof iframeEl.contentDocument != UNDEF) {
            return iframeEl.contentDocument;
        } else if (typeof iframeEl.contentWindow != UNDEF) {
            return iframeEl.contentWindow.document;
        } else {
            throw new Error("getIframeWindow: No Document object found for iframe element");
        }
    }

    function getIframeWindow(iframeEl) {
        if (typeof iframeEl.contentWindow != UNDEF) {
            return iframeEl.contentWindow;
        } else if (typeof iframeEl.contentDocument != UNDEF) {
            return iframeEl.contentDocument.defaultView;
        } else {
            throw new Error("getIframeWindow: No Window object found for iframe element");
        }
    }

    function getBody(doc) {
        return util.isHostObject(doc, "body") ? doc.body : doc.getElementsByTagName("body")[0];
    }

    function comparePoints(nodeA, offsetA, nodeB, offsetB) {
        // See http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html#Level-2-Range-Comparing
        var nodeC, root, childA, childB, n;
        if (nodeA == nodeB) {

            // Case 1: nodes are the same
            return offsetA === offsetB ? 0 : (offsetA < offsetB) ? -1 : 1;
        } else if ( (nodeC = getClosestAncestorIn(nodeB, nodeA, true)) ) {

            // Case 2: node C (container B or an ancestor) is a child node of A
            return offsetA <= getNodeIndex(nodeC) ? -1 : 1;
        } else if ( (nodeC = getClosestAncestorIn(nodeA, nodeB, true)) ) {

            // Case 3: node C (container A or an ancestor) is a child node of B
            return getNodeIndex(nodeC) < offsetB  ? -1 : 1;
        } else {

            // Case 4: containers are siblings or descendants of siblings
            root = getCommonAncestor(nodeA, nodeB);
            childA = (nodeA === root) ? root : getClosestAncestorIn(nodeA, root, true);
            childB = (nodeB === root) ? root : getClosestAncestorIn(nodeB, root, true);

            if (childA === childB) {
                // This shouldn't be possible

                throw new Error("comparePoints got to case 4 and childA and childB are the same!");
            } else {
                n = root.firstChild;
                while (n) {
                    if (n === childA) {
                        return -1;
                    } else if (n === childB) {
                        return 1;
                    }
                    n = n.nextSibling;
                }
                throw new Error("Should not be here!");
            }
        }
    }

    function inspectNode(node) {
        if (!node) {
            return "[No node]";
        }
        if (isCharacterDataNode(node)) {
            return '"' + node.data + '"';
        } else if (node.nodeType == 1) {
            var idAttr = node.id ? ' id="' + node.id + '"' : "";
            return "<" + node.nodeName + idAttr + ">[" + node.childNodes.length + "]";
        } else {
            return node.nodeName;
        }
    }

    /**
     * @constructor
     */
    function NodeIterator(root) {
        this.root = root;
        this._next = root;
    }

    NodeIterator.prototype = {
        _current: null,

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            var n = this._current = this._next;
            var child, next;
            if (this._current) {
                child = n.firstChild;
                if (child) {
                    this._next = child;
                } else {
                    next = null;
                    while ((n !== this.root) && !(next = n.nextSibling)) {
                        n = n.parentNode;
                    }
                    this._next = next;
                }
            }
            return this._current;
        },

        detach: function() {
            this._current = this._next = this.root = null;
        }
    };

    function createIterator(root) {
        return new NodeIterator(root);
    }

    /**
     * @constructor
     */
    function DomPosition(node, offset) {
        this.node = node;
        this.offset = offset;
    }

    DomPosition.prototype = {
        equals: function(pos) {
            return this.node === pos.node & this.offset == pos.offset;
        },

        inspect: function() {
            return "[DomPosition(" + inspectNode(this.node) + ":" + this.offset + ")]";
        }/*,

        isStartOfElementContent: function() {
            var isCharacterData = isCharacterDataNode(this.node);
            var el = isCharacterData ? this.node.parentNode : this.node;
            return (el && el.nodeType == 1 && (isCharacterData ?
            if (isCharacterDataNode(this.node) && !this.node.previousSibling && this.node.parentNode)
        }*/
    };

    /**
     * @constructor
     */
    function DOMException(codeName) {
        this.code = this[codeName];
        this.codeName = codeName;
        this.message = "DOMException: " + this.codeName;
    }

    DOMException.prototype = {
        INDEX_SIZE_ERR: 1,
        HIERARCHY_REQUEST_ERR: 3,
        WRONG_DOCUMENT_ERR: 4,
        NO_MODIFICATION_ALLOWED_ERR: 7,
        NOT_FOUND_ERR: 8,
        NOT_SUPPORTED_ERR: 9,
        INVALID_STATE_ERR: 11
    };

    DOMException.prototype.toString = function() {
        return this.message;
    };

    api.dom = {
        arrayContains: arrayContains,
        getNodeIndex: getNodeIndex,
        getCommonAncestor: getCommonAncestor,
        isAncestorOf: isAncestorOf,
        getClosestAncestorIn: getClosestAncestorIn,
        isCharacterDataNode: isCharacterDataNode,
        insertAfter: insertAfter,
        splitDataNode: splitDataNode,
        getDocument: getDocument,
        getWindow: getWindow,
        getIframeWindow: getIframeWindow,
        getIframeDocument: getIframeDocument,
        getBody: getBody,
        comparePoints: comparePoints,
        inspectNode: inspectNode,
        createIterator: createIterator,
        DomPosition: DomPosition
    };

    api.DOMException = DOMException;
});rangy.createModule("DomRange", function(api, module) {
    api.requireModules( ["DomUtil"] );


    var dom = api.dom;
    var DomPosition = dom.DomPosition;
    var DOMException = api.DOMException;

    /*----------------------------------------------------------------------------------------------------------------*/

    // RangeIterator code borrows from IERange by Tim Ryan (http://github.com/timcameronryan/IERange)

    /**
     * @constructor
     */
    function RangeIterator(range, clonePartiallySelectedTextNodes) {
        this.range = range;
        this.clonePartiallySelectedTextNodes = clonePartiallySelectedTextNodes;



        if (!range.collapsed) {
            this.sc = range.startContainer;
            this.so = range.startOffset;
            this.ec = range.endContainer;
            this.eo = range.endOffset;
            var root = range.commonAncestorContainer;

            if (this.sc === this.ec && dom.isCharacterDataNode(this.sc)) {
                this.isSingleCharacterDataNode = true;
                this._first = this._last = this._next = this.sc;
            } else {
                this._first = this._next = (this.sc === root && !dom.isCharacterDataNode(this.sc)) ?
                    this.sc.childNodes[this.so] : dom.getClosestAncestorIn(this.sc, root, true);
                this._last = (this.ec === root && !dom.isCharacterDataNode(this.ec)) ?
                    this.ec.childNodes[this.eo - 1] : dom.getClosestAncestorIn(this.ec, root, true);
            }

        }
    }

    RangeIterator.prototype = {
        _current: null,
        _next: null,
        _first: null,
        _last: null,
        isSingleCharacterDataNode: false,

        reset: function() {
            this._current = null;
            this._next = this._first;
        },

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            // Move to next node
            var current = this._current = this._next;
            if (current) {
                this._next = (current !== this._last) ? current.nextSibling : null;

                // Check for partially selected text nodes
                if (dom.isCharacterDataNode(current) && this.clonePartiallySelectedTextNodes) {
                    if (current === this.ec) {

                        (current = current.cloneNode(true)).deleteData(this.eo, current.length - this.eo);
                    }
                    if (this._current === this.sc) {

                        (current = current.cloneNode(true)).deleteData(0, this.so);
                    }
                }
            }

            return current;
        },

        remove: function() {
            var current = this._current, start, end;

            if (dom.isCharacterDataNode(current) && (current === this.sc || current === this.ec)) {
                start = (current === this.sc) ? this.so : 0;
                end = (current === this.ec) ? this.eo : current.length;
                if (start != end) {
                    current.deleteData(start, end - start);
                }
            } else {
                if (current.parentNode) {
                    current.parentNode.removeChild(current);
                } else {

                }
            }
        },

        // Checks if the current node is partially selected
        isPartiallySelectedSubtree: function() {
            var current = this._current;
            return isNonTextPartiallySelected(current, this.range);
        },

        getSubtreeIterator: function() {
            var subRange;
            if (this.isSingleCharacterDataNode) {
                subRange = this.range.cloneRange();
                subRange.collapse();
            } else {
                subRange = new Range(getRangeDocument(this.range));
                var current = this._current;
                var startContainer = current, startOffset = 0, endContainer = current, endOffset = getEndOffset(current);

                if (dom.isAncestorOf(current, this.sc, true)) {
                    startContainer = this.sc;
                    startOffset = this.so;
                }
                if (dom.isAncestorOf(current, this.ec, true)) {
                    endContainer = this.ec;
                    endOffset = this.eo;
                }

                updateBoundaries(subRange, startContainer, startOffset, endContainer, endOffset);
            }
            return new RangeIterator(subRange, this.clonePartiallySelectedTextNodes);
        },

        detach: function(detachRange) {
            if (detachRange) {
                this.range.detach();
            }
            this.range = this._current = this._next = this._first = this._last = this.sc = this.so = this.ec = this.eo = null;
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/

    // Exceptions

    /**
     * @constructor
     */
    function RangeException(codeName) {
        this.code = this[codeName];
        this.codeName = codeName;
        this.message = "RangeException: " + this.codeName;
    }

    RangeException.prototype = {
        BAD_BOUNDARYPOINTS_ERR: 1,
        INVALID_NODE_TYPE_ERR: 2
    };

    RangeException.prototype.toString = function() {
        return this.message;
    };

    /*----------------------------------------------------------------------------------------------------------------*/


    function getRangeDocument(range) {
        return dom.getDocument(range.startContainer);
    }

    function dispatchEvent(range, type, args) {
        var listeners = range._listeners[type];
        if (listeners) {
            for (var i = 0, len = listeners.length; i < len; ++i) {
                listeners[i].call(range, {target: range, args: args});
            }
        }
    }

    function getBoundaryBeforeNode(node) {
        return new DomPosition(node.parentNode, dom.getNodeIndex(node));
    }

    function getBoundaryAfterNode(node) {
        return new DomPosition(node.parentNode, dom.getNodeIndex(node) + 1);
    }

    function getEndOffset(node) {
        return dom.isCharacterDataNode(node) ? node.length : (node.childNodes ? node.childNodes.length : 0);
    }

    function insertNodeAtPosition(node, n, o) {
        var firstNodeInserted = node.nodeType == 11 ? node.firstChild : node;
        if (dom.isCharacterDataNode(n)) {
            if (o == n.length) {
                dom.insertAfter(node, n);
            } else {
                n.parentNode.insertBefore(node, o == 0 ? n : dom.splitDataNode(n, o));
            }
        } else if (o >= n.childNodes.length) {
            n.appendChild(node);
        } else {
            n.insertBefore(node, n.childNodes[o]);
        }
        return firstNodeInserted;
    }

    function cloneSubtree(iterator) {
        var partiallySelected;
        for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {
            partiallySelected = iterator.isPartiallySelectedSubtree();

            node = node.cloneNode(!partiallySelected);
            if (partiallySelected) {
                subIterator = iterator.getSubtreeIterator();
                node.appendChild(cloneSubtree(subIterator));
                subIterator.detach(true);
            }

            if (node.nodeType == 10) { // DocumentType
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }
            frag.appendChild(node);
        }
        return frag;
    }

    function iterateSubtree(rangeIterator, func, iteratorState) {
        var it, n;
        iteratorState = iteratorState || { stop: false };
        for (var node, subRangeIterator; node = rangeIterator.next(); ) {
            //log.debug("iterateSubtree, partially selected: " + rangeIterator.isPartiallySelectedSubtree(), nodeToString(node));
            if (rangeIterator.isPartiallySelectedSubtree()) {
                // The node is partially selected by the Range, so we can use a new RangeIterator on the portion of the
                // node selected by the Range.
                if (func(node) === false) {
                    iteratorState.stop = true;
                    return;
                } else {
                    subRangeIterator = rangeIterator.getSubtreeIterator();
                    iterateSubtree(subRangeIterator, func, iteratorState);
                    subRangeIterator.detach(true);
                    if (iteratorState.stop) {
                        return;
                    }
                }
            } else {
                // The whole node is selected, so we can use efficient DOM iteration to iterate over the node and its
                // descendant
                it = dom.createIterator(node);
                while ( (n = it.next()) ) {
                    if (func(n) === false) {
                        iteratorState.stop = true;
                        return;
                    }
                }
            }
        }
    }

    function deleteSubtree(iterator) {
        var subIterator;
        while (iterator.next()) {
            if (iterator.isPartiallySelectedSubtree()) {
                subIterator = iterator.getSubtreeIterator();
                deleteSubtree(subIterator);
                subIterator.detach(true);
            } else {
                iterator.remove();
            }
        }
    }

    function extractSubtree(iterator) {

        for (var node, frag = getRangeDocument(iterator.range).createDocumentFragment(), subIterator; node = iterator.next(); ) {


            if (iterator.isPartiallySelectedSubtree()) {
                node = node.cloneNode(false);
                subIterator = iterator.getSubtreeIterator();
                node.appendChild(extractSubtree(subIterator));
                subIterator.detach(true);
            } else {
                iterator.remove();
            }
            if (node.nodeType == 10) { // DocumentType
                throw new DOMException("HIERARCHY_REQUEST_ERR");
            }
            frag.appendChild(node);
        }
        return frag;
    }

    function getNodesInRange(range, nodeTypes, filter) {
        //log.info("getNodesInRange, " + nodeTypes.join(","));
        var filterNodeTypes = !!(nodeTypes && nodeTypes.length), regex;
        var filterExists = !!filter;
        if (filterNodeTypes) {
            regex = new RegExp("^(" + nodeTypes.join("|") + ")$");
        }

        var nodes = [];
        iterateSubtree(new RangeIterator(range, false), function(node) {
            if ((!filterNodeTypes || regex.test(node.nodeType)) && (!filterExists || filter(node))) {
                nodes.push(node);
            }
        });
        return nodes;
    }

    function inspect(range) {
        var name = (typeof range.getName == "undefined") ? "Range" : range.getName();
        return "[" + name + "(" + dom.inspectNode(range.startContainer) + ":" + range.startOffset + ", " +
                dom.inspectNode(range.endContainer) + ":" + range.endOffset + ")]";
    }

    /**
     * Currently iterates through all nodes in the range on creation until I think of a decent way to do it
     * TODO: Look into making this a proper iterator, not requiring preloading everything first
     * @constructor
     */
    function RangeNodeIterator(range, nodeTypes, filter) {
        this.nodes = getNodesInRange(range, nodeTypes, filter);
        this._next = this.nodes[0];
        this._pointer = 0;
    }

    RangeNodeIterator.prototype = {
        _current: null,

        hasNext: function() {
            return !!this._next;
        },

        next: function() {
            this._current = this._next;
            this._next = this.nodes[ ++this._pointer ];
            return this._current;
        },

        detach: function() {
            this._current = this._next = this.nodes = null;
        }
    };

    function isNonTextPartiallySelected(node, range) {
        return (node.nodeType != 3) &&
               (dom.isAncestorOf(node, range.startContainer, true) || dom.isAncestorOf(node, range.endContainer, true));
    }

    var beforeAfterNodeTypes = [1, 3, 4, 5, 7, 8, 10];
    var rootContainerNodeTypes = [2, 9, 11];
    var readonlyNodeTypes = [5, 6, 10, 12];
    var insertableNodeTypes = [1, 3, 4, 5, 7, 8, 10, 11];
    var surroundNodeTypes = [1, 3, 4, 5, 7, 8];

    function createAncestorFinder(nodeTypes) {
        return function(node, selfIsAncestor) {
            var t, n = selfIsAncestor ? node : node.parentNode;
            while (n) {
                t = n.nodeType;
                if (dom.arrayContains(nodeTypes, t)) {
                    return n;
                }
                n = n.parentNode;
            }
            return null;
        };
    }

    function getRootContainer(node) {
        var parent;
        while ( (parent = node.parentNode) ) {
            node = parent;
        }
        return node;
    }

    var getDocumentOrFragmentContainer = createAncestorFinder( [9, 11] );
    var getReadonlyAncestor = createAncestorFinder(readonlyNodeTypes);
    var getDocTypeNotationEntityAncestor = createAncestorFinder( [6, 10, 12] );

    function assertNoDocTypeNotationEntityAncestor(node, allowSelf) {
        if (getDocTypeNotationEntityAncestor(node, allowSelf)) {
            throw new RangeException("INVALID_NODE_TYPE_ERR");
        }
    }

    function assertNotDetached(range) {
        if (!range.startContainer) {
            throw new DOMException("INVALID_STATE_ERR");
        }
    }

    function assertValidNodeType(node, invalidTypes) {
        if (!dom.arrayContains(invalidTypes, node.nodeType)) {
            throw new RangeException("INVALID_NODE_TYPE_ERR");
        }
    }

    function assertValidOffset(node, offset) {
        if (offset < 0 || offset > (dom.isCharacterDataNode(node) ? node.length : node.childNodes.length)) {
            throw new DOMException("INDEX_SIZE_ERR");
        }
    }

    function assertSameDocumentOrFragment(node1, node2) {
        if (getDocumentOrFragmentContainer(node1, true) !== getDocumentOrFragmentContainer(node2, true)) {
            throw new DOMException("WRONG_DOCUMENT_ERR");
        }
    }

    function assertNodeNotReadOnly(node) {
        if (getReadonlyAncestor(node, true)) {
            throw new DOMException("NO_MODIFICATION_ALLOWED_ERR");
        }
    }

    function assertNode(node, codeName) {
        if (!node) {
            throw new DOMException(codeName);
        }
    }

    function isOrphan(node) {
        return !getDocumentOrFragmentContainer(node, true);
    }

    function isValidOffset(node, offset) {
        return offset <= (dom.isCharacterDataNode(node) ? node.length : node.childNodes.length);
    }

    function assertRangeValid(range) {
        if (isOrphan(range.startContainer) || isOrphan(range.endContainer) ||
                !isValidOffset(range.startContainer, range.startOffset) ||
                !isValidOffset(range.endContainer, range.endOffset)) {
            throw new Error("Range Range error: Range is no longer valid after DOM mutation (" + range.inspect() + ")");
        }
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    var rangeProperties = ["startContainer", "startOffset", "endContainer", "endOffset", "collapsed",
        "commonAncestorContainer"];

    var s2s = 0, s2e = 1, e2e = 2, e2s = 3;
    var n_b = 0, n_a = 1, n_b_a = 2, n_i = 3;

    function copyComparisonConstantsToObject(obj) {
        obj.START_TO_START = s2s;
        obj.START_TO_END = s2e;
        obj.END_TO_END = e2e;
        obj.END_TO_START = e2s;

        obj.NODE_BEFORE = n_b;
        obj.NODE_AFTER = n_a;
        obj.NODE_BEFORE_AND_AFTER = n_b_a;
        obj.NODE_INSIDE = n_i;
    }

    function copyComparisonConstants(constructor) {
        copyComparisonConstantsToObject(constructor);
        copyComparisonConstantsToObject(constructor.prototype);
    }

    function createPrototypeRange(constructor, boundaryUpdater, detacher) {
        function createBeforeAfterNodeSetter(isBefore, isStart) {
            return function(node) {
                assertNotDetached(this);
                assertValidNodeType(node, beforeAfterNodeTypes);
                assertValidNodeType(getRootContainer(node), rootContainerNodeTypes);

                var boundary = (isBefore ? getBoundaryBeforeNode : getBoundaryAfterNode)(node);
                (isStart ? setRangeStart : setRangeEnd)(this, boundary.node, boundary.offset);
            };
        }

        function setRangeStart(range, node, offset) {
            var ec = range.endContainer, eo = range.endOffset;
            if (node !== range.startContainer || offset !== this.startOffset) {
                // Check the root containers of the range and the new boundary, and also check whether the new boundary
                // is after the current end. In either case, collapse the range to the new position
                if (getRootContainer(node) != getRootContainer(ec) || dom.comparePoints(node, offset, ec, eo) == 1) {
                    ec = node;
                    eo = offset;
                }
                boundaryUpdater(range, node, offset, ec, eo);
            }
        }

        function setRangeEnd(range, node, offset) {
            var sc = range.startContainer, so = range.startOffset;
            if (node !== range.endContainer || offset !== this.endOffset) {
                // Check the root containers of the range and the new boundary, and also check whether the new boundary
                // is after the current end. In either case, collapse the range to the new position
                if (getRootContainer(node) != getRootContainer(sc) || dom.comparePoints(node, offset, sc, so) == -1) {
                    sc = node;
                    so = offset;
                }
                boundaryUpdater(range, sc, so, node, offset);
            }
        }

        function setRangeStartAndEnd(range, node, offset) {
            if (node !== range.startContainer || offset !== this.startOffset || node !== range.endContainer || offset !== this.endOffset) {
                boundaryUpdater(range, node, offset, node, offset);
            }
        }

        function createRangeContentRemover(remover) {
            return function() {
                assertNotDetached(this);
                assertRangeValid(this);

                var sc = this.startContainer, so = this.startOffset, root = this.commonAncestorContainer;

                var iterator = new RangeIterator(this, true);

                // Work out where to position the range after content removal
                var node, boundary;
                if (sc !== root) {
                    node = dom.getClosestAncestorIn(sc, root, true);
                    boundary = getBoundaryAfterNode(node);
                    sc = boundary.node;
                    so = boundary.offset;
                }

                // Check none of the range is read-only
                iterateSubtree(iterator, assertNodeNotReadOnly);

                iterator.reset();

                // Remove the content
                var returnValue = remover(iterator);
                iterator.detach();

                // Move to the new position
                boundaryUpdater(this, sc, so, sc, so);

                return returnValue;
            };
        }

        constructor.prototype = {
            attachListener: function(type, listener) {
                this._listeners[type].push(listener);
            },

            setStart: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeStart(this, node, offset);
            },

            setEnd: function(node, offset) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeEnd(this, node, offset);
            },

            setStartBefore: createBeforeAfterNodeSetter(true, true),
            setStartAfter: createBeforeAfterNodeSetter(false, true),
            setEndBefore: createBeforeAfterNodeSetter(true, false),
            setEndAfter: createBeforeAfterNodeSetter(false, false),

            collapse: function(isStart) {
                assertNotDetached(this);
                assertRangeValid(this);
                if (isStart) {
                    boundaryUpdater(this, this.startContainer, this.startOffset, this.startContainer, this.startOffset);
                } else {
                    boundaryUpdater(this, this.endContainer, this.endOffset, this.endContainer, this.endOffset);
                }
            },

            selectNodeContents: function(node) {
                // This doesn't seem well specified: the spec talks only about selecting the node's contents, which
                // could be taken to mean only its children. However, browsers implement this the same as selectNode for
                // text nodes, so I shall do likewise
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, true);

                boundaryUpdater(this, node, 0, node, getEndOffset(node));
            },

            selectNode: function(node) {
                assertNotDetached(this);
                assertNoDocTypeNotationEntityAncestor(node, false);
                assertValidNodeType(node, beforeAfterNodeTypes);

                var start = getBoundaryBeforeNode(node), end = getBoundaryAfterNode(node);
                boundaryUpdater(this, start.node, start.offset, end.node, end.offset);
            },

            compareBoundaryPoints: function(how, range) {
                assertNotDetached(this);
                assertRangeValid(this);
                assertSameDocumentOrFragment(this.startContainer, range.startContainer);

                var nodeA, offsetA, nodeB, offsetB;
                var prefixA = (how == e2s || how == s2s) ? "start" : "end";
                var prefixB = (how == s2e || how == s2s) ? "start" : "end";
                nodeA = this[prefixA + "Container"];
                offsetA = this[prefixA + "Offset"];
                nodeB = range[prefixB + "Container"];
                offsetB = range[prefixB + "Offset"];
                return dom.comparePoints(nodeA, offsetA, nodeB, offsetB);
            },

            insertNode: function(node) {
                assertNotDetached(this);
                assertRangeValid(this);
                assertValidNodeType(node, insertableNodeTypes);
                assertNodeNotReadOnly(this.startContainer);

                if (dom.isAncestorOf(node, this.startContainer, true)) {
                    throw new DOMException("HIERARCHY_REQUEST_ERR");
                }

                // No check for whether the container of the start of the Range is of a type that does not allow
                // children of the type of node: the browser's DOM implementation should do this for us when we attempt
                // to add the node

                var firstNodeInserted = insertNodeAtPosition(node, this.startContainer, this.startOffset);
                this.setStartBefore(firstNodeInserted);
            },

            cloneContents: function() {
                assertNotDetached(this);
                assertRangeValid(this);

                var clone, frag;
                if (this.collapsed) {
                    return getRangeDocument(this).createDocumentFragment();
                } else {
                    if (this.startContainer === this.endContainer && dom.isCharacterDataNode(this.startContainer)) {
                        clone = this.startContainer.cloneNode(true);
                        clone.data = clone.data.slice(this.startOffset, this.endOffset);
                        frag = getRangeDocument(this).createDocumentFragment();
                        frag.appendChild(clone);
                        return frag;
                    } else {
                        var iterator = new RangeIterator(this, true);
                        clone = cloneSubtree(iterator);
                        iterator.detach();
                    }
                    return clone;
                }
            },

            extractContents: createRangeContentRemover(extractSubtree),

            deleteContents: createRangeContentRemover(deleteSubtree),

            canSurroundContents: function() {
                assertNotDetached(this);
                assertRangeValid(this);
                assertNodeNotReadOnly(this.startContainer);
                assertNodeNotReadOnly(this.endContainer);

                // Check if the contents can be surrounded. Specifically, this means whether the range partially selects
                // no non-text nodes.
                var iterator = new RangeIterator(this, true);
                var boundariesInvalid = (iterator._first && (isNonTextPartiallySelected(iterator._first, this)) ||
                        (iterator._last && isNonTextPartiallySelected(iterator._last, this)));
                iterator.detach();
                return !boundariesInvalid;
            },

            surroundContents: function(node) {
                assertValidNodeType(node, surroundNodeTypes);

                if (!this.canSurroundContents()) {
                    throw new RangeException("BAD_BOUNDARYPOINTS_ERR");
                }

                // Extract the contents
                var content = this.extractContents();

                // Clear the children of the node
                if (node.hasChildNodes()) {
                    while (node.lastChild) {
                        node.removeChild(node.lastChild);
                    }
                }

                // Insert the new node and add the extracted contents
                insertNodeAtPosition(node, this.startContainer, this.startOffset);
                node.appendChild(content);

                this.selectNode(node);
            },

            cloneRange: function() {
                assertNotDetached(this);
                assertRangeValid(this);
                var range = new Range(getRangeDocument(this));
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = this[prop];
                }
                return range;
            },

            detach: function() {
                detacher(this);
            },

            toString: function() {
                assertNotDetached(this);
                assertRangeValid(this);
                var sc = this.startContainer;
                if (sc === this.endContainer && dom.isCharacterDataNode(sc)) {
                    return (sc.nodeType == 3 || sc.nodeType == 4) ? sc.data.slice(this.startOffset, this.endOffset) : "";
                } else {
                    var textBits = [], iterator = new RangeIterator(this, true);

                    iterateSubtree(iterator, function(node) {
                        // Accept only text or CDATA nodes, not comments

                        if (node.nodeType == 3 || node.nodeType == 4) {
                            textBits.push(node.data);
                        }
                    });
                    iterator.detach();
                    return textBits.join("");
                }
            },

            // The methods below are all non-standard. The following batch were introduced by Mozilla but have since
            // been removed from Mozilla.

            compareNode: function(node) {
                assertNotDetached(this);
                assertRangeValid(this);

                var parent = node.parentNode;
                var nodeIndex = dom.getNodeIndex(node);

                if (!parent) {
                    throw new DOMException("NOT_FOUND_ERR");
                }

                var startComparison = this.comparePoint(parent, nodeIndex),
                    endComparison = this.comparePoint(parent, nodeIndex + 1);

                if (startComparison < 0) { // Node starts before
                    return (endComparison > 0) ? n_b_a : n_b;
                } else {
                    return (endComparison > 0) ? n_a : n_i;
                }
            },

            comparePoint: function(node, offset) {
                assertNotDetached(this);
                assertRangeValid(this);
                assertNode(node, "HIERARCHY_REQUEST_ERR");
                assertSameDocumentOrFragment(node, this.startContainer);

                if (dom.comparePoints(node, offset, this.startContainer, this.startOffset) < 0) {
                    return -1;
                } else if (dom.comparePoints(node, offset, this.endContainer, this.endOffset) > 0) {
                    return 1;
                }
                return 0;
            },

            createContextualFragment: function(html) {
                assertNotDetached(this);
                var doc = getRangeDocument(this);
                var container = doc.createElement("div");

                // The next line is obviously non-standard but will work in all recent browsers
                container.innerHTML = html;

                var frag = doc.createDocumentFragment(), n;

                while ( (n = container.firstChild) ) {
                    frag.appendChild(n);
                }

                return frag;
            },

            // This follows the Mozilla model whereby a node that borders a range is not considered to intersect with it
            intersectsNode: function(node, touchingIsIntersecting) {
                assertNotDetached(this);
                assertRangeValid(this);
                assertNode(node, "NOT_FOUND_ERR");
                if (dom.getDocument(node) !== getRangeDocument(this)) {
                    return false;
                }

                var parent = node.parentNode, offset = dom.getNodeIndex(node);
                assertNode(parent, "NOT_FOUND_ERR");

                var startComparison = dom.comparePoints(parent, offset, this.endContainer, this.endOffset),
                    endComparison = dom.comparePoints(parent, offset + 1, this.startContainer, this.startOffset);

                return touchingIsIntersecting ? startComparison <= 0 && endComparison >= 0 : startComparison < 0 && endComparison > 0;
            },

            isPointInRange: function(node, offset) {
                assertNotDetached(this);
                assertRangeValid(this);
                assertNode(node, "HIERARCHY_REQUEST_ERR");
                assertSameDocumentOrFragment(node, this.startContainer);

                return (dom.comparePoints(node, offset, this.startContainer, this.startOffset) >= 0) &&
                       (dom.comparePoints(node, offset, this.endContainer, this.endOffset) <= 0);
            },

            // The methods below are non-standard and invented by me.

            // Sharing a boundary start-to-end or end-to-start does not count as intersection.
            intersectsRange: function(range) {
                assertNotDetached(this);
                assertRangeValid(this);

                if (getRangeDocument(range) != getRangeDocument(this)) {
                    throw new DOMException("WRONG_DOCUMENT_ERR");
                }

                return dom.comparePoints(this.startContainer, this.startOffset, range.endContainer, range.endOffset) < 0 &&
                       dom.comparePoints(this.endContainer, this.endOffset, range.startContainer, range.startOffset) > 0;
            },

            intersection: function(range) {
                if (this.intersectsRange(range)) {
                    var startComparison = dom.comparePoints(this.startContainer, this.startOffset, range.startContainer, range.startOffset),
                        endComparison = dom.comparePoints(this.endContainer, this.endOffset, range.endContainer, range.endOffset);
                
                    var intersectionRange = this.cloneRange();

                    if (startComparison == -1) {
                        intersectionRange.setStart(range.startContainer, range.startOffset);
                    }
                    if (endComparison == 1) {
                        intersectionRange.setEnd(range.endContainer, range.endOffset);
                    }
                    return intersectionRange;
                }
                return null;
            },

            containsNode: function(node, allowPartial) {
                if (allowPartial) {
                    return this.intersectsNode(node, false);
                } else {
                    return this.compareNode(node) == n_i;
                }
            },

            containsNodeContents: function(node) {
                return this.comparePoint(node, 0) >= 0 && this.comparePoint(node, getEndOffset(node)) <= 0;
            },

            splitBoundaries: function() {
                assertNotDetached(this);
                assertRangeValid(this);


                var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;
                var startEndSame = (sc === ec);

                if (dom.isCharacterDataNode(ec) && eo < ec.length) {
                    dom.splitDataNode(ec, eo);

                }

                if (dom.isCharacterDataNode(sc) && so > 0) {

                    sc = dom.splitDataNode(sc, so);
                    if (startEndSame) {
                        eo -= so;
                        ec = sc;
                    }
                    so = 0;

                }
                boundaryUpdater(this, sc, so, ec, eo);
            },

            normalizeBoundaries: function() {
                assertNotDetached(this);
                assertRangeValid(this);

                var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;

                var mergeForward = function(node) {
                    var sibling = node.nextSibling;
                    if (sibling && sibling.nodeType == node.nodeType) {
                        ec = node;
                        eo = node.length;
                        node.appendData(sibling.data);
                        sibling.parentNode.removeChild(sibling);
                    }
                };

                var mergeBackward = function(node) {
                    var sibling = node.previousSibling;
                    if (sibling && sibling.nodeType == node.nodeType) {
                        sc = node;
                        so = sibling.length;
                        node.insertData(0, sibling.data);
                        sibling.parentNode.removeChild(sibling);
                        if (sc == ec) {
                            eo += so;
                            ec = sc;
                        }
                    }
                };

                var normalizeStart = true;

                if (dom.isCharacterDataNode(ec)) {
                    if (ec.length == eo) {
                        mergeForward(ec);
                    }
                } else {
                    if (eo > 0) {
                        var endNode = ec.childNodes[eo - 1];
                        if (endNode && dom.isCharacterDataNode(endNode)) {
                            mergeForward(endNode);
                        }
                    }
                    normalizeStart = !this.collapsed;
                }

                if (normalizeStart) {
                    if (dom.isCharacterDataNode(sc)) {
                        if (so == 0) {
                            mergeBackward(sc);
                        }
                    } else {
                        if (so < sc.childNodes.length) {
                            var startNode = sc.childNodes[so];
                            if (startNode && dom.isCharacterDataNode(startNode)) {
                                mergeBackward(startNode);
                            }
                        }
                    }
                } else {
                    sc = ec;
                    so = eo;
                }

                boundaryUpdater(this, sc, so, ec, eo);
            },

            createNodeIterator: function(nodeTypes, filter) {
                assertNotDetached(this);
                assertRangeValid(this);
                return new RangeNodeIterator(this, nodeTypes, filter);
            },

            getNodes: function(nodeTypes, filter) {
                assertNotDetached(this);
                assertRangeValid(this);
                return getNodesInRange(this, nodeTypes, filter);
            },

            collapseToPoint: function(node, offset) {
                assertNotDetached(this);
                assertRangeValid(this);

                assertNoDocTypeNotationEntityAncestor(node, true);
                assertValidOffset(node, offset);

                setRangeStartAndEnd(this, node, offset);
            },

            collapseBefore: function(node) {
                assertNotDetached(this);

                this.setEndBefore(node);
                this.collapse(false);
            },

            collapseAfter: function(node) {
                assertNotDetached(this);

                this.setStartAfter(node);
                this.collapse(true);
            },

            getName: function() {
                return "DomRange";
            },

            equals: function(range) {
                return Range.rangesEqual(this, range);
            },

            inspect: function() {
                return inspect(this);
            }
        };

        copyComparisonConstants(constructor);
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    // Updates commonAncestorContainer and collapsed after boundary change
    function updateCollapsedAndCommonAncestor(range) {
        range.collapsed = (range.startContainer === range.endContainer && range.startOffset === range.endOffset);
        range.commonAncestorContainer = range.collapsed ?
            range.startContainer : dom.getCommonAncestor(range.startContainer, range.endContainer);
    }

    function updateBoundaries(range, startContainer, startOffset, endContainer, endOffset) {
        var startMoved = (range.startContainer !== startContainer || range.startOffset !== startOffset);
        var endMoved = (range.endContainer !== endContainer || range.endOffset !== endOffset);

        range.startContainer = startContainer;
        range.startOffset = startOffset;
        range.endContainer = endContainer;
        range.endOffset = endOffset;

        updateCollapsedAndCommonAncestor(range);
        dispatchEvent(range, "boundarychange", {startMoved: startMoved, endMoved: endMoved});
    }

    function detach(range) {
        assertNotDetached(range);
        range.startContainer = range.startOffset = range.endContainer = range.endOffset = null;
        range.collapsed = range.commonAncestorContainer = null;
        dispatchEvent(range, "detach", null);
        range._listeners = null;
    }

    /**
     * @constructor
     */
    function Range(doc) {
        this.startContainer = doc;
        this.startOffset = 0;
        this.endContainer = doc;
        this.endOffset = 0;
        this._listeners = {
            boundarychange: [],
            detach: []
        };
        updateCollapsedAndCommonAncestor(this);
    }

    createPrototypeRange(Range, updateBoundaries, detach);

    Range.fromRange = function(r) {
        var range = new Range(getRangeDocument(r));
        updateBoundaries(range, r.startContainer, r.startOffset, r.endContainer, r.endOffset);
        return range;
    };

    Range.rangeProperties = rangeProperties;
    Range.RangeIterator = RangeIterator;
    Range.copyComparisonConstants = copyComparisonConstants;
    Range.createPrototypeRange = createPrototypeRange;
    Range.inspect = inspect;
    Range.getRangeDocument = getRangeDocument;
    Range.rangesEqual = function(r1, r2) {
        return r1.startContainer === r2.startContainer &&
               r1.startOffset === r2.startOffset &&
               r1.endContainer === r2.endContainer &&
               r1.endOffset === r2.endOffset;
    };
    Range.getEndOffset = getEndOffset;

    api.DomRange = Range;
    api.RangeException = RangeException;
});rangy.createModule("WrappedRange", function(api, module) {
    api.requireModules( ["DomUtil", "DomRange"] );

    /**
     * @constructor
     */
    var WrappedRange;
    var dom = api.dom;
    var DomPosition = dom.DomPosition;
    var DomRange = api.DomRange;



    /*----------------------------------------------------------------------------------------------------------------*/

    /*
    This is a workaround for a bug where IE returns the wrong container element from the TextRange's parentElement()
    method. For example, in the following (where pipes denote the selection boundaries):

    <ul id="ul"><li id="a">| a </li><li id="b"> b |</li></ul>

    var range = document.selection.createRange();
    alert(range.parentElement().id); // Should alert "ul" but alerts "b"

    This method returns the common ancestor node of the following:
    - the parentElement() of the textRange
    - the parentElement() of the textRange after calling collapse(true)
    - the parentElement() of the textRange after calling collapse(false)
     */
    function getTextRangeContainerElement(textRange) {
        var parentEl = textRange.parentElement();

        var range = textRange.duplicate();
        range.collapse(true);
        var startEl = range.parentElement();
        range = textRange.duplicate();
        range.collapse(false);
        var endEl = range.parentElement();
        var startEndContainer = (startEl == endEl) ? startEl : dom.getCommonAncestor(startEl, endEl);

        return startEndContainer == parentEl ? startEndContainer : dom.getCommonAncestor(parentEl, startEndContainer);
    }

    function textRangeIsCollapsed(textRange) {
        return textRange.compareEndPoints("StartToEnd", textRange) == 0;
    }

    // Gets the boundary of a TextRange expressed as a node and an offset within that node. This function started out as
    // an improved version of code found in Tim Cameron Ryan's IERange (http://code.google.com/p/ierange/) but has
    // grown, fixing problems with line breaks in preformatted text, adding workaround for IE TextRange bugs, handling
    // for inputs and images, plus optimizations.
    function getTextRangeBoundaryPosition(textRange, wholeRangeContainerElement, isStart, isCollapsed) {
        var workingRange = textRange.duplicate();

        workingRange.collapse(isStart);
        var containerElement = workingRange.parentElement();

        // Sometimes collapsing a TextRange that's at the start of a text node can move it into the previous node, so
        // check for that
        // TODO: Find out when. Workaround for wholeRangeContainerElement may break this
        if (!dom.isAncestorOf(wholeRangeContainerElement, containerElement, true)) {
            containerElement = wholeRangeContainerElement;

        }



        // Deal with nodes that cannot "contain rich HTML markup". In practice, this means form inputs, images and
        // similar. See http://msdn.microsoft.com/en-us/library/aa703950%28VS.85%29.aspx
        if (!containerElement.canHaveHTML) {
            return new DomPosition(containerElement.parentNode, dom.getNodeIndex(containerElement));
        }

        var workingNode = dom.getDocument(containerElement).createElement("span");
        var comparison, workingComparisonType = isStart ? "StartToStart" : "StartToEnd";
        var previousNode, nextNode, boundaryPosition, boundaryNode;

        // Move the working range through the container's children, starting at the end and working backwards, until the
        // working range reaches or goes past the boundary we're interested in
        do {
            containerElement.insertBefore(workingNode, workingNode.previousSibling);
            workingRange.moveToElementText(workingNode);
        } while ( (comparison = workingRange.compareEndPoints(workingComparisonType, textRange)) > 0 &&
                workingNode.previousSibling);

        // We've now reached or gone past the boundary of the text range we're interested in
        // so have identified the node we want
        boundaryNode = workingNode.nextSibling;

        if (comparison == -1 && boundaryNode && dom.isCharacterDataNode(boundaryNode)) {
            // This must be a data node (text, comment, cdata) since we've overshot. The working range is collapsed at
            // the start of the node containing the text range's boundary, so we move the end of the working range to
            // the boundary point and measure the length of its text to get the boundary's offset within the node
            workingRange.setEndPoint(isStart ? "EndToStart" : "EndToEnd", textRange);


            var offset;

            if (/[\r\n]/.test(boundaryNode.data)) {
                /*
                For the particular case of a boundary within a text node containing line breaks (within a <pre> element,
                for example), we need a slightly complicated approach to get the boundary's offset in IE. The facts:

                - Each line break is represented as \r in the text node's data/nodeValue properties
                - Each line break is represented as \r\n in the range's text property
                - The text property of the TextRange strips trailing line breaks

                To get round the problem presented by the final fact above, we can use the fact that TextRange's
                moveStart and moveEnd properties return the actual number of characters moved, which is not necessarily
                the same as the number of characters it was instructed to move. The simplest approach is to use this to
                store the characters moved when moving both the start and end of the range to the start of the document
                body and subtracting the start offset from the end offset (the "move-negative-gazillion" method).
                However, this is extremely slow when the document is large and the range is near the end of it. Clearly
                doing the mirror image (i.e. moving the range boundaries to the end of the document) has the same
                problem.

                Another approach that works is to use moveStart to move the start boundary of the range up to the end
                one character at a time and incrementing a counter with the result of the moveStart call. However, the
                check for whether the start boundary has reached the end boundary is expensive, so this method is slow
                (although unlike "move-negative-gazillion" is unaffected by the location of the range within the
                document).

                The method below uses the fact that once each \r\n in the range's text property has been converted to a
                single \r character (as it is in the text node), we know the offset is at least as long as the range
                text's length, so the start of the range is moved that length initially and then a character at a time
                to make up for any line breaks that the range text property has stripped. This seems to have good
                performance in most situations compared to the previous two methods.
                */
                var tempRange = workingRange.duplicate();
                var rangeLength = tempRange.text.replace(/\r\n/g, "\r").length;

                offset = tempRange.moveStart("character", rangeLength);
                while ( (comparison = tempRange.compareEndPoints("StartToEnd", tempRange)) == -1) {
                    offset++;
                    tempRange.moveStart("character", 1);
                }
            } else {
                offset = workingRange.text.length;
            }
            boundaryPosition = new DomPosition(boundaryNode, offset);
        } else {


            // If the boundary immediately follows a character data node and this is the end boundary, we should favour
            // a position within that, and likewise for a start boundary preceding a character data node
            previousNode = (isCollapsed || !isStart) && workingNode.previousSibling;
            nextNode = (isCollapsed || isStart) && workingNode.nextSibling;



            if (nextNode && dom.isCharacterDataNode(nextNode)) {
                boundaryPosition = new DomPosition(nextNode, 0);
            } else if (previousNode && dom.isCharacterDataNode(previousNode)) {
                boundaryPosition = new DomPosition(previousNode, previousNode.length);
            } else {
                boundaryPosition = new DomPosition(containerElement, dom.getNodeIndex(workingNode));
            }
        }

        // Clean up
        workingNode.parentNode.removeChild(workingNode);

        return boundaryPosition;
    }

    // Returns a TextRange representing the boundary of a TextRange expressed as a node and an offset within that node.
    // This function started out as an optimized version of code found in Tim Cameron Ryan's IERange
    // (http://code.google.com/p/ierange/)
    function createBoundaryTextRange(boundaryPosition, isStart) {
        var boundaryNode, boundaryParent, boundaryOffset = boundaryPosition.offset;
        var doc = dom.getDocument(boundaryPosition.node);
        var workingNode, childNodes, workingRange = doc.body.createTextRange();
        var nodeIsDataNode = dom.isCharacterDataNode(boundaryPosition.node);

        // There is a shortcut we can take that prevents the need to insert anything into the DOM if the boundary is at
        // either end of the contents of an element, which is to use TextRange's moveToElementText method

        if (nodeIsDataNode) {
            boundaryNode = boundaryPosition.node;
            boundaryParent = boundaryNode.parentNode;
        } else {
            childNodes = boundaryPosition.node.childNodes;
            boundaryNode = (boundaryOffset < childNodes.length) ? childNodes[boundaryOffset] : null;
            boundaryParent = boundaryPosition.node;
        }

        // Position the range immediately before the node containing the boundary
        workingNode = doc.createElement("span");

        // Having a non-empty element persuades IE to consider the TextRange boundary to be within an element
        // rather than immediately before or after it, which is what we want
        workingNode.innerHTML = "&#feff;";

        // insertBefore is supposed to work like appendChild if the second parameter is null. However, a bug report
        // for IERange suggests that it can crash the browser: http://code.google.com/p/ierange/issues/detail?id=12
        if (boundaryNode) {
            boundaryParent.insertBefore(workingNode, boundaryNode);
        } else {
            boundaryParent.appendChild(workingNode);
        }

        workingRange.moveToElementText(workingNode);
        workingRange.collapse(!isStart);

        // Clean up
        boundaryParent.removeChild(workingNode);

        // Move the working range to the text offset, if required
        if (nodeIsDataNode) {
            workingRange[isStart ? "moveStart" : "moveEnd"]("character", boundaryOffset);
        }

        return workingRange;
    }

    /*----------------------------------------------------------------------------------------------------------------*/

    if (api.features.implementsDomRange) {
        // This is a wrapper around the browser's native DOM Range. It has two aims:
        // - Provide workarounds for specific browser bugs
        // - provide convenient extensions, as found in Rangy's DomRange

        (function() {
            var rangeProto;
            var rangeProperties = DomRange.rangeProperties;
            var canSetRangeStartAfterEnd;

            function updateRangeProperties(range) {
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = range.nativeRange[prop];
                }
            }

            function updateNativeRange(range, startContainer, startOffset, endContainer,endOffset) {
                var startMoved = (range.startContainer !== startContainer || range.startOffset != startOffset);
                var endMoved = (range.endContainer !== endContainer || range.endOffset != endOffset);

                if (endMoved) {
                    range.setEnd(endContainer, endOffset);
                }

                if (startMoved) {
                    range.setStart(startContainer, startOffset);
                }
            }

            function detach(range) {
                range.nativeRange.detach();
                range.detached = true;
                var i = rangeProperties.length, prop;
                while (i--) {
                    prop = rangeProperties[i];
                    range[prop] = null;
                }
            }

            var createBeforeAfterNodeSetter;

            WrappedRange = function(range) {
                if (!range) {
                    throw new Error("Range must be specified");
                }
                this.nativeRange = range;
                updateRangeProperties(this);
            };

            DomRange.createPrototypeRange(WrappedRange, updateNativeRange, detach);

            rangeProto = WrappedRange.prototype;

            rangeProto.selectNode = function(node) {
                this.nativeRange.selectNode(node);
                updateRangeProperties(this);
            };

            rangeProto.deleteContents = function() {
                this.nativeRange.deleteContents();
                updateRangeProperties(this);
            };

            rangeProto.extractContents = function() {
                var frag = this.nativeRange.extractContents();
                updateRangeProperties(this);
                return frag;
            };

            rangeProto.cloneContents = function() {
                return this.nativeRange.cloneContents();
            };

            // TODO: Until I can find a way to programmatically trigger the Firefox bug (apparently long-standing, still
            // present in 3.6.8) that throws "Index or size is negative or greater than the allowed amount" for
            // insertNode in some circumstances, all browsers will have to use the Rangy's own implementation of
            // insertNode, which works but is almost certainly slower than the native implementation.
/*
            rangeProto.insertNode = function(node) {
                this.nativeRange.insertNode(node);
                updateRangeProperties(this);
            };
*/

            rangeProto.surroundContents = function(node) {
                this.nativeRange.surroundContents(node);
                updateRangeProperties(this);
            };

            rangeProto.collapse = function(isStart) {
                this.nativeRange.collapse(isStart);
                updateRangeProperties(this);
            };

            rangeProto.cloneRange = function() {
                return new WrappedRange(this.nativeRange.cloneRange());
            };

            rangeProto.refresh = function() {
                updateRangeProperties(this);
            };

            rangeProto.toString = function() {
                return this.nativeRange.toString();
            };

            // Create test range and node for feature detection

            var testTextNode = document.createTextNode("test");
            dom.getBody(document).appendChild(testTextNode);
            var range = document.createRange();

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for Firefox bug (apparently long-standing, still present in 3.6.8) that throws "Index or size is
            // negative or greater than the allowed amount" for insertNode in some circumstances, and correct for it
            // by using DomRange's insertNode implementation

/*
            var span = dom.getBody(document).insertBefore(document.createElement("span"), testTextNode);
            var spanText = span.appendChild(document.createTextNode("span"));
            range.setEnd(testTextNode, 2);
            range.setStart(spanText, 2);
            var nodeToInsert = document.createElement("span");
            nodeToInsert.innerHTML = "OIDUIIU"
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            range = sel.getRangeAt(0);
            //alert(range)
            range.insertNode(nodeToInsert);

            nodeToInsert.parentNode.removeChild(nodeToInsert);
            range.setEnd(testTextNode, 2);
            range.setStart(spanText, 2);
            nodeToInsert = document.createElement("span");
            nodeToInsert.innerHTML = "werw"
            range.insertNode(nodeToInsert);
            alert(range)
*/


            /*--------------------------------------------------------------------------------------------------------*/

            // Test for Firefox 2 bug that prevents moving the start of a Range to a point after its current end and
            // correct for it

            range.setStart(testTextNode, 0);
            range.setEnd(testTextNode, 0);

            try {
                range.setStart(testTextNode, 1);
                canSetRangeStartAfterEnd = true;

                rangeProto.setStart = function(node, offset) {
                    this.nativeRange.setStart(node, offset);
                    updateRangeProperties(this);
                };

                rangeProto.setEnd = function(node, offset) {
                    this.nativeRange.setEnd(node, offset);
                    updateRangeProperties(this);
                };

                createBeforeAfterNodeSetter = function(name) {
                    return function(node) {
                        this.nativeRange[name](node);
                        updateRangeProperties(this);
                    };
                };

            } catch(ex) {


                canSetRangeStartAfterEnd = false;

                rangeProto.setStart = function(node, offset) {
                    try {
                        this.nativeRange.setStart(node, offset);
                    } catch (ex) {
                        this.nativeRange.setEnd(node, offset);
                        this.nativeRange.setStart(node, offset);
                    }
                    updateRangeProperties(this);
                };

                rangeProto.setEnd = function(node, offset) {
                    try {
                        this.nativeRange.setEnd(node, offset);
                    } catch (ex) {
                        this.nativeRange.setStart(node, offset);
                        this.nativeRange.setEnd(node, offset);
                    }
                    updateRangeProperties(this);
                };

                createBeforeAfterNodeSetter = function(name, oppositeName) {
                    return function(node) {
                        try {
                            this.nativeRange[name](node);
                        } catch (ex) {
                            this.nativeRange[oppositeName](node);
                            this.nativeRange[name](node);
                        }
                        updateRangeProperties(this);
                    };
                };
            }

            rangeProto.setStartBefore = createBeforeAfterNodeSetter("setStartBefore", "setEndBefore");
            rangeProto.setStartAfter = createBeforeAfterNodeSetter("setStartAfter", "setEndAfter");
            rangeProto.setEndBefore = createBeforeAfterNodeSetter("setEndBefore", "setStartBefore");
            rangeProto.setEndAfter = createBeforeAfterNodeSetter("setEndAfter", "setStartAfter");

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for and correct Firefox 2 behaviour with selectNodeContents on text nodes: it collapses the range to
            // the 0th character of the text node
            range.selectNodeContents(testTextNode);
            if (range.startContainer == testTextNode && range.endContainer == testTextNode &&
                    range.startOffset == 0 && range.endOffset == testTextNode.length) {
                rangeProto.selectNodeContents = function(node) {
                    this.nativeRange.selectNodeContents(node);
                    updateRangeProperties(this);
                };
            } else {
                rangeProto.selectNodeContents = function(node) {
                    this.setStart(node, 0);
                    this.setEnd(node, DomRange.getEndOffset(node));
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Test for WebKit bug that has the beahviour of compareBoundaryPoints round the wrong way for constants
            // START_TO_END and END_TO_START: https://bugs.webkit.org/show_bug.cgi?id=20738

            range.selectNodeContents(testTextNode);
            range.setEnd(testTextNode, 3);

            var range2 = document.createRange();
            range2.selectNodeContents(testTextNode);
            range2.setEnd(testTextNode, 4);
            range2.setStart(testTextNode, 2);

            if (range.compareBoundaryPoints(range.START_TO_END, range2) == -1 && range.compareBoundaryPoints(range.END_TO_START, range2) == 1) {
                // This is the wrong way round, so correct for it


                rangeProto.compareBoundaryPoints = function(type, range) {
                    range = range.nativeRange || range;
                    if (type == range.START_TO_END) {
                        type = range.END_TO_START;
                    } else if (type == range.END_TO_START) {
                        type = range.START_TO_END;
                    }
                    return this.nativeRange.compareBoundaryPoints(type, range);
                };
            } else {
                rangeProto.compareBoundaryPoints = function(type, range) {
                    return this.nativeRange.compareBoundaryPoints(type, range.nativeRange || range);
                };
            }

            /*--------------------------------------------------------------------------------------------------------*/

            // Clean up
            dom.getBody(document).removeChild(testTextNode);
            range.detach();
            range2.detach();
        })();

    } else if (api.features.implementsTextRange) {
        // This is a wrapper around a TextRange, providing full DOM Range functionality using rangy's DomRange as a
        // prototype

        WrappedRange = function(textRange) {
            this.textRange = textRange;
            this.refresh();
        };

        WrappedRange.prototype = new DomRange(document);

        WrappedRange.prototype.refresh = function() {
            var start, end;

            // TextRange's parentElement() method cannot be trusted. getTextRangeContainerElement() works around that.
            // We do that here to avoid doing it twice unnecessarily.
            var rangeContainerElement = getTextRangeContainerElement(this.textRange);

            if (textRangeIsCollapsed(this.textRange)) {
                end = start = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true, true);
            } else {

                start = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, true, false);
                end = getTextRangeBoundaryPosition(this.textRange, rangeContainerElement, false, false);
            }

            this.setStart(start.node, start.offset);
            this.setEnd(end.node, end.offset);
        };

        WrappedRange.rangeToTextRange = function(range) {
            if (range.collapsed) {
                return createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true, true);
            } else {
                var startRange = createBoundaryTextRange(new DomPosition(range.startContainer, range.startOffset), true, false);
                var endRange = createBoundaryTextRange(new DomPosition(range.endContainer, range.endOffset), false, false);
                var textRange = dom.getDocument(range.startContainer).body.createTextRange();
                textRange.setEndPoint("StartToStart", startRange);
                textRange.setEndPoint("EndToEnd", endRange);
                return textRange;
            }
        };

        DomRange.copyComparisonConstants(WrappedRange);

        // Add WrappedRange as the Range property of the global object to allow expression like Range.END_TO_END to work
        var globalObj = (function() { return this; })();
        if (typeof globalObj.Range == "undefined") {
            globalObj.Range = WrappedRange;
        }
    }

    WrappedRange.prototype.getName = function() {
        return "WrappedRange";
    };

    api.WrappedRange = WrappedRange;

    api.createNativeRange = function(doc) {
        doc = doc || document;
        if (api.features.implementsDomRange) {
            return doc.createRange();
        } else if (api.features.implementsTextRange) {
            return doc.body.createTextRange();
        }
    };

    api.createRange = function(doc) {
        doc = doc || document;
        return new WrappedRange(api.createNativeRange(doc));
    };

    api.createRangyRange = function(doc) {
        doc = doc || document;
        return new DomRange(doc);
    };

    api.createIframeRange = function(iframeEl) {
        return api.createRange(dom.getIframeDocument(iframeEl));
    };

    api.createIframeRangyRange = function(iframeEl) {
        return api.createRangyRange(dom.getIframeDocument(iframeEl));
    };

    api.addCreateMissingNativeApiListener(function(win) {
        var doc = win.document;
        if (typeof doc.createRange == "undefined") {
            doc.createRange = function() {
                return api.createRange(this);
            };
        }
        doc = win = null;
    });
});rangy.createModule("WrappedSelection", function(api, module) {
    // This will create a selection object wrapper that follows the HTML5 draft spec selections section
    // (http://dev.w3.org/html5/spec/editing.html#selection) and adds convenience extensions

    api.requireModules( ["DomUtil", "DomRange", "WrappedRange"] );

    api.config.checkSelectionRanges = true;

    var BOOLEAN = "boolean", windowPropertyName = "_rangySelection";
    var dom = api.dom;
    var util = api.util;
    var DomRange = api.DomRange;
    var WrappedRange = api.WrappedRange;
    var DOMException = api.DOMException;
    var DomPosition = dom.DomPosition;


    var getSelection, selectionIsCollapsed;



    // Test for the Range/TextRange and Selection features required
    // Test for ability to retrieve selection
    if (api.util.isHostMethod(window, "getSelection")) {
        getSelection = function(winParam) {
            return (winParam || window).getSelection();
        };
    } else if (api.util.isHostObject(document, "selection")) {
        getSelection = function(winParam) {
            return ((winParam || window).document.selection);
        };
    } else {
        module.fail("No means of obtaining a selection object");
    }

    api.getNativeSelection = getSelection;

    var testSelection = getSelection();
    var testRange = api.createNativeRange(document);
    var body = dom.getBody(document);

    // Obtaining a range from a selection
    var selectionHasAnchorAndFocus = util.areHostObjects(testSelection, ["anchorNode", "focusNode"] &&
                                     util.areHostProperties(testSelection, ["anchorOffset", "focusOffset"]));
    api.features.selectionHasAnchorAndFocus = selectionHasAnchorAndFocus;

    // Test for existence of native selection extend() method
    var selectionHasExtend = util.isHostMethod(testSelection, "extend");
    api.features.selectionHasExtend = selectionHasExtend;

    // Test if rangeCount exists
    var selectionHasRangeCount = (typeof testSelection.rangeCount == "number");
    api.features.selectionHasRangeCount = selectionHasRangeCount;

    var selectionSupportsMultipleRanges = false;
    var collapsedNonEditableSelectionsSupported = true;

    if (util.areHostMethods(testSelection, ["addRange", "getRangeAt", "removeAllRanges"]) &&
            typeof testSelection.rangeCount == "number" && api.features.implementsDomRange) {

        // Test whether the native selection is capable of supporting multiple ranges
        (function() {
            var textNode1 = body.appendChild(document.createTextNode("One"));
            var textNode2 = body.appendChild(document.createTextNode("Two"));
            var testRange2 = api.createNativeRange(document);
            testRange2.selectNodeContents(textNode1);
            var testRange3 = api.createNativeRange(document);
            testRange3.selectNodeContents(textNode2);
            testSelection.removeAllRanges();
            testSelection.addRange(testRange2);
            testSelection.addRange(testRange3);
            selectionSupportsMultipleRanges = (testSelection.rangeCount == 2);
            testSelection.removeAllRanges();
            textNode1.parentNode.removeChild(textNode1);
            textNode2.parentNode.removeChild(textNode2);

            // Test whether the native selection will allow a collapsed selection within a non-editable element
            var el = document.createElement("p");
            el.contentEditable = false;
            var textNode3 = el.appendChild(document.createTextNode("test"));
            body.appendChild(el);
            var testRange4 = api.createRange();
            testRange4.collapseToPoint(textNode3, 1);
            testSelection.addRange(testRange4.nativeRange);
            collapsedNonEditableSelectionsSupported = (testSelection.rangeCount == 1);
            testSelection.removeAllRanges();
            body.removeChild(el);
        })();
    }

    api.features.selectionSupportsMultipleRanges = selectionSupportsMultipleRanges;
    api.features.collapsedNonEditableSelectionsSupported = collapsedNonEditableSelectionsSupported;

    // ControlRanges
    var selectionHasType = util.isHostProperty(testSelection, "type");
    var implementsControlRange = false, testControlRange;

    if (body && util.isHostMethod(body, "createControlRange")) {
        testControlRange = body.createControlRange();
        if (util.areHostProperties(testControlRange, ["item", "add"])) {
            implementsControlRange = true;
        }
    }
    api.features.implementsControlRange = implementsControlRange;

    // Selection collapsedness
    if (selectionHasAnchorAndFocus) {
        selectionIsCollapsed = function(sel) {
            return sel.anchorNode === sel.focusNode && sel.anchorOffset === sel.focusOffset;
        };
    } else {
        selectionIsCollapsed = function(sel) {
            return sel.rangeCount ? sel.getRangeAt(sel.rangeCount - 1).collapsed : false;
        };
    }

    function updateAnchorAndFocusFromRange(sel, range, backwards) {
        var anchorPrefix = backwards ? "end" : "start", focusPrefix = backwards ? "start" : "end";
        sel.anchorNode = range[anchorPrefix + "Container"];
        sel.anchorOffset = range[anchorPrefix + "Offset"];
        sel.focusNode = range[focusPrefix + "Container"];
        sel.focusOffset = range[focusPrefix + "Offset"];
    }

    function updateAnchorAndFocusFromNativeSelection(sel) {
        var nativeSel = sel.nativeSelection;
        sel.anchorNode = nativeSel.anchorNode;
        sel.anchorOffset = nativeSel.anchorOffset;
        sel.focusNode = nativeSel.focusNode;
        sel.focusOffset = nativeSel.focusOffset;
    }

    function updateEmptySelection(sel) {
        sel.anchorNode = sel.focusNode = null;
        sel.anchorOffset = sel.focusOffset = 0;
        sel.rangeCount = 0;
        sel.isCollapsed = true;
        sel._ranges.length = 0;
    }

    function getNativeRange(range) {
        var nativeRange;
        if (range instanceof DomRange) {
            nativeRange = range._selectionNativeRange;
            if (!nativeRange) {
                nativeRange = api.createNativeRange(dom.getDocument(range.startContainer));
                nativeRange.setEnd(range.endContainer, range.endOffset);
                nativeRange.setStart(range.startContainer, range.startOffset);
                range._selectionNativeRange = nativeRange;
                range.attachListener("detach", function() {

                    this._selectionNativeRange = null;
                });
            }
        } else if (range instanceof WrappedRange) {
            nativeRange = range.nativeRange;
        } else if (window.Range && (range instanceof Range)) {
            nativeRange = range;
        }
        return nativeRange;
    }

    function rangeContainsSingleElement(rangeNodes) {
        if (!rangeNodes.length || rangeNodes[0].nodeType != 1) {
            return false;
        }
        for (var i = 1, len = rangeNodes.length; i < len; ++i) {
            if (!dom.isAncestorOf(rangeNodes[0], rangeNodes[i])) {
                return false;
            }
        }
        return true;
    }

    function getSingleElementFromRange(range) {
        var nodes = range.getNodes();
        if (!rangeContainsSingleElement(nodes)) {
            throw new Error("getSingleElementFromRange: range " + range.inspect() + " did not consist of a single element");
        }
        return nodes[0];
    }

    function updateFromControlRange(sel) {
        // Update the wrapped selection based on what's now in the native selection
        sel._ranges.length = 0;
        if (sel.nativeSelection.type == "None") {
            updateEmptySelection(sel);
        } else {
            var controlRange = sel.nativeSelection.createRange();
            sel.rangeCount = controlRange.length;
            var range, doc = dom.getDocument(controlRange.item(0));
            for (var i = 0; i < sel.rangeCount; ++i) {
                range = api.createRange(doc);
                range.selectNode(controlRange.item(i));
                sel._ranges.push(range);
            }
            sel.isCollapsed = sel.rangeCount == 1 && sel._ranges[0].collapsed;
            updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], false);
        }
    }

    var getSelectionRangeAt;

    if (util.isHostMethod(testSelection,  "getRangeAt")) {
        getSelectionRangeAt = function(sel, index) {
            try {
                return sel.getRangeAt(index);
            } catch(ex) {
                return null;
            }
        };
    } else if (selectionHasAnchorAndFocus) {
        getSelectionRangeAt = function(sel) {
            var doc = dom.getDocument(sel.anchorNode);
            var range = api.createRange(doc);
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);

            // Handle the case when the selection was selected backwards (from the end to the start in the
            // document)
            if (range.collapsed !== this.isCollapsed) {
                range.setStart(sel.focusNode, sel.focusOffset);
                range.setEnd(sel.anchorNode, sel.anchorOffset);
            }

            return range;
        };
    }

    /**
     * @constructor
     */
    function WrappedSelection(selection) {
        this.nativeSelection = selection;
        this._ranges = [];
        this.refresh();
    }

    api.getSelection = function(win) {
        win = win || window;
        var sel = win[windowPropertyName];
        if (sel) {
            sel.nativeSelection = getSelection(win);
            sel.refresh();
        } else {
            sel = new WrappedSelection(getSelection(win));
            win[windowPropertyName] = sel;
        }
        return sel;
    };

    api.getIframeSelection = function(iframeEl) {
        return api.getSelection(dom.getIframeWindow(iframeEl));
    };

    var selProto = WrappedSelection.prototype;

    // Selecting a range
    if (selectionHasAnchorAndFocus && util.areHostMethods(testSelection, ["removeAllRanges", "addRange"])) {
        selProto.removeAllRanges = function() {
            this.nativeSelection.removeAllRanges();
            updateEmptySelection(this);
        };

        var addRangeBackwards = function(sel, range) {
            var doc = DomRange.getRangeDocument(range);
            var endRange = api.createRange(doc);
            endRange.collapseToPoint(range.endContainer, range.endOffset);
            sel.nativeSelection.addRange(getNativeRange(endRange));
            sel.nativeSelection.extend(range.startContainer, range.startOffset);
            sel.refresh();
        };

        if (selectionHasRangeCount) {
            selProto.addRange = function(range, backwards) {
                if (backwards && selectionHasExtend) {
                    addRangeBackwards(this, range);
                } else {
                    var previousRangeCount;
                    if (selectionSupportsMultipleRanges) {
                        previousRangeCount = this.rangeCount;
                    } else {
                        this.removeAllRanges();
                        previousRangeCount = 0;
                    }
                    this.nativeSelection.addRange(getNativeRange(range));

                    // Check whether adding the range was successful
                    this.rangeCount = this.nativeSelection.rangeCount;

                    if (this.rangeCount == previousRangeCount + 1) {
                        // The range was added successfully

                        // Check whether the range that we added to the selection is reflected in the last range extracted from
                        // the selection
                        if (api.config.checkSelectionRanges) {
                            var nativeRange = getSelectionRangeAt(this.nativeSelection, this.rangeCount - 1);
                            if (nativeRange && !DomRange.rangesEqual(nativeRange, range)) {
                                // Happens in WebKit with, for example, a selection placed at the start of a text node
                                range = new WrappedRange(nativeRange);
                            }
                        }
                        this._ranges[this.rangeCount - 1] = range;
                        updateAnchorAndFocusFromRange(this, range, selectionIsBackwards(this.nativeSelection));
                        this.isCollapsed = selectionIsCollapsed(this);
                    } else {
                        // The range was not added successfully. The simplest thing is to refresh
                        this.refresh();
                    }
                }
            };
        } else {
            selProto.addRange = function(range, backwards) {
                if (backwards && selectionHasExtend) {
                    addRangeBackwards(this, range);
                } else {
                    this.nativeSelection.addRange(getNativeRange(range));
                    this.refresh();
                }
            };
        }

        selProto.setRanges = function(ranges) {
            this.removeAllRanges();
            for (var i = 0, len = ranges.length; i < len; ++i) {
                this.addRange(ranges[i]);
            }
        };
    } else if (util.isHostMethod(testSelection, "empty") && util.isHostMethod(testRange, "select") &&
               selectionHasType && implementsControlRange) {

        selProto.removeAllRanges = function() {
            // Added try/catch as fix for issue #21
            try {
                this.nativeSelection.empty();

                // Check for empty() not working (issue 24)
                if (this.nativeSelection.type != "None") {
                    // Work around failure to empty a control selection by instead selecting a TextRange and then
                    // calling empty()
                    var doc;
                    if (this.anchorNode) {
                        doc = dom.getDocument(this.anchorNode)
                    } else if (this.nativeSelection.type == "Control") {
                        var controlRange = this.nativeSelection.createRange();
                        if (controlRange.length) {
                            doc = dom.getDocument(controlRange.item(0)).body.createTextRange();
                        }
                    }
                    if (doc) {
                        var textRange = doc.body.createTextRange();
                        textRange.select();
                        this.nativeSelection.empty();
                    }
                }
            } catch(ex) {}
            updateEmptySelection(this);
        };

        selProto.addRange = function(range) {
            if (this.nativeSelection.type == "Control") {
                var controlRange = this.nativeSelection.createRange();
                var rangeElement = getSingleElementFromRange(range);

                // Create a new ControlRange containing all the elements in the selected ControlRange plus the element
                // contained by the supplied range
                var doc = dom.getDocument(controlRange.item(0));
                var newControlRange = dom.getBody(doc).createControlRange();
                for (var i = 0, len = controlRange.length; i < len; ++i) {
                    newControlRange.add(controlRange.item(i));
                }
                try {
                    newControlRange.add(rangeElement);
                } catch (ex) {
                    throw new Error("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)");
                }
                newControlRange.select();

                // Update the wrapped selection based on what's now in the native selection
                updateFromControlRange(this);
            } else {
                WrappedRange.rangeToTextRange(range).select();
                this._ranges[0] = range;
                this.rangeCount = 1;
                this.isCollapsed = this._ranges[0].collapsed;
                updateAnchorAndFocusFromRange(this, range, false);
            }
        };

        selProto.setRanges = function(ranges) {
            this.removeAllRanges();
            var rangeCount = ranges.length;
            if (rangeCount > 1) {
                // Ensure that the selection becomes of type "Control"
                var doc = dom.getDocument(ranges[0].startContainer);
                var controlRange = dom.getBody(doc).createControlRange();
                for (var i = 0, el; i < rangeCount; ++i) {
                    el = getSingleElementFromRange(ranges[i]);
                    try {
                        controlRange.add(el);
                    } catch (ex) {
                        throw new Error("setRanges(): Element within the one of the specified Ranges could not be added to control selection (does it have layout?)");
                    }
                }
                controlRange.select();

                // Update the wrapped selection based on what's now in the native selection
                updateFromControlRange(this);
            } else if (rangeCount) {
                this.addRange(ranges[0]);
            }
        };
    } else {
        module.fail("No means of selecting a Range or TextRange was found");
        return false;
    }

    selProto.getRangeAt = function(index) {
        if (index < 0 || index >= this.rangeCount) {
            throw new DOMException("INDEX_SIZE_ERR");
        } else {
            return this._ranges[index];
        }
    };

    var refreshSelection;

    if (util.isHostMethod(testSelection, "getRangeAt") && typeof testSelection.rangeCount == "number") {
        refreshSelection = function(sel) {
            sel._ranges.length = sel.rangeCount = sel.nativeSelection.rangeCount;
            if (sel.rangeCount) {
                for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                    sel._ranges[i] = new api.WrappedRange(sel.nativeSelection.getRangeAt(i));
                }
                updateAnchorAndFocusFromRange(sel, sel._ranges[sel.rangeCount - 1], selectionIsBackwards(sel.nativeSelection));
                sel.isCollapsed = selectionIsCollapsed(sel);
            } else {
                updateEmptySelection(sel);
            }
        };
    } else if (selectionHasAnchorAndFocus && typeof testSelection.isCollapsed == BOOLEAN && typeof testRange.collapsed == BOOLEAN && api.features.implementsDomRange) {
        refreshSelection = function(sel) {
            var range, nativeSel = sel.nativeSelection;
            if (nativeSel.anchorNode) {
                range = getSelectionRangeAt(nativeSel, 0);
                sel._ranges = [range];
                sel.rangeCount = 1;
                updateAnchorAndFocusFromNativeSelection(sel);
                sel.isCollapsed = selectionIsCollapsed(sel);
            } else {
                updateEmptySelection(sel);
            }
        };
    } else if (util.isHostMethod(testSelection, "createRange") && api.features.implementsTextRange) {
        refreshSelection = function(sel) {
            var range = sel.nativeSelection.createRange(), wrappedRange;


            if (sel.nativeSelection.type == "Control") {
                updateFromControlRange(sel);
            } else if (range && typeof range.text != "undefined") {
                // Create a Range from the selected TextRange
                wrappedRange = new WrappedRange(range);
                sel._ranges = [wrappedRange];

                updateAnchorAndFocusFromRange(sel, wrappedRange, false);
                sel.rangeCount = 1;
                sel.isCollapsed = wrappedRange.collapsed;
            } else {
                updateEmptySelection(sel);
            }
        };
    } else {
        module.fail("No means of obtaining a Range or TextRange from the user's selection was found");
        return false;
    }

    selProto.refresh = function(checkForChanges) {
        var oldRanges = checkForChanges ? this._ranges.slice(0) : null;
        refreshSelection(this);
        if (checkForChanges) {
            var i = oldRanges.length;
            if (i != this._ranges.length) {
                return false;
            }
            while (i--) {
                if (!DomRange.rangesEqual(oldRanges[i], this._ranges[i])) {
                    return false;
                }
            }
            return true;
        }
    };

    // Removal of a single range
    var removeRangeManually = function(sel, range) {
        var ranges = sel.getAllRanges(), removed = false;
        //console.log("removeRangeManually with " + ranges.length + " ranges (rangeCount " + sel.rangeCount);
        sel.removeAllRanges();
        for (var i = 0, len = ranges.length; i < len; ++i) {
            if (removed || range !== ranges[i]) {
                sel.addRange(ranges[i]);
            } else {
                // According to the HTML 5 spec, the same range may be added to the selection multiple times.
                // removeRange should only remove the first instance, so the following ensures only the first
                // instance is removed
                removed = true;
            }
        }
        if (!sel.rangeCount) {
            updateEmptySelection(sel);
        }
        //console.log("removeRangeManually finished with rangeCount " + sel.rangeCount);
    };

    if (selectionHasType && implementsControlRange) {
        selProto.removeRange = function(range) {
            if (this.nativeSelection.type == "Control") {
                var controlRange = this.nativeSelection.createRange();
                var rangeElement = getSingleElementFromRange(range);

                // Create a new ControlRange containing all the elements in the selected ControlRange minus the
                // element contained by the supplied range
                var doc = dom.getDocument(controlRange.item(0));
                var newControlRange = dom.getBody(doc).createControlRange();
                var el, removed = false;
                for (var i = 0, len = controlRange.length; i < len; ++i) {
                    el = controlRange.item(i);
                    if (el !== rangeElement || removed) {
                        newControlRange.add(controlRange.item(i));
                    } else {
                        removed = true;
                    }
                }
                newControlRange.select();

                // Update the wrapped selection based on what's now in the native selection
                updateFromControlRange(this);
            } else {
                removeRangeManually(this, range);
            }
        };
    } else {
        selProto.removeRange = function(range) {
            removeRangeManually(this, range);
        };
    }

    // Detecting if a selection is backwards
    var selectionIsBackwards;
    if (selectionHasAnchorAndFocus && api.features.implementsDomRange) {
        selectionIsBackwards = function(sel) {
            var backwards = false;
            if (sel.anchorNode) {
                backwards = (dom.comparePoints(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset) == 1);
            }
            return backwards;
        };

        selProto.isBackwards = function() {
            return selectionIsBackwards(this);
        };
    } else {
        selectionIsBackwards = selProto.isBackwards = function() {
            return false;
        };
    }

    // Selection text
    // This is conformant to the HTML 5 draft spec but differs from WebKit and Mozilla's implementation
    selProto.toString = function() {

        var rangeTexts = [];
        for (var i = 0, len = this.rangeCount; i < len; ++i) {
            rangeTexts[i] = "" + this._ranges[i];
        }
        return rangeTexts.join("");
    };

    function assertNodeInSameDocument(sel, node) {
        if (sel.anchorNode && (dom.getDocument(sel.anchorNode) !== dom.getDocument(node))) {
            throw new DOMException("WRONG_DOCUMENT_ERR");
        }
    }

    // No current browsers conform fully to the HTML 5 draft spec for this method, so Rangy's own method is always used
    selProto.collapse = function(node, offset) {
        assertNodeInSameDocument(this, node);
        var range = api.createRange(dom.getDocument(node));
        range.collapseToPoint(node, offset);
        this.removeAllRanges();
        this.addRange(range);
        this.isCollapsed = true;
    };

    selProto.collapseToStart = function() {
        if (this.rangeCount) {
            var range = this._ranges[0];
            this.collapse(range.startContainer, range.startOffset);
        } else {
            throw new DOMException("INVALID_STATE_ERR");
        }
    };

    selProto.collapseToEnd = function() {
        if (this.rangeCount) {
            var range = this._ranges[this.rangeCount - 1];
            this.collapse(range.endContainer, range.endOffset);
        } else {
            throw new DOMException("INVALID_STATE_ERR");
        }
    };

    // The HTML 5 spec is very specific on how selectAllChildren should be implemented so the native implementation is
    // never used by Rangy.
    selProto.selectAllChildren = function(node) {
        assertNodeInSameDocument(this, node);
        var range = api.createRange(dom.getDocument(node));
        range.selectNodeContents(node);
        this.removeAllRanges();
        this.addRange(range);
    };

    selProto.deleteFromDocument = function() {
        if (this.rangeCount) {
            var ranges = this.getAllRanges();
            this.removeAllRanges();
            for (var i = 0, len = ranges.length; i < len; ++i) {
                ranges[i].deleteContents();
            }
            // The HTML5 spec says nothing about what the selection should contain after calling deleteContents on each
            // range. Firefox moves the selection to where the final selected range was, so we emulate that
            this.addRange(ranges[len - 1]);
        }
    };

    // The following are non-standard extensions
    selProto.getAllRanges = function() {
        return this._ranges.slice(0);
    };

    selProto.setSingleRange = function(range) {
        this.setRanges( [range] );
    };

    selProto.containsNode = function(node, allowPartial) {
        for (var i = 0, len = this._ranges.length; i < len; ++i) {
            if (this._ranges[i].containsNode(node, allowPartial)) {
                return true;
            }
        }
        return false;
    };

    function inspect(sel) {
        var rangeInspects = [];
        var anchor = new DomPosition(sel.anchorNode, sel.anchorOffset);
        var focus = new DomPosition(sel.focusNode, sel.focusOffset);
        var name = (typeof sel.getName == "function") ? sel.getName() : "Selection";

        if (typeof sel.rangeCount != "undefined") {
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                rangeInspects[i] = DomRange.inspect(sel.getRangeAt(i));
            }
        }
        return "[" + name + "(Ranges: " + rangeInspects.join(", ") +
                ")(anchor: " + anchor.inspect() + ", focus: " + focus.inspect() + "]";

    }

    selProto.getName = function() {
        return "WrappedSelection";
    };

    selProto.inspect = function() {
        return inspect(this);
    };

    selProto.detach = function() {
        if (this.anchorNode) {
            dom.getWindow(this.anchorNode)[windowPropertyName] = null;
        }
    };

    WrappedSelection.inspect = inspect;

    api.Selection = WrappedSelection;

    api.addCreateMissingNativeApiListener(function(win) {
        if (typeof win.getSelection == "undefined") {
            win.getSelection = function() {
                return api.getSelection(this);
            };
        }
        win = null;
    });
});
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
var wysihtml5 = {
  version:  "0.1.0",
  
  commands: {},
  quirks:   {},
  toolbar:  {},
  utils:    {},
  views:    {}
};/**
 * Detect browser support for specific features
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 */
wysihtml5.browserSupports = {
  TEST_ELEMENT: document.createElement("div"),
  
  // Static variable needed, publicly accessible, to be able override it in unit tests
  USER_AGENT: navigator.userAgent,
  
  /**
   * Exclude browsers that are not capable of displaying and handling
   * contentEditable as desired:
   *    - iPhone, iPad (tested iOS 4.2.2) and Android (tested 2.2) refuse to make contentEditables focusable
   *    - IE < 8 create invalid markup and crash randomly from time to time
   *
   * @return {Boolean}
   */
  contentEditable: function() {
    var userAgent                   = this.USER_AGENT.toLowerCase(),
        // Essential for making html elements editable
        hasContentEditableSupport   = "contentEditable" in this.TEST_ELEMENT,
        // Following methods are needed in order to interact with the contentEditable area
        hasEditingApiSupport        = document.execCommand && document.queryCommandSupported && document.queryCommandState,
        // document selector apis are only supported by IE 8+, Safari 4+, Chrome and Firefox 3.5+
        hasQuerySelectorSupport     = document.querySelector && document.querySelectorAll,
        // contentEditable is unusable in mobile browsers (tested iOS 4.2.2, Android 2.2, Opera Mobile)
        isIncompatibleMobileBrowser = (userAgent.include("webkit") && userAgent.include("mobile")) || userAgent.include("opera mobi");
    
    return hasContentEditableSupport
      && hasEditingApiSupport
      && hasQuerySelectorSupport
      && !isIncompatibleMobileBrowser;
  },
  
  /**
   * Whether the browser supports sandboxed iframes
   * Currently only IE 6+ offers such feature <iframe security="restricted">
   *
   * http://msdn.microsoft.com/en-us/library/ms534622(v=vs.85).aspx
   * http://blogs.msdn.com/b/ie/archive/2008/01/18/using-frames-more-securely.aspx
   *
   * HTML5 sandboxed iframes are still buggy and their DOM is not reachable from the outside (except when using postMessage)
   */
  sandboxedIframes: function() {
    return Prototype.Browser.IE;
  },
  
  /**
   * IE6+7 throw a mixed content warning when the src of an iframe
   * is empty/unset or about:blank
   * window.querySelector is implemented as of IE8
   */
  emptyIframeSrcInHttpsContext: function() {
    return "querySelector" in document;
  },
  
  /**
   * Whether the caret is correctly displayed in contentEditable elements
   * Firefox sometimes shows a huge caret in the beginning after focusing
   */
  caretInEmptyContentEditableCorrectly: function() {
    return !Prototype.Browser.Gecko;
  },
  
  /**
   * Opera and IE are the only browsers who offer the css value
   * in the original unit, thx to the currentStyle object
   * All other browsers provide the computed style in px via window.getComputedStyle
   */
  computedStyleInPercent: function() {
    return "currentStyle" in this.TEST_ELEMENT;
  },
  
  /**
   * Whether the browser inserts a <br> when pressing enter in a contentEditable element
   */
  lineBreaksOnReturn: function() {
    return Prototype.Browser.Gecko;
  },
  
  placeholderOn: function(element) {
    return "placeholder" in element;
  },
  
  event: function(eventName) {
    var element = this.TEST_ELEMENT;
    return "on" + eventName in element || (function() {
      element.setAttribute("on" + eventName, "return;");
      return typeof(element["on" + eventName]) === "function";
    })();
  },
  
  /**
   * Opera doesn't correctly fire focus/blur events when clicking in- and outside of iframe
   */
  eventsInIframeCorrectly: function() {
    return !Prototype.Browser.Opera;
  },
  
  /**
   * Chrome & Safari only fire the ondrop/ondragend/... events when the ondragover event is cancelled
   * with event.preventDefault
   * Firefox 3.6 fires those events anyway, but the mozilla doc says that the dragover/dragenter event needs
   * to be cancelled
   */
  onDropOnlyWhenOnDragOverIsCancelled: function() {
    return Prototype.Browser.WebKit || Prototype.Browser.Gecko;
  },
  
  htmlDataTransfer: function() {
    try {
      // Firefox doesn't support dataTransfer in a safe way, it doesn't strip script code in the html payload (like Chrome does)
      return Prototype.Browser.WebKit && (window.Clipboard || window.DataTransfer).prototype.getData;
    } catch(e) {
      return false;
    }
  },
  
  /**
   * Everything below IE9 doesn't know how to treat HTML5 tags
   *
   * @param {Object} context The document object on which to check HTML5 support
   *
   * @example
   *    wysihtml5.browserSupports.html5Tags(document);
   */
  html5Tags: function(context) {
    var element = context.createElement("div"),
        html5   = "<article>foo</article>";
    element.innerHTML = html5;
    return element.innerHTML.toLowerCase() === html5;
  },
  
  /**
   * Checks whether a document supports a certain queryCommand
   * In particular, Opera needs a reference to a document that has a contentEditable in it's dom tree
   * in oder to report correct results
   *
   * @param {Object} doc Document object on which to check for a query command
   * @param {String} command The query command to check for
   * @return {Boolean}
   *
   * @example
   *    wysihtml5.browserSupports.command(document, "bold");
   */
  command: (function() {
    // Following commands are supported but contain bugs in some browsers
    var buggyCommands = {
      // formatBlock fails with some tags (eg. <blockquote>)
      "formatBlock":          Prototype.Browser.IE,
       // When inserting unordered or ordered lists in Firefox, Chrome or Safari, the current selection or line gets
       // converted into a list (<ul><li>...</li></ul>, <ol><li>...</li></ol>)
       // IE and Opera act a bit different here as they convert the entire content of the current block element into a list
      "insertUnorderedList":  Prototype.Browser.IE || Prototype.Browser.Opera,
      "insertOrderedList":    Prototype.Browser.IE || Prototype.Browser.Opera
    };
    
    return function(doc, command) {
      var isBuggy = buggyCommands[command];
      if (isBuggy) {
        return false;
      } else {
        // Firefox throws errors when invoking queryCommandSupported or queryCommandEnabled
        return Try.these(
          function() { return doc.queryCommandSupported(command); },
          function() { return doc.queryCommandEnabled(command); }
        ) || false;
      }
    };
  })(),
  
  /**
   * IE: URLs starting with:
   *    www., http://, https://, ftp://, gopher://, mailto:, new:, snews:, telnet:, wasis:, file://,
   *    nntp://, newsrc:, ldap://, ldaps://, outlook:, mic:// and url: 
   * will automatically be auto-linked when either the user inserts them via copy&paste or presses the
   * space bar when the caret is directly after such an url.
   * This behavior cannot easily be avoided in IE < 9 since the logic is hardcoded in the mshtml.dll
   * (related blog post on msdn
   * http://blogs.msdn.com/b/ieinternals/archive/2009/09/17/prevent-automatic-hyperlinking-in-contenteditable-html.aspx).
   */
  autoLinkingInContentEditable: function() {
    return Prototype.Browser.IE;
  },
  
  /**
   * As stated above, IE auto links urls typed into contentEditable elements
   * Since IE9 it's possible to prevent this behavior
   */
  disablingOfAutoLinking: function() {
    return this.command(document, "AutoUrlDetect");
  },
  
  /**
   * IE leaves an empty paragraph in the contentEditable element after clearing it
   * Chrome/Safari sometimes an empty <div>
   */
  clearingOfContentEditableCorrectly: function() {
    return Prototype.Browser.Gecko || Prototype.Browser.Opera || Prototype.Browser.WebKit;
  },
  
  /**
   * IE gives wrong results for getAttribute
   */
  getAttributeCorrectly: function() {
    var td = document.createElement("td");
    return td.getAttribute("rowspan") != "1";
  },
  
  /**
   * When clicking on images in IE, Opera and Firefox, they are selected, which makes it easy to interact with them.
   * Chrome and Safari both don't support this
   */
  selectingOfImagesInContentEditableOnClick: function() {
    return Prototype.Browser.Gecko || Prototype.Browser.IE || Prototype.Browser.Opera;
  },
  
  /**
   * When the caret is in an empty list (<ul><li>|</li></ul>) which is the first child in an contentEditable container
   * pressing backspace doesn't remove the entire list as done in other browsers
   */
  clearingOfListsInContentEditableCorrectly: function() {
    return Prototype.Browser.IE || Prototype.Browser.WebKit || Prototype.Browser.Gecko;
  },
  
  /**
   * All browsers except Safari and Chrome automatically scroll the range/caret position into view
   */
  autoScrollIntoViewOfCaret: function() {
    return !Prototype.Browser.WebKit;
  },
  
  /**
   * Check whether the browser automatically closes tags that don't need to be opened
   */
  closingOfUnclosedTags: function() {
    var testElement = this.TEST_ELEMENT.cloneNode(false),
        returnValue,
        innerHTML;
    
    testElement.innerHTML = "<p><div></div>";
    innerHTML             = testElement.innerHTML.toLowerCase();
    returnValue           = innerHTML === "<p></p><div></div>" || innerHTML === "<p><div></div></p>";
    
    // Cache result by overwriting current function
    this.closingOfUnclosedTags = function() { return returnValue; };
    
    return returnValue;
  },
  
  /**
   * Whether the browser supports the native document.getElementsByClassName which returns live NodeLists
   */
  getElementsByClassName: function() {
    return String(document.getElementsByClassName).indexOf("[native code]") !== -1;
  },
  
  /**
   * As of now (19.04.2011) only supported by Firefox 4 and Chrome
   * See https://developer.mozilla.org/en/DOM/Selection/modify
   */
  selectionModify: function() {
    return ("getSelection" in window) && ("modify" in window.getSelection());
  }
};/**
 * Simulate HTML5 autofocus
 * Needed since div[contentEditable] elements don't support it
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} element The element which should be focussed
 * @example
 *    wysihtml5.utils.autoFocus(element);
 */
wysihtml5.utils.autoFocus = function(element) {
  if (document.loaded) {
    setTimeout(function() { element.focus(); }, 0);
  } else {
    document.observe("dom:loaded", function() { element.focus(); });
  }
};
/**
 * Find urls in descendant text nodes of an element and auto link them
 * Inspired by http://james.padolsey.com/javascript/find-and-replace-text-with-javascript/
 *
 * @param {Element} element Container element in which to search for urls
 * @author Christopher Blum <christopher.blum@xing.com>
 * @example
 *    <div id="text-container">Please click here: www.google.com</div>
 *    <script>wysihtml5.utils.autoLink($("text-container"));</script>
 */
wysihtml5.utils.autoLink = (function() {
  var TEXT_NODE             = 3,
      /**
       * Don't auto-link urls that are contained in the following elements:
       */
      IGNORE_URLS_IN        = ["CODE", "PRE", "A", "SCRIPT", "HEAD", "TITLE", "STYLE"],
      /**
       * revision 1:
       *    /(\S+\.{1}[^\s\,\.\!]+)/g
       *
       * revision 2:
       *    /(\b(((https?|ftp):\/\/)|(www\.))[-A-Z0-9+&@#\/%?=~_|!:,.;\[\]]*[-A-Z0-9+&@#\/%=~_|])/gim
       *
       * put this in the beginning if you don't wan't to match within a word
       *    (^|[\>\(\{\[\s\>])
       */
      URL_REG_EXP           = /((https?:\/\/|www\.)[^\s<]{3,})/gi,
      TRAILING_CHAR_REG_EXP = /([^\w\/\-](,?))$/i,
      MAX_DISPLAY_LENGTH    = 100,
      BRACKETS              = { ")": "(", "]": "[", "}": "{" },
      TEMP_ELEMENTS_CACHE   = {};
  
  function autoLink(element) {
    if (_hasParentThatShouldBeIgnored(element)) {
      return element;
    }

    if (element == element.ownerDocument.documentElement) {
      element = element.ownerDocument.body;
    }

    return _parseNode(element);
  };
  
  /**
   * This is basically a rebuild of
   * the rails auto_link_urls text helper
   */
  function _convertUrlsToLinks(str) {
    return str.replace(URL_REG_EXP, function(match, url) {
      var punctuation = (url.match(TRAILING_CHAR_REG_EXP) || [])[1] || "",
          opening     = BRACKETS[punctuation];
      url = url.replace(TRAILING_CHAR_REG_EXP, "");

      if (url.split(opening).length > url.split(punctuation).length) {
        url = url + punctuation;
        punctuation = "";
      }
      var realUrl    = url,
          displayUrl = url.truncate(MAX_DISPLAY_LENGTH);
      // Add http prefix if necessary
      if (realUrl.substr(0, 4) === "www.") {
        realUrl = "http://" + realUrl;
      }
      
      return '<a href="' + realUrl + '">' + displayUrl + '</a>' + punctuation;
    });
  }
  
  /**
   * Creates or (if already cached) returns a temp element
   * for the given document object
   */
  function _getTempElement(context) {
    var tempElement = TEMP_ELEMENTS_CACHE[context];
    if (!tempElement || tempElement.ownerDocument != context) {
      TEMP_ELEMENTS_CACHE[context] = tempElement = context.createElement("div");
    }
    return tempElement;
  }
  
  /**
   * Replaces the original text nodes with the newly auto-linked dom tree
   */
  function _wrapMatchesInNode(textNode) {
    var parentNode  = textNode.parentNode,
        tempElement = _getTempElement(parentNode.ownerDocument);
    
    // We need to insert an empty/temporary <span /> to fix IE quirks
    // Elsewise IE would strip white space in the beginning
    tempElement.innerHTML = "<span></span>" + _convertUrlsToLinks(textNode.data);
    tempElement.removeChild(tempElement.firstChild);
    
    while (tempElement.firstChild) {
      // inserts tempElement.firstChild before textNode
      parentNode.insertBefore(tempElement.firstChild, textNode);
    }
    parentNode.removeChild(textNode);
  }
  
  function _hasParentThatShouldBeIgnored(node) {
    var nodeName;
    while (node.parentNode) {
      node = node.parentNode;
      nodeName = node.nodeName;
      if (IGNORE_URLS_IN.include(nodeName)) {
        return true;
      } else if (nodeName == "body") {
        return false;
      }
    }
    return false;
  }
  
  function _parseNode(element) {
    if (IGNORE_URLS_IN.include(element.nodeName)) {
      return;
    }
    
    if (element.nodeType === TEXT_NODE && element.data.match(URL_REG_EXP)) {
      _wrapMatchesInNode(element);
      return;
    }
    
    var childNodes        = $A(element.childNodes),
        childNodesLength  = childNodes.length,
        i                 = 0;
    
    for (; i<childNodesLength; i++) {
      _parseNode(childNodes[i]);
    }
    
    return element;
  }
  
  // Reveal url reg exp to the outside
  autoLink.URL_REG_EXP = URL_REG_EXP;
  
  return autoLink;
})();wysihtml5.utils.caret = {
  PLACEHOLDER_TEXT: "--|CARET|--",
  
  /**
   * Get the current selection as a bookmark to be able to later restore it
   *
   * @param {Object} doc Document object of the context
   * @return {Object} An object that represents the current selection
   */
  getBookmark: function(doc) {
    var range = this.getRange(doc);
    return range && range.cloneRange();
  },
  
  /**
   * Restore a selection retrieved via wysihtml5.utils.caret.getBookmark
   *
   * @param {Object} bookmark An object that represents the current selection
   */
  setBookmark: function(bookmark) {
    if (!bookmark) {
      return;
    }
    
    this.setSelection(bookmark);
  },
  
  /**
   * Check whether the current selection contains a given node
   * @param {Object} node The node to check for
   * @return {Boolean}
   * @example
   */
  containsNode: function(node) {
    var range = this.getRange(node.ownerDocument);
    if (range) {
      return range.containsNode(node);
    } else {
      return false;
    }
  },
  
  /**
   * Set the caret in front of the given node
   *
   * @param {Object} node The element or text node where to position the caret in front of
   * @example
   *    wysihtml5.utils.caret.setBefore(myElement);
   */
  setBefore: function(node) {
    var range = rangy.createRange(node.ownerDocument);
    range.setStartBefore(node);
    range.setEndBefore(node);
    return this.setSelection(range);
  },
  
  /**
   * Set the caret after the given node
   *
   * @param {Object} node The element or text node where to position the caret in front of
   * @example
   *    wysihtml5.utils.caret.setBefore(myElement);
   */
  setAfter: function(node) {
    var range = rangy.createRange(node.ownerDocument);
    range.setStartAfter(node);
    range.setEndAfter(node);
    return this.setSelection(range);
  },
  
  /**
   * Ability to select/mark nodes
   *
   * @param {Element} node The node/element to select
   * @example
   *    wysihtml5.utils.caret.selectNode(document.getElementById("my-image"));
   */
  selectNode: function(node) {
    var range           = rangy.createRange(node.ownerDocument),
        isElement       = node.nodeType === Node.ELEMENT_NODE,
        canHaveHTML     = "canHaveHTML" in node ? node.canHaveHTML : (node.nodeName !== "IMG"),
        content         = isElement ? node.innerHTML : node.data,
        isEmpty         = (content === "" || content === "\uFEFF"),
        displayStyle    = wysihtml5.utils.getStyle(node, "display"),
        isBlockElement  = (displayStyle === "block" || displayStyle === "list-item");
    
    if (isEmpty && isElement && canHaveHTML) {
      // Make sure that caret is visible in node by inserted a zero width no breaking space
      try { node.innerHTML = "\uFEFF"; } catch(e) {}
    }
    
    if (canHaveHTML) {
      range.selectNodeContents(node);
    } else {
      range.selectNode(node);
    }
    
    if (canHaveHTML && isEmpty && isElement) {
      range.collapse(isBlockElement);
    } else if (canHaveHTML && isEmpty) {
      range.setStartAfter(node);
      range.setEndAfter(node);
    }
    
    this.setSelection(range);
  },
  
  /**
   * Get the node which contains the selection
   *
   * @param {Object} document Document object of the context where to select
   * @param {Boolean} [controlRange] (only IE) Whether it should return the selected ControlRange element when the selection type is a "ControlRange"
   * @return {Object} The node that contains the caret
   * @example
   *    var nodeThatContainsCaret = wysihtml5.utils.caret.getSelectedNode(document);
   */
  getSelectedNode: function(doc, controlRange) {
    var selection,
        range;
    
    if (controlRange && doc.selection && doc.selection.type === "Control") {
      range = doc.selection.createRange();
      if (range && range.length) {
        return range.item(0);
      }
    }
    
    selection = this.getSelection(doc);
    if (selection.focusNode === selection.anchorNode) {
      return selection.focusNode;
    } else {
      range = this.getRange(doc);
      return range ? range.commonAncestorContainer : doc.body;
    }
  },
  
  executeAndRestore: function(doc, method, restoreScrollPosition) {
    if (!window.getSelection) {
      return this.executeAndRestoreSimple(doc, method);
    }
    
    var body                = doc.body,
        oldScrollTop        = body.scrollTop,
        oldScrollLeft       = body.scrollLeft,
        range               = this.getRange(doc),
        caretPlaceholder    = this._getPlaceholderElement(doc),
        newCaretPlaceholder,
        newRange;
    
    // Nothing selected, execute and say goodbye
    if (!range) {
      method(body, body);
      return;
    }
    
    range.insertNode(caretPlaceholder);
    
    // Make sure that a potential error doesn't cause our placeholder element to be left as a placeholder
    try {
      method(range.startContainer, range.endContainer);
    } catch(e1) {
      setTimeout(function() { throw e1; }, 0);
    }
    
    // range.detach();
    
    newCaretPlaceholder = this._findPlaceholderElement(doc);
    
    if (newCaretPlaceholder) {
      newRange = rangy.createRange(doc);
      newRange.selectNode(newCaretPlaceholder);
      newRange.deleteContents();
      this.setSelection(newRange);
    }
    
    if (restoreScrollPosition) {
      body.scrollTop  = oldScrollTop;
      body.scrollLeft = oldScrollLeft;
    }
    
    // Remove it again, just to make sure that the placeholder is definitely out of the dom tree
    try {
      newCaretPlaceholder.parentNode.removeChild(newCaretPlaceholder);
    } catch(e2) {}
  },
  
  /**
   * Different approach of preserving the selection (doesn't modify the dom)
   * Takes all text nodes in the selection and saves the selection position in the first and last one
   */
  executeAndRestoreSimple: function(doc, method) {
    var range = this.getRange(doc),
        newRange,
        firstNode,
        lastNode,
        textNodes,
        rangeBackup;
    
    // Nothing selected, execute and say goodbye
    if (!range) {
      method(doc.body, doc.body);
      return;
    }
    
    textNodes = range.getNodes([3]);
    firstNode = textNodes[0] || range.startContainer;
    lastNode  = textNodes[textNodes.length - 1] || range.endContainer;
    
    rangeBackup = {
      collapsed:      range.collapsed,
      startContainer: firstNode,
      startOffset:    firstNode === range.startContainer ? range.startOffset : 0,
      endContainer:   lastNode,
      endOffset:      lastNode === range.endContainer ? range.endOffset : lastNode.length
    };
    
    try {
      method(range.startContainer, range.endContainer);
    } catch(e) {
      setTimeout(function() { throw e; }, 0);
    }
    
    newRange = rangy.createRange(doc);
    try { newRange.setStart(rangeBackup.startContainer, rangeBackup.startOffset); } catch(e1) {}
    try { newRange.setEnd(rangeBackup.endContainer, rangeBackup.endOffset); } catch(e2) {}
    try { this.setSelection(newRange); } catch(e3) {}
  },
  
  /**
   * Insert html at the caret position and move the cursor after the inserted html
   *
   * @param {Object} doc Document object of the context where to insert the html
   * @param {String} html HTML string to insert
   * @example
   *    wysihtml5.utils.caret.insertHTML(document, "<p>foobar</p>");
   */
  insertHTML: function(doc, html) {
    var range     = rangy.createRange(doc),
        node      = range.createContextualFragment(html),
        lastChild = node.lastChild;
    this.insertNode(node);
    if (lastChild) {
      this.setAfter(lastChild);
    }
  },
  
  /**
   * Insert a node at the caret position and move the cursor after it
   *
   * @param {Object} node HTML string to insert
   * @example
   *    wysihtml5.utils.caret.insertNode(document.createTextNode("foobar"));
   */
  insertNode: function(node) {
    var range = this.getRange(node.ownerDocument);
    if (range) {
      range.insertNode(node);
    } else {
      return false;
    }
  },
  
  /**
   * Wraps current selection with the given node
   *
   * @param {Object} node The node to surround the selected elements with
   */
  surround: function(node) {
    var range = this.getRange(node.ownerDocument);
    if (!range) {
      return;
    }
    
    try {
      // This only works when the range boundaries are not overlapping other elements
      range.surroundContents(node);
      this.selectNode(node);
    } catch(e) {
      // fallback
      node.appendChild(range.extractContents());
      range.insertNode(node);
    }
  },
  
  /**
   * Scroll the current caret position into the view
   * FIXME: This is a bit hacky, there might be a smarter way of doing this
   *
   * @param {Object} element A scrollable element in which the caret is currently positioned
   * @example
   *    wysihtml5.utils.caret.scrollIntoView(element);
   */
  scrollIntoView: function(element) {
    var doc           = element.ownerDocument,
        hasScrollBars = doc.documentElement.scrollHeight > doc.documentElement.offsetHeight,
        tempElement   = doc._wysihtml5ScrollIntoViewElement = doc._wysihtml5ScrollIntoViewElement || (function() {
          var element = doc.createElement("span");
          // The element needs content in order to be able to calculate it's position properly
          element.innerHTML = "\uFEFF";
          return element;
        })(),
        offsetTop;
    
    if (hasScrollBars) {
      this.insertNode(tempElement);
      offsetTop = Element.cumulativeOffset(tempElement).top;
      tempElement.parentNode.removeChild(tempElement);
      if (offsetTop > element.scrollTop) {
        element.scrollTop = offsetTop;
      }
    }
  },
  
  /**
   * Select line where the caret is in
   */
  selectLine: function(doc) {
    if (wysihtml5.browserSupports.selectionModify()) {
      this._selectLine_W3C(doc);
    } else if (doc.selection) {
      this._selectLine_MSIE(doc);
    }
  },
  
  /**
   * See https://developer.mozilla.org/en/DOM/Selection/modify
   */
  _selectLine_W3C: function(doc) {
    var win = doc.defaultView,
        selection = win.getSelection();
    selection.modify("extend", "left", "lineboundary");
    selection.modify("extend", "right", "lineboundary");
  },
  
  _selectLine_MSIE: function(doc) {
    var range       = doc.selection.createRange(),
        rangeTop    = range.boundingTop,
        rangeHeight = range.boundingHeight,
        scrollWidth = doc.body.scrollWidth,
        rangeBottom,
        rangeEnd,
        measureNode,
        i,
        j;

    if (!range.moveToPoint) {
      return;
    }

    if (rangeTop === 0) {
      // Don't know why, but when the selection ends at the end of a line
      // range.boundingTop is 0
      measureNode = doc.createElement("span");
      wysihtml5.utils.caret.insertNode(measureNode);
      rangeTop = measureNode.offsetTop;
      measureNode.parentNode.removeChild(measureNode);
    }
    
    rangeTop += 1;
    
    for (i=-10; i<scrollWidth; i+=2) {
      try {
        range.moveToPoint(i, rangeTop);
        break;
      } catch(e1) {}
    }
    
    // Investigate the following in order to handle multi line selections
    // rangeBottom = rangeTop + (rangeHeight ? (rangeHeight - 1) : 0);
    rangeBottom = rangeTop;
    rangeEnd = doc.selection.createRange();
    for (j=scrollWidth; j>=0; j--) {
      try {
        rangeEnd.moveToPoint(j, rangeBottom);
        break;
      } catch(e2) {}
    }

    range.setEndPoint("EndToEnd", rangeEnd);
    range.select();
  },
  
  getText: function(doc) {
    var selection = this.getSelection(doc);
    return selection ? selection.toString() : "";
  },
  
  getNodes: function(doc, nodeType, filter) {
    var range = this.getRange(doc);
    if (range) {
      return range.getNodes([nodeType], filter);
    } else {
      return [];
    }
  },
  
  getRange: function(doc) {
    var selection = this.getSelection(doc);
    return selection && selection.rangeCount && selection.getRangeAt(0);
  },
  
  getSelection: function(doc) {
    return rangy.getSelection(doc.defaultView || doc.parentWindow);
  },
  
  setSelection: function(range) {
    var doc       = (range.startContainer || range.endContainer).ownerDocument,
        win       = doc.defaultView || doc.parentWindow,
        selection = rangy.getSelection(win);
    return selection.setSingleRange(range);
  },
  
  // ----------------- private -------------- \\
  _getPlaceholderElement: (function() {
    var id = "_wysihtml5-placeholder" + new Date().getTime();
    return function(doc) {
      // Important: placeholder element needs to be an inline element
      // otherwise chrome will cause trouble when interacting with the text
      var element       = doc._wysihtml5CaretPlaceholder = doc._wysihtml5CaretPlaceholder || doc.createElement("span");
      element.id        = id;
      element.innerHTML = this.PLACEHOLDER_TEXT;
      return element;
    };
  })(),
  
  _findPlaceholderElement: function(doc) {
    var placeholderElement      = this._getPlaceholderElement(doc),
        // Using placeholderElement.innerHTML causes problems in firefox who sometimes mangles the innerHTML
        placeholderElementText  = wysihtml5.utils.getTextContent(placeholderElement),
        placeholderElementById  = doc.getElementById(placeholderElement.id),
        i                       = 0,
        element,
        elements,
        elementsLength;
    if (wysihtml5.utils.contains(doc.body, placeholderElement)) {
      return placeholderElement;
    } else if (placeholderElementById) {
      return placeholderElementById;
    } else {
      elements = doc.getElementsByTagName("*");
      elementsLength = elements.length;
      for (; i<elementsLength; i++) {
        element = elements[i];
        if (element.innerHTML === placeholderElementText) {
          return element;
        }
      }
      return null;
    }
  }
};wysihtml5.utils.contains = (function() {
  var documentElement = document.documentElement;
  if (documentElement.contains) {
    return function(container, element) {
      if (element.nodeType !== Node.ELEMENT_NODE) {
        element = element.parentNode;
      }
      return container !== element && container.contains(element);
    };
  } else if (documentElement.compareDocumentPosition) {
    return function(container, element) {
      // https://developer.mozilla.org/en/DOM/Node.compareDocumentPosition
      return !!(container.compareDocumentPosition(element) & 16);
    };
  }
})();/**
 * Converts an HTML fragment/element into a unordered/ordered list
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} element The element which should be turned into a list
 * @param {String} listType The list type in which to convert the tree (either "ul" or "ol")
 * @return {Element} The created list
 *
 * @example
 *    <!-- Assume the following dom: -->
 *    <span id="pseudo-list">
 *      eminem<br>
 *      dr. dre
 *      <div>50 Cent</div>
 *    </span>
 *
 *    <script>
 *      wysihtml5.utils.convertIntoList(document.getElementById("pseudo-list"), "ul");
 *    </script>
 *
 *    <!-- Will result in: -->
 *    <ul>
 *      <li>eminem</li>
 *      <li>dr. dre</li>
 *      <li>50 Cent</li>
 *    </ul>
 */
wysihtml5.utils.convertIntoList = (function() {
  function _createListItem(doc, list) {
    var listItem = doc.createElement("li");
    list.appendChild(listItem);
    return listItem;
  }
  
  function _createList(doc, type) {
    return doc.createElement(type);
  }
  
  function convertIntoList(element, listType) {
    if (element.nodeName === "UL" || element.nodeName === "OL" || element.nodeName === "MENU") {
      // Already a list
      return element;
    }
    
    var doc               = element.ownerDocument,
        list              = _createList(doc, listType),
        childNodes        = $A(element.childNodes),
        childNodesLength  = childNodes.length,
        childNode,
        isBlockElement,
        isLineBreak,
        currentListItem,
        i                 = 0;
    for (; i<childNodesLength; i++) {
      currentListItem = currentListItem || _createListItem(doc, list);
      childNode       = childNodes[i];
      isBlockElement  = wysihtml5.utils.getStyle(childNode, "display") === "block";
      isLineBreak     = childNode.nodeName === "BR";
      
      if (isBlockElement) {
        // Append blockElement to current <li> if empty, otherwise create a new one
        currentListItem = currentListItem.firstChild ? _createListItem(doc, list) : currentListItem;
        currentListItem.appendChild(childNode);
        currentListItem = null;
        continue;
      }
      
      if (isLineBreak) {
        // Only create a new list item in the next iteration when the current one has already content
        currentListItem = currentListItem.firstChild ? null : currentListItem;
        continue;
      }
      
      currentListItem.appendChild(childNode);
    }
    
    element.parentNode.replaceChild(list, element);
    return list;
  }
  
  return convertIntoList;
})();/**
 * Copy a set of styles from one element to another
 * Please note that this only works properly across browsers when the element from which to copy the styles
 * is in the dom
 *
 * Interesting article on how to copy styles
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Array} stylesToCopy List of styles which should be copied
 * @return {Object} Returns an object which offers the "from" method which can be invoked with the element where to
 *    copy the styles from., this again returns an object which provides a method named "to" which can be invoked 
 *    with the element where to copy the styles to (see example)
 *
 * @example
 *    var textarea    = $("textarea"),
 *        div         = $$("div[contenteditable=true]")[0],
 *        anotherDiv  = $$("div[contenteditable=true]")[1];
 *    wysihtml5.utils.copyStyles("width", "height").from(textarea).to(div);
 *    // or (advanced example):
 *    wysihtml5.utils.copyStyles(["overflow-y", "width", "height"]).from(textarea).to(div).andTo(anotherDiv);
 *
 */
wysihtml5.utils.copyStyles = (function() {
  
  /**
   * Mozilla and Opera recalculate the computed width when box-sizing: boder-box; is set
   * So if an element has "width: 200px; -moz-box-sizing: border-box; border: 1px;" then 
   * it's computed css width will be 198px
   */
  var BOX_SIZING_PROPERTIES = ["-webkit-box-sizing", "-moz-box-sizing", "-ms-box-sizing", "box-sizing"];
  
  var shouldIgnoreBoxSizingBorderBox = function(element) {
    if (hasBoxSizingBorderBox(element)) {
       return parseInt(wysihtml5.utils.getStyle(element, "width"), 10) < element.getWidth();
    }
    return false;
  };
  
  var hasBoxSizingBorderBox = function(element) {
    return BOX_SIZING_PROPERTIES.find(function(property) {
      return wysihtml5.utils.getStyle(element, property) == "border-box";
    });
  };
  
  return function(stylesToCopy) {
    stylesToCopy = $A(arguments).flatten();
    
    return {
      from: function(element) {
        if (shouldIgnoreBoxSizingBorderBox(element)) {
          stylesToCopy = stylesToCopy.without.apply(stylesToCopy, BOX_SIZING_PROPERTIES);
        }
        
        var cssText = stylesToCopy.inject("", function(str, property) {
          var propertyValue = wysihtml5.utils.getStyle(element, property);
          if (propertyValue) {
            str += property + ":" + propertyValue + ";";
          }
          return str;
        });
        
        return {
          to: function(element) {
            /**
             * Use static Element.setStyle method, since element is not
             * necessarily prototype extended
             */
            Element.setStyle(element, cssText);
            return { andTo: arguments.callee };
          }
        };
      }
    };
  };
})();/**
 * Copy a set of attributes from one element to another
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Array} attributesToCopy List of attributes which should be copied
 * @return {Object} Returns an object which offers the "from" method which can be invoked with the element where to
 *    copy the attributes from., this again returns an object which provides a method named "to" which can be invoked 
 *    with the element where to copy the attributes to (see example)
 *
 * @example
 *    var textarea    = $("textarea"),
 *        div         = $$("div[contenteditable=true]")[0],
 *        anotherDiv  = $$("div[contenteditable=true]")[1];
 *    wysihtml5.utils.copyAttributes("spellcheck", "value", "placeholder").from(textarea).to(div);
 *    // or (advanced example):
 *    wysihtml5.utils.copyAttributes(["spellcheck", "value", "placeholder"]).from(textarea).to(div).andTo(anotherDiv);
 *
 */
wysihtml5.utils.copyAttributes = function(attributesToCopy) {
  attributesToCopy = $A(arguments).flatten();
  
  return {
    from: function(elementToCopyFrom) {
      return {
        to: function(elementToCopyTo) {
          attributesToCopy.each(function(attribute) {
            if (elementToCopyFrom[attribute]) {
              elementToCopyTo[attribute] = elementToCopyFrom[attribute];
            }
          });
          return { andTo: arguments.callee };
        }
      };
    }
  };
};/**
 * Returns the given html wrapped in a div element
 *
 * Fixing IE's inability to treat unknown elements (HTML5 section, article, ...) correctly
 * when inserted via innerHTML
 * 
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {String} html The html which should be wrapped in a dom element
 * @param {Obejct} [context] Document object of the context the html belongs to
 */
wysihtml5.utils.getInDomElement = (function() {
  
  var _innerHTMLShiv = function(html, context) {
    var tempElement = context.createElement("div");
    tempElement.style.display = "none";
    context.body.appendChild(tempElement);
    // IE throws an exception when trying to insert <frameset></frameset> via innerHTML
    try { tempElement.innerHTML = html; } catch(e) {}
    context.body.removeChild(tempElement);
    return tempElement;
  };
  
  /**
   * Make sure IE supports HTML5 tags, which is accomplished by simply creating one instance of each element
   */
  var _ensureHTML5Compatibility = function(context) {
    if (context._wysihtml5_supportsHTML5Tags) {
      return;
    }
    for (var i=0, length=HTML5_ELEMENTS.length; i<length; i++) {
      context.createElement(HTML5_ELEMENTS[i]);
    }
    context._wysihtml5_supportsHTML5Tags = true;
  };
  
  
  /**
   * List of html5 tags
   * taken from http://simon.html5.org/html5-elements
   */
  var HTML5_ELEMENTS = [
    "abbr", "article", "aside", "audio", "bdi", "canvas", "command", "datalist", "details", "figcaption",
    "figure", "footer", "header", "hgroup", "keygen", "mark", "meter", "nav", "output", "progress",
    "rp", "rt", "ruby", "svg", "section", "source", "summary", "time", "track", "video", "wbr"
  ];
  
  return function(html, context) {
    context = context || document;
    var tempElement;
    if (typeof(html) === "object" && html.nodeType) {
      tempElement = context.createElement("div");
      tempElement.appendChild(html);
    } else if (wysihtml5.browserSupports.html5Tags(context)) {
      tempElement = context.createElement("div");
      tempElement.innerHTML = html;
    } else {
      _ensureHTML5Compatibility(context);
      tempElement = _innerHTMLShiv(html, context);
    }
    return tempElement;
  };
})();/**
 * Walks the dom tree from the given node up until it finds a match
 * Designed for optimal performance.
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} node The from which to check the parent nodes
 * @param {Object} matchingSet Object to match against (possible properties: nodeName, className, classRegExp)
 * @param {Number} [levels] How many parents should the function check up from the current node (defaults to 50)
 * @return {null|Element} Returns the first element that matched the desiredNodeName(s)
 * @example
 *    var listElement = wysihtml5.utils.getParentElement($$("li").first(), { nodeName: ["MENU", "UL", "OL"] });
 *    // ... or ...
 *    var unorderedListElement = wysihtml5.utils.getParentElement($$("li").first(), { nodeName: "UL" });
 *    // ... or ...
 *    var coloredElement = wysihtml5.utils.getParentElement(myTextNode, { nodeName: "SPAN", className: "wysiwyg-color-red", classRegExp: /wysiwyg-color-[a-z]/g });
 */
wysihtml5.utils.getParentElement = (function() {
  
  function _isSameNodeName(nodeName, desiredNodeNames) {
    if (!desiredNodeNames || !desiredNodeNames.length) {
      return true;
    }
    
    if (typeof(desiredNodeNames) === "string") {
      return nodeName === desiredNodeNames;
    } else {
      return desiredNodeNames.indexOf(nodeName) !== -1;
    }
  }
  
  function _isElement(node) {
    return node.nodeType === Node.ELEMENT_NODE;
  }
  
  function _hasClassName(element, className, classRegExp) {
    var classNames = (element.className || "").match(classRegExp) || [];
    if (!className) {
      return !!classNames.length;
    }
    return classNames[classNames.length - 1] === className;
  }
  
  function _getParentElementWithNodeName(node, nodeName, levels) {
    while (levels-- && node && node.nodeName !== "BODY") {
      if (_isSameNodeName(node.nodeName, nodeName)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }
  
  function _getParentElementWithNodeNameAndClassName(node, nodeName, className, classRegExp, levels) {
    while (levels-- && node && node.nodeName !== "BODY") {
      if (_isElement(node) &&
          _isSameNodeName(node.nodeName, nodeName) &&
          _hasClassName(node, className, classRegExp)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }
  
  return function(node, matchingSet, levels) {
    levels = levels || 50; // Go max 50 nodes upwards from current node
    if (matchingSet.className || matchingSet.classRegExp) {
      return _getParentElementWithNodeNameAndClassName(
        node, matchingSet.nodeName, matchingSet.className, matchingSet.classRegExp, levels
      );
    } else {
      return _getParentElementWithNodeName(
        node, matchingSet.nodeName, levels
      );
    }
  };
})();
/**
 * Get element's style for a specific css property
 *
 * @param {Element} element The element on which to retrieve the style
 * @param {String} property The CSS property to retrieve ("float", "display", "text-align", ...)
 * @author Christopher Blum <christopher.blum@xing.com>
 * @example
 *    wysihtml5.utils.getStyle(document.body, "display");
 *    // => "block"
 */
wysihtml5.utils.getStyle = (function() {
  var currentStylePropertyMapping = {
    "float": "styleFloat"
  };
  
  return function(element, property) {
    if (element.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    
    // currentStyle is no standard and only supported by Opera and IE but it has one important advantage over the standard-compliant
    // window.getComputedStyle, since it returns css property values in their original unit:
    // If you set an elements width to "50%", window.getComputedStyle will give you it's current width in px while currentStyle
    // gives you the original "50%".
    // Opera supports both, currentStyle and window.getComputedStyle, that's why checking for currentStyle should have higher prio
    if (element.currentStyle) {
      property = currentStylePropertyMapping[property] || property.camelize();
      return element.currentStyle[property];
    }

    var win                 = element.ownerDocument.defaultView || element.ownerDocument.parentWindow,
        needsOverflowReset  = (property === "height" || property === "width") && element.nodeName === "TEXTAREA",
        originalOverflow,
        returnValue;
    
    if (win.getComputedStyle) {
      // Chrome and Safari both calculate a wrong width and height for textareas when they have scroll bars
      // therfore we remove and restore the scrollbar and calculate the value in between
      if (needsOverflowReset) {
        originalOverflow = element.style.overflow;
        element.style.overflow = "hidden";
      }
      returnValue = win.getComputedStyle(element, null).getPropertyValue(property);
      if (needsOverflowReset) {
        element.style.overflow = originalOverflow || "";
      }
      return returnValue;
    }
  };
})();/**
 * High performant way to check whether an element with a specific tag name is in the given document
 * Optimized for being heavily executed
 * Unleashes the power of live node lists
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Object} doc The document object of the context where to check
 * @param {String} tagName Upper cased tag name
 * @example
 *    wysihtml5.utils.hasElementWithTagName(document, "IMG");
 */
wysihtml5.utils.hasElementWithTagName = (function() {
  var LIVE_CACHE          = {},
      DOCUMENT_IDENTIFIER = 1;
  
  function _getDocumentIdentifier(doc) {
    return doc._wysihtml5Identifier || (doc._wysihtml5Identifier = DOCUMENT_IDENTIFIER++);
  }
  
  return function(doc, tagName) {
    var key         = _getDocumentIdentifier(doc) + ":" + tagName,
        cacheEntry  = LIVE_CACHE[key];
    if (!cacheEntry) {
      cacheEntry = LIVE_CACHE[key] = doc.getElementsByTagName(tagName);
    }
    
    return cacheEntry.length > 0;
  };
})();/**
 * High performant way to check whether an element with a specific class name is in the given document
 * Optimized for being heavily executed
 * Unleashes the power of live node lists
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Object} doc The document object of the context where to check
 * @param {String} tagName Upper cased tag name
 * @example
 *    wysihtml5.utils.hasElementWithClassName(document, "foobar");
 */
wysihtml5.utils.hasElementWithClassName = (function() {
  var LIVE_CACHE          = {},
      DOCUMENT_IDENTIFIER = 1;
  
  function _getDocumentIdentifier(doc) {
    return doc._wysihtml5Identifier || (doc._wysihtml5Identifier = DOCUMENT_IDENTIFIER++);
  }
  
  return function(doc, className) {
    // getElementsByClassName is not supported by IE<9
    // but is sometimes mocked via library code (which then doesn't return live node lists)
    if (!wysihtml5.browserSupports.getElementsByClassName()) {
      return !!doc.querySelector("." + className);
    }
    
    var key         = _getDocumentIdentifier(doc) + ":" + className,
        cacheEntry  = LIVE_CACHE[key];
    if (!cacheEntry) {
      cacheEntry = LIVE_CACHE[key] = doc.getElementsByClassName(className);
    }
    
    return cacheEntry.length > 0;
  };
})();/**
 * Insert CSS rules
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Array} rules An array containing the css rules to insert
 *
 * @example
 *    wysihtml5.utils.insertRules([
 *      "html { height: 100%; }",
 *      "body { color: red; }"
 *    ]).into(document);
 */
wysihtml5.utils.insertRules = function(rules) {
  rules = rules.join("\n");
  
  return {
    into: function(doc) {
      var head         = doc.head || doc.getElementsByTagName("head")[0],
          styleElement = doc.createElement("style");
      
      styleElement.type = "text/css";
      
      if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = rules;
      } else {
        styleElement.appendChild(doc.createTextNode(rules));
      }
      
      if (head) {
        head.appendChild(styleElement);
      }
    }
  };
};/**
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
/**
 * Unwraps an unordered/ordered list
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} element The list element which should be unwrapped
 *
 * @example
 *    <!-- Assume the following dom: -->
 *    <ul id="list">
 *      <li>eminem</li>
 *      <li>dr. dre</li>
 *      <li>50 Cent</li>
 *    </ul>
 *
 *    <script>
 *      wysihtml5.utils.resolveList(document.getElementById("list"));
 *    </script>
 *
 *    <!-- Will result in: -->
 *    eminem<br>
 *    dr. dre<br>
 *    50 Cent<br>
 */
wysihtml5.utils.resolveList = (function() {
  
  function _isBlockElement(node) {
    return wysihtml5.utils.getStyle(node, "display") === "block";
  }
  
  function _isLineBreak(node) {
    return node.nodeName === "BR";
  }
  
  function _appendLineBreak(element) {
    var lineBreak = element.ownerDocument.createElement("br");
    element.appendChild(lineBreak);
  }
  
  function resolveList(list) {
    if (list.nodeName !== "MENU" && list.nodeName !== "UL" && list.nodeName !== "OL") {
      return;
    }
    
    var doc             = list.ownerDocument,
        fragment        = doc.createDocumentFragment(),
        previousSibling = list.previousSibling,
        firstChild,
        lastChild,
        isLastChild,
        shouldAppendLineBreak,
        listItem;
    
    if (previousSibling && !_isBlockElement(previousSibling)) {
      _appendLineBreak(fragment);
    }
    
    while (listItem = list.firstChild) {
      lastChild = listItem.lastChild;
      while (firstChild = listItem.firstChild) {
        isLastChild           = firstChild === lastChild;
        // This needs to be done before appending it to the fragment, as it otherwise will loose style information
        shouldAppendLineBreak = isLastChild && !_isBlockElement(firstChild) && !_isLineBreak(firstChild);
        fragment.appendChild(firstChild);
        if (shouldAppendLineBreak) {
          _appendLineBreak(fragment);
        }
      }
      
      listItem.parentNode.removeChild(listItem);
    }
    list.parentNode.replaceChild(fragment, list);
  }
  return resolveList;
})();/**
 * Renames an element (eg. a <div> to a <p>) and keeps its childs
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} element The list element which should be renamed
 * @param {Element} newNodeName The desired tag name
 *
 * @example
 *    <!-- Assume the following dom: -->
 *    <ul id="list">
 *      <li>eminem</li>
 *      <li>dr. dre</li>
 *      <li>50 Cent</li>
 *    </ul>
 *
 *    <script>
 *      wysihtml5.utils.renameElement(document.getElementById("list"), "ol");
 *    </script>
 *
 *    <!-- Will result in: -->
 *    <ol>
 *      <li>eminem</li>
 *      <li>dr. dre</li>
 *      <li>50 Cent</li>
 *    </ol>
 */
wysihtml5.utils.renameElement = function(element, newNodeName) {
  var newElement = element.ownerDocument.createElement(newNodeName),
      firstChild;
  while (firstChild = element.firstChild) {
    newElement.appendChild(firstChild);
  }
  wysihtml5.utils.copyAttributes(["align", "className"]).from(element).to(newElement);
  element.parentNode.replaceChild(newElement, element);
  return newElement;
};/**
 * Checks for empty text node childs and removes them
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} node The element in which to cleanup
 * @example
 *    wysihtml5.utils.removeEmptyTextNodes(element);
 */
wysihtml5.utils.removeEmptyTextNodes = function(node) {
  var childNode,
      childNodes        = $A(node.childNodes), // $A needed since childNodes is not an array but a live NodeList
      childNodesLength  = childNodes.length,
      i                 = 0;
  for (; i<childNodesLength; i++) {
    childNode = childNodes[i];
    if (childNode.nodeType === Node.TEXT_NODE && childNode.data === "") {
      childNode.parentNode.removeChild(childNode);
    }
  }
};
/**
 * Sandbox for executing javascript, parsing css styles and doing dom operations in a safe way
 *
 * Browser Compatibility:
 *  - Secure in MSIE 6+, but only when the user hasn't made changes to his security level "restricted"
 *  - Partially secure in other browsers (Firefox, Opera, Safari, Chrome, ...)
 *
 * Please note that this class can't benefit from the HTML5 sandbox attribute for the following reasons:
 *    - sandboxing doesn't work correctly with inlined content (src="javascript:'<html>...</html>'")
 *    - sandboxing of physical documents causes that the dom isn't accessible anymore from the outside (iframe.contentWindow, ...)
 *    - setting the "allow-same-origin" flag would fix that, but then still javascript and dom events refuse to fire
 *    - therefore the "allow-scripts" flag is needed, which then would inactivate any security, as the js executed inside the iframe
 *      can do anything as if the sandbox attribute wasn't set
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Function} [readyCallback] Method that gets invoked when the sandbox is ready
 * @param {Object} [config] Optional parameters, see defaultConfig property for more info
 *
 * @example
 *    new wysihtml5.utils.Sandbox(function(sandbox) {
 *      sandbox.getWindow().document.body.innerHTML = '<img src=foo.gif onerror="alert(document.cookie)">';
 *    });
 */
wysihtml5.utils.Sandbox = Class.create(
  /** @scope wysihtml5.utils.Sandbox.prototype */ {
  
  defaultConfig: {
    insertInto:   null,       // Element (id or direct object reference) where to insert the sandbox into
    context:      document,   // Object of document where to insert the sandbox in
    uaCompatible: "IE=Edge"   // X-UA-Compatible meta tag value (Document compatibility mode)
  },
  
  initialize: function(readyCallback, config) {
    this.callback = readyCallback || Prototype.emptyFunction;
    this.config   = Object.extend(Object.clone(this.defaultConfig), config);
    this.iframe   = this._createIframe();
    
    if (typeof(this.config.insertInto) === "string") {
      this.config.insertInto = this.config.context.getElementById(this.config.insertInto);
    }
    
    if (this.config.insertInto) {
      this.config.insertInto.appendChild(this.iframe);
    }
  },
  
  getIframe: function() {
    return this.iframe;
  },
  
  getWindow: function() {
    this._readyError();
  },
  
  getDocument: function() {
    this._readyError();
  },
  
  destroy: function() {
    var iframe = this.getIframe();
    iframe.parentNode.removeChild(iframe);
  },
  
  _readyError: function() {
    throw new Error("wysihtml5.Sandbox: Sandbox iframe isn't loaded yet");
  },
  
  /**
   * Creates the sandbox iframe
   *
   * Some important notes:
   *  - We can't use HTML5 sandbox for now:
   *    setting it causes that the iframe's dom can't be accessed from the outside
   *    Therefore we need to set the "allow-same-origin" flag which enables accessing the iframe's dom
   *    But then there's another problem, DOM events (focus, blur, change, keypress, ...) aren't fired.
   *    In order to make this happen we need to set the "allow-scripts" flag.
   *    A combination of allow-scripts and allow-same-origin is almost the same as setting no sandbox attribute at all.
   *  - Chrome & Safari, doesn't seem to support sandboxing correctly when the iframe's html is inlined (no physical document)
   *  - IE needs to have the security="restricted" attribute set before the iframe is 
   *    inserted into the dom tree
   *  - Believe it or not but in IE "security" in document.createElement("iframe") is false, even
   *    though it supports it
   *  - When an iframe has security="restricted", in IE eval() & execScript() don't work anymore
   *  - IE doesn't fire the onload event when the content is inlined in the src attribute, therefore we rely
   *    on the onreadystatechange event
   */
  _createIframe: function() {
    var iframe = this.config.context.createElement("iframe");
    iframe.className = "wysihtml5-sandbox";
    iframe.setAttribute("security", "restricted");
    iframe.setAttribute("allowTransparency", "true");
    iframe.setAttribute("frameBorder", "0");
    iframe.setAttribute("width", "0");
    iframe.setAttribute("height", "0");
    iframe.setAttribute("marginWidth", "0");
    iframe.setAttribute("marginHeight", "0");
    
    // Setting the src like this prevents ssl warnings in IE6
    if (!wysihtml5.browserSupports.emptyIframeSrcInHttpsContext()) {
      iframe.src = "javascript:'<html></html>'";
    }
    
    iframe.onload = function() {
      iframe.onreadystatechange = iframe.onload = null;
      this._onLoadIframe(iframe);
    }.bind(this);
    
    iframe.onreadystatechange = function() {
      if (/loaded|complete/.test(iframe.readyState)) {
        iframe.onreadystatechange = iframe.onload = null;
        this._onLoadIframe(iframe);
      }
    }.bind(this);
    
    return iframe;
  },
  
  /**
   * Callback for when the iframe has finished loading
   */
  _onLoadIframe: function(iframe) {
    // don't resume when the iframe got unloaded (eg. by removing it from the dom)
    if (!wysihtml5.utils.contains(document.documentElement, iframe)) {
      return;
    }
    
    var context        = this.config.context,
        iframeWindow   = iframe.contentWindow,
        iframeDocument = iframe.contentDocument || iframe.contentWindow.document,
        charset        = context.characterSet || context.charset || "utf-8",
        sandboxHtml    = this._getHtml({
          charset:      charset,
          stylesheets:  this.config.stylesheets,
          uaCompatible: this.config.uaCompatible
        });
    
    // Create the basic dom tree including proper DOCTYPE and charset
    iframeDocument.open("text/html", "replace");
    iframeDocument.write(sandboxHtml);
    iframeDocument.close();
    
    this.getWindow = function() { return iframeWindow; };
    this.getDocument = function() { return iframeDocument; };
    
    // Catch js errors and pass them to the parent's onerror event
    // addEventListener("error") doesn't work properly in some browsers
    // TODO: apparently this doesn't work in IE9!
    iframeWindow.onerror = function(errorMessage, fileName, lineNumber) {
      throw new Error("wysihtml5.Sandbox: " + errorMessage, fileName, lineNumber);
    };
    
    if (!wysihtml5.browserSupports.sandboxedIframes()) {
      // Unset a bunch of sensitive variables
      // Please note: This isn't hack safe!  
      // It more or less just takes care of basic attacks and prevents accidental theft of sensitive information
      // IE is secure though, which is the most important thing, since IE is the only browser, who
      // takes over scripts & styles into contentEditable elements when copied from external websites
      // or applications (Microsoft Word, ...)
      [
        "parent", "top", "opener", "frameElement", "frames",
        "localStorage", "globalStorage", "sessionStorage", "indexedDB"
      ].each(function(property) {
        this._unset(iframeWindow, property);
      }.bind(this));

      [
        "open", "close", "openDialog", "showModalDialog",
        "alert", "confirm", "prompt",
        "openDatabase", "postMessage",
        "XMLHttpRequest", "XDomainRequest"
      ].each(function(property) {
        this._unset(iframeWindow, property, Prototype.emptyFunction);
      }.bind(this));

      [
        "referrer",
        "write", "open", "close"
      ].each(function(property) {
        this._unset(iframeDocument, property);
      }.bind(this));

      // This doesn't work in Safari 5 
      // See http://stackoverflow.com/questions/992461/is-it-possible-to-override-document-cookie-in-webkit
      this._unset(iframeDocument, "cookie", "", true);
    }
    
    this.loaded = true;
    
    // Trigger the callback
    setTimeout(function() { this.callback(this); }.bind(this), 0);
  },
  
  _getHtml: function(templateVars) {
    if (templateVars.stylesheets) {
      templateVars.stylesheets = [templateVars.stylesheets].flatten().map(function(stylesheet) {
        return '<link rel="stylesheet" href="' + stylesheet + '">';
      }).join("");
    } else {
      templateVars.stylesheets = "";
    }
    
    return (
      '<!DOCTYPE html><html><head>'
      + '<meta http-equiv="X-UA-Compatible" content="#{uaCompatible}"><meta charset="#{charset}">#{stylesheets}</head>'
      + '<body></body></html>'
    ).interpolate(templateVars);
  },
  
  /**
   * Method to unset/override existing variables
   * @example
   *    // Make cookie unreadable and unwritable
   *    this._unset(document, "cookie", "", true);
   */
  _unset: function(object, property, value, setter) {
    try { object[property] = value; } catch(e) {}
    
    try { object.__defineGetter__(property, function() { return value; }); } catch(e) {}
    if (setter) {
      try { object.__defineSetter__(property, function() {}); } catch(e) {}
    }
    
    // IE9 crashes when setting a getter via Object.defineProperty on XMLHttpRequest or XDomainRequest
    // See https://connect.microsoft.com/ie/feedback/details/650112
    // or try the POC http://tifftiff.de/ie9_crash/
    var causesBrowserCrash = Prototype.Browser.IE && (property === "XMLHttpRequest" || property === "XDomainRequest");
    if (!causesBrowserCrash) {
      try {
        var config = {
          get: function() { return value; }
        };
        if (setter) {
          config.set = function() {};
        }
        Object.defineProperty(object, property, config);
      } catch(e) {}
    }
  }
});/**
 * HTML Sanitizer
 * Rewrites the HTML based on given rules
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Element|String} elementOrHtml HTML String to be sanitized OR element whose content should be sanitized
 * @param {Object} [rules] List of rules for rewriting the HTML, if there's no rule for an element it will
 *    be converted to a "span". Each rule is a key/value pair where key is the tag to convert, and value the
 *    desired substitution.
 * @param {Object} context Document object in which to parse the html, needed to sandbox the parsing
 *
 * @return {Element|String} Depends on the elementOrHtml parameter. When html then the sanitized html as string elsewise the element.
 *
 * @example
 *    var userHTML = '<div id="foo" onclick="alert(1);"><p><font color="red">foo</font><script>alert(1);</script></p></div>';
 *    wysihtml5.utils.sanitizeHTML(userHTML, {
 *      tags {
 *        p:      "div",      // Rename p tags to div tags
 *        font:   "span"      // Rename font tags to span tags
 *        div:    true,       // Keep them, also possible (same result when passing: "div" or true)
 *        script: undefined   // Remove script elements
 *      }
 *    });
 *    // => <div><div><span>foo bar</span></div></div>
 *
 *    var userHTML = '<table><tbody><tr><td>I'm a table!</td></tr></tbody></table>';
 *    wysihtml5.utils.sanitizeHTML(userHTML);
 *    // => '<span><span><span><span>I'm a table!</span></span></span></span>'
 *
 *    var userHTML = '<div>foobar<br>foobar</div>';
 *    wysihtml5.utils.sanitizeHTML(userHTML, {
 *      tags: {
 *        div: undefined,
 *        br:  true
 *      }
 *    });
 *    // => ''
 *
 *    var userHTML = '<div class="red">foo</div><div class="pink">bar</div>';
 *    wysihtml5.utils.sanitizeHTML(userHTML, {
 *      classes: {
 *        red:    1,
 *        green:  1
 *      },
 *      tags: {
 *        div: {
 *          rename_tag:     "p"
 *        }
 *      }
 *    });
 *    // => '<p class="red">foo</p><p>bar</p>'
 */
wysihtml5.utils.sanitizeHTML = (function() {
  
  /**
   * It's not possible to use a XMLParser/DOMParser as HTML5 is not always well-formed XML
   * new DOMParser().parseFromString('<img src="foo.gif">') will cause a parseError since the
   * node isn't closed
   *
   * Therefore we've to use the browser's ordinary HTML parser invoked by setting innerHTML.
   */
  var NODE_TYPE_MAPPING = {
    "1": _handleElement,
    "3": _handleText
  };
  
  var DEFAULT_RULES = { tags: {}, classes: {} };
  
  // Rename unknown tags to this
  var DEFAULT_NODE_NAME = "span";
  
  var WHITE_SPACE_REG_EXP = /\s+/;
  
  var currentRules = {};
  
  /**
   * Iterates over all childs of the element, recreates them, appends them into a document fragment
   * which later replaces the entire body content
   */
  function sanitizeHTML(elementOrHtml, rules, context, cleanUp) {
    currentRules = Object.extend(Object.clone(DEFAULT_RULES), rules);
    context = context || elementOrHtml.ownerDocument || document;
    var fragment      = context.createDocumentFragment(),
        isString      = typeof(elementOrHtml) === "string",
        element,
        newNode,
        firstChild;
    
    if (isString) {
      element = wysihtml5.utils.getInDomElement(elementOrHtml, context);
    } else {
      element = elementOrHtml;
    }
    
    while (element.firstChild) {
      firstChild  = element.firstChild;
      element.removeChild(firstChild);
      newNode = _convert(firstChild, cleanUp);
      if (newNode) {
        fragment.appendChild(newNode);
      }
    }
    
    // Clear element contents
    element.innerHTML = "";
    
    // Insert new DOM tree
    element.appendChild(fragment);
    
    return isString ? element.innerHTML : element;
  }
  
  function _convert(oldNode, cleanUp) {
    var oldNodeType     = oldNode.nodeType,
        oldChilds       = oldNode.childNodes,
        oldChildsLength = oldChilds.length,
        newNode,
        method          = NODE_TYPE_MAPPING[oldNodeType],
        i               = 0;
    
    newNode = method && method(oldNode);
    
    if (!newNode) {
      return null;
    }
    
    for (i=0; i<oldChildsLength; i++) {
      newChild = _convert(oldChilds[i], cleanUp);
      if (newChild) {
        newNode.appendChild(newChild);
      }
    }
    
    // Cleanup senseless <span> elements
    if (cleanUp &&
        newNode.childNodes.length <= 1 &&
        newNode.nodeName.toLowerCase() === DEFAULT_NODE_NAME &&
        newNode.innerHTML !== wysihtml5.utils.caret.PLACEHOLDER_TEXT && 
        !newNode.attributes.length) {
      return newNode.firstChild;
    }
    
    return newNode;
  }
  
  function _handleElement(oldNode) {
    var rule,
        newNode,
        endTag,
        tagRules    = currentRules.tags,
        nodeName    = oldNode.nodeName.toLowerCase(),
        scopeName   = oldNode.scopeName;
    
    /**
     * We already parsed that element
     * ignore it! (yes, this sometimes happens in IE8 when the html is invalid)
     */
    if (oldNode._wysihtml5) {
      return null;
    }
    oldNode._wysihtml5 = 1;
    
    
    /**
     * IE is the only browser who doesn't include the namespace in the
     * nodeName, that's why we have to prepend it by ourselves
     * scopeName is a proprietary IE feature
     * read more here http://msdn.microsoft.com/en-us/library/ms534388(v=vs.85).aspx
     */
    if (scopeName && scopeName != "HTML") {
      nodeName = scopeName + ":" + nodeName;
    }
    
    /**
     * Repair node
     * IE is a bit bitchy when it comes to invalid nested markup which includes unclosed tags
     * A <p> doesn't need to be closed according HTML4-5 spec, we simply replace it with a <div> to preserve its content and layout
     */
    if ("outerHTML" in oldNode) {
      if (!wysihtml5.browserSupports.closingOfUnclosedTags() &&
          oldNode.nodeName === "P" &&
          oldNode.outerHTML.slice(-4).toLowerCase() !== "</p>") {
        nodeName = "div";
      }
    }
    
    if (nodeName in tagRules) {
      rule = tagRules[nodeName];
      if (!rule || rule.remove) {
        return null;
      }
      
      rule = typeof(rule) === "string" ? { rename_tag: rule } : rule;
    } else if (oldNode.firstChild) {
      rule = { rename_tag: DEFAULT_NODE_NAME };
    } else {
      // Remove empty unknown elements
      return null;
    }
    
    newNode = oldNode.ownerDocument.createElement(rule.rename_tag || nodeName);
    _handleAttributes(oldNode, newNode, rule);
    
    oldNode = null;
    return newNode;
  }
  
  function _handleAttributes(oldNode, newNode, rule) {
    var attributes          = {},                         // fresh new set of attributes to set on newNode
        setClass            = rule.set_class,             // classes to set
        addClass            = rule.add_class,             // add classes based on existing attributes
        setAttributes       = rule.set_attributes,        // attributes to set on the current node
        checkAttributes     = rule.check_attributes,      // check/convert values of attributes
        allowedClasses      = currentRules.classes,
        i                   = 0,
        classes             = [],
        newClasses          = [],
        newUniqueClasses    = [],
        oldClasses          = [],
        classesLength,
        newClassesLength,
        currentClass,
        newClass,
        attributeName,
        newAttributeValue,
        method;
    
    if (setAttributes) {
      attributes = Object.clone(setAttributes);
    }
    
    if (checkAttributes) {
      for (attributeName in checkAttributes) {
        method = attributeCheckMethods[checkAttributes[attributeName]];
        if (!method) {
          continue;
        }
        newAttributeValue = method(_getAttribute(oldNode, attributeName));
        if (typeof(newAttributeValue) === "string") {
          attributes[attributeName] = newAttributeValue;
        }
      }
    }
    
    if (setClass) {
      classes.push(setClass);
    }
    
    if (addClass) {
      for (attributeName in addClass) {
        method = addClassMethods[addClass[attributeName]];
        if (!method) {
          continue;
        }
        newClass = method(_getAttribute(oldNode, attributeName));
        if (typeof(newClass) === "string") {
          classes.push(newClass);
        }
      }
    }
    
    // add old classes last
    oldClasses = oldNode.getAttribute("class");
    if (oldClasses) {
      classes = classes.concat(oldClasses.split(WHITE_SPACE_REG_EXP));
    }
    classesLength = classes.length;
    for (; i<classesLength; i++) {
      currentClass = classes[i];
      if (allowedClasses[currentClass]) {
        newClasses.push(currentClass);
      }
    }
    
    // remove duplicate entries and preserve class specificity
    newClassesLength = newClasses.length;
    while (newClassesLength--) {
      currentClass = newClasses[newClassesLength];
      if (newUniqueClasses.indexOf(currentClass) == -1) {
        newUniqueClasses.unshift(currentClass);
      }
    }
    
    if (newUniqueClasses.length) {
      attributes["class"] = newUniqueClasses.join(" ");
    }
    
    // sort and set attributes on newNode
    attributes = _sortByKey(attributes);
    
    for (attributeName in attributes) {
      // Setting attributes can cause a js error in IE under certain circumstances
      // eg. on a <img> under https when it's new attribute value is non-https
      // TODO: Investigate this further and check for smarter handling
      try {
        newNode.setAttribute(attributeName, attributes[attributeName]);
      } catch(e) {}
    }
    
    // IE8 sometimes loses the width/height attributes when those are set before the "src"
    // so we make sure to set them again
    if (attributes.src) {
      if (typeof(attributes.width) !== "undefined") {
        newNode.setAttribute("width", attributes.width);
      }
      if (typeof(attributes.height) !== "undefined") {
        newNode.setAttribute("height", attributes.height);
      }
    }
  }
  
  /**
   * IE gives wrong results for hasAttribute/getAttribute, for example:
   *    var td = document.createElement("td");
   *    td.getAttribute("rowspan"); // => "1" in IE
   *
   * Therefore we have to check the element's outerHTML for the attribute
   */
  var HAS_GET_ATTRIBUTE_BUG = !wysihtml5.browserSupports.getAttributeCorrectly();
  function _getAttribute(node, attributeName) {
    attributeName = attributeName.toLowerCase();
    var nodeName = node.nodeName;
    if (nodeName == "IMG" && attributeName == "src" && _isLoadedImage(node) === true) {
      // Get 'src' attribute value via object property since this will always contain the
      // full absolute url (http://...)
      // this fixes a very annoying bug in firefox (ver 3.6 & 4) and IE 8 where images copied from the same host
      // will have relative paths, which the sanitizer strips out (see attributeCheckMethods.url)
      return node.src;
    } else if (HAS_GET_ATTRIBUTE_BUG && "outerHTML" in node) {
      // Don't trust getAttribute/hasAttribute in IE 6-8, instead check the element's outerHTML
      var outerHTML      = node.outerHTML.toLowerCase(),
          // TODO: This might not work for attributes without value: <input disabled>
          hasAttribute   = outerHTML.indexOf(" " + attributeName +  "=") != -1;
      
      return hasAttribute ? node.getAttribute(attributeName) : null;
    } else{
      return node.getAttribute(attributeName);
    }
  }
  
  /**
   * Check whether the given node is a proper loaded image
   * FIXME: Returns undefined when unknown (Chrome, Safari)
   */
  function _isLoadedImage(node) {
    try {
      return node.complete && !node.mozMatchesSelector(":-moz-broken");
    } catch(e) {
      if (node.complete && node.readyState === "complete") {
        return true;
      }
    }
  }
  
  /**
   * Sorts key/value pairs alphabetically by key name
   */
  function _sortByKey(object) {
    var newObject   = {},
        key,
        keys        = Object.keys(object).sort(),
        keysLength  = keys.length,
        i           = 0;
    for (; i<keysLength; i++) {
      key = keys[i];
      newObject[key] = object[key];
    }
    return newObject;
  }
  
  function _handleText(oldNode) {
    return oldNode.ownerDocument.createTextNode(oldNode.data);
  }
  
  
  // ------------ attribute checks ------------ \\
  var attributeCheckMethods = {
    url: (function() {
      var REG_EXP = /^https?:\/\//i;
      return function(attributeValue) {
        if (!attributeValue || !attributeValue.match(REG_EXP)) {
          return null;
        }
        return attributeValue.replace(REG_EXP, function(match) {
          return match.toLowerCase();
        });
      };
    })(),
    
    alt: (function() {
      var REG_EXP = /[^ a-z0-9_\-]/gi;
      return function(attributeValue) {
        if (!attributeValue) {
          return "";
        }
        return attributeValue.replace(REG_EXP, "");
      };
    })(),
    
    numbers: (function() {
      var REG_EXP = /\D/g;
      return function(attributeValue) {
        if (!attributeValue) {
          return null;
        }
        return attributeValue.replace(REG_EXP, "");
      };
    })()
  };
  
  // ------------ class converter (converts an html attribute to a class name) ------------ \\
  var addClassMethods = {
    align_img: (function() {
      var mapping = {
        left:   "wysiwyg-float-left",
        right:  "wysiwyg-float-right"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),
    
    align_text: (function() {
      var mapping = {
        left:     "wysiwyg-text-align-left",
        right:    "wysiwyg-text-align-right",
        center:   "wysiwyg-text-align-center",
        justify:  "wysiwyg-text-align-justify"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),
    
    clear_br: (function() {
      var mapping = {
        left:   "wysiwyg-clear-left",
        right:  "wysiwyg-clear-right",
        both:   "wysiwyg-clear-both",
        all:    "wysiwyg-clear-both"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),
    
    size_font: (function() {
      var mapping = {
        "1": "wysiwyg-font-size-xx-small",
        "2": "wysiwyg-font-size-small",
        "3": "wysiwyg-font-size-medium",
        "4": "wysiwyg-font-size-large",
        "5": "wysiwyg-font-size-x-large",
        "6": "wysiwyg-font-size-xx-large",
        "7": "wysiwyg-font-size-xx-large",
        "-": "wysiwyg-font-size-smaller",
        "+": "wysiwyg-font-size-larger"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).charAt(0)];
      };
    })()
  };
  
  return sanitizeHTML;
})();/**
 * Simulate HTML5 placeholder attribute
 *
 * Needed since
 *    - div[contentEditable] elements don't support it
 *    - older browsers (such as IE8 and Firefox 3.6) don't support it at all
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Object} parent Instance of main wysihtml5.Editor class
 * @param {Element} view Instance of wysihtml5.views.* class
 * @param {String} placeholderText
 *
 * @example
 *    wysihtml.utils.simulatePlaceholder(this, composer, "Foobar");
 */
wysihtml5.utils.simulatePlaceholder = function(parent, view, placeholderText) {
  var unset = function() {
        if (view.hasPlaceholderSet()) {
          view.clear();
        }
        Element.removeClassName(view.element, "placeholder");
      },
      set = function() {
        if (view.isEmpty()) {
          view.setValue(placeholderText);
          Element.addClassName(view.element, "placeholder");
        }
      };
  
  parent
    .observe("set_placeholder", set)
    .observe("unset_placeholder", unset)
    .observe("focus:composer", unset)
    .observe("paste:composer", unset)
    .observe("blur:composer", set);
  
  set();
};/**
 * Class that takes care that the value of the composer and the textarea is always in sync
 */
wysihtml5.utils.Synchronizer = Class.create(
  /** @scope wysihtml5.utils.Synchronizer.prototype */ {
  INTERVAL: 400,
  
  initialize: function(parent, textarea, composer) {
    this.parent   = parent;
    this.textarea = textarea;
    this.composer = composer;
    
    this._observe();
  },
  
  /**
   * Sync html from composer to textarea
   * Takes care of placeholders
   * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the textarea
   */
  fromComposerToTextarea: function(shouldParseHtml) {
    this.textarea.setValue(this._trim(this.composer.getValue()), shouldParseHtml);
  },
  
  /**
   * Sync value of textarea to composer
   * Takes care of placeholders
   * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the composer
   */
  fromTextareaToComposer: function(shouldParseHtml) {
    var textareaValue = this.textarea.getValue();
    if (textareaValue) {
      this.composer.setValue(textareaValue, shouldParseHtml);
    } else {
      this.composer.clear();
      this.parent.fire("set_placeholder");
    }
  },
  
  /**
   * Invoke syncing based on view state
   * @param {Boolean} shouldParseHtml Whether the html should be sanitized before inserting it into the composer/textarea
   */
  sync: function(shouldParseHtml) {
    if (this.parent.currentView.name == "textarea") {
      this.fromTextareaToComposer(shouldParseHtml);
    } else {
      this.fromComposerToTextarea(shouldParseHtml);
    }
  },
  
  /**
   * Initializes interval-based syncing
   * also makes sure that on-submit the composer's content is synced with the textarea
   * immediately when the form gets submitted
   */
  _observe: function() {
    var interval,
        form          = this.textarea.element.up("form"),
        startInterval = function() {
          interval = setInterval(function() { this.fromComposerToTextarea(); }.bind(this), this.INTERVAL);
        }.bind(this),
        stopInterval  = function() {
          clearInterval(interval);
          interval = null;
        };
    
    startInterval();
    
    if (form) {
      // If the textarea is in a form make sure that after onreset and onsubmit the composer
      // has the correct state
      form.observe("submit", function() { this.sync(true); }.bind(this));
      form.observe("reset", function() { this.fromTextareaToComposer.bind(this).defer(); }.bind(this));
    }
    
    this.parent.observe("change_view", function(event) {
      var view = event.memo;
      if (view == "composer" && !interval) {
        this.fromTextareaToComposer(true);
        startInterval();
      } else if (view == "textarea") {
        this.fromComposerToTextarea(true);
        stopInterval();
      }
    }.bind(this));
    
    this.parent.observe("destroy:composer", stopInterval);
  },
  
  /**
   * Normalizes white space in the beginning and end
   * This: "     foo    " will become: " foo "
   */
  _trim: (function() {
    var WHITE_SPACE_START = /^\s+/,
        WHITE_SPACE_END   = /\s+$/;
    return function(str) {
      return str.replace(WHITE_SPACE_START, " ").replace(WHITE_SPACE_END, " ");
    };
  })()
});if ("textContent" in document.documentElement) {
  wysihtml5.utils.setTextContent = function(element, text) {
    element.textContent = text;
  };
  
  wysihtml5.utils.getTextContent = function(element) {
    return element.textContent;
  };
} else if ("innerText" in document.documentElement) {
  wysihtml5.utils.setTextContent = function(element, text) {
    element.innerText = text;
  };

  wysihtml5.utils.getTextContent = function(element) {
    return element.innerText;
  };
} else {
  wysihtml5.utils.setTextContent = function(element, text) {
    element.nodeValue = text;
  };
  
  wysihtml5.utils.getTextContent = function(element) {
    return element.nodeValue;
  };
}
/**
 * Takes an element, removes it and replaces it with it's childs
 * 
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Object} node The node which to replace with it's child nodes
 * @example
 *    <div id="foo">
 *      <span>hello</span>
 *    </div>
 *    <script>
 *      // Remove #foo and replace with it's children
 *      wysihtml5.utils.unwrap(document.getElementById("foo"));
 *    </script>
 */
wysihtml5.utils.unwrap = function(node) {
  if (!node.parentNode) {
    return;
  }
  
  if (!node.firstChild) {
    node.parentNode.removeChild(node);
    return;
  }
  
  var fragment = node.ownerDocument.createDocumentFragment();
  while (node.firstChild) {
    fragment.appendChild(node.firstChild);
  }
  node.parentNode.replaceChild(fragment, node);
  node = fragment = null;
};
/**
 * Fix most common html formatting misbehaviors of browsers implementation when inserting
 * content via copy & paste contentEditable
 *
 * @author Christopher Blum
 */
wysihtml5.quirks.cleanPastedHTML = (function() {
  // TODO: We probably need more rules here
  var defaultRules = {
    // When pasting underlined links <a> into a contentEditable, IE thinks, it has to insert <u> to keep the styling
    "a u": wysihtml5.utils.unwrap
  };
  
  function cleanPastedHTML(elementOrHtml, rules, context) {
    rules   = rules || defaultRules;
    context = context || elementOrHtml.ownerDocument || document;
    
    var element,
        isString = typeof(elementOrHtml) === "string",
        method,
        matches,
        matchesLength,
        i,
        j = 0;
    if (isString) {
      element = wysihtml5.utils.getInDomElement(elementOrHtml, context);
    } else {
      element = elementOrHtml;
    }
    
    for (i in rules) {
      matches       = element.querySelectorAll(i);
      method        = rules[i];
      matchesLength = matches.length;
      for (; j<matchesLength; j++) {
        method(matches[j]);
      }
    }
    
    matches = elementOrHtml = rules = null;
    
    return isString ? element.innerHTML : element;
  }
  
  return cleanPastedHTML;
})();/**
 * IE and Opera leave an empty paragraph in the contentEditable element after clearing it
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Object} contentEditableElement The contentEditable element to observe for clearing events
 * @exaple
 *    wysihtml5.quirks.ensureProperClearing(myContentEditableElement);
 */
wysihtml5.quirks.ensureProperClearing = (function() {
  var clearIfNecessary = function(event) {
    var element = this;
    setTimeout(function() {
      var innerHTML = element.innerHTML.toLowerCase();
      if (innerHTML == "<p>&nbsp;</p>" ||
          innerHTML == "<p>&nbsp;</p><p>&nbsp;</p>") {
        element.innerHTML = "";
      }
    }, 0);
  };
  
  return function(contentEditableElement) {
    wysihtml5.utils.observe(contentEditableElement, ["cut", "keydown"], clearIfNecessary);
  };
})();



/**
 * In Opera when the caret is in the first and only item of a list (<ul><li>|</li></ul>) and the list is the first child of the contentEditable element, it's impossible to delete the list by hitting backspace
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Object} contentEditableElement The contentEditable element to observe for clearing events
 * @exaple
 *    wysihtml5.quirks.ensureProperClearing(myContentEditableElement);
 */
wysihtml5.quirks.ensureProperClearingOfLists = (function() {
  var ELEMENTS_THAT_CONTAIN_LI = ["OL", "UL", "MENU"];
  
  var clearIfNecessary = function(element, contentEditableElement) {
    if (!contentEditableElement.firstChild || ELEMENTS_THAT_CONTAIN_LI.indexOf(contentEditableElement.firstChild.nodeName) == -1) {
      return;
    }
    
    var list = wysihtml5.utils.getParentElement(element, { nodeName: ELEMENTS_THAT_CONTAIN_LI });
    if (!list) {
      return;
    }
    
    var listIsFirstChildOfContentEditable = list == contentEditableElement.firstChild;
    if (!listIsFirstChildOfContentEditable) {
      return;
    }
    
    var hasOnlyOneListItem = list.childNodes.length <= 1;
    if (!hasOnlyOneListItem) {
      return;
    }
    
    var onlyListItemIsEmpty = list.firstChild ? list.firstChild.innerHTML === "" : true;
    if (!onlyListItemIsEmpty) {
      return;
    }
    
    list.parentNode.removeChild(list);
  };
  
  return function(contentEditableElement) {
    wysihtml5.utils.observe(contentEditableElement, "keydown", function(event) {
      if (event.keyCode != 8) { // 8 = backspace
        return;
      }
      
      var element = wysihtml5.utils.caret.getSelectedNode(contentEditableElement.ownerDocument);
      clearIfNecessary(element, contentEditableElement);
    });
  };
})();/**
 * Some browsers don't insert line breaks when hitting return in a contentEditable element
 *    - Opera & IE insert new <p> on return
 *    - Chrome & Safari insert new <div> on return
 *    - Firefox inserts <br> on return (yippie!)
 
 * @author Christopher Blum <christopher.blum@xing.com>
 *
 * @param {Element} element
 *
 * @example
 *    wysihtml5.quirks.insertLineBreakOnReturn(element);
 */
wysihtml5.quirks.insertLineBreakOnReturn = (function() {
  var USE_NATIVE_LINE_BREAK_WHEN_CARET_INSIDE_TAGS  = ["LI", "DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6"],
      LIST_TAGS                                     = ["UL", "OL", "MENU"],
      BACKSPACE_KEY                                 = 8,
      RETURN_KEY                                    = 13;
  
  var keyPress = function(event) {
    if (event.shiftKey || (event.keyCode !== RETURN_KEY && event.keyCode !== BACKSPACE_KEY)) {
      return;
    }
    
    var element         = event.target,
        selectedNode    = wysihtml5.utils.caret.getSelectedNode(element.ownerDocument),
        blockElement    = wysihtml5.utils.getParentElement(selectedNode, { nodeName: USE_NATIVE_LINE_BREAK_WHEN_CARET_INSIDE_TAGS }, 4);
    
    if (blockElement) {
      // IE and Opera create <p> elements after leaving a list
      // check after keypress of backspace and return whether a <p> got inserted and unwrap it
      if (blockElement.nodeName === "LI" && (event.keyCode === RETURN_KEY || event.keyCode === BACKSPACE_KEY)) {
        setTimeout(function() {
          var selectedNode = wysihtml5.utils.caret.getSelectedNode(element.ownerDocument),
              list,
              div;
          if (!selectedNode) {
            return;
          }
          
          list = wysihtml5.utils.getParentElement(selectedNode, {
            nodeName: LIST_TAGS
          }, 2);
          
          if (list) {
            return;
          }
          if (selectedNode.parentNode.nodeName === "P") {
            div = wysihtml5.utils.renameElement(selectedNode.parentNode, "div");
            wysihtml5.utils.caret.selectNode(div);
          }
        }, 0);
      }
      return;
    }
    
    if (event.keyCode === RETURN_KEY) {
      wysihtml5.commands.exec(element, "insertLineBreak");
      event.preventDefault();
    }
  };
  
  return function(element) {
    // keypress doesn't fire when you hit backspace
    wysihtml5.utils.observe(element.ownerDocument, "keydown", keyPress);
  };
})();/**
 * Force rerendering of a given element
 * Needed to fix display misbehaviors of IE
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} element The element object which needs to be rerendered
 * @example
 *    wysihtml5.quirks.redraw(document.body);
 */
wysihtml5.quirks.redraw = (function() {
  var CLASS_NAME = "wysihtml5-quirks-redraw";
  return function(element) {
    Element.addClassName(element, CLASS_NAME)
    Element.removeClassName(element, CLASS_NAME);
    
    // Following hack is needed for firefox to make sure that image resize handles are properly removed
    try {
      var doc = element.ownerDocument;
      doc.execCommand("italic", false, null);
      doc.execCommand("italic", false, null);
    } catch(e) {}
  };
})();
/**
 * TODO: the following methods still need unit test coverage
 */
wysihtml5.views.View = Class.create(
  /** @scope wysihtml5.views.View.prototype */ {
  initialize: function(parent, textareaElement, config) {
    this.parent   = parent;
    this.element  = textareaElement;
    this.config   = config;
    
    this._observeViewChange();
  },
  
  _observeViewChange: function() {
    this.parent.observe("beforeload", function() {
      this.parent.observe("change_view", function(event) {
        var view = event.memo;
        if (view === this.name) {
          this.parent.currentView = this;
          this.show();
          // Using defer() here to make sure that the placeholder is set before focusing
          this.focus.bind(this).defer();
        } else {
          this.hide();
        }
      }.bind(this));
    }.bind(this));
  },
  
  focus: function() {
    if (this.element.ownerDocument.querySelector(":focus") === this.element) {
      return;
    }
    
    try { this.element.focus(); } catch(e) {}
  },
  
  hide: function() {
    this.element.hide();
  },
  
  show: function() {
    this.element.show();
  },
  
  disable: function() {
    this.element.setAttribute("disabled", "disabled");
  },
  
  enable: function() {
    this.element.removeAttribute("disabled");
  }
});wysihtml5.views.Composer = Class.create(wysihtml5.views.View, 
  /** @scope wysihtml5.views.Composer.prototype */ {
  name: "composer",
  
  // Needed for firefox in order to display a proper caret in an empty contentEditable
  CARET_HACK: "<br>",
  
  initialize: function($super, parent, textareaElement, config) {
    $super(parent, textareaElement, config);
    this.textarea = this.parent.textarea;
    this._initSandbox();
  },
  
  clear: function() {
    this.element.innerHTML = wysihtml5.browserSupports.caretInEmptyContentEditableCorrectly() ? "" : this.CARET_HACK;
  },
  
  getValue: function(parse) {
    var value = this.isEmpty() ? "" : this.element.innerHTML;
    if (parse) {
      value = this.parent.parse(value);
    }
    
    // Replace all "zero width no breaking space" chars
    // which are used as hacks to enable some functionalities
    // Also remove all CARET hacks that somehow got left
    value = value
      .replace(/\uFEFF/g, "")
      .replace(new RegExp(RegExp.escape(wysihtml5.utils.caret.PLACEHOLDER_TEXT), "g"), "");
    
    return value;
  },
  
  setValue: function(html, parse) {
    if (parse) {
      html = this.parent.parse(html);
    }
    this.element.innerHTML = html;
  },
  
  show: function() {
    this.iframe.setStyle({ display: this._displayStyle || "" });
    
    // Firefox needs this, otherwise contentEditable becomes uneditable
    this.disable();
    this.enable();
  },
  
  hide: function() {
    this._displayStyle = wysihtml5.utils.getStyle(this.iframe, "display");
    if (this._displayStyle === "none") {
      this._displayStyle = null;
    }
    this.iframe.hide();
  },
  
  disable: function($super) {
    this.element.removeAttribute("contentEditable");
    $super();
  },
  
  enable: function($super) {
    this.element.setAttribute("contentEditable", "true");
    $super();
  },
  
  getTextContent: function() {
    return wysihtml5.utils.getTextContent(this.element);
  },
  
  hasPlaceholderSet: function() {
    return this.getTextContent() == this.textarea.element.readAttribute("placeholder");
  },
  
  isEmpty: function() {
    var innerHTML               = this.element.innerHTML,
        elementsWithVisualValue = "blockquote, ul, ol, img, embed, object, table, iframe, svg, video, audio, button, input, select, textarea";
    return innerHTML === "" || 
      innerHTML === this.CARET_HACK ||
      this.hasPlaceholderSet() ||
      (this.getTextContent() === "" && !this.element.querySelector(elementsWithVisualValue));
  },
  
  _initSandbox: function() {
    this.sandbox = new wysihtml5.utils.Sandbox(this._create.bind(this), {
      stylesheets:  this.config.stylesheets,
      uaCompatible: "IE=7"
    });
    this.iframe  = this.sandbox.getIframe();
    
    // Create hidden field which tells the server after submit, that the user used an wysiwyg editor
    this.hiddenField = new Element("input", {
      type:   "hidden",
      name:   "_wysihtml5_mode"
    });
    this.hiddenField.value = "1";
    
    // Store reference to current wysihtml5 instance on the textarea element
    this.textarea.element
      .insert({ after: this.iframe })
      .insert({ after: this.hiddenField });
  },
  
  _create: function() {
    this.element                  = this.sandbox.getDocument().body;
    this.textarea                 = this.parent.textarea;
    this.element.innerHTML        = this.textarea.getValue(true);
    this.enable();
    
    // Make sure that our external range library is initialized
    window.rangy.init();
    
    wysihtml5.utils.copyAttributes(
      "className", "spellcheck", "title", "lang", "dir", "accessKey"
    ).from(this.textarea.element).to(this.element);
    
    Element.addClassName(this.element, this.config.composerClassName);
    
    // Make the editor look like the original textarea, by syncing styles
    if (this.config.style) {
      this.style();
    }
    
    this.observe();
    
    var name = this.config.name;
    if (name) {
      Element.addClassName(this.element, name);
      Element.addClassName(this.iframe, name);
    }
    
    // Simulate html5 placeholder attribute on contentEditable element
    var placeholderText = Object.isString(this.config.placeholder) ? this.config.placeholder : this.textarea.element.readAttribute("placeholder");
    if (placeholderText) {
      wysihtml5.utils.simulatePlaceholder(this.parent, this, placeholderText);
    }
    
    // Make sure that the browser avoids using inline styles whenever possible
    wysihtml5.commands.exec(this.element, "styleWithCSS", false);
    
    this._initAutoLinking();
    this._initObjectResizing();
    
    // Simulate html5 autofocus on contentEditable element
    if (this.textarea.element.hasAttribute("autofocus") || document.querySelector(":focus") == this.textarea.element) {
      wysihtml5.utils.autoFocus(this);
    }
    
    // IE and Opera insert paragraphs on return instead of line breaks
    if (!wysihtml5.browserSupports.lineBreaksOnReturn()) {
      wysihtml5.quirks.insertLineBreakOnReturn(this.element);
    }
    
    // IE sometimes leaves a single paragraph, which can't be removed by the user
    if (!wysihtml5.browserSupports.clearingOfContentEditableCorrectly()) {
      wysihtml5.quirks.ensureProperClearing(this.element);
    }
    
    if (!wysihtml5.browserSupports.clearingOfListsInContentEditableCorrectly()) {
      wysihtml5.quirks.ensureProperClearingOfLists(this.element);
    }
    
    // Set up a sync that makes sure that textarea and editor have the same content
    if (this.initSync && this.config.sync) {
      this.initSync();
    }
    
    // Okay hide the textarea, we are ready to go
    this.textarea.hide();
    
    // Fire global (before-)load event
    this.parent.fire("beforeload").fire("load");
  },
  
  _initAutoLinking: function() {
    var supportsDisablingOfAutoLinking = wysihtml5.browserSupports.disablingOfAutoLinking(),
        supportsAutoLinking            = wysihtml5.browserSupports.autoLinkingInContentEditable();
    if (supportsDisablingOfAutoLinking) {
      wysihtml5.commands.exec(this.element, "autoUrlDetect", false);
    }
    
    if (!this.config.autoLink) {
      return;
    }
    
    var sandboxDoc = this.sandbox.getDocument();
    
    // Only do the auto linking by ourselves when the browser doesn't support auto linking
    // OR when he supports auto linking but we were able to turn it off (IE9+)
    if (!supportsAutoLinking || (supportsAutoLinking && supportsDisablingOfAutoLinking)) {
      this.parent.observe("newword:composer", function() {
        wysihtml5.utils.caret.executeAndRestore(sandboxDoc, function(startContainer, endContainer) {
          wysihtml5.utils.autoLink(endContainer.parentNode);
        });
      }.bind(this));
    }
    
    // Assuming we have the following:
    //  <a href="http://www.google.de">http://www.google.de</a>
    // If a user now changes the url in the innerHTML we want to make sure that
    // it's synchronized with the href attribute (as long as the innerHTML is still a url)
    var // Use a live NodeList to check whether there are any links in the document
        links           = sandboxDoc.getElementsByTagName("a"),
        // The autoLink helper method reveals a reg exp to detect correct urls
        urlRegExp       = wysihtml5.utils.autoLink.URL_REG_EXP,
        getTextContent  = function(element) {
          var textContent = wysihtml5.utils.getTextContent(element).strip();
          if (textContent.substr(0, 4) === "www.") {
            textContent = "http://" + textContent;
          }
          return textContent;
        };
    
    wysihtml5.utils.observe(this.element, "keydown", function(event) {
      if (!links.length) {
        return;
      }
      
      var selectedNode = wysihtml5.utils.caret.getSelectedNode(event.target.ownerDocument),
          link         = wysihtml5.utils.getParentElement(selectedNode, { nodeName: "A" }, 4),
          textContent;
      
      if (!link) {
        return;
      }
      
      textContent = getTextContent(link);
      // keydown is fired before the actual content is changed
      // therefore we set a timeout to change the href
      setTimeout(function() {
        var newTextContent = getTextContent(link);
        if (newTextContent === textContent) {
          return;
        }
        
        // Only set href when new href looks like a valid url
        if (newTextContent.match(urlRegExp)) {
          link.setAttribute("href", newTextContent);
        }
      }, 0);
    });
  },
  
  _initObjectResizing: function() {
    wysihtml5.commands.exec(this.element, "enableObjectResizing", this.config.allowObjectResizing);
    
    if (this.config.allowObjectResizing) {
      if (wysihtml5.browserSupports.event("resizeend")) {
        wysihtml5.utils.observe(this.element, "resizeend", function(event) {
          var target      = event.target || event.srcElement;
          ["width", "height"].each(function(property) {
            if (target.style[property]) {
              target.setAttribute(property, parseInt(target.style[property], 10));
              target.style[property] = "";
            }
          });
          // After resizing IE sometimes forgets to remove the old resize handles
          wysihtml5.quirks.redraw(this.element);
        }.bind(this));
      }
    } else {
      if (wysihtml5.browserSupports.event("resizestart")) {
        wysihtml5.utils.observe(this.element, "resizestart", function(event) {
          event.preventDefault();
        });
      }
    }
  }
});wysihtml5.views.Composer.addMethods({
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
});/**
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
});wysihtml5.views.Textarea = Class.create(wysihtml5.views.View,
  /** @scope wysihtml5.views.Textarea.prototype */ {
  name: "textarea",
  
  initialize: function($super, parent, textareaElement, config) {
    $super(parent, textareaElement, config);
    
    // Store reference to current wysihtml5.Editor instance
    this.element.store("wysihtml5", parent);
    
    this._observe();
  },
  
  clear: function() {
    this.element.value = "";
  },
  
  getValue: function(parse) {
    var value = this.isEmpty() ? "" : this.element.value;
    if (parse) {
      value = this.parent.parse(value);
    }
    return value;
  },
  
  setValue: function(html, parse) {
    if (parse) {
      html = this.parent.parse(html);
    }
    this.element.value = html;
  },
  
  hasPlaceholderSet: function() {
    var supportsPlaceholder = wysihtml5.browserSupports.placeholderOn(this.element),
        placeholderText     = this.element.getAttribute("placeholder") || null,
        value               = this.element.value,
        isEmpty             = !value;
    return (supportsPlaceholder && isEmpty) || (value === placeholderText);
  },
  
  isEmpty: function() {
    return !this.element.value.strip() || this.hasPlaceholderSet();
  },
  
  _observe: function() {
    var element = this.element,
        parent  = this.parent,
        eventMapping = {
          focusin:  "focus",
          focusout: "blur"
        },
        /**
         * Calling focus() or blur() on an element doesn't synchronously trigger the attached focus/blur events
         * This is the case for focusin and focusout, so let's use them whenever possible, kkthxbai
         */
        events = wysihtml5.browserSupports.event("focusin") ? ["focusin", "focusout", "change"] : ["focus", "blur", "change"];
    
    parent.observe("beforeload", function() {
      wysihtml5.utils.observe(element, events, function(event) {
        var eventName = eventMapping[event.type] || event.type;
        parent.fire(eventName).fire(eventName + ":textarea");
      });
      
      wysihtml5.utils.observe(element, ["paste", "drop"], function() {
        setTimeout(function() { parent.fire("paste").fire("paste:textarea"); }, 0);
      });
    });
  }
});/**
 * Toolbar Dialog
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} link The toolbar link which causes the dialog to show up
 * @param {Element} container The dialog container
 *
 * @example
 *    <!-- Toolbar link -->
 *    <a data-wysihtml5-command="insertImage">insert an image</a>
 *
 *    <!-- Dialog -->
 *    <div data-wysihtml5-dialog="insertImage" style="display: none;">
 *      <label>
 *        URL: <input data-wysihtml5-dialog-field="src" value="http://">
 *      </label>
 *      <label>
 *        Alternative text: <input data-wysihtml5-dialog-field="alt" value="">
 *      </label>
 *    </div>
 *
 *    <script>
 *      var dialog = new wysihtml5.toolbar.Dialog(
 *        $$("[data-wysihtml5-command='insertImage']").first(),
 *        $$("[data-wysihtml5-dialog='insertImage']").first()
 *      );
 *      dialog.observe("save", function(attributes) {
 *        // do something
 *      });
 *    </script>
 */
wysihtml5.toolbar.Dialog = Class.create(
  /** @scope wysihtml5.toolbar.Dialog.prototype */ {
  initialize: function(link, container) {
    this.link       = link;
    this.container  = container;
  },
  
  _observe: function() {
    if (this._observed) {
      return;
    }
    
    var callbackWrapper = function(event) {
      var attributes = this._serialize();
      if (attributes == this.elementToChange) {
        this.fire("edit", attributes);
      } else {
        this.fire("save", attributes);
      }
      this.hide();
      event.stop();
    }.bind(this);
    
    this.link.on("click", function(event) {
      if (this.link.hasClassName("wysihtml5-command-dialog-opened")) {
        setTimeout(this.hide.bind(this), 0);
      }
    }.bind(this));
    
    this.container.on("keydown", function(event) {
      if (event.keyCode === Event.KEY_RETURN) {
        callbackWrapper(event);
      }
      if (event.keyCode === Event.KEY_ESC) {
        this.hide();
      }
    }.bind(this));
    
    this.container.on("click", "[data-wysihtml5-dialog-action=save]", callbackWrapper);
    this.container.on("click", "[data-wysihtml5-dialog-action=cancel]", function(event) {
      this.fire("cancel");
      this.hide();
      event.stop();
    }.bind(this));
    
    this.container.select("input, select, textarea").invoke("on", "change", function() {
      clearInterval(this.interval);
    }.bind(this));
    
    this._observed = true;
  },
  
  /**
   * Grabs all fields in the dialog and puts them in key=>value style in an object which
   * then gets returned
   */
  _serialize: function() {
    var data = this.elementToChange || {};
    this.container.select("[data-wysihtml5-dialog-field]").each(function(field) {
      data[field.getAttribute("data-wysihtml5-dialog-field")] = field.getValue();
    });
    return data;
  },
  
  /**
   * Takes the attributes of the "elementToChange"
   * and inserts them in their corresponding dialog input fields
   * 
   * Assume the "elementToChange" looks like this:
   *    <a href="http://www.google.com" target="_blank">foo</a>
   *
   * and we have the following dialog:
   *    <input type="text" data-wysihtml5-dialog-field="href" value="">
   *    <input type="text" data-wysihtml5-dialog-field="target" value="">
   * 
   * after calling _interpolate() the dialog will look like this
   *    <input type="text" data-wysihtml5-dialog-field="href" value="http://www.google.com">
   *    <input type="text" data-wysihtml5-dialog-field="target" value="_blank">
   *
   * Basically it adopted the attribute values into the corresponding input fields
   *
   */
  _interpolate: function() {
    var focusedElement = document.querySelector(":focus");
    this.container.select("[data-wysihtml5-dialog-field]").each(function(field) {
      // Never change elements where the user is currently typing
      if (field === focusedElement) {
        return;
      }
      var fieldName = field.getAttribute("data-wysihtml5-dialog-field"),
          newValue  = this.elementToChange ? (this.elementToChange[fieldName] || "") : field.defaultValue;
      field.setValue(newValue);
    }.bind(this));
  },
  
  observe: function(eventName, handler) {
    this.container.on("dialog:" + eventName, function(event) { handler(event.memo); });
  },
  
  fire: function(eventName, data) {
    this.container.fire("dialog:" + eventName, data);
  },
  
  /**
   * Show the dialog element
   */
  show: function(elementToChange) {
    this.elementToChange = elementToChange;
    this._observe();
    this._interpolate();
    if (elementToChange) {
      this.interval = setInterval(this._interpolate.bind(this), 500);
    }
    this.link.addClassName("wysihtml5-command-dialog-opened");
    this.container.show();
    this.fire("show");
    var firstField = this.container.down("input, select, textarea");
    if (firstField && !elementToChange) {
      try {
        firstField.focus();
      } catch(e) {}
    }
  },
  
  /**
   * Hide the dialog element
   */
  hide: function() {
    clearInterval(this.interval);
    this.elementToChange = null;
    this.link.removeClassName("wysihtml5-command-dialog-opened");
    this.container.hide();
    this.fire("hide");
  }
});/**
 * Converts speech-to-text and inserts this into the editor
 * As of now (2011/03/25) this only is supported in Chrome >= 11
 *
 * Note that it sends the recorded audio to the google speech recognition api:
 * http://stackoverflow.com/questions/4361826/does-chrome-have-buil-in-speech-recognition-for-input-type-text-x-webkit-speec
 *
 * Current HTML5 draft can be found here
 * http://lists.w3.org/Archives/Public/public-xg-htmlspeech/2011Feb/att-0020/api-draft.html
 * 
 * "Accessing Google Speech API Chrome 11"
 * http://mikepultz.com/2011/03/accessing-google-speech-api-chrome-11/
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 */
wysihtml5.toolbar.Speech = (function() {
  var linkStyle = {
    position: "relative"
  };
  
  var inputStyle = {
    cursor:     "inherit",
    fontSize:   "50px",
    height:     "50px",
    marginTop:  "-25px",
    outline:    0,
    padding:    0,
    position:   "absolute",
    right:      "-12px",
    top:        "50%"
  };
  
  var wrapperStyle = {
    left:     0,
    margin:   0,
    opacity:  0,
    overflow: "hidden",
    padding:  0,
    position: "absolute",
    top:      0,
    zIndex:   1
  };
  
  var supportsSpeechInput = function(input) {
    var chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/) || [, 0];
    return chromeVersion[1] >= 11 && ("onwebkitspeechchange" in input || "speech" in input);
  };
  
  return function(parent, link) {
    var input = new Element("input");
    if (!supportsSpeechInput(input)) {
      link.hide();
      return;
    }
    
    var wrapper = new Element("div");
    
    Object.extend(wrapperStyle, {
      width:  link.getWidth()  + "px",
      height: link.getHeight() + "px"
    });
    
    input.setStyle(inputStyle).writeAttribute({ "x-webkit-speech": "", "speech": "" });
    wrapper.setStyle(wrapperStyle).insert(input);
    link.setStyle(linkStyle).insert(wrapper);
    
    var eventName = "onwebkitspeechchange" in input ? "webkitspeechchange" : "speechchange";
    input.on(eventName, function() {
      parent.execCommand("insertText", input.value);
      input.value = "";
    });
    
    wrapper.on("click", function(event) {
      if (link.hasClassName("wysihtml5-command-disabled")) {
        event.preventDefault();
      }
      
      event.stopPropagation();
    });
  };
})();/**
 * Toolbar
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Object} parent Reference to instance of Editor instance
 * @param {Element} container Reference to the toolbar container element
 *
 * @example
 *    <div id="toolbar">
 *      <a data-wysihtml5-command="createLink">insert link</a>
 *      <a data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h1">insert h1</a>
 *    </div>
 *
 *    <script>
 *      var toolbar = new wysihtml5.toolbar.Toolbar(editor, $("toolbar"));
 *    </script>
 */
wysihtml5.toolbar.Toolbar = Class.create(
  /** @scope wysihtml5.toolbar.Toolbar.prototype */ {
  initialize: function(parent, container) {
    this.parent     = parent;
    this.container  = $(container);
    this.composer   = parent.composer;
    
    this._getLinks("command");
    this._getLinks("action");
    
    this._observe();
    this.show();
    
    this.container.select("[data-wysihtml5-command=insertSpeech]").each(function(link) {
      new wysihtml5.toolbar.Speech(this, link);
    }.bind(this));
  },
  
  _getLinks: function(type) {
    var links   = this[type + "Links"] = this.container.select("a[data-wysihtml5-" + type + "]"),
        mapping = this[type + "Mapping"] = {};
    links.each(function(link) {
      var name    = link.getAttribute("data-wysihtml5-" + type),
          value   = link.getAttribute("data-wysihtml5-" + type + "-value"),
          dialog  = this._getDialog(link, name);
      
      mapping[name + ":" + value] = {
        link:   link,
        name:   name,
        value:  value,
        dialog: dialog,
        state:  false
      };
    }, this);
  },
  
  _getDialog: function(link, command) {
    var dialogElement = this.container.down("[data-wysihtml5-dialog='" + command + "']"),
        sandboxDoc    = this.composer.sandbox.getDocument(),
        dialog,
        caretBookmark;
    if (dialogElement) {
      dialog = new wysihtml5.toolbar.Dialog(link, dialogElement);
      
      dialog.observe("show", function() {
        caretBookmark = wysihtml5.utils.caret.getBookmark(sandboxDoc);
      });
      
      dialog.observe("save", function(attributes) {
        this.parent.focus(false);
        
        if (caretBookmark) {
          wysihtml5.utils.caret.setBookmark(caretBookmark);
        }
        this._execCommand(command, attributes);
      }.bind(this));
      
      dialog.observe("cancel", function() {
        this.parent.focus(false);
      }.bind(this));
    }
    return dialog;
  },
  
  /**
   * @example
   *    var toolbar = new wysihtml5.Toolbar();
   *    // Insert a <blockquote> element or wrap current selection in <blockquote>
   *    toolbar.execCommand("formatBlock", "blockquote");
   */
  execCommand: function(command, commandValue) {
    if (this.commandsDisabled) {
      return;
    }
    
    var commandObj = this.commandMapping[command + ":" + commandValue];
    
    // Show dialog when available
    if (commandObj && commandObj.dialog && !commandObj.state) {
      commandObj.dialog.show();
    } else {
      this._execCommand(command, commandValue);
    }
  },
  
  _execCommand: function(command, commandValue) {
    // Make sure that composer is focussed (false => don't move caret to the end)
    this.parent.focus(false);
    
    wysihtml5.commands.exec(this.composer.element, command, commandValue);
    this._updateLinkStates();
  },
  
  execAction: function(action) {
    switch(action) {
      case "change_view":
        if (this.parent.currentView === this.parent.textarea) {
          this.parent.fire("change_view", "composer");
        } else {
          this.parent.fire("change_view", "textarea");
        }
        break;
    }
  },
  
  _observe: function() {
    // 'javascript:;' and unselectable=on Needed for IE, but done in all browsers to make sure that all get the same css applied
    // (you know, a:link { ... } doesn't match anchors with missing href attribute)
    var links = [this.commandLinks, this.actionLinks].flatten();
    links.invoke("setAttribute", "href", "javascript:;");
    links.invoke("setAttribute", "unselectable", "on");
    
    // Needed for opera
    this.container.on("mousedown", "[data-wysihtml5-command]", function(event) { event.preventDefault(); });
    
    this.container.on("click", "[data-wysihtml5-command]", function(event) {
      var link          = event.target,
          command       = link.getAttribute("data-wysihtml5-command"),
          commandValue  = link.getAttribute("data-wysihtml5-command-value");
      this.execCommand(command, commandValue);
      event.preventDefault();
    }.bind(this));
    
    this.container.on("click", "[data-wysihtml5-action]", function(event) {
      var action = event.target.getAttribute("data-wysihtml5-action");
      this.execAction(action);
      event.preventDefault();
    }.bind(this));
    
    this.parent.observe("focus:composer", function() {
      this.bookmark = null;
      clearInterval(this.interval);
      this.interval = setInterval(this._updateLinkStates.bind(this), 500);
    }.bind(this));
    
    this.parent.observe("blur:composer", function() {
      clearInterval(this.interval);
    }.bind(this));
    
    this.parent.observe("destroy:composer", function() {
      clearInterval(this.interval);
    }.bind(this));
    
    this.parent.observe("change_view", function(event) {
      var currentView       = event.memo,
          disabledClassName = "wysihtml5-commands-disabled";
      // Set timeout needed in order to let the blur event fire first
      setTimeout(function() {
        this.commandsDisabled = (currentView !== "composer");
        this._updateLinkStates();
        if (this.commandsDisabled) {
          this.container.addClassName(disabledClassName);
        } else {
          this.container.removeClassName(disabledClassName);
        }
      }.bind(this), 0);
    }.bind(this));
  },
  
  _updateLinkStates: function() {
    var activeClassName   = "wysihtml5-command-active",
        disabledClassName = "wysihtml5-command-disabled",
        element           = this.composer.element,
        commandMapping    = this.commandMapping,
        i,
        state,
        command;
    // every millisecond counts... this is executed quite often
    // no library .each(), just a native speedy-gonzales "for"-loop
    for (i in commandMapping) {
      command = commandMapping[i];
      if (this.commandsDisabled) {
        state = false;
        command.link.addClassName(disabledClassName);
        if (command.dialog) {
          command.dialog.hide();
        }
      } else {
        state = wysihtml5.commands.state(element, command.name, command.value);
        if (Object.isArray(state)) {
          // Grab first and only object/element in state array, otherwise convert state into boolean
          // to avoid showing a dialog for multiple selected elements which may have different attributes
          // eg. when two links with different href are selected, the state will be an array consisting of both link elements
          // but the dialog interface can only update one
          state = state.length === 1 ? state[0] : true;
        }
        command.link.removeClassName(disabledClassName);
      }
      
      if (command.state === state) {
        continue;
      }
      
      command.state = state;
      if (state) {
        command.link.addClassName(activeClassName);
        if (command.dialog) {
          if (typeof(state) === "object") {
            command.dialog.show(state);
          } else {
            command.dialog.hide();
          }
        }
      } else {
        command.link.removeClassName(activeClassName);
        if (command.dialog) {
          command.dialog.hide();
        }
      }
    }
  },
  
  show: function() {
    this.container.show();
  },
  
  hide: function() {
    this.container.hide();
  }
});/**
 * Rich Text Query/Formatting Commands
 * 
 * @author Christopher Blum <christopher.blum@xing.com>
 */
wysihtml5.commands = {
  /**
   * Check whether the browser supports the given command
   *
   * @param {Object} element The element which has contentEditable=true
   * @param {String} command The command string which to check (eg. "bold", "italic", "insertUnorderedList")
   * @example
   *    wysihtml5.commands.supports(element, "createLink");
   */
  support: function(element, command) {
    return wysihtml5.browserSupports.command(element.ownerDocument, command);
  },
  
  /**
   * Check whether the browser supports the given command
   *
   * @param {Object} element The element which has contentEditable=true
   * @param {String} command The command string which to execute (eg. "bold", "italic", "insertUnorderedList")
   * @param {String} [value] The command value parameter, needed for some commands ("createLink", "insertImage", ...), optional for commands that don't require one ("bold", "underline", ...)
   * @example
   *    wysihtml5.commands.exec(element, "insertImage", "http://a1.twimg.com/profile_images/113868655/schrei_twitter_reasonably_small.jpg");
   */
  exec: function(element, command, value) {
    var obj     = this[command],
        method  = obj && obj.exec;
    if (method) {
      return method(element, command, value);
    } else {
      try {
        // try/catch for buggy firefox
        return element.ownerDocument.execCommand(command, false, value);
      } catch(e) {}
    }
  },
  
  /**
   * Check whether the current command is active
   * If the caret is within a bold text, then calling this with command "bold" should return true
   *
   * @param {Object} element The element which has contentEditable=true
   * @param {String} command The command string which to check (eg. "bold", "italic", "insertUnorderedList")
   * @param {String} [commandValue] The command value parameter (eg. for "insertImage" the image src)
   * @return {Boolean} Whether the command is active
   * @example
   *    var isCurrentSelectionBold = wysihtml5.commands.state(element, "bold");
   */
  state: function(element, command, commandValue) {
    var obj     = this[command],
        method  = obj && obj.state;
    if (method) {
      // TODO: Consider to pass the selectedNode as element instead of the contentEditable
      return method(element, command, commandValue);
    } else {
      try {
        // try/catch for buggy firefox
        return element.ownerDocument.queryCommandState(command);
      } catch(e) {
        return false;
      }
    }
  },
  
  /**
   * Get the current command's value
   *
   * @param {Object} element The element which has contentEditable=true
   * @param {String} command The command string which to check (eg. "formatBlock")
   * @return {String} The command value
   * @example
   *    var currentBlockElement = wysihtml5.commands.value(element, "formatBlock");
   */
  value: function(element, command) {
    var obj     = this[command],
        method  = obj && obj.value;
    if (method) {
      method(element, command);
    } else {
      try {
        // try/catch for buggy firefox
        return element.ownerDocument.queryCommandValue(command);
      } catch(e) {
        return null;
      }
    }
  }
};wysihtml5.commands.bold = (function() {
  var undef;
  
  function exec(element, command) {
    return wysihtml5.commands.formatInline.exec(element, command, "b");
  }
  
  function state(element, command, color) {
    // element.ownerDocument.queryCommandState("bold") results:
    // firefox: only <b>
    // chrome:  <b>, <strong>, <h1>, <h2>, ...
    // ie:      <b>, <strong>
    // opera:   <b>, <strong>
    return wysihtml5.commands.formatInline.state(element, command, "b");
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.createLink = (function() {
  var undef,
      NODE_NAME = "A";
  
  function _removeFormat(element, anchors) {
    var length = anchors.length,
        i      = 0,
        anchor,
        codeElement,
        textContent;
    for (; i<length; i++) {
      anchor      = anchors[i];
      codeElement = wysihtml5.utils.getParentElement(anchor, { nodeName: "code" });
      textContent = wysihtml5.utils.getTextContent(anchor);
      
      // if <a> contains url-like text content, rename it to <code> to prevent re-autolinking
      // else replace <a> with its childNodes
      if (textContent.match(wysihtml5.utils.autoLink.URL_REG_EXP) && !codeElement) {
        // <code> element is used to prevent later auto-linking of the content
        codeElement = wysihtml5.utils.renameElement(anchor, "code");
      } else {
        wysihtml5.utils.unwrap(anchor);
      }
    }
  }
  
  function _format(element, attributes) {
    var doc             = element.ownerDocument,
        tempClass       = "_wysihtml5-temp-" + new Date().getTime(),
        tempClassRegExp = /non-matching-class/g,
        i               = 0,
        length,
        anchors,
        anchor,
        hasElementChild,
        isEmpty,
        elementToSetCaretAfter,
        textContent,
        whiteSpace,
        j;
    wysihtml5.commands.formatInline.exec(element, undef, NODE_NAME, tempClass, tempClassRegExp);
    anchors = doc.querySelectorAll(NODE_NAME + "." + tempClass);
    length  = anchors.length;
    for (; i<length; i++) {
      anchor = anchors[i];
      anchor.removeAttribute("class");
      for (j in attributes) {
        anchor.setAttribute(j, attributes[j]);
      }
    }
    
    elementToSetCaretAfter = anchor;
    if (length === 1) {
      textContent = wysihtml5.utils.getTextContent(anchor);
      hasElementChild = !!anchor.querySelector("*");
      isEmpty = textContent === "" || textContent === "\uFEFF";
      if (!hasElementChild && isEmpty) {
        wysihtml5.utils.setTextContent(anchor, anchor.href);
        whiteSpace = doc.createTextNode(" ");
        wysihtml5.utils.caret.setAfter(anchor);
        wysihtml5.utils.caret.insertNode(whiteSpace);
        elementToSetCaretAfter = whiteSpace;
      }
    }
    wysihtml5.utils.caret.setAfter(elementToSetCaretAfter);
  }
  
  /**
   * TODO: Use cssapplier or formatInline here
   *
   * Turns selection into a link
   * If selection is already a link, it removes the link and wraps it with a <code> element
   * The <code> element is needed to avoid auto linking
   * 
   * @example
   *    // either ...
   *    wysihtml5.commands.createLink.exec(element, "createLink", "http://www.google.de");
   *    // ... or ...
   *    wysihtml5.commands.createLink.exec(element, "createLink", { href: "http://www.google.de", target: "_blank" });
   */
  function exec(element, command, value) {
    var doc           = element.ownerDocument,
        anchors       = state(element, command);
    
    if (anchors) {
      // Selection contains links
      wysihtml5.utils.caret.executeAndRestore(doc, function() {
        _removeFormat(element, anchors);
      });
    } else {
      // Create links
      value = typeof(value) === "object" ? value : { href: value };
      _format(element, value);
    }
  }
  
  function state(element, command) {
    return wysihtml5.commands.formatInline.state(element, command, "A");
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();/**
 * execCommand("fontSize") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 */
wysihtml5.commands.fontSize = (function() {
  var undef,
      REG_EXP = /wysiwyg-font-size-[a-z]+/g;
  
  function exec(element, command, size) {
    return wysihtml5.commands.formatInline.exec(element, command, "span", "wysiwyg-font-size-" + size, REG_EXP);
  }
  
  function state(element, command, size) {
    return wysihtml5.commands.formatInline.state(element, command, "span", "wysiwyg-font-size-" + size, REG_EXP);
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();/**
 * execCommand("foreColor") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 */
wysihtml5.commands.foreColor = (function() {
  var undef,
      REG_EXP = /wysiwyg-color-[a-z]+/g;
  
  function exec(element, command, color) {
    return wysihtml5.commands.formatInline.exec(element, command, "span", "wysiwyg-color-" + color, REG_EXP);
  }
  
  function state(element, command, color) {
    return wysihtml5.commands.formatInline.state(element, command, "span", "wysiwyg-color-" + color, REG_EXP);
  }
  
  function value() {
    // TODO
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.formatBlock = (function() {
  var undef,
      DEFAULT_NODE_NAME       = "DIV",
      // Following elements are grouped
      // when the caret is within a H1 and the H4 is invoked, the H1 should turn into H4
      // instead of creating a H4 within a H1 which would result in semantically invalid html
      BLOCK_ELEMENTS_GROUP    = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "BLOCKQUOTE", DEFAULT_NODE_NAME];
  
  /**
   * Remove similiar classes (based on classRegExp)
   * and add the desired class name
   */
  function _addClass(element, className, classRegExp) {
    if (element.className) {
      _removeClass(element, classRegExp);
      element.className += " " + className;
    } else {
      element.className = className;
    }
  }
  
  function _removeClass(element, classRegExp) {
    element.className = element.className.replace(classRegExp, "");
  }
  
  /**
   * Check whether given node is a text node and whether it's empty
   */
  function _isBlankTextNode(node) {
    return node.nodeType === Node.TEXT_NODE && String(node.data).blank();
  }
  
  /**
   * Returns previous sibling node that is not a blank text node
   */
  function _getPreviousSiblingThatIsNotBlank(node) {
    var previousSibling = node.previousSibling;
    while (previousSibling && _isBlankTextNode(previousSibling)) {
      previousSibling = previousSibling.previousSibling;
    }
    return previousSibling;
  }
  
  /**
   * Returns next sibling node that is not a blank text node
   */
  function _getNextSiblingThatIsNotBlank(node) {
    var nextSibling = node.nextSibling;
    while (nextSibling && _isBlankTextNode(nextSibling)) {
      nextSibling = nextSibling.nextSibling;
    }
    return nextSibling;
  }
  
  /**
   * Adds line breaks before and after the given node if the previous and next siblings
   * aren't already causing a visual line break (block element or <br>)
   */
  function _addLineBreakBeforeAndAfter(node) {
    var doc             = node.ownerDocument,
        nextSibling     = _getNextSiblingThatIsNotBlank(node),
        previousSibling = _getPreviousSiblingThatIsNotBlank(node);
    
    if (nextSibling && !_isLineBreakOrBlockElement(nextSibling)) {
      node.parentNode.insertBefore(doc.createElement("br"), nextSibling);
    }
    if (previousSibling && !_isLineBreakOrBlockElement(previousSibling)) {
      node.parentNode.insertBefore(doc.createElement("br"), node);
    }
  }
  
  /**
   * Removes line breaks before and after the given node
   */
  function _removeLineBreakBeforeAndAfter(node) {
    var nextSibling     = _getNextSiblingThatIsNotBlank(node),
        previousSibling = _getPreviousSiblingThatIsNotBlank(node);
    
    if (nextSibling && _isLineBreak(nextSibling)) {
      nextSibling.parentNode.removeChild(nextSibling);
    }
    if (previousSibling && _isLineBreak(previousSibling)) {
      previousSibling.parentNode.removeChild(previousSibling);
    }
  }
  
  function _removeLastChildIfLineBreak(node) {
    var lastChild = node.lastChild;
    if (lastChild && _isLineBreak(lastChild)) {
      lastChild.parentNode.removeChild(lastChild);
    }
  }
  
  function _isLineBreak(node) {
    return node.nodeName === "BR";
  }
  
  /**
   * Checks whether the elment causes a visual line break
   * (<br> or block elements)
   */
  function _isLineBreakOrBlockElement(element) {
    if (_isLineBreak(element)) {
      return true;
    }
    
    if (wysihtml5.utils.getStyle(element, "display") === "block") {
      return true;
    }
    
    return false;
  }
  
  /**
   * Execute native query command
   * and if necessary modify the inserted node's className
   */
  function _execCommand(doc, command, nodeName, className) {
    if (className) {
      var eventListener = wysihtml5.utils.observe(doc, "DOMNodeInserted", function(event) {
        var target = event.target,
            displayStyle;
        if (target.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        displayStyle  = wysihtml5.utils.getStyle(target, "display");
        if (displayStyle.substr(0, 6) !== "inline") {
          // Make sure that only block elements receive the given class
          target.className += " " + className;
        }
      });
    }
    doc.execCommand(command, false, nodeName);
    if (eventListener) {
      eventListener.stop();
    }
  }
  
  function _selectLineAndWrap(element) {
    wysihtml5.utils.caret.selectLine(element.ownerDocument);
    wysihtml5.utils.caret.surround(element);
    _removeLineBreakBeforeAndAfter(element);
    _removeLastChildIfLineBreak(element);
    wysihtml5.utils.caret.selectNode(element);
  }
  
  function _hasClasses(element) {
    return !!element.className.replace(/^\s+/, "").replace(/\s+$/, "");
  }
  
  function exec(element, command, nodeName, className, classRegExp) {
    var doc          = element.ownerDocument,
        blockElement = state(element, command, nodeName, className, classRegExp),
        keepClassName,
        selectedNode;
    
    nodeName = typeof(nodeName) === "string" ? nodeName.toUpperCase() : nodeName;
    
    if (blockElement) {
      wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
        if (classRegExp) {
          _removeClass(blockElement, classRegExp);
        }
        var hasClasses = _hasClasses(blockElement);
        if (!hasClasses && blockElement.nodeName === (nodeName || DEFAULT_NODE_NAME)) {
          // Insert a line break afterwards and beforewards when there are siblings
          // that are not of type line break or block element
          _addLineBreakBeforeAndAfter(blockElement);
          wysihtml5.utils.unwrap(blockElement);
        } else if (hasClasses) {
          // Make sure that styling is kept by renaming the element to <div> and copying over the class name
          wysihtml5.utils.renameElement(blockElement, DEFAULT_NODE_NAME);
        }
      });
      return;
    }
    
    // Find similiar block element and rename it (<h2 class="foo"></h2>  =>  <h1 class="foo"></h1>)
    if (nodeName === null || BLOCK_ELEMENTS_GROUP.indexOf(nodeName) !== -1) {
      selectedNode = wysihtml5.utils.caret.getSelectedNode(doc);
      blockElement = wysihtml5.utils.getParentElement(selectedNode, {
        nodeName:     BLOCK_ELEMENTS_GROUP
      });
      
      if (blockElement) {
        wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
          // Rename current block element to new block element and add class
          if (nodeName) {
            blockElement = wysihtml5.utils.renameElement(blockElement, nodeName);
          }
          if (className) {
            _addClass(blockElement, className, classRegExp);
          }
        });
        return;
      }
    }
    
    if (wysihtml5.commands.support(element, command)) {
      _execCommand(doc, command, nodeName || DEFAULT_NODE_NAME, className);
      return;
    }
    
    blockElement = doc.createElement(nodeName || DEFAULT_NODE_NAME);
    if (className) {
      blockElement.className = className;
    }
    _selectLineAndWrap(blockElement);
  }
  
  function state(element, command, nodeName, className, classRegExp) {
    nodeName = typeof(nodeName) === "string" ? nodeName.toUpperCase() : nodeName;
    var selectedNode = wysihtml5.utils.caret.getSelectedNode(element.ownerDocument);
    return wysihtml5.utils.getParentElement(selectedNode, {
      nodeName:     nodeName,
      className:    className,
      classRegExp:  classRegExp
    });
  }
  
  function value(element, command) {
    return undef;
  }
  
  return {
    BLOCK_ELEMENTS_GROUP: BLOCK_ELEMENTS_GROUP,
    exec:   exec,
    state:  state,
    value:  value
  };
})();/**
 * formatInline scenarios for tag "B" (| = caret, |foo| = selected text)
 *
 *   #1 caret in unformatted text:
 *      abcdefg|
 *   output:
 *      abcdefg<b>|</b>
 *   
 *   #2 unformatted text selected:
 *      abc|deg|h
 *   output:
 *      abc<b>|deg|</b>h
 *   
 *   #3 unformatted text selected across boundaries:
 *      ab|c <span>defg|h</span>
 *   output:
 *      ab<b>|c </b><span><b>defg</b>|h</span>
 *
 *   #4 formatted text entirely selected
 *      <b>|abc|</b>
 *   output:
 *      |abc|
 *
 *   #5 formatted text partially selected
 *      <b>ab|c|</b>
 *   output:
 *      <b>ab</b>|c|
 *
 *   #6 formatted text selected across boundaries
 *      <span>ab|c</span> <b>de|fgh</b>
 *   output:
 *      <span>ab|c</span> de|<b>fgh</b>
 */
wysihtml5.commands.formatInline = (function() {
  var undef,
      // Treat <b> as <strong> and vice versa
      ALIAS_MAPPING = {
        "strong": "b",
        "em":     "i",
        "b":      "strong",
        "i":      "em"
      },
      cssClassApplier = {};
  
  function _getTagNames(tagName) {
    var alias = ALIAS_MAPPING[tagName];
    return alias ? [tagName.toLowerCase(), alias.toLowerCase()] : [tagName.toLowerCase()];
  }
  
  function _getApplier(tagName, className, classRegExp) {
    var identifier = tagName + ":" + className;
    if (!cssClassApplier[identifier]) {
      cssClassApplier[identifier] = rangy.createCssClassApplier(_getTagNames(tagName), className, classRegExp, true);
    }
    return cssClassApplier[identifier];
  }
  
  function exec(element, command, tagName, className, classRegExp) {
    var range = wysihtml5.utils.caret.getRange(element.ownerDocument);
    if (!range) {
      return false;
    }
    _getApplier(tagName, className, classRegExp).toggleRange(range);
    wysihtml5.utils.caret.setSelection(range);
  }
  
  function state(element, command, tagName, className, classRegExp) {
    var doc           = element.ownerDocument,
        aliasTagName  = ALIAS_MAPPING[tagName] || tagName,
        range;
    
    // Check whether the document contains a node with the desired tagName
    if (!wysihtml5.utils.hasElementWithTagName(doc, tagName) &&
        !wysihtml5.utils.hasElementWithTagName(doc, aliasTagName)) {
      return false;
    }
     
     // Check whether the document contains a node with the desired className
    if (className && !wysihtml5.utils.hasElementWithClassName(doc, className)) {
       return false;
    }
    
    range = wysihtml5.utils.caret.getRange(doc);
    if (!range) {
      return false;
    }
    
    return _getApplier(tagName, className, classRegExp).isAppliedToRange(range);
  }
  
  function value(element, command) {
    // TODO
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.insertHTML = (function() {
  var undef;
  
  function exec(element, command, html) {
    if (wysihtml5.commands.support(element, command)) {
      element.ownerDocument.execCommand(command, false, html);
    } else {
      wysihtml5.utils.caret.insertHTML(element.ownerDocument, html);
    }
  }
  
  function state() {
    return false;
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.insertImage = (function() {
  var NODE_NAME = "IMG",
      WHITE_SPACE_START_REG_EXP = /^\s+/,
      WHITE_SPACE_END_REG_EXP   = /\s+$/;
  
  /**
   * Inserts an <img>
   * If selection is already an image link, it removes it
   * 
   * @example
   *    // either ...
   *    wysihtml5.commands.insertImage.exec(element, "insertImage", "http://www.google.de/logo.jpg");
   *    // ... or ...
   *    wysihtml5.commands.insertImage.exec(element, "insertImage", { src: "http://www.google.de/logo.jpg", title: "foo" });
   */
  function exec(element, command, value) {
    value = typeof(value) === "object" ? value : { src: value };
    
    var doc   = element.ownerDocument,
        image = state(element),
        i,
        parent;
    
    if (image) {
      // Image already selected, set the caret before it and delete it
      wysihtml5.utils.caret.setBefore(image);
      parent = image.parentNode;
      parent.removeChild(image);
      
      // and it's parent <a> too if it hasn't got any other relevant child nodes
      wysihtml5.utils.removeEmptyTextNodes(parent);
      if (parent.nodeName === "A" && !parent.firstChild) {
        wysihtml5.utils.caret.setAfter(parent);
        parent.parentNode.removeChild(parent);
      }
      
      // firefox and ie sometimes don't remove the image handles, even though the image got removed
      wysihtml5.quirks.redraw(element);
      return;
    }
    
    image = doc.createElement(NODE_NAME);
    
    for (i in value) {
      image[i] = value[i];
    }
    
    wysihtml5.utils.caret.insertNode(image);
    wysihtml5.utils.caret.setAfter(image);
  }
  
  function state(element) {
    var doc = element.ownerDocument,
        selectedNode,
        trimmedText,
        imagesInSelection;
    
    if (!wysihtml5.utils.hasElementWithTagName(doc, NODE_NAME)) {
      return false;
    }
    
    selectedNode = wysihtml5.utils.caret.getSelectedNode(doc);
    if (!selectedNode) {
      return false;
    }
    
    if (selectedNode.nodeName === NODE_NAME) {
      // This works perfectly in IE
      return selectedNode;
    }
    
    if (selectedNode.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    
    trimmedText = wysihtml5.utils.caret.getText(doc)
      .replace(WHITE_SPACE_START_REG_EXP, "")
      .replace(WHITE_SPACE_END_REG_EXP, "");
    if (trimmedText) {
      return false;
    }
    
    imagesInSelection = wysihtml5.utils.caret.getNodes(doc, Node.ELEMENT_NODE, function(node) {
      return node.nodeName === "IMG";
    });
    
    if (imagesInSelection.length !== 1) {
      return false;
    }
    
    return imagesInSelection[0];
  }
  
  function value(element) {
    var image = state(element);
    return image && image.src;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.insertLineBreak = (function() {
  var undef,
      LINE_BREAK = "<br>" + (Prototype.Browser.Opera ? " " : "");
  
  function exec(element, command) {
    if (wysihtml5.commands.support(element, command)) {
      element.ownerDocument.execCommand(command, false, null);
      if (!wysihtml5.browserSupports.autoScrollIntoViewOfCaret()) {
        wysihtml5.utils.caret.scrollIntoView(element);
      }
    } else {
      wysihtml5.commands.exec(element, "insertHTML", LINE_BREAK);
    }
  }
  
  function state() {
    return false;
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.insertOrderedList = (function() {
  var undef;
  
  function exec(element, command) {
    var doc = element.ownerDocument,
        selectedNode,
        isEmpty,
        tempElement,
        list;
    
    if (wysihtml5.commands.support(element, command)) {
      doc.execCommand(command, false, null);
    } else {
      selectedNode = wysihtml5.utils.caret.getSelectedNode(doc);
      list = wysihtml5.utils.getParentElement(selectedNode, { nodeName: ["UL", "OL"] }, 4);
      if (!list) {
        tempElement = doc.createElement("span");
        wysihtml5.utils.caret.surround(tempElement);
        isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === "\uFEFF";
        wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
          list = wysihtml5.utils.convertIntoList(tempElement, "ol");
        });
        
        if (isEmpty) {
          wysihtml5.utils.caret.selectNode(list.querySelector("li"));
        }
        return;
      }
      
      wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
        if (list.nodeName === "OL") {
          // Unwrap list
          // <ol><li>foo</li><li>bar</li></ol>
          // becomes:
          // foo<br>bar<br>
          wysihtml5.utils.resolveList(list);
        } else if (list.nodeName === "UL" || list.nodeName === "MENU") {
          // Turn an unordered list into an ordered list
          // <ul><li>foo</li><li>bar</li></ul>
          // becomes:
          // <ol><li>foo</li><li>bar</li></ol>
          wysihtml5.utils.renameElement(list, "ol");
        }
      });
    }
  }
  
  function state(element, command) {
    try {
      return element.ownerDocument.queryCommandState(command);
    } catch(e) {
      return false;
    }
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.insertUnorderedList = (function() {
  var undef;
  
  function exec(element, command) {
    var doc = element.ownerDocument,
        selectedNode,
        isEmpty,
        tempElement,
        list;
    
    if (wysihtml5.commands.support(element, command)) {
      doc.execCommand(command, false, null);
    } else {
      selectedNode = wysihtml5.utils.caret.getSelectedNode(doc);
      list = wysihtml5.utils.getParentElement(selectedNode, { nodeName: ["UL", "OL"] });
      
      if (!list) {
        tempElement = doc.createElement("span");
        wysihtml5.utils.caret.surround(tempElement);
        isEmpty = tempElement.innerHTML === "" || tempElement.innerHTML === "\uFEFF";
        wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
          list = wysihtml5.utils.convertIntoList(tempElement, "ul");
        });
        
        if (isEmpty) {
          wysihtml5.utils.caret.selectNode(list.querySelector("li"));
        }
        return;
      }
      
      wysihtml5.utils.caret.executeAndRestoreSimple(doc, function() {
        if (list.nodeName === "UL") {
          // Unwrap list
          // <ul><li>foo</li><li>bar</li></ul>
          // becomes:
          // foo<br>bar<br>
          wysihtml5.utils.resolveList(list);
        } else if (list.nodeName === "OL" || list.nodeName === "MENU") {
          // Turn an ordered list into an unordered list
          // <ol><li>foo</li><li>bar</li></ol>
          // becomes:
          // <ul><li>foo</li><li>bar</li></ul>
          wysihtml5.utils.renameElement(list, "ul");
        }
      });
    }
  }
  
  function state(element, command) {
    try {
      return element.ownerDocument.queryCommandState(command);
    } catch(e) {
      return false;
    }
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.italic = (function() {
  var undef;
  
  function exec(element, command) {
    return wysihtml5.commands.formatInline.exec(element, command, "i");
  }
  
  function state(element, command, color) {
    // element.ownerDocument.queryCommandState("italic") results:
    // firefox: only <i>
    // chrome:  <i>, <em>, <blockquote>, ...
    // ie:      <i>, <em>
    // opera:   only <i>
    return wysihtml5.commands.formatInline.state(element, command, "i");
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.justifyCenter = (function() {
  var undef,
      CLASS_NAME  = "wysiwyg-text-align-center",
      REG_EXP     = /wysiwyg-text-align-[a-z]+/g;
  
  function exec(element, command) {
    return wysihtml5.commands.formatBlock.exec(element, "formatBlock", null, CLASS_NAME, REG_EXP);
  }
  
  function state(element, command) {
    return wysihtml5.commands.formatBlock.state(element, "formatBlock", null, CLASS_NAME, REG_EXP);
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.justifyLeft = (function() {
  var undef,
      CLASS_NAME  = "wysiwyg-text-align-left",
      REG_EXP     = /wysiwyg-text-align-[a-z]+/g;
  
  function exec(element, command) {
    return wysihtml5.commands.formatBlock.exec(element, "formatBlock", null, CLASS_NAME, REG_EXP);
  }
  
  function state(element, command) {
    return wysihtml5.commands.formatBlock.state(element, "formatBlock", null, CLASS_NAME, REG_EXP);
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.justifyRight = (function() {
  var undef,
      CLASS_NAME  = "wysiwyg-text-align-right",
      REG_EXP     = /wysiwyg-text-align-[a-z]+/g;
  
  function exec(element, command) {
    return wysihtml5.commands.formatBlock.exec(element, "formatBlock", null, CLASS_NAME, REG_EXP);
  }
  
  function state(element, command) {
    return wysihtml5.commands.formatBlock.state(element, "formatBlock", null, CLASS_NAME, REG_EXP);
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();wysihtml5.commands.underline = (function() {
  var undef,
      REG_EXP     = /wysiwyg-text-decoration-underline/g,
      CLASS_NAME  = "wysiwyg-text-decoration-underline";
  
  function exec(element, command) {
    return wysihtml5.commands.formatInline.exec(element, command, "span", CLASS_NAME, REG_EXP);
  }
  
  function state(element, command) {
    return wysihtml5.commands.formatInline.state(element, command, "span", CLASS_NAME, REG_EXP);
  }
  
  function value() {
    return undef;
  }
  
  return {
    exec:   exec,
    state:  state,
    value:  value
  };
})();/**
 * WYSIHTML5 Editor
 *
 * @author Christopher Blum <christopher.blum@xing.com>
 * @param {Element} textareaElement Reference to the textarea which should be turned into a rich text interface
 * @param {Object} [config] See defaultConfig object below for explanation of each individual config option
 *
 * @events
 *    load
 *    beforeload (for internal use only)
 *    focus
 *    focus:composer
 *    focus:textarea
 *    blur
 *    blur:composer
 *    blur:textarea
 *    change
 *    change:composer
 *    change:textarea
 *    paste
 *    paste:composer
 *    paste:textarea
 *    newword:composer
 *    destroy:composer
 *    change_view
 */
wysihtml5.Editor = (function() {
  var defaultConfig = {
    // Give the editor a name, the name will also be set as class name on the iframe and on the iframe's body 
    name:                 null,
    // Whether the editor should look like the textarea (by adopting styles)
    style:                true,
    // Id of the toolbar element, pass falsey value if you don't want any toolbar logic
    toolbar:              null,
    // Whether urls, entered by the user should automatically become clickable-links
    autoLink:             true,
    // Object which includes parser rules to apply when html gets inserted via copy & paste
    parserRules:          null,
    // Parser method to use when the user inserts content via copy & paste
    parser:               wysihtml5.utils.sanitizeHTML || Prototype.K,
    // Class name which should be set on the contentEditable element in the created sandbox iframe, can be styled via the 'stylesheets' option
    composerClassName:    "wysihtml5-editor",
    // Class name to add to the body when the wysihtml5 editor is supported
    bodyClassName:        "wysihtml5-supported",
    // Array (or single string) of stylesheet urls to be loaded in the editor's iframe
    stylesheets:          [],
    // Placeholder text to use, defaults to the placeholder attribute on the textarea element
    placeholderText:      null,
    // Whether the composer should allow the user to manually resize images, tables etc.
    allowObjectResizing:  true
  };
  
  // Incremental instance id
  var instanceId = new Date().getTime();
  
  return Class.create(
    /** @scope wysihtml5.Editor.prototype */ {
    initialize: function(textareaElement, config) {
      this._instanceId      = ++instanceId;
      this.textareaElement  = $(textareaElement);
      this.config           = Object.extend(Object.clone(defaultConfig), config);
      this.textarea         = new wysihtml5.views.Textarea(this, this.textareaElement, this.config);
      this.currentView      = this.textarea;
      this._isCompatible    = wysihtml5.browserSupports.contentEditable();
      
      // Sort out unsupported browsers here
      if (!this._isCompatible) {
        (function() { this.fire("beforeload").fire("load"); }).bind(this).defer();
        return;
      }
      
      // Add class name to body, to indicate that the editor is supported
      $(document.body).addClassName(this.config.bodyClassName);
      
      this.composer = new wysihtml5.views.Composer(this, this.textareaElement, this.config);
      this.currentView = this.composer;
      
      if (Object.isFunction(this.config.parser)) {
        this._initParser();
      }
      
      this.observe("beforeload", function() {
        this.synchronizer = new wysihtml5.utils.Synchronizer(this, this.textarea, this.composer);
        if (this.config.toolbar) {
          this.toolbar = new wysihtml5.toolbar.Toolbar(this, this.config.toolbar);
        }
      }.bind(this));
      
      try {
        console.log("Heya! This page is using wysihtml5 for rich text editing. Check out https://github.com/xing/wysihtml5");
      } catch(e) {}
    },
    
    isCompatible: function() {
      return this._isCompatible;
    },
    
    observe: function() {
      Element.observe.apply(Element, this._getEventArguments(arguments));
      return this;
    },

    fire: function() {
      Element.fire.apply(Element, this._getEventArguments(arguments));
      return this;
    },

    stopObserving: function() {
      Element.stopObserving.apply(Element, this._getEventArguments(arguments));
      return this;
    },

    /**
     * Builds an array that can be passed into Function.prototyope.apply
     * when called on Element.observe, Element.stopObserving, Element.fire
     */
    _getEventArguments: function(args) {
      args = $A(args);
      if (args[0]) {
        args[0] = "wysihtml5:" + this._instanceId + ":" + args[0];
      }
      return [document.documentElement, args].flatten();
    },

    clear: function() {
      this.currentView.clear();
      return this;
    },

    getValue: function(parse) {
      return this.currentView.getValue(parse);
    },

    setValue: function(html, parse) {
      if (!html) {
        return this.clear();
      }
      this.currentView.setValue(html, parse);
      return this;
    },

    focus: function(setToEnd) {
      this.currentView.focus(setToEnd);
      return this;
    },

    /**
     * Deactivate editor (make it readonly)
     */
    disable: function() {
      this.currentView.disable();
      return this;
    },
    
    /**
     * Activate editor
     */
    enable: function() {
      this.currentView.enable();
      return this;
    },
    
    isEmpty: function() {
      return this.currentView.isEmpty();
    },
    
    hasPlaceholderSet: function() {
      return this.currentView.hasPlaceholderSet();
    },
    
    parse: function(htmlOrElement) {
      var returnValue = this.config.parser(htmlOrElement, this.config.parserRules, this.composer.sandbox.getDocument(), true);
      if (typeof(htmlOrElement) === "object") {
        wysihtml5.quirks.redraw(htmlOrElement);
      }
      return returnValue;
    },
    
    /**
     * Prepare html parser logic
     *  - Loads parser rules if config.parserRules is a string
     *  - Observes for paste and drop
     */
    _initParser: function() {
      if (typeof(this.config.parserRules) === "string") {
        new Ajax.Request(this.config.parserRules, {
          method:   "get",
          onCreate: function() {
            this.config.parserRules = defaultConfig.parserRules;
          }.bind(this),
          onSuccess: function(transport) {
            this.config.parserRules = transport.responseJSON || transport.responseText.evalJSON();
          }.bind(this)
        });
      }
      
      this.observe("paste:composer", function() {
        var keepScrollPosition = true;
        wysihtml5.utils.caret.executeAndRestore(this.composer.sandbox.getDocument(), function() {
          wysihtml5.quirks.cleanPastedHTML(this.composer.element);
          this.parse(this.composer.element);
        }.bind(this), keepScrollPosition);
      }.bind(this));
      
      this.observe("paste:textarea", function() {
        var value   = this.textarea.getValue(),
            newValue;
        newValue = this.parse(value);
        this.textarea.setValue(newValue);
      }.bind(this));
    }
  });
})();
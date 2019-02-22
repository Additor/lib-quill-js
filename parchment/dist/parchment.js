(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Parchment"] = factory();
	else
		root["Parchment"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/attributor/attributor.ts":
/*!**************************************!*\
  !*** ./src/attributor/attributor.ts ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Attributor; });
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../scope */ "./src/scope.ts");

class Attributor {
    static keys(node) {
        return Array.from(node.attributes).map((item) => item.name);
    }
    constructor(attrName, keyName, options = {}) {
        this.attrName = attrName;
        this.keyName = keyName;
        const attributeBit = _scope__WEBPACK_IMPORTED_MODULE_0__["default"].TYPE & _scope__WEBPACK_IMPORTED_MODULE_0__["default"].ATTRIBUTE;
        this.scope =
            options.scope != null
                ? // Ignore type bits, force attribute bit
                    (options.scope & _scope__WEBPACK_IMPORTED_MODULE_0__["default"].LEVEL) | attributeBit
                : _scope__WEBPACK_IMPORTED_MODULE_0__["default"].ATTRIBUTE;
        if (options.whitelist != null) {
            this.whitelist = options.whitelist;
        }
    }
    add(node, value) {
        if (!this.canAdd(node, value)) {
            return false;
        }
        node.setAttribute(this.keyName, value);
        return true;
    }
    canAdd(_node, value) {
        if (this.whitelist == null) {
            return true;
        }
        if (typeof value === 'string') {
            return this.whitelist.indexOf(value.replace(/["']/g, '')) > -1;
        }
        else {
            return this.whitelist.indexOf(value) > -1;
        }
    }
    remove(node) {
        node.removeAttribute(this.keyName);
    }
    value(node) {
        const value = node.getAttribute(this.keyName);
        if (this.canAdd(node, value) && value) {
            return value;
        }
        return '';
    }
}


/***/ }),

/***/ "./src/attributor/class.ts":
/*!*********************************!*\
  !*** ./src/attributor/class.ts ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _attributor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./attributor */ "./src/attributor/attributor.ts");

function match(node, prefix) {
    const className = node.getAttribute('class') || '';
    return className
        .split(/\s+/)
        .filter(name => name.indexOf(`${prefix}-`) === 0);
}
class ClassAttributor extends _attributor__WEBPACK_IMPORTED_MODULE_0__["default"] {
    static keys(node) {
        return (node.getAttribute('class') || '').split(/\s+/).map(name => name
            .split('-')
            .slice(0, -1)
            .join('-'));
    }
    add(node, value) {
        if (!this.canAdd(node, value)) {
            return false;
        }
        this.remove(node);
        node.classList.add(`${this.keyName}-${value}`);
        return true;
    }
    remove(node) {
        const matches = match(node, this.keyName);
        matches.forEach(name => {
            node.classList.remove(name);
        });
        if (node.classList.length === 0) {
            node.removeAttribute('class');
        }
    }
    value(node) {
        const result = match(node, this.keyName)[0] || '';
        const value = result.slice(this.keyName.length + 1); // +1 for hyphen
        return this.canAdd(node, value) ? value : '';
    }
}
/* harmony default export */ __webpack_exports__["default"] = (ClassAttributor);


/***/ }),

/***/ "./src/attributor/store.ts":
/*!*********************************!*\
  !*** ./src/attributor/store.ts ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../registry */ "./src/registry.ts");
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../scope */ "./src/scope.ts");
/* harmony import */ var _attributor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./attributor */ "./src/attributor/attributor.ts");
/* harmony import */ var _class__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./class */ "./src/attributor/class.ts");
/* harmony import */ var _style__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./style */ "./src/attributor/style.ts");





class AttributorStore {
    constructor(domNode) {
        this.attributes = {};
        this.domNode = domNode;
        this.build();
    }
    attribute(attribute, value) {
        // verb
        if (value) {
            if (attribute.add(this.domNode, value)) {
                if (attribute.value(this.domNode) != null) {
                    this.attributes[attribute.attrName] = attribute;
                }
                else {
                    delete this.attributes[attribute.attrName];
                }
            }
        }
        else {
            attribute.remove(this.domNode);
            delete this.attributes[attribute.attrName];
        }
    }
    build() {
        this.attributes = {};
        const blot = _registry__WEBPACK_IMPORTED_MODULE_0__["default"].find(this.domNode);
        if (blot == null) {
            return;
        }
        const attributes = _attributor__WEBPACK_IMPORTED_MODULE_2__["default"].keys(this.domNode);
        const classes = _class__WEBPACK_IMPORTED_MODULE_3__["default"].keys(this.domNode);
        const styles = _style__WEBPACK_IMPORTED_MODULE_4__["default"].keys(this.domNode);
        attributes
            .concat(classes)
            .concat(styles)
            .forEach(name => {
            const attr = blot.scroll.query(name, _scope__WEBPACK_IMPORTED_MODULE_1__["default"].ATTRIBUTE);
            if (attr instanceof _attributor__WEBPACK_IMPORTED_MODULE_2__["default"]) {
                this.attributes[attr.attrName] = attr;
            }
        });
    }
    copy(target) {
        Object.keys(this.attributes).forEach(key => {
            const value = this.attributes[key].value(this.domNode);
            target.format(key, value);
        });
    }
    move(target) {
        this.copy(target);
        Object.keys(this.attributes).forEach(key => {
            this.attributes[key].remove(this.domNode);
        });
        this.attributes = {};
    }
    values() {
        return Object.keys(this.attributes).reduce((attributes, name) => {
            attributes[name] = this.attributes[name].value(this.domNode);
            return attributes;
        }, {});
    }
}
/* harmony default export */ __webpack_exports__["default"] = (AttributorStore);


/***/ }),

/***/ "./src/attributor/style.ts":
/*!*********************************!*\
  !*** ./src/attributor/style.ts ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _attributor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./attributor */ "./src/attributor/attributor.ts");

function camelize(name) {
    const parts = name.split('-');
    const rest = parts
        .slice(1)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('');
    return parts[0] + rest;
}
class StyleAttributor extends _attributor__WEBPACK_IMPORTED_MODULE_0__["default"] {
    static keys(node) {
        return (node.getAttribute('style') || '').split(';').map(value => {
            const arr = value.split(':');
            return arr[0].trim();
        });
    }
    add(node, value) {
        if (!this.canAdd(node, value)) {
            return false;
        }
        // @ts-ignore
        node.style[camelize(this.keyName)] = value;
        return true;
    }
    remove(node) {
        // @ts-ignore
        node.style[camelize(this.keyName)] = '';
        if (!node.getAttribute('style')) {
            node.removeAttribute('style');
        }
    }
    value(node) {
        // @ts-ignore
        const value = node.style[camelize(this.keyName)];
        return this.canAdd(node, value) ? value : '';
    }
}
/* harmony default export */ __webpack_exports__["default"] = (StyleAttributor);


/***/ }),

/***/ "./src/blot/abstract/container.ts":
/*!****************************************!*\
  !*** ./src/blot/abstract/container.ts ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../scope */ "./src/scope.ts");
/* harmony import */ var _parent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parent */ "./src/blot/abstract/parent.ts");


class ContainerBlot extends _parent__WEBPACK_IMPORTED_MODULE_1__["default"] {
    checkMerge() {
        return (this.next !== null && this.next.statics.blotName === this.statics.blotName);
    }
    deleteAt(index, length) {
        super.deleteAt(index, length);
        this.enforceAllowedChildren();
    }
    formatAt(index, length, name, value) {
        super.formatAt(index, length, name, value);
        this.enforceAllowedChildren();
    }
    insertAt(index, value, def) {
        super.insertAt(index, value, def);
        this.enforceAllowedChildren();
    }
    optimize(context) {
        super.optimize(context);
        if (this.children.length > 0 && this.next != null && this.checkMerge()) {
            this.next.moveChildren(this);
            this.next.remove();
        }
    }
}
ContainerBlot.blotName = 'container';
ContainerBlot.scope = _scope__WEBPACK_IMPORTED_MODULE_0__["default"].BLOCK_BLOT;
/* harmony default export */ __webpack_exports__["default"] = (ContainerBlot);


/***/ }),

/***/ "./src/blot/abstract/leaf.ts":
/*!***********************************!*\
  !*** ./src/blot/abstract/leaf.ts ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../scope */ "./src/scope.ts");
/* harmony import */ var _shadow__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shadow */ "./src/blot/abstract/shadow.ts");


class LeafBlot extends _shadow__WEBPACK_IMPORTED_MODULE_1__["default"] {
    static value(_domNode) {
        return true;
    }
    index(node, offset) {
        if (this.domNode === node ||
            this.domNode.compareDocumentPosition(node) &
                Node.DOCUMENT_POSITION_CONTAINED_BY) {
            return Math.min(offset, 1);
        }
        return -1;
    }
    position(index, _inclusive) {
        const childNodes = Array.from(this.parent.domNode.childNodes);
        let offset = childNodes.indexOf(this.domNode);
        if (index > 0) {
            offset += 1;
        }
        return [this.parent.domNode, offset];
    }
    value() {
        return {
            [this.statics.blotName]: this.statics.value(this.domNode) || true,
        };
    }
}
LeafBlot.scope = _scope__WEBPACK_IMPORTED_MODULE_0__["default"].INLINE_BLOT;
/* harmony default export */ __webpack_exports__["default"] = (LeafBlot);


/***/ }),

/***/ "./src/blot/abstract/parent.ts":
/*!*************************************!*\
  !*** ./src/blot/abstract/parent.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _collection_linked_list__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../collection/linked-list */ "./src/collection/linked-list.ts");
/* harmony import */ var _error__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../error */ "./src/error.ts");
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../scope */ "./src/scope.ts");
/* harmony import */ var _shadow__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shadow */ "./src/blot/abstract/shadow.ts");




class ParentBlot extends _shadow__WEBPACK_IMPORTED_MODULE_3__["default"] {
    constructor(scroll, domNode) {
        super(scroll, domNode);
        this.uiNode = null;
        this.build();
    }
    appendChild(other) {
        this.insertBefore(other);
    }
    attach() {
        super.attach();
        this.children.forEach(child => {
            child.attach();
        });
    }
    attachUI(node) {
        if (this.uiNode != null) {
            this.uiNode.remove();
        }
        this.uiNode = node;
        if (ParentBlot.uiClass) {
            this.uiNode.classList.add(ParentBlot.uiClass);
        }
        this.uiNode.setAttribute('contenteditable', 'false');
        this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
    }
    build() {
        this.children = new _collection_linked_list__WEBPACK_IMPORTED_MODULE_0__["default"]();
        // Need to be reversed for if DOM nodes already in order
        Array.from(this.domNode.childNodes)
            .filter((node) => node !== this.uiNode)
            .reverse()
            .forEach((node) => {
            try {
                const child = makeAttachedBlot(node, this.scroll);
                this.insertBefore(child, this.children.head || undefined);
            }
            catch (err) {
                if (err instanceof _error__WEBPACK_IMPORTED_MODULE_1__["default"]) {
                    return;
                }
                else {
                    throw err;
                }
            }
        });
    }
    deleteAt(index, length) {
        if (index === 0 && length === this.length()) {
            return this.remove();
        }
        this.children.forEachAt(index, length, (child, offset, childLength) => {
            child.deleteAt(offset, childLength);
        });
    }
    descendant(criteria, index = 0) {
        const [child, offset] = this.children.find(index);
        if ((criteria.blotName == null && criteria(child)) ||
            (criteria.blotName != null && child instanceof criteria)) {
            return [child, offset];
        }
        else if (child instanceof ParentBlot) {
            return child.descendant(criteria, offset);
        }
        else {
            return [null, -1];
        }
    }
    descendants(criteria, index = 0, length = Number.MAX_VALUE) {
        let descendants = [];
        let lengthLeft = length;
        this.children.forEachAt(index, length, (child, childIndex, childLength) => {
            if ((criteria.blotName == null && criteria(child)) ||
                (criteria.blotName != null && child instanceof criteria)) {
                descendants.push(child);
            }
            if (child instanceof ParentBlot) {
                descendants = descendants.concat(child.descendants(criteria, childIndex, lengthLeft));
            }
            lengthLeft -= childLength;
        });
        return descendants;
    }
    detach() {
        this.children.forEach(child => {
            child.detach();
        });
        super.detach();
    }
    enforceAllowedChildren() {
        let done = false;
        this.children.forEach((child) => {
            if (done) {
                return;
            }
            const allowed = this.statics.allowedChildren.some((def) => child instanceof def);
            if (allowed) {
                return;
            }
            if (child.statics.scope === _scope__WEBPACK_IMPORTED_MODULE_2__["default"].BLOCK_BLOT) {
                if (child.next != null) {
                    this.splitAfter(child);
                }
                if (child.prev != null) {
                    this.splitAfter(child.prev);
                }
                child.parent.unwrap();
                done = true;
            }
            else if (child instanceof ParentBlot) {
                child.unwrap();
            }
            else {
                child.remove();
            }
        });
    }
    formatAt(index, length, name, value) {
        this.children.forEachAt(index, length, (child, offset, childLength) => {
            child.formatAt(offset, childLength, name, value);
        });
    }
    insertAt(index, value, def) {
        const [child, offset] = this.children.find(index);
        if (child) {
            child.insertAt(offset, value, def);
        }
        else {
            const blot = def == null
                ? this.scroll.create('text', value)
                : this.scroll.create(value, def);
            this.appendChild(blot);
        }
    }
    insertBefore(childBlot, refBlot, insertDom = true) {
        if (childBlot.parent != null) {
            childBlot.parent.children.remove(childBlot);
        }
        let refDomNode = null;
        this.children.insertBefore(childBlot, refBlot || null);
        if (refBlot != null) {
            refDomNode = refBlot.domNode;
        }
        // @ts-ignore
        // _fromUpdate: mutationUpdate (내가 직접 변경한 dom) 에 의한 blot 인지 판별하는 flag
        if (!(!insertDom && childBlot._fromUpdate)) {
            if (this.domNode.parentNode !== childBlot.domNode ||
                this.domNode.nextSibling !== refDomNode) {
                this.domNode.insertBefore(childBlot.domNode, refDomNode);
            }
        }
        // @ts-ignore
        childBlot._fromUpdate = false;
        // if (
        //     this.domNode.parentNode !== childBlot.domNode ||
        //     this.domNode.nextSibling !== refDomNode
        // ) {
        //     this.domNode.insertBefore(childBlot.domNode, refDomNode);
        // }
        childBlot.parent = this;
        childBlot.attach();
    }
    length() {
        return this.children.reduce((memo, child) => {
            return memo + child.length();
        }, 0);
    }
    moveChildren(targetParent, refNode) {
        this.children.forEach(child => {
            targetParent.insertBefore(child, refNode);
        });
    }
    optimize(context) {
        super.optimize(context);
        this.enforceAllowedChildren();
        if (this.uiNode != null && this.uiNode !== this.domNode.firstChild) {
            this.domNode.insertBefore(this.uiNode, this.domNode.firstChild);
        }
        if (this.children.length === 0) {
            if (this.statics.defaultChild != null) {
                const child = this.scroll.create(this.statics.defaultChild.blotName);
                this.appendChild(child);
                // TODO double check if necessary
                // child.optimize(context);
            }
            else {
                this.remove();
            }
        }
    }
    path(index, inclusive = false) {
        const [child, offset] = this.children.find(index, inclusive);
        const position = [[this, index]];
        if (child instanceof ParentBlot) {
            return position.concat(child.path(offset, inclusive));
        }
        else if (child != null) {
            position.push([child, offset]);
        }
        return position;
    }
    removeChild(child) {
        this.children.remove(child);
    }
    replaceWith(name, value) {
        const replacement = typeof name === 'string' ? this.scroll.create(name, value) : name;
        if (replacement instanceof ParentBlot) {
            this.moveChildren(replacement);
        }
        return super.replaceWith(replacement);
    }
    split(index, force = false) {
        if (!force) {
            if (index === 0) {
                return this;
            }
            if (index === this.length()) {
                return this.next;
            }
        }
        const after = this.clone();
        if (this.parent) {
            this.parent.insertBefore(after, this.next || undefined);
        }
        this.children.forEachAt(index, this.length(), (child, offset, _length) => {
            const split = child.split(offset, force);
            if (split != null) {
                after.appendChild(split);
            }
        });
        return after;
    }
    splitAfter(child) {
        const after = this.clone();
        while (child.next != null) {
            after.appendChild(child.next);
        }
        if (this.parent) {
            this.parent.insertBefore(after, this.next || undefined);
        }
        return after;
    }
    unwrap() {
        if (this.parent) {
            this.moveChildren(this.parent, this.next || undefined);
        }
        this.remove();
    }
    update(mutations, _context) {
        const addedNodes = [];
        const removedNodes = [];
        mutations.forEach(mutation => {
            if (mutation.target === this.domNode && mutation.type === 'childList') {
                addedNodes.push.apply(addedNodes, mutation.addedNodes);
                removedNodes.push.apply(removedNodes, mutation.removedNodes);
            }
        });
        removedNodes.forEach((node) => {
            // Check node has actually been removed
            // One exception is Chrome does not immediately remove IFRAMEs
            // from DOM but MutationRecord is correct in its reported removal
            if (node.parentNode != null &&
                // @ts-ignore
                node.tagName !== 'IFRAME' &&
                document.body.compareDocumentPosition(node) &
                    Node.DOCUMENT_POSITION_CONTAINED_BY) {
                return;
            }
            const blot = this.scroll.find(node);
            if (blot == null) {
                return;
            }
            if (blot.domNode.parentNode == null ||
                blot.domNode.parentNode === this.domNode) {
                blot.detach();
            }
        });
        addedNodes
            .filter(node => {
            return node.parentNode === this.domNode || node === this.uiNode;
        })
            .sort((a, b) => {
            if (a === b) {
                return 0;
            }
            if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
                return 1;
            }
            return -1;
        })
            .forEach(node => {
            let refBlot = null;
            if (node.nextSibling != null) {
                refBlot = this.scroll.find(node.nextSibling);
            }
            const blot = makeAttachedBlot(node, this.scroll);
            if (blot.next !== refBlot || blot.next == null) {
                if (blot.parent != null) {
                    blot.parent.removeChild(this);
                }
                // @ts-ignore
                blot._fromUpdate = true;
                this.insertBefore(blot, refBlot || undefined);
            }
        });
        this.enforceAllowedChildren();
    }
}
ParentBlot.uiClass = '';
function makeAttachedBlot(node, scroll) {
    let blot = scroll.find(node);
    if (blot == null) {
        try {
            blot = scroll.create(node);
        }
        catch (e) {
            blot = scroll.create(_scope__WEBPACK_IMPORTED_MODULE_2__["default"].INLINE);
            Array.from(node.childNodes).forEach((child) => {
                // @ts-ignore
                blot.domNode.appendChild(child);
            });
            if (node.parentNode) {
                node.parentNode.replaceChild(blot.domNode, node);
            }
            blot.attach();
        }
    }
    return blot;
}
/* harmony default export */ __webpack_exports__["default"] = (ParentBlot);


/***/ }),

/***/ "./src/blot/abstract/shadow.ts":
/*!*************************************!*\
  !*** ./src/blot/abstract/shadow.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _error__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../error */ "./src/error.ts");
/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../registry */ "./src/registry.ts");
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../scope */ "./src/scope.ts");



class ShadowBlot {
    constructor(scroll, domNode) {
        this.scroll = scroll;
        this.domNode = domNode;
        _registry__WEBPACK_IMPORTED_MODULE_1__["default"].blots.set(domNode, this);
        this.prev = null;
        this.next = null;
    }
    static create(value) {
        if (this.tagName == null) {
            throw new _error__WEBPACK_IMPORTED_MODULE_0__["default"]('Blot definition missing tagName');
        }
        let node;
        if (Array.isArray(this.tagName)) {
            if (typeof value === 'string') {
                value = value.toUpperCase();
                if (parseInt(value, 10).toString() === value) {
                    value = parseInt(value, 10);
                }
            }
            if (typeof value === 'number') {
                node = document.createElement(this.tagName[value - 1]);
            }
            else if (this.tagName.indexOf(value) > -1) {
                node = document.createElement(value);
            }
            else {
                node = document.createElement(this.tagName[0]);
            }
        }
        else {
            node = document.createElement(this.tagName);
        }
        if (this.className) {
            node.classList.add(this.className);
        }
        return node;
    }
    // Hack for accessing inherited static methods
    get statics() {
        return this.constructor;
    }
    attach() {
        // Nothing to do
    }
    clone() {
        const domNode = this.domNode.cloneNode(false);
        return this.scroll.create(domNode);
    }
    detach() {
        if (this.parent != null) {
            this.parent.removeChild(this);
        }
        _registry__WEBPACK_IMPORTED_MODULE_1__["default"].blots.delete(this.domNode);
    }
    deleteAt(index, length) {
        const blot = this.isolate(index, length);
        blot.remove();
    }
    formatAt(index, length, name, value) {
        const blot = this.isolate(index, length);
        if (this.scroll.query(name, _scope__WEBPACK_IMPORTED_MODULE_2__["default"].BLOT) != null && value) {
            blot.wrap(name, value);
        }
        else if (this.scroll.query(name, _scope__WEBPACK_IMPORTED_MODULE_2__["default"].ATTRIBUTE) != null) {
            const parent = this.scroll.create(this.statics.scope);
            blot.wrap(parent);
            parent.format(name, value);
        }
    }
    insertAt(index, value, def) {
        const blot = def == null
            ? this.scroll.create('text', value)
            : this.scroll.create(value, def);
        const ref = this.split(index);
        this.parent.insertBefore(blot, ref || undefined);
    }
    isolate(index, length) {
        const target = this.split(index);
        if (target == null) {
            throw new Error('Attempt to isolate at end');
        }
        target.split(length);
        return target;
    }
    length() {
        return 1;
    }
    offset(root = this.parent) {
        if (this.parent == null || this === root) {
            return 0;
        }
        return this.parent.children.offset(this) + this.parent.offset(root);
    }
    optimize(_context) {
        if (this.statics.requiredContainer &&
            !(this.parent instanceof this.statics.requiredContainer)) {
            this.wrap(this.statics.requiredContainer.blotName);
        }
    }
    remove() {
        if (this.domNode.parentNode != null) {
            this.domNode.parentNode.removeChild(this.domNode);
        }
        this.detach();
    }
    replaceWith(name, value) {
        const replacement = typeof name === 'string' ? this.scroll.create(name, value) : name;
        if (this.parent != null) {
            this.parent.insertBefore(replacement, this.next || undefined);
            this.remove();
        }
        return replacement;
    }
    split(index, _force) {
        return index === 0 ? this : this.next;
    }
    update(_mutations, _context) {
        // Nothing to do by default
    }
    wrap(name, value) {
        const wrapper = typeof name === 'string'
            ? this.scroll.create(name, value)
            : name;
        if (this.parent != null) {
            this.parent.insertBefore(wrapper, this.next || undefined);
        }
        if (typeof wrapper.appendChild !== 'function') {
            throw new _error__WEBPACK_IMPORTED_MODULE_0__["default"](`Cannot wrap ${name}`);
        }
        wrapper.appendChild(this);
        return wrapper;
    }
}
ShadowBlot.blotName = 'abstract';
/* harmony default export */ __webpack_exports__["default"] = (ShadowBlot);


/***/ }),

/***/ "./src/blot/block.ts":
/*!***************************!*\
  !*** ./src/blot/block.ts ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _attributor_attributor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../attributor/attributor */ "./src/attributor/attributor.ts");
/* harmony import */ var _attributor_store__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../attributor/store */ "./src/attributor/store.ts");
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../scope */ "./src/scope.ts");
/* harmony import */ var _abstract_leaf__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./abstract/leaf */ "./src/blot/abstract/leaf.ts");
/* harmony import */ var _abstract_parent__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./abstract/parent */ "./src/blot/abstract/parent.ts");
/* harmony import */ var _inline__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./inline */ "./src/blot/inline.ts");






class BlockBlot extends _abstract_parent__WEBPACK_IMPORTED_MODULE_4__["default"] {
    constructor(scroll, domNode) {
        super(scroll, domNode);
        this.attributes = new _attributor_store__WEBPACK_IMPORTED_MODULE_1__["default"](this.domNode);
    }
    static formats(domNode, scroll) {
        const match = scroll.query(BlockBlot.blotName);
        if (match != null &&
            domNode.tagName === match.tagName) {
            return undefined;
        }
        else if (typeof this.tagName === 'string') {
            return true;
        }
        else if (Array.isArray(this.tagName)) {
            return domNode.tagName.toLowerCase();
        }
    }
    format(name, value) {
        const format = this.scroll.query(name, _scope__WEBPACK_IMPORTED_MODULE_2__["default"].BLOCK);
        if (format == null) {
            return;
        }
        else if (format instanceof _attributor_attributor__WEBPACK_IMPORTED_MODULE_0__["default"]) {
            this.attributes.attribute(format, value);
        }
        else if (name === this.statics.blotName && !value) {
            this.replaceWith(BlockBlot.blotName);
        }
        else if (value &&
            (name !== this.statics.blotName || this.formats()[name] !== value)) {
            this.replaceWith(name, value);
        }
    }
    formats() {
        const formats = this.attributes.values();
        const format = this.statics.formats(this.domNode, this.scroll);
        if (format != null) {
            formats[this.statics.blotName] = format;
        }
        return formats;
    }
    formatAt(index, length, name, value) {
        if (this.scroll.query(name, _scope__WEBPACK_IMPORTED_MODULE_2__["default"].BLOCK) != null) {
            this.format(name, value);
        }
        else {
            super.formatAt(index, length, name, value);
        }
    }
    insertAt(index, value, def) {
        if (def == null || this.scroll.query(value, _scope__WEBPACK_IMPORTED_MODULE_2__["default"].INLINE) != null) {
            // Insert text or inline
            super.insertAt(index, value, def);
        }
        else {
            const after = this.split(index);
            if (after != null) {
                const blot = this.scroll.create(value, def);
                after.parent.insertBefore(blot, after);
            }
            else {
                throw new Error('Attempt to insertAt after block boundaries');
            }
        }
    }
    replaceWith(name, value) {
        const replacement = super.replaceWith(name, value);
        this.attributes.copy(replacement);
        return replacement;
    }
    update(mutations, context) {
        super.update(mutations, context);
        const attributeChanged = mutations.some(mutation => mutation.target === this.domNode && mutation.type === 'attributes');
        if (attributeChanged) {
            this.attributes.build();
        }
    }
}
BlockBlot.blotName = 'block';
BlockBlot.scope = _scope__WEBPACK_IMPORTED_MODULE_2__["default"].BLOCK_BLOT;
BlockBlot.tagName = 'P';
BlockBlot.allowedChildren = [
    _inline__WEBPACK_IMPORTED_MODULE_5__["default"],
    BlockBlot,
    _abstract_leaf__WEBPACK_IMPORTED_MODULE_3__["default"],
];
/* harmony default export */ __webpack_exports__["default"] = (BlockBlot);


/***/ }),

/***/ "./src/blot/embed.ts":
/*!***************************!*\
  !*** ./src/blot/embed.ts ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _abstract_leaf__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abstract/leaf */ "./src/blot/abstract/leaf.ts");

class EmbedBlot extends _abstract_leaf__WEBPACK_IMPORTED_MODULE_0__["default"] {
    static formats(_domNode, _scroll) {
        return undefined;
    }
    format(name, value) {
        // super.formatAt wraps, which is what we want in general,
        // but this allows subclasses to overwrite for formats
        // that just apply to particular embeds
        super.formatAt(0, this.length(), name, value);
    }
    formatAt(index, length, name, value) {
        if (index === 0 && length === this.length()) {
            this.format(name, value);
        }
        else {
            super.formatAt(index, length, name, value);
        }
    }
    formats() {
        return this.statics.formats(this.domNode, this.scroll);
    }
}
/* harmony default export */ __webpack_exports__["default"] = (EmbedBlot);


/***/ }),

/***/ "./src/blot/inline.ts":
/*!****************************!*\
  !*** ./src/blot/inline.ts ***!
  \****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _attributor_attributor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../attributor/attributor */ "./src/attributor/attributor.ts");
/* harmony import */ var _attributor_store__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../attributor/store */ "./src/attributor/store.ts");
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../scope */ "./src/scope.ts");
/* harmony import */ var _abstract_leaf__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./abstract/leaf */ "./src/blot/abstract/leaf.ts");
/* harmony import */ var _abstract_parent__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./abstract/parent */ "./src/blot/abstract/parent.ts");





// Shallow object comparison
function isEqual(obj1, obj2) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
    }
    // @ts-ignore
    for (const prop in obj1) {
        // @ts-ignore
        if (obj1[prop] !== obj2[prop]) {
            return false;
        }
    }
    return true;
}
class InlineBlot extends _abstract_parent__WEBPACK_IMPORTED_MODULE_4__["default"] {
    constructor(scroll, domNode) {
        super(scroll, domNode);
        this.attributes = new _attributor_store__WEBPACK_IMPORTED_MODULE_1__["default"](this.domNode);
    }
    static formats(domNode, scroll) {
        const match = scroll.query(InlineBlot.blotName);
        if (match != null &&
            domNode.tagName === match.tagName) {
            return undefined;
        }
        else if (typeof this.tagName === 'string') {
            return true;
        }
        else if (Array.isArray(this.tagName)) {
            return domNode.tagName.toLowerCase();
        }
        return undefined;
    }
    format(name, value) {
        if (name === this.statics.blotName && !value) {
            this.children.forEach(child => {
                if (!(child instanceof InlineBlot)) {
                    child = child.wrap(InlineBlot.blotName, true);
                }
                this.attributes.copy(child);
            });
            this.unwrap();
        }
        else {
            const format = this.scroll.query(name, _scope__WEBPACK_IMPORTED_MODULE_2__["default"].INLINE);
            if (format == null) {
                return;
            }
            if (format instanceof _attributor_attributor__WEBPACK_IMPORTED_MODULE_0__["default"]) {
                this.attributes.attribute(format, value);
            }
            else if (value &&
                (name !== this.statics.blotName || this.formats()[name] !== value)) {
                this.replaceWith(name, value);
            }
        }
    }
    formats() {
        const formats = this.attributes.values();
        const format = this.statics.formats(this.domNode, this.scroll);
        if (format != null) {
            formats[this.statics.blotName] = format;
        }
        return formats;
    }
    formatAt(index, length, name, value) {
        if (this.formats()[name] != null ||
            this.scroll.query(name, _scope__WEBPACK_IMPORTED_MODULE_2__["default"].ATTRIBUTE)) {
            const blot = this.isolate(index, length);
            blot.format(name, value);
        }
        else {
            super.formatAt(index, length, name, value);
        }
    }
    optimize(context) {
        super.optimize(context);
        const formats = this.formats();
        if (Object.keys(formats).length === 0) {
            return this.unwrap(); // unformatted span
        }
        const next = this.next;
        if (next instanceof InlineBlot &&
            next.prev === this &&
            isEqual(formats, next.formats())) {
            next.moveChildren(this);
            next.remove();
        }
    }
    replaceWith(name, value) {
        const replacement = super.replaceWith(name, value);
        this.attributes.copy(replacement);
        return replacement;
    }
    update(mutations, context) {
        super.update(mutations, context);
        const attributeChanged = mutations.some(mutation => mutation.target === this.domNode && mutation.type === 'attributes');
        if (attributeChanged) {
            this.attributes.build();
        }
    }
    wrap(name, value) {
        const wrapper = super.wrap(name, value);
        if (wrapper instanceof InlineBlot) {
            this.attributes.move(wrapper);
        }
        return wrapper;
    }
}
InlineBlot.allowedChildren = [InlineBlot, _abstract_leaf__WEBPACK_IMPORTED_MODULE_3__["default"]];
InlineBlot.blotName = 'inline';
InlineBlot.scope = _scope__WEBPACK_IMPORTED_MODULE_2__["default"].INLINE_BLOT;
InlineBlot.tagName = 'SPAN';
/* harmony default export */ __webpack_exports__["default"] = (InlineBlot);


/***/ }),

/***/ "./src/blot/scroll.ts":
/*!****************************!*\
  !*** ./src/blot/scroll.ts ***!
  \****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../registry */ "./src/registry.ts");
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../scope */ "./src/scope.ts");
/* harmony import */ var _abstract_container__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./abstract/container */ "./src/blot/abstract/container.ts");
/* harmony import */ var _abstract_parent__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./abstract/parent */ "./src/blot/abstract/parent.ts");
/* harmony import */ var _block__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./block */ "./src/blot/block.ts");





const OBSERVER_CONFIG = {
    attributes: true,
    characterData: true,
    characterDataOldValue: true,
    childList: true,
    subtree: true,
};
const MAX_OPTIMIZE_ITERATIONS = 100;
class ScrollBlot extends _abstract_parent__WEBPACK_IMPORTED_MODULE_3__["default"] {
    constructor(registry, node) {
        // @ts-ignore
        super(null, node);
        this.registry = registry;
        this.scroll = this;
        this.build();
        this.observer = new MutationObserver((mutations) => {
            this.update(mutations);
        });
        this.observer.observe(this.domNode, OBSERVER_CONFIG);
        this.attach();
    }
    create(input, value) {
        return this.registry.create(this, input, value);
    }
    find(node, bubble = false) {
        return this.registry.find(node, bubble);
    }
    query(query, scope = _scope__WEBPACK_IMPORTED_MODULE_1__["default"].ANY) {
        return this.registry.query(query, scope);
    }
    register(...definitions) {
        return this.registry.register(...definitions);
    }
    build() {
        if (this.scroll == null) {
            return;
        }
        super.build();
    }
    detach() {
        super.detach();
        this.observer.disconnect();
    }
    deleteAt(index, length) {
        this.update();
        if (index === 0 && length === this.length()) {
            this.children.forEach(child => {
                child.remove();
            });
        }
        else {
            super.deleteAt(index, length);
        }
    }
    formatAt(index, length, name, value) {
        this.update();
        super.formatAt(index, length, name, value);
    }
    insertAt(index, value, def) {
        this.update();
        super.insertAt(index, value, def);
    }
    optimize(mutations = [], context = {}) {
        super.optimize(context);
        const mutationsMap = context.mutationsMap || new WeakMap();
        // We must modify mutations directly, cannot make copy and then modify
        let records = Array.from(this.observer.takeRecords());
        // Array.push currently seems to be implemented by a non-tail recursive function
        // so we cannot just mutations.push.apply(mutations, this.observer.takeRecords());
        while (records.length > 0) {
            mutations.push(records.pop());
        }
        const mark = (blot, markParent = true) => {
            if (blot == null || blot === this) {
                return;
            }
            if (blot.domNode.parentNode == null) {
                return;
            }
            if (!mutationsMap.has(blot.domNode)) {
                mutationsMap.set(blot.domNode, []);
            }
            if (markParent) {
                mark(blot.parent);
            }
        };
        const optimize = (blot) => {
            // Post-order traversal
            if (!mutationsMap.has(blot.domNode)) {
                return;
            }
            if (blot instanceof _abstract_parent__WEBPACK_IMPORTED_MODULE_3__["default"]) {
                blot.children.forEach(optimize);
            }
            mutationsMap.delete(blot.domNode);
            blot.optimize(context);
        };
        let remaining = mutations;
        for (let i = 0; remaining.length > 0; i += 1) {
            if (i >= MAX_OPTIMIZE_ITERATIONS) {
                throw new Error('[Parchment] Maximum optimize iterations reached');
            }
            remaining.forEach((mutation) => {
                const blot = this.find(mutation.target, true);
                if (blot == null) {
                    return;
                }
                if (blot.domNode === mutation.target) {
                    if (mutation.type === 'childList') {
                        mark(this.find(mutation.previousSibling, false));
                        Array.from(mutation.addedNodes).forEach((node) => {
                            const child = this.find(node, false);
                            mark(child, false);
                            if (child instanceof _abstract_parent__WEBPACK_IMPORTED_MODULE_3__["default"]) {
                                child.children.forEach((grandChild) => {
                                    mark(grandChild, false);
                                });
                            }
                        });
                    }
                    else if (mutation.type === 'attributes') {
                        mark(blot.prev);
                    }
                }
                mark(blot);
            });
            this.children.forEach(optimize);
            remaining = Array.from(this.observer.takeRecords());
            records = remaining.slice();
            while (records.length > 0) {
                mutations.push(records.pop());
            }
        }
    }
    update(mutations, context = {}) {
        mutations = mutations || this.observer.takeRecords();
        const mutationsMap = new WeakMap();
        mutations
            .map((mutation) => {
            const blot = _registry__WEBPACK_IMPORTED_MODULE_0__["default"].find(mutation.target, true);
            if (blot == null) {
                return null;
            }
            if (mutationsMap.has(blot.domNode)) {
                mutationsMap.get(blot.domNode).push(mutation);
                return null;
            }
            else {
                mutationsMap.set(blot.domNode, [mutation]);
                return blot;
            }
        })
            .forEach((blot) => {
            if (blot != null && blot !== this && mutationsMap.has(blot.domNode)) {
                blot.update(mutationsMap.get(blot.domNode) || [], context);
            }
        });
        context.mutationsMap = mutationsMap;
        if (mutationsMap.has(this.domNode)) {
            super.update(mutationsMap.get(this.domNode), context);
        }
        this.optimize(mutations, context);
    }
}
ScrollBlot.blotName = 'scroll';
ScrollBlot.defaultChild = _block__WEBPACK_IMPORTED_MODULE_4__["default"];
ScrollBlot.allowedChildren = [_block__WEBPACK_IMPORTED_MODULE_4__["default"], _abstract_container__WEBPACK_IMPORTED_MODULE_2__["default"]];
ScrollBlot.scope = _scope__WEBPACK_IMPORTED_MODULE_1__["default"].BLOCK_BLOT;
ScrollBlot.tagName = 'DIV';
/* harmony default export */ __webpack_exports__["default"] = (ScrollBlot);


/***/ }),

/***/ "./src/blot/text.ts":
/*!**************************!*\
  !*** ./src/blot/text.ts ***!
  \**************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../scope */ "./src/scope.ts");
/* harmony import */ var _abstract_leaf__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./abstract/leaf */ "./src/blot/abstract/leaf.ts");


class TextBlot extends _abstract_leaf__WEBPACK_IMPORTED_MODULE_1__["default"] {
    constructor(scroll, node) {
        super(scroll, node);
        this.text = this.statics.value(this.domNode);
    }
    static create(value) {
        return document.createTextNode(value);
    }
    static value(domNode) {
        return domNode.data;
    }
    deleteAt(index, length) {
        this.domNode.data = this.text =
            this.text.slice(0, index) + this.text.slice(index + length);
    }
    index(node, offset) {
        if (this.domNode === node) {
            return offset;
        }
        return -1;
    }
    insertAt(index, value, def) {
        if (def == null) {
            this.text = this.text.slice(0, index) + value + this.text.slice(index);
            this.domNode.data = this.text;
        }
        else {
            super.insertAt(index, value, def);
        }
    }
    length() {
        return this.text.length;
    }
    optimize(context) {
        super.optimize(context);
        this.text = this.statics.value(this.domNode);
        if (this.text.length === 0) {
            this.remove();
        }
        else if (this.next instanceof TextBlot && this.next.prev === this) {
            this.insertAt(this.length(), this.next.value());
            this.next.remove();
        }
    }
    position(index, _inclusive = false) {
        return [this.domNode, index];
    }
    split(index, force = false) {
        if (!force) {
            if (index === 0) {
                return this;
            }
            if (index === this.length()) {
                return this.next;
            }
        }
        const after = this.scroll.create(this.domNode.splitText(index));
        this.parent.insertBefore(after, this.next || undefined);
        this.text = this.statics.value(this.domNode);
        return after;
    }
    update(mutations, _context) {
        if (mutations.some(mutation => {
            return (mutation.type === 'characterData' && mutation.target === this.domNode);
        })) {
            this.text = this.statics.value(this.domNode);
        }
    }
    value() {
        return this.text;
    }
}
TextBlot.blotName = 'text';
TextBlot.scope = _scope__WEBPACK_IMPORTED_MODULE_0__["default"].INLINE_BLOT;
/* harmony default export */ __webpack_exports__["default"] = (TextBlot);


/***/ }),

/***/ "./src/collection/linked-list.ts":
/*!***************************************!*\
  !*** ./src/collection/linked-list.ts ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
class LinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }
    append(...nodes) {
        this.insertBefore(nodes[0], null);
        if (nodes.length > 1) {
            this.append.apply(this, nodes.slice(1));
        }
    }
    at(index) {
        const next = this.iterator();
        let cur = next();
        while (cur && index > 0) {
            index -= 1;
            cur = next();
        }
        return cur;
    }
    contains(node) {
        const next = this.iterator();
        let cur = next();
        while (cur) {
            if (cur === node) {
                return true;
            }
            cur = next();
        }
        return false;
    }
    indexOf(node) {
        const next = this.iterator();
        let cur = next();
        let index = 0;
        while (cur) {
            if (cur === node) {
                return index;
            }
            index += 1;
            cur = next();
        }
        return -1;
    }
    insertBefore(node, refNode) {
        if (node == null) {
            return;
        }
        this.remove(node);
        node.next = refNode;
        if (refNode != null) {
            node.prev = refNode.prev;
            if (refNode.prev != null) {
                refNode.prev.next = node;
            }
            refNode.prev = node;
            if (refNode === this.head) {
                this.head = node;
            }
        }
        else if (this.tail != null) {
            this.tail.next = node;
            node.prev = this.tail;
            this.tail = node;
        }
        else {
            node.prev = null;
            this.head = this.tail = node;
        }
        this.length += 1;
    }
    offset(target) {
        let index = 0;
        let cur = this.head;
        while (cur != null) {
            if (cur === target) {
                return index;
            }
            index += cur.length();
            cur = cur.next;
        }
        return -1;
    }
    remove(node) {
        if (!this.contains(node)) {
            return;
        }
        if (node.prev != null) {
            node.prev.next = node.next;
        }
        if (node.next != null) {
            node.next.prev = node.prev;
        }
        if (node === this.head) {
            this.head = node.next;
        }
        if (node === this.tail) {
            this.tail = node.prev;
        }
        this.length -= 1;
    }
    iterator(curNode = this.head) {
        // TODO use yield when we can
        return () => {
            const ret = curNode;
            if (curNode != null) {
                curNode = curNode.next;
            }
            return ret;
        };
    }
    find(index, inclusive = false) {
        const next = this.iterator();
        let cur = next();
        while (cur) {
            const length = cur.length();
            if (index < length ||
                (inclusive &&
                    index === length &&
                    (cur.next == null || cur.next.length() !== 0))) {
                return [cur, index];
            }
            index -= length;
            cur = next();
        }
        return [null, 0];
    }
    forEach(callback) {
        const next = this.iterator();
        let cur = next();
        while (cur) {
            callback(cur);
            cur = next();
        }
    }
    forEachAt(index, length, callback) {
        if (length <= 0) {
            return;
        }
        const [startNode, offset] = this.find(index);
        let curIndex = index - offset;
        const next = this.iterator(startNode);
        let cur = next();
        while (cur && curIndex < index + length) {
            const curLength = cur.length();
            if (index > curIndex) {
                callback(cur, index - curIndex, Math.min(length, curIndex + curLength - index));
            }
            else {
                callback(cur, 0, Math.min(curLength, index + length - curIndex));
            }
            curIndex += curLength;
            cur = next();
        }
    }
    map(callback) {
        return this.reduce((memo, cur) => {
            memo.push(callback(cur));
            return memo;
        }, []);
    }
    reduce(callback, memo) {
        const next = this.iterator();
        let cur = next();
        while (cur) {
            memo = callback(memo, cur);
            cur = next();
        }
        return memo;
    }
}
/* harmony default export */ __webpack_exports__["default"] = (LinkedList);


/***/ }),

/***/ "./src/error.ts":
/*!**********************!*\
  !*** ./src/error.ts ***!
  \**********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ParchmentError; });
class ParchmentError extends Error {
    constructor(message) {
        message = '[Parchment] ' + message;
        super(message);
        this.message = message;
        this.name = this.constructor.name;
    }
}


/***/ }),

/***/ "./src/parchment.ts":
/*!**************************!*\
  !*** ./src/parchment.ts ***!
  \**************************/
/*! exports provided: ParentBlot, ContainerBlot, LeafBlot, EmbedBlot, ScrollBlot, BlockBlot, InlineBlot, TextBlot, Attributor, ClassAttributor, StyleAttributor, AttributorStore, Registry, Scope */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _blot_abstract_container__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./blot/abstract/container */ "./src/blot/abstract/container.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ContainerBlot", function() { return _blot_abstract_container__WEBPACK_IMPORTED_MODULE_0__["default"]; });

/* harmony import */ var _blot_abstract_leaf__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./blot/abstract/leaf */ "./src/blot/abstract/leaf.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LeafBlot", function() { return _blot_abstract_leaf__WEBPACK_IMPORTED_MODULE_1__["default"]; });

/* harmony import */ var _blot_abstract_parent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./blot/abstract/parent */ "./src/blot/abstract/parent.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ParentBlot", function() { return _blot_abstract_parent__WEBPACK_IMPORTED_MODULE_2__["default"]; });

/* harmony import */ var _blot_block__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./blot/block */ "./src/blot/block.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "BlockBlot", function() { return _blot_block__WEBPACK_IMPORTED_MODULE_3__["default"]; });

/* harmony import */ var _blot_embed__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./blot/embed */ "./src/blot/embed.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "EmbedBlot", function() { return _blot_embed__WEBPACK_IMPORTED_MODULE_4__["default"]; });

/* harmony import */ var _blot_inline__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./blot/inline */ "./src/blot/inline.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "InlineBlot", function() { return _blot_inline__WEBPACK_IMPORTED_MODULE_5__["default"]; });

/* harmony import */ var _blot_scroll__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./blot/scroll */ "./src/blot/scroll.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ScrollBlot", function() { return _blot_scroll__WEBPACK_IMPORTED_MODULE_6__["default"]; });

/* harmony import */ var _blot_text__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./blot/text */ "./src/blot/text.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TextBlot", function() { return _blot_text__WEBPACK_IMPORTED_MODULE_7__["default"]; });

/* harmony import */ var _attributor_attributor__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./attributor/attributor */ "./src/attributor/attributor.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Attributor", function() { return _attributor_attributor__WEBPACK_IMPORTED_MODULE_8__["default"]; });

/* harmony import */ var _attributor_class__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./attributor/class */ "./src/attributor/class.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ClassAttributor", function() { return _attributor_class__WEBPACK_IMPORTED_MODULE_9__["default"]; });

/* harmony import */ var _attributor_store__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./attributor/store */ "./src/attributor/store.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "AttributorStore", function() { return _attributor_store__WEBPACK_IMPORTED_MODULE_10__["default"]; });

/* harmony import */ var _attributor_style__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./attributor/style */ "./src/attributor/style.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StyleAttributor", function() { return _attributor_style__WEBPACK_IMPORTED_MODULE_11__["default"]; });

/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./registry */ "./src/registry.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Registry", function() { return _registry__WEBPACK_IMPORTED_MODULE_12__["default"]; });

/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./scope */ "./src/scope.ts");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Scope", function() { return _scope__WEBPACK_IMPORTED_MODULE_13__["default"]; });


















/***/ }),

/***/ "./src/registry.ts":
/*!*************************!*\
  !*** ./src/registry.ts ***!
  \*************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Registry; });
/* harmony import */ var _error__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./error */ "./src/error.ts");
/* harmony import */ var _scope__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./scope */ "./src/scope.ts");


class Registry {
    constructor() {
        this.attributes = {};
        this.classes = {};
        this.tags = {};
        this.types = {};
    }
    static find(node, bubble = false) {
        if (node == null) {
            return null;
        }
        if (this.blots.has(node)) {
            return this.blots.get(node) || null;
        }
        if (bubble) {
            return this.find(node.parentNode, bubble);
        }
        return null;
    }
    create(scroll, input, value) {
        const match = this.query(input);
        if (match == null) {
            throw new _error__WEBPACK_IMPORTED_MODULE_0__["default"](`Unable to create ${input} blot`);
        }
        const blotClass = match;
        const node = 
        // @ts-ignore
        input instanceof Node || input.nodeType === Node.TEXT_NODE
            ? input
            : blotClass.create(value);
        const blot = new blotClass(scroll, node, value);
        Registry.blots.set(blot.domNode, blot);
        return blot;
    }
    find(node, bubble = false) {
        return Registry.find(node, bubble);
    }
    query(query, scope = _scope__WEBPACK_IMPORTED_MODULE_1__["default"].ANY) {
        let match;
        if (typeof query === 'string') {
            match = this.types[query] || this.attributes[query];
            // @ts-ignore
        }
        else if (query instanceof Text || query.nodeType === Node.TEXT_NODE) {
            match = this.types.text;
        }
        else if (typeof query === 'number') {
            if (query & _scope__WEBPACK_IMPORTED_MODULE_1__["default"].LEVEL & _scope__WEBPACK_IMPORTED_MODULE_1__["default"].BLOCK) {
                match = this.types.block;
            }
            else if (query & _scope__WEBPACK_IMPORTED_MODULE_1__["default"].LEVEL & _scope__WEBPACK_IMPORTED_MODULE_1__["default"].INLINE) {
                match = this.types.inline;
            }
        }
        else if (query instanceof HTMLElement) {
            const names = (query.getAttribute('class') || '').split(/\s+/);
            names.some(name => {
                match = this.classes[name];
                if (match) {
                    return true;
                }
                return false;
            });
            match = match || this.tags[query.tagName];
        }
        if (match == null) {
            return null;
        }
        // @ts-ignore
        if (scope & _scope__WEBPACK_IMPORTED_MODULE_1__["default"].LEVEL & match.scope && scope & _scope__WEBPACK_IMPORTED_MODULE_1__["default"].TYPE & match.scope) {
            return match;
        }
        return null;
    }
    register(...definitions) {
        if (definitions.length > 1) {
            return definitions.map(d => {
                return this.register(d);
            });
        }
        const definition = definitions[0];
        if (typeof definition.blotName !== 'string' &&
            typeof definition.attrName !== 'string') {
            throw new _error__WEBPACK_IMPORTED_MODULE_0__["default"]('Invalid definition');
        }
        else if (definition.blotName === 'abstract') {
            throw new _error__WEBPACK_IMPORTED_MODULE_0__["default"]('Cannot register abstract class');
        }
        this.types[definition.blotName || definition.attrName] = definition;
        if (typeof definition.keyName === 'string') {
            this.attributes[definition.keyName] = definition;
        }
        else {
            if (definition.className != null) {
                this.classes[definition.className] = definition;
            }
            if (definition.tagName != null) {
                if (Array.isArray(definition.tagName)) {
                    definition.tagName = definition.tagName.map((tagName) => {
                        return tagName.toUpperCase();
                    });
                }
                else {
                    definition.tagName = definition.tagName.toUpperCase();
                }
                const tagNames = Array.isArray(definition.tagName)
                    ? definition.tagName
                    : [definition.tagName];
                tagNames.forEach((tag) => {
                    if (this.tags[tag] == null || definition.className == null) {
                        this.tags[tag] = definition;
                    }
                });
            }
        }
        return definition;
    }
}
Registry.blots = new WeakMap();


/***/ }),

/***/ "./src/scope.ts":
/*!**********************!*\
  !*** ./src/scope.ts ***!
  \**********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var Scope;
(function (Scope) {
    Scope[Scope["TYPE"] = 3] = "TYPE";
    Scope[Scope["LEVEL"] = 12] = "LEVEL";
    Scope[Scope["ATTRIBUTE"] = 13] = "ATTRIBUTE";
    Scope[Scope["BLOT"] = 14] = "BLOT";
    Scope[Scope["INLINE"] = 7] = "INLINE";
    Scope[Scope["BLOCK"] = 11] = "BLOCK";
    Scope[Scope["BLOCK_BLOT"] = 10] = "BLOCK_BLOT";
    Scope[Scope["INLINE_BLOT"] = 6] = "INLINE_BLOT";
    Scope[Scope["BLOCK_ATTRIBUTE"] = 9] = "BLOCK_ATTRIBUTE";
    Scope[Scope["INLINE_ATTRIBUTE"] = 5] = "INLINE_ATTRIBUTE";
    Scope[Scope["ANY"] = 15] = "ANY";
})(Scope || (Scope = {}));
/* harmony default export */ __webpack_exports__["default"] = (Scope);


/***/ }),

/***/ 0:
/*!********************************!*\
  !*** multi ./src/parchment.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./src/parchment.ts */"./src/parchment.ts");


/***/ })

/******/ });
});
//# sourceMappingURL=parchment.js.map
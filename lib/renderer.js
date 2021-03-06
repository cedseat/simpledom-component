"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.el = el;
exports.renderToDom = renderToDom;
exports.renderToString = renderToString;
exports.renderTo = renderTo;

var _converter = require("./converter");

var _util = require("./util");

var _Store = require("./Store");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * JSX factory function to create an object representing a dom node. Designed to be used with a JSX transpiler.
 * @param {Object|Component|string|function} element the name of the tag, or a {@link Component}.
 * @param {Object} attrs properties of the node, a plain old JS object. Not optional, if no value, put empty object.
 * @param {Array} children the children of the node, a vararg
 * @return {Object} an object representing a dom node.
 */
function el(element, attrs) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  if (element && element.isComponent) {
    var props = _objectSpread({}, attrs, {
      children: ((0, _util.flatten)(children) || []).filter(function (child) {
        return child !== null && child !== undefined;
      })
    });

    return {
      isComponent: true,
      componentClass: element,
      props: props
    };
  } else {
    if ((0, _util.isFunction)(element)) {
      return element.apply(void 0, [attrs].concat(children));
    }

    return {
      name: element,
      attrs: attrs || {},
      children: ((0, _util.flatten)(children) || []).filter(function (child) {
        return child !== null && child !== undefined;
      }),
      isElem: true
    };
  }
}

function cleanAnGetNode(node) {
  var realNode = node;

  if (typeof node === 'string') {
    realNode = document.getElementById(node);
  }

  while (realNode.firstChild) {
    realNode.removeChild(realNode.firstChild);
  }

  return realNode;
}
/**
 * Render a component to the dom.
 * @param {string|Node} node the id or the node where the component must be rendered.
 * @param {Component} component the component to render.
 * @param {Store} store the store
 */


function renderToDom(node, component) {
  var store = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new _Store.Store();
  renderComponents(node, [component], store);
}

function renderComponents(node, components) {
  var store = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new _Store.Store();
  var realNode = cleanAnGetNode(node);
  var componentList = [];
  (0, _util.flatten)(components).filter(function (component) {
    return component !== undefined && component !== null;
  }).map(function (component) {
    return (0, _converter.convertToNode)(component, store, componentList);
  }).forEach(function (node) {
    return realNode.appendChild(node);
  });
  componentList.forEach(function (component) {
    return component.componentDidMount();
  });

  if (componentList.length) {
    store.refreshComponentsToObserve = function () {
      if (!document.body.contains(realNode)) {
        store.mutationObserver && store.mutationObserver.disconnect();
        store.unsubscribeAll();
      }

      for (var index = store.componentsToUnmount.length - 1; index >= 0; index--) {
        var component = store.componentsToUnmount[index];

        if (component.node && !realNode.contains(component.node)) {
          component.componentDidUnmount();
          store.componentsToUnmount.splice(index, 1);
        }
      }

      for (var _index = store.componentsSubscribes.length - 1; _index >= 0; _index--) {
        var _component = store.componentsSubscribes[_index];

        if (_component.component.node && !realNode.contains(_component.component.node)) {
          _component.subscribes.forEach(function (_ref) {
            var event = _ref.event,
                id = _ref.id;
            return store.unsubscribeByEventAndId(event, id);
          });

          _component.component.node = undefined;
          store.componentsSubscribes.splice(_index, 1);
        }
      }
    };

    store.mutationObserver = new MutationObserver(function () {
      return store.refreshComponentsToObserve && store.refreshComponentsToObserve();
    });
    store.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}
/**
 * Render some elements into a string.
 * @param {Array} elements elements returned by {@link el} or primitive like string.
 * @return {string} html as a string.
 */


function renderToString() {
  for (var _len2 = arguments.length, elements = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    elements[_key2] = arguments[_key2];
  }

  return (0, _util.flatten)(elements).map(function (el) {
    if (!el.name) {
      return '' + (el.__asHtml || el);
    }

    var attributes = Object.keys(el.attrs).filter(function (attribute) {
      return !attribute.startsWith('on') && el.attrs[attribute] !== undefined && attribute !== 'ref';
    }).map(function (attribute) {
      var key = (0, _util.dasherize)(attribute === 'className' ? 'class' : attribute);
      var value = el.attrs[attribute];

      if (key === 'style' && _typeof(value) === 'object') {
        value = Object.keys(value).map(function (key) {
          return '' + (0, _util.dasherize)(key) + ':' + value[key];
        }).join(';');
      } else if (key === 'class' && _typeof(value) === 'object') {
        value = Object.keys(value).filter(function (classValue) {
          return value[classValue];
        }).map(_util.dasherize).join(' ');
      }

      return " ".concat(key, "=\"").concat(value, "\"");
    }).join('');
    var content = renderToString.apply(void 0, _toConsumableArray(el.children));
    return "<".concat(el.name).concat(attributes, ">").concat(content, "</").concat(el.name, ">");
  }).join('');
}
/**
 * Render some elements into a node.
 * @param {string|Node} node the id or the node where the component must be rendered.
 * @param {Array} elements elements returned by {@link el} or primitive like string.
 */


function renderTo(node) {
  for (var _len3 = arguments.length, elements = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    elements[_key3 - 1] = arguments[_key3];
  }

  renderComponents(node, elements);
}
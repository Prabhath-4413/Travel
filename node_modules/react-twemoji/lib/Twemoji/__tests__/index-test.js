"use strict";

var _chai = require("chai");

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _testUtils = _interopRequireDefault(require("react-dom/test-utils"));

var _ = _interopRequireDefault(require(".."));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-env mocha */
function renderTwemoji() {
  return _testUtils["default"].renderIntoDocument(_react["default"].createElement(_["default"], null, _react["default"].createElement("div", null, "\uD83D\uDE09", _react["default"].createElement("a", null, "\uD83D\uDE0A"))));
}

function renderTwemojiWithNoWrapper() {
  return _testUtils["default"].renderIntoDocument(_react["default"].createElement("div", null, _react["default"].createElement(_["default"], {
    noWrapper: true
  }, "\uD83D\uDE09", _react["default"].createElement("p", null, "\uD83D\uDE09", _react["default"].createElement("a", null, "\uD83D\uDE0A")))));
}

function renderTwemojiWithSpan() {
  return _testUtils["default"].renderIntoDocument(_react["default"].createElement(_["default"], {
    tag: "span"
  }, _react["default"].createElement("a", null, "\uD83D\uDE09\uD83D\uDE0A")));
}

suite('Twemoji', function () {
  test('should parse emoji in children', function () {
    var rendered = renderTwemoji();

    var node = _reactDom["default"].findDOMNode(rendered); // eslint-disable-line react/no-find-dom-node


    _chai.assert.equal(node.querySelectorAll('img').length, 2);
  });
  test('should render with custom tag when it\'s set', function () {
    var rendered = renderTwemojiWithSpan();

    var node = _reactDom["default"].findDOMNode(rendered); // eslint-disable-line react/no-find-dom-node


    _chai.assert.equal(node.tagName, 'SPAN');
  });
  test('should parse again when children is updated', function () {
    var node = document.createElement('div');

    _reactDom["default"].render(_react["default"].createElement(_["default"], null, "\uD83D\uDE10\uD83D\uDE11"), node);

    var oldSrc = node.querySelector('img').src; // triggers componentDidUpdate

    _reactDom["default"].render(_react["default"].createElement(_["default"], null, "\uD83D\uDE04"), node);

    var newSrc = node.querySelector('img').src;

    _chai.assert.equal(node.querySelectorAll('img').length, 1);

    _chai.assert.notEqual(oldSrc, newSrc);
  });
  test('should parse emoji in children when no wrapper is set and do not create a wrapper', function () {
    var rendered = renderTwemojiWithNoWrapper();

    var node = _reactDom["default"].findDOMNode(rendered); // eslint-disable-line react/no-find-dom-node


    _chai.assert.equal(node.querySelectorAll('div').length, 0);

    _chai.assert.equal(node.querySelectorAll('img').length, 2);

    _chai.assert.equal(node.querySelectorAll('p').length, 1);
  });
});
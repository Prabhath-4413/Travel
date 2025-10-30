"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _lodash = _interopRequireDefault(require("lodash.isequal"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _api = _interopRequireDefault(require("@twemoji/api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Twemoji =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Twemoji, _React$Component);

  function Twemoji(props) {
    var _this;

    _classCallCheck(this, Twemoji);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Twemoji).call(this, props));

    if (props.noWrapper) {
      _this.childrenRefs = {};
    } else {
      _this.rootRef = _react["default"].createRef();
    }

    return _this;
  }

  _createClass(Twemoji, [{
    key: "_parseTwemoji",
    value: function _parseTwemoji() {
      var noWrapper = this.props.noWrapper;

      if (noWrapper) {
        for (var i in this.childrenRefs) {
          var node = this.childrenRefs[i].current;

          _api["default"].parse(node, this.props.options);
        }
      } else {
        var _node = this.rootRef.current;

        _api["default"].parse(_node, this.props.options);
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (!(0, _lodash["default"])(this.props, prevProps)) {
        this._parseTwemoji();
      }
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      this._parseTwemoji();
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props = this.props,
          children = _this$props.children,
          noWrapper = _this$props.noWrapper,
          tag = _this$props.tag,
          other = _objectWithoutProperties(_this$props, ["children", "noWrapper", "tag"]);

      if (noWrapper) {
        return _react["default"].createElement(_react["default"].Fragment, null, _react["default"].Children.map(children, function (c, i) {
          if (typeof c === 'string') {
            // eslint-disable-next-line no-console
            console.warn("Twemoji can't parse string child when noWrapper is set. Skipping child \"".concat(c, "\""));
            return c;
          }

          _this2.childrenRefs[i] = _this2.childrenRefs[i] || _react["default"].createRef();
          return _react["default"].cloneElement(c, {
            ref: _this2.childrenRefs[i]
          });
        }));
      } else {
        delete other.options;
        return _react["default"].createElement(tag, _objectSpread({
          ref: this.rootRef
        }, other), children);
      }
    }
  }]);

  return Twemoji;
}(_react["default"].Component);

exports["default"] = Twemoji;

_defineProperty(Twemoji, "propTypes", {
  children: _propTypes["default"].node,
  noWrapper: _propTypes["default"].bool,
  options: _propTypes["default"].object,
  tag: _propTypes["default"].string
});

_defineProperty(Twemoji, "defaultProps", {
  tag: 'div'
});
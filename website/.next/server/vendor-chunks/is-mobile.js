"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-mobile";
exports.ids = ["vendor-chunks/is-mobile"];
exports.modules = {

/***/ "(ssr)/./node_modules/is-mobile/index.js":
/*!*****************************************!*\
  !*** ./node_modules/is-mobile/index.js ***!
  \*****************************************/
/***/ ((module) => {

eval("\n\nmodule.exports = isMobile\nmodule.exports.isMobile = isMobile\nmodule.exports[\"default\"] = isMobile\n\nconst mobileRE = /(android|bb\\d+|meego).+mobile|armv7l|avantgo|bada\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|redmi|series[46]0|samsungbrowser.*mobile|symbian|treo|up\\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i\nconst notMobileRE = /CrOS/\n\nconst tabletRE = /android|ipad|playbook|silk/i\n\nfunction isMobile (opts) {\n  if (!opts) opts = {}\n  let ua = opts.ua\n  if (!ua && typeof navigator !== 'undefined') ua = navigator.userAgent\n  if (ua && ua.headers && typeof ua.headers['user-agent'] === 'string') {\n    ua = ua.headers['user-agent']\n  }\n  if (typeof ua !== 'string') return false\n\n  let result =\n    (mobileRE.test(ua) && !notMobileRE.test(ua)) ||\n    (!!opts.tablet && tabletRE.test(ua))\n\n  if (\n    !result &&\n    opts.tablet &&\n    opts.featureDetect &&\n    navigator &&\n    navigator.maxTouchPoints > 1 &&\n    ua.indexOf('Macintosh') !== -1 &&\n    ua.indexOf('Safari') !== -1\n  ) {\n    result = true\n  }\n\n  return result\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXMtbW9iaWxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFZOztBQUVaO0FBQ0EsdUJBQXVCO0FBQ3ZCLHlCQUFzQjs7QUFFdEI7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIi9Vc2Vycy9zZW5naG9uZy9SZXBvcy8yMDI2L3JvbWxlay93ZWJzaXRlL25vZGVfbW9kdWxlcy9pcy1tb2JpbGUvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gaXNNb2JpbGVcbm1vZHVsZS5leHBvcnRzLmlzTW9iaWxlID0gaXNNb2JpbGVcbm1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPSBpc01vYmlsZVxuXG5jb25zdCBtb2JpbGVSRSA9IC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXJtdjdsfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXJpc3xraW5kbGV8bGdlIHxtYWVtb3xtaWRwfG1tcHxtb2JpbGUuK2ZpcmVmb3h8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxyZWRtaXxzZXJpZXNbNDZdMHxzYW1zdW5nYnJvd3Nlci4qbW9iaWxlfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIChjZXxwaG9uZSl8eGRhfHhpaW5vL2lcbmNvbnN0IG5vdE1vYmlsZVJFID0gL0NyT1MvXG5cbmNvbnN0IHRhYmxldFJFID0gL2FuZHJvaWR8aXBhZHxwbGF5Ym9va3xzaWxrL2lcblxuZnVuY3Rpb24gaXNNb2JpbGUgKG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge31cbiAgbGV0IHVhID0gb3B0cy51YVxuICBpZiAoIXVhICYmIHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnKSB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnRcbiAgaWYgKHVhICYmIHVhLmhlYWRlcnMgJiYgdHlwZW9mIHVhLmhlYWRlcnNbJ3VzZXItYWdlbnQnXSA9PT0gJ3N0cmluZycpIHtcbiAgICB1YSA9IHVhLmhlYWRlcnNbJ3VzZXItYWdlbnQnXVxuICB9XG4gIGlmICh0eXBlb2YgdWEgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2VcblxuICBsZXQgcmVzdWx0ID1cbiAgICAobW9iaWxlUkUudGVzdCh1YSkgJiYgIW5vdE1vYmlsZVJFLnRlc3QodWEpKSB8fFxuICAgICghIW9wdHMudGFibGV0ICYmIHRhYmxldFJFLnRlc3QodWEpKVxuXG4gIGlmIChcbiAgICAhcmVzdWx0ICYmXG4gICAgb3B0cy50YWJsZXQgJiZcbiAgICBvcHRzLmZlYXR1cmVEZXRlY3QgJiZcbiAgICBuYXZpZ2F0b3IgJiZcbiAgICBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMgPiAxICYmXG4gICAgdWEuaW5kZXhPZignTWFjaW50b3NoJykgIT09IC0xICYmXG4gICAgdWEuaW5kZXhPZignU2FmYXJpJykgIT09IC0xXG4gICkge1xuICAgIHJlc3VsdCA9IHRydWVcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/is-mobile/index.js\n");

/***/ })

};
;
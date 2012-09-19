var Prototype = {
    Version: '1.7',
    Browser: (function () {
        var ua = navigator.userAgent;
        var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
        return {
            IE: !! window.attachEvent && !isOpera,
            IE9: ('documentMode' in document) && document.documentMode == 9,
            Opera: isOpera,
            WebKit: ua.indexOf('AppleWebKit/') > -1,
            Gecko: ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
            MobileSafari: /Apple.*Mobile/.test(ua)
        }
    })(),
    BrowserFeatures: {
        XPath: !! document.evaluate,
        SelectorsAPI: !! document.querySelector,
        ElementExtensions: (function () {
            var constructor = window.Element || window.HTMLElement;
            return !!(constructor && constructor.prototype);
        })(),
        SpecificElementExtensions: (function () {
            if (typeof window.HTMLDivElement !== 'undefined') return true;
            var div = document.createElement('div'),
                form = document.createElement('form'),
                isSupported = false;
            if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
                isSupported = true;
            }
            div = form = null;
            return isSupported;
        })()
    },
    ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,
    emptyFunction: function () {},
    K: function (x) {
        return x
    }
};
if (Prototype.Browser.MobileSafari) Prototype.BrowserFeatures.SpecificElementExtensions = false;
var Abstract = {};
var Try = {
    these: function () {
        var returnValue;
        for (var i = 0, length = arguments.length; i < length; i++) {
            var lambda = arguments[i];
            try {
                returnValue = lambda();
                break;
            } catch (e) {}
        }
        return returnValue;
    }
};
var Class = (function () {
    var IS_DONTENUM_BUGGY = (function () {
        for (var p in {
            toString: 1
        }) {
            if (p === 'toString') return false;
        }
        return true;
    })();

    function subclass() {};

    function create() {
        var parent = null,
            properties = $A(arguments);
        if (Object.isFunction(properties[0])) parent = properties.shift();

        function klass() {
            this.initialize.apply(this, arguments);
        }
        Object.extend(klass, Class.Methods);
        klass.superclass = parent;
        klass.subclasses = [];
        if (parent) {
            subclass.prototype = parent.prototype;
            klass.prototype = new subclass;
            parent.subclasses.push(klass);
        }
        for (var i = 0, length = properties.length; i < length; i++)
        klass.addMethods(properties[i]);
        if (!klass.prototype.initialize) klass.prototype.initialize = Prototype.emptyFunction;
        klass.prototype.constructor = klass;
        return klass;
    }

    function addMethods(source) {
        var ancestor = this.superclass && this.superclass.prototype,
            properties = Object.keys(source);
        if (IS_DONTENUM_BUGGY) {
            if (source.toString != Object.prototype.toString) properties.push("toString");
            if (source.valueOf != Object.prototype.valueOf) properties.push("valueOf");
        }
        for (var i = 0, length = properties.length; i < length; i++) {
            var property = properties[i],
                value = source[property];
            if (ancestor && Object.isFunction(value) && value.argumentNames()[0] == "$super") {
                var method = value;
                value = (function (m) {
                    return function () {
                        return ancestor[m].apply(this, arguments);
                    };
                })(property).wrap(method);
                value.valueOf = method.valueOf.bind(method);
                value.toString = method.toString.bind(method);
            }
            this.prototype[property] = value;
        }
        return this;
    }
    return {
        create: create,
        Methods: {
            addMethods: addMethods
        }
    };
})();
(function () {
    var _toString = Object.prototype.toString,
        NULL_TYPE = 'Null',
        UNDEFINED_TYPE = 'Undefined',
        BOOLEAN_TYPE = 'Boolean',
        NUMBER_TYPE = 'Number',
        STRING_TYPE = 'String',
        OBJECT_TYPE = 'Object',
        FUNCTION_CLASS = '[object Function]',
        BOOLEAN_CLASS = '[object Boolean]',
        NUMBER_CLASS = '[object Number]',
        STRING_CLASS = '[object String]',
        ARRAY_CLASS = '[object Array]',
        DATE_CLASS = '[object Date]',
        NATIVE_JSON_STRINGIFY_SUPPORT = window.JSON && typeof JSON.stringify === 'function' && JSON.stringify(0) === '0' && typeof JSON.stringify(Prototype.K) === 'undefined';

    function Type(o) {
        switch (o) {
        case null:
            return NULL_TYPE;
        case (void 0):
            return UNDEFINED_TYPE;
        }
        var type = typeof o;
        switch (type) {
        case 'boolean':
            return BOOLEAN_TYPE;
        case 'number':
            return NUMBER_TYPE;
        case 'string':
            return STRING_TYPE;
        }
        return OBJECT_TYPE;
    }

    function extend(destination, source) {
        for (var property in source)
        destination[property] = source[property];
        return destination;
    }

    function inspect(object) {
        try {
            if (isUndefined(object)) return 'undefined';
            if (object === null) return 'null';
            return object.inspect ? object.inspect() : String(object);
        } catch (e) {
            if (e instanceof RangeError) return '...';
            throw e;
        }
    }

    function toJSON(value) {
        return Str('', {
            '': value
        }, []);
    }

    function Str(key, holder, stack) {
        var value = holder[key],
            type = typeof value;
        if (Type(value) === OBJECT_TYPE && typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }
        var _class = _toString.call(value);
        switch (_class) {
        case NUMBER_CLASS:
        case BOOLEAN_CLASS:
        case STRING_CLASS:
            value = value.valueOf();
        }
        switch (value) {
        case null:
            return 'null';
        case true:
            return 'true';
        case false:
            return 'false';
        }
        type = typeof value;
        switch (type) {
        case 'string':
            return value.inspect(true);
        case 'number':
            return isFinite(value) ? String(value) : 'null';
        case 'object':
            for (var i = 0, length = stack.length; i < length; i++) {
                if (stack[i] === value) {
                    throw new TypeError();
                }
            }
            stack.push(value);
            var partial = [];
            if (_class === ARRAY_CLASS) {
                for (var i = 0, length = value.length; i < length; i++) {
                    var str = Str(i, value, stack);
                    partial.push(typeof str === 'undefined' ? 'null' : str);
                }
                partial = '[' + partial.join(',') + ']';
            } else {
                var keys = Object.keys(value);
                for (var i = 0, length = keys.length; i < length; i++) {
                    var key = keys[i],
                        str = Str(key, value, stack);
                    if (typeof str !== "undefined") {
                        partial.push(key.inspect(true) + ':' + str);
                    }
                }
                partial = '{' + partial.join(',') + '}';
            }
            stack.pop();
            return partial;
        }
    }

    function stringify(object) {
        return JSON.stringify(object);
    }

    function toQueryString(object) {
        return $H(object).toQueryString();
    }

    function toHTML(object) {
        return object && object.toHTML ? object.toHTML() : String.interpret(object);
    }

    function keys(object) {
        if (Type(object) !== OBJECT_TYPE) {
            throw new TypeError();
        }
        var results = [];
        for (var property in object) {
            if (object.hasOwnProperty(property)) {
                results.push(property);
            }
        }
        return results;
    }

    function values(object) {
        var results = [];
        for (var property in object)
        results.push(object[property]);
        return results;
    }

    function clone(object) {
        return extend({}, object);
    }

    function isElement(object) {
        return !!(object && object.nodeType == 1);
    }

    function isArray(object) {
        return _toString.call(object) === ARRAY_CLASS;
    }
    var hasNativeIsArray = (typeof Array.isArray == 'function') && Array.isArray([]) && !Array.isArray({});
    if (hasNativeIsArray) {
        isArray = Array.isArray;
    }

    function isHash(object) {
        return object instanceof Hash;
    }

    function isFunction(object) {
        return _toString.call(object) === FUNCTION_CLASS;
    }

    function isString(object) {
        return _toString.call(object) === STRING_CLASS;
    }

    function isNumber(object) {
        return _toString.call(object) === NUMBER_CLASS;
    }

    function isDate(object) {
        return _toString.call(object) === DATE_CLASS;
    }

    function isUndefined(object) {
        return typeof object === "undefined";
    }
    extend(Object, {
        extend: extend,
        inspect: inspect,
        toJSON: NATIVE_JSON_STRINGIFY_SUPPORT ? stringify : toJSON,
        toQueryString: toQueryString,
        toHTML: toHTML,
        keys: Object.keys || keys,
        values: values,
        clone: clone,
        isElement: isElement,
        isArray: isArray,
        isHash: isHash,
        isFunction: isFunction,
        isString: isString,
        isNumber: isNumber,
        isDate: isDate,
        isUndefined: isUndefined
    });
})();
Object.extend(Function.prototype, (function () {
    var slice = Array.prototype.slice;

    function update(array, args) {
        var arrayLength = array.length,
            length = args.length;
        while (length--) array[arrayLength + length] = args[length];
        return array;
    }

    function merge(array, args) {
        array = slice.call(array, 0);
        return update(array, args);
    }

    function argumentNames() {
        var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1].replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').replace(/\s+/g, '').split(',');
        return names.length == 1 && !names[0] ? [] : names;
    }

    function bind(context) {
        if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
        var __method = this,
            args = slice.call(arguments, 1);
        return function () {
            var a = merge(args, arguments);
            return __method.apply(context, a);
        }
    }

    function bindAsEventListener(context) {
        var __method = this,
            args = slice.call(arguments, 1);
        return function (event) {
            var a = update([event || window.event], args);
            return __method.apply(context, a);
        }
    }

    function curry() {
        if (!arguments.length) return this;
        var __method = this,
            args = slice.call(arguments, 0);
        return function () {
            var a = merge(args, arguments);
            return __method.apply(this, a);
        }
    }

    function delay(timeout) {
        var __method = this,
            args = slice.call(arguments, 1);
        timeout = timeout * 1000;
        return window.setTimeout(function () {
            return __method.apply(__method, args);
        }, timeout);
    }

    function defer() {
        var args = update([0.01], arguments);
        return this.delay.apply(this, args);
    }

    function wrap(wrapper) {
        var __method = this;
        return function () {
            var a = update([__method.bind(this)], arguments);
            return wrapper.apply(this, a);
        }
    }

    function methodize() {
        if (this._methodized) return this._methodized;
        var __method = this;
        return this._methodized = function () {
            var a = update([this], arguments);
            return __method.apply(null, a);
        };
    }
    return {
        argumentNames: argumentNames,
        bind: bind,
        bindAsEventListener: bindAsEventListener,
        curry: curry,
        delay: delay,
        p_defer: defer,
        wrap: wrap,
        methodize: methodize
    }
})());
(function (proto) {
    function toISOString() {
        return this.getUTCFullYear() + '-' + (this.getUTCMonth() + 1).toPaddedString(2) + '-' + this.getUTCDate().toPaddedString(2) + 'T' + this.getUTCHours().toPaddedString(2) + ':' + this.getUTCMinutes().toPaddedString(2) + ':' + this.getUTCSeconds().toPaddedString(2) + 'Z';
    }

    function toJSON() {
        return this.toISOString();
    }
if (!proto.toISOString) proto.toISOString = toISOString;
if (!proto.toJSON) proto.toJSON = toJSON;
})(Date.prototype);
RegExp.prototype.match = RegExp.prototype.test;
RegExp.escape = function (str) {
    return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
    initialize: function (callback, frequency) {
        this.callback = callback;
        this.frequency = frequency;
        this.currentlyExecuting = false;
        this.registerCallback();
    },
    registerCallback: function () {
        this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
    },
    execute: function () {
        this.callback(this);
    },
    stop: function () {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
    },
    onTimerEvent: function () {
        if (!this.currentlyExecuting) {
            try {
                this.currentlyExecuting = true;
                this.execute();
                this.currentlyExecuting = false;
            } catch (e) {
                this.currentlyExecuting = false;
                throw e;
            }
        }
    }
});
Object.extend(String, {
    interpret: function (value) {
        return value == null ? '' : String(value);
    },
    specialChar: {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '\\': '\\\\'
    }
});
Object.extend(String.prototype, (function () {
    var NATIVE_JSON_PARSE_SUPPORT = window.JSON && typeof JSON.parse === 'function' && JSON.parse('{"test": true}').test;

    function prepareReplacement(replacement) {
        if (Object.isFunction(replacement)) return replacement;
        var template = new Template(replacement);
        return function (match) {
            return template.evaluate(match)
        };
    }

    function gsub(pattern, replacement) {
        var result = '',
            source = this,
            match;
        replacement = prepareReplacement(replacement);
        if (Object.isString(pattern)) pattern = RegExp.escape(pattern);
        if (!(pattern.length || pattern.source)) {
            replacement = replacement('');
            return replacement + source.split('').join(replacement) + replacement;
        }
        while (source.length > 0) {
            if (match = source.match(pattern)) {
                result += source.slice(0, match.index);
                result += String.interpret(replacement(match));
                source = source.slice(match.index + match[0].length);
            } else {
                result += source, source = '';
            }
        }
        return result;
    }

    function sub(pattern, replacement, count) {
        replacement = prepareReplacement(replacement);
        count = Object.isUndefined(count) ? 1 : count;
        return this.gsub(pattern, function (match) {
            if (--count < 0) return match[0];
            return replacement(match);
        });
    }

    function scan(pattern, iterator) {
        this.gsub(pattern, iterator);
        return String(this);
    }

    function truncate(length, truncation) {
        length = length || 30;
        truncation = Object.isUndefined(truncation) ? '...' : truncation;
        return this.length > length ? this.slice(0, length - truncation.length) + truncation : String(this);
    }

    function strip() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    }

    function stripTags() {
        return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
    }

    function stripScripts() {
        return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
    }

    function extractScripts() {
        var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
            matchOne = new RegExp(Prototype.ScriptFragment, 'im');
        return (this.match(matchAll) || []).map(function (scriptTag) {
            return (scriptTag.match(matchOne) || ['', ''])[1];
        });
    }

    function evalScripts() {
        return this.extractScripts().map(function (script) {
            return eval(script)
        });
    }

    function escapeHTML() {
        return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function unescapeHTML() {
        return this.stripTags().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }

    function toQueryParams(separator) {
        var match = this.strip().match(/([^?#]*)(#.*)?$/);
        if (!match) return {};
        return match[1].split(separator || '&').inject({}, function (hash, pair) {
            if ((pair = pair.split('='))[0]) {
                var key = decodeURIComponent(pair.shift()),
                    value = pair.length > 1 ? pair.join('=') : pair[0];
                if (value != undefined) value = decodeURIComponent(value);
                if (key in hash) {
                    if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
                    hash[key].push(value);
                } else hash[key] = value;
            }
            return hash;
        });
    }

    function toArray() {
        return this.split('');
    }

    function succ() {
        return this.slice(0, this.length - 1) + String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
    }

    function times(count) {
        return count < 1 ? '' : new Array(count + 1).join(this);
    }

    function camelize() {
        return this.replace(/-+(.)?/g, function (match, chr) {
            return chr ? chr.toUpperCase() : '';
        });
    }

    function capitalize() {
        return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
    }

    function underscore() {
        return this.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase();
    }

    function dasherize() {
        return this.replace(/_/g, '-');
    }

    function inspect(useDoubleQuotes) {
        var escapedString = this.replace(/[\x00-\x1f\\]/g, function (character) {
            if (character in String.specialChar) {
                return String.specialChar[character];
            }
            return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
        });
        if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
        return "'" + escapedString.replace(/'/g, '\\\'') + "'";
    }

    function unfilterJSON(filter) {
        return this.replace(filter || Prototype.JSONFilter, '$1');
    }

    function isJSON() {
        var str = this;
        if (str.blank()) return false;
        str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
        str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        return (/^[\],:{}\s]*$/).test(str);
    }

    function evalJSON(sanitize) {
        var json = this.unfilterJSON(),
            cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        if (cx.test(json)) {
            json = json.replace(cx, function (a) {
                return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            });
        }
        try {
            if (!sanitize || json.isJSON()) return eval('(' + json + ')');
        } catch (e) {}
        throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
    }

    function parseJSON() {
        var json = this.unfilterJSON();
        return JSON.parse(json);
    }

    function include(pattern) {
        return this.indexOf(pattern) > -1;
    }

    function startsWith(pattern) {
        return this.lastIndexOf(pattern, 0) === 0;
    }

    function endsWith(pattern) {
        var d = this.length - pattern.length;
        return d >= 0 && this.indexOf(pattern, d) === d;
    }

    function empty() {
        return this == '';
    }

    function blank() {
        return /^\s*$/.test(this);
    }

    function interpolate(object, pattern) {
        return new Template(this, pattern).evaluate(object);
    }
    return {
        gsub: gsub,
        sub: sub,
        scan: scan,
        truncate: truncate,
        strip: String.prototype.trim || strip,
        stripTags: stripTags,
        stripScripts: stripScripts,
        extractScripts: extractScripts,
        evalScripts: evalScripts,
        escapeHTML: escapeHTML,
        unescapeHTML: unescapeHTML,
        toQueryParams: toQueryParams,
        parseQuery: toQueryParams,
        toArray: toArray,
        succ: succ,
        times: times,
        camelize: camelize,
        capitalize: capitalize,
        underscore: underscore,
        dasherize: dasherize,
        inspect: inspect,
        unfilterJSON: unfilterJSON,
        isJSON: isJSON,
        evalJSON: NATIVE_JSON_PARSE_SUPPORT ? parseJSON : evalJSON,
        include: include,
        startsWith: startsWith,
        endsWith: endsWith,
        empty: empty,
        blank: blank,
        interpolate: interpolate
    };
})());
var Template = Class.create({
    initialize: function (template, pattern) {
        this.template = template.toString();
        this.pattern = pattern || Template.Pattern;
    },
    evaluate: function (object) {
        if (object && Object.isFunction(object.toTemplateReplacements)) object = object.toTemplateReplacements();
        return this.template.gsub(this.pattern, function (match) {
            if (object == null) return (match[1] + '');
            var before = match[1] || '';
            if (before == '\\') return match[2];
            var ctx = object,
                expr = match[3],
                pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;
            match = pattern.exec(expr);
            if (match == null) return before;
            while (match != null) {
                var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
                ctx = ctx[comp];
                if (null == ctx || '' == match[3]) break;
                expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
                match = pattern.exec(expr);
            }
            return before + String.interpret(ctx);
        });
    }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;
var $break = {};
var Enumerable = (function () {
    function each(iterator, context) {
        var index = 0;
        try {
            this._each(function (value) {
                iterator.call(context, value, index++);
            });
        } catch (e) {
            if (e != $break) throw e;
        }
        return this;
    }

    function eachSlice(number, iterator, context) {
        var index = -number,
            slices = [],
            array = this.toArray();
        if (number < 1) return array;
        while ((index += number) < array.length)
        slices.push(array.slice(index, index + number));
        return slices.collect(iterator, context);
    }

    function all(iterator, context) {
        iterator = iterator || Prototype.K;
        var result = true;
        this.each(function (value, index) {
            result = result && !! iterator.call(context, value, index);
            if (!result) throw $break;
        });
        return result;
    }

    function any(iterator, context) {
        iterator = iterator || Prototype.K;
        var result = false;
        this.each(function (value, index) {
            if (result = !! iterator.call(context, value, index)) throw $break;
        });
        return result;
    }

    function collect(iterator, context) {
        iterator = iterator || Prototype.K;
        var results = [];
        this.each(function (value, index) {
            results.push(iterator.call(context, value, index));
        });
        return results;
    }

    function detect(iterator, context) {
        var result;
        this.each(function (value, index) {
            if (iterator.call(context, value, index)) {
                result = value;
                throw $break;
            }
        });
        return result;
    }

    function findAll(iterator, context) {
        var results = [];
        this.each(function (value, index) {
            if (iterator.call(context, value, index)) results.push(value);
        });
        return results;
    }

    function grep(filter, iterator, context) {
        iterator = iterator || Prototype.K;
        var results = [];
        if (Object.isString(filter)) filter = new RegExp(RegExp.escape(filter));
        this.each(function (value, index) {
            if (filter.match(value)) results.push(iterator.call(context, value, index));
        });
        return results;
    }

    function include(object) {
        if (Object.isFunction(this.indexOf)) if (this.indexOf(object) != -1) return true;
        var found = false;
        this.each(function (value) {
            if (value == object) {
                found = true;
                throw $break;
            }
        });
        return found;
    }

    function inGroupsOf(number, fillWith) {
        fillWith = Object.isUndefined(fillWith) ? null : fillWith;
        return this.eachSlice(number, function (slice) {
            while (slice.length < number) slice.push(fillWith);
            return slice;
        });
    }

    function inject(memo, iterator, context) {
        this.each(function (value, index) {
            memo = iterator.call(context, memo, value, index);
        });
        return memo;
    }

    function invoke(method) {
        var args = $A(arguments).slice(1);
        return this.map(function (value) {
            return value[method].apply(value, args);
        });
    }

    function max(iterator, context) {
        iterator = iterator || Prototype.K;
        var result;
        this.each(function (value, index) {
            value = iterator.call(context, value, index);
            if (result == null || value >= result) result = value;
        });
        return result;
    }

    function min(iterator, context) {
        iterator = iterator || Prototype.K;
        var result;
        this.each(function (value, index) {
            value = iterator.call(context, value, index);
            if (result == null || value < result) result = value;
        });
        return result;
    }

    function partition(iterator, context) {
        iterator = iterator || Prototype.K;
        var trues = [],
            falses = [];
        this.each(function (value, index) {
            (iterator.call(context, value, index) ? trues : falses).push(value);
        });
        return [trues, falses];
    }

    function pluck(property) {
        var results = [];
        this.each(function (value) {
            results.push(value[property]);
        });
        return results;
    }

    function reject(iterator, context) {
        var results = [];
        this.each(function (value, index) {
            if (!iterator.call(context, value, index)) results.push(value);
        });
        return results;
    }

    function sortBy(iterator, context) {
        return this.map(function (value, index) {
            return {
                value: value,
                criteria: iterator.call(context, value, index)
            };
        }).sort(function (left, right) {
            var a = left.criteria,
                b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
    }

    function toArray() {
        return this.map();
    }

    function zip() {
        var iterator = Prototype.K,
            args = $A(arguments);
        if (Object.isFunction(args.last())) iterator = args.pop();
        var collections = [this].concat(args).map($A);
        return this.map(function (value, index) {
            return iterator(collections.pluck(index));
        });
    }

    function size() {
        return this.toArray().length;
    }

    function inspect() {
        return '#<Enumerable:' + this.toArray().inspect() + '>';
    }
    return {
        each: each,
        eachSlice: eachSlice,
        all: all,
        every: all,
        any: any,
        some: any,
        collect: collect,
        map: collect,
        detect: detect,
        findAll: findAll,
        select: findAll,
        filter: findAll,
        grep: grep,
        include: include,
        member: include,
        inGroupsOf: inGroupsOf,
        inject: inject,
        invoke: invoke,
        max: max,
        min: min,
        partition: partition,
        pluck: pluck,
        reject: reject,
        sortBy: sortBy,
        toArray: toArray,
        entries: toArray,
        zip: zip,
        size: size,
        inspect: inspect,
        find: detect
    };
})();

function $A(iterable) {
    if (!iterable) return [];
    if ('toArray' in Object(iterable)) return iterable.toArray();
    var length = iterable.length || 0,
        results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
}

function $w(string) {
    if (!Object.isString(string)) return [];
    string = string.strip();
    return string ? string.split(/\s+/) : [];
}
Array.from = $A;
(function () {
    var arrayProto = Array.prototype,
        slice = arrayProto.slice,
        _each = arrayProto.forEach;

    function each(iterator, context) {
        for (var i = 0, length = this.length >>> 0; i < length; i++) {
            if (i in this) iterator.call(context, this[i], i, this);
        }
    }
    if (!_each) _each = each;

    function clear() {
        this.length = 0;
        return this;
    }

    function first() {
        return this[0];
    }

    function last() {
        return this[this.length - 1];
    }

    function compact() {
        return this.select(function (value) {
            return value != null;
        });
    }

    function flatten() {
        return this.inject([], function (array, value) {
            if (Object.isArray(value)) return array.concat(value.flatten());
            array.push(value);
            return array;
        });
    }

    function without() {
        var values = slice.call(arguments, 0);
        return this.select(function (value) {
            return !values.include(value);
        });
    }

    function reverse(inline) {
        return (inline === false ? this.toArray() : this)._reverse();
    }

    function uniq(sorted) {
        return this.inject([], function (array, value, index) {
            if (0 == index || (sorted ? array.last() != value : !array.include(value))) array.push(value);
            return array;
        });
    }

    function intersect(array) {
        return this.uniq().findAll(function (item) {
            return array.detect(function (value) {
                return item === value
            });
        });
    }

    function clone() {
        return slice.call(this, 0);
    }

    function size() {
        return this.length;
    }

    function inspect() {
        return '[' + this.map(Object.inspect).join(', ') + ']';
    }

    function indexOf(item, i) {
        i || (i = 0);
        var length = this.length;
        if (i < 0) i = length + i;
        for (; i < length; i++)
        if (this[i] === item) return i;
        return -1;
    }

    function lastIndexOf(item, i) {
        i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
        var n = this.slice(0, i).reverse().indexOf(item);
        return (n < 0) ? n : i - n - 1;
    }

    function concat() {
        var array = slice.call(this, 0),
            item;
        for (var i = 0, length = arguments.length; i < length; i++) {
            item = arguments[i];
            if (Object.isArray(item) && !('callee' in item)) {
                for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
                array.push(item[j]);
            } else {
                array.push(item);
            }
        }
        return array;
    }
    Object.extend(arrayProto, Enumerable);
    if (!arrayProto._reverse) arrayProto._reverse = arrayProto.reverse;
    Object.extend(arrayProto, {
        _each: _each,
        clear: clear,
        first: first,
        last: last,
        compact: compact,
        flatten: flatten,
        without: without,
        reverse: reverse,
        uniq: uniq,
        intersect: intersect,
        clone: clone,
        toArray: clone,
        size: size,
        inspect: inspect
    });
    var CONCAT_ARGUMENTS_BUGGY = (function () {
        return [].concat(arguments)[0][0] !== 1;
    })(1, 2)
    if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;
    if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
    if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();

function $H(object) {
    return new Hash(object);
};
var Hash = Class.create(Enumerable, (function () {
    function initialize(object) {
        this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
    }

    function _each(iterator) {
        for (var key in this._object) {
            var value = this._object[key],
                pair = [key, value];
            pair.key = key;
            pair.value = value;
            iterator(pair);
        }
    }

    function set(key, value) {
        return this._object[key] = value;
    }

    function get(key) {
        if (this._object[key] !== Object.prototype[key]) return this._object[key];
    }

    function unset(key) {
        var value = this._object[key];
        delete this._object[key];
        return value;
    }

    function toObject() {
        return Object.clone(this._object);
    }

    function keys() {
        return this.pluck('key');
    }

    function values() {
        return this.pluck('value');
    }

    function index(value) {
        var match = this.detect(function (pair) {
            return pair.value === value;
        });
        return match && match.key;
    }

    function merge(object) {
        return this.clone().update(object);
    }

    function update(object) {
        return new Hash(object).inject(this, function (result, pair) {
            result.set(pair.key, pair.value);
            return result;
        });
    }

    function toQueryPair(key, value) {
        if (Object.isUndefined(value)) return key;
        return key + '=' + encodeURIComponent(String.interpret(value));
    }

    function toQueryString() {
        return this.inject([], function (results, pair) {
            var key = encodeURIComponent(pair.key),
                values = pair.value;
            if (values && typeof values == 'object') {
                if (Object.isArray(values)) {
                    var queryValues = [];
                    for (var i = 0, len = values.length, value; i < len; i++) {
                        value = values[i];
                        queryValues.push(toQueryPair(key, value));
                    }
                    return results.concat(queryValues);
                }
            } else results.push(toQueryPair(key, values));
            return results;
        }).join('&');
    }

    function inspect() {
        return '#<Hash:{' + this.map(function (pair) {
            return pair.map(Object.inspect).join(': ');
        }).join(', ') + '}>';
    }

    function clone() {
        return new Hash(this);
    }
    return {
        initialize: initialize,
        _each: _each,
        set: set,
        get: get,
        unset: unset,
        toObject: toObject,
        toTemplateReplacements: toObject,
        keys: keys,
        values: values,
        index: index,
        merge: merge,
        update: update,
        toQueryString: toQueryString,
        inspect: inspect,
        toJSON: toObject,
        clone: clone
    };
})());
Hash.from = $H;
Object.extend(Number.prototype, (function () {
    function toColorPart() {
        return this.toPaddedString(2, 16);
    }

    function succ() {
        return this + 1;
    }

    function times(iterator, context) {
        $R(0, this, true).each(iterator, context);
        return this;
    }

    function toPaddedString(length, radix) {
        var string = this.toString(radix || 10);
        return '0'.times(length - string.length) + string;
    }

    function abs() {
        return Math.abs(this);
    }

    function round() {
        return Math.round(this);
    }

    function ceil() {
        return Math.ceil(this);
    }

    function floor() {
        return Math.floor(this);
    }
    return {
        toColorPart: toColorPart,
        succ: succ,
        times: times,
        toPaddedString: toPaddedString,
        abs: abs,
        round: round,
        ceil: ceil,
        floor: floor
    };
})());

function $R(start, end, exclusive) {
    return new ObjectRange(start, end, exclusive);
}
var ObjectRange = Class.create(Enumerable, (function () {
    function initialize(start, end, exclusive) {
        this.start = start;
        this.end = end;
        this.exclusive = exclusive;
    }

    function _each(iterator) {
        var value = this.start;
        while (this.include(value)) {
            iterator(value);
            value = value.succ();
        }
    }

    function include(value) {
        if (value < this.start) return false;
        if (this.exclusive) return value < this.end;
        return value <= this.end;
    }
    return {
        initialize: initialize,
        _each: _each,
        include: include
    };
})());
var Ajax = {
    getTransport: function () {
        return Try.these(function () {
            return new XMLHttpRequest()
        }, function () {
            return new ActiveXObject('Msxml2.XMLHTTP')
        }, function () {
            return new ActiveXObject('Microsoft.XMLHTTP')
        }) || false;
    },
    activeRequestCount: 0
};
Ajax.Responders = {
    responders: [],
    _each: function (iterator) {
        this.responders._each(iterator);
    },
    register: function (responder) {
        if (!this.include(responder)) this.responders.push(responder);
    },
    unregister: function (responder) {
        this.responders = this.responders.without(responder);
    },
    dispatch: function (callback, request, transport, json) {
        this.each(function (responder) {
            if (Object.isFunction(responder[callback])) {
                try {
                    responder[callback].apply(responder, [request, transport, json]);
                } catch (e) {}
            }
        });
    }
};
Object.extend(Ajax.Responders, Enumerable);
Ajax.Responders.register({
    onCreate: function () {
        Ajax.activeRequestCount++
    },
    onComplete: function () {
        Ajax.activeRequestCount--
    }
});
Ajax.Base = Class.create({
    initialize: function (options) {
        this.options = {
            method: 'post',
            asynchronous: true,
            contentType: 'application/x-www-form-urlencoded',
            encoding: 'UTF-8',
            parameters: '',
            evalJSON: true,
            evalJS: true
        };
        Object.extend(this.options, options || {});
        this.options.method = this.options.method.toLowerCase();
        if (Object.isHash(this.options.parameters)) this.options.parameters = this.options.parameters.toObject();
    }
});
Ajax.Request = Class.create(Ajax.Base, {
    _complete: false,
    initialize: function ($super, url, options) {
        $super(options);
        this.transport = Ajax.getTransport();
        this.request(url);
    },
    request: function (url) {
        this.url = url;
        this.method = this.options.method;
        var params = Object.isString(this.options.parameters) ? this.options.parameters : Object.toQueryString(this.options.parameters);
        if (!['get', 'post'].include(this.method)) {
            params += (params ? '&' : '') + "_method=" + this.method;
            this.method = 'post';
        }
        if (params && this.method === 'get') {
            this.url += (this.url.include('?') ? '&' : '?') + params;
        }
        this.parameters = params.toQueryParams();
        try {
            var response = new Ajax.Response(this);
            if (this.options.onCreate) this.options.onCreate(response);
            Ajax.Responders.dispatch('onCreate', this, response);
            this.transport.open(this.method.toUpperCase(), this.url, this.options.asynchronous);
            if (this.options.asynchronous) this.respondToReadyState.bind(this).p_defer(1);
            this.transport.onreadystatechange = this.onStateChange.bind(this);
            this.setRequestHeaders();
            this.body = this.method == 'post' ? (this.options.postBody || params) : null;
            this.transport.send(this.body);
            if (!this.options.asynchronous && this.transport.overrideMimeType) this.onStateChange();
        } catch (e) {
            this.dispatchException(e);
        }
    },
    onStateChange: function () {
        var readyState = this.transport.readyState;
        if (readyState > 1 && !((readyState == 4) && this._complete)) this.respondToReadyState(this.transport.readyState);
    },
    setRequestHeaders: function () {
        var headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Prototype-Version': Prototype.Version,
            'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        };
        if (this.method == 'post') {
            headers['Content-type'] = this.options.contentType + (this.options.encoding ? '; charset=' + this.options.encoding : '');
            if (this.transport.overrideMimeType && (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0, 2005])[1] < 2005) headers['Connection'] = 'close';
        }
        if (typeof this.options.requestHeaders == 'object') {
            var extras = this.options.requestHeaders;
            if (Object.isFunction(extras.push)) for (var i = 0, length = extras.length; i < length; i += 2)
            headers[extras[i]] = extras[i + 1];
            else
            $H(extras).each(function (pair) {
                headers[pair.key] = pair.value
            });
        }
        for (var name in headers)
        this.transport.setRequestHeader(name, headers[name]);
    },
    success: function () {
        var status = this.getStatus();
        return !status || (status >= 200 && status < 300) || status == 304;
    },
    getStatus: function () {
        try {
            if (this.transport.status === 1223) return 204;
            return this.transport.status || 0;
        } catch (e) {
            return 0
        }
    },
    respondToReadyState: function (readyState) {
        var state = Ajax.Request.Events[readyState],
            response = new Ajax.Response(this);
        if (state == 'Complete') {
            try {
                this._complete = true;
                (this.options['on' + response.status] || this.options['on' + (this.success() ? 'Success' : 'Failure')] || Prototype.emptyFunction)(response, response.headerJSON);
            } catch (e) {
                this.dispatchException(e);
            }
            var contentType = response.getHeader('Content-type');
            if (this.options.evalJS == 'force' || (this.options.evalJS && this.isSameOrigin() && contentType && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i))) this.evalResponse();
        }
try {
    (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
    Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
} catch (e) {
    this.dispatchException(e);
}
if (state == 'Complete') {
    this.transport.onreadystatechange = Prototype.emptyFunction;
}
}, isSameOrigin: function () {
    var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
    return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
        protocol: location.protocol,
        domain: document.domain,
        port: location.port ? ':' + location.port : ''
    }));
},
getHeader: function (name) {
    try {
        return this.transport.getResponseHeader(name) || null;
    } catch (e) {
        return null;
    }
},
evalResponse: function () {
    try {
        return eval((this.transport.responseText || '').unfilterJSON());
    } catch (e) {
        this.dispatchException(e);
    }
},
dispatchException: function (exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
}
});Ajax.Request.Events = ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];Ajax.Response = Class.create({
    initialize: function (request) {
        this.request = request;
        var transport = this.transport = request.transport,
            readyState = this.readyState = transport.readyState;
        if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
            this.status = this.getStatus();
            this.statusText = this.getStatusText();
            this.responseText = String.interpret(transport.responseText);
            this.headerJSON = this._getHeaderJSON();
        }
        if (readyState == 4) {
            var xml = transport.responseXML;
            this.responseXML = Object.isUndefined(xml) ? null : xml;
            this.responseJSON = this._getResponseJSON();
        }
    },
    status: 0,
    statusText: '',
    getStatus: Ajax.Request.prototype.getStatus,
    getStatusText: function () {
        try {
            return this.transport.statusText || '';
        } catch (e) {
            return ''
        }
    },
    getHeader: Ajax.Request.prototype.getHeader,
    getAllHeaders: function () {
        try {
            return this.getAllResponseHeaders();
        } catch (e) {
            return null
        }
    },
    getResponseHeader: function (name) {
        return this.transport.getResponseHeader(name);
    },
    getAllResponseHeaders: function () {
        return this.transport.getAllResponseHeaders();
    },
    _getHeaderJSON: function () {
        var json = this.getHeader('X-JSON');
        if (!json) return null;
        json = decodeURIComponent(escape(json));
        try {
            return json.evalJSON(this.request.options.sanitizeJSON || !this.request.isSameOrigin());
        } catch (e) {
            this.request.dispatchException(e);
        }
    },
    _getResponseJSON: function () {
        var options = this.request.options;
        if (!options.evalJSON || (options.evalJSON != 'force' && !(this.getHeader('Content-type') || '').include('application/json')) || this.responseText.blank()) return null;
        try {
            return this.responseText.evalJSON(options.sanitizeJSON || !this.request.isSameOrigin());
        } catch (e) {
            this.request.dispatchException(e);
        }
    }
});Ajax.Updater = Class.create(Ajax.Request, {
    initialize: function ($super, container, url, options) {
        this.container = {
            success: (container.success || container),
            failure: (container.failure || (container.success ? null : container))
        };
        options = Object.clone(options);
        var onComplete = options.onComplete;
        options.onComplete = (function (response, json) {
            this.updateContent(response.responseText);
            if (Object.isFunction(onComplete)) onComplete(response, json);
        }).bind(this);
        $super(url, options);
    },
    updateContent: function (responseText) {
        var receiver = this.container[this.success() ? 'success' : 'failure'],
            options = this.options;
        if (!options.evalScripts) responseText = responseText.stripScripts();
        if (receiver = $(receiver)) {
            if (options.insertion) {
                if (Object.isString(options.insertion)) {
                    var insertion = {};
                    insertion[options.insertion] = responseText;
                    receiver.insert(insertion);
                } else options.insertion(receiver, responseText);
            } else receiver.update(responseText);
        }
    }
});Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
    initialize: function ($super, container, url, options) {
        $super(options);
        this.onComplete = this.options.onComplete;
        this.frequency = (this.options.frequency || 2);
        this.decay = (this.options.decay || 1);
        this.updater = {};
        this.container = container;
        this.url = url;
        this.start();
    },
    start: function () {
        this.options.onComplete = this.updateComplete.bind(this);
        this.onTimerEvent();
    },
    stop: function () {
        this.updater.options.onComplete = undefined;
        clearTimeout(this.timer);
        (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
    },
    updateComplete: function (response) {
        if (this.options.decay) {
            this.decay = (response.responseText == this.lastText ? this.decay * this.options.decay : 1);
            this.lastText = response.responseText;
        }
        this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
    },
    onTimerEvent: function () {
        this.updater = new Ajax.Updater(this.container, this.url, this.options);
    }
});

function $(element) {
    if (arguments.length > 1) {
        for (var i = 0, elements = [], length = arguments.length; i < length; i++)
        elements.push($(arguments[i]));
        return elements;
    }
    if (Object.isString(element)) element = document.getElementById(element);
    return Element.extend(element);
}
if (Prototype.BrowserFeatures.XPath) {
    document._getElementsByXPath = function (expression, parentElement) {
        var results = [];
        var query = document.evaluate(expression, $(parentElement) || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0, length = query.snapshotLength; i < length; i++)
        results.push(Element.extend(query.snapshotItem(i)));
        return results;
    };
}
if (!Node) var Node = {};
if (!Node.ELEMENT_NODE) {
    Object.extend(Node, {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        ENTITY_REFERENCE_NODE: 5,
        ENTITY_NODE: 6,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9,
        DOCUMENT_TYPE_NODE: 10,
        DOCUMENT_FRAGMENT_NODE: 11,
        NOTATION_NODE: 12
    });
}(function (global) {
    function shouldUseCache(tagName, attributes) {
        if (tagName === 'select') return false;
        if ('type' in attributes) return false;
        return true;
    }
    var HAS_EXTENDED_CREATE_ELEMENT_SYNTAX = (function () {
        try {
            var el = document.createElement('<input name="x">');
            return el.tagName.toLowerCase() === 'input' && el.name === 'x';
        } catch (err) {
            return false;
        }
    })();
    var element = global.Element;
    global.Element = function (tagName, attributes) {
        attributes = attributes || {};
        tagName = tagName.toLowerCase();
        var cache = Element.cache;
        if (HAS_EXTENDED_CREATE_ELEMENT_SYNTAX && attributes.name) {
            tagName = '<' + tagName + ' name="' + attributes.name + '">';
            delete attributes.name;
            return Element.writeAttribute(document.createElement(tagName), attributes);
        }
        if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));
        var node = shouldUseCache(tagName, attributes) ? cache[tagName].cloneNode(false) : document.createElement(tagName);
        return Element.writeAttribute(node, attributes);
    };
    Object.extend(global.Element, element || {});
    if (element) global.Element.prototype = element.prototype;
})(this);Element.idCounter = 1;Element.cache = {};Element._purgeElement = function (element) {
    var uid = element._prototypeUID;
    if (uid) {
        Element.stopObserving(element);
        element._prototypeUID = void 0;
        delete Element.Storage[uid];
    }
}
Element.Methods = {
    visible: function (element) {
        return $(element).style.display != 'none';
    },
    toggle: function (element) {
        element = $(element);
        Element[Element.visible(element) ? 'hide' : 'show'](element);
        return element;
    },
    hide: function (element) {
        element = $(element);
        element.style.display = 'none';
        return element;
    },
    show: function (element) {
        element = $(element);
        element.style.display = '';
        return element;
    },
    remove: function (element) {
        element = $(element);
        element.parentNode.removeChild(element);
        return element;
    },
    update: (function () {
        var SELECT_ELEMENT_INNERHTML_BUGGY = (function () {
            var el = document.createElement("select"),
                isBuggy = true;
            el.innerHTML = "<option value=\"test\">test</option>";
            if (el.options && el.options[0]) {
                isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
            }
            el = null;
            return isBuggy;
        })();
        var TABLE_ELEMENT_INNERHTML_BUGGY = (function () {
            try {
                var el = document.createElement("table");
                if (el && el.tBodies) {
                    el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
                    var isBuggy = typeof el.tBodies[0] == "undefined";
                    el = null;
                    return isBuggy;
                }
            } catch (e) {
                return true;
            }
        })();
        var LINK_ELEMENT_INNERHTML_BUGGY = (function () {
            try {
                var el = document.createElement('div');
                el.innerHTML = "<link>";
                var isBuggy = (el.childNodes.length === 0);
                el = null;
                return isBuggy;
            } catch (e) {
                return true;
            }
        })();
        var ANY_INNERHTML_BUGGY = SELECT_ELEMENT_INNERHTML_BUGGY || TABLE_ELEMENT_INNERHTML_BUGGY || LINK_ELEMENT_INNERHTML_BUGGY;
        var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function () {
            var s = document.createElement("script"),
                isBuggy = false;
            try {
                s.appendChild(document.createTextNode(""));
                isBuggy = !s.firstChild || s.firstChild && s.firstChild.nodeType !== 3;
            } catch (e) {
                isBuggy = true;
            }
            s = null;
            return isBuggy;
        })();

        function update(element, content) {
            element = $(element);
            var purgeElement = Element._purgeElement;
            var descendants = element.getElementsByTagName('*'),
                i = descendants.length;
            while (i--) purgeElement(descendants[i]);
            if (content && content.toElement) content = content.toElement();
            if (Object.isElement(content)) return element.update().insert(content);
            content = Object.toHTML(content);
            var tagName = element.tagName.toUpperCase();
            if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
                element.text = content;
                return element;
            }
            if (ANY_INNERHTML_BUGGY) {
                if (tagName in Element._insertionTranslations.tags) {
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    Element._getContentFromAnonymousElement(tagName, content.stripScripts()).each(function (node) {
                        element.appendChild(node)
                    });
                } else if (LINK_ELEMENT_INNERHTML_BUGGY && Object.isString(content) && content.indexOf('<link') > -1) {
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    var nodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts(), true);
                    nodes.each(function (node) {
                        element.appendChild(node)
                    });
                } else {
                    element.innerHTML = content.stripScripts();
                }
            } else {
                element.innerHTML = content.stripScripts();
            }
            content.evalScripts.bind(content).p_defer();
            return element;
        }
        return update;
    })(),
    replace: function (element, content) {
        element = $(element);
        if (content && content.toElement) content = content.toElement();
        else if (!Object.isElement(content)) {
            content = Object.toHTML(content);
            var range = element.ownerDocument.createRange();
            range.selectNode(element);
            content.evalScripts.bind(content).p_defer();
            content = range.createContextualFragment(content.stripScripts());
        }
        element.parentNode.replaceChild(content, element);
        return element;
    },
    insert: function (element, insertions) {
        element = $(element);
        if (Object.isString(insertions) || Object.isNumber(insertions) || Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML))) insertions = {
            bottom: insertions
        };
        var content, insert, tagName, childNodes;
        for (var position in insertions) {
            content = insertions[position];
            position = position.toLowerCase();
            insert = Element._insertionTranslations[position];
            if (content && content.toElement) content = content.toElement();
            if (Object.isElement(content)) {
                insert(element, content);
                continue;
            }
            content = Object.toHTML(content);
            tagName = ((position == 'before' || position == 'after') ? element.parentNode : element).tagName.toUpperCase();
            childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
            if (position == 'top' || position == 'after') childNodes.reverse();
            childNodes.each(insert.curry(element));
            content.evalScripts.bind(content).p_defer();
        }
        return element;
    },
    wrap: function (element, wrapper, attributes) {
        element = $(element);
        if (Object.isElement(wrapper)) $(wrapper).writeAttribute(attributes || {});
        else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
        else wrapper = new Element('div', wrapper);
        if (element.parentNode) element.parentNode.replaceChild(wrapper, element);
        wrapper.appendChild(element);
        return wrapper;
    },
    inspect: function (element) {
        element = $(element);
        var result = '<' + element.tagName.toLowerCase();
        $H({
            'id': 'id',
            'className': 'class'
        }).each(function (pair) {
            var property = pair.first(),
                attribute = pair.last(),
                value = (element[property] || '').toString();
            if (value) result += ' ' + attribute + '=' + value.inspect(true);
        });
        return result + '>';
    },
    recursivelyCollect: function (element, property, maximumLength) {
        element = $(element);
        maximumLength = maximumLength || -1;
        var elements = [];
        while (element = element[property]) {
            if (element.nodeType == 1) elements.push(Element.extend(element));
            if (elements.length == maximumLength) break;
        }
        return elements;
    },
    ancestors: function (element) {
        return Element.recursivelyCollect(element, 'parentNode');
    },
    descendants: function (element) {
        return Element.select(element, "*");
    },
    firstDescendant: function (element) {
        element = $(element).firstChild;
        while (element && element.nodeType != 1) element = element.nextSibling;
        return $(element);
    },
    immediateDescendants: function (element) {
        var results = [],
            child = $(element).firstChild;
        while (child) {
            if (child.nodeType === 1) {
                results.push(Element.extend(child));
            }
            child = child.nextSibling;
        }
        return results;
    },
    previousSiblings: function (element, maximumLength) {
        return Element.recursivelyCollect(element, 'previousSibling');
    },
    nextSiblings: function (element) {
        return Element.recursivelyCollect(element, 'nextSibling');
    },
    siblings: function (element) {
        element = $(element);
        return Element.previousSiblings(element).reverse().concat(Element.nextSiblings(element));
    },
    match: function (element, selector) {
        element = $(element);
        if (Object.isString(selector)) return Prototype.Selector.match(element, selector);
        return selector.match(element);
    },
    up: function (element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return $(element.parentNode);
        var ancestors = Element.ancestors(element);
        return Object.isNumber(expression) ? ancestors[expression] : Prototype.Selector.find(ancestors, expression, index);
    },
    down: function (element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return Element.firstDescendant(element);
        return Object.isNumber(expression) ? Element.descendants(element)[expression] : Element.select(element, expression)[index || 0];
    },
    previous: function (element, expression, index) {
        element = $(element);
        if (Object.isNumber(expression)) index = expression, expression = false;
        if (!Object.isNumber(index)) index = 0;
        if (expression) {
            return Prototype.Selector.find(element.previousSiblings(), expression, index);
        } else {
            return element.recursivelyCollect("previousSibling", index + 1)[index];
        }
    },
    next: function (element, expression, index) {
        element = $(element);
        if (Object.isNumber(expression)) index = expression, expression = false;
        if (!Object.isNumber(index)) index = 0;
        if (expression) {
            return Prototype.Selector.find(element.nextSiblings(), expression, index);
        } else {
            var maximumLength = Object.isNumber(index) ? index + 1 : 1;
            return element.recursivelyCollect("nextSibling", index + 1)[index];
        }
    },
    select: function (element) {
        element = $(element);
        var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
        return Prototype.Selector.select(expressions, element);
    },
    adjacent: function (element) {
        element = $(element);
        var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
        return Prototype.Selector.select(expressions, element.parentNode).without(element);
    },
    identify: function (element) {
        element = $(element);
        var id = Element.readAttribute(element, 'id');
        if (id) return id;
        do {
            id = 'anonymous_element_' + Element.idCounter++
        } while ($(id));
        Element.writeAttribute(element, 'id', id);
        return id;
    },
    readAttribute: function (element, name) {
        element = $(element);
        if (Prototype.Browser.IE) {
            var t = Element._attributeTranslations.read;
            if (t.values[name]) return t.values[name](element, name);
            if (t.names[name]) name = t.names[name];
            if (name.include(':')) {
                return (!element.attributes || !element.attributes[name]) ? null : element.attributes[name].value;
            }
        }
        return element.getAttribute(name);
    },
    writeAttribute: function (element, name, value) {
        element = $(element);
        var attributes = {},
            t = Element._attributeTranslations.write;
        if (typeof name == 'object') attributes = name;
        else attributes[name] = Object.isUndefined(value) ? true : value;
        for (var attr in attributes) {
            name = t.names[attr] || attr;
            value = attributes[attr];
            if (t.values[attr]) name = t.values[attr](element, value);
            if (value === false || value === null) element.removeAttribute(name);
            else if (value === true) element.setAttribute(name, name);
            else element.setAttribute(name, value);
        }
        return element;
    },
    getHeight: function (element) {
        return Element.getDimensions(element).height;
    },
    getWidth: function (element) {
        return Element.getDimensions(element).width;
    },
    classNames: function (element) {
        return new Element.ClassNames(element);
    },
    hasClassName: function (element, className) {
        if (!(element = $(element))) return;
        var elementClassName = element.className;
        return (elementClassName.length > 0 && (elementClassName == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
    },
    addClassName: function (element, className) {
        if (!(element = $(element))) return;
        if (!Element.hasClassName(element, className)) element.className += (element.className ? ' ' : '') + className;
        return element;
    },
    removeClassName: function (element, className) {
        if (!(element = $(element))) return;
        element.className = element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
        return element;
    },
    toggleClassName: function (element, className) {
        if (!(element = $(element))) return;
        return Element[Element.hasClassName(element, className) ? 'removeClassName' : 'addClassName'](element, className);
    },
    cleanWhitespace: function (element) {
        element = $(element);
        var node = element.firstChild;
        while (node) {
            var nextNode = node.nextSibling;
            if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) element.removeChild(node);
            node = nextNode;
        }
        return element;
    },
    empty: function (element) {
        return $(element).innerHTML.blank();
    },
    descendantOf: function (element, ancestor) {
        element = $(element), ancestor = $(ancestor);
        if (element.compareDocumentPosition) return (element.compareDocumentPosition(ancestor) & 8) === 8;
        if (ancestor.contains) return ancestor.contains(element) && ancestor !== element;
        while (element = element.parentNode)
        if (element == ancestor) return true;
        return false;
    },
    scrollTo: function (element) {
        element = $(element);
        var pos = Element.cumulativeOffset(element);
        window.scrollTo(pos[0], pos[1]);
        return element;
    },
    getStyle: function (element, style) {
        element = $(element);
        style = style == 'float' ? 'cssFloat' : style.camelize();
        var value = element.style[style];
        if (!value || value == 'auto') {
            var css = document.defaultView.getComputedStyle(element, null);
            value = css ? css[style] : null;
        }
        if (style == 'opacity') return value ? parseFloat(value) : 1.0;
        return value == 'auto' ? null : value;
    },
    getOpacity: function (element) {
        return $(element).getStyle('opacity');
    },
    setStyle: function (element, styles) {
        element = $(element);
        var elementStyle = element.style,
            match;
        if (Object.isString(styles)) {
            element.style.cssText += ';' + styles;
            return styles.include('opacity') ? element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
        }
        for (var property in styles)
        if (property == 'opacity') element.setOpacity(styles[property]);
        else
        elementStyle[(property == 'float' || property == 'cssFloat') ? (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') : property] = styles[property];
        return element;
    },
    setOpacity: function (element, value) {
		
        element = $(element);
		if(element!== undefined)
		{	
			if(element.style !== undefined )
        		element.style.opacity = (value == 1 || value === '') ? '' : (value < 0.00001) ? 0 : value;
		}
        return element;
    },
    makePositioned: function (element) {
        element = $(element);
        var pos = Element.getStyle(element, 'position');
        if (pos == 'static' || !pos) {
            element._madePositioned = true;
            element.style.position = 'relative';
            if (Prototype.Browser.Opera) {
                element.style.top = 0;
                element.style.left = 0;
            }
        }
        return element;
    },
    undoPositioned: function (element) {
        element = $(element);
        if (element._madePositioned) {
            element._madePositioned = undefined;
            element.style.position = element.style.top = element.style.left = element.style.bottom = element.style.right = '';
        }
        return element;
    },
    makeClipping: function (element) {
        element = $(element);
        if (element._overflow) return element;
        element._overflow = Element.getStyle(element, 'overflow') || 'auto';
        if (element._overflow !== 'hidden') element.style.overflow = 'hidden';
        return element;
    },
    undoClipping: function (element) {
        element = $(element);
        if (!element._overflow) return element;
        element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
        element._overflow = null;
        return element;
    },
    clonePosition: function (element, source) {
        var options = Object.extend({
            setLeft: true,
            setTop: true,
            setWidth: true,
            setHeight: true,
            offsetTop: 0,
            offsetLeft: 0
        }, arguments[2] || {});
        source = $(source);
        var p = Element.viewportOffset(source),
            delta = [0, 0],
            parent = null;
        element = $(element);
        if (Element.getStyle(element, 'position') == 'absolute') {
            parent = Element.getOffsetParent(element);
            delta = Element.viewportOffset(parent);
        }
        if (parent == document.body) {
            delta[0] -= document.body.offsetLeft;
            delta[1] -= document.body.offsetTop;
        }
        if (options.setLeft) element.style.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
        if (options.setTop) element.style.top = (p[1] - delta[1] + options.offsetTop) + 'px';
        if (options.setWidth) element.style.width = source.offsetWidth + 'px';
        if (options.setHeight) element.style.height = source.offsetHeight + 'px';
        return element;
    }
};Object.extend(Element.Methods, {
    getElementsBySelector: Element.Methods.select,
    childElements: Element.Methods.immediateDescendants
});Element._attributeTranslations = {
    write: {
        names: {
            className: 'class',
            htmlFor: 'for'
        },
        values: {}
    }
};
if (Prototype.Browser.Opera) {
    Element.Methods.getStyle = Element.Methods.getStyle.wrap(function (proceed, element, style) {
        switch (style) {
        case 'height':
        case 'width':
            if (!Element.visible(element)) return null;
            var dim = parseInt(proceed(element, style), 10);
            if (dim !== element['offset' + style.capitalize()]) return dim + 'px';
            var properties;
            if (style === 'height') {
                properties = ['border-top-width', 'padding-top', 'padding-bottom', 'border-bottom-width'];
            } else {
                properties = ['border-left-width', 'padding-left', 'padding-right', 'border-right-width'];
            }
            return properties.inject(dim, function (memo, property) {
                var val = proceed(element, property);
                return val === null ? memo : memo - parseInt(val, 10);
            }) + 'px';
        default:
            return proceed(element, style);
        }
    });
    Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(function (proceed, element, attribute) {
        if (attribute === 'title') return element.title;
        return proceed(element, attribute);
    });
} else if (Prototype.Browser.IE) {
    Element.Methods.getStyle = function (element, style) {
        element = $(element);
        style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
        var value = element.style[style];
        if (!value && element.currentStyle) value = element.currentStyle[style];
        if (style == 'opacity') {
            if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/)) if (value[1]) return parseFloat(value[1]) / 100;
            return 1.0;
        }
        if (value == 'auto') {
            if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none')) return element['offset' + style.capitalize()] + 'px';
            return null;
        }
        return value;
    };
    Element.Methods.setOpacity = function (element, value) {
        function stripAlpha(filter) {
            return filter.replace(/alpha\([^\)]*\)/gi, '');
        }
        element = $(element);
        var currentStyle = element.currentStyle;
        if ((currentStyle && !currentStyle.hasLayout) || (!currentStyle && element.style.zoom == 'normal')) element.style.zoom = 1;
        var filter = element.getStyle('filter'),
            style = element.style;
        if (value == 1 || value === '') {
            (filter = stripAlpha(filter)) ? style.filter = filter : style.removeAttribute('filter');
            return element;
        } else if (value < 0.00001) value = 0;
        style.filter = stripAlpha(filter) + 'alpha(opacity=' + (value * 100) + ')';
        return element;
    };
    Element._attributeTranslations = (function () {
        var classProp = 'className',
            forProp = 'for',
            el = document.createElement('div');
        el.setAttribute(classProp, 'x');
        if (el.className !== 'x') {
            el.setAttribute('class', 'x');
            if (el.className === 'x') {
                classProp = 'class';
            }
        }
        el = null;
        el = document.createElement('label');
        el.setAttribute(forProp, 'x');
        if (el.htmlFor !== 'x') {
            el.setAttribute('htmlFor', 'x');
            if (el.htmlFor === 'x') {
                forProp = 'htmlFor';
            }
        }
        el = null;
        return {
            read: {
                names: {
                    'class': classProp,
                    'className': classProp,
                    'for': forProp,
                    'htmlFor': forProp
                },
                values: {
                    _getAttr: function (element, attribute) {
                        return element.getAttribute(attribute);
                    },
                    _getAttr2: function (element, attribute) {
                        return element.getAttribute(attribute, 2);
                    },
                    _getAttrNode: function (element, attribute) {
                        var node = element.getAttributeNode(attribute);
                        return node ? node.value : "";
                    },
                    _getEv: (function () {
                        var el = document.createElement('div'),
                            f;
                        el.onclick = Prototype.emptyFunction;
                        var value = el.getAttribute('onclick');
                        if (String(value).indexOf('{') > -1) {
                            f = function (element, attribute) {
                                attribute = element.getAttribute(attribute);
                                if (!attribute) return null;
                                attribute = attribute.toString();
                                attribute = attribute.split('{')[1];
                                attribute = attribute.split('}')[0];
                                return attribute.strip();
                            };
                        } else if (value === '') {
                            f = function (element, attribute) {
                                attribute = element.getAttribute(attribute);
                                if (!attribute) return null;
                                return attribute.strip();
                            };
                        }
                        el = null;
                        return f;
                    })(),
                    _flag: function (element, attribute) {
                        return $(element).hasAttribute(attribute) ? attribute : null;
                    },
                    style: function (element) {
                        return element.style.cssText.toLowerCase();
                    },
                    title: function (element) {
                        return element.title;
                    }
                }
            }
        }
    })();
    Element._attributeTranslations.write = {
        names: Object.extend({
            cellpadding: 'cellPadding',
            cellspacing: 'cellSpacing'
        }, Element._attributeTranslations.read.names),
        values: {
            checked: function (element, value) {
                element.checked = !! value;
            },
            style: function (element, value) {
                element.style.cssText = value ? value : '';
            }
        }
    };
    Element._attributeTranslations.has = {};
    $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' + 'encType maxLength readOnly longDesc frameBorder').each(function (attr) {
        Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
        Element._attributeTranslations.has[attr.toLowerCase()] = attr;
    });
    (function (v) {
        Object.extend(v, {
            href: v._getAttr2,
            src: v._getAttr2,
            type: v._getAttr,
            action: v._getAttrNode,
            disabled: v._flag,
            checked: v._flag,
            readonly: v._flag,
            multiple: v._flag,
            onload: v._getEv,
            onunload: v._getEv,
            onclick: v._getEv,
            ondblclick: v._getEv,
            onmousedown: v._getEv,
            onmouseup: v._getEv,
            onmouseover: v._getEv,
            onmousemove: v._getEv,
            onmouseout: v._getEv,
            onfocus: v._getEv,
            onblur: v._getEv,
            onkeypress: v._getEv,
            onkeydown: v._getEv,
            onkeyup: v._getEv,
            onsubmit: v._getEv,
            onreset: v._getEv,
            onselect: v._getEv,
            onchange: v._getEv
        });
    })(Element._attributeTranslations.read.values);
    if (Prototype.BrowserFeatures.ElementExtensions) {
        (function () {
            function _descendants(element) {
                var nodes = element.getElementsByTagName('*'),
                    results = [];
                for (var i = 0, node; node = nodes[i]; i++)
                if (node.tagName !== "!") results.push(node);
                return results;
            }
Element.Methods.down = function (element, expression, index) {
    element = $(element);
    if (arguments.length == 1) return element.firstDescendant();
    return Object.isNumber(expression) ? _descendants(element)[expression] : Element.select(element, expression)[index || 0];
}
})();
}
} else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
    Element.Methods.setOpacity = function (element, value) {
        element = $(element);
        element.style.opacity = (value == 1) ? 0.999999 : (value === '') ? '' : (value < 0.00001) ? 0 : value;
        return element;
    };
} else if (Prototype.Browser.WebKit) {
    Element.Methods.setOpacity = function (element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value === '') ? '' : (value < 0.00001) ? 0 : value;
        if (value == 1) if (element.tagName.toUpperCase() == 'IMG' && element.width) {
            element.width++;
            element.width--;
        } else
        try {
            var n = document.createTextNode(' ');
            element.appendChild(n);
            element.removeChild(n);
        } catch (e) {}
        return element;
    };
}
if ('outerHTML' in document.documentElement) {
    Element.Methods.replace = function (element, content) {
        element = $(element);
        if (content && content.toElement) content = content.toElement();
        if (Object.isElement(content)) {
            element.parentNode.replaceChild(content, element);
            return element;
        }
        content = Object.toHTML(content);
        var parent = element.parentNode,
            tagName = parent.tagName.toUpperCase();
        if (Element._insertionTranslations.tags[tagName]) {
            var nextSibling = element.next(),
                fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
            parent.removeChild(element);
            if (nextSibling) fragments.each(function (node) {
                parent.insertBefore(node, nextSibling)
            });
            else
            fragments.each(function (node) {
                parent.appendChild(node)
            });
        } else element.outerHTML = content.stripScripts();
        content.evalScripts.bind(content).p_defer();
        return element;
    };
}
Element._returnOffset = function (l, t) {
    var result = [l, t];
    result.left = l;
    result.top = t;
    return result;
};
Element._getContentFromAnonymousElement = function (tagName, html, force) {
    var div = new Element('div'),
        t = Element._insertionTranslations.tags[tagName];
    var workaround = false;
    if (t) workaround = true;
    else if (force) {
        workaround = true;
        t = ['', '', 0];
    }
    if (workaround) {
        div.innerHTML = '&nbsp;' + t[0] + html + t[1];
        div.removeChild(div.firstChild);
        for (var i = t[2]; i--;) {
            div = div.firstChild;
        }
    } else {
        div.innerHTML = html;
    }
    return $A(div.childNodes);
};
Element._insertionTranslations = {
    before: function (element, node) {
        element.parentNode.insertBefore(node, element);
    },
    top: function (element, node) {
        element.insertBefore(node, element.firstChild);
    },
    bottom: function (element, node) {
        element.appendChild(node);
    },
    after: function (element, node) {
        element.parentNode.insertBefore(node, element.nextSibling);
    },
    tags: {
        TABLE: ['<table>', '</table>', 1],
        TBODY: ['<table><tbody>', '</tbody></table>', 2],
        TR: ['<table><tbody><tr>', '</tr></tbody></table>', 3],
        TD: ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
        SELECT: ['<select>', '</select>', 1]
    }
};
(function () {
    var tags = Element._insertionTranslations.tags;
    Object.extend(tags, {
        THEAD: tags.TBODY,
        TFOOT: tags.TBODY,
        TH: tags.TD
    });
})();
Element.Methods.Simulated = {
    hasAttribute: function (element, attribute) {
        attribute = Element._attributeTranslations.has[attribute] || attribute;
        var node = $(element).getAttributeNode(attribute);
        return !!(node && node.specified);
    }
};
Element.Methods.ByTag = {};
Object.extend(Element, Element.Methods);
(function (div) {
    if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
        window.HTMLElement = {};
        window.HTMLElement.prototype = div['__proto__'];
        Prototype.BrowserFeatures.ElementExtensions = true;
    }
    div = null;
})(document.createElement('div'));
Element.extend = (function () {
    function checkDeficiency(tagName) {
        if (typeof window.Element != 'undefined') {
            var proto = window.Element.prototype;
            if (proto) {
                var id = '_' + (Math.random() + '').slice(2),
                    el = document.createElement(tagName);
                proto[id] = 'x';
                var isBuggy = (el[id] !== 'x');
                delete proto[id];
                el = null;
                return isBuggy;
            }
        }
        return false;
    }

    function extendElementWith(element, methods) {
        for (var property in methods) {
            var value = methods[property];
            if (Object.isFunction(value) && !(property in element)) element[property] = value.methodize();
        }
    }
    var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');
    if (Prototype.BrowserFeatures.SpecificElementExtensions) {
        if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
            return function (element) {
                if (element && typeof element._extendedByPrototype == 'undefined') {
                    var t = element.tagName;
                    if (t && (/^(?:object|applet|embed)$/i.test(t))) {
                        extendElementWith(element, Element.Methods);
                        extendElementWith(element, Element.Methods.Simulated);
                        extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
                    }
                }
                return element;
            }
        }
        return Prototype.K;
    }
    var Methods = {},
        ByTag = Element.Methods.ByTag;
    var extend = Object.extend(function (element) {
        if (!element || typeof element._extendedByPrototype != 'undefined' || element.nodeType != 1 || element == window) return element;
        var methods = Object.clone(Methods),
            tagName = element.tagName.toUpperCase();
        if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);
        extendElementWith(element, methods);
        element._extendedByPrototype = Prototype.emptyFunction;
        return element;
    }, {
        refresh: function () {
            if (!Prototype.BrowserFeatures.ElementExtensions) {
                Object.extend(Methods, Element.Methods);
                Object.extend(Methods, Element.Methods.Simulated);
            }
        }
    });
    extend.refresh();
    return extend;
})();
if (document.documentElement.hasAttribute) {
    Element.hasAttribute = function (element, attribute) {
        return element.hasAttribute(attribute);
    };
} else {
    Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
}
Element.addMethods = function (methods) {
    var F = Prototype.BrowserFeatures,
        T = Element.Methods.ByTag;
    if (!methods) {
        Object.extend(Form, Form.Methods);
        Object.extend(Form.Element, Form.Element.Methods);
        Object.extend(Element.Methods.ByTag, {
            "FORM": Object.clone(Form.Methods),
            "INPUT": Object.clone(Form.Element.Methods),
            "SELECT": Object.clone(Form.Element.Methods),
            "TEXTAREA": Object.clone(Form.Element.Methods),
            "BUTTON": Object.clone(Form.Element.Methods)
        });
    }
    if (arguments.length == 2) {
        var tagName = methods;
        methods = arguments[1];
    }
    if (!tagName) Object.extend(Element.Methods, methods || {});
    else {
        if (Object.isArray(tagName)) tagName.each(extend);
        else extend(tagName);
    }

    function extend(tagName) {
        tagName = tagName.toUpperCase();
        if (!Element.Methods.ByTag[tagName]) Element.Methods.ByTag[tagName] = {};
        Object.extend(Element.Methods.ByTag[tagName], methods);
    }

    function copy(methods, destination, onlyIfAbsent) {
        onlyIfAbsent = onlyIfAbsent || false;
        for (var property in methods) {
            var value = methods[property];
            if (!Object.isFunction(value)) continue;
            if (!onlyIfAbsent || !(property in destination)) destination[property] = value.methodize();
        }
    }
function findDOMClass(tagName) {
    var klass;
    var trans = {
        "OPTGROUP": "OptGroup",
        "TEXTAREA": "TextArea",
        "P": "Paragraph",
        "FIELDSET": "FieldSet",
        "UL": "UList",
        "OL": "OList",
        "DL": "DList",
        "DIR": "Directory",
        "H1": "Heading",
        "H2": "Heading",
        "H3": "Heading",
        "H4": "Heading",
        "H5": "Heading",
        "H6": "Heading",
        "Q": "Quote",
        "INS": "Mod",
        "DEL": "Mod",
        "A": "Anchor",
        "IMG": "Image",
        "CAPTION": "TableCaption",
        "COL": "TableCol",
        "COLGROUP": "TableCol",
        "THEAD": "TableSection",
        "TFOOT": "TableSection",
        "TBODY": "TableSection",
        "TR": "TableRow",
        "TH": "TableCell",
        "TD": "TableCell",
        "FRAMESET": "FrameSet",
        "IFRAME": "IFrame"
    };
    if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName + 'Element';
    if (window[klass]) return window[klass];
    klass = 'HTML' + tagName.capitalize() + 'Element';
    if (window[klass]) return window[klass];
    var element = document.createElement(tagName),
        proto = element['__proto__'] || element.constructor.prototype;
    element = null;
    return proto;
}
var elementPrototype = window.HTMLElement ? HTMLElement.prototype : Element.prototype;
if (F.ElementExtensions) {
    copy(Element.Methods, elementPrototype);
    copy(Element.Methods.Simulated, elementPrototype, true);
}
if (F.SpecificElementExtensions) {
    for (var tag in Element.Methods.ByTag) {
        var klass = findDOMClass(tag);
        if (Object.isUndefined(klass)) continue;
        copy(T[tag], klass.prototype);
    }
}
Object.extend(Element, Element.Methods);
delete Element.ByTag;
if (Element.extend.refresh) Element.extend.refresh();
Element.cache = {};
};
document.viewport = {
    getDimensions: function () {
        return {
            width: this.getWidth(),
            height: this.getHeight()
        };
    },
    getScrollOffsets: function () {
        return Element._returnOffset(window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft, window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
    }
};
(function (viewport) {
    var B = Prototype.Browser,
        doc = document,
        element, property = {};

    function getRootElement() {
        if (B.WebKit && !doc.evaluate) return document;
        if (B.Opera && window.parseFloat(window.opera.version()) < 9.5) return document.body;
        return document.documentElement;
    }

    function define(D) {
        if (!element) element = getRootElement();
        property[D] = 'client' + D;
        viewport['get' + D] = function () {
            return element[property[D]]
        };
        return viewport['get' + D]();
    }
    viewport.getWidth = define.curry('Width');
    viewport.getHeight = define.curry('Height');
})(document.viewport);
Element.Storage = {
    UID: 1
};
Element.addMethods({
    getStorage: function (element) {
        if (!(element = $(element))) return;
        var uid;
        if (element === window) {
            uid = 0;
        } else {
            if (typeof element._prototypeUID === "undefined") element._prototypeUID = Element.Storage.UID++;
            uid = element._prototypeUID;
        }
        if (!Element.Storage[uid]) Element.Storage[uid] = $H();
        return Element.Storage[uid];
    },
    store: function (element, key, value) {
        if (!(element = $(element))) return;
        if (arguments.length === 2) {
            Element.getStorage(element).update(key);
        } else {
            Element.getStorage(element).set(key, value);
        }
        return element;
    },
    retrieve: function (element, key, defaultValue) {
        if (!(element = $(element))) return;
        var hash = Element.getStorage(element),
            value = hash.get(key);
        if (Object.isUndefined(value)) {
            hash.set(key, defaultValue);
            value = defaultValue;
        }
        return value;
    },
    clone: function (element, deep) {
        if (!(element = $(element))) return;
        var clone = element.cloneNode(deep);
        clone._prototypeUID = void 0;
        if (deep) {
            var descendants = Element.select(clone, '*'),
                i = descendants.length;
            while (i--) {
                descendants[i]._prototypeUID = void 0;
            }
        }
        return Element.extend(clone);
    },
    purge: function (element) {
        if (!(element = $(element))) return;
        var purgeElement = Element._purgeElement;
        purgeElement(element);
        var descendants = element.getElementsByTagName('*'),
            i = descendants.length;
        while (i--) purgeElement(descendants[i]);
        return null;
    }
});
(function () {
    function toDecimal(pctString) {
        var match = pctString.match(/^(\d+)%?$/i);
        if (!match) return null;
        return (Number(match[1]) / 100);
    }

    function getPixelValue(value, property, context) {
        var element = null;
        if (Object.isElement(value)) {
            element = value;
            value = element.getStyle(property);
        }
        if (value === null) {
            return null;
        }
        if ((/^(?:-)?\d+(\.\d+)?(px)?$/i).test(value)) {
            return window.parseFloat(value);
        }
        var isPercentage = value.include('%'),
            isViewport = (context === document.viewport);
        if (/\d/.test(value) && element && element.runtimeStyle && !(isPercentage && isViewport)) {
            var style = element.style.left,
                rStyle = element.runtimeStyle.left;
            element.runtimeStyle.left = element.currentStyle.left;
            element.style.left = value || 0;
            value = element.style.pixelLeft;
            element.style.left = style;
            element.runtimeStyle.left = rStyle;
            return value;
        }
        if (element && isPercentage) {
            context = context || element.parentNode;
            var decimal = toDecimal(value);
            var whole = null;
            var position = element.getStyle('position');
            var isHorizontal = property.include('left') || property.include('right') || property.include('width');
            var isVertical = property.include('top') || property.include('bottom') || property.include('height');
            if (context === document.viewport) {
                if (isHorizontal) {
                    whole = document.viewport.getWidth();
                } else if (isVertical) {
                    whole = document.viewport.getHeight();
                }
            } else {
                if (isHorizontal) {
                    whole = $(context).measure('width');
                } else if (isVertical) {
                    whole = $(context).measure('height');
                }
            }
            return (whole === null) ? 0 : whole * decimal;
        }
        return 0;
    }

    function toCSSPixels(number) {
        if (Object.isString(number) && number.endsWith('px')) {
            return number;
        }
        return number + 'px';
    }

    function isDisplayed(element) {
        var originalElement = element;
        while (element && element.parentNode) {
            var display = element.getStyle('display');
            if (display === 'none') {
                return false;
            }
            element = $(element.parentNode);
        }
        return true;
    }
    var hasLayout = Prototype.K;
    if ('currentStyle' in document.documentElement) {
        hasLayout = function (element) {
            if (!element.currentStyle.hasLayout) {
                element.style.zoom = 1;
            }
            return element;
        };
    }

    function cssNameFor(key) {
        if (key.include('border')) key = key + '-width';
        return key.camelize();
    }
    Element.Layout = Class.create(Hash, {
        initialize: function ($super, element, preCompute) {
            $super();
            this.element = $(element);
            Element.Layout.PROPERTIES.each(function (property) {
                this._set(property, null);
            }, this);
            if (preCompute) {
                this._preComputing = true;
                this._begin();
                Element.Layout.PROPERTIES.each(this._compute, this);
                this._end();
                this._preComputing = false;
            }
        },
        _set: function (property, value) {
            return Hash.prototype.set.call(this, property, value);
        },
        set: function (property, value) {
            throw "Properties of Element.Layout are read-only.";
        },
        get: function ($super, property) {
            var value = $super(property);
            return value === null ? this._compute(property) : value;
        },
        _begin: function () {
            if (this._prepared) return;
            var element = this.element;
            if (isDisplayed(element)) {
                this._prepared = true;
                return;
            }
            var originalStyles = {
                position: element.style.position || '',
                width: element.style.width || '',
                visibility: element.style.visibility || '',
                display: element.style.display || ''
            };
            element.store('prototype_original_styles', originalStyles);
            var position = element.getStyle('position'),
                width = element.getStyle('width');
            if (width === "0px" || width === null) {
                element.style.display = 'block';
                width = element.getStyle('width');
            }
            var context = (position === 'fixed') ? document.viewport : element.parentNode;
            element.setStyle({
                position: 'absolute',
                visibility: 'hidden',
                display: 'block'
            });
            var positionedWidth = element.getStyle('width');
            var newWidth;
            if (width && (positionedWidth === width)) {
                newWidth = getPixelValue(element, 'width', context);
            } else if (position === 'absolute' || position === 'fixed') {
                newWidth = getPixelValue(element, 'width', context);
            } else {
                var parent = element.parentNode,
                    pLayout = $(parent).getLayout();
                newWidth = pLayout.get('width') - this.get('margin-left') - this.get('border-left') - this.get('padding-left') - this.get('padding-right') - this.get('border-right') - this.get('margin-right');
            }
            element.setStyle({
                width: newWidth + 'px'
            });
            this._prepared = true;
        },
        _end: function () {
            var element = this.element;
            var originalStyles = element.retrieve('prototype_original_styles');
            element.store('prototype_original_styles', null);
            element.setStyle(originalStyles);
            this._prepared = false;
        },
        _compute: function (property) {
            var COMPUTATIONS = Element.Layout.COMPUTATIONS;
            if (!(property in COMPUTATIONS)) {
                throw "Property not found.";
            }
            return this._set(property, COMPUTATIONS[property].call(this, this.element));
        },
        toObject: function () {
            var args = $A(arguments);
            var keys = (args.length === 0) ? Element.Layout.PROPERTIES : args.join(' ').split(' ');
            var obj = {};
            keys.each(function (key) {
                if (!Element.Layout.PROPERTIES.include(key)) return;
                var value = this.get(key);
                if (value != null) obj[key] = value;
            }, this);
            return obj;
        },
        toHash: function () {
            var obj = this.toObject.apply(this, arguments);
            return new Hash(obj);
        },
        toCSS: function () {
            var args = $A(arguments);
            var keys = (args.length === 0) ? Element.Layout.PROPERTIES : args.join(' ').split(' ');
            var css = {};
            keys.each(function (key) {
                if (!Element.Layout.PROPERTIES.include(key)) return;
                if (Element.Layout.COMPOSITE_PROPERTIES.include(key)) return;
                var value = this.get(key);
                if (value != null) css[cssNameFor(key)] = value + 'px';
            }, this);
            return css;
        },
        inspect: function () {
            return "#<Element.Layout>";
        }
    });
    Object.extend(Element.Layout, {
        PROPERTIES: $w('height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height cumulative-left cumulative-top'),
        COMPOSITE_PROPERTIES: $w('padding-box-width padding-box-height margin-box-width margin-box-height border-box-width border-box-height'),
        COMPUTATIONS: {
            'height': function (element) {
                if (!this._preComputing) this._begin();
                var bHeight = this.get('border-box-height');
                if (bHeight <= 0) {
                    if (!this._preComputing) this._end();
                    return 0;
                }
                var bTop = this.get('border-top'),
                    bBottom = this.get('border-bottom');
                var pTop = this.get('padding-top'),
                    pBottom = this.get('padding-bottom');
                if (!this._preComputing) this._end();
                return bHeight - bTop - bBottom - pTop - pBottom;
            },
            'width': function (element) {
                if (!this._preComputing) this._begin();
                var bWidth = this.get('border-box-width');
                if (bWidth <= 0) {
                    if (!this._preComputing) this._end();
                    return 0;
                }
                var bLeft = this.get('border-left'),
                    bRight = this.get('border-right');
                var pLeft = this.get('padding-left'),
                    pRight = this.get('padding-right');
                if (!this._preComputing) this._end();
                return bWidth - bLeft - bRight - pLeft - pRight;
            },
            'padding-box-height': function (element) {
                var height = this.get('height'),
                    pTop = this.get('padding-top'),
                    pBottom = this.get('padding-bottom');
                return height + pTop + pBottom;
            },
            'padding-box-width': function (element) {
                var width = this.get('width'),
                    pLeft = this.get('padding-left'),
                    pRight = this.get('padding-right');
                return width + pLeft + pRight;
            },
            'border-box-height': function (element) {
                if (!this._preComputing) this._begin();
                var height = element.offsetHeight;
                if (!this._preComputing) this._end();
                return height;
            },
            'cumulative-left': function (element) {
                return element.cumulativeOffset().left;
            },
            'cumulative-top': function (element) {
                return element.cumulativeOffset().top;
            },
            'border-box-width': function (element) {
                if (!this._preComputing) this._begin();
                var width = element.offsetWidth;
                if (!this._preComputing) this._end();
                return width;
            },
            'margin-box-height': function (element) {
                var bHeight = this.get('border-box-height'),
                    mTop = this.get('margin-top'),
                    mBottom = this.get('margin-bottom');
                if (bHeight <= 0) return 0;
                return bHeight + mTop + mBottom;
            },
            'margin-box-width': function (element) {
                var bWidth = this.get('border-box-width'),
                    mLeft = this.get('margin-left'),
                    mRight = this.get('margin-right');
                if (bWidth <= 0) return 0;
                return bWidth + mLeft + mRight;
            },
            'top': function (element) {
                var offset = element.positionedOffset();
                return offset.top;
            },
            'bottom': function (element) {
                var offset = element.positionedOffset(),
                    parent = element.getOffsetParent(),
                    pHeight = parent.measure('height');
                var mHeight = this.get('border-box-height');
                return pHeight - mHeight - offset.top;
            },
            'left': function (element) {
                var offset = element.positionedOffset();
                return offset.left;
            },
            'right': function (element) {
                var offset = element.positionedOffset(),
                    parent = element.getOffsetParent(),
                    pWidth = parent.measure('width');
                var mWidth = this.get('border-box-width');
                return pWidth - mWidth - offset.left;
            },
            'padding-top': function (element) {
                return getPixelValue(element, 'paddingTop');
            },
            'padding-bottom': function (element) {
                return getPixelValue(element, 'paddingBottom');
            },
            'padding-left': function (element) {
                return getPixelValue(element, 'paddingLeft');
            },
            'padding-right': function (element) {
                return getPixelValue(element, 'paddingRight');
            },
            'border-top': function (element) {
                return getPixelValue(element, 'borderTopWidth');
            },
            'border-bottom': function (element) {
                return getPixelValue(element, 'borderBottomWidth');
            },
            'border-left': function (element) {
                return getPixelValue(element, 'borderLeftWidth');
            },
            'border-right': function (element) {
                return getPixelValue(element, 'borderRightWidth');
            },
            'margin-top': function (element) {
                return getPixelValue(element, 'marginTop');
            },
            'margin-bottom': function (element) {
                return getPixelValue(element, 'marginBottom');
            },
            'margin-left': function (element) {
                return getPixelValue(element, 'marginLeft');
            },
            'margin-right': function (element) {
                return getPixelValue(element, 'marginRight');
            }
        }
    });
    if ('getBoundingClientRect' in document.documentElement) {
        Object.extend(Element.Layout.COMPUTATIONS, {
            'right': function (element) {
                var parent = hasLayout(element.getOffsetParent());
                var rect = element.getBoundingClientRect(),
                    pRect = parent.getBoundingClientRect();
                return (pRect.right - rect.right).round();
            },
            'bottom': function (element) {
                var parent = hasLayout(element.getOffsetParent());
                var rect = element.getBoundingClientRect(),
                    pRect = parent.getBoundingClientRect();
                return (pRect.bottom - rect.bottom).round();
            }
        });
    }
    Element.Offset = Class.create({
        initialize: function (left, top) {
            this.left = left.round();
            this.top = top.round();
            this[0] = this.left;
            this[1] = this.top;
        },
        relativeTo: function (offset) {
            return new Element.Offset(this.left - offset.left, this.top - offset.top);
        },
        inspect: function () {
            return "#<Element.Offset left: #{left} top: #{top}>".interpolate(this);
        },
        toString: function () {
            return "[#{left}, #{top}]".interpolate(this);
        },
        toArray: function () {
            return [this.left, this.top];
        }
    });

    function getLayout(element, preCompute) {
        return new Element.Layout(element, preCompute);
    }

    function measure(element, property) {
        return $(element).getLayout().get(property);
    }

    function getDimensions(element) {
        element = $(element);
        var display = Element.getStyle(element, 'display');
        if (display && display !== 'none') {
            return {
                width: element.offsetWidth,
                height: element.offsetHeight
            };
        }
        var style = element.style;
        var originalStyles = {
            visibility: style.visibility,
            position: style.position,
            display: style.display
        };
        var newStyles = {
            visibility: 'hidden',
            display: 'block'
        };
        if (originalStyles.position !== 'fixed') newStyles.position = 'absolute';
        Element.setStyle(element, newStyles);
        var dimensions = {
            width: element.offsetWidth,
            height: element.offsetHeight
        };
        Element.setStyle(element, originalStyles);
        return dimensions;
    }

    function getOffsetParent(element) {
        element = $(element);
        if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element)) return $(document.body);
        var isInline = (Element.getStyle(element, 'display') === 'inline');
        if (!isInline && element.offsetParent) return $(element.offsetParent);
        while ((element = element.parentNode) && element !== document.body) {
            if (Element.getStyle(element, 'position') !== 'static') {
                return isHtml(element) ? $(document.body) : $(element);
            }
        }
        return $(document.body);
    }

    function cumulativeOffset(element) {
        element = $(element);
        var valueT = 0,
            valueL = 0;
        if (element.parentNode) {
            do {
                valueT += element.offsetTop || 0;
                valueL += element.offsetLeft || 0;
                element = element.offsetParent;
            } while (element);
        }
        return new Element.Offset(valueL, valueT);
    }

    function positionedOffset(element) {
        element = $(element);
        var layout = element.getLayout();
        var valueT = 0,
            valueL = 0;
        do {
            valueT += element.offsetTop || 0;
            valueL += element.offsetLeft || 0;
            element = element.offsetParent;
            if (element) {
                if (isBody(element)) break;
                var p = Element.getStyle(element, 'position');
                if (p !== 'static') break;
            }
        } while (element);
        valueL -= layout.get('margin-top');
        valueT -= layout.get('margin-left');
        return new Element.Offset(valueL, valueT);
    }

    function cumulativeScrollOffset(element) {
        var valueT = 0,
            valueL = 0;
        do {
            valueT += element.scrollTop || 0;
            valueL += element.scrollLeft || 0;
            element = element.parentNode;
        } while (element);
        return new Element.Offset(valueL, valueT);
    }

    function viewportOffset(forElement) {
        element = $(element);
        var valueT = 0,
            valueL = 0,
            docBody = document.body;
        var element = forElement;
        do {
            valueT += element.offsetTop || 0;
            valueL += element.offsetLeft || 0;
            if (element.offsetParent == docBody && Element.getStyle(element, 'position') == 'absolute') break;
        } while (element = element.offsetParent);
        element = forElement;
        do {
            if (element != docBody) {
                valueT -= element.scrollTop || 0;
                valueL -= element.scrollLeft || 0;
            }
        } while (element = element.parentNode);
        return new Element.Offset(valueL, valueT);
    }

    function absolutize(element) {
        element = $(element);
        if (Element.getStyle(element, 'position') === 'absolute') {
            return element;
        }
        var offsetParent = getOffsetParent(element);
        var eOffset = element.viewportOffset(),
            pOffset = offsetParent.viewportOffset();
        var offset = eOffset.relativeTo(pOffset);
        var layout = element.getLayout();
        element.store('prototype_absolutize_original_styles', {
            left: element.getStyle('left'),
            top: element.getStyle('top'),
            width: element.getStyle('width'),
            height: element.getStyle('height')
        });
        element.setStyle({
            position: 'absolute',
            top: offset.top + 'px',
            left: offset.left + 'px',
            width: layout.get('width') + 'px',
            height: layout.get('height') + 'px'
        });
        return element;
    }

    function relativize(element) {
        element = $(element);
        if (Element.getStyle(element, 'position') === 'relative') {
            return element;
        }
        var originalStyles = element.retrieve('prototype_absolutize_original_styles');
        if (originalStyles) element.setStyle(originalStyles);
        return element;
    }
    if (Prototype.Browser.IE) {
        getOffsetParent = getOffsetParent.wrap(function (proceed, element) {
            element = $(element);
            if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element)) return $(document.body);
            var position = element.getStyle('position');
            if (position !== 'static') return proceed(element);
            element.setStyle({
                position: 'relative'
            });
            var value = proceed(element);
            element.setStyle({
                position: position
            });
            return value;
        });
        positionedOffset = positionedOffset.wrap(function (proceed, element) {
            element = $(element);
            if (!element.parentNode) return new Element.Offset(0, 0);
            var position = element.getStyle('position');
            if (position !== 'static') return proceed(element);
            var offsetParent = element.getOffsetParent();
            if (offsetParent && offsetParent.getStyle('position') === 'fixed') hasLayout(offsetParent);
            element.setStyle({
                position: 'relative'
            });
            var value = proceed(element);
            element.setStyle({
                position: position
            });
            return value;
        });
    } else if (Prototype.Browser.Webkit) {
        cumulativeOffset = function (element) {
            element = $(element);
            var valueT = 0,
                valueL = 0;
            do {
                valueT += element.offsetTop || 0;
                valueL += element.offsetLeft || 0;
                if (element.offsetParent == document.body) if (Element.getStyle(element, 'position') == 'absolute') break;
                element = element.offsetParent;
            } while (element);
            return new Element.Offset(valueL, valueT);
        };
    }
    Element.addMethods({
        getLayout: getLayout,
        measure: measure,
        getDimensions: getDimensions,
        getOffsetParent: getOffsetParent,
        cumulativeOffset: cumulativeOffset,
        positionedOffset: positionedOffset,
        cumulativeScrollOffset: cumulativeScrollOffset,
        viewportOffset: viewportOffset,
        absolutize: absolutize,
        relativize: relativize
    });

    function isBody(element) {
        return element.nodeName.toUpperCase() === 'BODY';
    }

    function isHtml(element) {
        return element.nodeName.toUpperCase() === 'HTML';
    }

    function isDocument(element) {
        return element.nodeType === Node.DOCUMENT_NODE;
    }

    function isDetached(element) {
        return element !== document.body && !Element.descendantOf(element, document.body);
    }
    if ('getBoundingClientRect' in document.documentElement) {
        Element.addMethods({
            viewportOffset: function (element) {
                element = $(element);
                if (isDetached(element)) return new Element.Offset(0, 0);
                var rect = element.getBoundingClientRect(),
                    docEl = document.documentElement;
                return new Element.Offset(rect.left - docEl.clientLeft, rect.top - docEl.clientTop);
            }
        });
    }
})();
window.$$ = function () {
    var expression = $A(arguments).join(', ');
    return Prototype.Selector.select(expression, document);
};
Prototype.Selector = (function () {
    function select() {
        throw new Error('Method "Prototype.Selector.select" must be defined.');
    }

    function match() {
        throw new Error('Method "Prototype.Selector.match" must be defined.');
    }

    function find(elements, expression, index) {
        index = index || 0;
        var match = Prototype.Selector.match,
            length = elements.length,
            matchIndex = 0,
            i;
        for (i = 0; i < length; i++) {
            if (match(elements[i], expression) && index == matchIndex++) {
                return Element.extend(elements[i]);
            }
        }
    }

    function extendElements(elements) {
        for (var i = 0, length = elements.length; i < length; i++) {
            Element.extend(elements[i]);
        }
        return elements;
    }
    var K = Prototype.K;
    return {
        select: select,
        match: match,
        find: find,
        extendElements: (Element.extend === K) ? K : extendElements,
        extendElement: Element.extend
    };
})();
Prototype._original_property = window.Sizzle;
/*
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function () {
    var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
        done = 0,
        toString = Object.prototype.toString,
        hasDuplicate = false,
        baseHasDuplicate = true;
    [0, 0].sort(function () {
        baseHasDuplicate = false;
        return 0;
    });
    var Sizzle = function (selector, context, results, seed) {
        results = results || [];
        var origContext = context = context || document;
        if (context.nodeType !== 1 && context.nodeType !== 9) {
            return [];
        }
        if (!selector || typeof selector !== "string") {
            return results;
        }
        var parts = [],
            m, set, checkSet, check, mode, extra, prune = true,
            contextXML = isXML(context),
            soFar = selector;
        while ((chunker.exec(""), m = chunker.exec(soFar)) !== null) {
            soFar = m[3];
            parts.push(m[1]);
            if (m[2]) {
                extra = m[3];
                break;
            }
        }
        if (parts.length > 1 && origPOS.exec(selector)) {
            if (parts.length === 2 && Expr.relative[parts[0]]) {
                set = posProcess(parts[0] + parts[1], context);
            } else {
                set = Expr.relative[parts[0]] ? [context] : Sizzle(parts.shift(), context);
                while (parts.length) {
                    selector = parts.shift();
                    if (Expr.relative[selector]) selector += parts.shift();
                    set = posProcess(selector, set);
                }
            }
        } else {
            if (!seed && parts.length > 1 && context.nodeType === 9 && !contextXML && Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1])) {
                var ret = Sizzle.find(parts.shift(), context, contextXML);
                context = ret.expr ? Sizzle.filter(ret.expr, ret.set)[0] : ret.set[0];
            }
            if (context) {
                var ret = seed ? {
                    expr: parts.pop(),
                    set: makeArray(seed)
                } : Sizzle.find(parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML);
                set = ret.expr ? Sizzle.filter(ret.expr, ret.set) : ret.set;
                if (parts.length > 0) {
                    checkSet = makeArray(set);
                } else {
                    prune = false;
                }
                while (parts.length) {
                    var cur = parts.pop(),
                        pop = cur;
                    if (!Expr.relative[cur]) {
                        cur = "";
                    } else {
                        pop = parts.pop();
                    }
                    if (pop == null) {
                        pop = context;
                    }
                    Expr.relative[cur](checkSet, pop, contextXML);
                }
            } else {
                checkSet = parts = [];
            }
        }
        if (!checkSet) {
            checkSet = set;
        }
        if (!checkSet) {
            throw "Syntax error, unrecognized expression: " + (cur || selector);
        }
        if (toString.call(checkSet) === "[object Array]") {
            if (!prune) {
                results.push.apply(results, checkSet);
            } else if (context && context.nodeType === 1) {
                for (var i = 0; checkSet[i] != null; i++) {
                    if (checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i]))) {
                        results.push(set[i]);
                    }
                }
            } else {
                for (var i = 0; checkSet[i] != null; i++) {
                    if (checkSet[i] && checkSet[i].nodeType === 1) {
                        results.push(set[i]);
                    }
                }
            }
        } else {
            makeArray(checkSet, results);
        }
        if (extra) {
            Sizzle(extra, origContext, results, seed);
            Sizzle.uniqueSort(results);
        }
        return results;
    };
    Sizzle.uniqueSort = function (results) {
        if (sortOrder) {
            hasDuplicate = baseHasDuplicate;
            results.sort(sortOrder);
            if (hasDuplicate) {
                for (var i = 1; i < results.length; i++) {
                    if (results[i] === results[i - 1]) {
                        results.splice(i--, 1);
                    }
                }
            }
        }
        return results;
    };
    Sizzle.matches = function (expr, set) {
        return Sizzle(expr, null, null, set);
    };
    Sizzle.find = function (expr, context, isXML) {
        var set, match;
        if (!expr) {
            return [];
        }
        for (var i = 0, l = Expr.order.length; i < l; i++) {
            var type = Expr.order[i],
                match;
            if ((match = Expr.leftMatch[type].exec(expr))) {
                var left = match[1];
                match.splice(1, 1);
                if (left.substr(left.length - 1) !== "\\") {
                    match[1] = (match[1] || "").replace(/\\/g, "");
                    set = Expr.find[type](match, context, isXML);
                    if (set != null) {
                        expr = expr.replace(Expr.match[type], "");
                        break;
                    }
                }
            }
        }
        if (!set) {
            set = context.getElementsByTagName("*");
        }
        return {
            set: set,
            expr: expr
        };
    };
    Sizzle.filter = function (expr, set, inplace, not) {
        var old = expr,
            result = [],
            curLoop = set,
            match, anyFound, isXMLFilter = set && set[0] && isXML(set[0]);
        while (expr && set.length) {
            for (var type in Expr.filter) {
                if ((match = Expr.match[type].exec(expr)) != null) {
                    var filter = Expr.filter[type],
                        found, item;
                    anyFound = false;
                    if (curLoop == result) {
                        result = [];
                    }
                    if (Expr.preFilter[type]) {
                        match = Expr.preFilter[type](match, curLoop, inplace, result, not, isXMLFilter);
                        if (!match) {
                            anyFound = found = true;
                        } else if (match === true) {
                            continue;
                        }
                    }
                    if (match) {
                        for (var i = 0;
                        (item = curLoop[i]) != null; i++) {
                            if (item) {
                                found = filter(item, match, i, curLoop);
                                var pass = not ^ !! found;
                                if (inplace && found != null) {
                                    if (pass) {
                                        anyFound = true;
                                    } else {
                                        curLoop[i] = false;
                                    }
                                } else if (pass) {
                                    result.push(item);
                                    anyFound = true;
                                }
                            }
                        }
                    }
                    if (found !== undefined) {
                        if (!inplace) {
                            curLoop = result;
                        }
                        expr = expr.replace(Expr.match[type], "");
                        if (!anyFound) {
                            return [];
                        }
                        break;
                    }
                }
            }
            if (expr == old) {
                if (anyFound == null) {
                    throw "Syntax error, unrecognized expression: " + expr;
                } else {
                    break;
                }
            }
            old = expr;
        }
        return curLoop;
    };
    var Expr = Sizzle.selectors = {
        order: ["ID", "NAME", "TAG"],
        match: {
            ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
            CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
            NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
            ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
            TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
            CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
            POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
            PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
        },
        leftMatch: {},
        attrMap: {
            "class": "className",
            "for": "htmlFor"
        },
        attrHandle: {
            href: function (elem) {
                return elem.getAttribute("href");
            }
        },
        relative: {
            "+": function (checkSet, part, isXML) {
                var isPartStr = typeof part === "string",
                    isTag = isPartStr && !/\W/.test(part),
                    isPartStrNotTag = isPartStr && !isTag;
                if (isTag && !isXML) {
                    part = part.toUpperCase();
                }
                for (var i = 0, l = checkSet.length, elem; i < l; i++) {
                    if ((elem = checkSet[i])) {
                        while ((elem = elem.previousSibling) && elem.nodeType !== 1) {}
                        checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ? elem || false : elem === part;
                    }
                }
                if (isPartStrNotTag) {
                    Sizzle.filter(part, checkSet, true);
                }
            },
            ">": function (checkSet, part, isXML) {
                var isPartStr = typeof part === "string";
                if (isPartStr && !/\W/.test(part)) {
                    part = isXML ? part : part.toUpperCase();
                    for (var i = 0, l = checkSet.length; i < l; i++) {
                        var elem = checkSet[i];
                        if (elem) {
                            var parent = elem.parentNode;
                            checkSet[i] = parent.nodeName === part ? parent : false;
                        }
                    }
                } else {
                    for (var i = 0, l = checkSet.length; i < l; i++) {
                        var elem = checkSet[i];
                        if (elem) {
                            checkSet[i] = isPartStr ? elem.parentNode : elem.parentNode === part;
                        }
                    }
                    if (isPartStr) {
                        Sizzle.filter(part, checkSet, true);
                    }
                }
            },
            "": function (checkSet, part, isXML) {
                var doneName = done++,
                    checkFn = dirCheck;
                if (!/\W/.test(part)) {
                    var nodeCheck = part = isXML ? part : part.toUpperCase();
                    checkFn = dirNodeCheck;
                }
                checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
            },
            "~": function (checkSet, part, isXML) {
                var doneName = done++,
                    checkFn = dirCheck;
                if (typeof part === "string" && !/\W/.test(part)) {
                    var nodeCheck = part = isXML ? part : part.toUpperCase();
                    checkFn = dirNodeCheck;
                }
                checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
            }
        },
        find: {
            ID: function (match, context, isXML) {
                if (typeof context.getElementById !== "undefined" && !isXML) {
                    var m = context.getElementById(match[1]);
                    return m ? [m] : [];
                }
            },
            NAME: function (match, context, isXML) {
                if (typeof context.getElementsByName !== "undefined") {
                    var ret = [],
                        results = context.getElementsByName(match[1]);
                    for (var i = 0, l = results.length; i < l; i++) {
                        if (results[i].getAttribute("name") === match[1]) {
                            ret.push(results[i]);
                        }
                    }
                    return ret.length === 0 ? null : ret;
                }
            },
            TAG: function (match, context) {
                return context.getElementsByTagName(match[1]);
            }
        },
        preFilter: {
            CLASS: function (match, curLoop, inplace, result, not, isXML) {
                match = " " + match[1].replace(/\\/g, "") + " ";
                if (isXML) {
                    return match;
                }
                for (var i = 0, elem;
                (elem = curLoop[i]) != null; i++) {
                    if (elem) {
                        if (not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0)) {
                            if (!inplace) result.push(elem);
                        } else if (inplace) {
                            curLoop[i] = false;
                        }
                    }
                }
                return false;
            },
            ID: function (match) {
                return match[1].replace(/\\/g, "");
            },
            TAG: function (match, curLoop) {
                for (var i = 0; curLoop[i] === false; i++) {}
                return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
            },
            CHILD: function (match) {
                if (match[1] == "nth") {
                    var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" || !/\D/.test(match[2]) && "0n+" + match[2] || match[2]);
                    match[2] = (test[1] + (test[2] || 1)) - 0;
                    match[3] = test[3] - 0;
                }
                match[0] = done++;
                return match;
            },
            ATTR: function (match, curLoop, inplace, result, not, isXML) {
                var name = match[1].replace(/\\/g, "");
                if (!isXML && Expr.attrMap[name]) {
                    match[1] = Expr.attrMap[name];
                }
                if (match[2] === "~=") {
                    match[4] = " " + match[4] + " ";
                }
                return match;
            },
            PSEUDO: function (match, curLoop, inplace, result, not) {
                if (match[1] === "not") {
                    if ((chunker.exec(match[3]) || "").length > 1 || /^\w/.test(match[3])) {
                        match[3] = Sizzle(match[3], null, null, curLoop);
                    } else {
                        var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
                        if (!inplace) {
                            result.push.apply(result, ret);
                        }
                        return false;
                    }
                } else if (Expr.match.POS.test(match[0]) || Expr.match.CHILD.test(match[0])) {
                    return true;
                }
                return match;
            },
            POS: function (match) {
                match.unshift(true);
                return match;
            }
        },
        filters: {
            enabled: function (elem) {
                return elem.disabled === false && elem.type !== "hidden";
            },
            disabled: function (elem) {
                return elem.disabled === true;
            },
            checked: function (elem) {
                return elem.checked === true;
            },
            selected: function (elem) {
                elem.parentNode.selectedIndex;
                return elem.selected === true;
            },
            parent: function (elem) {
                return !!elem.firstChild;
            },
            empty: function (elem) {
                return !elem.firstChild;
            },
            has: function (elem, i, match) {
                return !!Sizzle(match[3], elem).length;
            },
            header: function (elem) {
                return /h\d/i.test(elem.nodeName);
            },
            text: function (elem) {
                return "text" === elem.type;
            },
            radio: function (elem) {
                return "radio" === elem.type;
            },
            checkbox: function (elem) {
                return "checkbox" === elem.type;
            },
            file: function (elem) {
                return "file" === elem.type;
            },
            password: function (elem) {
                return "password" === elem.type;
            },
            submit: function (elem) {
                return "submit" === elem.type;
            },
            image: function (elem) {
                return "image" === elem.type;
            },
            reset: function (elem) {
                return "reset" === elem.type;
            },
            button: function (elem) {
                return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
            },
            input: function (elem) {
                return /input|select|textarea|button/i.test(elem.nodeName);
            }
        },
        setFilters: {
            first: function (elem, i) {
                return i === 0;
            },
            last: function (elem, i, match, array) {
                return i === array.length - 1;
            },
            even: function (elem, i) {
                return i % 2 === 0;
            },
            odd: function (elem, i) {
                return i % 2 === 1;
            },
            lt: function (elem, i, match) {
                return i < match[3] - 0;
            },
            gt: function (elem, i, match) {
                return i > match[3] - 0;
            },
            nth: function (elem, i, match) {
                return match[3] - 0 == i;
            },
            eq: function (elem, i, match) {
                return match[3] - 0 == i;
            }
        },
        filter: {
            PSEUDO: function (elem, match, i, array) {
                var name = match[1],
                    filter = Expr.filters[name];
                if (filter) {
                    return filter(elem, i, match, array);
                } else if (name === "contains") {
                    return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
                } else if (name === "not") {
                    var not = match[3];
                    for (var i = 0, l = not.length; i < l; i++) {
                        if (not[i] === elem) {
                            return false;
                        }
                    }
                    return true;
                }
            },
            CHILD: function (elem, match) {
                var type = match[1],
                    node = elem;
                switch (type) {
                case 'only':
                case 'first':
                    while ((node = node.previousSibling)) {
                        if (node.nodeType === 1) return false;
                    }
                    if (type == 'first') return true;
                    node = elem;
                case 'last':
                    while ((node = node.nextSibling)) {
                        if (node.nodeType === 1) return false;
                    }
                    return true;
                case 'nth':
                    var first = match[2],
                        last = match[3];
                    if (first == 1 && last == 0) {
                        return true;
                    }
                    var doneName = match[0],
                        parent = elem.parentNode;
                    if (parent && (parent.sizcache !== doneName || !elem.nodeIndex)) {
                        var count = 0;
                        for (node = parent.firstChild; node; node = node.nextSibling) {
                            if (node.nodeType === 1) {
                                node.nodeIndex = ++count;
                            }
                        }
                        parent.sizcache = doneName;
                    }
                    var diff = elem.nodeIndex - last;
                    if (first == 0) {
                        return diff == 0;
                    } else {
                        return (diff % first == 0 && diff / first >= 0);
                    }
                }
            },
            ID: function (elem, match) {
                return elem.nodeType === 1 && elem.getAttribute("id") === match;
            },
            TAG: function (elem, match) {
                return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
            },
            CLASS: function (elem, match) {
                return (" " + (elem.className || elem.getAttribute("class")) + " ").indexOf(match) > -1;
            },
            ATTR: function (elem, match) {
                var name = match[1],
                    result = Expr.attrHandle[name] ? Expr.attrHandle[name](elem) : elem[name] != null ? elem[name] : elem.getAttribute(name),
                    value = result + "",
                    type = match[2],
                    check = match[4];
                return result == null ? type === "!=" : type === "=" ? value === check : type === "*=" ? value.indexOf(check) >= 0 : type === "~=" ? (" " + value + " ").indexOf(check) >= 0 : !check ? value && result !== false : type === "!=" ? value != check : type === "^=" ? value.indexOf(check) === 0 : type === "$=" ? value.substr(value.length - check.length) === check : type === "|=" ? value === check || value.substr(0, check.length + 1) === check + "-" : false;
            },
            POS: function (elem, match, i, array) {
                var name = match[2],
                    filter = Expr.setFilters[name];
                if (filter) {
                    return filter(elem, i, match, array);
                }
            }
        }
    };
    var origPOS = Expr.match.POS;
    for (var type in Expr.match) {
        Expr.match[type] = new RegExp(Expr.match[type].source + /(?![^\[]*\])(?![^\(]*\))/.source);
        Expr.leftMatch[type] = new RegExp(/(^(?:.|\r|\n)*?)/.source + Expr.match[type].source);
    }
    var makeArray = function (array, results) {
        array = Array.prototype.slice.call(array, 0);
        if (results) {
            results.push.apply(results, array);
            return results;
        }
        return array;
    };
    try {
        Array.prototype.slice.call(document.documentElement.childNodes, 0);
    } catch (e) {
        makeArray = function (array, results) {
            var ret = results || [];
            if (toString.call(array) === "[object Array]") {
                Array.prototype.push.apply(ret, array);
            } else {
                if (typeof array.length === "number") {
                    for (var i = 0, l = array.length; i < l; i++) {
                        ret.push(array[i]);
                    }
                } else {
                    for (var i = 0; array[i]; i++) {
                        ret.push(array[i]);
                    }
                }
            }
            return ret;
        };
    }
    var sortOrder;
    if (document.documentElement.compareDocumentPosition) {
        sortOrder = function (a, b) {
            if (!a.compareDocumentPosition || !b.compareDocumentPosition) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }
            var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    } else if ("sourceIndex" in document.documentElement) {
        sortOrder = function (a, b) {
            if (!a.sourceIndex || !b.sourceIndex) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }
            var ret = a.sourceIndex - b.sourceIndex;
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    } else if (document.createRange) {
        sortOrder = function (a, b) {
            if (!a.ownerDocument || !b.ownerDocument) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }
            var aRange = a.ownerDocument.createRange(),
                bRange = b.ownerDocument.createRange();
            aRange.setStart(a, 0);
            aRange.setEnd(a, 0);
            bRange.setStart(b, 0);
            bRange.setEnd(b, 0);
            var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    }(function () {
        var form = document.createElement("div"),
            id = "script" + (new Date).getTime();
        form.innerHTML = "<a name='" + id + "'/>";
        var root = document.documentElement;
        root.insertBefore(form, root.firstChild);
        if ( !! document.getElementById(id)) {
            Expr.find.ID = function (match, context, isXML) {
                if (typeof context.getElementById !== "undefined" && !isXML) {
                    var m = context.getElementById(match[1]);
                    return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
                }
            };
            Expr.filter.ID = function (elem, match) {
                var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                return elem.nodeType === 1 && node && node.nodeValue === match;
            };
        }
        root.removeChild(form);
        root = form = null;
    })();
    (function () {
        var div = document.createElement("div");
        div.appendChild(document.createComment(""));
        if (div.getElementsByTagName("*").length > 0) {
            Expr.find.TAG = function (match, context) {
                var results = context.getElementsByTagName(match[1]);
                if (match[1] === "*") {
                    var tmp = [];
                    for (var i = 0; results[i]; i++) {
                        if (results[i].nodeType === 1) {
                            tmp.push(results[i]);
                        }
                    }
                    results = tmp;
                }
                return results;
            };
        }
        div.innerHTML = "<a href='#'></a>";
        if (div.firstChild && typeof div.firstChild.getAttribute !== "undefined" && div.firstChild.getAttribute("href") !== "#") {
            Expr.attrHandle.href = function (elem) {
                return elem.getAttribute("href", 2);
            };
        }
        div = null;
    })();
    if (document.querySelectorAll)(function () {
        var oldSizzle = Sizzle,
            div = document.createElement("div");
        div.innerHTML = "<p class='TEST'></p>";
        if (div.querySelectorAll && div.querySelectorAll(".TEST").length === 0) {
            return;
        }
        Sizzle = function (query, context, extra, seed) {
            context = context || document;
            if (!seed && context.nodeType === 9 && !isXML(context)) {
                try {
                    return makeArray(context.querySelectorAll(query), extra);
                } catch (e) {}
            }
            return oldSizzle(query, context, extra, seed);
        };
        for (var prop in oldSizzle) {
            Sizzle[prop] = oldSizzle[prop];
        }
        div = null;
    })();
    if (document.getElementsByClassName && document.documentElement.getElementsByClassName)(function () {
        var div = document.createElement("div");
        div.innerHTML = "<div class='test e'></div><div class='test'></div>";
        if (div.getElementsByClassName("e").length === 0) return;
        div.lastChild.className = "e";
        if (div.getElementsByClassName("e").length === 1) return;
        Expr.order.splice(1, 0, "CLASS");
        Expr.find.CLASS = function (match, context, isXML) {
            if (typeof context.getElementsByClassName !== "undefined" && !isXML) {
                return context.getElementsByClassName(match[1]);
            }
        };
        div = null;
    })();

    function dirNodeCheck(dir, cur, doneName, checkSet, nodeCheck, isXML) {
        var sibDir = dir == "previousSibling" && !isXML;
        for (var i = 0, l = checkSet.length; i < l; i++) {
            var elem = checkSet[i];
            if (elem) {
                if (sibDir && elem.nodeType === 1) {
                    elem.sizcache = doneName;
                    elem.sizset = i;
                }
                elem = elem[dir];
                var match = false;
                while (elem) {
                    if (elem.sizcache === doneName) {
                        match = checkSet[elem.sizset];
                        break;
                    }
                    if (elem.nodeType === 1 && !isXML) {
                        elem.sizcache = doneName;
                        elem.sizset = i;
                    }
                    if (elem.nodeName === cur) {
                        match = elem;
                        break;
                    }
                    elem = elem[dir];
                }
                checkSet[i] = match;
            }
        }
    }

    function dirCheck(dir, cur, doneName, checkSet, nodeCheck, isXML) {
        var sibDir = dir == "previousSibling" && !isXML;
        for (var i = 0, l = checkSet.length; i < l; i++) {
            var elem = checkSet[i];
            if (elem) {
                if (sibDir && elem.nodeType === 1) {
                    elem.sizcache = doneName;
                    elem.sizset = i;
                }
                elem = elem[dir];
                var match = false;
                while (elem) {
                    if (elem.sizcache === doneName) {
                        match = checkSet[elem.sizset];
                        break;
                    }
                    if (elem.nodeType === 1) {
                        if (!isXML) {
                            elem.sizcache = doneName;
                            elem.sizset = i;
                        }
                        if (typeof cur !== "string") {
                            if (elem === cur) {
                                match = true;
                                break;
                            }
                        } else if (Sizzle.filter(cur, [elem]).length > 0) {
                            match = elem;
                            break;
                        }
                    }
                    elem = elem[dir];
                }
                checkSet[i] = match;
            }
        }
    }
    var contains = document.compareDocumentPosition ?
    function (a, b) {
        return a.compareDocumentPosition(b) & 16;
    } : function (a, b) {
        return a !== b && (a.contains ? a.contains(b) : true);
    };
    var isXML = function (elem) {
        return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" || !! elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
    };
    var posProcess = function (selector, context) {
        var tmpSet = [],
            later = "",
            match, root = context.nodeType ? [context] : context;
        while ((match = Expr.match.PSEUDO.exec(selector))) {
            later += match[0];
            selector = selector.replace(Expr.match.PSEUDO, "");
        }
        selector = Expr.relative[selector] ? selector + "*" : selector;
        for (var i = 0, l = root.length; i < l; i++) {
            Sizzle(selector, root[i], tmpSet);
        }
        return Sizzle.filter(later, tmpSet);
    };
    window.Sizzle = Sizzle;
})();;
(function (engine) {
    var extendElements = Prototype.Selector.extendElements;

    function select(selector, scope) {
        return extendElements(engine(selector, scope || document));
    }
function match(element, selector) {
    return engine.matches(selector, [element]).length == 1;
}
Prototype.Selector.engine = engine;
Prototype.Selector.select = select;
Prototype.Selector.match = match;
})(Sizzle);
window.Sizzle = Prototype._original_property;
delete Prototype._original_property;
var Form = {
    reset: function (form) {
        form = $(form);
        form.reset();
        return form;
    },
    serializeElements: function (elements, options) {
        if (typeof options != 'object') options = {
            hash: !! options
        };
        else if (Object.isUndefined(options.hash)) options.hash = true;
        var key, value, submitted = false,
            submit = options.submit,
            accumulator, initial;
        if (options.hash) {
            initial = {};
            accumulator = function (result, key, value) {
                if (key in result) {
                    if (!Object.isArray(result[key])) result[key] = [result[key]];
                    result[key].push(value);
                } else result[key] = value;
                return result;
            };
        } else {
            initial = '';
            accumulator = function (result, key, value) {
                return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + encodeURIComponent(value);
            }
        }
        return elements.inject(initial, function (result, element) {
            if (!element.disabled && element.name) {
                key = element.name;
                value = $(element).getValue();
                if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted && submit !== false && (!submit || key == submit) && (submitted = true)))) {
                    result = accumulator(result, key, value);
                }
            }
            return result;
        });
    }
};
Form.Methods = {
    serialize: function (form, options) {
        return Form.serializeElements(Form.getElements(form), options);
    },
    getElements: function (form) {
        var elements = $(form).getElementsByTagName('*'),
            element, arr = [],
            serializers = Form.Element.Serializers;
        for (var i = 0; element = elements[i]; i++) {
            arr.push(element);
        }
        return arr.inject([], function (elements, child) {
            if (serializers[child.tagName.toLowerCase()]) elements.push(Element.extend(child));
            return elements;
        })
    },
    getInputs: function (form, typeName, name) {
        form = $(form);
        var inputs = form.getElementsByTagName('input');
        if (!typeName && !name) return $A(inputs).map(Element.extend);
        for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
            var input = inputs[i];
            if ((typeName && input.type != typeName) || (name && input.name != name)) continue;
            matchingInputs.push(Element.extend(input));
        }
        return matchingInputs;
    },
    disable: function (form) {
        form = $(form);
        Form.getElements(form).invoke('disable');
        return form;
    },
    enable: function (form) {
        form = $(form);
        Form.getElements(form).invoke('enable');
        return form;
    },
    findFirstElement: function (form) {
        var elements = $(form).getElements().findAll(function (element) {
            return 'hidden' != element.type && !element.disabled;
        });
        var firstByIndex = elements.findAll(function (element) {
            return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
        }).sortBy(function (element) {
            return element.tabIndex
        }).first();
        return firstByIndex ? firstByIndex : elements.find(function (element) {
            return /^(?:input|select|textarea)$/i.test(element.tagName);
        });
    },
    focusFirstElement: function (form) {
        form = $(form);
        var element = form.findFirstElement();
        if (element) element.activate();
        return form;
    },
    request: function (form, options) {
        form = $(form), options = Object.clone(options || {});
        var params = options.parameters,
            action = form.readAttribute('action') || '';
        if (action.blank()) action = window.location.href;
        options.parameters = form.serialize(true);
        if (params) {
            if (Object.isString(params)) params = params.toQueryParams();
            Object.extend(options.parameters, params);
        }
        if (form.hasAttribute('method') && !options.method) options.method = form.method;
        return new Ajax.Request(action, options);
    }
};
Form.Element = {
    focus: function (element) {
        $(element).focus();
        return element;
    },
    select: function (element) {
        $(element).select();
        return element;
    }
};
Form.Element.Methods = {
    serialize: function (element) {
        element = $(element);
        if (!element.disabled && element.name) {
            var value = element.getValue();
            if (value != undefined) {
                var pair = {};
                pair[element.name] = value;
                return Object.toQueryString(pair);
            }
        }
        return '';
    },
    getValue: function (element) {
        element = $(element);
        var method = element.tagName.toLowerCase();
        return Form.Element.Serializers[method](element);
    },
    setValue: function (element, value) {
        element = $(element);
        var method = element.tagName.toLowerCase();
        Form.Element.Serializers[method](element, value);
        return element;
    },
    clear: function (element) {
        $(element).value = '';
        return element;
    },
    present: function (element) {
        return $(element).value != '';
    },
    activate: function (element) {
        element = $(element);
        try {
            element.focus();
            if (element.select && (element.tagName.toLowerCase() != 'input' || !(/^(?:button|reset|submit)$/i.test(element.type)))) element.select();
        } catch (e) {}
        return element;
    },
    disable: function (element) {
        element = $(element);
        element.disabled = true;
        return element;
    },
    enable: function (element) {
        element = $(element);
        element.disabled = false;
        return element;
    }
};
var Field = Form.Element;
var $F = Form.Element.Methods.getValue;
Form.Element.Serializers = (function () {
    function input(element, value) {
        switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
            return inputSelector(element, value);
        default:
            return valueSelector(element, value);
        }
    }

    function inputSelector(element, value) {
        if (Object.isUndefined(value)) return element.checked ? element.value : null;
        else element.checked = !! value;
    }

    function valueSelector(element, value) {
        if (Object.isUndefined(value)) return element.value;
        else element.value = value;
    }

    function select(element, value) {
        if (Object.isUndefined(value)) return (element.type === 'select-one' ? selectOne : selectMany)(element);
        var opt, currentValue, single = !Object.isArray(value);
        for (var i = 0, length = element.length; i < length; i++) {
            opt = element.options[i];
            currentValue = this.optionValue(opt);
            if (single) {
                if (currentValue == value) {
                    opt.selected = true;
                    return;
                }
            } else opt.selected = value.include(currentValue);
        }
    }

    function selectOne(element) {
        var index = element.selectedIndex;
        return index >= 0 ? optionValue(element.options[index]) : null;
    }

    function selectMany(element) {
        var values, length = element.length;
        if (!length) return null;
        for (var i = 0, values = []; i < length; i++) {
            var opt = element.options[i];
            if (opt.selected) values.push(optionValue(opt));
        }
        return values;
    }

    function optionValue(opt) {
        return Element.hasAttribute(opt, 'value') ? opt.value : opt.text;
    }
    return {
        input: input,
        inputSelector: inputSelector,
        textarea: valueSelector,
        select: select,
        selectOne: selectOne,
        selectMany: selectMany,
        optionValue: optionValue,
        button: valueSelector
    };
})();
Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
    initialize: function ($super, element, frequency, callback) {
        $super(callback, frequency);
        this.element = $(element);
        this.lastValue = this.getValue();
    },
    execute: function () {
        var value = this.getValue();
        if (Object.isString(this.lastValue) && Object.isString(value) ? this.lastValue != value : String(this.lastValue) != String(value)) {
            this.callback(this.element, value);
            this.lastValue = value;
        }
    }
});
Form.Element.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function () {
        return Form.Element.getValue(this.element);
    }
});
Form.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function () {
        return Form.serialize(this.element);
    }
});
Abstract.EventObserver = Class.create({
    initialize: function (element, callback) {
        this.element = $(element);
        this.callback = callback;
        this.lastValue = this.getValue();
        if (this.element.tagName.toLowerCase() == 'form') this.registerFormCallbacks();
        else
        this.registerCallback(this.element);
    },
    onElementEvent: function () {
        var value = this.getValue();
        if (this.lastValue != value) {
            this.callback(this.element, value);
            this.lastValue = value;
        }
    },
    registerFormCallbacks: function () {
        Form.getElements(this.element).each(this.registerCallback, this);
    },
    registerCallback: function (element) {
        if (element.type) {
            switch (element.type.toLowerCase()) {
            case 'checkbox':
            case 'radio':
                Event.observe(element, 'click', this.onElementEvent.bind(this));
                break;
            default:
                Event.observe(element, 'change', this.onElementEvent.bind(this));
                break;
            }
        }
    }
});
Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function () {
        return Form.Element.getValue(this.element);
    }
});
Form.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function () {
        return Form.serialize(this.element);
    }
});
(function () {
    var Event = {
        KEY_BACKSPACE: 8,
        KEY_TAB: 9,
        KEY_RETURN: 13,
        KEY_ESC: 27,
        KEY_LEFT: 37,
        KEY_UP: 38,
        KEY_RIGHT: 39,
        KEY_DOWN: 40,
        KEY_DELETE: 46,
        KEY_HOME: 36,
        KEY_END: 35,
        KEY_PAGEUP: 33,
        KEY_PAGEDOWN: 34,
        KEY_INSERT: 45,
        cache: {}
    };
    var docEl = document.documentElement;
    var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl && 'onmouseleave' in docEl;
    var isIELegacyEvent = function (event) {
        return false;
    };
    if (window.attachEvent) {
        if (window.addEventListener) {
            isIELegacyEvent = function (event) {
                return !(event instanceof window.Event);
            };
        } else {
            isIELegacyEvent = function (event) {
                return true;
            };
        }
    }
    var _isButton;

    function _isButtonForDOMEvents(event, code) {
        return event.which ? (event.which === code + 1) : (event.button === code);
    }
    var legacyButtonMap = {
        0: 1,
        1: 4,
        2: 2
    };

    function _isButtonForLegacyEvents(event, code) {
        return event.button === legacyButtonMap[code];
    }

    function _isButtonForWebKit(event, code) {
        switch (code) {
        case 0:
            return event.which == 1 && !event.metaKey;
        case 1:
            return event.which == 2 || (event.which == 1 && event.metaKey);
        case 2:
            return event.which == 3;
        default:
            return false;
        }
    }
    if (window.attachEvent) {
        if (!window.addEventListener) {
            _isButton = _isButtonForLegacyEvents;
        } else {
            _isButton = function (event, code) {
                return isIELegacyEvent(event) ? _isButtonForLegacyEvents(event, code) : _isButtonForDOMEvents(event, code);
            }
        }
    } else if (Prototype.Browser.WebKit) {
        _isButton = _isButtonForWebKit;
    } else {
        _isButton = _isButtonForDOMEvents;
    }

    function isLeftClick(event) {
        return _isButton(event, 0)
    }

    function isMiddleClick(event) {
        return _isButton(event, 1)
    }

    function isRightClick(event) {
        return _isButton(event, 2)
    }

    function element(event) {
        event = Event.extend(event);
        var node = event.target,
            type = event.type,
            currentTarget = event.currentTarget;
        if (currentTarget && currentTarget.tagName) {
            if (type === 'load' || type === 'error' || (type === 'click' && currentTarget.tagName.toLowerCase() === 'input' && currentTarget.type === 'radio')) node = currentTarget;
        }
        if (node.nodeType == Node.TEXT_NODE) node = node.parentNode;
        return Element.extend(node);
    }

    function findElement(event, expression) {
        var element = Event.element(event);
        if (!expression) return element;
        while (element) {
            if (Object.isElement(element) && Prototype.Selector.match(element, expression)) {
                return Element.extend(element);
            }
            element = element.parentNode;
        }
    }

    function pointer(event) {
        return {
            x: pointerX(event),
            y: pointerY(event)
        };
    }

    function pointerX(event) {
        var docElement = document.documentElement,
            body = document.body || {
                scrollLeft: 0
            };
        return event.pageX || (event.clientX + (docElement.scrollLeft || body.scrollLeft) - (docElement.clientLeft || 0));
    }

    function pointerY(event) {
        var docElement = document.documentElement,
            body = document.body || {
                scrollTop: 0
            };
        return event.pageY || (event.clientY + (docElement.scrollTop || body.scrollTop) - (docElement.clientTop || 0));
    }

    function stop(event) {
        Event.extend(event);
        event.preventDefault();
        event.stopPropagation();
        event.stopped = true;
    }
    Event.Methods = {
        isLeftClick: isLeftClick,
        isMiddleClick: isMiddleClick,
        isRightClick: isRightClick,
        element: element,
        findElement: findElement,
        pointer: pointer,
        pointerX: pointerX,
        pointerY: pointerY,
        stop: stop
    };
    var methods = Object.keys(Event.Methods).inject({}, function (m, name) {
        m[name] = Event.Methods[name].methodize();
        return m;
    });
    if (window.attachEvent) {
        function _relatedTarget(event) {
            var element;
            switch (event.type) {
            case 'mouseover':
            case 'mouseenter':
                element = event.fromElement;
                break;
            case 'mouseout':
            case 'mouseleave':
                element = event.toElement;
                break;
            default:
                return null;
            }
            return Element.extend(element);
        }
        var additionalMethods = {
            stopPropagation: function () {
                this.cancelBubble = true
            },
            preventDefault: function () {
                this.returnValue = false
            },
            inspect: function () {
                return '[object Event]'
            }
        };
        Event.extend = function (event, element) {
            if (!event) return false;
            if (!isIELegacyEvent(event)) return event;
            if (event._extendedByPrototype) return event;
            event._extendedByPrototype = Prototype.emptyFunction;
            var pointer = Event.pointer(event);
            Object.extend(event, {
                target: event.srcElement || element,
                relatedTarget: _relatedTarget(event),
                pageX: pointer.x,
                pageY: pointer.y
            });
            Object.extend(event, methods);
            Object.extend(event, additionalMethods);
            return event;
        };
    } else {
        Event.extend = Prototype.K;
    }
    if (window.addEventListener) {
        Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
        Object.extend(Event.prototype, methods);
    }

    function _createResponder(element, eventName, handler) {
        var registry = Element.retrieve(element, 'prototype_event_registry');
        if (Object.isUndefined(registry)) {
            CACHE.push(element);
            registry = Element.retrieve(element, 'prototype_event_registry', $H());
        }
        var respondersForEvent = registry.get(eventName);
        if (Object.isUndefined(respondersForEvent)) {
            respondersForEvent = [];
            registry.set(eventName, respondersForEvent);
        }
        if (respondersForEvent.pluck('handler').include(handler)) return false;
        var responder;
        if (eventName.include(":")) {
            responder = function (event) {
                if (Object.isUndefined(event.eventName)) return false;
                if (event.eventName !== eventName) return false;
                Event.extend(event, element);
                handler.call(element, event);
            };
        } else {
            if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED && (eventName === "mouseenter" || eventName === "mouseleave")) {
                if (eventName === "mouseenter" || eventName === "mouseleave") {
                    responder = function (event) {
                        Event.extend(event, element);
                        var parent = event.relatedTarget;
                        while (parent && parent !== element) {
                            try {
                                parent = parent.parentNode;
                            } catch (e) {
                                parent = element;
                            }
                        }
                        if (parent === element) return;
                        handler.call(element, event);
                    };
                }
            } else {
                responder = function (event) {
                    Event.extend(event, element);
                    handler.call(element, event);
                };
            }
        }
        responder.handler = handler;
        respondersForEvent.push(responder);
        return responder;
    }

    function _destroyCache() {
        for (var i = 0, length = CACHE.length; i < length; i++) {
            Event.stopObserving(CACHE[i]);
            CACHE[i] = null;
        }
    }
    var CACHE = [];
    if (Prototype.Browser.IE) window.attachEvent('onunload', _destroyCache);
    if (Prototype.Browser.WebKit) window.addEventListener('unload', Prototype.emptyFunction, false);
    var _getDOMEventName = Prototype.K,
        translations = {
            mouseenter: "mouseover",
            mouseleave: "mouseout"
        };
    if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
        _getDOMEventName = function (eventName) {
            return (translations[eventName] || eventName);
        };
    }

    function observe(element, eventName, handler) {
        element = $(element);
        var responder = _createResponder(element, eventName, handler);
        if (!responder) return element;
        if (eventName.include(':')) {
            if (element.addEventListener) element.addEventListener("dataavailable", responder, false);
            else {
                element.attachEvent("ondataavailable", responder);
                element.attachEvent("onlosecapture", responder);
            }
        } else {
            var actualEventName = _getDOMEventName(eventName);
            if (element.addEventListener) element.addEventListener(actualEventName, responder, false);
            else
            element.attachEvent("on" + actualEventName, responder);
        }
        return element;
    }

    function stopObserving(element, eventName, handler) {
        element = $(element);
        var registry = Element.retrieve(element, 'prototype_event_registry');
        if (!registry) return element;
        if (!eventName) {
            registry.each(function (pair) {
                var eventName = pair.key;
                stopObserving(element, eventName);
            });
            return element;
        }
        var responders = registry.get(eventName);
        if (!responders) return element;
        if (!handler) {
            responders.each(function (r) {
                stopObserving(element, eventName, r.handler);
            });
            return element;
        }
        var i = responders.length,
            responder;
        while (i--) {
            if (responders[i].handler === handler) {
                responder = responders[i];
                break;
            }
        }
        if (!responder) return element;
        if (eventName.include(':')) {
            if (element.removeEventListener) element.removeEventListener("dataavailable", responder, false);
            else {
                element.detachEvent("ondataavailable", responder);
                element.detachEvent("onlosecapture", responder);
            }
        } else {
            var actualEventName = _getDOMEventName(eventName);
            if (element.removeEventListener) element.removeEventListener(actualEventName, responder, false);
            else
            element.detachEvent('on' + actualEventName, responder);
        }
        registry.set(eventName, responders.without(responder));
        return element;
    }

    function fire(element, eventName, memo, bubble) {
		
        element = $(element);
        if (Object.isUndefined(bubble)) bubble = true;
        if (element == document && document.createEvent && !element.dispatchEvent) element = document.documentElement;
        var event;
        if (document.createEvent) {
            event = document.createEvent('HTMLEvents');
            event.initEvent('dataavailable', bubble, true);
        } else {
            event = document.createEventObject();
            event.eventType = bubble ? 'ondataavailable' : 'onlosecapture';
        }
        event.eventName = eventName;
        event.memo = memo || {};
        if (document.createEvent) element.dispatchEvent(event);
        else
        element.fireEvent(event.eventType, event);
        return Event.extend(event);
    }
    Event.Handler = Class.create({
        initialize: function (element, eventName, selector, callback) {
            this.element = $(element);
            this.eventName = eventName;
            this.selector = selector;
            this.callback = callback;
            this.handler = this.handleEvent.bind(this);
        },
        start: function () {
            Event.observe(this.element, this.eventName, this.handler);
            return this;
        },
        stop: function () {
            Event.stopObserving(this.element, this.eventName, this.handler);
            return this;
        },
        handleEvent: function (event) {
            var element = Event.findElement(event, this.selector);
            if (element) this.callback.call(this.element, event, element);
        }
    });

    function on(element, eventName, selector, callback) {
        element = $(element);
        if (Object.isFunction(selector) && Object.isUndefined(callback)) {
            callback = selector, selector = null;
        }
        return new Event.Handler(element, eventName, selector, callback).start();
    }
    Object.extend(Event, Event.Methods);
    Object.extend(Event, {
        fire: fire,
        observe: observe,
        stopObserving: stopObserving,
        on: on
    });
    Element.addMethods({
        fire: fire,
        observe: observe,
        stopObserving: stopObserving,
        on: on
    });
    Object.extend(document, {
        fire: fire.methodize(),
        observe: observe.methodize(),
        stopObserving: stopObserving.methodize(),
        on: on.methodize(),
        loaded: false
    });
    if (window.Event) Object.extend(window.Event, Event);
    else window.Event = Event;
})();
(function () {
    var timer;

    function fireContentLoadedEvent() {
	
		/*Event.observe(window,'scroll', function(evt){
												
            //$('tabbed_box_1').setStyle({ marginTop: document.viewport.getScrollOffsets().top+ 'px' });
			
        });*/
        if (document.loaded) return;
        if (timer) window.clearTimeout(timer);
        document.loaded = true;
        document.fire('dom:loaded');
    }

    function checkReadyState() {
        if (document.readyState === 'complete') {
            document.stopObserving('readystatechange', checkReadyState);
            fireContentLoadedEvent();
        }
    }

    function pollDoScroll() {
        try {
            document.documentElement.doScroll('left');
        } catch (e) {
            timer = pollDoScroll.p_defer();
            return;
        }
        fireContentLoadedEvent();
    }
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
    } else {
        document.observe('readystatechange', checkReadyState);
        if (window == top) timer = pollDoScroll.p_defer();
    }
    Event.observe(window, 'load', fireContentLoadedEvent);
})();
Element.addMethods();
Hash.toQueryString = Object.toQueryString;
var Toggle = {
    display: Element.toggle
};
Element.Methods.childOf = Element.Methods.descendantOf;
var Insertion = {
    Before: function (element, content) {
        return Element.insert(element, {
            before: content
        });
    },
    Top: function (element, content) {
        return Element.insert(element, {
            top: content
        });
    },
    Bottom: function (element, content) {
        return Element.insert(element, {
            bottom: content
        });
    },
    After: function (element, content) {
        return Element.insert(element, {
            after: content
        });
    }
};
var $continue = new Error('"throw $continue" is deprecated, use "return" instead');
var Position = {
    includeScrollOffsets: false,
    prepare: function () {
        this.deltaX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
        this.deltaY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    },
    within: function (element, x, y) {
        if (this.includeScrollOffsets) return this.withinIncludingScrolloffsets(element, x, y);
        this.xcomp = x;
        this.ycomp = y;
        this.offset = Element.cumulativeOffset(element);
        return (y >= this.offset[1] && y < this.offset[1] + element.offsetHeight && x >= this.offset[0] && x < this.offset[0] + element.offsetWidth);
    },
    withinIncludingScrolloffsets: function (element, x, y) {
        var offsetcache = Element.cumulativeScrollOffset(element);
        this.xcomp = x + offsetcache[0] - this.deltaX;
        this.ycomp = y + offsetcache[1] - this.deltaY;
        this.offset = Element.cumulativeOffset(element);
        return (this.ycomp >= this.offset[1] && this.ycomp < this.offset[1] + element.offsetHeight && this.xcomp >= this.offset[0] && this.xcomp < this.offset[0] + element.offsetWidth);
    },
    overlap: function (mode, element) {
        if (!mode) return 0;
        if (mode == 'vertical') return ((this.offset[1] + element.offsetHeight) - this.ycomp) / element.offsetHeight;
        if (mode == 'horizontal') return ((this.offset[0] + element.offsetWidth) - this.xcomp) / element.offsetWidth;
    },
    cumulativeOffset: Element.Methods.cumulativeOffset,
    positionedOffset: Element.Methods.positionedOffset,
    absolutize: function (element) {
        Position.prepare();
        return Element.absolutize(element);
    },
    relativize: function (element) {
        Position.prepare();
        return Element.relativize(element);
    },
    realOffset: Element.Methods.cumulativeScrollOffset,
    offsetParent: Element.Methods.getOffsetParent,
    page: Element.Methods.viewportOffset,
    clone: function (source, target, options) {
        options = options || {};
        return Element.clonePosition(target, source, options);
    }
};
if (!document.getElementsByClassName) document.getElementsByClassName = function (instanceMethods) {
    function iter(name) {
        return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
    }
    instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
    function (element, className) {
        className = className.toString().strip();
        var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
        return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
    } : function (element, className) {
        className = className.toString().strip();
        var elements = [],
            classNames = (/\s/.test(className) ? $w(className) : null);
        if (!classNames && !className) return elements;
        var nodes = $(element).getElementsByTagName('*');
        className = ' ' + className + ' ';
        for (var i = 0, child, cn; child = nodes[i]; i++) {
            if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) || (classNames && classNames.all(function (name) {
                return !name.toString().blank() && cn.include(' ' + name + ' ');
            })))) elements.push(Element.extend(child));
        }
        return elements;
    };
    return function (className, parentElement) {
        return $(parentElement || document.body).getElementsByClassName(className);
    };
}(Element.Methods);
Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
    initialize: function (element) {
        this.element = $(element);
    },
    _each: function (iterator) {
        this.element.className.split(/\s+/).select(function (name) {
            return name.length > 0;
        })._each(iterator);
    },
    set: function (className) {
        this.element.className = className;
    },
    add: function (classNameToAdd) {
        if (this.include(classNameToAdd)) return;
        this.set($A(this).concat(classNameToAdd).join(' '));
    },
    remove: function (classNameToRemove) {
        if (!this.include(classNameToRemove)) return;
        this.set($A(this).without(classNameToRemove).join(' '));
    },
    toString: function () {
        return $A(this).join(' ');
    }
};
Object.extend(Element.ClassNames.prototype, Enumerable);
(function () {
    window.Selector = Class.create({
        initialize: function (expression) {
            this.expression = expression.strip();
        },
        findElements: function (rootElement) {
            return Prototype.Selector.select(this.expression, rootElement);
        },
        match: function (element) {
            return Prototype.Selector.match(element, this.expression);
        },
        toString: function () {
            return this.expression;
        },
        inspect: function () {
            return "#<Selector: " + this.expression + ">";
        }
    });
    Object.extend(Selector, {
        matchElements: function (elements, expression) {
            var match = Prototype.Selector.match,
                results = [];
            for (var i = 0, length = elements.length; i < length; i++) {
                var element = elements[i];
                if (match(element, expression)) {
                    results.push(Element.extend(element));
                }
            }
            return results;
        },
        findElement: function (elements, expression, index) {
            index = index || 0;
            var matchIndex = 0,
                element;
            for (var i = 0, length = elements.length; i < length; i++) {
                element = elements[i];
                if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
                    return Element.extend(element);
                }
            }
        },
        findChildElements: function (element, expressions) {
            var selector = expressions.toArray().join(', ');
            return Prototype.Selector.select(selector, element || document);
        }
    });
})();;
if (window.console === undefined) {
    if (!window.console || !console.firebug) {
        (function (m, i) {
            window.console = {};
            while (i--) {
                window.console[m[i]] = function () {};
            }
        })('log debug info warn error assert dir dirxml trace group groupEnd time timeEnd profile profileEnd count'.split(' '), 16);
    }
    window.console.error = function (e) {
        throw (e);
    };
}
if (window.Prototype === undefined) {
    throw ("Error:prototype.js is required by protoplus.js. Go to prototypejs.org and download lates version.");
}
Protoplus = {
    Version: "0.9.9",
    exec: function (code) {
        return eval(code);
    },
    REFIDCOUNT: 100,
    references: {},
    getIEVersion: function () {
        var rv = -1;
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) !== null) {
                rv = parseFloat(RegExp.$1);
            }
        }
        return rv;
    },
    Transitions: {
        linear: function (x) {
            return x;
        },
        sineIn: function (x) {
            return 1 - Math.cos(x * Math.PI / 2);
        },
        sineOut: function (x) {
            return Math.sin(x * Math.PI / 2);
        },
        sineInOut: function (x) {
            return 0.5 - Math.cos(x * Math.PI) / 2;
        },
        backIn: function (b) {
            var a = 1.70158;
            return (b) * b * ((a + 1) * b - a);
        },
        backOut: function (b) {
            var a = 1.70158;
            return (b = b - 1) * b * ((a + 1) * b + a) + 1;
        },
        backInOut: function (b) {
            var a = 1.70158;
            if ((b /= 0.5) < 1) {
                return 0.5 * (b * b * (((a *= (1.525)) + 1) * b - a));
            }
            return 0.5 * ((b -= 2) * b * (((a *= (1.525)) + 1) * b + a) + 2);
        },
        cubicIn: function (x) {
            return Math.pow(x, 3);
        },
        cubicOut: function (x) {
            return 1 + Math.pow(x - 1, 3);
        },
        cubicInOut: function (x) {
            return x < 0.5 ? 4 * Math.pow(x, 3) : 1 + 4 * Math.pow(x - 1, 3);
        },
        quadIn: function (x) {
            return Math.pow(x, 2);
        },
        quadOut: function (x) {
            return 1 - Math.pow(x - 1, 2);
        },
        quadInOut: function (x) {
            return x < 0.5 ? 2 * Math.pow(x, 2) : 1 - 2 * Math.pow(x - 1, 2);
        },
        quartIn: function (x) {
            return Math.pow(x, 4);
        },
        quartOut: function (x) {
            return 1 - Math.pow(x - 1, 4);
        },
        quartInOut: function (x) {
            return x < 0.5 ? 8 * Math.pow(x, 4) : 1 - 8 * Math.pow(x - 1, 4);
        },
        quintIn: function (x) {
            return Math.pow(x, 5);
        },
        quintOut: function (x) {
            return 1 + Math.pow(x - 1, 5);
        },
        quintInOut: function (x) {
            return x < 0.5 ? 16 * Math.pow(x, 5) : 1 + 16 * Math.pow(x - 1, 5);
        },
        circIn: function (x) {
            return 1 - Math.sqrt(1 - Math.pow(x, 2));
        },
        circOut: function (x) {
            return Math.sqrt(1 - Math.pow(x - 1, 2));
        },
        circInOut: function (x) {
            return x < 0.5 ? 0.5 - Math.sqrt(1 - Math.pow(2 * x, 2)) * 0.5 : 0.5 + Math.sqrt(1 - Math.pow(2 * x - 2, 2)) * 0.5;
        },
        expoIn: function (x) {
            return Math.pow(2, 10 * (x - 1));
        },
        expoOut: function (x) {
            return 1 - Math.pow(2, -10 * x);
        },
        expoInOut: function (x) {
            x = 2 * x - 1;
            return x < 0 ? Math.pow(2, 10 * x) / 2 : 1 - Math.pow(2, -10 * x) / 2;
        },
        swingFrom: function (b) {
            var a = 1.70158;
            return b * b * ((a + 1) * b - a);
        },
        swingTo: function (b) {
            var a = 1.70158;
            return (b -= 1) * b * ((a + 1) * b + a) + 1;
        },
        swingFromTo: function (b) {
            var a = 1.70158;
            return ((b /= 0.5) < 1) ? 0.5 * (b * b * (((a *= (1.525)) + 1) * b - a)) : 0.5 * ((b -= 2) * b * (((a *= (1.525)) + 1) * b + a) + 2);
        },
        easeFrom: function (a) {
            return Math.pow(a, 4);
        },
        easeTo: function (a) {
            return Math.pow(a, 0.25);
        },
        easeFromTo: function (a) {
            if ((a /= 0.5) < 1) {
                return 0.5 * Math.pow(a, 4);
            }
            return -0.5 * ((a -= 2) * Math.pow(a, 3) - 2);
        },
        pulse: function (x, n) {
            if (!n) {
                n = 1;
            }
            return 0.5 - Math.cos(x * n * 2 * Math.PI) / 2;
        },
        wobble: function (x, n) {
            if (!n) {
                n = 3;
            }
            return 0.5 - Math.cos((2 * n - 1) * x * x * Math.PI) / 2;
        },
        elastic: function (x, e) {
            var a;
            if (!e) {
                a = 30;
            } else {
                e = Math.round(Math.max(1, Math.min(10, e)));
                a = (11 - e) * 5;
            }
            return 1 - Math.cos(x * 8 * Math.PI) / (a * x + 1) * (1 - x);
        },
        bounce: function (x, n) {
            n = n ? Math.round(n) : 4;
            var c = 3 - Math.pow(2, 2 - n);
            var m = -1,
                d = 0,
                i = 0;
            while (m / c < x) {
                d = Math.pow(2, 1 - i++);
                m += d;
            }
            if (m - d > 0) {
                x -= ((m - d) + d / 2) / c;
            }
            return c * c * Math.pow(x, 2) + (1 - Math.pow(0.25, i - 1));
        },
        bouncePast: function (a) {
            if (a < (1 / 2.75)) {
                return (7.5625 * a * a);
            } else {
                if (a < (2 / 2.75)) {
                    return 2 - (7.5625 * (a -= (1.5 / 2.75)) * a + 0.75);
                } else {
                    if (a < (2.5 / 2.75)) {
                        return 2 - (7.5625 * (a -= (2.25 / 2.75)) * a + 0.9375);
                    } else {
                        return 2 - (7.5625 * (a -= (2.625 / 2.75)) * a + 0.984375);
                    }
                }
            }
        }
    },
    Colors: {
        colorNames: {
            "Black": "#000000",
            "MidnightBlue": "#191970",
            "Navy": "#000080",
            "DarkBlue": "#00008B",
            "MediumBlue": "#0000CD",
            "Blue": "#0000FF",
            "DodgerBlue": "#1E90FF",
            "RoyalBlue": "#4169E1",
            "SlateBlue": "#6A5ACD",
            "SteelBlue": "#4682B4",
            "CornflowerBlue": "#6495ED",
            "Teal": "#008080",
            "DarkCyan": "#008B8B",
            "MediumSlateBlue": "#7B68EE",
            "CadetBlue": "#5F9EA0",
            "DeepSkyBlue": "#00BFFF",
            "DarkTurquoise": "#00CED1",
            "MediumAquaMarine": "#66CDAA",
            "MediumTurquoise": "#48D1CC",
            "Turquoise": "#40E0D0",
            "LightSkyBlue": "#87CEFA",
            "SkyBlue": "#87CEEB",
            "Aqua": "#00FFFF",
            "Cyan": "#00FFFF",
            "Aquamarine": "#7FFFD4",
            "PaleTurquoise": "#AFEEEE",
            "PowderBlue": "#B0E0E6",
            "LightBlue": "#ADD8E6",
            "LightSteelBlue": "#B0C4DE",
            "Salmon": "#FA8072",
            "LightSalmon": "#FFA07A",
            "Coral": "#FF7F50",
            "Brown": "#A52A2A",
            "Sienna": "#A0522D",
            "Tomato": "#FF6347",
            "Maroon": "#800000",
            "DarkRed": "#8B0000",
            "Red": "#FF0000",
            "OrangeRed": "#FF4500",
            "Darkorange": "#FF8C00",
            "DarkGoldenRod": "#B8860B",
            "GoldenRod": "#DAA520",
            "Orange": "#FFA500",
            "Gold": "#FFD700",
            "Yellow": "#FFFF00",
            "LemonChiffon": "#FFFACD",
            "LightGoldenRodYellow": "#FAFAD2",
            "LightYellow": "#FFFFE0",
            "DarkOliveGreen": "#556B2F",
            "DarkSeaGreen": "#8FBC8F",
            "DarkGreen": "#006400",
            "MediumSeaGreen": "#3CB371",
            "DarkKhaki": "#BDB76B",
            "Green": "#008000",
            "Olive": "#808000",
            "OliveDrab": "#6B8E23",
            "ForestGreen": "#228B22",
            "LawnGreen": "#7CFC00",
            "Lime": "#00FF00",
            "YellowGreen": "#9ACD32",
            "LimeGreen": "#32CD32",
            "Chartreuse": "#7FFF00",
            "GreenYellow": "#ADFF2F",
            "LightSeaGreen": "#20B2AA",
            "SeaGreen": "#2E8B57",
            "SandyBrown": "#F4A460",
            "DarkSlateGray": "#2F4F4F",
            "DimGray": "#696969",
            "Gray": "#808080",
            "SlateGray": "#708090",
            "LightSlateGray": "#778899",
            "DarkGray": "#A9A9A9",
            "Silver": "#C0C0C0",
            "Indigo": "#4B0082",
            "Purple": "#800080",
            "DarkMagenta": "#8B008B",
            "BlueViolet": "#8A2BE2",
            "DarkOrchid": "#9932CC",
            "DarkViolet": "#9400D3",
            "DarkSlateBlue": "#483D8B",
            "MediumPurple": "#9370D8",
            "MediumOrchid": "#BA55D3",
            "Fuchsia": "#FF00FF",
            "Magenta": "#FF00FF",
            "Orchid": "#DA70D6",
            "Violet": "#EE82EE",
            "DeepPink": "#FF1493",
            "Pink": "#FFC0CB",
            "MistyRose": "#FFE4E1",
            "LightPink": "#FFB6C1",
            "Plum": "#DDA0DD",
            "HotPink": "#FF69B4",
            "SpringGreen": "#00FF7F",
            "MediumSpringGreen": "#00FA9A",
            "LightGreen": "#90EE90",
            "PaleGreen": "#98FB98",
            "RosyBrown": "#BC8F8F",
            "MediumVioletRed": "#C71585",
            "IndianRed": "#CD5C5C",
            "SaddleBrown": "#8B4513",
            "Peru": "#CD853F",
            "Chocolate": "#D2691E",
            "Tan": "#D2B48C",
            "LightGrey": "#D3D3D3",
            "PaleVioletRed": "#D87093",
            "Thistle": "#D8BFD8",
            "Crimson": "#DC143C",
            "FireBrick": "#B22222",
            "Gainsboro": "#DCDCDC",
            "BurlyWood": "#DEB887",
            "LightCoral": "#F08080",
            "DarkSalmon": "#E9967A",
            "Lavender": "#E6E6FA",
            "LavenderBlush": "#FFF0F5",
            "SeaShell": "#FFF5EE",
            "Linen": "#FAF0E6",
            "Khaki": "#F0E68C",
            "PaleGoldenRod": "#EEE8AA",
            "Wheat": "#F5DEB3",
            "NavajoWhite": "#FFDEAD",
            "Moccasin": "#FFE4B5",
            "PeachPuff": "#FFDAB9",
            "Bisque": "#FFE4C4",
            "BlanchedAlmond": "#FFEBCD",
            "AntiqueWhite": "#FAEBD7",
            "PapayaWhip": "#FFEFD5",
            "Beige": "#F5F5DC",
            "OldLace": "#FDF5E6",
            "Cornsilk": "#FFF8DC",
            "Ivory": "#FFFFF0",
            "FloralWhite": "#FFFAF0",
            "HoneyDew": "#F0FFF0",
            "WhiteSmoke": "#F5F5F5",
            "AliceBlue": "#F0F8FF",
            "LightCyan": "#E0FFFF",
            "GhostWhite": "#F8F8FF",
            "MintCream": "#F5FFFA",
            "Azure": "#F0FFFF",
            "Snow": "#FFFAFA",
            "White": "#FFFFFF"
        },
        getPalette: function () {
            var generated = {};
            var cr = ['00', '44', '77', '99', 'BB', 'EE', 'FF'];
            var i = 0;
            for (var r = 0; r < cr.length; r++) {
                for (var g = 0; g < cr.length; g++) {
                    for (var b = 0; b < cr.length; b++) {
                        generated[(i++) + "_"] = '#' + cr[r] + cr[g] + cr[b];
                    }
                }
            }
            return generated;
        },
        getRGBarray: function (color) {
            if (typeof color == "string") {
                if (color.indexOf("rgb") > -1) {
                    color = color.replace(/rgb\(|\).*?$/g, "").split(/,\s*/, 3);
                } else {
                    color = color.replace("#", "");
                    if (color.length == 3) {
                        color = color.replace(/(.)/g, function (n) {
                            return parseInt(n + n, 16) + ", ";
                        }).replace(/,\s*$/, "").split(/,\s+/);
                    } else {
                        color = color.replace(/(..)/g, function (n) {
                            return parseInt(n, 16) + ", ";
                        }).replace(/,\s*$/, "").split(/,\s+/);
                    }
                }
            }
            for (var x = 0; x < color.length; x++) {
                color[x] = Number(color[x]);
            }
            return color;
        },
        rgbToHex: function () {
            var ret = [];
            var ret2 = [];
            for (var i = 0; i < arguments.length; i++) {
                ret.push((arguments[i] < 16 ? "0" : "") + Math.round(arguments[i]).toString(16));
            }
            return "#" + ret.join('').toUpperCase();
        },
        hexToRgb: function (str) {
            str = str.replace("#", "");
            var ret = [];
            if (str.length == 3) {
                str.replace(/(.)/g, function (str) {
                    ret.push(parseInt(str + str, 16));
                });
            } else {
                str.replace(/(..)/g, function (str) {
                    ret.push(parseInt(str, 16));
                });
            }
            return ret;
        },
        invert: function (hex) {
            var rgb = Protoplus.Colors.hexToRgb(hex);
            return Protoplus.Colors.rgbToHex(255 - rgb[0], 255 - rgb[1], 255 - rgb[2]);
        }
    },
    Profiler: {
        stimes: {},
        start: function (title) {
            Protoplus.Profiler.stimes[title] = (new Date()).getTime();
        },
        end: function (title, ret) {
            var res = (((new Date()).getTime() - Protoplus.Profiler.stimes[title]) / 1000).toFixed(3);
            if (ret) {
                return res;
            }
            msg = title + ' took ' + res;
            if ('console' in window) {
                console.log(msg);
            } else {}
        }
    }
};
Object.extend(Hash.prototype, {
    debug: function (opts) {
        opts = opts ? opts : {};
        node = this._object;
        text = opts.text ? opts.text + "\n" : "";
        for (e in node) {
            if (typeof node[e] == "function" && !opts.showFunctions) {
                continue;
            }
            if (opts.skipBlanks && (node[e] === "" || node[e] === undefined)) {
                continue;
            }
            var stophere = confirm(text + e + " => " + node[e]);
            if (stophere) {
                return node[e];
            }
        }
    }
});
Object.extend(Object, {
    deepClone: function (obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        var clone = Object.isArray(obj) ? [] : {};
        for (var i in obj) {
            var node = obj[i];
            if (typeof node == 'object') {
                if (Object.isArray(node)) {
                    clone[i] = [];
                    for (var j = 0; j < node.length; j++) {
                        if (typeof node[j] != 'object') {
                            clone[i].push(node[j]);
                        } else {
                            clone[i].push(this.deepClone(node[j]));
                        }
                    }
                } else {
                    clone[i] = this.deepClone(node);
                }
            } else {
                clone[i] = node;
            }
        }
        return clone;
    },
    isBoolean: function (bool) {
        return (bool === true || bool === false);
    },
    isRegExp: function (obj) {
        return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
    }
});
Object.extend(String.prototype, {
    cleanJSON: function () {
        return this.replace(/(\"?)(\:|\,)\s+(\"?)/g, '$1$2$3');
    },
    shorten: function (length, closure) {
        length = length ? length : "30";
        closure = closure ? closure : "...";
        var sh = this.substr(0, length);
        sh += (this.length > length) ? closure : "";
        return sh;
    },
    printf: function () {
        var args = arguments;
        var word = this.toString(),
            i = 0;
        return word.replace(/(\%(\w))/gim, function (word, match, tag, count) {
            var s = args[i] !== undefined ? args[i] : '';
            i++;
            switch (tag) {
            case "f":
                return parseFloat(s).toFixed(2);
            case "d":
                return parseInt(s, 10);
            case "x":
                return s.toString(16);
            case "X":
                return s.toString(16).toUpperCase();
            case "s":
                return s;
            default:
                return match;
            }
        });
    },
    sanitize: function () {
        var str = this;
        return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    },
    nl2br: function (is_xhtml) {
        var str = this;
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '');
    },
    stripslashes: function () {
        var str = this;
        return (str + '').replace(/\\(.?)/g, function (s, n1) {
            switch (n1) {
            case '\\':
                return '\\';
            case '0':
                return '\u0000';
            case '':
                return '';
            default:
                return n1;
            }
        });
    },
    turkishToUpper: function () {
        var string = this;
        var letters = {
            "i": "İ",
            "ş": "Ş",
            "ğ": "Ğ",
            "ü": "Ü",
            "ö": "Ö",
            "ç": "Ç",
            "ı": "I"
        };
        string = string.replace(/([iışğüçö])+/g, function (letter) {
            return letters[letter];
        });
        return string.toUpperCase();
    },
    turkishToLower: function () {
        var string = this;
        var letters = {
            "İ": "i",
            "I": "ı",
            "Ş": "ş",
            "Ğ": "ğ",
            "Ü": "ü",
            "Ö": "ö",
            "Ç": "ç"
        };
        string = string.replace(/([İIŞĞÜÇÖ])+/g, function (letter) {
            return letters[letter];
        });
        return string.toLowerCase();
    },
    toCamelCase: function () {
        var str = this;
        newStr = str.replace(/\s+/g, '_');
        strArr = newStr.split('_');
        if (strArr.length === 0) {
            return newStr;
        }
        newStr = "";
        for (var i = 0; i < strArr.length; i++) {
            newStr += strArr[i][0].toUpperCase();
            newStr += strArr[i].substr(1);
        }
        return newStr;
    },
    fixUTF: function () {
        var lowerCase = {
            "a": "00E1:0103:01CE:00E2:00E4:0227:1EA1:0201:00E0:1EA3:0203:0101:0105:1D8F:1E9A:00E5:1E01:2C65:00E3:0251:1D90",
            "b": "1E03:1E05:0253:1E07:1D6C:1D80:0180:0183",
            "c": "0107:010D:00E7:0109:0255:010B:0188:023C",
            "d": "010F:1E11:1E13:0221:1E0B:1E0D:0257:1E0F:1D6D:1D81:0111:0256:018C",
            "e": "00E9:0115:011B:0229:00EA:1E19:00EB:0117:1EB9:0205:00E8:1EBB:0207:0113:2C78:0119:1D92:0247:1EBD:1E1B",
            "f": "1E1F:0192:1D6E:1D82",
            "g": "01F5:011F:01E7:0123:011D:0121:0260:1E21:1D83:01E5",
            "h": "1E2B:021F:1E29:0125:2C68:1E27:1E23:1E25:0266:1E96:0127",
            "i": "0131:00ED:012D:01D0:00EE:00EF:1ECB:0209:00EC:1EC9:020B:012B:012F:1D96:0268:0129:1E2D",
            "j": "01F0:0135:029D:0249",
            "k": "1E31:01E9:0137:2C6A:A743:1E33:0199:1E35:1D84:A741",
            "l": "013A:019A:026C:013E:013C:1E3D:0234:1E37:2C61:A749:1E3B:0140:026B:1D85:026D:0142:0269:1D7C",
            "m": "1E3F:1E41:1E43:0271:1D6F:1D86",
            "n": "0144:0148:0146:1E4B:0235:1E45:1E47:01F9:0272:1E49:019E:1D70:1D87:0273:00F1",
            "o": "00F3:014F:01D2:00F4:00F6:022F:1ECD:0151:020D:00F2:1ECF:01A1:020F:A74B:A74D:2C7A:014D:01EB:00F8:00F5",
            "p": "1E55:1E57:A753:01A5:1D71:1D88:A755:1D7D:A751",
            "q": "A759:02A0:024B:A757",
            "r": "0155:0159:0157:1E59:1E5B:0211:027E:0213:1E5F:027C:1D72:1D89:024D:027D",
            "s": "015B:0161:015F:015D:0219:1E61:1E63:0282:1D74:1D8A:023F",
            "t": "0165:0163:1E71:021B:0236:1E97:2C66:1E6B:1E6D:01AD:1E6F:1D75:01AB:0288:0167",
            "u": "00FA:016D:01D4:00FB:1E77:00FC:1E73:1EE5:0171:0215:00F9:1EE7:01B0:0217:016B:0173:1D99:016F:0169:1E75:1D1C:1D7E",
            "v": "2C74:A75F:1E7F:028B:1D8C:2C71:1E7D",
            "w": "1E83:0175:1E85:1E87:1E89:1E81:2C73:1E98",
            "x": "1E8D:1E8B:1D8D",
            "y": "00FD:0177:00FF:1E8F:1EF5:1EF3:01B4:1EF7:1EFF:0233:1E99:024F:1EF9",
            "z": "017A:017E:1E91:0291:2C6C:017C:1E93:0225:1E95:1D76:1D8E:0290:01B6:0240",
            "ae": "00E6:01FD:01E3",
            "dz": "01F3:01C6",
            "3": "0292:01EF:0293:1D9A:01BA:01B7:01EE"
        };
        var upperCase = {
            "A": "00C1:0102:01CD:00C2:00C4:0226:1EA0:0200:00C0:1EA2:0202:0100:0104:00C5:1E00:023A:00C3",
            "B": "1E02:1E04:0181:1E06:0243:0182",
            "C": "0106:010C:00C7:0108:010A:0187:023B",
            "D": "010E:1E10:1E12:1E0A:1E0C:018A:1E0E:0110:018B",
            "E": "00C9:0114:011A:0228:00CA:1E18:00CB:0116:1EB8:0204:00C8:1EBA:0206:0112:0118:0246:1EBC:1E1A",
            "F": "1E1E:0191",
            "G": "01F4:011E:01E6:0122:011C:0120:0193:1E20:01E4:0262:029B",
            "H": "1E2A:021E:1E28:0124:2C67:1E26:1E22:1E24:0126",
            "I": "00CD:012C:01CF:00CE:00CF:0130:1ECA:0208:00CC:1EC8:020A:012A:012E:0197:0128:1E2C:026A:1D7B",
            "J": "0134:0248",
            "K": "1E30:01E8:0136:2C69:A742:1E32:0198:1E34:A740",
            "L": "0139:023D:013D:013B:1E3C:1E36:2C60:A748:1E3A:013F:2C62:0141:029F:1D0C",
            "M": "1E3E:1E40:1E42:2C6E",
            "N": "0143:0147:0145:1E4A:1E44:1E46:01F8:019D:1E48:0220:00D1",
            "O": "00D3:014E:01D1:00D4:00D6:022E:1ECC:0150:020C:00D2:1ECE:01A0:020E:A74A:A74C:014C:019F:01EA:00D8:00D5",
            "P": "1E54:1E56:A752:01A4:A754:2C63:A750",
            "Q": "A758:A756",
            "R": "0154:0158:0156:1E58:1E5A:0210:0212:1E5E:024C:2C64",
            "S": "015A:0160:015E:015C:0218:1E60:1E62",
            "T": "0164:0162:1E70:021A:023E:1E6A:1E6C:01AC:1E6E:01AE:0166",
            "U": "00DA:016C:01D3:00DB:1E76:00DC:1E72:1EE4:0170:0214:00D9:1EE6:01AF:0216:016A:0172:016E:0168:1E74",
            "V": "A75E:1E7E:01B2:1E7C",
            "W": "1E82:0174:1E84:1E86:1E88:1E80:2C72",
            "X": "1E8C:1E8A",
            "Y": "00DD:0176:0178:1E8E:1EF4:1EF2:01B3:1EF6:1EFE:0232:024E:1EF8",
            "Z": "0179:017D:1E90:2C6B:017B:1E92:0224:1E94:01B5",
            "AE": "00C6:01FC:01E2",
            "DZ": "01F1:01C4"
        };
        var str = this.toString();
        for (var lk in lowerCase) {
            var lvalue = '\\u' + lowerCase[lk].split(':').join('|\\u');
            str = str.replace(new RegExp(lvalue, 'gm'), lk);
        }
        for (var uk in upperCase) {
            var uvalue = '\\u' + upperCase[uk].split(':').join('|\\u');
            str = str.replace(new RegExp(uvalue, 'gm'), uk);
        }
        return str;
    },
    ucFirst: function () {
        return this.charAt(0).toUpperCase() + this.substr(1, this.length + 1);
    }
});
var __result = document.URL.toQueryParams();
Object.extend(document, {
    createCSS: function (selector, declaration) {
        var id = "style-" + selector.replace(/\W/gim, '');
        if ($(id)) {
            $(id).remove();
        }
        var ua = navigator.userAgent.toLowerCase();
        var isIE = (/msie/.test(ua)) && !(/opera/.test(ua)) && (/win/.test(ua));
        var style_node = document.createElement("style");
        style_node.id = id;
        style_node.setAttribute("type", "text/css");
        style_node.setAttribute("media", "screen");
        if (!isIE) {
            style_node.appendChild(document.createTextNode(selector + " {" + declaration + "}"));
        }
        document.getElementsByTagName("head")[0].appendChild(style_node);
        if (isIE && document.styleSheets && document.styleSheets.length > 0) {
            var last_style_node = document.styleSheets[document.styleSheets.length - 1];
            if (typeof(last_style_node.addRule) == "object") {
                last_style_node.addRule(selector, declaration);
            }
        }
    },
    selectRadioOption: function (options, value) {
        options.each(function (ele) {
            if (ele.value === value) {
                ele.checked = true;
            }
        });
    },
    readRadioOption: function (options) {
        for (var i = 0; i < options.length; i++) {
            var ele = options[i];
            if (ele.checked === true) {
                return ele.value;
            }
        }
        return false;
    },
    getEvent: function (ev) {
        if (!ev) {
            ev = window.event;
        }
        if (!ev.keyCode && ev.keyCode !== 0) {
            ev.keyCode = ev.which;
        }
        return ev;
    },
    parameters: __result,
    get: __result,
    ready: function (func) {
        document.observe("dom:loaded", func);
    },
    getUnderneathElement: function (e) {
        var pointX = (Prototype.Browser.WebKit) ? Event.pointerX(e) : e.clientX;
        var pointY = (Prototype.Browser.WebKit) ? Event.pointerY(e) : e.clientY;
        return document.elementFromPoint(pointX, pointY);
    },
    createCookie: function (name, value, days, path) {
        path = path ? path : "/";
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = ";expires=" + date.toGMTString();
        }
        document.cookie = name + "=" + escape(value) + expires + ";path=" + path;
    },
    readCookie: function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    },
    eraseCookie: function (name) {
        document.createCookie(name, "", -1);
    },
    storeJsonCookie: function (name, value, days) {
        var val = Object.toJSON(value).cleanJSON();
        document.createCookie(name, val, days);
    },
    readJsonCookie: function (name) {
        if (document.readCookie(name)) {
            return document.readCookie(name).toString().evalJSON();
        } else {
            return {};
        }
    },
    getClientDimensions: function () {
        var head = document.body.parentNode;
        return {
            height: head.scrollHeight,
            width: head.scrollWidth
        };
    },
    keyboardMap: function (map) {
        document.keyMap = map;
        var shortcut = {
            'all_shortcuts': {},
            'add': function (shortcut_combination, callback, opt) {
                var default_options = {
                    'type': 'keydown',
                    'propagate': false,
                    'disable_in_input': false,
                    'target': document,
                    'keycode': false
                };
                if (!opt) {
                    opt = default_options;
                } else {
                    for (var dfo in default_options) {
                        if (typeof opt[dfo] == 'undefined') {
                            opt[dfo] = default_options[dfo];
                        }
                    }
                }
                var ele = opt.target;
                if (typeof opt.target == 'string') {
                    ele = document.getElementById(opt.target);
                }
                var ths = this;
                shortcut_combination = shortcut_combination.toLowerCase();
                var func = function (e) {
                    e = e || window.event;
                    if (opt.disable_in_input) {
                        var element;
                        if (e.target) {
                            element = e.target;
                        } else if (e.srcElement) {
                            element = e.srcElement;
                        }
                        if (element.nodeType == 3) {
                            element = element.parentNode;
                        }
                        if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA' || document._onedit) {
                            return;
                        }
                    }
                    if (e.keyCode) {
                        code = e.keyCode;
                    } else if (e.which) {
                        code = e.which;
                    }
                    var character = String.fromCharCode(code).toLowerCase();
                    if (code == 188) {
                        character = ",";
                    }
                    if (code == 190) {
                        character = ".";
                    }
                    var keys = shortcut_combination.split("+");
                    var kp = 0;
                    var shift_nums = {
                        "`": "~",
                        "1": "!",
                        "2": "@",
                        "3": "#",
                        "4": "$",
                        "5": "%",
                        "6": "^",
                        "7": "&",
                        "8": "*",
                        "9": "(",
                        "0": ")",
                        "-": "_",
                        "=": "+",
                        ";": ":",
                        "'": "\"",
                        ",": "<",
                        ".": ">",
                        "/": "?",
                        "\\": "|"
                    };
                    var special_keys = {
                        'esc': 27,
                        'escape': 27,
                        'tab': 9,
                        'space': 32,
                        'return': 13,
                        'enter': 13,
                        'backspace': 8,
                        'scrolllock': 145,
                        'scroll_lock': 145,
                        'scroll': 145,
                        'capslock': 20,
                        'caps_lock': 20,
                        'caps': 20,
                        'numlock': 144,
                        'num_lock': 144,
                        'num': 144,
                        'pause': 19,
                        'break': 19,
                        'insert': 45,
                        'home': 36,
                        'delete': 46,
                        'end': 35,
                        'pageup': 33,
                        'page_up': 33,
                        'pu': 33,
                        'pagedown': 34,
                        'page_down': 34,
                        'pd': 34,
                        'left': 37,
                        'up': 38,
                        'right': 39,
                        'down': 40,
                        'f1': 112,
                        'f2': 113,
                        'f3': 114,
                        'f4': 115,
                        'f5': 116,
                        'f6': 117,
                        'f7': 118,
                        'f8': 119,
                        'f9': 120,
                        'f10': 121,
                        'f11': 122,
                        'f12': 123
                    };
                    var modifiers = {
                        shift: {
                            wanted: false,
                            pressed: false
                        },
                        ctrl: {
                            wanted: false,
                            pressed: false
                        },
                        alt: {
                            wanted: false,
                            pressed: false
                        },
                        meta: {
                            wanted: false,
                            pressed: false
                        }
                    };
                    if (e.ctrlKey) {
                        modifiers.ctrl.pressed = true;
                    }
                    if (e.shiftKey) {
                        modifiers.shift.pressed = true;
                    }
                    if (e.altKey) {
                        modifiers.alt.pressed = true;
                    }
                    if (e.metaKey) {
                        modifiers.meta.pressed = true;
                    }
                    for (var i = 0; i < keys.length; i++) {
                        k = keys[i];
                        if (k == 'ctrl' || k == 'control') {
                            kp++;
                            modifiers.ctrl.wanted = true;
                        } else if (k == 'shift') {
                            kp++;
                            modifiers.shift.wanted = true;
                        } else if (k == 'alt') {
                            kp++;
                            modifiers.alt.wanted = true;
                        } else if (k == 'meta') {
                            kp++;
                            modifiers.meta.wanted = true;
                        } else if (k.length > 1) {
                            if (special_keys[k] == code) {
                                kp++;
                            }
                        } else if (opt.keycode) {
                            if (opt.keycode == code) {
                                kp++;
                            }
                        } else {
                            if (character == k) {
                                kp++;
                            } else {
                                if (shift_nums[character] && e.shiftKey) {
                                    character = shift_nums[character];
                                    if (character == k) {
                                        kp++;
                                    }
                                }
                            }
                        }
                    }
                    if (kp == keys.length && modifiers.ctrl.pressed == modifiers.ctrl.wanted && modifiers.shift.pressed == modifiers.shift.wanted && modifiers.alt.pressed == modifiers.alt.wanted && modifiers.meta.pressed == modifiers.meta.wanted) {
                        callback(e);
                        if (!opt.propagate) {
                            e.cancelBubble = true;
                            e.returnValue = false;
                            if (e.stopPropagation) {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                            return false;
                        }
                    }
                };
                this.all_shortcuts[shortcut_combination] = {
                    'callback': func,
                    'target': ele,
                    'event': opt.type
                };
                if (ele.addEventListener) {
                    ele.addEventListener(opt.type, func, false);
                } else if (ele.attachEvent) {
                    ele.attachEvent('on' + opt.type, func);
                } else {
                    ele['on' + opt.type] = func;
                }
            },
            'remove': function (shortcut_combination) {
                shortcut_combination = shortcut_combination.toLowerCase();
                var binding = this.all_shortcuts[shortcut_combination];
                delete(this.all_shortcuts[shortcut_combination]);
                if (!binding) {
                    return;
                }
                var type = binding.event;
                var ele = binding.target;
                var callback = binding.callback;
                if (ele.detachEvent) {
                    ele.detachEvent('on' + type, callback);
                } else if (ele.removeEventListener) {
                    ele.removeEventListener(type, callback, false);
                } else {
                    ele['on' + type] = false;
                }
            }
        };
        $H(map).each(function (pair) {
            var key = pair.key;
            var opts = pair.value;
            shortcut.add(key, opts.handler, {
                disable_in_input: opts.disableOnInputs
            });
        });
    },
    checkDocType: function () {
        if (document.doctype === null) return false;
        var publicId = document.doctype.publicId.toLowerCase();
        return (publicId.indexOf("html 4") > 0) || (publicId.indexOf("xhtml") > 0);
    }
});
Object.extend(Event, {
    mousewheel: Prototype.Browser.Gecko ? 'DOMMouseScroll' : 'mousewheel',
    wheel: function (event) {
        var delta = 0;
        if (!event) {
            event = window.event;
        }
        if (event.wheelDelta) {
            delta = event.wheelDelta / 120;
            if (window.opera) {
                delta = -delta;
            }
        } else if (event.detail) {
            delta = -event.detail / 3;
        }
        return Math.round(delta);
    },
    isRightClick: function (event) {
        var _isButton;
        if (Prototype.Browser.IE) {
            var buttonMap = {
                0: 1,
                1: 4,
                2: 2
            };
            _isButton = function (event, code) {
                return event.button === buttonMap[code];
            };
        } else if (Prototype.Browser.WebKit) {
            _isButton = function (event, code) {
                switch (code) {
                case 0:
                    return event.which == 1 && !event.metaKey;
                case 1:
                    return event.which == 1 && event.metaKey;
                case 2:
                    return event.which == 3 && !event.metaKey;
                default:
                    return false;
                }
            };
        } else {
            _isButton = function (event, code) {
                return event.which ? (event.which === code + 1) : (event.button === code);
            };
        }
        return _isButton(event, 2);
    }
});
Protoplus.utils = {
    cloneElem: function (element) {
        if (Prototype.Browser.IE) {
            var div = document.createElement('div');
            div.innerHTML = element.outerHTML;
            return $(div.firstChild);
        }
        return element.cloneNode(true);
    },
    openInNewTab: function (element, link) {
        element.observe('mouseover', function (e) {
            if (!element.tabLink) {
                var a = new Element('a', {
                    href: link,
                    target: '_blank'
                }).insert('&nbsp;&nbsp;');
                a.setStyle('opacity:0; z-index:100000; height:5px; width:5px; position:absolute; top:' + (Event.pointerY(e) - 2.5) + 'px;left:' + (Event.pointerX(e) - 2.5) + 'px');
                a.observe('click', function () {
                    element.tabLinked = false;
                    a.remove();
                });
                $(document.body).insert(a);
                element.tabLink = a;
                element.observe('mousemove', function (e) {
                    element.tabLink.setStyle('top:' + (Event.pointerY(e) - 2.5) + 'px;left:' + (Event.pointerX(e) - 2.5) + 'px');
                });
            }
        });
        return element;
    },
    hasFixedContainer: function (element) {
        var result = false;
        element.ancestors().each(function (el) {
            if (result) {
                return;
            }
            if (el.style.position == "fixed") {
                result = true;
            }
        });
        return result;
    },
    getCurrentStyle: function (element, name) {
        if (element.style[name]) {
            return element.style[name];
        } else if (element.currentStyle) {
            return element.currentStyle[name];
        } else if (document.defaultView && document.defaultView.getComputedStyle) {
            name = name.replace(/([A-Z])/g, "-$1");
            name = name.toLowerCase();
            s = document.defaultView.getComputedStyle(element, "");
            return s && s.getPropertyValue(name);
        } else {
            return null;
        }
    },
    isOverflow: function (element) {
		
        if (element.resized) {
            element.hideHandlers();
        }

var curOverflow = element.style.overflow;
if (!curOverflow || curOverflow === "visible") {
    element.style.overflow = "hidden";
}
var leftOverflowing = element.clientWidth < element.scrollWidth;

var topOverflowing = element.clientHeight < element.scrollHeight;
var isOverflowing = leftOverflowing || topOverflowing;
element.style.overflow = curOverflow;
if (element.resized) {
    element.showHandlers();
}
return isOverflowing ? {
    top: topOverflowing ? element.scrollHeight : false,
    left: leftOverflowing ? element.scrollWidth : false,
    both: leftOverflowing && topOverflowing
} : false;
}, setUnselectable: function (target) {
    if (typeof target.onselectstart != "undefined") {
        target.onselectstart = function () {
            return false;
        };
    } else if (typeof target.style.MozUserSelect != "undefined") {
        target.style.MozUserSelect = "none";
    } else {
        target.onmousedown = function () {
            return false;
        };
    }
    target.__oldCursor = target.style.cursor;
    target.style.cursor = 'default';
    return target;
},
setSelectable: function (target) {
    if (typeof target.onselectstart != "undefined") {
        target.onselectstart = document.createElement("div").onselectstart;
    } else if (typeof target.style.MozUserSelect != "undefined") {
        target.style.MozUserSelect = document.createElement("div").style.MozUserSelect;
    } else {
        target.onmousedown = "";
    }
    if (target.__oldCursor) {
        target.style.cursor = target.__oldCursor;
    } else {
        target.style.cursor = '';
    }
    return target;
},
selectText: function (element) {
    var r1 = "";
    if (document.selection) {
        r1 = document.body.createTextRange();
        r1.moveToElementText(element);
        r1.setEndPoint("EndToEnd", r1);
        r1.moveStart('character', 4);
        r1.moveEnd('character', 8);
        r1.select();
    } else {
        s = window.getSelection();
        r1 = document.createRange();
        r1.setStartBefore(element);
        r1.setEndAfter(element);
        s.addRange(r1);
    }
    return element;
},
hover: function (elem, over, out) {
    $(elem).observe("mouseover", function (evt) {
        if (typeof over == "function") {
            if (elem.innerHTML) {
                if (elem.descendants().include(evt.relatedTarget)) {
                    return true;
                }
            }
            over(elem, evt);
        } else if (typeof over == "string") {
            $(elem).addClassName(over);
        }
    });
    $(elem).observe("mouseout", function (evt) {
        if (typeof out == "function") {
            if (elem.innerHTML) {
                if (elem.descendants().include(evt.relatedTarget)) {
                    return true;
                }
            }
            out(elem, evt);
        } else if (typeof over == "string") {
            $(elem).removeClassName(over);
        }
    });
    return elem;
},
mouseEnter: function (elem, over, out) {
    $(elem).observe("mouseenter", function (evt) {
        if (typeof over == "function") {
            over(elem, evt);
        } else if (typeof over == "string") {
            $(elem).addClassName(over);
        }
    });
    $(elem).observe("mouseleave", function (evt) {
        if (typeof out == "function") {
            out(elem, evt);
        } else if (typeof over == "string") {
            $(elem).removeClassName(over);
        }
    });
    return elem;
},
setScroll: function (element, amounts) {
    if (amounts.x !== undefined) {
        element.scrollLeft = amounts.x;
    }
    if (amounts.y !== undefined) {
        element.scrollTop = amounts.y;
    }
},
scrollInto: function (element, options) {
    options = Object.extend({
        offset: [100, 100],
        direction: 'bottom'
    }, options || {});
    element = $(element);
    var pos = Element.cumulativeOffset(element);
    var vp = document.viewport.getDimensions();
    var ed = Element.getDimensions(element);
    switch (options.direction) {
    case 'bottom':
        if (pos[1] + options.offset[1] >= vp.height + window.scrollY) {
            window.scrollTo(window.scrollX, (pos[1] + options.offset[1]) - vp.height);
        } else if (window.scrollY !== 0 && (pos[1] + options.offset[1] <= Math.abs(vp.height - window.scrollY))) {
            window.scrollTo(window.scrollX, (pos[1] + options.offset[1]) - vp.height);
        }
        break;
    case "top":
        var height = element.getHeight();
        if (window.scrollY !== 0 && pos[1] <= window.scrollY + options.offset[1]) {
            window.scrollTo(window.scrollX, pos[1] - options.offset[1]);
        } else if (window.scrollY !== 0 && (pos[1] + options.offset[1] <= Math.abs(vp.height - window.scrollY))) {
            window.scrollTo(window.scrollX, pos[1] - options.offset[1]);
        }
        break;
    }
    return element;
},
getScroll: function (element) {
    return {
        x: parseFloat(element.scrollLeft),
        y: parseFloat(element.scrollTop)
    };
},
setText: function (element, value) {
    element.innerHTML = value;
    return element;
},
putValue: function (element, value) {
    if (element.clearHint) {
        element.clearHint();
    }
    element.value = value;
    return element;
},
resetUpload: function (element) {
    if (Prototype.Browser.IE) {
        var p = element.parentNode;
        var c = element.cloneNode(true);
        p.replaceChild(c, element);
        return c;
    }
    element.value = '';
    return element;
},
run: function (element, event) {
    var evt;
    if (document.createEventObject) {
        evt = document.createEventObject();
        element.fireEvent('on' + event, evt);
    } else {
        evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true);
        element.dispatchEvent(evt);
    }
    return element;
},
setCSSBorderRadius: function (element, value) {
    return element.setStyle({
        MozBorderRadius: value,
        borderRadius: value,
        '-webkit-border-radius': value
    });
},
getSelected: function (element) {
    if (!element.options) {
        if (element.innerHTML) {
            return element.innerHTML;
        } else {
            return element.value;
        }
    }
    var selected = element.selectedIndex >= 0 ? element.options[element.selectedIndex] : element;
    return selected;
},
selectOption: function (element, val) {
    if (!val) {
        return element;
    }
    $A(element.options).each(function (option) {
        if (Object.isRegExp(val) && (val.test(option.value) || val.test(option.text))) {
            option.selected = true;
            throw $break;
        }
        if (val == option.value || val == option.text) {
            option.selected = true;
        }
    });
    element.run('change');
    return element;
},
stopAnimation: function (element) {
    element.__stopAnimation = true;
    return element;
},
shift: function (element, options) {
    options = Object.extend({
        duration: 1,
        onEnd: Prototype.K,
        onStart: Prototype.K,
        onStep: Prototype.K,
        delay: 0,
        link: 'cancel',
        remove: false,
        easingCustom: false,
        propertyEasings: {},
        easing: Protoplus.Transitions.sineOut
    }, options || {});
    if (!element.queue) {
        element.queue = [];
    }
    if (options.link == "ignore" && element.timer) {
        return element;
    } else if ((options.link == "chain" || options.link == "queue") && element.timer) {
        element.queue.push(options);
        return element;
    }
    if (element.timer) {
        clearInterval(element.timer);
    }
    if (element.delayTime) {
        clearTimeout(element.delayTime);
    }
    if (typeof options.easing == 'string') {
        if (options.easing in Protoplus.Transitions) {
            options.easing = Protoplus.Transitions[options.easing];
        } else {
            options.easing = Protoplus.Transitions.sineOut;
        }
    } else if (typeof options.easing == 'object') {
        options.propertyEasings = options.easing;
        options.easing = Protoplus.Transitions.sineOut;
    } else if (typeof options.easing != 'function') {
        options.easing = Protoplus.Transitions.sineOut;
    }
    options.duration *= 1000;
    options.delay *= 1000;
    element.timer = false;
    var properties = {},
        begin, end, init = function () {
            begin = new Date().getTime();
            end = begin + options.duration;
            options.onStart && options.onStart(element);
        };
    for (var x in options) {
        if (!["duration", "onStart", "onStep", "onEnd", "remove", "easing", "link", "delay", "easingCustom", "propertyEasings"].include(x) && options[x] !== false) {
            properties[x] = options[x];
        }
    }
    var unitRex = /\d+([a-zA-Z%]+)$/;
    for (var i in properties) {
        var okey = i,
            oval = properties[i];
        var to, from, key, unit, s = [],
            easing = options.easing;
        if (["scrollX", "scrollLeft", "scrollY", "scrollTop"].include(okey)) {
            to = parseFloat(oval);
            key = (okey == "scrollX") ? "scrollLeft" : (okey == "scrollY") ? "scrollTop" : okey;
            if (element.tagName == "BODY") {
                from = (okey == "scrollX" || okey == "scrollLeft") ? window.scrollX : window.scrollY;
            } else {
                from = (okey == "scrollX" || okey == "scrollLeft") ? element.scrollLeft : element.scrollTop;
            }
            unit = '';
        } else if (okey == "rotate") {
            to = parseFloat(oval);
            key = "-webkit-transform";
            from = Element.getStyle(element, '-webkit-transform') ? parseInt(Element.getStyle(element, '-webkit-transform').replace(/rotate\(|\)/gim, ""), 10) : 0;
            unit = 'deg';
        } else if (["background", "color", "borderColor", "backgroundColor"].include(okey)) {
            to = Protoplus.Colors.hexToRgb(oval);
            key = okey == "background" ? "backgroundColor" : okey;
            var bgcolor = Element.getStyle(element, key);
            if (!bgcolor || bgcolor == 'transparent') {
                bgcolor = 'rgb(255,255,255)';
            }
            from = Protoplus.Colors.getRGBarray(bgcolor);
            unit = '';
        } else if (okey == "opacity") {
            to = (typeof oval == "string") ? parseInt(oval, 10) : oval;
            key = okey;
            from = Element.getStyle(element, okey);
            unit = '';
            from = parseFloat(from);
        } else {
            to = (typeof oval == "string") ? parseInt(oval, 10) : oval;
            key = okey;
            from = Element.getStyle(element, okey.replace("-webkit-", "").replace("-moz-", "")) || "0px";
            unit = okey == 'opacity' ? '' : (unitRex.test(from)) ? from.match(unitRex)[1] : 'px';
            from = parseFloat(from);
        }
        if (okey in options.propertyEasings) {
            easing = Protoplus.Transitions[options.propertyEasings[okey]];
        }
        if (!to && to !== 0) {
            try {
                s[key] = oval;
                element.style[key] = oval;
            } catch (e) {}
        } else {
            properties[okey] = {
                key: key,
                to: to,
                from: from,
                unit: unit,
                easing: easing
            };
        }
    }
    var fn = function (ease, option, arr) {
        var val = 0;
        if (arr !== false) {
            return Math.round(option.from[arr] + ease * (option.to[arr] - option.from[arr]));
        }
        return (option.from + ease * (option.to - option.from));
    };
    element.__stopAnimation = false;
    var step = function () {
        var time = new Date().getTime(),
            okey, oval, rgb;
        if (element.__stopAnimation === true) {
            clearInterval(element.timer);
            element.timer = false;
            element.__stopAnimation = false;
            return;
        }
        if (time >= end) {
            clearInterval(element.timer);
            element.timer = false;
            var valTo = (options.easing == "pulse" || options.easing == Protoplus.Transitions.pulse) ? "from" : "to";
            for (okey in properties) {
                oval = properties[okey];
                if (["scrollX", "scrollLeft", "scrollY", "scrollTop"].include(okey)) {
                    if (element.tagName.toUpperCase() == "BODY") {
                        if (oval.key == "scrollLeft") {
                            window.scrollTo(oval[valTo], window.scrollY);
                        } else {
                            window.scrollTo(window.scrollX, oval[valTo]);
                        }
                    } else {
                        element[oval.key] = oval[valTo] + oval.unit;
                    }
                } else if (["background", "color", "borderColor", "backgroundColor"].include(okey)) {
                    element.style[oval.key] = 'rgb(' + oval[valTo].join(', ') + ")";
                } else if (okey == "opacity") {
                    Element.setOpacity(element, oval[valTo]);
                } else if (okey == "rotate") {
                    element.style[okey] = "rotate(" + oval[valTo] + oval.unit + ")";
                } else {
                    element.style[okey] = oval[valTo] + oval.unit;
                }
            }
            options.onEnd && options.onEnd(element);
            if (options.remove) {
                element.remove();
            }
            if (element.queue.length > 0) {
                var que = element.queue.splice(0, 1);
                element.shift(que[0]);
            }
            return element;
        }
        options.onStep && options.onStep(element);
        for (okey in properties) {
            oval = properties[okey];
            if (oval.key == "scrollLeft" || oval.key == "scrollTop") {
                if (element.tagName.toUpperCase() == "BODY") {
                    var scroll = parseInt(fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false), 10) + oval.unit;
                    if (oval.key == "scrollLeft") {
                        window.scrollTo(scroll, window.scrollY);
                    } else {
                        window.scrollTo(window.scrollX, scroll);
                    }
                } else {
                    element[oval.key] = parseInt(fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false), 10) + oval.unit;
                }
            } else if (okey == "background" || okey == "color" || okey == "borderColor" || okey == "backgroundColor") {
                rgb = [];
                for (var x = 0; x < 3; x++) {
                    rgb[x] = fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, x);
                }
                element.style[oval.key] = 'rgb(' + rgb.join(', ') + ')';
            } else if (okey == "opacity") {
                Element.setOpacity(element, fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false));
            } else if (okey == "rotate") {
                element.style[oval.key] = "rotate(" + fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false) + oval.unit + ")";
            } else {
                element.style[okey] = fn(oval.easing((time - begin) / options.duration, options.easingCustom), oval, false) + oval.unit;
            }
        }
    };
    if (options.delay) {
        element.delayTime = setTimeout(function () {
            init();
            element.timer = setInterval(step, 10);
        }, options.delay);
    } else {
        init();
        element.timer = setInterval(step, 10);
    }
    return element;
},
fade: function (element, options) {
    options = Object.extend({
        duration: 0.5,
        onEnd: function (e) {
            e.setStyle({
                display: "none"
            });
        },
        onStart: Prototype.K,
        opacity: 0
    }, options || {});
    element.shift(options);
},
appear: function (element, options) {
    options = Object.extend({
        duration: 0.5,
        onEnd: Prototype.K,
        onStart: Prototype.K,
        opacity: 1
    }, options || {});
    element.setStyle({
        opacity: 0,
        display: "block"
    });
    element.shift(options);
},
disable: function (element) {
    element = $(element);
    element.disabled = true;
    return element;
},
enable: function (element) {
    element = $(element);
    element.disabled = false;
    return element;
},
setReference: function (element, name, reference) {
    if (!element.REFID) {
        element.REFID = Protoplus.REFIDCOUNT++;
    }
    if (!Protoplus.references[element.REFID]) {
        Protoplus.references[element.REFID] = {};
    }
    Protoplus.references[element.REFID][name] = $(reference);
    return element;
},
getReference: function (element, name) {
    if (!element.REFID) {
        return false;
    }
    return Protoplus.references[element.REFID][name];
},
remove: function (element) {
    if (element.REFID) {
        delete Protoplus.references[element.REFID];
    }
    if (element.parentNode) {
        element.parentNode.removeChild(element);
    }
    return element;
}
};
(function (emile, container) {
    var parseEl = document.createElement('div'),
        props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth ' + 'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize ' + 'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight ' + 'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft ' + 'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');

    function interpolate(source, target, pos) {
        return (source + (target - source) * pos).toFixed(3);
    }

    function s(str, p, c) {
        return str.substr(p, c || 1);
    }

    function color(source, target, pos) {
        var i = 2,
            j, c, tmp, v = [],
            r = [];
        while (j = 3, c = arguments[i - 1], i--)
        if (s(c, 0) == 'r') {
            c = c.match(/\d+/g);
            while (j--) v.push(~~c[j]);
        } else {
            if (c.length == 4) c = '#' + s(c, 1) + s(c, 1) + s(c, 2) + s(c, 2) + s(c, 3) + s(c, 3);
            while (j--) v.push(parseInt(s(c, 1 + j * 2, 2), 16));
        }
        while (j--) {
            tmp = ~~ (v[j + 3] + (v[j] - v[j + 3]) * pos);
            r.push(tmp < 0 ? 0 : tmp > 255 ? 255 : tmp);
        }
        return 'rgb(' + r.join(',') + ')';
    }

    function parse(prop) {
        var p = parseFloat(prop),
            q = prop.replace(/^[\-\d\.]+/, '');
        return isNaN(p) ? {
            v: q,
            f: color,
            u: ''
        } : {
            v: p,
            f: interpolate,
            u: q
        };
    }

    function normalize(style) {
        var css, rules = {},
            i = props.length,
            v;
        parseEl.innerHTML = '<div style="' + style + '"></div>';
        css = parseEl.childNodes[0].style;
        while (i--) if (v = css[props[i]]) rules[props[i]] = parse(v);
        return rules;
    }
    container[emile] = function (el, style, opts) {
        el = typeof el == 'string' ? document.getElementById(el) : el;
        opts = opts || {};
        var target = normalize(style),
            comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
            prop, current = {},
            start = +new Date,
            dur = opts.duration || 200,
            finish = start + dur,
            interval, easing = opts.easing ||
            function (pos) {
                return (-Math.cos(pos * Math.PI) / 2) + 0.5;
            };
        for (prop in target) current[prop] = parse(comp[prop]);
        interval = setInterval(function () {
            var time = +new Date,
                pos = time > finish ? 1 : (time - start) / dur;
            for (prop in target)
            el.style[prop] = target[prop].f(current[prop].v, target[prop].v, easing(pos)) + target[prop].u;
            if (time > finish) {
                clearInterval(interval);
                opts.after && opts.after();
            }
        }, 10);
    }
})('emile', Protoplus.utils);Element.addMethods(Protoplus.utils);Event.observe(window, 'unload', function () {
    delete Protoplus;
});Ajax = Object.extend(Ajax, {
    Jsonp: function (url, options) {
        this.options = Object.extend({
            method: 'post',
            timeout: 60,
            parameters: '',
            force: false,
            onComplete: Prototype.K,
            onSuccess: Prototype.K,
            onFail: Prototype.K
        }, options || {});
        var parameterString = url.match(/\?/) ? '&' : '?';
        this.response = false;
        Ajax.callback = function (response) {
            this.response = response;
        }.bind(this);
        this.callback = Ajax.callback;
        if (typeof this.options.parameters == "string") {
            parameterString += this.options.parameters;
        } else {
            $H(this.options.parameters).each(function (p) {
                parameterString += p.key + '=' + encodeURIComponent(p.value) + '&';
            });
        }
        var matches = /^(\w+:)?\/\/([^\/?#]+)/.exec(url);
        var sameDomain = (matches && (matches[1] && matches[1] != location.protocol || matches[2] != location.host));
        if (!sameDomain && this.options.force === false) {
            return new Ajax.Request(url, this.options);
        }
        this.url = url + parameterString + 'callbackName=Ajax.callback&nocache=' + new Date().getTime();
        this.script = new Element('script', {
            type: 'text/javascript',
            src: this.url
        });
        var errored = false;
        this.onError = function (e, b, c) {
            errored = true;
            this.options.onComplete({
                success: false,
                error: e || "Not Found"
            });
            this.options.onFail({
                success: false,
                error: e || "Not Found",
                args: [e, b, c]
            });
            this.script.remove();
            window.onerror = null;
            this.response = false;
        }.bind(this);
        this.onLoad = function (e) {
            if (errored) {
                return;
            }
            clearTimeout(timer);
            this.script.onreadystatechange = null;
            this.script.onload = null;
            var res = this.script;
            this.script.remove();
            window.onerror = null;
            if (this.response) {
                setTimeout(function () {
                    this.options.onComplete({
                        responseJSON: this.response
                    });
                    this.options.onSuccess({
                        responseJSON: this.response
                    });
                }.bind(this), 20);
            } else {
                this.onError({
                    error: 'Callback error'
                });
            }
        }.bind(this);
        this.readyState = function (e) {
            var rs = this.script.readyState;
            if (rs == 'loaded' || rs == 'complete') {
                this.onLoad();
            }
        }.bind(this);
        var timer = setTimeout(this.onError, this.options.timeout * 1000);
        this.script.onreadystatechange = this.readyState;
        this.script.onload = this.onLoad;
        window.onerror = function (e, b, c) {
            clearTimeout(timer);
            this.onError(e, b, c);
            return true;
        }.bind(this);
        $$('head')[0].appendChild(this.script);
        return this;
    }
});
var _alert = window.alert;window.alert = function () {
    var args = arguments;
    var i = 1;
    var first = args[0];
    if (typeof first == "object") {
        $H(first).debug();
        return first;
    } else if (typeof first == "string") {
        var msg = first.replace(/(\%s)/gim, function (e) {
            return args[i++] || "";
        });
        _alert(msg);
        return true;
    }
    _alert(first);
};
var rand = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};;
var CommonClass = {
    HTTP_URL: false,
    SSL_URL: false,
    UPLOADS_URL: false,
    isSecure: false,
    isFullScreen: false,
    formBuilderTop: 106,
    toolBoxTop: 175,
    session: (new Date()).getTime(),
    templateCache: {},
    useArgument: false,
    messageWindow: false,
    cssloaded: false,
    lang: $$('html')[0].getAttribute('lang'),
    user: false,
    imageFiles: ["png", "jpg", "jpeg", "ico", "tiff", "bmp", "gif", "apng", "jp2", "jfif"],
    emailRegex: /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])/,
    initialize: function () {
		
        var $this = this;
        try {
            Object.extend(document.windowDefaults, {
                titleBackground: '#ffffff',
                buttonsBackground: '#ffffff',
                background: '#ffffff',
                borderWidth: 1,
                borderOpacity: 0.5,
                borderRadius: '8px',
                closeButton: '<div class="close-wiz" title="' + 'Close Window' + '"><img class="f-left" src="/sistema/images/links_sair.gif"><a href="#" style="color:#f69525" class="f-left">Close</a></div>',
                dimColor: '#444',
                dimOpacity: 0.5,
                borderColor: '#f9f9f9',
                titleTextColor: '#000'
            });
            this.setLoadingIndicator();
			var baseElem ;
			if(RAILS_ENV == "development")
				{
					

					if (location.hostname == 'localhost')
						baseElem = 'http://192.168.1.102:3000/';
					else if(location.hostname == 'ngstaging.ngprofessionals.com.br')	
						baseElem ="http://ngstaging.ngprofessionals.com.br/";
					else
						baseElem = 'http://192.168.1.102:3000/';
						
						//baseElem = 'http://192.168.1.102:3000/';
				}
			else
				var baseElem = 'http://ngforms.ngprofessionals.com.br/sistema/';

			//var baseElem= 'http://'+ window.location.host+'/';
			//alert(baseElem)//http://ngforms.ngprofessionals.com.br/
            if (baseElem) {
                this.HTTP_URL = baseElem;
				
            } else {
                var sub_folder = "";
                var uri = this.parseUri(location.href);
				
                if (uri.host == "localhost") {
                    sub_folder = "show";
                }
                if (document.APP) {
                    sub_folder = document.SUBFOLDER;
                }
                var folderCheck = new RegExp(".*" + sub_folder + "\/?$");
                if (sub_folder && sub_folder != "/" && folderCheck.test(uri.directory)) {
                    this.HTTP_URL = uri.protocol + "://" + uri.host + uri.directory;
                } else {
                    this.HTTP_URL = uri.protocol + "://" + uri.host + sub_folder + "/";
                }
            }
            this.UPLOADS_URL = this.HTTP_URL + "uploads/";
            this.SSL_URL = this.HTTP_URL.replace('http:', 'https:');
            this.isSecure = /^\bhttps\b\:\/\//.test(location.href);
			
            if (this.lang != "en") {
                $$('.info').each(function (elem) {
                    elem.hide();
                });
            }
            if ($('theme-selector')) {
                var body = $$('body')[0];
                $('theme-selector').selectOption(body.className).observe('change', function () {
                    body.className = $('theme-selector').value;
                    Utils.Request({
                        parameters: {
                            action: 'setTheme',
                            theme: $('theme-selector').value
                        }
                    });
                });
            }
            this.updateOnResize();
            setInterval(function () {
                $this.alignGlow();
            }, 900);
            if ($('language-box').bigSelect) {
                $('language-box').bigSelect({
                    additionalClassName: 'big-button buttons buttons-dark'
                });
            }
        } catch (e) {}
    },
    getCSSArray: function (css) {
        css = css.replace(/\s*(\s|\s\()\s*|\/\*([^*\\\\]|\*(?!\/))+\*\/|[\n\r\t]/gim, ' ');
        css = css.replace(/\}/gim, '}\n');
        css = css.replace(/^\s+/gim, '');
        var arr = css.split(/\n/);
        var parsed = {};
        var match;
        for (var x = 0; x < arr.length; x++) {
            match = arr[x].match(/([\s\S]*)\{([\s\S]*)\}/im);
            if (match && match[1]) {
                if (match[1].strip() in parsed) {
                    parsed[match[1].strip()] += ";" + match[2].strip();
                } else {
                    parsed[match[1].strip()] = match[2].strip();
                }
            }
        }
        if ($H(parsed).size() < 1) {
            return false;
        } else {
            return parsed;
        }
    },
    loadTime: false,
	setAsynchronousLoadingIndicator:function(){
			
			
			$('loading-indicator').show()	
		
		},
	removeAsynchronousLoadingIndicator:function(){
			$('loading-indicator').hide()
			
			//$('loading-indicator').setStyle("bottom:-40px")	
		
		},	
    setLoadingIndicator: function () {
		
        if (!$('loading-indicator')) {
            return;
        }
		
        var $this = this;
        var hide = function (text) {
          /*  $('loading-indicator').shift({
                bottom: 0,
                duration: 0.5
            });*/
			//$('loading-indicator').hide()
        };
        var show = function (text) {
			
       /*     $('loading-indicator').shift({
                bottom: 0,
                duration: 0.5,
                link: 'ignore'
            });*/
			//$('loading-indicator').show()
			
        };
        $('loading-indicator').observe('click', function () {
            hide();
        });
		
        Ajax.Responders.register({
            onCreate: function () {
				 show();
                /*$this.loadTime = setTimeout(function () {
                    show();
                }, 350);*/
            },
            onComplete: function () {
				//$('loading-indicator').hide()
               // clearTimeout($this.loadTime);
                hide();
            }
        });
    },
    alignGlow: function () {
        if (!$('glow-mid') || $('stage')) {
            return;
        }
        if ($('stage')) {
            $('glow-mid').style.height = ($('stage').getHeight() - 115) + 'px';
        } else {
            $('glow-mid').style.height = ($('content').getHeight() - 220) + 'px';
        }
    },
    openMovie: function () {
        this.lightWindow({
            width: 650,
            height: 400,
            content: '<h2>Ng Form Builder In Two Minutes</h2><object width="651" height="366" style="border:1px solid #999">' + '<param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="http://vimeo.com/moogaloop.swf?clip_id=13669519&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1" />' + '<embed src="http://vimeo.com/moogaloop.swf?clip_id=13669519&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="651" height="366">' + '</embed>' + '</object>',
            onReCenter: function () {},
            onClose: function () {}
        });
    },
    updateOnResize: function () {
        var resizeUpdater = function (e) {
            var width = document.viewport.getWidth();
            var height = document.viewport.getHeight();
            if (width < 1160) {
                var diff = 1160 - width
                $$('.glow div').invoke('setStyle', 'width:' + (width + (diff / 2) - 1) + 'px');
            } else {
                $$('.glow div').invoke('setStyle', {
                    width: ''
                });
            }
            if (width < 950) {
                ($('feedback-tab') && $('feedback-tab').hide());
            } else {
                ($('feedback-tab') && $('feedback-tab').show());
            }
        };
        Event.observe(window, 'resize', resizeUpdater);
        Event.observe(window, 'load', resizeUpdater);
    },
    lightWindow: function (options) {
        var preview = new Element('div', {
            className: 'preview-box'
        }).setStyle('width:' + options.width + 'px');
        var dim = new Element('div', {
            className: 'preview-dim'
        }).setOpacity(0.5);
        var cont = new Element('div', {
            className: 'preview-container'
        });
        preview.insert(options.content);
        cont.insert(preview);
        var esc_close = function (e) {
            e = document.getEvent(e);
            if (e.keyCode == Event.KEY_ESC) {
                close.onclick();
            }
        };
        var reCenter = function () {
            if (options.noReCenter) {
                return;
            }
            var dm = document.viewport.getDimensions();
            var left = (dm.width - options.width - 20) / 2;
            var top = dm.height * 0.1;
			
            var height = (dm.height < options.height + 100 + top) ? dm.height - top * 2 : options.height + 40;
            preview.setStyle({
                top: top + 'px',
                left: left + 'px',
                height: height + 'px'
            });
            options.onReCenter(height);
        };
        Event.observe(window, 'resize', reCenter);
        document.observe('keyup', esc_close);
        var close = new Element('img', {
            id: 'preview-close',
            src: '/sistema/images/toolbar/collapse_closed.png',
            className: 'toolbar-collapse_closed'
        });
        preview.insert(close);
        close.onclick = function () {
            options.onClose();
            Event.stopObserving(window, 'resize', reCenter);
            document.stopObserving('keyup', esc_close);
            dim.remove();
            cont.remove();
        };
        preview.setDraggable({
            dragFromOriginal: true
        });
        try {
            reCenter();
        } catch (e) {
            console.error(e);
        }
        $(document.body).insert(dim);
        $(document.body).insert(cont);
    },
    setGoal: function (name, testName, callback) {
        setTimeout(function () {
            this.Request({
                parameters: {
                    action: 'setGoal',
                    testName: testName,
                    name: name
                },
                onComplete: function () {
                    if (callback) {
                        callback();
                    }
                }
            });
        }.bind(this), 50);
    },
	getFieldsName:function(){
		var elements ='';
		var order=0;
		var eleNameArray = new Array();
		$$('#list .question-input').each(function(e){
			var eleName='';			
			var liTag = e.parentNode.parentNode.parentNode	;
			var id = liTag.id.replace('id_','')
			//e.childElements().first().setAttribute('style','border:solid 1px green');
			
			//liTag.setAttribute('style','border:solid 1px green');
			
			switch(liTag.type)
			{
				case 'control_datetime':
				case 'control_email':
				case 'control_phonenumber':
				case 'control_money':
				case 'control_number':
				case 'control_textbox':
				case 'control_textarea':
				
					//eleName += e.childElements().first().name+'|'
					//eleName ='type='+ liTag.type 
					
					var objGetProperties =new GetElementProperties(id);
					var prop = objGetProperties.getProperties() ;		//alert(prop)					
					//eleName += $$('.'+divTag.className+' input[type=checkbox]').first().name.replace('[]','')+'|';
					var con_name = e.childElements().first().name;
					eleName	+= 'label='+prop.field_label+'|'
					eleName	+= 'name='+con_name+'|'
					eleName += 'type='+ prop.field_type+'|';
					eleName += 'islogged='+ prop.loged_user+'|';
					eleName += 'isNodulicate='+ prop.allow_duplicate+'|';
					eleName += 'order='+ (id)+'|';
					eleName += 'description='+ prop.hint_desc+'|';
					if (prop.field_type != "control_phonenumber" && prop.field_type != "control_datetime")
					{
						
						eleName += 'maxsize='+ prop.max_length+'|';
						eleName += 'fieldSize='+ prop.field_size+'|';
					}
					if(prop.field_type == "control_datetime")
					{	
				
						if(prop.default_date)
						 eleName += 'defaultValue='+ prop.default_value+'|';
					}
					
					else{
						
						eleName += 'defaultValue='+ prop.default_value+'|';
						
					}
					eleName += 'elemOrder='+ (++order)+'|';
					if(prop.field_mask)
						eleName += 'fieldMask='+ prop.field_mask+'|';
						
					if(liTag.type=="control_number" || liTag.type=="control_money" )	
					{
							
						if(prop.currency_format)
							eleName += 'currencyFormat='+ prop.currency_format+'|';
						
						eleName += 'numberTextAligned='+ (prop.number_text_aligned?"Right":null)+'|';
						eleName += 'decimalPosition='+ prop.decimalPosition+'|';

						
					}
					if(liTag.type=="control_number" || liTag.type=="control_money"  || liTag.type=="control_datetime")
					{
						eleName += 'startRange='+ prop.from+'|';
						eleName += 'endRange='+ prop.to+'|';	
						
					}
					
					//e.setAttribute('style','border:solid 1px green');
					if(e.getProperty('association')!==undefined && e.getProperty('association'))
						eleName += 'association='+e.getProperty('association')+'|';	
						
					eleName += 'required='+ prop.required
					
					eleNameArray.push(con_name);
				break;
			
				case 'control_button':	
				var but_name = 'submitButtonOfForm';
					//alert(but_name + id)
					but_name = but_name.toString().length<1 ? "Submit11" : but_name
					
					eleName += 'order='+ (id)+'|';					
					eleName += 'type='+ liTag.type+'|';					
					eleName += 'label='+ $('input_submit').value+'|';	
					eleName += 'elemOrder='+ (++order)+'|';
					eleName += 'name='+but_name; 
					
					eleNameArray.push(but_name);
				break;
				
				case 'control_dropdown':
				case 'control_radio':
				case 'control_checkbox':
					
					var divTag = e.childElements().first();
					//divTag.setAttribute('style','border:solid 1px red')
					var options_values = e.getProperty('options');
					
					//e.setAttribute('style','border:solid 1px green');
						//alert($$('#id_'+id+' .'+divTag.className+' input[type=checkbox]').first().name.replace('[]','') +"  ----chk")
					var objGetProperties =new GetElementProperties(id);
					var prop = objGetProperties.getProperties() ;		
					var ele_type = prop.field_type;
					//alert(ele_type)
					if (ele_type == "control_checkbox")					
						var eleChk = $$('#id_'+id+' .'+divTag.className+' input[type=checkbox]').first()
					else if (ele_type == "control_dropdown")		
						var eleChk = $$('#id_'+id+' .question-input select').first()
					else
						var eleChk = $$('#id_'+id+' .'+divTag.className+' input[type=radio]').first()
					//alert(eleChk.id)
					//eleChk.setAttribute('style','border:solid 1px red')
					//alert(1)
					var chk_name = eleChk.name.replace('[]','')
					//eleName += $$('.'+divTag.className+' input[type=checkbox]').first().name.replace('[]','')+'|';
					eleName	+='label='+prop.field_label +'|'
					eleName	+='name='+ chk_name+'|'
					eleName += 'type='+ prop.field_type+'|';	
					eleName += 'islogged='+ prop.loged_user+'|';
					eleName += 'order='+ (id)+'|';
					eleName += 'description='+ prop.sub_heading+'|';
					eleName += 'required='+ prop.required+'|';
					eleName += 'elemOrder='+ (++order)+'|';
					eleName += 'selected='+prop.selected.replace(/\|/g,"^^")+'|';
					var chk_values ='';
					/*$$('#chk_opt_alt table.element_prop span input:text').each(function (ele_text) {
						
						chk_values +=ele_text.value +"^^"
					})*/	

					eleName += 'checkBoxValues='+ options_values.replace(/\|/g,"^^")+'|';
					if(e.getProperty('association')!=undefined && e.getProperty('association'))
						eleName += 'association='+e.getProperty('association')+'|';	
					eleName += 'optionColumn='+ (prop.column === undefined?'1':prop.column)
					
					
					eleNameArray.push(chk_name);
					
				break;
				
				case 'control_fileupload':
				case 'control_paragraph':
				case 'control_head':	
					
					var objGetProperties =new GetElementProperties(id)
					var prop = objGetProperties.getProperties()
					var head_name='header_'+ id.toString()
					
					eleName += 'order='+ (id)+'|';					
					eleName += 'type='+ liTag.type+'|';					
					eleName += 'label='+ prop.field_label+'|';	
					eleName += 'elemOrder='+ (++order)+'|';
					eleName += 'description='+ prop.sub_heading+'|';
					eleName += 'fieldSize='+ prop.font_size+'|';
					if(e.getProperty('association')!=undefined && e.getProperty('association') )
						eleName += 'association='+e.getProperty('association')+'|';	
					if (liTag.type == "control_fileupload")
					{
					
						head_name = e.childElements().first().name;
						eleName += 'name='+head_name	
					}
					else
					 eleName += 'name='+head_name
					 
				
					
					eleNameArray.push(head_name);
					
				break;
				
				
				default:					
					
				break;
				
			}
			if(eleName!='')
				elements +=(eleName+'$**$');	
				
		},this)
		
		
		elements = elements.substring(0,elements.length-4)
		return Array(elements,eleNameArray);
	},
	getFormProperties:function(){
		var elements ='';
		if($('allow_ip').checked)
			elements ='allow_ip=true&'
	
		elements +=	'form_name='+$('title-hint_text').value.replace(Locale.trimRexp, '');
		//elements = elements.substring(0,elements.length-1)
		
		return elements;
	},
    Request: function (options) {
		
	//this.setAsynchronousLoadingIndicator()
	
	var url = this.HTTP_URL;
        options = Object.extend({
            onSuccess: Prototype.K,
            onFail: Prototype.K,
            onComplete: Prototype.K,
            asynchronous: true,
            parameters: {},
            server:CUSTOM_URL+"/builder/save_form",
            evalJSON: "force",
            method: 'post'
        }, options || {});
		var max_entries = $('stage').getProperty('maxEntries');
		var isAllowEntryForOneIp = $('stage').getProperty('isAllowEntryForOneIp');
		var pub_start_date='';
		var pub_end_date=''
		var is_captcha_enabled = $('stage').getProperty('captcha')?$('stage').getProperty('captcha'):0;
		var response_type ;
		var response_data ;
		
		if($('stage').getProperty('activeRedirect') == "thanktext")
		{
			 response_type = "thanktext"
			 response_data = $('stage').getProperty('thanktext')
		}
		else if	($('stage').getProperty('activeRedirect') == "thankurl")
		{
			 response_type = "thankurl"
			 response_data = $('stage').getProperty('thanktext')
		}
		else
		{
			response_type =''
			response_data=''
		}
		
		var isPublishDate = false;

		if($('stage').getProperty('scheduledPublication'))
		{
			
			if($('stage').getProperty('scheduledPublicationStart'))
			{
				pub_start_date = $('stage').getProperty('scheduledPublicationStart') +' ' + $('stage').getProperty('scheduledPublicationStartTime')+' '+ $('stage').getProperty('scheduledPublicationStartAmPm') 	
				 
				pub_end_date = $('stage').getProperty('scheduledPublicationEnd') +' ' + $('stage').getProperty('scheduledPublicationEndTime')+' '+ $('stage').getProperty('scheduledPublicationEndAmPm') 
				isPublishDate = true
				
			}
			
		}
	
		
		
		
		//alert(this.getFieldsName()[0].toString())
		//return
	//	alert($('stage').getProperty('emailText'))
			
        new Ajax.Request(options.server, {
           parameters: {     
					'elem_props'	: this.getFieldsName()[0].toString(),
					'elem_names_for_edit':this.getFieldsName()[1].toString(),
					'form_name'		: $('title-hint_text').value.replace(Locale.trimRexp, ''),
					'is_allow_entry_for_one_ip': isAllowEntryForOneIp,
					'form_id'		: formID,
					'max_entry'		: $('stage').getProperty('maxEntries'),
					'is_publish_date' :isPublishDate,
					'pub_start_date': pub_start_date,
					'pub_end_date'	: pub_end_date,
					'is_captcha_enabled':is_captcha_enabled,
					'label_aligned':$('stage').getProperty('alignment'),
					'language_id':$('stage').getProperty('language'),
					'response_type':response_type,
					'response_data':response_data,
					'form_html': $('list').innerHTML,
					'idEditMode':EDIT_MODE,
					'submitButtonValue':$('input_submit').value,
					'isSendConfirmationMail':$('stage').getProperty('isSendConfirmationMail'),
					'confirationEmailTo':$('stage').getProperty('confirmationEmailId'),
					'replyToEmail':$('stage').getProperty('replyToEmailId'),
					'mailMsg':$('stage').getProperty('emailText'),
					'mailMsgType': ($('stage').getProperty('confirmationEmailId')?$('stage').getProperty('emailMsgType'):''),
					'sendToFieldName' : getEmailEelementNameInput($('stage').getProperty('confirmationEmailId'))!==undefined ? getEmailEelementNameInput($('stage').getProperty('confirmationEmailId')).name : "",
					'database_id':isChildForm ? parseInt($('related_database').value ):  "0",
					'theme':$('stage').getProperty('theme')
					
                },
            evalJSON: options.evalJSON,
            asynchronous: options.asynchronous,
            method: options.method,
			
            onComplete: function (t) {
				
                try {
                    if (t.status === 0) {
                        return;
                    }
                    var res = {
                        success: false,
                        error: 'Cannot evaluate JSON: ' + t.responseText
                    };
                    if (options.evalJSON === false) {
                        res = {
                            success: true,
                            message: t.responseText
                        };
                    }
                    if (t.responseJSON) {
                        res = t.responseJSON;
                    }
					var flag = true
                    if (res.success) {
						
                        	options.onSuccess(res, t.responseText);
                    } else {
						
						
						if (t.responseJSON.redirect!== undefined && t.responseJSON.redirect)
						{
							flag = false
							/*I overwrite the function */
							window.onbeforeunload =''
							window.location.href = "buildders/"+t.responseJSON.form_id+"/edit"
						}
						
                    }
					if (flag)
                    	options.onComplete(res, t.responseText);
					
                    if ($('loading-indicator')) {
                        $('loading-indicator').shift({
                            bottom: 0,
                            link: 'ignore',
                            duration: 0.5
                        });
                    }
                } catch (e) {
                    console.error(e, 'Error on (' + options.parameters.action + ')');
                }
            }
        });
    },
    setUserInfo: function (response) {
        if (response.success) {
            this.user = response.user;
            this.user.usage = response.usage;
        }
    },
    getFileExtension: function (filename) {
        return (/[.]/.exec(filename)) ? (/[^.]+$/.exec(filename))[0] : undefined;
    },
    fixIEDoubleLine: function (code) {
        code = code.replace(/\<p\>/gim, '');
        code = code.replace(/\<\/p\>/gim, '<br>');
        return code;
    },
    fixBars: function (element, top, btop) {
		
		
        var theight = $('tools-wrapper').getHeight() + 10;
        var cheight = $('content').getHeight() ;
		
		/* Added by neelesh
        $('tools-wrapper').setStyle({
            top: (cheight - theight) + 'px'
        }).updateScroll();*/
		
        /*$('tool_bar').setStyle({
            top: cheight - (theight + 68) + 'px'
        }).updateScroll();*/
    },
    scrollLimits: function (element, top, btop) {
        if (this.isFullScreen) {
            return;
        }
		//alert(4)
        var cheight = $('content').getHeight() + 50;
        var theight = $('tools-wrapper').getHeight() - 68;
		//alert(theight)
        if (btop + theight > cheight) {
            return false;
        }
    },
    screenToggle: function (button) {
		
        if (!this.isFullScreen) {
            this.isFullScreen = true;
            $('main').className = 'fullscreen';
            button.src = "/sistema/images/fs2.png";
            button.alt = button.title = "Go Normal Screen".locale();
            $('tools-wrapper').updateTop(108).updateScroll();
            $('tool_bar').updateTop(39).updateScroll();
            this.updateBarHeightInFullScreen();
            ($('feedback-tab') && $('feedback-tab').hide());
            if ($('prop-tabs')) {
                $('prop-tabs').setStyle({
                    width: (document.viewport.getWidth() - 200) + 'px'
                });
            }
            Event.observe(window, 'resize', this.updateBarHeightInFullScreen.bind(this));
            document.createCookie('fullscreen', 'yes');
        } else {
            this.isFullScreen = false;
            $('main').className = 'main';
            button.src = "/sistema/images/fs1.png";
            button.alt = button.title = "Go Full Screen".locale();
            $('tools-wrapper').updateTop(this.toolBoxTop).updateScroll();
            $('tool_bar').updateTop(this.formBuilderTop).updateScroll();
            $('right-panel').setStyle({
                height: 'auto'
            });
            $('stage').setStyle({
                height: 'auto',
                width: '699px'
            });
            ($('search-bar') && $('search-bar').setStyle({
                left: '201px',
                width: ''
            }));
            $('content').setStyle({
                height: ''
            });
            ($('feedback-tab') && $('feedback-tab').show());
            if ($('prop-tabs')) {
                $('prop-tabs').setStyle({
                    width: '100%'
                });
            }
            Event.stopObserving(window, 'resize', this.updateBarHeightInFullScreen.bind(this));
            document.eraseCookie('fullscreen', 'yes');
        }
        if ('closeActiveButton' in window) {
            closeActiveButton();
            if (selected) {
                var t = selected;
                unselectField();
                setTimeout(function () {
                    t.run('click');
                }, 10);
            }
            setTimeout(function () {
                makeToolbar(form);
            }, 10);
        }
        this.updateBuildMenusize();
    },
    updateBuildMenusize: function () {
        if ($('style-content')) {
            $('style-content').setStyle({
                height: ($('stage').getHeight() - 58) + "px"
            });
        }
    },
    getScrollMax: function () {//alert(43423);
        var res = [];
        if (window.scrollMaxX === undefined) {
            res = [document.documentElement.scrollWidth - document.documentElement.clientWidth, document.documentElement.scrollHeight - document.documentElement.clientHeight];
        } else {
            res = [window.scrollMaxX, window.scrollMaxY];
        }
        return res;
    },
    updateBarHeightInFullScreen: function () {
        if (!this.isFullScreen) {
            return;
        }
        var removeScroll = !(this.getScrollMax()[1] > 0);
        if (removeScroll) {
            $(document.body).setStyle({
                overflow: 'hidden'
            });
        }
        var dwidth = document.viewport.getWidth();
        var dheight = document.viewport.getHeight();
        var fheight = $('forms') ? $('forms').getHeight() + 200 : ($('list') ? $('list').getHeight() : $('stage').getHeight());
        $('right-panel').setStyle({
            height: (((dheight > fheight) ? dheight - 40 : fheight + 68)) + 'px'
        });
        $('stage').setStyle({
            height: (((dheight > fheight) ? dheight - 108 : fheight)) + 'px',
            width: (dwidth - 200) + 'px'
        });
        $('content').setStyle({
            height: (((dheight > fheight) ? dheight - 108 : fheight)) + 'px'
        });
        ($('search-bar') && $('search-bar').setStyle({
            left: '200px',
            width: (dwidth - 216) + 'px'
        }));
        ($('prop-tabs') && $('prop-tabs').setStyle({
            width: (document.viewport.getWidth() - 200) + 'px'
        }));
        if (removeScroll) {
            $(document.body).setStyle({
                overflow: ''
            });
        }
    },
    fullScreenListener: function () {
        if (location.hash.toLowerCase() == "#fullscreen" || document.readCookie('fullscreen')) {
            Utils.screenToggle($('fullscreen-button'));
        }
    },
    setToolbarFloat: function () {

        window.scrollTo(0, 0);
        $('tool_bar')[Prototype.Browser.IE9 ? 'keepInViewport' : 'positionFixed']({
            offset: 0,
            onBeforeScroll: this.scrollLimits,
            onBeforeScrollFail: this.fixBars,
            onScroll: function (element, top) {
                if (top > this.formBuilderTop || (this.isFullScreen && top > 20)) {
                    if (!$("toolbox_handler").buttonAdded) {
                        $("toolbox_handler").insert(new Element('img', {
                            src: "/sistema/images/blank.gif",
                            className: "toolbar-arrow-top",
                            align: "bottom",
                            alt: 'Top'.locale(),
                            title: 'Go to Top'.locale()
                        }).setStyle({
                            cursor: 'pointer'
                        }).observe('click', function () {
                            $(document.body).shift({
                                scrollTop: 0
                            });
                        }));
                        $('tool_bar').setStyle('border-bottom:1px solid #aaa');
                        $("toolbox_handler").buttonAdded = true;
                    }
                } else {
                    if ($("toolbox_handler").buttonAdded) {
                        $('tool_bar').setStyle({
                            borderBottom: ''
                        });
                        $("toolbox_handler").update("&nbsp;");
                        $("toolbox_handler").buttonAdded = false;
                    }
                }
            }.bind(this)
        });
    },
	// When Widow ge load
    setToolboxFloat: function () {
		
        window.scrollTo(0, 0);
        $('tools-wrapper')[Prototype.Browser.IE9 ? 'keepInViewport' : 'positionFixed']({
            offset: 69,
            onBeforeScroll: this.scrollLimits,
            onBeforeScrollFail: this.fixBars
        });
    },
    updateToolbars: function () {
		
        if ($('tools-wrapper')) {
            $('tools-wrapper').updateScroll();
        }
        if ($('tool_bar')) {
            $('tool_bar').updateScroll();
        }
    },
    alert: function (mess, title, callback, options) {
		CommonClass.removeAsynchronousLoadingIndicator();
        options = Object.extend({
            okText: 'OK'.locale(),
            width: 300,
			height:50,
            onInsert: Prototype.K,
            onClose: Prototype.K
        }, options || {});
        if (this.messageWindow) {
            this.messageWindow.close();
        }
        this.messageWindow = document.window({
            title: title || 'Message From NgForms Builder'.locale(),
            content: '<center>' + mess + '</center>',
            modal: true,
            width: options.width,
			height:options.height,
            dimZindex: 10012,
            winZindex: 10013,
            contentPadding: '15',
            buttonsAlign: 'center',
            onClose: options.onClose,
            buttons: [{
                title: 'OK'.locale(),
                name: 'OK',
                handler: function (w) {
                    if (callback) {
                        if (callback() === false) {
                            return;
                        }
                    }
                    this.messageWindow = false;
                    w.close();
                }.bind(this)
            }],
            onInsert: function (w) {
                w.buttons.OK.setStyle({
                    fontWeight: 'bold'
                });
                setTimeout(function () {
                    w.buttons.OK.focus();
                }, 100);
                options.onInsert(w);
            }
        });
        return this.messageWindow;
    },
    prompt: function (mess, defaultValue, title, callback, options) {
        options = Object.extend({
            okText: 'OK'.locale(),
            cancelText: 'Cancel'.locale(),
            width: 300,
            fieldType: 'text'
        }, options || {});
        if (this.messageWindow) {
            this.messageWindow.close();
        }
        var promptContent = new Element('div');
        promptContent.insert(mess);
        promptContent.insert("<br><br>");
        var input = new Element('input', {
            type: options.fieldType
        }).setStyle('width:100%');
        input.value = defaultValue || "";
        promptContent.insert(input);
        this.messageWindow = document.window({
            title: title || 'Message From NgForms Builder'.locale(),
            content: promptContent,
            modal: true,
            width: options.width,
            dimZindex: 10014,
            winZindex: 10015,
            contentPadding: '15',
            onClose: function (w, key) {
                if (key == "ESC" || key == "CROSS") {
                    if (callback) {
                        if (callback(false, 'Cancel', false, this.messageWindow) !== false) {
                            this.messageWindow = false;
                            return true;
                        }
                    } else {
                        this.messageWindow = false;
                        return true;
                    }
                }
            }.bind(this),
            buttons: [{
                title: options.cancelText,
                name: 'Cancel',
                link: true,
                handler: function (w) {
                    if (callback) {
                        if (callback(false, 'Cancel', false, this.messageWindow) !== false) {
                            this.messageWindow = false;
                            w.close();
                        }
                    } else {
                        this.messageWindow = false;
                        w.close();
                    }
                }.bind(this)
            },
            {
                title: options.okText,
                name: 'OK',
                color: 'green',
                handler: function (w) {
                    if (callback) {
                        if (callback(input.value, 'OK', true, this.messageWindow) !== false) {
                            this.messageWindow = false;
                            w.close();
                        }
                    } else {
                        this.messageWindow = false;
                        w.close();
                    }
                }.bind(this)
            }],
            onInsert: function (w) {
                w.buttons.OK.setStyle({
                    fontWeight: 'bold'
                });
                input.select();
                input.observe('keydown', function (e) {
                    e = document.getEvent(e);
                    if (e.keyCode == 13) {
                        w.buttons.OK.run('click');
                    }
                });
            }
        });
        this.messageWindow.inputBox = input;
        return this.messageWindow;
    },
    confirm: function (mess, title, callback) {
        if (this.messageWindow) {
            this.messageWindow.close();
        }
        this.messageWindow = document.window({
            title: title || 'Message From NgForms Builder'.locale(),
            content: '<center>' + mess + '</center>',
            modal: true,
            width: '300',
            dimZindex: 10010,
            winZindex: 10011,
            contentPadding: '15',
            buttons: [{
                title: 'OK'.locale(),
                name: 'OK',
                handler: function (w) {
                    this.messageWindow = false;
                    w.close();
                    if (callback) {
                        callback('OK', true);
                    }
                }
            },
            {
                title: 'Cancel'.locale(),
                name: 'Cancel',
                link: true,
                handler: function (w) {
                    this.messageWindow = false;
                    w.close();
                    if (callback) {
                        callback('Cancel', false);
                    }
                }
            }],
            onInsert: function (w) {
                w.buttons.OK.setStyle({
                    fontWeight: 'bold'
                });
                setTimeout(function () {
                    w.buttons.Cancel.focus();
                }, 100);
            }
        });
        return this.messageWindow;
    },
    poof: function (e) {
        if (Prototype.Browser.IE) {
            return;
        }
        var img = new Element("div").setStyle('height:55px; width:55px; background-image:url(/sistema/images/poof.png); z-index:10000000');
        var interval = false;
        var c = 1;
        $(document.body).insert(img);
        img.setStyle({
            position: "absolute",
            top: (Event.pointerY(e) - 0) + "px",
            left: (Event.pointerX(e) - 0) + "px"
        });
        var positions = ["0", "55", "110", "165", "220"];
        setTimeout(function () {
            interval = setInterval(function () {
                if (c >= 4) {
                    clearInterval(interval);
                    img.remove();
                    return true;
                } else {
                    c++;
                }
                img.setStyle({
                    backgroundPosition: '-' + positions[c] + "px"
                });
            }, 100);
        }, 100);
    },
    addZeros: function (n, totalDigits) {
        n = n.toString();
        var pd = '';
        if (totalDigits > n.length) {
            for (var i = 0; i < (totalDigits - n.length); i++) {
                pd += '0';
            }
        }
        return pd + n.toString();
    },
    numberFormat: function (number, decimals, dec_point, thousands_sep) {
        var n = number,
            prec = decimals;
        var toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return (Math.round(n * k) / k).toString();
        };
        n = !isFinite(+n) ? 0 : +n;
        prec = !isFinite(+prec) ? 0 : Math.abs(prec);
        var sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep;
        var dec = (typeof dec_point === 'undefined') ? '.' : dec_point;
        var s = (prec > 0) ? toFixedFix(n, prec) : toFixedFix(Math.round(n), prec);
        var abs = toFixedFix(Math.abs(n), prec);
        var _, i;
        if (abs >= 1000) {
            _ = abs.split(/\D/);
            i = _[0].length % 3 || 3;
            _[0] = s.slice(0, i + (n < 0)) + _[0].slice(i).replace(/(\d{3})/g, sep + '$1');
            s = _.join(dec);
        } else {
            s = s.replace('.', dec);
        }

if (s.indexOf(dec) === -1 && prec > 1) {
    s += dec + new Array(prec).join(0) + '0';
} else if (s.indexOf(dec) == s.length - 2) {
    s += '0';
}
return s;
}, formatPrice: function (amount, curr, id, nofree) {
    if (!curr) {
        curr = 'USD';
    }
    id = id || "";
    if (parseFloat(amount) === 0 && nofree !== true) {
        return 'Free';
    }
    amount = this.numberFormat(amount, 2, '.', ',');
    switch (curr) {
    case "USD":
        return "$<span id=\"" + id + "\">" + amount + '</span> USD';
    case "EUR":
        return "&euro;<span id=\"" + id + "\">" + amount + ' EUR';
    case "GBP":
        return "&pound;<span id=\"" + id + "\">" + amount + ' GBP';
    case "AUD":
        return "$<span id=\"" + id + "\">" + amount + "</span> " + curr;
    case "CAD":
        return "$<span id=\"" + id + "\">" + amount + "</span> " + curr;
    case "NZD":
        return "$<span id=\"" + id + "\">" + amount + "</span> " + curr;
    case "SGD":
        return "$<span id=\"" + id + "\">" + amount + "</span> " + curr;
    case "HKD":
        return "$<span id=\"" + id + "\">" + amount + "</span> " + curr;
    default:
        return "<span id=\"" + id + "\">" + amount + "</span> " + curr;
    }
},
deepClone: function (obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    var clone = Object.isArray(obj) ? [] : {};
    for (var i in obj) {
        var node = obj[i];
        if (typeof node == 'object') {
            if (Object.isArray(node)) {
                clone[i] = [];
                for (var j = 0; j < node.length; j++) {
                    if (typeof node[j] != 'object') {
                        clone[i].push(node[j]);
                    } else {
                        clone[i].push(this.deepClone(node[j]));
                    }
                }
            } else {
                clone[i] = this.deepClone(node);
            }
        } else {
            clone[i] = node;
        }
    }
    return clone;
},
convert24to12: function (time) {
    time = time.split(":");
    var suffix = "";
    if (Number(time[0]) > 12) {
        suffix = "pm";
        time[0] = time[0] - 12;
    } else if (Number(time[0]) == 12) {
        suffix = "pm";
    } else if (Number(time[0]) > 0) {
        suffix = "am";
    } else if (Number(time[0]) === 0) {
        suffix = "am";
        time[0] = 12;
    }
    return {
        time: time[0] + ":" + time[1],
        suffix: suffix
    };
},
convert12to24: function (time, suffix) {
    if (suffix.toLowerCase() == "am" && time.match(/^12:.*/)) {
        return time.replace(/^12:(.*)/, "00:$1");
    } else if (suffix.toLowerCase() == "am" || time.match(/^12:.*/)) {
        return time;
    } else {
        return time.replace(/^(.*):(.*)/, function (all, h, m) {
            return (Number(h) + 12) + ":" + m;
        });
    }
},
deepClone_old: function (obj) {
    pt.start('DeepClone');
    var s = Object.toJSON(obj);
    s = s.evalJSON();
    pt.end('DeepClone');
    return s;
},
fireEvent: function (element, event) {
    var evt;
    if (document.createEventObject) {
        evt = document.createEventObject();
        return element.fireEvent('on' + event, evt);
    } else {
        evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true);
        return !element.dispatchEvent(evt);
    }
},
setAccordion: function (accordionContainer, options) {
	
    var openPanel = undefined;
    $$('#' + accordionContainer.id + ' .panel').each(function (panel, i) {
        var bar = panel.select('.panel-bar')[0];
        var content = panel.select('.panel-content')[0];
        content.setStyle({
            height: 'auto'
        }).absolutize();
        content.panel = panel;
        var h = 0;
		
        if (options.height) {
            h = options.height;
        } else {
            h = content.getHeight();
        }
		
        content.relativize().setStyle({
            position: ''
        });
        var tools = content.select('.tools')[0];
        if (options.openIndex != i) {
            panel.addClassName('panel-closed');
            content.setStyle({
                height: '0px',
                background: '#bbb'
            });
            tools.hide();
        } else {
			
            openPanel = content.setStyle({
                overflow: 'visible',
				width:'98%',
                height: h + "px",
                background: '#f5f5f5'
            }).addClassName('panel-content-open');
        }
        bar.setUnselectable();
        bar.observe('click', function () {
            if (openPanel) {
                openPanel.style.position = 'relative';
                openPanel.setStyle({
                    overflow: 'hidden'
                }).shift({
                    height: 0,
                    background: '#bbb',
                    duration: 0.5,
                    onEnd: function (el) {
                        el.panel.addClassName('panel-closed');
                        el.removeClassName('panel-content-open');
                        (el.select('.tools') && el.select('.tools')[0].hide());
                    }
                });
            }
            if (openPanel != content) {
                (tools && tools.show());
                content.panel.removeClassName('panel-closed');
                openPanel = content.shift({
                    height: h,
                    duration: 0.5,
                    background: '#f5f5f5',
                    onEnd: function () {
                        openPanel.style.position = '';
                        content.setStyle({
                            overflow: 'visible'
                        });
                    }
                }).addClassName('panel-content-open');
            } else {
                openPanel = false;
            }
        });
    });
},
loadTemplate: function (template, callback,isSynchronousFlag) {
		var isAsynchronous = true
	if (isSynchronousFlag)
		isAsynchronous = false
		
    try {

        if (this.templateCache[template]) {
            callback(this.templateCache[template]);
        } else {
			//+ "?" + this.session+ "?" + this.session
            new Ajax.Request(template , {
                method: 'get',
				asynchronous:isAsynchronous,
                onComplete: function (t) {
                    try {
                        if (t.status != 200) {
                            Utils.alert('Yet not implemented'.locale(),'Error'.locale());
                            return;
                        }
						//alert(callback)
                        this.templateCache[template] = t.responseText;
                        callback(t.responseText);
                    } catch (e) {
                        console.error(e);
                    }
                }.bind(this)
            });
        }
    } catch (e) {}
},
loadScript: function (file, callback, arg) {
    this.useArgument = arg;
    if (this.templateCache[file]) {
        if (callback) {
            callback(arg);
        } else {
            this.templateCache[file](arg);
        }
    } else {
        try {
            this.templateCache[file] = callback ||
            function () {};
            var script = document.createElement('script');
            script.type = "text/javascript";
            script.src = file + "?" + this.session;
            $(document.body).appendChild(script);
        } catch (e) {
            console.error(e);
        }
    }
},
loadedLinks: [],
loadCSS: function (url) {
    if ($A(this.loadedLinks).include(url)) {
        return;
    }
    this.loadedLinks.push(url);
    if (document.createStyleSheet) {
        document.createStyleSheet(url + ("?" + this.session));
    } else {
        $$('head')[0].insert('<link rel="stylesheet" type="text/css" href="' + url + ("?" + this.session) + '" />');
    }
    return $$('link[href=' + url + ']')[0];
},
createCSS: function (selector, declaration) {
    var id = "style-" + selector.replace(/\W/gim, '');
    if ($(id)) {
        $(id).remove();
    }
    var ua = navigator.userAgent.toLowerCase();
    var isIE = (/msie/.test(ua)) && !(/opera/.test(ua)) && (/win/.test(ua));
    var style_node = document.createElement("style");
    style_node.id = id;
    style_node.setAttribute("type", "text/css");
    style_node.setAttribute("media", "screen");
    if (!isIE) {
        style_node.appendChild(document.createTextNode(selector + " {" + declaration + "}"));
    }
    document.getElementsByTagName("head")[0].appendChild(style_node);
    if (isIE && document.styleSheets && document.styleSheets.length > 0) {
        var last_style_node = document.styleSheets[document.styleSheets.length - 1];
        if (typeof(last_style_node.addRule) == "object") {
            last_style_node.addRule(selector, declaration);
        }
    }
},
tryCSSLoad: function (callback) {
    if (this.cssloaded) {
        this.cssloaded = false;
        return;
    }
    try {
        callback();
        this.cssloaded = true;
    } catch (e) {
        setTimeout(function () {
            this.tryCSSLoad(callback);
        }.bind(this), 10);
    }
},
getStyleBySelector: function (selector) {
    var sheetList = document.styleSheets;
    var ruleList;
    var i, j;
    for (i = sheetList.length - 1; i >= 0; i--) {
        ruleList = sheetList[i].cssRules;
        for (j = 0; j < ruleList.length; j++) {
            if (ruleList[j].type == CSSRule.STYLE_RULE && ruleList[j].selectorText == selector) {
                return ruleList[j].style;
            }
        }
    }
    return null;
},
checkEmailFormat: function (email) {
    if (!Object.isString(email)) {
        return false;
    }
    return email.match(this.emailRegex);
},
parseUri: function (str, options) {
    options = Object.extend({
        strictMode: false,
        key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
        q: {
            name: "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    }, options || {});
    var m = options.parser[(options.strictMode) ? "strict" : "loose"].exec(str),
        uri = {},
        i = 14;
    while (i--) {
        uri[options.key[i]] = m[i] || "";
    }
    uri[options.q.name] = {};
    uri[options.key[12]].replace(options.q.parser, function ($0, $1, $2) {
        if ($1) {
            uri[options.q.name][$1] = $2;
        }
    });
    return uri;
},
bytesToHuman: function (octets) {
    units = ['B', 'kB', 'MB', 'GB', 'TB'];
    for (var i = 0, size = octets; size > 1024; size = size / 1024) {
        i++;
    }
    return this.numberFormat(size, 2) + '<span class="octets">' + units[Math.min(i, units.length - 1)] + '</span>';
},
baseEncode: function (parameters) {
    var encoded = Base64.encode(Object.isArray(parameters) ? $A(parameters).toQueryString() : $H(parameters).toQueryString());
    return encodeURIComponent(encoded.replace(/([\+\/\=])/g, function (a) {
        switch (a) {
        case "/":
            return "-";
        case "+":
            return "_";
        case "=":
            return ",";
        }
        return a;
    }));
},
baseDecode: function (string) {
    string = decodeURIComponent(string).replace(/([\-\_\,])/g, function (a) {
        switch (a) {
        case "-":
            return "/";
        case "_":
            return "+";
        case ",":
            return "=";
        }
        return a;
    });
    var decoded = Base64.decode(string);
    return decoded.parseQuery();
},
redirect: function (url, options) {
    options = Object.extend({
        method: 'get',
        parameters: false,
        target: '_self',
        encode: false
    }, options || {});
    var form = new Element('form', {
        action: url,
        method: options.method.toLowerCase(),
        target: options.target,
        acceptCharset: 'utf-8'
    });
    if (options.encode) {
        var encode = new Element('input', {
            type: 'hidden',
            name: 'encoded'
        });
        encode.value = Utils.baseEncode(options.parameters);
        form.insert(encode);
    } else {
        $H(options.parameters).each(function (field) {
            var f = new Element('input', {
                type: 'hidden',
                name: field.key
            });
            f.value = field.value;
            form.insert(f);
        });
    }
    $(document.body).insert(form);
    form.submit();
    form.remove();
},
selectAll: function () {
    this.focus();
    this.select();
},
addClipboard: function (holderId, sourceId) {
    var holder = $(holderId);
    if (!holder || !$(sourceId)) {
        return;
    }
    var clipboardId = sourceId + "Copy";
    var clipboardHTML = "<object width='14' height='14' id='clippy' class='clippy' classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000'>";
    clipboardHTML += "<param value='js/clippy.swf?v5' name='movie'>";
    clipboardHTML += "<param value='always' name='allowScriptAccess'>";
    clipboardHTML += "<param value='high' name='quality'>";
    clipboardHTML += "<param value='noscale' name='scale'>";
    clipboardHTML += "<param value='id=" + clipboardId + "&amp;copied=&amp;copyto=' name='FlashVars'>";
    clipboardHTML += "<param value='#FFFFFF' name='bgcolor'>";
    clipboardHTML += "<param value='opaque' name='wmode'>";
    clipboardHTML += "<embed width='14' height='14' wmode='opaque' bgcolor='#FFFFFF' flashvars='id=" + clipboardId + "&amp;copied=&amp;copyto=' pluginspage='http://www.macromedia.com/go/getflashplayer' type='application/x-shockwave-flash' allowscriptaccess='always' quality='high' name='clippy' src='js/clippy.swf?v5'>";
    clipboardHTML += "</object>";
    clipboardHTML += "<span id='" + clipboardId + "' style='display: none;'></span>";
    holder.update(clipboardHTML);
    var clipboard = $(clipboardId);
    clipboard.update($(sourceId).value);
    $(sourceId).observe('change', function (event) {
        var element = event.target;
        clipboard.update(element.value);
    });
    buttonToolTips(holder, {
        message: 'Copy to clipboard'.locale(),
        title: 'Copy'.locale(),
        arrowPosition: 'top',
        offset: 10
    });
},
strPad: function (input, pad_length, pad_string, pad_type) {
    var half = '',
        pad_to_go;
    var str_pad_repeater = function (s, len) {
        var collect = '',
            i;
        while (collect.length < len) {
            collect += s;
        }
        collect = collect.substr(0, len);
        return collect;
    };
    input += '';
    pad_string = pad_string !== undefined ? pad_string : ' ';
    if (pad_type != 'STR_PAD_LEFT' && pad_type != 'STR_PAD_RIGHT' && pad_type != 'STR_PAD_BOTH') {
        pad_type = 'STR_PAD_RIGHT';
    }
    if ((pad_to_go = pad_length - input.length) > 0) {
        if (pad_type == 'STR_PAD_LEFT') {
            input = str_pad_repeater(pad_string, pad_to_go) + input;
        } else if (pad_type == 'STR_PAD_RIGHT') {
            input = input + str_pad_repeater(pad_string, pad_to_go);
        } else if (pad_type == 'STR_PAD_BOTH') {
            half = str_pad_repeater(pad_string, Math.ceil(pad_to_go / 2));
            input = half + input + half;
            input = input.substr(0, pad_length);
        }
    }
    return input;
},
defaultEmail: function (type, textOnly) {
    var $this = this;
    var content = "";
    if (textOnly) {
        $A(getUsableElements()).each(function (elem, i) {
            content += '\n' + $this.strPad(elem.getProperty('text'), 25, ' ', 'STR_PAD_RIGHT');
            content += '{' + elem.getProperty('name') + '}';
        });
        return content;
    }
    var url = this.HTTP_URL;
    content = '<html><body bgcolor="#f7f9fc" class="Created on Form Builder">\n';
    content += '    <table bgcolor="#f7f9fc" width="100%" border="0" cellspacing="0" cellpadding="0">\n';
    content += '    <tr>\n';
    content += '      <td height="30">&nbsp;</td>\n';
    content += '    </tr>\n';
    content += '    <tr>\n';
    content += '      <td align="center"><table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#eeeeee" >\n';
    content += '        <tr>\n';
    content += '          <td width="13" height="30" background="' + url + '/sistema/images/win2_title_left.gif"></td>\n';
    content += '          <td align="left" background="' + url + '/sistema/images/win2_title.gif" valign="bottom"><img style="float:left" src="' + url + '/sistema/images/win2_title_logo.gif" width="63" height="26" alt="Ng Form Builder.com" /></td>\n';
    content += '          <td width="14" background="' + url + '/sistema/images/win2_title_right.gif"></td>\n';
    content += '        </tr>\n';
    content += '      </table>\n';
    content += '      <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#eeeeee" >\n';
    content += '        <tr>\n';
    content += '          <td width="4" background="' + url + '/sistema/images/win2_left.gif"></td>\n';
    content += '          <td align="center" bgcolor="#FFFFFF">\n';
    content += '          <table width="100%" border="0" cellspacing="0" cellpadding="5">\n';
    content += '          <tr>\n';
    content += '              <td bgcolor="#f9f9f9" width="170" style="text-decoration:underline; padding:5px !important;"><b>Question</b></td>\n';
    content += '              <td bgcolor="#f9f9f9" style="text-decoration:underline; padding:5px !important;"><b>Answer</b></td>\n';
    content += '          </tr>\n';
    $A(getUsableElements()).each(function (elem, i) {
        var alt = (i % 2 !== 0) ? "#f9f9f9" : "white";
        content += "<tr>\n";
        content += '<td bgcolor="' + alt + '" style="padding:5px !important;" width="170">' + elem.getProperty('text') + '</td>';
        content += '<td bgcolor="' + alt + '" style="padding:5px !important;">{' + elem.getProperty('name') + '}</td>';
        content += "</tr>\n";
    });
    content += '            </table>\n';
    content += '          </td>\n';
    content += '          <td width="4" background="' + url + '/sistema/images/win2_right.gif"></td>\n';
    content += '        </tr>\n';
    content += '        <tr>\n';
    content += '          <td height="4" background="' + url + '/sistema/images/win2_foot_left.gif" style="font-size:4px;"></td>\n';
    content += '          <td background="' + url + '/sistema/images/win2_foot.gif" style="font-size:4px;"></td>\n';
    content += '          <td background="' + url + '/sistema/images/win2_foot_right.gif" style="font-size:4px;"></td>\n';
    content += '        </tr>\n';
    content += '      </table></td>\n';
    content += '    </tr>\n';
    content += '    <tr>\n';
    content += '      <td height="30">&nbsp;</td>\n';
    content += '    </tr>\n';
    content += '  </table><br /><br /><p></p></body></html><pre>\n';
    return content;
    type = type || 'notification';
    var def = '<div style="height:100%; width:100%; background:#999; min-height:300px; display:inline-block;">';
    def += '<div style="margin:50px auto; border:1px solid #666; background:#fff;-moz-box-shadow:0 0 11px rgba(0,0,0,0.5);-webkit-box-shadow:0 0 11px rgba(0,0,0,0.5); width:530px">';
    def += '<div style="background:none repeat scroll 0 0 #454545;border-bottom:1px solid #222;font-size:14px;color:#fff; height:34px;">';
    def += '<div style="padding:8px; float:left;">';
    if (type == 'autorespond') {
        def += 'Thank you for filling out our form.'.locale();
    } else {
        def += 'New Submission'.locale();
    }
    def += '</div>';
    def += '<a href="' + Utils.HTTP_URL + '">';
    def += '<img src="' + Utils.HTTP_URL + '/sistema/images/logo-small.png" align="right" border="0" />';
    def += '</a>';
    def += '</div>';
    def += '<div style="list-style:none;">';
    $A(getUsableElements()).each(function (elem) {
        def += '<li id="email-list-item-' + elem.getProperty('qid') + '" style="margin:10px;"><div style="display:inline-block; width:100%;">';
        var align = elem.getProperty('labelAlign');
        if (elem.getProperty('labelAlign') == "Auto") {
            align = form.getProperty('alignment');
        }
        if (align == 'Right') {
            def += '<div id="email-list-label-' + elem.getProperty('qid') + '" style="font-weight:bold;float:left;clear:left;width:' + form.getProperty('labelWidth') + 'px;text-align:right;">' + elem.getProperty('text') + '</div>';
        } else if (align == 'Top') {
            def += '<div style="font-weight:bold; padding:5px 0;" >' + elem.getProperty('text') + '</div>';
        } else {
            def += '<div style="font-weight:bold;float:left;clear:left;width:' + form.getProperty('labelWidth') + 'px;">' + elem.getProperty('text') + '</div>';
        }
        def += '<div>{' + elem.getProperty('name') + '}</div>';
        def += '</div></li>';
    });
    def += '</div>';
    def += '<div style="background:#454545;border-top:1px solid #222;font-size:12px;padding:10px; color:#fff; text-align:right">';
    if (type == 'autorespond') {
        def += 'You can edit your submission by visiting this link {edit_link}';
    } else {
        if (form.getProperty('id')) {
            def += '<a href="' + Utils.HTTP_URL + 'submissions/' + form.getProperty('id') + '" style="color:#fff">';
            def += 'View this submission on Ng Form Builder'.locale();
            def += '</a>';
        } else {
            def += '<a href="' + Utils.HTTP_URL + '" style="color:#fff">';
            def += 'View this submission on Ng Form Builder'.locale();
            def += '</a>';
        }
    }
    def += '</div>';
    def += '</div></div>';
    return def;
},
sendEmail: function () {
    var fromField = $('fromField');
    var toField = $('toField');
    var subjectField = $('subjectField');
    var messageField = $('emailSource');
    $(fromField, toField).invoke("removeClassName", "error");
    if (!Utils.checkEmailFormat(fromField.value)) {
        fromField.addClassName('error');
        return;
    }
    if (!Utils.checkEmailFormat(toField.value)) {
        toField.addClassName('error');
        return;
    }
    Utils.Request({
        parameters: {
            action: "sendEmail",
            from: fromField.value,
            to: toField.value,
            subject: subjectField.value,
            body: Editor.getContent(messageField.id)
        },
        onSuccess: function (res) {
            Utils.alert("Email sent successfully.".locale(),'Error'.locale());
        },
        onFail: function (res) {
            Utils.alert(res.error, 'Error'.locale());
        }
    });
},
getInternetExplorerVersion: function () {
    var rv = -1;
    if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) !== null) {
            rv = parseFloat(RegExp.$1);
        }
    }
    return rv;
}
};
var Common = Class.create(CommonClass);
var Editor = {
    set: function (id, type, callback) {
        callback = callback || Prototype.K;
        if (!type || type == 'simple') {
            tinyMCE.init({
                mode: 'exact',
                elements: id,
                theme: 'advanced',
                skin: 'o2k7',
                skin_variant: "silver",
                convert_urls: true,
                relative_urls: false,
                document_base_url: "http://example.com",
                theme_advanced_buttons1: "bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,forecolor,backcolor,|,fontselect,fontsizeselect,|,link,unlink,anchor,image,cleanup,code",
                theme_advanced_buttons2: '',
                theme_advanced_buttons3: '',
                oninit: callback
            });
        } else if (type == 'advanced') {
            tinyMCE.init({
                mode: 'exact',
                elements: id,
                plugins: 'table,safari',
                theme: 'advanced',
                skin: 'o2k7',
                skin_variant: "silver",
                convert_urls: true,
                relative_urls: false,
                document_base_url: "http://example.com",
                theme_advanced_buttons1: "bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,forecolor,backcolor,|,bullist,numlist,|,outdent,indent,blockquote,|,link,unlink,anchor,image,cleanup,code",
                theme_advanced_buttons2: 'tablecontrols,|,hr,removeformat,visualaid,|,fontselect,fontsizeselect',
                theme_advanced_buttons3: '',
                theme_advanced_toolbar_location: "top",
                theme_advanced_toolbar_align: "left",
                oninit: callback
            });
        } else if (type == "small") {
            tinyMCE.init({
                mode: 'exact',
                elements: id,
                theme: 'advanced',
                skin: 'o2k7',
                skin_variant: "silver",
                convert_urls: true,
                relative_urls: false,
                document_base_url: "http://example.com",
                theme_advanced_buttons1: "bold,italic,underline,strikethrough,|,justifyleft,justifycenter,|,forecolor,backcolor,|,fontsizeselect,|,link,unlink,image,code",
                theme_advanced_buttons2: '',
                theme_advanced_buttons3: '',
                oninit: callback
            });
        } else if (type == "tiny") {
            tinyMCE.init({
                mode: 'exact',
                elements: id,
                theme: 'advanced',
                skin: 'o2k7',
                height: "50",
                skin_variant: "silver",
                convert_urls: true,
                relative_urls: false,
                document_base_url: "http://example.com",
                theme_advanced_buttons1: "bold,italic,underline,strikethrough,link,code",
                theme_advanced_buttons2: '',
                theme_advanced_buttons3: '',
                oninit: callback
            });
        }
        return true;
    },
    remove: function (id) {
        var content = this.getContent(id);
        tinyMCE.execCommand('mceRemoveControl', false, id);
        return content;
    },
    getContent: function (id) {
        var content;
        try {
            content = tinyMCE.get(id).getContent();
        } catch (e) {
            setTimeout(function () {
                content = Editor.getContent(id);
            }, 50);
        }
        return content;
    },
    setContent: function (id, content) {
        try {
            tinyMCE.get(id).setContent(content);
        } catch (e) {
            setTimeout(function () {
                Editor.setContent(id, content);
            }, 50);
        }
    },
    insertContent: function (id, content) {
        tinyMCE.getInstanceById(id).execCommand('mceInsertContent', false, content);
    },
    focus: function (id) {
        tinyMCE.getInstanceById(id).focus();
    },
    addEvent: function (id, event, callback) {
        try {
            tinyMCE.dom.Event.add(tinyMCE.getInstanceById(id).getWin(), event, callback);
        } catch (e) {
            setTimeout(function () {
                Editor.addEvent(id, event, callback);
            }, 50);
        }
    },
    get: function (id) {
        tinyMCE.getInstanceById(id);
    }
};
var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = Base64._utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },
    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = Base64._utf8_decode(output);
        return output;
    },
    _utf8_encode: function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    },
    _utf8_decode: function (utftext) {
        var string = "";
        var i = 0;
        var c = 0,
            c1 = 0,
            c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
};Date.CultureInfo = {
    name: "en-US",
    englishName: "English (United States)",
    nativeName: "English (United States)",
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    amDesignator: "AM",
    pmDesignator: "PM",
    firstDayOfWeek: 0,
    twoDigitYearMax: 2029,
    dateElementOrder: "mdy",
    formatPatterns: {
        shortDate: "M/d/yyyy",
        longDate: "dddd, MMMM dd, yyyy",
        shortTime: "h:mm tt",
        longTime: "h:mm:ss tt",
        fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt",
        sortableDateTime: "yyyy-MM-ddTHH:mm:ss",
        universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ",
        rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT",
        monthDay: "MMMM dd",
        yearMonth: "MMMM, yyyy"
    },
    regexPatterns: {
        jan: /^jan(uary)?/i,
        feb: /^feb(ruary)?/i,
        mar: /^mar(ch)?/i,
        apr: /^apr(il)?/i,
        may: /^may/i,
        jun: /^jun(e)?/i,
        jul: /^jul(y)?/i,
        aug: /^aug(ust)?/i,
        sep: /^sep(t(ember)?)?/i,
        oct: /^oct(ober)?/i,
        nov: /^nov(ember)?/i,
        dec: /^dec(ember)?/i,
        sun: /^su(n(day)?)?/i,
        mon: /^mo(n(day)?)?/i,
        tue: /^tu(e(s(day)?)?)?/i,
        wed: /^we(d(nesday)?)?/i,
        thu: /^th(u(r(s(day)?)?)?)?/i,
        fri: /^fr(i(day)?)?/i,
        sat: /^sa(t(urday)?)?/i,
        future: /^next/i,
        past: /^last|past|prev(ious)?/i,
        add: /^(\+|after|from)/i,
        subtract: /^(\-|before|ago)/i,
        yesterday: /^yesterday/i,
        today: /^t(oday)?/i,
        tomorrow: /^tomorrow/i,
        now: /^n(ow)?/i,
        millisecond: /^ms|milli(second)?s?/i,
        second: /^sec(ond)?s?/i,
        minute: /^min(ute)?s?/i,
        hour: /^h(ou)?rs?/i,
        week: /^w(ee)?k/i,
        month: /^m(o(nth)?s?)?/i,
        day: /^d(ays?)?/i,
        year: /^y((ea)?rs?)?/i,
        shortMeridian: /^(a|p)/i,
        longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i,
        timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt)/i,
        ordinalSuffix: /^\s*(st|nd|rd|th)/i,
        timeContext: /^\s*(\:|a|p)/i
    },
    abbreviatedTimeZoneStandard: {
        GMT: "-000",
        EST: "-0400",
        CST: "-0500",
        MST: "-0600",
        PST: "-0700"
    },
    abbreviatedTimeZoneDST: {
        GMT: "-000",
        EDT: "-0500",
        CDT: "-0600",
        MDT: "-0700",
        PDT: "-0800"
    }
};Date.getMonthNumberFromName = function (name) {
    var n = Date.CultureInfo.monthNames,
        m = Date.CultureInfo.abbreviatedMonthNames,
        s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
            return i;
        }
    }
    return -1;
};Date.getDayNumberFromName = function (name) {
    var n = Date.CultureInfo.dayNames,
        m = Date.CultureInfo.abbreviatedDayNames,
        o = Date.CultureInfo.shortestDayNames,
        s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
            return i;
        }
    }
    return -1;
};Date.isLeapYear = function (year) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
};Date.getDaysInMonth = function (year, month) {
    return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};Date.getTimezoneOffset = function (s, dst) {
    return (dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST[s.toUpperCase()] : Date.CultureInfo.abbreviatedTimeZoneStandard[s.toUpperCase()];
};Date.getTimezoneAbbreviation = function (offset, dst) {
    var n = (dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST : Date.CultureInfo.abbreviatedTimeZoneStandard,
        p;
    for (p in n) {
        if (n[p] === offset) {
            return p;
        }
    }
    return null;
};Date.prototype.clone = function () {
    return new Date(this.getTime());
};Date.prototype.compareTo = function (date) {
    if (isNaN(this)) {
        throw new Error(this);
    }
    if (date instanceof Date && !isNaN(date)) {
        return (this > date) ? 1 : (this < date) ? -1 : 0;
    } else {
        throw new TypeError(date);
    }
};Date.prototype.equals = function (date) {
    return (this.compareTo(date) === 0);
};Date.prototype.between = function (start, end) {
    var t = this.getTime();
    return t >= start.getTime() && t <= end.getTime();
};Date.prototype.addMilliseconds = function (value) {
    this.setMilliseconds(this.getMilliseconds() + value);
    return this;
};Date.prototype.addSeconds = function (value) {
    return this.addMilliseconds(value * 1000);
};Date.prototype.addMinutes = function (value) {
    return this.addMilliseconds(value * 60000);
};Date.prototype.addHours = function (value) {
    return this.addMilliseconds(value * 3600000);
};Date.prototype.addDays = function (value) {
    return this.addMilliseconds(value * 86400000);
};Date.prototype.addWeeks = function (value) {
    return this.addMilliseconds(value * 604800000);
};Date.prototype.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};Date.prototype.addYears = function (value) {
    return this.addMonths(value * 12);
};Date.prototype._add = function (config) {
    if (typeof config == "number") {
        this._orient = config;
        return this;
    }
    var x = config;
    if (x.millisecond || x.milliseconds) {
        this.addMilliseconds(x.millisecond || x.milliseconds);
    }
    if (x.second || x.seconds) {
        this.addSeconds(x.second || x.seconds);
    }
    if (x.minute || x.minutes) {
        this.addMinutes(x.minute || x.minutes);
    }
    if (x.hour || x.hours) {
        this.addHours(x.hour || x.hours);
    }
    if (x.month || x.months) {
        this.addMonths(x.month || x.months);
    }
    if (x.year || x.years) {
        this.addYears(x.year || x.years);
    }
    if (x.day || x.days) {
        this.addDays(x.day || x.days);
    }
    return this;
};Date._validate = function (value, min, max, name) {
    if (typeof value != "number") {
        throw new TypeError(value + " is not a Number.");
    } else if (value < min || value > max) {
        throw new RangeError(value + " is not a valid value for " + name + ".");
    }
    return true;
};Date.validateMillisecond = function (n) {
    return Date._validate(n, 0, 999, "milliseconds");
};Date.validateSecond = function (n) {
    return Date._validate(n, 0, 59, "seconds");
};Date.validateMinute = function (n) {
    return Date._validate(n, 0, 59, "minutes");
};Date.validateHour = function (n) {
    return Date._validate(n, 0, 23, "hours");
};Date.validateDay = function (n, year, month) {
    return Date._validate(n, 1, Date.getDaysInMonth(year, month), "days");
};Date.validateMonth = function (n) {
    return Date._validate(n, 0, 11, "months");
};Date.validateYear = function (n) {
    return Date._validate(n, 1, 9999, "seconds");
};Date.prototype.set = function (config) {
    var x = config;
    if (!x.millisecond && x.millisecond !== 0) {
        x.millisecond = -1;
    }
    if (!x.second && x.second !== 0) {
        x.second = -1;
    }
    if (!x.minute && x.minute !== 0) {
        x.minute = -1;
    }
    if (!x.hour && x.hour !== 0) {
        x.hour = -1;
    }
    if (!x.day && x.day !== 0) {
        x.day = -1;
    }
    if (!x.month && x.month !== 0) {
        x.month = -1;
    }
    if (!x.year && x.year !== 0) {
        x.year = -1;
    }
    if (x.millisecond != -1 && Date.validateMillisecond(x.millisecond)) {
        this.addMilliseconds(x.millisecond - this.getMilliseconds());
    }
    if (x.second != -1 && Date.validateSecond(x.second)) {
        this.addSeconds(x.second - this.getSeconds());
    }
    if (x.minute != -1 && Date.validateMinute(x.minute)) {
        this.addMinutes(x.minute - this.getMinutes());
    }
    if (x.hour != -1 && Date.validateHour(x.hour)) {
        this.addHours(x.hour - this.getHours());
    }
    if (x.month !== -1 && Date.validateMonth(x.month)) {
        this.addMonths(x.month - this.getMonth());
    }
    if (x.year != -1 && Date.validateYear(x.year)) {
        this.addYears(x.year - this.getFullYear());
    }
    if (x.day != -1 && Date.validateDay(x.day, this.getFullYear(), this.getMonth())) {
        this.addDays(x.day - this.getDate());
    }
    if (x.timezone) {
        this.setTimezone(x.timezone);
    }
    if (x.timezoneOffset) {
        this.setTimezoneOffset(x.timezoneOffset);
    }
    return this;
};Date.prototype._clearTime = function () {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
};Date.prototype.isLeapYear = function () {
    var y = this.getFullYear();
    return (((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0));
};Date.prototype.isWeekday = function () {
    return !(this.is().sat() || this.is().sun());
};Date.prototype.getDaysInMonth = function () {
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};Date.prototype.moveToFirstDayOfMonth = function () {
    return this.set({
        day: 1
    });
};Date.prototype.moveToLastDayOfMonth = function () {
    return this.set({
        day: this.getDaysInMonth()
    });
};Date.prototype.moveToDayOfWeek = function (day, orient) {
    var diff = (day - this.getDay() + 7 * (orient || +1)) % 7;
    return this.addDays((diff === 0) ? diff += 7 * (orient || +1) : diff);
};Date.prototype.moveToMonth = function (month, orient) {
    var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
    return this.addMonths((diff === 0) ? diff += 12 * (orient || +1) : diff);
};Date.prototype.getDayOfYear = function () {
    return Math.floor((this - new Date(this.getFullYear(), 0, 1)) / 86400000);
};Date.prototype.getWeekOfYear = function (firstDayOfWeek) {
    var y = this.getFullYear(),
        m = this.getMonth(),
        d = this.getDate();
    var dow = firstDayOfWeek || Date.CultureInfo.firstDayOfWeek;
    var offset = 7 + 1 - new Date(y, 0, 1).getDay();
    if (offset == 8) {
        offset = 1;
    }
    var daynum = ((Date.UTC(y, m, d, 0, 0, 0) - Date.UTC(y, 0, 1, 0, 0, 0)) / 86400000) + 1;
    var w = Math.floor((daynum - offset + 7) / 7);
    if (w === dow) {
        y--;
        var prevOffset = 7 + 1 - new Date(y, 0, 1).getDay();
        if (prevOffset == 2 || prevOffset == 8) {
            w = 53;
        } else {
            w = 52;
        }
    }
    return w;
};Date.prototype.isDST = function () {
    return this.toString().match(/(E|C|M|P)(S|D)T/)[2] == "D";
};Date.prototype._getTimezone = function () {
    return Date.getTimezoneAbbreviation(this.getUTCOffset, this.isDST());
};Date.prototype.setTimezoneOffset = function (s) {
    var here = this.getTimezoneOffset(),
        there = Number(s) * -6 / 10;
    this.addMinutes(there - here);
    return this;
};Date.prototype.setTimezone = function (s) {
    return this.setTimezoneOffset(Date.getTimezoneOffset(s));
};Date.prototype.getUTCOffset = function () {
    var n = this.getTimezoneOffset() * -10 / 6,
        r;
    if (n < 0) {
        r = (n - 10000).toString();
        return r[0] + r.substr(2);
    } else {
        r = (n + 10000).toString();
        return "+" + r.substr(1);
    }
};Date.prototype.getDayName = function (abbrev) {
    return abbrev ? Date.CultureInfo.abbreviatedDayNames[this.getDay()] : Date.CultureInfo.dayNames[this.getDay()];
};Date.prototype.getMonthName = function (abbrev) {
    return abbrev ? Date.CultureInfo.abbreviatedMonthNames[this.getMonth()] : Date.CultureInfo.monthNames[this.getMonth()];
};Date.prototype._toString = Date.prototype.toString;Date.prototype.toString = function (format) {
    var self = this;
    var p = function p(s) {
        return (s.toString().length == 1) ? "0" + s : s;
    };
    return format ? format.replace(/dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?/g, function (format) {
        switch (format) {
        case "hh":
            return p(self.getHours() < 13 ? self.getHours() : (self.getHours() - 12));
        case "h":
            return self.getHours() < 13 ? self.getHours() : (self.getHours() - 12);
        case "HH":
            return p(self.getHours());
        case "H":
            return self.getHours();
        case "mm":
            return p(self.getMinutes());
        case "m":
            return self.getMinutes();
        case "ss":
            return p(self.getSeconds());
        case "s":
            return self.getSeconds();
        case "yyyy":
            return self.getFullYear();
        case "yy":
            return self.getFullYear().toString().substring(2, 4);
        case "dddd":
            return self.getDayName();
        case "ddd":
            return self.getDayName(true);
        case "dd":
            return p(self.getDate());
        case "d":
            return self.getDate().toString();
        case "MMMM":
            return self.getMonthName();
        case "MMM":
            return self.getMonthName(true);
        case "MM":
            return p((self.getMonth() + 1));
        case "M":
            return self.getMonth() + 1;
        case "t":
            return self.getHours() < 12 ? Date.CultureInfo.amDesignator.substring(0, 1) : Date.CultureInfo.pmDesignator.substring(0, 1);
        case "tt":
            return self.getHours() < 12 ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
        case "zzz":
        case "zz":
        case "z":
            return "";
        }
    }) : this._toString();
};Date.now = function () {
    return new Date();
};Date.today = function () {
    return Date.now()._clearTime();
};Date.prototype._orient = +1;Date.prototype.next = function () {
    this._orient = +1;
    return this;
};Date.prototype.last = Date.prototype.prev = Date.prototype.previous = function () {
    this._orient = -1;
    return this;
};Date.prototype._is = false;Date.prototype.is = function () {
    this._is = true;
    return this;
};Number.prototype._dateElement = "day";Number.prototype.fromNow = function () {
    var c = {};
    c[this._dateElement] = this;
    return Date.now()._add(c);
};Number.prototype.ago = function () {
    var c = {};
    c[this._dateElement] = this * -1;
    return Date.now()._add(c);
};
(function () {
    var $D = Date.prototype,
        $N = Number.prototype;
    var dx = ("sunday monday tuesday wednesday thursday friday saturday").split(/\s/),
        mx = ("january february march april may june july august september october november december").split(/\s/),
        px = ("Millisecond Second Minute Hour Day Week Month Year").split(/\s/),
        de;
    var df = function (n) {
        return function () {
            if (this._is) {
                this._is = false;
                return this.getDay() == n;
            }
            return this.moveToDayOfWeek(n, this._orient);
        };
    };
    for (var i = 0; i < dx.length; i++) {
        $D[dx[i]] = $D[dx[i].substring(0, 3)] = df(i);
    }
    var mf = function (n) {
        return function () {
            if (this._is) {
                this._is = false;
                return this.getMonth() === n;
            }
            return this.moveToMonth(n, this._orient);
        };
    };
    for (var j = 0; j < mx.length; j++) {
        $D[mx[j]] = $D[mx[j].substring(0, 3)] = mf(j);
    }
    var ef = function (j) {
        return function () {
            if (j.substring(j.length - 1) != "s") {
                j += "s";
            }
            return this["add" + j](this._orient);
        };
    };
    var nf = function (n) {
        return function () {
            this._dateElement = n;
            return this;
        };
    };
    for (var k = 0; k < px.length; k++) {
        de = px[k].toLowerCase();
        $D[de] = $D[de + "s"] = ef(px[k]);
        $N[de] = $N[de + "s"] = nf(de);
    }
}());Date.prototype.toJSONString = function () {
    return this.toString("yyyy-MM-ddThh:mm:ssZ");
};Date.prototype.toShortDateString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.shortDatePattern);
};Date.prototype.toLongDateString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.longDatePattern);
};Date.prototype.toShortTimeString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.shortTimePattern);
};Date.prototype.toLongTimeString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.longTimePattern);
};Date.prototype.getOrdinal = function () {
    switch (this.getDate()) {
    case 1:
    case 21:
    case 31:
        return "st";
    case 2:
    case 22:
        return "nd";
    case 3:
    case 23:
        return "rd";
    default:
        return "th";
    }
};
(function () {
    Date.Parsing = {
        Exception: function (s) {
            this.message = "Parse error at '" + s.substring(0, 10) + " ...'";
        }
    };
    var $P = Date.Parsing;
    var _ = $P.Operators = {
        rtoken: function (r) {
            return function (s) {
                var mx = s.match(r);
                if (mx) {
                    return ([mx[0], s.substring(mx[0].length)]);
                } else {
                    throw new $P.Exception(s);
                }
            };
        },
        token: function (s) {
            return function (s) {
                return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s);
            };
        },
        stoken: function (s) {
            return _.rtoken(new RegExp("^" + s));
        },
        until: function (p) {
            return function (s) {
                var qx = [],
                    rx = null;
                while (s.length) {
                    try {
                        rx = p.call(this, s);
                    } catch (e) {
                        qx.push(rx[0]);
                        s = rx[1];
                        continue;
                    }
                    break;
                }
                return [qx, s];
            };
        },
        many: function (p) {
            return function (s) {
                var rx = [],
                    r = null;
                while (s.length) {
                    try {
                        r = p.call(this, s);
                    } catch (e) {
                        return [rx, s];
                    }
                    rx.push(r[0]);
                    s = r[1];
                }
                return [rx, s];
            };
        },
        optional: function (p) {
            return function (s) {
                var r = null;
                try {
                    r = p.call(this, s);
                } catch (e) {
                    return [null, s];
                }
                return [r[0], r[1]];
            };
        },
        not: function (p) {
            return function (s) {
                try {
                    p.call(this, s);
                } catch (e) {
                    return [null, s];
                }
                throw new $P.Exception(s);
            };
        },
        ignore: function (p) {
            return p ?
            function (s) {
                var r = null;
                r = p.call(this, s);
                return [null, r[1]];
            } : null;
        },
        product: function () {
            var px = arguments[0],
                qx = Array.prototype.slice.call(arguments, 1),
                rx = [];
            for (var i = 0; i < px.length; i++) {
                rx.push(_.each(px[i], qx));
            }
            return rx;
        },
        cache: function (rule) {
            var cache = {},
                r = null;
            return function (s) {
                try {
                    r = cache[s] = (cache[s] || rule.call(this, s));
                } catch (e) {
                    r = cache[s] = e;
                }
                if (r instanceof $P.Exception) {
                    throw r;
                } else {
                    return r;
                }
            };
        },
        any: function () {
            var px = arguments;
            return function (s) {
                var r = null;
                for (var i = 0; i < px.length; i++) {
                    if (px[i] == null) {
                        continue;
                    }
                    try {
                        r = (px[i].call(this, s));
                    } catch (e) {
                        r = null;
                    }
                    if (r) {
                        return r;
                    }
                }
                throw new $P.Exception(s);
            };
        },
        each: function () {
            var px = arguments;
            return function (s) {
                var rx = [],
                    r = null;
                for (var i = 0; i < px.length; i++) {
                    if (px[i] == null) {
                        continue;
                    }
                    try {
                        r = (px[i].call(this, s));
                    } catch (e) {
                        throw new $P.Exception(s);
                    }
                    rx.push(r[0]);
                    s = r[1];
                }
                return [rx, s];
            };
        },
        all: function () {
            var px = arguments,
                _ = _;
            return _.each(_.optional(px));
        },
        sequence: function (px, d, c) {
            d = d || _.rtoken(/^\s*/);
            c = c || null;
            if (px.length == 1) {
                return px[0];
            }
            return function (s) {
                var r = null,
                    q = null;
                var rx = [];
                for (var i = 0; i < px.length; i++) {
                    try {
                        r = px[i].call(this, s);
                    } catch (e) {
                        break;
                    }
                    rx.push(r[0]);
                    try {
                        q = d.call(this, r[1]);
                    } catch (ex) {
                        q = null;
                        break;
                    }
                    s = q[1];
                }
                if (!r) {
                    throw new $P.Exception(s);
                }
                if (q) {
                    throw new $P.Exception(q[1]);
                }
                if (c) {
                    try {
                        r = c.call(this, r[1]);
                    } catch (ey) {
                        throw new $P.Exception(r[1]);
                    }
                }
                return [rx, (r ? r[1] : s)];
            };
        },
        between: function (d1, p, d2) {
            d2 = d2 || d1;
            var _fn = _.each(_.ignore(d1), p, _.ignore(d2));
            return function (s) {
                var rx = _fn.call(this, s);
                return [[rx[0][0], r[0][2]], rx[1]];
            };
        },
        list: function (p, d, c) {
            d = d || _.rtoken(/^\s*/);
            c = c || null;
            return (p instanceof Array ? _.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) : _.each(_.many(_.each(p, _.ignore(d))), px, _.ignore(c)));
        },
        set: function (px, d, c) {
            d = d || _.rtoken(/^\s*/);
            c = c || null;
            return function (s) {
                var r = null,
                    p = null,
                    q = null,
                    rx = null,
                    best = [
                        [], s],
                    last = false;
                for (var i = 0; i < px.length; i++) {
                    q = null;
                    p = null;
                    r = null;
                    last = (px.length == 1);
                    try {
                        r = px[i].call(this, s);
                    } catch (e) {
                        continue;
                    }
                    rx = [
                        [r[0]], r[1]
                    ];
                    if (r[1].length > 0 && !last) {
                        try {
                            q = d.call(this, r[1]);
                        } catch (ex) {
                            last = true;
                        }
                    } else {
                        last = true;
                    }
                    if (!last && q[1].length === 0) {
                        last = true;
                    }
                    if (!last) {
                        var qx = [];
                        for (var j = 0; j < px.length; j++) {
                            if (i != j) {
                                qx.push(px[j]);
                            }
                        }
                        p = _.set(qx, d).call(this, q[1]);
                        if (p[0].length > 0) {
                            rx[0] = rx[0].concat(p[0]);
                            rx[1] = p[1];
                        }
                    }
                    if (rx[1].length < best[1].length) {
                        best = rx;
                    }
                    if (best[1].length === 0) {
                        break;
                    }
                }
                if (best[0].length === 0) {
                    return best;
                }
                if (c) {
                    try {
                        q = c.call(this, best[1]);
                    } catch (ey) {
                        throw new $P.Exception(best[1]);
                    }
                    best[1] = q[1];
                }
                return best;
            };
        },
        forward: function (gr, fname) {
            return function (s) {
                return gr[fname].call(this, s);
            };
        },
        replace: function (rule, repl) {
            return function (s) {
                var r = rule.call(this, s);
                return [repl, r[1]];
            };
        },
        process: function (rule, fn) {
            return function (s) {
                var r = rule.call(this, s);
                return [fn.call(this, r[0]), r[1]];
            };
        },
        min: function (min, rule) {
            return function (s) {
                var rx = rule.call(this, s);
                if (rx[0].length < min) {
                    throw new $P.Exception(s);
                }
                return rx;
            };
        }
    };
    var _generator = function (op) {
        return function () {
            var args = null,
                rx = [];
            if (arguments.length > 1) {
                args = Array.prototype.slice.call(arguments);
            } else if (arguments[0] instanceof Array) {
                args = arguments[0];
            }
            if (args) {
                for (var i = 0, px = args.shift(); i < px.length; i++) {
                    args.unshift(px[i]);
                    rx.push(op.apply(null, args));
                    args.shift();
                    return rx;
                }
            } else {
                return op.apply(null, arguments);
            }
        };
    };
    var gx = "optional not ignore cache".split(/\s/);
    for (var i = 0; i < gx.length; i++) {
        _[gx[i]] = _generator(_[gx[i]]);
    }
    var _vector = function (op) {
        return function () {
            if (arguments[0] instanceof Array) {
                return op.apply(null, arguments[0]);
            } else {
                return op.apply(null, arguments);
            }
        };
    };
    var vx = "each any all".split(/\s/);
    for (var j = 0; j < vx.length; j++) {
        _[vx[j]] = _vector(_[vx[j]]);
    }
}());
(function () {
    var flattenAndCompact = function (ax) {
        var rx = [];
        for (var i = 0; i < ax.length; i++) {
            if (ax[i] instanceof Array) {
                rx = rx.concat(flattenAndCompact(ax[i]));
            } else {
                if (ax[i]) {
                    rx.push(ax[i]);
                }
            }
        }
        return rx;
    };
    Date.Grammar = {};
    Date.Translator = {
        hour: function (s) {
            return function () {
                this.hour = Number(s);
            };
        },
        minute: function (s) {
            return function () {
                this.minute = Number(s);
            };
        },
        second: function (s) {
            return function () {
                this.second = Number(s);
            };
        },
        meridian: function (s) {
            return function () {
                this.meridian = s.slice(0, 1).toLowerCase();
            };
        },
        timezone: function (s) {
            return function () {
                var n = s.replace(/[^\d\+\-]/g, "");
                if (n.length) {
                    this.timezoneOffset = Number(n);
                } else {
                    this.timezone = s.toLowerCase();
                }
            };
        },
        day: function (x) {
            var s = x[0];
            return function () {
                this.day = Number(s.match(/\d+/)[0]);
            };
        },
        month: function (s) {
            return function () {
                this.month = ((s.length == 3) ? Date.getMonthNumberFromName(s) : (Number(s) - 1));
            };
        },
        year: function (s) {
            return function () {
                var n = Number(s);
                this.year = ((s.length > 2) ? n : (n + (((n + 2000) < Date.CultureInfo.twoDigitYearMax) ? 2000 : 1900)));
            };
        },
        rday: function (s) {
            return function () {
                switch (s) {
                case "yesterday":
                    this.days = -1;
                    break;
                case "tomorrow":
                    this.days = 1;
                    break;
                case "today":
                    this.days = 0;
                    break;
                case "now":
                    this.days = 0;
                    this.now = true;
                    break;
                }
            };
        },
        finishExact: function (x) {
            x = (x instanceof Array) ? x : [x];
            var now = new Date();
            this.year = now.getFullYear();
            this.month = now.getMonth();
            this.day = 1;
            this.hour = 0;
            this.minute = 0;
            this.second = 0;
            for (var i = 0; i < x.length; i++) {
                if (x[i]) {
                    x[i].call(this);
                }
            }
            this.hour = (this.meridian == "p" && this.hour < 13) ? this.hour + 12 : this.hour;
            if (this.day > Date.getDaysInMonth(this.year, this.month)) {
                throw new RangeError(this.day + " is not a valid value for days.");
            }
            var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second);
            if (this.timezone) {
                r.set({
                    timezone: this.timezone
                });
            } else if (this.timezoneOffset) {
                r.set({
                    timezoneOffset: this.timezoneOffset
                });
            }
            return r;
        },
        finish: function (x) {
            x = (x instanceof Array) ? flattenAndCompact(x) : [x];
            if (x.length === 0) {
                return null;
            }
            for (var i = 0; i < x.length; i++) {
                if (typeof x[i] == "function") {
                    x[i].call(this);
                }
            }
            if (this.now) {
                return new Date();
            }
            var today = Date.today();
            var method = null;
            var expression = !! (this.days != null || this.orient || this.operator);
            if (expression) {
                var gap, mod, orient;
                orient = ((this.orient == "past" || this.operator == "subtract") ? -1 : 1);
                if (this.weekday) {
                    this.unit = "day";
                    gap = (Date.getDayNumberFromName(this.weekday) - today.getDay());
                    mod = 7;
                    this.days = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
                }
                if (this.month) {
                    this.unit = "month";
                    gap = (this.month - today.getMonth());
                    mod = 12;
                    this.months = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
                    this.month = null;
                }
                if (!this.unit) {
                    this.unit = "day";
                }
                if (this[this.unit + "s"] == null || this.operator != null) {
                    if (!this.value) {
                        this.value = 1;
                    }
                    if (this.unit == "week") {
                        this.unit = "day";
                        this.value = this.value * 7;
                    }
                    this[this.unit + "s"] = this.value * orient;
                }
                return today._add(this);
            } else {
                if (this.meridian && this.hour) {
                    this.hour = (this.hour < 13 && this.meridian == "p") ? this.hour + 12 : this.hour;
                }
                if (this.weekday && !this.day) {
                    this.day = (today.addDays((Date.getDayNumberFromName(this.weekday) - today.getDay()))).getDate();
                }
                if (this.month && !this.day) {
                    this.day = 1;
                }
                return today.set(this);
            }
        }
    };
    var _ = Date.Parsing.Operators,
        g = Date.Grammar,
        t = Date.Translator,
        _fn;
    g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/);
    g.timePartDelimiter = _.stoken(":");
    g.whiteSpace = _.rtoken(/^\s*/);
    g.generalDelimiter = _.rtoken(/^(([\s\,]|at|on)+)/);
    var _C = {};
    g.ctoken = function (keys) {
        var fn = _C[keys];
        if (!fn) {
            var c = Date.CultureInfo.regexPatterns;
            var kx = keys.split(/\s+/),
                px = [];
            for (var i = 0; i < kx.length; i++) {
                px.push(_.replace(_.rtoken(c[kx[i]]), kx[i]));
            }
            fn = _C[keys] = _.any.apply(null, px);
        }
        return fn;
    };
    g.ctoken2 = function (key) {
        return _.rtoken(Date.CultureInfo.regexPatterns[key]);
    };
    g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour));
    g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour));
    g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour));
    g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour));
    g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute));
    g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute));
    g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second));
    g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second));
    g.hms = _.cache(_.sequence([g.H, g.mm, g.ss], g.timePartDelimiter));
    g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian));
    g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian));
    g.z = _.cache(_.process(_.rtoken(/^(\+|\-)?\s*\d\d\d\d?/), t.timezone));
    g.zz = _.cache(_.process(_.rtoken(/^(\+|\-)\s*\d\d\d\d/), t.timezone));
    g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone));
    g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([g.tt, g.zzz]));
    g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix);
    g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
    g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
    g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"), function (s) {
        return function () {
            this.weekday = s;
        };
    }));
    g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month));
    g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month));
    g.MMM = g.MMMM = _.cache(_.process(g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month));
    g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year));
    g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year));
    g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year));
    g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year));
    _fn = function () {
        return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext")));
    };
    g.day = _fn(g.d, g.dd);
    g.month = _fn(g.M, g.MMM);
    g.year = _fn(g.yyyy, g.yy);
    g.orientation = _.process(g.ctoken("past future"), function (s) {
        return function () {
            this.orient = s;
        };
    });
    g.operator = _.process(g.ctoken("add subtract"), function (s) {
        return function () {
            this.operator = s;
        };
    });
    g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday);
    g.unit = _.process(g.ctoken("minute hour day week month year"), function (s) {
        return function () {
            this.unit = s;
        };
    });
    g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/), function (s) {
        return function () {
            this.value = s.replace(/\D/g, "");
        };
    });
    g.expression = _.set([g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM]);
    _fn = function () {
        return _.set(arguments, g.datePartDelimiter);
    };
    g.mdy = _fn(g.ddd, g.month, g.day, g.year);
    g.ymd = _fn(g.ddd, g.year, g.month, g.day);
    g.dmy = _fn(g.ddd, g.day, g.month, g.year);
    g.date = function (s) {
        return ((g[Date.CultureInfo.dateElementOrder] || g.mdy).call(this, s));
    };
    g.format = _.process(_.many(_.any(_.process(_.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/), function (fmt) {
        if (g[fmt]) {
            return g[fmt];
        } else {
            throw Date.Parsing.Exception(fmt);
        }
    }), _.process(_.rtoken(/^[^dMyhHmstz]+/), function (s) {
        return _.ignore(_.stoken(s));
    }))), function (rules) {
        return _.process(_.each.apply(null, rules), t.finishExact);
    });
    var _F = {};
    var _get = function (f) {
        return _F[f] = (_F[f] || g.format(f)[0]);
    };
    g.formats = function (fx) {
        if (fx instanceof Array) {
            var rx = [];
            for (var i = 0; i < fx.length; i++) {
                rx.push(_get(fx[i]));
            }
            return _.any.apply(null, rx);
        } else {
            return _get(fx);
        }
    };
    g._formats = g.formats(["yyyy-MM-ddTHH:mm:ss", "ddd, MMM dd, yyyy H:mm:ss tt", "ddd MMM d yyyy HH:mm:ss zzz", "d"]);
    g._start = _.process(_.set([g.date, g.time, g.expression], g.generalDelimiter, g.whiteSpace), t.finish);
    g.start = function (s) {
        try {
            var r = g._formats.call({}, s);
            if (r[1].length === 0) {
                return r;
            }
        } catch (e) {}
        return g._start.call({}, s);
    };
}());Date._parse = Date.parse;Date.parse = function (s) {
    var r = null;
    if (!s) {
        return null;
    }
    try {
        r = Date.Grammar.start.call({}, s);
    } catch (e) {
        console.error(e);
        return null;
    }
    return ((r[1].length === 0) ? r[0] : null);
};Date.getParseFunction = function (fx) {
    var fn = Date.Grammar.formats(fx);
    return function (s) {
        var r = null;
        try {
            r = fn.call({}, s);
        } catch (e) {
            return null;
        }
        return ((r[1].length === 0) ? r[0] : null);
    };
};Date.parseExact = function (s, fx) {
    return Date.getParseFunction(fx)(s);
};;String.prototype.parseColor = function () {
    var color = '#';
    if (this.slice(0, 4) == 'rgb(') {
        var cols = this.slice(4, this.length - 1).split(',');
        var i = 0;
        do {
            color += parseInt(cols[i]).toColorPart()
        } while (++i < 3);
    } else {
        if (this.slice(0, 1) == '#') {
            if (this.length == 4) for (var i = 1; i < 4; i++) color += (this.charAt(i) + this.charAt(i)).toLowerCase();
            if (this.length == 7) color = this.toLowerCase();
        }
    }
    return (color.length == 7 ? color : (arguments[0] || this));
};Element.collectTextNodes = function (element) {
    return $A($(element).childNodes).collect(function (node) {
        return (node.nodeType == 3 ? node.nodeValue : (node.hasChildNodes() ? Element.collectTextNodes(node) : ''));
    }).flatten().join('');
};Element.collectTextNodesIgnoreClass = function (element, className) {
    return $A($(element).childNodes).collect(function (node) {
        return (node.nodeType == 3 ? node.nodeValue : ((node.hasChildNodes() && !Element.hasClassName(node, className)) ? Element.collectTextNodesIgnoreClass(node, className) : ''));
    }).flatten().join('');
};Element.setContentZoom = function (element, percent) {
    element = $(element);
    element.setStyle({
        fontSize: (percent / 100) + 'em'
    });
    if (Prototype.Browser.WebKit) window.scrollBy(0, 0);
    return element;
};Element.getInlineOpacity = function (element) {
    return $(element).style.opacity || '';
};Element.forceRerendering = function (element) {
    try {
        element = $(element);
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
    } catch (e) {}
};
var Effect = {
    _elementDoesNotExistError: {
        name: 'ElementDoesNotExistError',
        message: 'The specified DOM element does not exist, but is required for this effect to operate'
    },
    Transitions: {
        linear: Prototype.K,
        sinoidal: function (pos) {
            return (-Math.cos(pos * Math.PI) / 2) + .5;
        },
        reverse: function (pos) {
            return 1 - pos;
        },
        flicker: function (pos) {
            var pos = ((-Math.cos(pos * Math.PI) / 4) + .75) + Math.random() / 4;
            return pos > 1 ? 1 : pos;
        },
        wobble: function (pos) {
            return (-Math.cos(pos * Math.PI * (9 * pos)) / 2) + .5;
        },
        pulse: function (pos, pulses) {
            return (-Math.cos((pos * ((pulses || 5) - .5) * 2) * Math.PI) / 2) + .5;
        },
        spring: function (pos) {
            return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
        },
        none: function (pos) {
            return 0;
        },
        full: function (pos) {
            return 1;
        }
    },
    DefaultOptions: {
        duration: 1.0,
        fps: 100,
        sync: false,
        from: 0.0,
        to: 1.0,
        delay: 0.0,
        queue: 'parallel'
    },
    tagifyText: function (element) {
        var tagifyStyle = 'position:relative';
        if (Prototype.Browser.IE) tagifyStyle += ';zoom:1';
        element = $(element);
        $A(element.childNodes).each(function (child) {
            if (child.nodeType == 3) {
                child.nodeValue.toArray().each(function (character) {
                    element.insertBefore(new Element('span', {
                        style: tagifyStyle
                    }).update(character == ' ' ? String.fromCharCode(160) : character), child);
                });
                Element.remove(child);
            }
        });
    },
    multiple: function (element, effect) {
        var elements;
        if (((typeof element == 'object') || Object.isFunction(element)) && (element.length)) elements = element;
        else
        elements = $(element).childNodes;
        var options = Object.extend({
            speed: 0.1,
            delay: 0.0
        }, arguments[2] || {});
        var masterDelay = options.delay;
        $A(elements).each(function (element, index) {
            new effect(element, Object.extend(options, {
                delay: index * options.speed + masterDelay
            }));
        });
    },
    PAIRS: {
        'slide': ['SlideDown', 'SlideUp'],
        'blind': ['BlindDown', 'BlindUp'],
        'appear': ['Appear', 'Fade']
    },
    toggle: function (element, effect, options) {
        element = $(element);
        effect = (effect || 'appear').toLowerCase();
        return Effect[Effect.PAIRS[effect][element.visible() ? 1 : 0]](element, Object.extend({
            queue: {
                position: 'end',
                scope: (element.id || 'global'),
                limit: 1
            }
        }, options || {}));
    }
};Effect.DefaultOptions.transition = Effect.Transitions.sinoidal;Effect.ScopedQueue = Class.create(Enumerable, {
    initialize: function () {
        this.effects = [];
        this.interval = null;
    },
    _each: function (iterator) {
        this.effects._each(iterator);
    },
    add: function (effect) {
        var timestamp = new Date().getTime();
        var position = Object.isString(effect.options.queue) ? effect.options.queue : effect.options.queue.position;
        switch (position) {
        case 'front':
            this.effects.findAll(function (e) {
                return e.state == 'idle'
            }).each(function (e) {
                e.startOn += effect.finishOn;
                e.finishOn += effect.finishOn;
            });
            break;
        case 'with-last':
            timestamp = this.effects.pluck('startOn').max() || timestamp;
            break;
        case 'end':
            timestamp = this.effects.pluck('finishOn').max() || timestamp;
            break;
        }
        effect.startOn += timestamp;
        effect.finishOn += timestamp;
        if (!effect.options.queue.limit || (this.effects.length < effect.options.queue.limit)) this.effects.push(effect);
        if (!this.interval) this.interval = setInterval(this.loop.bind(this), 15);
    },
    remove: function (effect) {
        this.effects = this.effects.reject(function (e) {
            return e == effect
        });
        if (this.effects.length == 0) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },
    loop: function () {
        var timePos = new Date().getTime();
        for (var i = 0, len = this.effects.length; i < len; i++)
        this.effects[i] && this.effects[i].loop(timePos);
    }
});Effect.Queues = {
    instances: $H(),
    get: function (queueName) {
        if (!Object.isString(queueName)) return queueName;
        return this.instances.get(queueName) || this.instances.set(queueName, new Effect.ScopedQueue());
    }
};Effect.Queue = Effect.Queues.get('global');Effect.Base = Class.create({
    position: null,
    start: function (options) {
        if (options && options.transition === false) options.transition = Effect.Transitions.linear;
        this.options = Object.extend(Object.extend({}, Effect.DefaultOptions), options || {});
        this.currentFrame = 0;
        this.state = 'idle';
        this.startOn = this.options.delay * 1000;
        this.finishOn = this.startOn + (this.options.duration * 1000);
        this.fromToDelta = this.options.to - this.options.from;
        this.totalTime = this.finishOn - this.startOn;
        this.totalFrames = this.options.fps * this.options.duration;
        this.render = (function () {
            function dispatch(effect, eventName) {
                if (effect.options[eventName + 'Internal']) effect.options[eventName + 'Internal'](effect);
                if (effect.options[eventName]) effect.options[eventName](effect);
            }
            return function (pos) {
                if (this.state === "idle") {
                    this.state = "running";
                    dispatch(this, 'beforeSetup');
                    if (this.setup) this.setup();
                    dispatch(this, 'afterSetup');
                }
                if (this.state === "running") {
                    pos = (this.options.transition(pos) * this.fromToDelta) + this.options.from;
                    this.position = pos;
                    dispatch(this, 'beforeUpdate');
                    if (this.update) this.update(pos);
                    dispatch(this, 'afterUpdate');
                }
            };
        })();
        this.event('beforeStart');
        if (!this.options.sync) Effect.Queues.get(Object.isString(this.options.queue) ? 'global' : this.options.queue.scope).add(this);
    },
    loop: function (timePos) {
        if (timePos >= this.startOn) {
            if (timePos >= this.finishOn) {
                this.render(1.0);
                this.cancel();
                this.event('beforeFinish');
                if (this.finish) this.finish();
                this.event('afterFinish');
                return;
            }
            var pos = (timePos - this.startOn) / this.totalTime,
                frame = (pos * this.totalFrames).round();
            if (frame > this.currentFrame) {
                this.render(pos);
                this.currentFrame = frame;
            }
        }
    },
    cancel: function () {
        if (!this.options.sync) Effect.Queues.get(Object.isString(this.options.queue) ? 'global' : this.options.queue.scope).remove(this);
        this.state = 'finished';
    },
    event: function (eventName) {
        if (this.options[eventName + 'Internal']) this.options[eventName + 'Internal'](this);
        if (this.options[eventName]) this.options[eventName](this);
    },
    inspect: function () {
        var data = $H();
        for (property in this)
        if (!Object.isFunction(this[property])) data.set(property, this[property]);
        return '#<Effect:' + data.inspect() + ',options:' + $H(this.options).inspect() + '>';
    }
});Effect.Parallel = Class.create(Effect.Base, {
    initialize: function (effects) {
        this.effects = effects || [];
        this.start(arguments[1]);
    },
    update: function (position) {
        this.effects.invoke('render', position);
    },
    finish: function (position) {
        this.effects.each(function (effect) {
            effect.render(1.0);
            effect.cancel();
            effect.event('beforeFinish');
            if (effect.finish) effect.finish(position);
            effect.event('afterFinish');
        });
    }
});Effect.Tween = Class.create(Effect.Base, {
    initialize: function (object, from, to) {
        object = Object.isString(object) ? $(object) : object;
        var args = $A(arguments),
            method = args.last(),
            options = args.length == 5 ? args[3] : null;
        this.method = Object.isFunction(method) ? method.bind(object) : Object.isFunction(object[method]) ? object[method].bind(object) : function (value) {
            object[method] = value
        };
        this.start(Object.extend({
            from: from,
            to: to
        }, options || {}));
    },
    update: function (position) {
        this.method(position);
    }
});Effect.Event = Class.create(Effect.Base, {
    initialize: function () {
        this.start(Object.extend({
            duration: 0
        }, arguments[0] || {}));
    },
    update: Prototype.emptyFunction
});Effect.Opacity = Class.create(Effect.Base, {
    initialize: function (element) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        try {
            if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout)) this.element.setStyle({
                zoom: 1
            });
        } catch (e) {}
        var options = Object.extend({
            from: this.element.getOpacity() || 0.0,
            to: 1.0
        }, arguments[1] || {});
        this.start(options);
    },
    update: function (position) {
        this.element.setOpacity(position);
    }
});Effect.Move = Class.create(Effect.Base, {
    initialize: function (element) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        var options = Object.extend({
            x: 0,
            y: 0,
            mode: 'relative'
        }, arguments[1] || {});
        this.start(options);
    },
    setup: function () {
        this.element.makePositioned();
        this.originalLeft = parseFloat(this.element.getStyle('left') || '0');
        this.originalTop = parseFloat(this.element.getStyle('top') || '0');
        if (this.options.mode == 'absolute') {
            this.options.x = this.options.x - this.originalLeft;
            this.options.y = this.options.y - this.originalTop;
        }
    },
    update: function (position) {
        this.element.setStyle({
            left: (this.options.x * position + this.originalLeft).round() + 'px',
            top: (this.options.y * position + this.originalTop).round() + 'px'
        });
    }
});Effect.MoveBy = function (element, toTop, toLeft) {
    return new Effect.Move(element, Object.extend({
        x: toLeft,
        y: toTop
    }, arguments[3] || {}));
};Effect.Scale = Class.create(Effect.Base, {
    initialize: function (element, percent) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        var options = Object.extend({
            scaleX: true,
            scaleY: true,
            scaleContent: true,
            scaleFromCenter: false,
            scaleMode: 'box',
            scaleFrom: 100.0,
            scaleTo: percent
        }, arguments[2] || {});
        this.start(options);
    },
    setup: function () {
        this.restoreAfterFinish = this.options.restoreAfterFinish || false;
        this.elementPositioning = this.element.getStyle('position');
        this.originalStyle = {};
        ['top', 'left', 'width', 'height', 'fontSize'].each(function (k) {
            this.originalStyle[k] = this.element.style[k];
        }.bind(this));
        this.originalTop = this.element.offsetTop;
        this.originalLeft = this.element.offsetLeft;
        var fontSize = this.element.getStyle('font-size') || '100%';
        ['em', 'px', '%', 'pt'].each(function (fontSizeType) {
            if (fontSize.indexOf(fontSizeType) > 0) {
                this.fontSize = parseFloat(fontSize);
                this.fontSizeType = fontSizeType;
            }
        }.bind(this));
        this.factor = (this.options.scaleTo - this.options.scaleFrom) / 100;
        this.dims = null;
        if (this.options.scaleMode == 'box') this.dims = [this.element.offsetHeight, this.element.offsetWidth];
        if (/^content/.test(this.options.scaleMode)) this.dims = [this.element.scrollHeight, this.element.scrollWidth];
        if (!this.dims) this.dims = [this.options.scaleMode.originalHeight, this.options.scaleMode.originalWidth];
    },
    update: function (position) {
        var currentScale = (this.options.scaleFrom / 100.0) + (this.factor * position);
        if (this.options.scaleContent && this.fontSize) this.element.setStyle({
            fontSize: this.fontSize * currentScale + this.fontSizeType
        });
        this.setDimensions(this.dims[0] * currentScale, this.dims[1] * currentScale);
    },
    finish: function (position) {
        if (this.restoreAfterFinish) this.element.setStyle(this.originalStyle);
    },
    setDimensions: function (height, width) {
        var d = {};
        if (this.options.scaleX) d.width = width.round() + 'px';
        if (this.options.scaleY) d.height = height.round() + 'px';
        if (this.options.scaleFromCenter) {
            var topd = (height - this.dims[0]) / 2;
            var leftd = (width - this.dims[1]) / 2;
            if (this.elementPositioning == 'absolute') {
                if (this.options.scaleY) d.top = this.originalTop - topd + 'px';
                if (this.options.scaleX) d.left = this.originalLeft - leftd + 'px';
            } else {
                if (this.options.scaleY) d.top = -topd + 'px';
                if (this.options.scaleX) d.left = -leftd + 'px';
            }
        }
        this.element.setStyle(d);
    }
});Effect.Highlight = Class.create(Effect.Base, {
    initialize: function (element) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        var options = Object.extend({
            startcolor: '#ffff99'
        }, arguments[1] || {});
        this.start(options);
    },
    setup: function () {
        if (this.element.getStyle('display') == 'none') {
            this.cancel();
            return;
        }
        this.oldStyle = {};
        if (!this.options.keepBackgroundImage) {
            this.oldStyle.backgroundImage = this.element.getStyle('background-image');
            this.element.setStyle({
                backgroundImage: 'none'
            });
        }
if (!this.options.endcolor) this.options.endcolor = this.element.getStyle('background-color').parseColor('#ffffff');
if (!this.options.restorecolor) this.options.restorecolor = this.element.getStyle('background-color');
this._base = $R(0, 2).map(function (i) {
    return parseInt(this.options.startcolor.slice(i * 2 + 1, i * 2 + 3), 16)
}.bind(this));
this._delta = $R(0, 2).map(function (i) {
    return parseInt(this.options.endcolor.slice(i * 2 + 1, i * 2 + 3), 16) - this._base[i]
}.bind(this));
}, update: function (position) {
    this.element.setStyle({
        backgroundColor: $R(0, 2).inject('#', function (m, v, i) {
            return m + ((this._base[i] + (this._delta[i] * position)).round().toColorPart());
        }.bind(this))
    });
},
finish: function () {
    this.element.setStyle(Object.extend(this.oldStyle, {
        backgroundColor: this.options.restorecolor
    }));
}
});Effect.ScrollTo = function (element) {
    var options = arguments[1] || {},
        scrollOffsets = document.viewport.getScrollOffsets(),
        elementOffsets = $(element).cumulativeOffset();
    if (options.offset) elementOffsets[1] += options.offset;
    return new Effect.Tween(null, scrollOffsets.top, elementOffsets[1], options, function (p) {
        scrollTo(scrollOffsets.left, p.round());
    });
};Effect.Fade = function (element) {
    element = $(element);
    var oldOpacity = element.getInlineOpacity();
    var options = Object.extend({
        from: element.getOpacity() || 1.0,
        to: 0.0,
        afterFinishInternal: function (effect) {
            if (effect.options.to != 0) return;
            effect.element.hide().setStyle({
                opacity: oldOpacity
            });
        }
    }, arguments[1] || {});
    return new Effect.Opacity(element, options);
};Effect.Appear = function (element) {
    element = $(element);
    var options = Object.extend({
        from: (element.getStyle('display') == 'none' ? 0.0 : element.getOpacity() || 0.0),
        to: 1.0,
        afterFinishInternal: function (effect) {
            effect.element.forceRerendering();
        },
        beforeSetup: function (effect) {
            effect.element.setOpacity(effect.options.from).show();
        }
    }, arguments[1] || {});
    return new Effect.Opacity(element, options);
};Effect.Puff = function (element) {
    element = $(element);
    var oldStyle = {
        opacity: element.getInlineOpacity(),
        position: element.getStyle('position'),
        top: element.style.top,
        left: element.style.left,
        width: element.style.width,
        height: element.style.height
    };
    return new Effect.Parallel([new Effect.Scale(element, 200, {
        sync: true,
        scaleFromCenter: true,
        scaleContent: true,
        restoreAfterFinish: true
    }), new Effect.Opacity(element, {
        sync: true,
        to: 0.0
    })], Object.extend({
        duration: 1.0,
        beforeSetupInternal: function (effect) {
            Position.absolutize(effect.effects[0].element);
        },
        afterFinishInternal: function (effect) {
            effect.effects[0].element.hide().setStyle(oldStyle);
        }
    }, arguments[1] || {}));
};Effect.BlindUp = function (element) {
    element = $(element);
    element.makeClipping();
    return new Effect.Scale(element, 0, Object.extend({
        scaleContent: false,
        scaleX: false,
        restoreAfterFinish: true,
        afterFinishInternal: function (effect) {
            effect.element.hide().undoClipping();
        }
    }, arguments[1] || {}));
};Effect.BlindDown = function (element) {
    element = $(element);
    var elementDimensions = element.getDimensions();
    return new Effect.Scale(element, 100, Object.extend({
        scaleContent: false,
        scaleX: false,
        scaleFrom: 0,
        scaleMode: {
            originalHeight: elementDimensions.height,
            originalWidth: elementDimensions.width
        },
        restoreAfterFinish: true,
        afterSetup: function (effect) {
            effect.element.makeClipping().setStyle({
                height: '0px'
            }).show();
        },
        afterFinishInternal: function (effect) {
            effect.element.undoClipping();
        }
    }, arguments[1] || {}));
};Effect.SwitchOff = function (element) {
    element = $(element);
    var oldOpacity = element.getInlineOpacity();
    return new Effect.Appear(element, Object.extend({
        duration: 0.4,
        from: 0,
        transition: Effect.Transitions.flicker,
        afterFinishInternal: function (effect) {
            new Effect.Scale(effect.element, 1, {
                duration: 0.3,
                scaleFromCenter: true,
                scaleX: false,
                scaleContent: false,
                restoreAfterFinish: true,
                beforeSetup: function (effect) {
                    effect.element.makePositioned().makeClipping();
                },
                afterFinishInternal: function (effect) {
                    effect.element.hide().undoClipping().undoPositioned().setStyle({
                        opacity: oldOpacity
                    });
                }
            });
        }
    }, arguments[1] || {}));
};Effect.DropOut = function (element) {
    element = $(element);
    var oldStyle = {
        top: element.getStyle('top'),
        left: element.getStyle('left'),
        opacity: element.getInlineOpacity()
    };
    return new Effect.Parallel([new Effect.Move(element, {
        x: 0,
        y: 100,
        sync: true
    }), new Effect.Opacity(element, {
        sync: true,
        to: 0.0
    })], Object.extend({
        duration: 0.5,
        beforeSetup: function (effect) {
            effect.effects[0].element.makePositioned();
        },
        afterFinishInternal: function (effect) {
            effect.effects[0].element.hide().undoPositioned().setStyle(oldStyle);
        }
    }, arguments[1] || {}));
};Effect.Shake = function (element) {
    element = $(element);
    var options = Object.extend({
        distance: 20,
        duration: 0.5
    }, arguments[1] || {});
    var distance = parseFloat(options.distance);
    var split = parseFloat(options.duration) / 10.0;
    var oldStyle = {
        top: element.getStyle('top'),
        left: element.getStyle('left')
    };
    return new Effect.Move(element, {
        x: distance,
        y: 0,
        duration: split,
        afterFinishInternal: function (effect) {
            new Effect.Move(effect.element, {
                x: -distance * 2,
                y: 0,
                duration: split * 2,
                afterFinishInternal: function (effect) {
                    new Effect.Move(effect.element, {
                        x: distance * 2,
                        y: 0,
                        duration: split * 2,
                        afterFinishInternal: function (effect) {
                            new Effect.Move(effect.element, {
                                x: -distance * 2,
                                y: 0,
                                duration: split * 2,
                                afterFinishInternal: function (effect) {
                                    new Effect.Move(effect.element, {
                                        x: distance * 2,
                                        y: 0,
                                        duration: split * 2,
                                        afterFinishInternal: function (effect) {
                                            new Effect.Move(effect.element, {
                                                x: -distance,
                                                y: 0,
                                                duration: split,
                                                afterFinishInternal: function (effect) {
                                                    effect.element.undoPositioned().setStyle(oldStyle);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};Effect.SlideDown = function (element) {
    element = $(element).cleanWhitespace();
    var oldInnerBottom = element.down().getStyle('bottom');
    var elementDimensions = element.getDimensions();
    return new Effect.Scale(element, 100, Object.extend({
        scaleContent: false,
        scaleX: false,
        scaleFrom: window.opera ? 0 : 1,
        scaleMode: {
            originalHeight: elementDimensions.height,
            originalWidth: elementDimensions.width
        },
        restoreAfterFinish: true,
        afterSetup: function (effect) {
            effect.element.makePositioned();
            effect.element.down().makePositioned();
            if (window.opera) effect.element.setStyle({
                top: ''
            });
            effect.element.makeClipping().setStyle({
                height: '0px'
            }).show();
        },
        afterUpdateInternal: function (effect) {
            effect.element.down().setStyle({
                bottom: (effect.dims[0] - effect.element.clientHeight) + 'px'
            });
        },
        afterFinishInternal: function (effect) {
            effect.element.undoClipping().undoPositioned();
            effect.element.down().undoPositioned().setStyle({
                bottom: oldInnerBottom
            });
        }
    }, arguments[1] || {}));
};Effect.SlideUp = function (element) {
    element = $(element).cleanWhitespace();
    var oldInnerBottom = element.down().getStyle('bottom');
    var elementDimensions = element.getDimensions();
    return new Effect.Scale(element, window.opera ? 0 : 1, Object.extend({
        scaleContent: false,
        scaleX: false,
        scaleMode: 'box',
        scaleFrom: 100,
        scaleMode: {
            originalHeight: elementDimensions.height,
            originalWidth: elementDimensions.width
        },
        restoreAfterFinish: true,
        afterSetup: function (effect) {
            effect.element.makePositioned();
            effect.element.down().makePositioned();
            if (window.opera) effect.element.setStyle({
                top: ''
            });
            effect.element.makeClipping().show();
        },
        afterUpdateInternal: function (effect) {
            effect.element.down().setStyle({
                bottom: (effect.dims[0] - effect.element.clientHeight) + 'px'
            });
        },
        afterFinishInternal: function (effect) {
            effect.element.hide().undoClipping().undoPositioned();
            effect.element.down().undoPositioned().setStyle({
                bottom: oldInnerBottom
            });
        }
    }, arguments[1] || {}));
};Effect.Squish = function (element) {
    return new Effect.Scale(element, window.opera ? 1 : 0, {
        restoreAfterFinish: true,
        beforeSetup: function (effect) {
            effect.element.makeClipping();
        },
        afterFinishInternal: function (effect) {
            effect.element.hide().undoClipping();
        }
    });
};Effect.Grow = function (element) {
    element = $(element);
    var options = Object.extend({
        direction: 'center',
        moveTransition: Effect.Transitions.sinoidal,
        scaleTransition: Effect.Transitions.sinoidal,
        opacityTransition: Effect.Transitions.full
    }, arguments[1] || {});
    var oldStyle = {
        top: element.style.top,
        left: element.style.left,
        height: element.style.height,
        width: element.style.width,
        opacity: element.getInlineOpacity()
    };
    var dims = element.getDimensions();
    var initialMoveX, initialMoveY;
    var moveX, moveY;
    switch (options.direction) {
    case 'top-left':
        initialMoveX = initialMoveY = moveX = moveY = 0;
        break;
    case 'top-right':
        initialMoveX = dims.width;
        initialMoveY = moveY = 0;
        moveX = -dims.width;
        break;
    case 'bottom-left':
        initialMoveX = moveX = 0;
        initialMoveY = dims.height;
        moveY = -dims.height;
        break;
    case 'bottom-right':
        initialMoveX = dims.width;
        initialMoveY = dims.height;
        moveX = -dims.width;
        moveY = -dims.height;
        break;
    case 'center':
        initialMoveX = dims.width / 2;
        initialMoveY = dims.height / 2;
        moveX = -dims.width / 2;
        moveY = -dims.height / 2;
        break;
    }
    return new Effect.Move(element, {
        x: initialMoveX,
        y: initialMoveY,
        duration: 0.01,
        beforeSetup: function (effect) {
            effect.element.hide().makeClipping().makePositioned();
        },
        afterFinishInternal: function (effect) {
            new Effect.Parallel([new Effect.Opacity(effect.element, {
                sync: true,
                to: 1.0,
                from: 0.0,
                transition: options.opacityTransition
            }), new Effect.Move(effect.element, {
                x: moveX,
                y: moveY,
                sync: true,
                transition: options.moveTransition
            }), new Effect.Scale(effect.element, 100, {
                scaleMode: {
                    originalHeight: dims.height,
                    originalWidth: dims.width
                },
                sync: true,
                scaleFrom: window.opera ? 1 : 0,
                transition: options.scaleTransition,
                restoreAfterFinish: true
            })], Object.extend({
                beforeSetup: function (effect) {
                    effect.effects[0].element.setStyle({
                        height: '0px'
                    }).show();
                },
                afterFinishInternal: function (effect) {
                    effect.effects[0].element.undoClipping().undoPositioned().setStyle(oldStyle);
                }
            }, options));
        }
    });
};Effect.Shrink = function (element) {
    element = $(element);
    var options = Object.extend({
        direction: 'center',
        moveTransition: Effect.Transitions.sinoidal,
        scaleTransition: Effect.Transitions.sinoidal,
        opacityTransition: Effect.Transitions.none
    }, arguments[1] || {});
    var oldStyle = {
        top: element.style.top,
        left: element.style.left,
        height: element.style.height,
        width: element.style.width,
        opacity: element.getInlineOpacity()
    };
    var dims = element.getDimensions();
    var moveX, moveY;
    switch (options.direction) {
    case 'top-left':
        moveX = moveY = 0;
        break;
    case 'top-right':
        moveX = dims.width;
        moveY = 0;
        break;
    case 'bottom-left':
        moveX = 0;
        moveY = dims.height;
        break;
    case 'bottom-right':
        moveX = dims.width;
        moveY = dims.height;
        break;
    case 'center':
        moveX = dims.width / 2;
        moveY = dims.height / 2;
        break;
    }
    return new Effect.Parallel([new Effect.Opacity(element, {
        sync: true,
        to: 0.0,
        from: 1.0,
        transition: options.opacityTransition
    }), new Effect.Scale(element, window.opera ? 1 : 0, {
        sync: true,
        transition: options.scaleTransition,
        restoreAfterFinish: true
    }), new Effect.Move(element, {
        x: moveX,
        y: moveY,
        sync: true,
        transition: options.moveTransition
    })], Object.extend({
        beforeStartInternal: function (effect) {
            effect.effects[0].element.makePositioned().makeClipping();
        },
        afterFinishInternal: function (effect) {
            effect.effects[0].element.hide().undoClipping().undoPositioned().setStyle(oldStyle);
        }
    }, options));
};Effect.Pulsate = function (element) {
    element = $(element);
    var options = arguments[1] || {},
        oldOpacity = element.getInlineOpacity(),
        transition = options.transition || Effect.Transitions.linear,
        reverser = function (pos) {
            return 1 - transition((-Math.cos((pos * (options.pulses || 5) * 2) * Math.PI) / 2) + .5);
        };
    return new Effect.Opacity(element, Object.extend(Object.extend({
        duration: 2.0,
        from: 0,
        afterFinishInternal: function (effect) {
            effect.element.setStyle({
                opacity: oldOpacity
            });
        }
    }, options), {
        transition: reverser
    }));
};Effect.Fold = function (element) {
    element = $(element);
    var oldStyle = {
        top: element.style.top,
        left: element.style.left,
        width: element.style.width,
        height: element.style.height
    };
    element.makeClipping();
    return new Effect.Scale(element, 5, Object.extend({
        scaleContent: false,
        scaleX: false,
        afterFinishInternal: function (effect) {
            new Effect.Scale(element, 1, {
                scaleContent: false,
                scaleY: false,
                afterFinishInternal: function (effect) {
                    effect.element.hide().undoClipping().setStyle(oldStyle);
                }
            });
        }
    }, arguments[1] || {}));
};Effect.Morph = Class.create(Effect.Base, {
    initialize: function (element) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        var options = Object.extend({
            style: {}
        }, arguments[1] || {});
        if (!Object.isString(options.style)) this.style = $H(options.style);
        else {
            if (options.style.include(':')) this.style = options.style.parseStyle();
            else {
                this.element.addClassName(options.style);
                this.style = $H(this.element.getStyles());
                this.element.removeClassName(options.style);
                var css = this.element.getStyles();
                this.style = this.style.reject(function (style) {
                    return style.value == css[style.key];
                });
                options.afterFinishInternal = function (effect) {
                    effect.element.addClassName(effect.options.style);
                    effect.transforms.each(function (transform) {
                        effect.element.style[transform.style] = '';
                    });
                };
            }
        }
        this.start(options);
    },
    setup: function () {
        function parseColor(color) {
            if (!color || ['rgba(0, 0, 0, 0)', 'transparent'].include(color)) color = '#ffffff';
            color = color.parseColor();
            return $R(0, 2).map(function (i) {
                return parseInt(color.slice(i * 2 + 1, i * 2 + 3), 16);
            });
        }
        this.transforms = this.style.map(function (pair) {
            var property = pair[0],
                value = pair[1],
                unit = null;
            if (value.parseColor('#zzzzzz') != '#zzzzzz') {
                value = value.parseColor();
                unit = 'color';
            } else if (property == 'opacity') {
                value = parseFloat(value);
                if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout)) this.element.setStyle({
                    zoom: 1
                });
            } else if (Element.CSS_LENGTH.test(value)) {
                var components = value.match(/^([\+\-]?[0-9\.]+)(.*)$/);
                value = parseFloat(components[1]);
                unit = (components.length == 3) ? components[2] : null;
            }
            var originalValue = this.element.getStyle(property);
            return {
                style: property.camelize(),
                originalValue: unit == 'color' ? parseColor(originalValue) : parseFloat(originalValue || 0),
                targetValue: unit == 'color' ? parseColor(value) : value,
                unit: unit
            };
        }.bind(this)).reject(function (transform) {
            return ((transform.originalValue == transform.targetValue) || (transform.unit != 'color' && (isNaN(transform.originalValue) || isNaN(transform.targetValue))));
        });
    },
    update: function (position) {
        var style = {},
            transform, i = this.transforms.length;
        while (i--)
        style[(transform = this.transforms[i]).style] = transform.unit == 'color' ? '#' + (Math.round(transform.originalValue[0] + (transform.targetValue[0] - transform.originalValue[0]) * position)).toColorPart() + (Math.round(transform.originalValue[1] + (transform.targetValue[1] - transform.originalValue[1]) * position)).toColorPart() + (Math.round(transform.originalValue[2] + (transform.targetValue[2] - transform.originalValue[2]) * position)).toColorPart() : (transform.originalValue + (transform.targetValue - transform.originalValue) * position).toFixed(3) + (transform.unit === null ? '' : transform.unit);
        this.element.setStyle(style, true);
    }
});Effect.Transform = Class.create({
    initialize: function (tracks) {
        this.tracks = [];
        this.options = arguments[1] || {};
        this.addTracks(tracks);
    },
    addTracks: function (tracks) {
        tracks.each(function (track) {
            track = $H(track);
            var data = track.values().first();
            this.tracks.push($H({
                ids: track.keys().first(),
                effect: Effect.Morph,
                options: {
                    style: data
                }
            }));
        }.bind(this));
        return this;
    },
    play: function () {
        return new Effect.Parallel(this.tracks.map(function (track) {
            var ids = track.get('ids'),
                effect = track.get('effect'),
                options = track.get('options');
            var elements = [$(ids) || $$(ids)].flatten();
            return elements.map(function (e) {
                return new effect(e, Object.extend({
                    sync: true
                }, options))
            });
        }).flatten(), this.options);
    }
});Element.CSS_PROPERTIES = $w('backgroundColor backgroundPosition borderBottomColor borderBottomStyle ' + 'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth ' + 'borderRightColor borderRightStyle borderRightWidth borderSpacing ' + 'borderTopColor borderTopStyle borderTopWidth bottom clip color ' + 'fontSize fontWeight height left letterSpacing lineHeight ' + 'marginBottom marginLeft marginRight marginTop markerOffset maxHeight ' + 'maxWidth minHeight minWidth opacity outlineColor outlineOffset ' + 'outlineWidth paddingBottom paddingLeft paddingRight paddingTop ' + 'right textIndent top width wordSpacing zIndex');Element.CSS_LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;String.__parseStyleElement = document.createElement('div');String.prototype.parseStyle = function () {
    var style, styleRules = $H();
    if (Prototype.Browser.WebKit) style = new Element('div', {
        style: this
    }).style;
    else {
        String.__parseStyleElement.innerHTML = '<div style="' + this + '"></div>';
        style = String.__parseStyleElement.childNodes[0].style;
    }
    Element.CSS_PROPERTIES.each(function (property) {
        if (style[property]) styleRules.set(property, style[property]);
    });
    if (Prototype.Browser.IE && this.include('opacity')) styleRules.set('opacity', this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]);
    return styleRules;
};
if (document.defaultView && document.defaultView.getComputedStyle) {
    Element.getStyles = function (element) {
        var css = document.defaultView.getComputedStyle($(element), null);
        return Element.CSS_PROPERTIES.inject({}, function (styles, property) {
            styles[property] = css[property];
            return styles;
        });
    };
} else {
    Element.getStyles = function (element) {
        element = $(element);
        var css = element.currentStyle,
            styles;
        styles = Element.CSS_PROPERTIES.inject({}, function (results, property) {
            results[property] = css[property];
            return results;
        });
        if (!styles.opacity) styles.opacity = element.getOpacity();
        return styles;
    };
}
Effect.Methods = {
    morph: function (element, style) {
        element = $(element);
        new Effect.Morph(element, Object.extend({
            style: style
        }, arguments[2] || {}));
        return element;
    },
    visualEffect: function (element, effect, options) {
        element = $(element);
        var s = effect.dasherize().camelize(),
            klass = s.charAt(0).toUpperCase() + s.substring(1);
        new Effect[klass](element, options);
        return element;
    },
    highlight: function (element, options) {
        element = $(element);
        new Effect.Highlight(element, options);
        return element;
    }
};$w('fade appear grow shrink fold blindUp blindDown slideUp slideDown ' + 'pulsate shake puff squish switchOff dropOut').each(function (effect) {
    Effect.Methods[effect] = function (element, options) {
        element = $(element);
        Effect[effect.charAt(0).toUpperCase() + effect.substring(1)](element, options);
        return element;
    };
});$w('getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles').each(function (f) {
    Effect.Methods[f] = Element[f];
});Element.addMethods(Effect.Methods);;
if (Object.isUndefined(Effect)) throw ("dragdrop.js requires including script.aculo.us' effects.js library");
var Droppables = {
    drops: [],
    remove: function (element) {
        this.drops = this.drops.reject(function (d) {
            return d.element == $(element)
        });
    },
    add: function (element) {
        element = $(element);
        var options = Object.extend({
            greedy: true,
            hoverclass: null,
            tree: false
        }, arguments[1] || {});
        if (options.containment) {
            options._containers = [];
            var containment = options.containment;
            if (Object.isArray(containment)) {
                containment.each(function (c) {
                    options._containers.push($(c))
                });
            } else {
                options._containers.push($(containment));
            }
        }
        if (options.accept) options.accept = [options.accept].flatten();
        Element.makePositioned(element);
        options.element = element;
        this.drops.push(options);
    },
    findDeepestChild: function (drops) {
        deepest = drops[0];
        for (var i = 1; i < drops.length; ++i)
        if (Element.isParent(drops[i].element, deepest.element)) deepest = drops[i];
        return deepest;
    },
    isContained: function (element, drop) {
        var containmentNode;
        if (drop.tree) {
            containmentNode = element.treeNode;
        } else {
            containmentNode = element.parentNode;
        }
        return drop._containers.detect(function (c) {
            return containmentNode == c
        });
    },
    isAffected: function (point, element, drop) {
        return ((drop.element != element) && ((!drop._containers) || this.isContained(element, drop)) && ((!drop.accept) || (Element.classNames(element).detect(function (v) {
            return drop.accept.include(v)
        }))) && Position.within(drop.element, point[0], point[1]));
    },
    deactivate: function (drop) {
        if (drop.hoverclass) Element.removeClassName(drop.element, drop.hoverclass);
        this.last_active = null;
    },
    activate: function (drop) {
        if (drop.hoverclass) Element.addClassName(drop.element, drop.hoverclass);
        this.last_active = drop;
    },
    show: function (point, element) {
        if (!this.drops.length) return;
        var drop, affected = [];
        var op = element.getOffsetParent();
        var opscroll = [0, 0];
        if (op.nodeName !== 'BODY') {
            opscroll = [op.scrollLeft, op.scrollTop];
        }
        this.drops.each(function (drop) {
            if (Droppables.isAffected([point[0] + opscroll[0], point[1] + opscroll[1]], element, drop)) {
                affected.push(drop);
            }
        });
        if (affected.length > 0) drop = Droppables.findDeepestChild(affected);
        if (this.last_active && this.last_active != drop) this.deactivate(this.last_active);
        if (drop) {
            Position.within(drop.element, point[0], point[1]);
            if (drop.onHover) drop.onHover(element, drop.element, Position.overlap(drop.overlap, drop.element));
            if (drop != this.last_active) Droppables.activate(drop);
        }
    },
    fire: function (event, element) {
        if (!this.last_active) return;
        Position.prepare();
        if (this.isAffected([Event.pointerX(event), Event.pointerY(event)], element, this.last_active)) if (this.last_active.onDrop) {
            this.last_active.onDrop(element, this.last_active.element, event);
            return true;
        }
    },
    reset: function () {
        if (this.last_active) this.deactivate(this.last_active);
    }
};
var Draggables = {
    drags: [],
    observers: [],
    register: function (draggable) {
        if (this.drags.length == 0) {
            this.eventMouseUp = this.endDrag.bindAsEventListener(this);
            this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
            this.eventKeypress = this.keyPress.bindAsEventListener(this);
            Event.observe(document, "mouseup", this.eventMouseUp);
            Event.observe(document, "mousemove", this.eventMouseMove);
            Event.observe(document, "keypress", this.eventKeypress);
        }
        this.drags.push(draggable);
    },
    unregister: function (draggable) {
        this.drags = this.drags.reject(function (d) {
            return d == draggable
        });
        if (this.drags.length == 0) {
            Event.stopObserving(document, "mouseup", this.eventMouseUp);
            Event.stopObserving(document, "mousemove", this.eventMouseMove);
            Event.stopObserving(document, "keypress", this.eventKeypress);
        }
    },
    activate: function (draggable) {
        if (draggable.options.delay) {
            this._timeout = setTimeout(function () {
                Draggables._timeout = null;
                window.focus();
                Draggables.activeDraggable = draggable;
            }.bind(this), draggable.options.delay);
        } else {
            window.focus();
            this.activeDraggable = draggable;
        }
    },
    deactivate: function () {
        this.activeDraggable = null;
    },
    updateDrag: function (event) {
        if (!this.activeDraggable) return;
        var pointer = [Event.pointerX(event), Event.pointerY(event)];
        if (this._lastPointer && (this._lastPointer.inspect() == pointer.inspect())) return;
        this._lastPointer = pointer;
        this.activeDraggable.updateDrag(event, pointer);
    },
    endDrag: function (event) {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        if (!this.activeDraggable) return;
        this._lastPointer = null;
        this.activeDraggable.endDrag(event);
        this.activeDraggable = null;
    },
    keyPress: function (event) {
        if (this.activeDraggable) this.activeDraggable.keyPress(event);
    },
    addObserver: function (observer) {
        this.observers.push(observer);
        this._cacheObserverCallbacks();
    },
    removeObserver: function (element) {
        this.observers = this.observers.reject(function (o) {
            return o.element == element
        });
        this._cacheObserverCallbacks();
    },
    notify: function (eventName, draggable, event) {
        if (this[eventName + 'Count'] > 0) this.observers.each(function (o) {
            if (o[eventName]) o[eventName](eventName, draggable, event);
        });
        if (draggable.options[eventName]) draggable.options[eventName](draggable, event);
    },
    _cacheObserverCallbacks: function () {
        ['onStart', 'onEnd', 'onDrag'].each(function (eventName) {
            Draggables[eventName + 'Count'] = Draggables.observers.select(function (o) {
                return o[eventName];
            }).length;
        });
    }
};
var calc = 0;
var Draggable = Class.create({
    initialize: function (element) {
        var defaults = {
            handle: false,
            reverteffect: function (element, top_offset, left_offset) {
                var dur = Math.sqrt(Math.abs(top_offset ^ 2) + Math.abs(left_offset ^ 2)) * 0.02;
                new Effect.Move(element, {
                    x: -left_offset,
                    y: -top_offset,
                    duration: dur,
                    queue: {
                        scope: '_draggable',
                        position: 'end'
                    }
                });
            },
            endeffect: function (element) {
                var toOpacity = Object.isNumber(element._opacity) ? element._opacity : 1.0;
                new Effect.Opacity(element, {
                    duration: 0.2,
                    from: 0.7,
                    to: toOpacity,
                    queue: {
                        scope: '_draggable',
                        position: 'end'
                    },
                    afterFinish: function () {
                        Draggable._dragging[element] = false
                    }
                });
            },
            zindex: 1000,
            revert: false,
            quiet: false,
            scroll: false,
            scrollSensitivity: 20,
            scrollSpeed: 15,
            snap: false,
            delay: 0
        };
        if (!arguments[1] || Object.isUndefined(arguments[1].endeffect)) Object.extend(defaults, {
            starteffect: function (element) {
                element._opacity = Element.getOpacity(element);
                Draggable._dragging[element] = true;
                new Effect.Opacity(element, {
                    duration: 0.2,
                    from: element._opacity,
                    to: 0.7
                });
            }
        });
        var options = Object.extend(defaults, arguments[1] || {});
        this.element = $(element);
        if (options.handle && Object.isString(options.handle)) this.handle = this.element.down('.' + options.handle, 0);
        if (!this.handle) this.handle = $(options.handle);
        if (!this.handle) this.handle = this.element;
        if (options.scroll && !options.scroll.scrollTo && !options.scroll.outerHTML) {
            options.scroll = $(options.scroll);
            this._isScrollChild = Element.childOf(this.element, options.scroll);
        }
        Element.makePositioned(this.element);
        this.options = options;
        this.dragging = false;
        this.eventMouseDown = this.initDrag.bindAsEventListener(this);
        Event.observe(this.handle, "mousedown", this.eventMouseDown);
        Draggables.register(this);
    },
    destroy: function () {
        Event.stopObserving(this.handle, "mousedown", this.eventMouseDown);
        Draggables.unregister(this);
    },
    currentDelta: function () {
        return ([parseInt(Element.getStyle(this.element, 'left') || '0'), parseInt(Element.getStyle(this.element, 'top') || '0')]);
    },
    initDrag: function (event) {
        if (!Object.isUndefined(Draggable._dragging[this.element]) && Draggable._dragging[this.element]) return;
        if (Event.isLeftClick(event)) {
            var src = Event.element(event);
            if ((tag_name = src.tagName.toUpperCase()) && (tag_name == 'INPUT' || tag_name == 'SELECT' || tag_name == 'OPTION' || tag_name == 'BUTTON' || tag_name == 'TEXTAREA')) return;
            if (src.preventInitDrag === true) {
                return;
            }
            var pointer = [Event.pointerX(event), Event.pointerY(event)];
            var pos = Position.cumulativeOffset(this.element);
            this.offset = [0, 1].map(function (i) {
                return (pointer[i] - pos[i])
            });
            Draggables.activate(this);
            Event.stop(event);
        }
    },
    startDrag: function (event) {
        this.dragging = true;
        if (!this.delta) this.delta = this.currentDelta();
        if (this.options.zindex) {
            this.originalZ = parseInt(Element.getStyle(this.element, 'z-index') || 0);
            this.element.style.zIndex = this.options.zindex;
        }
        if (this.options.ghosting) {
            this._clone = this.element.cloneNode(true);
            this._originallyAbsolute = (this.element.getStyle('position') == 'absolute');
            if (!this._originallyAbsolute) Position.absolutize(this.element);
            if (this.element.parentNode) {
                this.element.parentNode.insertBefore(this._clone, this.element);
            }
        }
        if (this.options.scroll) {
            if (this.options.scroll == window) {
                var where = this._getWindowScroll(this.options.scroll);
                this.originalScrollLeft = where.left;
                this.originalScrollTop = where.top;
            } else {
                this.originalScrollLeft = this.options.scroll.scrollLeft;
                this.originalScrollTop = this.options.scroll.scrollTop;
            }
        }
        Draggables.notify('onStart', this, event);
        if (this.options.starteffect) this.options.starteffect(this.element);
    },
    updateDrag: function (event, pointer) {
        if (!this.dragging) this.startDrag(event);
        this.element.updateOff = function (num) {
            if (!this.element.updated && this.element.hasClassName('drags')) {
                var b = $(document.body).cumulativeScrollOffset();
                this.offset[0] -= b[0];
                this.offset[1] -= b[1];
                this.element.updated = true;
            }
        }.bind(this);
        if (!this.options.quiet) {
            Position.prepare();
            Droppables.show(pointer, this.element);
        }

Draggables.notify('onDrag', this, event);
this.draw(pointer);
if (this.options.change) this.options.change(this);
if (this.options.scroll) {
    this.stopScrolling();
    var p;
    if (this.options.scroll == window) {
        var wp = this._getWindowScroll(this.options.scroll);
        p = [wp.left, wp.top, wp.left + wp.width, wp.top + wp.height];
    } else {
        p = Position.page(this.options.scroll);
        p[0] += this.options.scroll.scrollLeft + Position.deltaX;
        p[1] += this.options.scroll.scrollTop + Position.deltaY;
        p.push(p[0] + this.options.scroll.offsetWidth);
        p.push(p[1] + this.options.scroll.offsetHeight);
    }
    var speed = [0, 0];
    if (pointer[0] < (p[0] + this.options.scrollSensitivity)) speed[0] = pointer[0] - (p[0] + this.options.scrollSensitivity);
    if (pointer[1] < (p[1] + this.options.scrollSensitivity)) speed[1] = pointer[1] - (p[1] + this.options.scrollSensitivity);
    if (pointer[0] > (p[2] - this.options.scrollSensitivity)) speed[0] = pointer[0] - (p[2] - this.options.scrollSensitivity);
    if (pointer[1] > (p[3] - this.options.scrollSensitivity)) speed[1] = pointer[1] - (p[3] - this.options.scrollSensitivity);
    this.startScrolling(speed);
}
if (Prototype.Browser.WebKit) {
    window.scrollBy(0, 0);
}
Event.stop(event);
}, finishDrag: function (event, success) {
    this.dragging = false;
    if (this.options.quiet) {
        Position.prepare();
        var pointer = [Event.pointerX(event), Event.pointerY(event)];
        Droppables.show(pointer, this.element);
    }
    if (this.options.ghosting) {
        if (!this._originallyAbsolute) Position.relativize(this.element);
        delete this._originallyAbsolute;
        Element.remove(this._clone);
        this._clone = null;
    }
    var dropped = false;
    if (success) {
        dropped = Droppables.fire(event, this.element);
        if (!dropped) dropped = false;
    }
    if (dropped && this.options.onDropped) this.options.onDropped(this.element);
    Draggables.notify('onEnd', this, event);
    var revert = this.options.revert;
    if (revert && Object.isFunction(revert)) revert = revert(this.element);
    var d = this.currentDelta();
    if (revert && this.options.reverteffect) {
        if (dropped == 0 || revert != 'failure') this.options.reverteffect(this.element, d[1] - this.delta[1], d[0] - this.delta[0]);
    } else {
        this.delta = d;
    }
    if (this.options.zindex) this.element.style.zIndex = this.originalZ;
    if (this.options.endeffect) this.options.endeffect(this.element);
    Draggables.deactivate(this);
    Droppables.reset();
},
keyPress: function (event) {
    if (event.keyCode != Event.KEY_ESC) return;
    this.finishDrag(event, false);
    Event.stop(event);
},
endDrag: function (event) {
    if (!this.dragging) return;
    this.stopScrolling();
    this.finishDrag(event, true);
    Event.stop(event);
},
draw: function (point) {
    var pos = this.element.cumulativeOffset();
    if (this.options.ghosting) {
        var r = Position.realOffset(this.element);
        pos[0] += r[0] - Position.deltaX;
        pos[1] += r[1] - Position.deltaY;
    }
    var d = this.currentDelta();
    pos[0] -= d[0];
    pos[1] -= d[1];
    if (this.options.scroll && (this.options.scroll != window && this._isScrollChild)) {
        pos[0] -= this.options.scroll.scrollLeft - this.originalScrollLeft;
        pos[1] -= this.options.scroll.scrollTop - this.originalScrollTop;
    }
    var p = [0, 1].map(function (i) {
        return (point[i] - pos[i] - this.offset[i])
    }.bind(this));
    if (this.options.snap) {
        if (Object.isFunction(this.options.snap)) {
            p = this.options.snap(p[0], p[1], this);
        } else {
            if (Object.isArray(this.options.snap)) {
                p = p.map(function (v, i) {
                    return (v / this.options.snap[i]).round() * this.options.snap[i]
                }.bind(this));
            } else {
                p = p.map(function (v) {
                    return (v / this.options.snap).round() * this.options.snap
                }.bind(this));
            }
        }
    }
    var style = this.element.style;
    if ((!this.options.constraint) || (this.options.constraint == 'horizontal')) style.left = p[0] + "px";
    if ((!this.options.constraint) || (this.options.constraint == 'vertical')) style.top = p[1] + "px";
    if (style.visibility == "hidden") style.visibility = "";
},
stopScrolling: function () {
    if (this.scrollInterval) {
        clearInterval(this.scrollInterval);
        this.scrollInterval = null;
        Draggables._lastScrollPointer = null;
    }
},
startScrolling: function (speed) {
    if (!(speed[0] || speed[1])) return;
    this.scrollSpeed = [speed[0] * this.options.scrollSpeed, speed[1] * this.options.scrollSpeed];
    this.lastScrolled = new Date();
    this.scrollInterval = setInterval(this.scroll.bind(this), 10);
},
scroll: function () {
    var current = new Date();
    var delta = current - this.lastScrolled;
    this.lastScrolled = current;
    if (this.options.scroll == window) {
        var wp = this._getWindowScroll(this.options.scroll);
        if (this.scrollSpeed[0] || this.scrollSpeed[1]) {
            var d = delta / 1000;
            this.options.scroll.scrollTo(wp.left + d * this.scrollSpeed[0], wp.top + d * this.scrollSpeed[1]);
        }
    } else {
        this.options.scroll.scrollLeft += this.scrollSpeed[0] * delta / 1000;
        this.options.scroll.scrollTop += this.scrollSpeed[1] * delta / 1000;
    }
    Position.prepare();
    Droppables.show(Draggables._lastPointer, this.element);
    Draggables.notify('onDrag', this);
    if (this._isScrollChild) {
        Draggables._lastScrollPointer = Draggables._lastScrollPointer || $A(Draggables._lastPointer);
        Draggables._lastScrollPointer[0] += this.scrollSpeed[0] * delta / 1000;
        Draggables._lastScrollPointer[1] += this.scrollSpeed[1] * delta / 1000;
        if (Draggables._lastScrollPointer[0] < 0) Draggables._lastScrollPointer[0] = 0;
        if (Draggables._lastScrollPointer[1] < 0) Draggables._lastScrollPointer[1] = 0;
        this.draw(Draggables._lastScrollPointer);
    }
    if (this.options.change) this.options.change(this);
},
_getWindowScroll: function (w) {
    var T, L, W, H;
    with(w.document) {
        if (w.document.documentElement && documentElement.scrollTop) {
            T = documentElement.scrollTop;
            L = documentElement.scrollLeft;
        } else if (w.document.body) {
            T = body.scrollTop;
            L = body.scrollLeft;
        }
        if (w.innerWidth) {
            W = w.innerWidth;
            H = w.innerHeight;
        } else if (w.document.documentElement && documentElement.clientWidth) {
            W = documentElement.clientWidth;
            H = documentElement.clientHeight;
        } else {
            W = body.offsetWidth;
            H = body.offsetHeight;
        }
    }
    return {
        top: T,
        left: L,
        width: W,
        height: H
    };
}
});Draggable._dragging = {};
var SortableObserver = Class.create({
    initialize: function (element, observer) {
        this.element = $(element);
        this.observer = observer;
        this.lastValue = Sortable.serialize(this.element);
    },
    onStart: function () {
        if (document._onedit) {
            document._stopEdit && document._stopEdit();
        }
        this.lastValue = Sortable.serialize(this.element);
    },
    onEnd: function () {
        Sortable.unmark();
        if (this.lastValue != Sortable.serialize(this.element)) this.observer(this.element)
    }
});
var Sortable = {
    SERIALIZE_RULE: /^[^_\-](?:[A-Za-z0-9\-\_]*)[_](.*)$/,
    sortables: {},
    _findRootElement: function (element) {
        while (element.tagName.toUpperCase() != "BODY") {
            if (element.id && Sortable.sortables[element.id]) return element;
            element = element.parentNode;
        }
    },
    options: function (element) {
        element = Sortable._findRootElement($(element));
        if (!element) return;
        return Sortable.sortables[element.id];
    },
    destroy: function (element) {
        element = $(element);
        var s = Sortable.sortables[element.id];
        if (s) {
            Draggables.removeObserver(s.element);
            s.droppables.each(function (d) {
                Droppables.remove(d)
            });
            s.draggables.invoke('destroy');
            delete Sortable.sortables[s.element.id];
        }
    },
    create: function (element) {
        element = $(element);
        var options = Object.extend({
            element: element,
            tag: 'li',
            dropOnEmpty: false,
            tree: false,
            treeTag: 'ul',
            overlap: 'vertical',
            constraint: 'vertical',
            containment: element,
            handle: false,
            only: false,
            delay: 0,
            hoverclass: null,
            ghosting: false,
            quiet: false,
            scroll: false,
            scrollSensitivity: 20,
            scrollSpeed: 15,
            format: this.SERIALIZE_RULE,
            elements: false,
            handles: false,
            markDropZone: true,
            dropZoneCss: 'emptyPlaceMarker',
            onChange: Prototype.emptyFunction,
            onDrag: Prototype.emptyFunction,
            onUpdate: Prototype.emptyFunction
        }, arguments[1] || {});
        this.destroy(element);
        var options_for_draggable = {
            revert: true,
            quiet: options.quiet,
            scroll: options.scroll,
            scrollSpeed: options.scrollSpeed,
            scrollSensitivity: options.scrollSensitivity,
            delay: options.delay,
            ghosting: options.ghosting,
            constraint: options.constraint,
            onDrag: options.onDrag,
            handle: options.handle
        };
        if (options.starteffect) options_for_draggable.starteffect = options.starteffect;
        if (options.reverteffect) options_for_draggable.reverteffect = options.reverteffect;
        else
        if (options.ghosting) options_for_draggable.reverteffect = function (element) {
            element.style.top = 0;
            element.style.left = 0;
        };
        if (options.endeffect) options_for_draggable.endeffect = options.endeffect;
        if (options.zindex) options_for_draggable.zindex = options.zindex;
        var options_for_droppable = {
            overlap: options.overlap,
            containment: options.containment,
            tree: options.tree,
            hoverclass: options.hoverclass,
            onHover: Sortable.onHover
        };
        var options_for_tree = {
            tree: options.tree,
            onHover: Sortable.onEmptyHover,
            overlap: options.overlap,
            containment: options.containment,
            hoverclass: options.hoverclass
        };
        Element.cleanWhitespace(element);
        options.draggables = [];
        options.droppables = [];
        if (options.dropOnEmpty || options.tree) {
            Droppables.add(element, options_for_tree);
            options.droppables.push(element);
        }(options.elements || this.findElements(element, options) || []).each(function (e, i) {
            var handle = options.handles ? $(options.handles[i]) : (options.handle ? $(e).select('.' + options.handle)[0] : e);
            options.draggables.push(new Draggable(e, Object.extend(options_for_draggable, {
                handle: handle
            })));
            Droppables.add(e, options_for_droppable);
            if (options.tree) e.treeNode = element;
            options.droppables.push(e);
        });
        if (options.tree) {
            (Sortable.findTreeElements(element, options) || []).each(function (e) {
                Droppables.add(e, options_for_tree);
                e.treeNode = element;
                options.droppables.push(e);
            });
        }
        this.sortables[element.identify()] = options;
        Draggables.addObserver(new SortableObserver(element, options.onUpdate));
    },
    findElements: function (element, options) {
        if (!options) {
            return false;
        }
        return Element.findChildren(element, options.only, options.tree ? true : false, options.tag);
    },
    findTreeElements: function (element, options) {
        return Element.findChildren(element, options.only, options.tree ? true : false, options.treeTag);
    },
    onHover: function (element, dropon, overlap) {
        if (Element.isParent(dropon, element)) return;
        var sortable = Sortable.options(dropon);
        var isghosting = sortable && sortable.ghosting;
        if (overlap > .33 && overlap < .66 && Sortable.options(dropon).tree) {
            return;
        } else if (overlap > 0.5) {
            Sortable.mark(dropon, 'before');
            if (dropon.previousSibling != element) {
                var oldParentNode = element.parentNode;
                element.style.visibility = "hidden";
                Sortable.createGuide(element);
                dropon.parentNode.insertBefore(element, dropon);
                dropon.parentNode.insertBefore(Sortable._guide, element);
                Sortable.markEmptyPlace(element, isghosting);
                if (dropon.parentNode != oldParentNode) Sortable.options(oldParentNode).onChange(element);
                Sortable.options(dropon.parentNode).onChange(element);
                element.updateOff(1);
            }
        } else {
            Sortable.mark(dropon, 'after');
            var nextElement = dropon.nextSibling || null;
            if (nextElement != element) {
                var oldParentNode = element.parentNode;
                element.style.visibility = "hidden";
                Sortable.createGuide(element);
                dropon.parentNode.insertBefore(element, nextElement);
                dropon.parentNode.insertBefore(Sortable._guide, element);
                Sortable.markEmptyPlace(element, isghosting);
                if (dropon.parentNode != oldParentNode) Sortable.options(oldParentNode).onChange(element);
                Sortable.options(dropon.parentNode).onChange(element);
                element.updateOff(2);
            }
        }
    },
    onEmptyHover: function (element, dropon, overlap) {
        var oldParentNode = element.parentNode;
        var droponOptions = Sortable.options(dropon);
        if (!Element.isParent(dropon, element) && Element.empty(dropon)) {
            var index;
            var sortable = Sortable.options(dropon);
            var isghosting = sortable && sortable.ghosting;
            var children = Sortable.findElements(dropon, {
                tag: droponOptions.tag,
                only: droponOptions.only
            });
            var child = null;
            if (children) {
                var offset = Element.offsetSize(dropon, droponOptions.overlap) * (1.0 - overlap);
                for (index = 0; index < children.length; index += 1) {
                    if (offset - Element.offsetSize(children[index], droponOptions.overlap) >= 0) {
                        offset -= Element.offsetSize(children[index], droponOptions.overlap);
                    } else if (offset - (Element.offsetSize(children[index], droponOptions.overlap) / 2) >= 0) {
                        child = index + 1 < children.length ? children[index + 1] : null;
                        break;
                    } else {
                        child = children[index];
                        break;
                    }
                }
            }
            Sortable.createGuide(element);
            dropon.insertBefore(element, child);
            dropon.insertBefore(Sortable._guide, element);
            Sortable.markEmptyPlace(element, isghosting);
            Sortable.options(oldParentNode).onChange(element);
            droponOptions.onChange(element);
            element.updateOff(3);
        }
    },
    createGuide: function (element) {
        if (!Sortable._guide) {
            Sortable._guide = $('_guide') || document.createElement('li');
            Sortable._guide.style.position = 'relative';
            Sortable._guide.style.width = '1px';
            Sortable._guide.style.height = '0px';
            Sortable._guide.style.cssFloat = 'left';
            Sortable._guide.id = 'guide';
            document.getElementsByTagName("body").item(0).appendChild(Sortable._guide);
        }
    },
    markEmptyPlace: function (element, isghosting) {
        if (!Sortable._emptyPlaceMarker) {
            Sortable._emptyPlaceMarker = $(Sortable.options(element).dropZoneCss) || document.createElement('DIV');
            Element.hide(Sortable._emptyPlaceMarker);
            Element.addClassName(Sortable._emptyPlaceMarker, Sortable.options(element).dropZoneCss);
            Sortable._emptyPlaceMarker.style.position = 'absolute';
            document.getElementsByTagName("body").item(0).appendChild(Sortable._emptyPlaceMarker);
        } else {
            Sortable._emptyPlaceMarker.style.margin = '';
        }
        if (isghosting && Sortable._guide.previousSibling != null) {
            var pos = Position.cumulativeOffset(Sortable._guide.previousSibling);
        } else {
            var pos = Position.cumulativeOffset(Sortable._guide);
            var md = Element.getStyle(element, 'margin');
            if (md != null) Sortable._emptyPlaceMarker.style.margin = md;
        }
        Sortable._emptyPlaceMarker.style.left = (pos[0]) + 'px';
        Sortable._emptyPlaceMarker.style.top = (pos[1]) + 'px';
        var d = {};
        d.width = (Element.getDimensions(element).width) + 'px';
        d.height = (Element.getDimensions(element).height) + 'px';
        Sortable._emptyPlaceMarker.setStyle(d);
        if (Sortable.options(element).markDropZone) Element.show(Sortable._emptyPlaceMarker);
    },
    unmark: function () {
        if (Sortable._marker) Sortable._marker.hide();
        if (Sortable._guide && Sortable._guide.parentNode) {
            Sortable._guide.parentNode.removeChild(Sortable._guide);
        }
        if (Sortable._emptyPlaceMarker) Sortable._emptyPlaceMarker.hide();
    },
    mark: function (dropon, position) {
        var sortable = Sortable.options(dropon.parentNode);
        if (sortable && !sortable.ghosting) return;
        if (!Sortable._marker) {
            Sortable._marker = ($('dropmarker') || Element.extend(document.createElement('DIV'))).hide().addClassName('dropmarker').setStyle({
                position: 'absolute'
            });
            document.getElementsByTagName("body").item(0).appendChild(Sortable._marker);
        }
        var offsets = dropon.cumulativeOffset();
        Sortable._marker.setStyle({
            left: offsets[0] + 'px',
            top: offsets[1] + 'px'
        });
        if (position == 'after') if (sortable.overlap == 'horizontal') Sortable._marker.setStyle({
            left: (offsets[0] + dropon.clientWidth) + 'px'
        });
        else
        Sortable._marker.setStyle({
            top: (offsets[1] + dropon.clientHeight) + 'px'
        });
        Sortable._marker.show();
    },
    _tree: function (element, options, parent) {
        var children = Sortable.findElements(element, options) || [];
        for (var i = 0; i < children.length; ++i) {
            var match = children[i].id.match(options.format);
            if (!match) continue;
            var child = {
                id: encodeURIComponent(match ? match[1] : null),
                element: element,
                parent: parent,
                children: [],
                position: parent.children.length,
                container: $(children[i]).down(options.treeTag)
            };
            if (child.container) this._tree(child.container, options, child);
            parent.children.push(child);
        }
        return parent;
    },
    tree: function (element) {
        element = $(element);
        var sortableOptions = this.options(element);
        var options = Object.extend({
            tag: sortableOptions.tag,
            treeTag: sortableOptions.treeTag,
            only: sortableOptions.only,
            name: element.id,
            format: sortableOptions.format
        }, arguments[1] || {});
        var root = {
            id: null,
            parent: null,
            children: [],
            container: element,
            position: 0
        };
        return Sortable._tree(element, options, root);
    },
    _constructIndex: function (node) {
        var index = '';
        do {
            if (node.id) index = '[' + node.position + ']' + index;
        } while ((node = node.parent) != null);
        return index;
    },
    sequence: function (element) {
        element = $(element);
        var options = Object.extend(this.options(element), arguments[1] || {});
        return $(this.findElements(element, options) || []).map(function (item) {
            return item.id.match(options.format) ? item.id.match(options.format)[1] : '';
        });
    },
    setSequence: function (element, new_sequence) {
        element = $(element);
        var options = Object.extend(this.options(element), arguments[2] || {});
        var nodeMap = {};
        this.findElements(element, options).each(function (n) {
            if (n.id.match(options.format)) nodeMap[n.id.match(options.format)[1]] = [n, n.parentNode];
            n.parentNode.removeChild(n);
        });
        new_sequence.each(function (ident) {
            var n = nodeMap[ident];
            if (n) {
                n[1].appendChild(n[0]);
                delete nodeMap[ident];
            }
        });
    },
    serialize: function (element) {
        element = $(element);
        var options = Object.extend(Sortable.options(element), arguments[1] || {});
        var name = encodeURIComponent((arguments[1] && arguments[1].name) ? arguments[1].name : element.id);
        if (options && options.tree) {
            return Sortable.tree(element, arguments[1]).children.map(function (item) {
                return [name + Sortable._constructIndex(item) + "=" + encodeURIComponent(item.id)].concat(item.children.map(arguments.callee));
            }).flatten().join('&');
        } else {
            return Sortable.sequence(element, arguments[1]).map(function (item) {
                return name + "[]=" + encodeURIComponent(item);
            }).join('&');
        }
    }
};Element.isParent = function (child, element) {
    if (!child.parentNode || child == element) return false;
    if (child.parentNode == element) return true;
    return Element.isParent(child.parentNode, element);
};Element.findChildren = function (element, only, recursive, tagName) {
    if (!element.hasChildNodes()) return null;
    tagName = tagName.toUpperCase();
    if (only) only = [only].flatten();
    var elements = [];
    $A(element.childNodes).each(function (e) {
        if (e.tagName && e.tagName.toUpperCase() == tagName && (!only || (Element.classNames(e).detect(function (v) {
            return only.include(v)
        })))) elements.push(e);
        if (recursive) {
            var grandchildren = Element.findChildren(e, only, recursive, tagName);
            if (grandchildren) elements.push(grandchildren);
        }
    });
    return (elements.length > 0 ? elements.flatten() : []);
};Element.offsetSize = function (element, type) {
    return element['offset' + ((type == 'vertical' || type == 'height') ? 'Height' : 'Width')];
};;

/*Locale.languageEn = {
    "langCode": "en-US",
    "[email_from]": "From:",
    "[email_to]": "To:",
    "[email_subject]": "Subject:",
    "[email_body]": "Body:"
};
Locale.languageBr = {
    "langCode": "Br-Brazil",
    "[email_from]": "From:",
    "[email_to]": "To:",
    "[email_subject]": "Subject:",
    "[email_body]": "Body:",
	 "Required":"Obrigatório",
	 "Move Up":"Mover para Cima",
	 "Move Down":"Mover para baixo",
	 "Shrink":"Reduzir",
	 "Duplicate":"Duplicar",
	 "Delete":"Excluir",
	 "Show Properties":"Exibir Propriedades",
	 "Please add a question to preview your form":"Por favor, adicione uma pergunta para  visualizar o formulário.",
	 "We are still having some compatibility problems with Internet Explorer. At this moment we highly recomend the use of Google Chrome.":"Ainda estamos corrigindo alguns problemas de compatibilidade com Internet Explorer. Sugerimos a utilização do Google Chrome."
	 
};*/


(function () {
    Locale.trimRexp = /^\s+|\s+$/g;
    Locale.notTranslated = [];
    Locale.currentTranslation = {};

    function stretch(str, length) {
        if (str.length > length) {
            return str;
        }
        var slength = str.length - 1,
            diff = Math.ceil(length / slength),
            sum = 0,
            newWord = [],
            r;
        for (var x = 0; x < slength; x++) {
            r = rand(1, diff);
            sum += r;
            newWord[x] = r;
        }
        newWord[x] = (length - sum);
        stretched = "";
        for (var i = 0; i < newWord.length; i++) {
            for (j = 0; j < newWord[i]; j++) {
                stretched += str[i];
            }
        }
        return stretched;
    }
    String.prototype.locale = function () {
		

        var word = this;
        if ('language' in Locale) {
            word = word.toString().replace(Locale.trimRexp, '');
            if (word in Locale.language) {
                word = Locale.language[word];
            } else {
                if (!Locale.notTranslated.include(word)) {
                    Locale.notTranslated.push(word);
                }
            }
        }
        if (arguments.length > 0) {
            return word.printf.apply(word, arguments);
        } else {
            return word;
        }
    };
	 
    if ('language' in Locale) {
        Locale.language = Object.extend(Locale.languageBr, Locale.language);
    } else {
        Locale.language = Locale.languageBr;
    }
    Locale.changeHTMLStrings = function () {
        $$('.locale').each(function (l) {
            l.removeClassName('locale');
            l.innerHTML = l.innerHTML.locale();
        });
        $$('.locale-img').each(function (l) {
            l.removeClassName('locale-img');
            if (l.alt) l.alt = l.alt.locale();
            if (l.title) l.title = l.title.locale();
        });
        $$('.locale-button').each(function (l) {
            l.removeClassName('locale-button');
            l.value = l.value.locale();
        });
        document.title = document.title && document.title.locale();
    }
    Locale.changeHTMLStrings();
    $('language-box') && $('language-box').observe('change', function () {
        Utils.Request({
            parameters: {
                action: 'setCookie',
                name: 'language',
                value: $('language-box').value,
                expire: '+1 Month'
            },
            onSuccess: function (res) {
                location.reload();
            }
        });
    });
}());;
if (window.Protoplus === undefined) {
    throw ("Error: ProtoPlus is required by ProtoPlus-UI.js");
}
Object.extend(document, {
    getViewPortDimensions: function () {
        var height;
        var width;
        if (typeof window.innerWidth != 'undefined') {
            width = window.innerWidth;
            height = window.innerHeight;
        } else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
            width = document.documentElement.clientWidth;
            height = document.documentElement.clientHeight;
        } else {
            width = document.getElementsByTagName('body')[0].clientWidth;
            height = document.getElementsByTagName('body')[0].clientHeight;
        }
        return {
            height: height,
            width: width
        };
    },
    stopTooltips: function () {
        document.stopTooltip = true;
        $$(".pp_tooltip_").each(function (t) {
            t.remove();
        });
        return true;
    },
    startTooltips: function () {
        document.stopTooltip = false;
    },
    windowDefaults: {
        height: 400,
        width: 400,		
        title: '&nbsp;',
        titleBackground: '#F5F5F5',
        buttonsBackground: '#F5F5F5',
        background: '#FFFFFF',
        top: '25%',
        left: '25%',
        winZindex: 10001,
        borderWidth: 10,
        borderColor: '#000',
        titleTextColor: '#777',
        borderOpacity: 0.3,
        borderRadius: "5px",
        titleClass: false,
        contentClass: false,
        buttonsClass: false,
        closeButton: 'X',
        openEffect: true,
        closeEffect: true,
        dim: true,
        modal: true,
        dimColor: '#fff',
        dimOpacity: 0.8,
        dimZindex: 10000,
        dynamic: true,
        buttons: false,
        contentPadding: '8',
        closeTo: false,
        buttons: false,
        buttonsAlign: 'right',
        hideTitle: false
    },
    window: function (options) {
		
			
        if (!document.windowArr) {
            document.windowArr = [];
        }
        options = Object.extend(Object.deepClone(document.windowDefaults), options || {});
        options = Object.extend({
            onClose: Prototype.K,
            onInsert: Prototype.K,
            onDisplay: Prototype.K
        }, options, {});
        options.dim = (options.modal !== true) ? false : options.dim;
        options.width = options.width ? parseInt(options.width, 10) : '';
		
        options.height = (options.height) ? parseInt(options.height, 10) : false;
		
        options.borderWidth = parseInt(options.borderWidth, 10);
		
        var winWidth = (options.width ? (options.width == 'auto' ? 'auto' : options.width + 'px') : '');
        var titleStyle = {
            background: options.titleBackground,
            zIndex: 1000,
            position: 'relative',
            paddingTop: '2px',
            borderBottom: 'none',
            height: '40px',
            MozBorderRadius: '3px 3px 0px 0px',
            WebkitBorderRadius: '3px 3px 0px 0px',
            borderRadius: '3px 3px 0px 0px'
        };
        var dimmerStyle = {
            background: options.dimColor,
            height: '100%',
            width: '100%',
            position: 'fixed',
            top: '0px',
            left: '0px',
            opacity: options.dimOpacity,
            zIndex: options.dimZindex
        };
        var windowStyle = {
            top: options.top,
            left: options.left,
            position: 'absolute',
            padding: options.borderWidth + 'px',
            height: "auto",
            width: winWidth,
            zIndex: options.winZindex
        };
        var buttonsStyle = {
            padding: '0px',
            display: 'inline-block',
            width: '100%',
            borderTop: '0px solid #ffffff',
            background: options.buttonsBackground,
            zIndex: 999,
            position: 'relative',
            textAlign: options.buttonsAlign,
            MozBorderRadius: '0 0 3px 3px',
            WebkitBorderRadius: '0px 0px 3px 3px',
            borderRadius: '0px 0px 3px 3px'
        };
		
        var contentStyle = {
            zIndex: 1000,
            height: options.height !== false ? options.height + 'px' : "auto",
            position: options.position==''?'':'relative',
            display: 'inline-block',
            width: '100%'
        };

        var wrapperStyle = {
            zIndex: 600,
            MozBorderRadius: '3px',
            WebkitBorderRadius: '3px',
            borderRadius: '3px'
        };
        var titleTextStyle = {
            fontWeight: 'bold',
            color: options.titleTextColor,
            //textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
            paddingLeft: '23px',           
			fontFamily:'Arial',
			fontSize:'26px',
			color:'#444444'
        };
        var backgroundStyle = {
            height: '100%',
            width: '100%',
            background: options.borderColor,
            position: 'absolute',
            top: '0px',
            left: '0px',
            zIndex: -1,
            opacity: options.borderOpacity
        };
        var titleCloseStyle = {
            fontFamily: 'Arial, Helvetica, sans-serif',
            color: '#aaa',
            cursor: 'default'
        };
        var contentWrapperStyle = {
            padding: options.contentPadding + 'px',
            background: options.background
        };
        if (options.dim) {
            var dimmer = new Element('div');
            dimmer.onmousedown = function () {
                return false;
            };
            dimmer.setStyle(dimmerStyle);
        }
        var win, tbody, tr, wrapper, background, title, title_table, title_text, title_close, content, buttons, contentWrapper;
        win = new Element('div');
        win.insert(background = new Element('div'));
        win.insert(wrapper = new Element('div'));
        wrapper.insert(title = new Element('div'));
        title.insert(title_table = new Element('table', {
            width: '100%',
            height: '100%'
        }).insert(tbody = new Element('tbody').insert(tr = new Element('tr'))));
        /*Added by manish*/
		  if(options.titleAlignment)
		  	tr.insert(title_text = new Element('td',{
				align: 'left'										 
			}));
		  else
		  	tr.insert(title_text = new Element('td'));
			
        tr.insert(title_close = new Element('td', {
            width: '75px',
            align: 'center'
        }));
        wrapper.insert(contentWrapper = new Element('div', {
            className: 'window-content-wrapper'
        }).insert(content = new Element('div')).setStyle(contentWrapperStyle));
		
        win.setTitle = function (title) {
			
            title_text.update(title);
            return win;
        };
        if (options.hideTitle) {
            title.hide();
            title_close = new Element('div').setStyle('text-align:center;')
            wrapper.insert(title_close.setStyle('position:absolute;z-index:1111000; right:5px; top:5px;'));
            contentWrapper.setStyle({
                MozBorderRadius: titleStyle.MozBorderRadius,
                WebkitBorderRadius: titleStyle.WebkitBorderRadius,
                borderRadius: titleStyle.borderRadius
            });
        }
        win.buttons = {};
        var buttons, buttonsDiv;
        if (options.buttons && options.buttons.length > 0) {
            wrapper.insert(buttons = new Element('div', {
                className: 'window-buttons-wrapper'
            }));
            if (!options.buttonsClass) {
                buttons.setStyle(buttonsStyle);
            } else {
                buttons.addClassName(options.buttonsClass);
            }
            buttons.insert(buttonsDiv = new Element('div').setStyle('padding:12px;height:1px;'));
            $A(options.buttons).each(function (button) {
                var color = button.color || 'grey';
				
                if (!button.id) {
                    var but = new Element('button', {
                        className: 'big-button buttons buttons-' + color,
                        type: 'button',
                        name: button.name
                    }).observe('click', function () {
                        button.handler(win, but);
                    });
                } else {
                    var but = new Element('button', {
                        className: 'big-button buttons buttons-' + color,
                        type: 'button',
                        name: button.name,
                        id: button.id
                    }).observe('click', function () {
                        button.handler(win, but);
                    });
                }
                if (button.className) {
                    but.addClassName(button.className);
                }
                if (button.link) {}
                var butTitle = new Element('span').insert(button.title);
                if (button.icon) {
                    button.iconAlign = button.iconAlign || 'left';
                    var butIcon = new Element('img', {
                        src: button.icon,
                        align: button.iconAlign == 'right' ? 'absmiddle' : 'left'
                    }).addClassName("icon-" + button.iconAlign);
                    if (button.iconAlign == 'left') {
                        but.insert(butIcon);
                    }
                    but.insert(butTitle);
                    if (button.iconAlign == 'right') {
                        but.insert(butIcon);
                    }
                } else {
                    but.insert(butTitle);
                }
                if (button.align == 'left') {
                    but.setStyle('float:left');
                }
                but.changeTitle = function (title) {
                    butTitle.update(title);
                    return but;
                };
                but.updateImage = function (options) {
                    butIcon.src = options.icon;
                    options.iconAlign = options.iconAlign || button.iconAlign;
                    if (options.iconAlign == 'right') {
                        butIcon.removeClassName('icon-left');
                        butIcon.addClassName('icon-right');
                    } else {
                        butIcon.removeClassName('icon-right');
                        butIcon.addClassName('icon-left');
                    }
                };
                win.buttons[button.name] = but;
                if (button.hidden === true) {
                    but.hide();
                }
                if (button.disabled === true) {
                    but.disable();
                }
                if (button.style) {
                    but.setStyle(button.style);
                }
               // buttonsDiv.insert(but);
            });
        } else {
            contentWrapper.setStyle({
                MozBorderRadius: buttonsStyle.MozBorderRadius,
                WebkitBorderRadius: buttonsStyle.WebkitBorderRadius,
                borderRadius: buttonsStyle.borderRadius
            });
        }
        win.setStyle(windowStyle);
        background.setStyle(backgroundStyle).setCSSBorderRadius(options.borderRadius);
        if (!options.titleClass) {
            title.setStyle(titleStyle);
        } else {
            title.addClassName(options.titleClass);
        }
        if (!options.contentClass) {
            content.setStyle(contentStyle).addClassName('window-content');
        } else {
            content.addClassName(options.contentClass);
        }
		  if(options.contentHeight)
			  content.setStyle('max-height:285px !important')
			  
        wrapper.setStyle(wrapperStyle);
        title_text.setStyle(titleTextStyle);
        title_close.setStyle(titleCloseStyle);
        var closebox = function (key) {
            document._onedit = false;
            var windowArrLen = document.windowArr ? document.windowArr.length : 0;
            if (windowArrLen > 0 && win != document.windowArr[windowArrLen - 1]) {
                return;
            }
            if (options.onClose(win, key) !== false) {
                var close = function () {
                    if (dimmer) {
                        dimmer.remove();
                        document.dimmed = false;
                    }
                    win.remove();
                    $(document.body).setStyle({
                        overflow: ''
                    });
                };
                if (options.closeEffect === true) {
                    win.shift({
                        opacity: 0,
                        duration: 0.3,
                        onEnd: close
                    });
                } else {
                    close();
                }
                Event.stopObserving(window, 'resize', win.reCenter);
                document.stopObserving('keyup', escClose);
                if (windowArrLen > 0) {
                    document.windowArr.pop();
                }
            }
        };
        var escClose = function (e) {
            e = document.getEvent(e);
            if (e.keyCode == 27) {
                closebox('ESC');
            }
        };
        if (options.dim) {
            $(document.body).insert(dimmer);
            document.dimmed = true;
        }
		
        title_text.insert(options.title);
        title_close.insert(options.closeButton);
        title_close.onclick = function () {
            closebox("CROSS");
        };
        content.insert(options.content);
        $(document.body).insert(win);
        if (options.openEffect === true) {
            win.setStyle({
                opacity: 0
            });
            win.shift({
                opacity: 1,
                duration: 0.5
            });
        }
        try {
            document._onedit = true;
            options.onInsert(win);
        } catch (e) {
            console.error(e);
        }
        var vp = document.viewport.getDimensions();
        var vso = $(document.body).cumulativeScrollOffset();
        var bvp = win.getDimensions();
        var top = ((vp.height - bvp.height) / 2) + vso.top;
        var left = ((vp.width - bvp.width) / 2) + vso.left;
        win.setStyle({
            top: top + "px",
            left: left + "px"
        });
        if (dimmer) {
            dimmer.setStyle({
                height: vp.height + 'px',
                width: vp.width + 'px'
            });
        }
        win.reCenter = function () {
            var vp = document.viewport.getDimensions();
            var vso = $(document.body).cumulativeScrollOffset();
            var bvp = win.getDimensions();
            var top = ((vp.height - bvp.height) / 2) + vso.top;
            var left = ((vp.width - bvp.width) / 2) + vso.left;
            win.setStyle({
                top: top + "px",
                left: left + "px"
            });
            if (dimmer) {
                dimmer.setStyle({
                    height: vp.height + 'px',
                    width: vp.width + 'px'
                });
            }
        };
        options.onDisplay(win);
        Event.observe(window, 'resize', win.reCenter);
        if (options.resizable) {
            wrapper.resizable({
                constrainViewport: true,
                element: content,
                onResize: function (h, w, type) {
                    if (type != 'vertical') {
                        win.setStyle({
                            width: (w + (options.borderWidth * 2) - 10) + 'px'
                        });
                    }
                    if (content.isOverflow()) {
                        content.setStyle({
                            overflow: 'auto'
                        });
                    } else {
                        content.setStyle({
                            overflow: ''
                        });
                    }
                }
            });
        }
        document.observe('keyup', escClose);
        win.setDraggable({
            handler: title_text,
            constrainViewport: true,
            dynamic: options.dynamic,
            dragEffect: false
        });
        win.close = closebox;
        document.windowArr.push(win);
        return win;
    }
});document.createNewWindow = document.window;Protoplus.ui = {
    editable: function (elem, options) {
        elem = $(elem);
        options = Object.extend({
            defaultText: " ",
            onStart: Prototype.K,
            onEnd: Prototype.K,
            processAfter: Prototype.K,
            processBefore: Prototype.K,
            onBeforeStart: Prototype.K,
            escapeHTML: true,
            doubleClick: false,
            onKeyUp: Prototype.K,
            className: false,
            options: [{
                text: "Please Select",
                value: "0"
            }],
            style: {
                background: "none",
                border: "none",
                color: "#333",
                fontStyle: "italic",
                width: "99%"
            },
            type: "text"
        }, options || {});
        elem.onStart = options.onStart;
        elem.onEnd = options.onEnd;
        elem.defaultText = options.defaultText;
        elem.processAfter = options.processAfter;
        elem.cleanWhitespace();
        try {
            elem.innerHTML = elem.innerHTML || elem.defaultText;
        } catch (e) {}
        var clickareas = [elem];
        if (options.labelEl) {
            clickareas.push($(options.labelEl));
        }
        $A(clickareas).invoke('observe', options.doubleClick ? "dblclick" : "click", function (e) {
            if (options.onBeforeStart(elem) === false) {
                return;
            }
            if (elem.onedit) {
                return;
            }
            elem.onedit = true;
            if (document.stopEditables) {
                return true;
            }
            document._onedit = true;
            document.stopTooltips();
            var currentValue = elem.innerHTML.replace(/^\s+|\s+$/gim, "");
            var type = options.type;
            var op = $A(options.options);
            var blur = function (e) {
                if (elem.keyEventFired) {
                    elem.keyEventFired = false;
                    return;
                }
                if (input.colorPickerEnabled) {
                    return;
                }
                input.stopObserving("blur", blur);
                elem.stopObserving("keypress", keypress);
                finish(e, currentValue);
            };
            var input = "";
            var keypress = function (e) {
                if (type == "textarea") {
                    return true;
                }
                if (e.shiftKey) {
                    return true;
                }
                if (input.colorPickerEnabled) {
                    return;
                }
                e = document.getEvent(e);
                if (e.keyCode == 13 || e.keyCode == 3) {
                    elem.keyEventFired = true;
                    elem.stopObserving("keypress", keypress);
                    input.stopObserving("blur", blur);
                    finish(e, currentValue);
                }
            };
            currentValue = (currentValue == options.defaultText) ? "" : currentValue;
            currentValue = options.escapeHTML ? currentValue.escapeHTML() : currentValue;
            currentValue = options.processBefore(currentValue, elem);
            if (type.toLowerCase() == "textarea") {
                input = new Element("textarea");
                input.value = currentValue;
                input.observe("blur", blur);
                input.observe('keyup', options.onKeyUp);
                input.select();
            } else if (["select", "dropdown", "combo", "combobox"].include(type.toLowerCase())) {
                input = new Element("select").observe("change", function (e) {
                    elem.keyEventFired = true;
                    finish(e, currentValue);
                });
                if (typeof op[0] == "string") {
                    op.each(function (text) {
                        input.insert(new Element("option").insert(text));
                    });
                } else {
                    op.each(function (pair, i) {
                        input.insert(new Element("option", {
                            value: pair.value ? pair.value : i
                        }).insert(pair.text));
                    });
                }
                input.selectOption(currentValue);
                input.observe("blur", blur);
            } else if (["radio", "checkbox"].include(type.toLowerCase())) {
                input = new Element("div");
                if (typeof op[0] == "string") {
                    op.each(function (text, i) {
                        input.insert(new Element("input", {
                            type: type,
                            name: "pp",
                            id: "pl_" + i
                        })).insert(new Element("label", {
                            htmlFor: "pl_" + i,
                            id: "lb_" + i
                        }).insert(text)).insert("<br>");
                    });
                } else {
                    op.each(function (pair, i) {
                        input.insert(new Element("input", {
                            type: type,
                            name: "pp",
                            value: pair.value ? pair.value : i,
                            id: "pl_" + i
                        })).insert(new Element("label", {
                            htmlFor: "pl_" + i,
                            id: "lb_" + i
                        }).insert(pair.text)).insert("<br>");
                    });
                }
            } else {
                input = new Element("input", {
                    type: type,
                    value: currentValue
                });
                input.observe("blur", blur);
                input.observe('keyup', options.onKeyUp);
                input.select();
            }
            if (options.className !== false) {
                input.addClassName(options.className);
            } else {
                input.setStyle(options.style);
            }
            elem.update(input);
            elem.finishEdit = function () {
                blur({
                    target: input
                });
            };
            document._stopEdit = function () {
                elem.keyEventFired = true;
                finish({
                    target: input
                }, currentValue);
            };
            elem.onStart(elem, currentValue, input);
            setTimeout(function () {
                input.select();
            }, 100);
            elem.observe("keypress", keypress);
        });
        var finish = function (e, oldValue) {
            document._stopEdit = false;
            var elem = $(e.target);
            var val = "";
            if (!elem.parentNode) {
                return true;
            }
            var outer = $(elem.parentNode);
            outer.onedit = false;
            if ("select" == elem.nodeName.toLowerCase()) {
                val = elem.options[elem.selectedIndex].text;
            } else if (["checkbox", "radio"].include(elem.type && elem.type.toLowerCase())) {
                outer = $(elem.parentNode.parentNode);
                val = "";
                $(elem.parentNode).descendants().findAll(function (el) {
                    return el.checked === true;
                }).each(function (ch) {
                    if ($(ch.id.replace("pl_", "lb_"))) {
                        val += $(ch.id.replace("pl_", "lb_")).innerHTML + "<br>";
                    }
                });
            } else {
                val = elem.value;
            }
            if (val === "" && outer.defaultText) {
                outer.update(outer.defaultText);
            } else {
                outer.update(outer.processAfter(val, outer, elem.getSelected() || val, oldValue));
            }
            document._onedit = false;
            document.startTooltips();
            outer.onEnd(outer, outer.innerHTML, oldValue, elem.getSelected() || val);
        };
        return elem;
    },
    setShadowColor: function (elem, color) {
        elem = $(elem);
        $A(elem.descendants()).each(function (node) {
            if (node.nodeType == Node.ELEMENT_NODE) {
                node.setStyle({
                    color: color
                });
            }
        });
        return elem;
    },
    cleanShadow: function (elem) {
        elem = $(elem);
        elem.descendants().each(function (e) {
            if (e.className == "pp_shadow") {
                e.remove();
            }
        });
        return elem;
    },
    getParentContext: function (element) {
        element = $(element);
        try {
            if (!element.parentNode) {
                return false;
            }
            if (element._contextMenuEnabled) {
                return element;
            }
            if (element.tagName == 'BODY') {
                return false;
            }
            return $(element.parentNode).getParentContext();
        } catch (e) {
            alert(e);
        }
    },
    hasContextMenu: function (element) {
        return !!element._contextMenuEnabled;
    },
    setContextMenu: function (element, options) {
		
        element = $(element);
        options = Object.extend({
            others: []
        }, options || {});
        element._contextMenuEnabled = true;
        element.items = {};
        $A(options.menuItems).each(function (item, i) {
            if (item == '-') {
                element.items["seperator_" + i] = item;
            } else {
                if (!item.name) {
                    element.items["item_" + i] = item;
                } else {
                    element.items[item.name] = item;
                }
            }
        });
        element.changeButtonText = function (button, text) {
            element.items[button].title = text;
            return $(element.items[button].elem).select('.context-menu-item-text')[0].update(text);
        };
        element.getButton = function (button) {
            return element.items[button].elem;
        };
        element.showButton = function (button) {
            element.items[button].hidden = false;
        };
        element.hideButton = function (button) {
            element.items[button].hidden = true;
        };
        element.enableButton = function (button) {
            element.items[button].disabled = false;
        };
        element.disableButton = function (button) {
            element.items[button].disabled = true;
        };
        element.options = options;
        element.openMenu = openMenu;
        options.others.push(element);
        var openMenu = function (e, local) {
			  
            Event.stop(e);
			
            if (local || (Prototype.Browser.Opera && e.ctrlKey) || Event.isRightClick(e) || Prototype.Browser.IE) {
                $$('.context-menu-all').invoke('remove');
                var element = e.target;
				//element.setAttribute('style','border:solid 1px green')
				if(element.id == "sourceButton" || element.id == "add_fields_button" )
					return
                element = element.getParentContext();
                if (element !== false) {
                    element.options.onStart && element.options.onStart();
                    var menuItems = element.menuItems;
                    var container = new Element('div', {
                        className: 'context-menu-all'
                    }).setStyle('z-index:1000000');
                    var backPanel = new Element('div', {
                        className: 'context-menu-back'
                    }).setOpacity(0.9);
                    var context = new Element('div', {
                        className: 'context-menu'
                    });
                    container.insert(backPanel).insert(context);
                    if (element.options.title) {
                        var title = new Element('div', {
                            className: 'context-menu-title'
                        }).observe('contextmenu', Event.stop);
                        title.insert(element.options.title);
                        context.insert(title);
                    }
                    $H(element.items).each(function (pair) {
                        var item = pair.value;
                        var liItem = new Element('li').observe('contextmenu', Event.stop);
                        if (Object.isString(item) && item == "-") {
                            liItem.insert("<hr>");
                            liItem.addClassName('context-menu-separator');
                            context.insert(liItem);
                        } else {
                            if (item.icon) {
                                var img = new Element('img', {
                                    src: item.icon,
                                    className: (item.iconClassName || ''),
                                    align: 'left'
                                }).setStyle('margin:0 4px 0 0;');
                                liItem.insert(img);
                            } else {
                                liItem.setStyle('padding-left:10px');
                            }
                            if (!item.disabled) {
                                liItem.addClassName('context-menu-item');
                                liItem.observe('click', item.handler.bind(element));
                            } else {
                                liItem.addClassName('context-menu-item-disabled');
                            }
                            if (item.hidden) {
                                liItem.hide();
                            }

liItem.insert(new Element('span', {
    className: 'context-menu-item-text'
}).update(item.title));
context.insert(liItem);
}
element.items[pair.key].elem = liItem;
});
$(document.body).insert(container.hide());
var x = Event.pointer(e).x;
var y = Event.pointer(e).y;
var dim = document.viewport.getDimensions();
var cDim = context.getDimensions();
var sOff = document.viewport.getScrollOffsets();
var top = (y - sOff.top + cDim.height) > dim.height && (y - sOff.top) > cDim.height ? (y - cDim.height) - 20 : y;
var left = (x + cDim.width) > dim.width ? (dim.width - cDim.width) - 20 : x;
container.setStyle({
    position: 'absolute',
    top: top + 'px',
    left: left + 'px'
});
element.options.onOpen && element.options.onOpen(context);
container.show();
}
}
};
element.openMenu = openMenu;
$A(options.others).invoke('observe', Prototype.Browser.Opera ? 'click' : 'contextmenu', function (e) {
    e.stop();
    var ev = {};
    if (Prototype.Browser.IE) {
        for (var k in e) {
            ev[k] = e[k];
        }
    } else {
        ev = e;
    }
    setTimeout(function () {
        openMenu(ev);
    }, 0);
});
if (!document.contextMenuHandlerSet) {
    document.contextMenuHandlerSet = true;
    $(document).observe('click', function (e) {
        $$('.context-menu-all').invoke('remove');
    });
}
return element;
}, textshadow: function (element, options) {
    var element = $(element);
    options = Object.extend({
        light: "upleft",
        color: "#666",
        offset: 1,
        opacity: 1,
        padding: 0,
        glowOpacity: 0.1,
        align: undefined,
        imageLike: false
    }, options || {});
    var light = options.light;
    var color = options.color;
    var dist = options.offset;
    var opacity = options.opacity;
    var textalign = (options.align) ? options.align : $(elem).getStyle("textAlign");
    var padding = (options.padding) ? options.padding + "px" : $(elem).getStyle("padding");
    var text = elem.innerHTML;
    var container = new Element("div");
    var textdiv = new Element("div");
    var style = {
        color: color,
        height: element.getStyle("height"),
        width: element.getStyle("width"),
        "text-align": textalign,
        padding: padding,
        position: "absolute",
        "z-index": 100,
        opacity: opacity
    };
    elem.innerValue = text;
    elem.update("");
    container.setStyle({
        position: "relative"
    });
    textdiv.update(text);
    container.appendChild(textdiv);
    for (var i = 0; i < dist; i++) {
        var shadowdiv = new Element("div", {
            className: "pp_shadow"
        });
        shadowdiv.update(text);
        shadowdiv.setUnselectable();
        d = dist - i;
        shadowdiv.setStyle(style);
        switch (light) {
        case "down":
            shadowdiv.setStyle({
                top: "-" + d + "px"
            });
            break;
        case "up":
            shadowdiv.setStyle({
                top: d + "px"
            });
            break;
        case "left":
            shadowdiv.setStyle({
                top: "0px",
                left: d + "px"
            });
            break;
        case "right":
            shadowdiv.setStyle({
                top: "0px",
                left: "-" + d + "px"
            });
            break;
        case "upright":
            shadowdiv.setStyle({
                top: d + "px",
                left: "-" + d + "px"
            });
            break;
        case "downleft":
            shadowdiv.setStyle({
                top: "-" + d + "px",
                left: d + "px"
            });
            break;
        case "downright":
            shadowdiv.setStyle({
                top: "-" + d + "px",
                left: "-" + d + "px"
            });
            break;
        case "wide":
            shadowdiv.setStyle({
                top: "0px",
                left: "0px"
            });
            container.appendChild(new Element("div").setStyle(Object.extend(style, {
                top: "0px",
                left: "-" + d + "px"
            })).update(text).setShadowColor(color).setUnselectable());
            container.appendChild(new Element("div").setStyle(Object.extend(style, {
                top: "0px",
                left: d + "px"
            })).update(text).setShadowColor(color).setUnselectable());
            break;
        case "glow":
            shadowdiv.setStyle({
                top: "0px",
                left: "0px"
            });
            container.appendChild(new Element("div").setStyle(Object.extend(style, {
                top: d + "px",
                opacity: options.glowOpacity
            })).update(text).setShadowColor(color).setUnselectable());
            container.appendChild(new Element("div").setStyle(Object.extend(style, {
                top: "-" + d + "px",
                opacity: options.glowOpacity
            })).update(text).setShadowColor(color).setUnselectable());
            container.appendChild(new Element("div").setStyle(Object.extend(style, {
                top: d + "px",
                left: "-" + d + "px",
                opacity: options.glowOpacity
            })).update(text).setShadowColor(color).setUnselectable());
            container.appendChild(new Element("div").setStyle(Object.extend(style, {
                top: d + "px",
                left: d + "px",
                opacity: options.glowOpacity
            })).update(text).setShadowColor(color).setUnselectable());
            container.appendChild(new Element("div").setStyle(Object.extend(style, {
                top: "-" + d + "px",
                left: "-" + d + "px",
                opacity: options.glowOpacity
            })).update(text).setShadowColor(color).setUnselectable());
            container.appendChild(new Element("div").setStyle(Object.extend(style, {
                top: "-" + d + "px",
                left: d + "px",
                opacity: options.glowOpacity
            })).update(text).setShadowColor(color).setUnselectable());
            break;
        default:
            shadowdiv.setStyle({
                top: d + "px",
                left: d + "px"
            });
        }
        shadowdiv.setShadowColor(color).setUnselectable();
        container.appendChild(shadowdiv);
    }
    textdiv.setStyle({
        position: "relative",
        zIndex: "120"
    });
    elem.appendChild(container);
    if (options.imageLike) {
        elem.setUnselectable().setStyle({
            cursor: "default"
        });
    }
    return element;
},
tooltip: function (element, text, options) {
	
    element = $(element);
    if ('Prototip' in window) {
        options = Object.extend({
            delay: 0.01
        }, options || {});
        new Tip(element, text, options);
        return element;
    }
    if (typeof text != "string") {
        return element;
    }
    options = Object.extend({
        className: false,
        fixed: false,
        opacity: 1,
        title: false,
        width: 200,
        height: 100,
        offset: false,
        zIndex: 100000,
        delay: false,
        duration: false,
        fadeIn: false,
        fadeOut: false,
        shadow: false
    }, options || {});
    text = (options.title) ? "<b>" + options.title + "</b><br>" + text : text;
    element.hover(function (el, evt) {
        var vpd = document.viewport.getDimensions();
        var getBoxLocation = function (e) {
            var offTop = options.offset.top ? options.offset.top : 15;
            var offLeft = options.offset.left ? options.offset.left : 15;
            var top = (Event.pointerY(e) + offTop);
            var left = (Event.pointerX(e) + offLeft);
            var dim = tooldiv.getDimensions();
            if (left + dim.width > (vpd.width - 20)) {
                left -= dim.width + 20 + offLeft;
            }
            if (top + dim.height > (vpd.height - 20)) {
                top -= dim.height + offTop;
            }
            return {
                top: top,
                left: left
            };
        };
        if (document.stopTooltip) {
            $$(".pp_tooltip_").each(function (t) {
                t.remove();
            });
            return true;
        }
        outer = new Element("div", {
            className: 'pp_tooltip_'
        }).setStyle({
            opacity: options.opacity,
            position: "absolute",
            zIndex: options.zIndex
        });
        if (options.className) {
            tooldiv = new Element("div", {
                className: options.className
            }).setStyle({
                position: "relative",
                top: "0px",
                left: "0px",
                zIndex: 10
            }).update(text);
        } else {
            tooldiv = new Element("div").setStyle({
                padding: "4px",
                background: "#eee",
                width: (options.width == "auto" ? "auto" : options.width + "px"),
                border: "1px solid #333",
                position: "absolute",
                top: "0px",
                left: "0px",
                zIndex: 10
            }).update(text);
            tooldiv.setCSSBorderRadius('5px');
        }
        if (options.shadow) {
            shadTop = options.shadow.top ? parseInt(options.shadow.top, 10) : 4;
            shadLeft = options.shadow.left ? parseInt(options.shadow.left, 10) : 4;
            shadBack = options.shadow.back ? options.shadow.back : "#000";
            shadOp = options.shadow.opacity ? options.shadow.opacity : 0.2;
            if (options.className) {
                shadow = new Element("div", {
                    className: options.className || ""
                }).setStyle({
                    position: "absolute",
                    borderColor: "#000",
                    color: "#000",
                    top: shadTop + "px",
                    left: shadLeft + "px",
                    zIndex: 9,
                    background: shadBack,
                    opacity: shadOp
                });
                shadow.update(text);
            } else {
                shadow = new Element("div", {
                    className: options.className || ""
                }).setStyle({
                    padding: "4px",
                    border: "1px solid black",
                    color: "#000",
                    width: options.width + "px",
                    position: "absolute",
                    top: shadTop + "px",
                    left: shadLeft + "px",
                    zIndex: 9,
                    background: shadBack,
                    opacity: shadOp
                });
                shadow.setCSSBorderRadius('5px');
                shadow.update(text);
            }
            outer.appendChild(shadow);
        }
        outer.appendChild(tooldiv);
        var makeItAppear = function () {
            if (options.fixed) {
                var fixTop = options.fixed.top ? parseInt(options.fixed.top, 10) : element.getHeight();
                var fixLeft = options.fixed.left ? parseInt(options.fixed.left, 10) : element.getWidth() - 50;
                outer.setStyle({
                    top: fixTop + "px",
                    left: fixLeft + "px"
                });
            } else {
                element.observe("mousemove", function (e) {
                    if (document.stopTooltip) {
                        $$(".pp_tooltip_").each(function (t) {
                            t.remove();
                        });
                        return true;
                    }
                    var loc = getBoxLocation(e);
                    outer.setStyle({
                        top: loc.top + "px",
                        left: loc.left + "px"
                    });
                });
            }
        };
        outer.delay = setTimeout(function () {
            if (options.fadeIn) {
                document.body.appendChild(outer);
                var fl = getBoxLocation(evt);
                outer.setStyle({
                    opacity: 0,
                    top: fl.top + "px",
                    left: fl.left + "px"
                });
                dur = options.fadeIn.duration ? options.fadeIn.duration : 1;
                outer.appear({
                    duration: dur,
                    onEnd: makeItAppear()
                });
            } else {
                document.body.appendChild(outer);
                var l = getBoxLocation(evt);
                outer.setStyle({
                    top: l.top + "px",
                    left: l.left + "px"
                });
                setTimeout(makeItAppear, 100);
            }
            if (options.duration) {
                outer.duration = setTimeout(function () {
                    if (options.fadeOut) {
                        dur = options.fadeOut.duration ? options.fadeOut.duration : 1;
                        outer.fade({
                            duration: dur,
                            onEnd: function () {
                                if (outer.parentNode) {
                                    outer.remove();
                                }
                            }
                        });
                    } else {
                        if (outer.parentNode) {
                            outer.remove();
                        }
                    }
                }, options.duration * 1000 || 0);
            }
        }, options.delay * 1000 || 0);
    }, function () {
        if (document.stopTooltip) {
            $$(".pp_tooltip_").each(function (t) {
                t.remove();
            });
            return true;
        }
        if (outer) {
            clearTimeout(outer.delay);
            clearTimeout(outer.duration);
        }
        if (options.fadeOut) {
            dur = options.fadeOut.duration ? options.fadeOut.duration : 0.2;
            outer.fade({
                duration: dur,
                onEnd: function () {
                    if (outer.parentNode) {
                        outer.remove();
                    }
                }
            });
        } else {
            if (outer.parentNode) {
                outer.remove();
            }
        }
    });
    return element;
},
softScroll: function (element, options) {
    var scroll = new Element('div', {
        className: 'scroll-bar'
    });
    var scrollStyle = new Element('div', {
        className: 'scroll-style'
    });
    var table = new Element('table', {
        cellpadding: 5,
        cellspacing: 0,
        height: '100%'
    }).insert(new Element('tbody').insert(new Element('tr').insert(new Element('td', {
        valign: 'top'
    }).setStyle('height:100%;').insert(scrollStyle))));
    scroll.insert(table);
    scroll.setStyle('position:absolute; top:0px; right:1px; width:16px; opacity:0; height:50%;');
    var container = element.wrap('div');

    function setScrollSize() {
        var ch = container.getHeight();
        var sh = element.scrollHeight;
        var per = ch * 100 / sh;
        scroll.style.height = per + "%";
    }
    setScrollSize();
    scroll.setDraggable({
        constraint: 'vertical',
        onDrag: function (el) {
            var top = parseInt(el.style.top, 10);
            if (top < 0) {
                el.style.top = "0px";
                return false;
            }
            var h = container.getHeight();
            var sh = scroll.getHeight();
            if ((top + sh) > h) {
                el.style.top = (h - (sh)) + "px";
                return false;
            }
            scrollArea(top);
        }
    });

    function scrollArea(pos) {
        var ch = container.getHeight();
        var sh = element.scrollHeight;
        var per = ch * 100 / sh;
        var posPer = pos * 100 / ch;
        var position = sh * posPer / 100;
        element.scrollTop = Math.round(position);
    }

    function updateScrollBar(pos) {
        var sh = element.scrollHeight;
        var ch = container.getHeight();
        var per = pos * 100 / sh;
        var position = ch * per / 100;
        scroll.style.top = Math.round(position) + "px";
    }
    container.hover(function () {
        scroll.shift({
            opacity: 1,
            duration: 0.5
        });
    }, function () {
        if (scroll.__dragging == true) {
            return;
        }
        scroll.shift({
            opacity: 0,
            duration: 0.5
        });
    })
    container.setStyle('position:relative; display:inline-block;');
    container.insert(scroll);
    var stime;
    element.observe(Event.mousewheel, function (e) {
        e.stop();
        var w = Event.wheel(e);
        clearTimeout(stime);
        element.stopAnimation();
        if (w > 0) {
            element.scrollTop = element.scrollTop - 20;
        } else if (w < 0) {
            element.scrollTop = element.scrollTop + 20;
        }
        updateScrollBar(element.scrollTop);
    });
},
setDraggable: function (element, options) {
    options = Object.extend({
        dragClass: "",
        handler: false,
        dragFromOriginal: false,
        onStart: Prototype.K,
        changeClone: Prototype.K,
        onDrag: Prototype.K,
        onDragEnd: Prototype.K,
        onEnd: Prototype.K,
        dragEffect: false,
        revert: false,
        clone: false,
        snap: false,
        cursor: "move",
        offset: false,
        constraint: false,
        constrainLeft: false,
        constrainRight: false,
        constrainTop: false,
        constrainBottom: false,
        constrainOffset: false,
        constrainViewport: false,
        constrainParent: false,
        dynamic: true
    }, options || {});
    if (options.snap && (typeof options.snap == "number" || typeof options.snap == "string")) {
        options.snap = [options.snap, options.snap];
    }
    var mouseUp = "mouseup",
        mouseDown = "mousedown",
        mouseMove = "mousemove";
    if (Prototype.Browser.MobileSafari) {}
    if (options.constrainOffset) {
        if (options.constrainOffset.length == 4) {
            options.constrainTop = options.constrainTop ? options.constrainTop : options.constrainOffset[0];
            options.constrainRight = options.constrainRight ? options.constrainRight : options.constrainOffset[1];
            options.constrainBottom = options.constrainBottom ? options.constrainBottom : options.constrainOffset[2];
            options.constrainLeft = options.constrainLeft ? options.constrainLeft : options.constrainOffset[3];
        }
    }
    var handler;
    var stopDragTimer = false;
    var drag = function (e) {
        Event.stop(e);
        if (mouseMove == "touchmove") {
            e = e.touches[0];
        }
        if (options.onDrag(drag_element, handler, e) === false) {
            return;
        }
        var top = startY + (Number(Event.pointerY(e) - mouseY));
        var left = startX + (Number(Event.pointerX(e) - mouseX));
        if (options.offset) {
            top = options.offset[1] + Event.pointerY(e);
            left = options.offset[0] + Event.pointerX(e);
        }
        if (options.snap) {
            top = (top / options.snap[1]).round() * options.snap[1];
            left = (left / options.snap[0]).round() * options.snap[0];
        }
        top = (options.constrainBottom !== false && top >= options.constrainBottom) ? options.constrainBottom : top;
        top = (options.constrainTop !== false && top <= options.constrainTop) ? options.constrainTop : top;
        left = (options.constrainRight !== false && left >= options.constrainRight) ? options.constrainRight : left;
        left = (options.constrainLeft !== false && left <= options.constrainLeft) ? options.constrainLeft : left;
        if (options.constraint == "vertical") {
            drag_element.setStyle({
                top: top + "px"
            });
        } else if (options.constraint == "horizontal") {
            drag_element.setStyle({
                left: left + "px"
            });
        } else {
            drag_element.setStyle({
                top: top + "px",
                left: left + "px"
            });
        }
        if (stopDragTimer) {
            clearTimeout(stopDragTimer);
        }
        options.onDrag(drag_element, handler, e);
        stopDragTimer = setTimeout(function () {
            options.onDragEnd(drag_element, handler, e);
        }, 50);
    };
    var mouseup = function (ev) {
        Event.stop(ev);
        if (mouseUp == "touchend") {
            ev = e.touches[0];
        }
        if (options.dynamic !== true) {
            document.temp.setStyle({
                top: element.getStyle('top'),
                left: element.getStyle('left')
            });
            element.parentNode.replaceChild(document.temp, element);
            document.temp.oldZIndex = element.oldZIndex;
            element = document.temp;
        }
        if (options.onEnd(drag_element, handler, ev) !== false) {
            if (element.oldZIndex) {
                drag_element.setStyle({
                    zIndex: element.oldZIndex
                });
            } else {
                drag_element.setStyle({
                    zIndex: ''
                });
            }
            if (options.revert) {
                if (options.revert === true) {
                    options.revert = {
                        easing: "sineIn",
                        duration: 0.5
                    };
                }
                options.revert = Object.extend({
                    left: drag_element.startX,
                    top: drag_element.startY,
                    opacity: 1,
                    duration: 0.5,
                    easing: 'sineIn'
                }, options.revert || {});
                drag_element.shift(options.revert);
                drag_element.startX = false;
                drag_element.startY = false;
            } else {
                if (options.dragEffect) {
                    drag_element.shift({
                        opacity: 1,
                        duration: 0.2
                    });
                }
            }
        }
        element.__dragging = false;
        drag_element.removeClassName(options.dragClass);
        handler.setSelectable();
        drag_element.setSelectable();
        $(document.body).setSelectable();
        document.stopObserving(mouseMove, drag);
        document.stopObserving(mouseUp, mouseup);
    };
    if (options.handler) {
        if (typeof options.handler == "string") {
            handler = (options.handler.startsWith(".")) ? element.descendants().find(function (h) {
                return h.className == options.handler.replace(/^\./, "");
            }) : $(options.handler);
        } else {
            handler = $(options.handler);
        }
    } else {
        handler = element;
    }
    handler.setStyle({
        cursor: options.cursor
    });
    handler.observe(mouseDown, function (e) {
        Event.stop(e);
        var evt = e;
        if (mouseDown == "touchstart") {
            e = e.touches[0];
        }
        element.__dragging = true;
        if (document.stopDrag) {
            return true;
        }
        if (options.dragFromOriginal && e.target != handler) {
            return false;
        }
        var vdim = false,
            voff = false;
        if (options.constrainElement) {
            voff = (Prototype.Browser.IE) ? {
                top: 0,
                left: 0
            } : $(options.constrainElement).cumulativeOffset();
            vdim = $(options.constrainElement).getDimensions();
        }
        if (options.constrainParent) {
            if ($(element.parentNode).getStyle('position') == "relative" || $(element.parentNode).getStyle('position') == "absolute") {
                voff = {
                    top: 0,
                    left: 0
                };
            } else {
                voff = (Prototype.Browser.IE) ? {
                    top: 0,
                    left: 0
                } : $(element.parentNode).cumulativeOffset();
            }
            vdim = $(element.parentNode).getDimensions();
        }
        if (options.constrainViewport) {
            voff = $(document.body).cumulativeScrollOffset();
            vdim = document.viewport.getDimensions();
        }
        if (vdim) {
            vdim.height += voff.top;
            vdim.width += voff.left;
            options.constrainTop = voff.top + 1;
            options.constrainBottom = vdim.height - (element.getHeight() + 3);
            options.constrainRight = vdim.width - (element.getWidth() + 3);
            options.constrainLeft = voff.left + 1;
        }
        if (options.dynamic !== true) {
            try {
                document.temp = element;
                var temp_div = new Element('div').setStyle({
                    height: element.getHeight() + "px",
                    width: element.getWidth() + "px",
                    border: '1px dashed black',
                    top: element.getStyle('top') || 0,
                    left: element.getStyle('left') || 0,
                    zIndex: element.getStyle('zIndex') || 0,
                    position: element.getStyle('position'),
                    background: '#f5f5f5',
                    opacity: 0.3
                });
            } catch (e) {}
            element.parentNode.replaceChild(temp_div, element);
            element = temp_div;
        }
        if (["relative", "absolute"].include($(element.parentNode).getStyle('position'))) {
            startX = element.getStyle("left") ? parseInt(element.getStyle("left"), 10) : element.offsetLeft;
            startY = element.getStyle("top") ? parseInt(element.getStyle("top"), 10) : element.offsetTop;
        } else {
            var eloff = element.cumulativeOffset();
            startX = eloff.left;
            startY = eloff.top;
        }
        mouseX = Number(Event.pointerX(e));
        mouseY = Number(Event.pointerY(e));
        if (options.clone) {
            drag_element = options.changeClone(element.cloneNode({
                deep: true
            }), startX, startY);
            $(document.body).insert(drag_element);
        } else {
            drag_element = element;
        }
        options.onStart(drag_element, handler, e);
        drag_element.addClassName(options.dragClass);
        element.oldZIndex = element.getStyle("z-index") || 0;
        if (options.dragEffect) {
            drag_element.shift({
                opacity: 0.7,
                duration: 0.2
            });
        }
        drag_element.setStyle({
            position: "absolute",
            zIndex: 99998
        });
        if (options.revert && !drag_element.startX && !drag_element.startY) {
            drag_element.startX = startX;
            drag_element.startY = startY;
        }
        drag_element.setUnselectable();
        handler.setUnselectable();
        $(document.body).setUnselectable();
        document.observe(mouseMove, drag);
        document.observe(mouseUp, mouseup);
    });
    return element;
},
rating: function (element, options) {
    element = $(element);
    options = Object.extend({
        imagePath: "stars.png",
        onRate: Prototype.K,
        resetButtonImage: false,
        resetButtonTitle: 'Cancel Your Rating',
        resetButton: true,
        inputClassName: '',
        titles: [],
        disable: false,
        disabled: element.getAttribute("disabled") ? element.getAttribute("disabled") : false,
        stars: element.getAttribute("stars") ? element.getAttribute("stars") : 5,
        name: element.getAttribute("name") ? element.getAttribute("name") : "rating",
        value: element.getAttribute("value") ? element.getAttribute("value") : 0,
        cleanFirst: false
    }, options || {});
    if (element.converted) {
        return element;
    }
    element.converted = true;
    var image = {
        blank: "0px 0px",
        over: "-16px 0px",
        clicked: "-32px 0px",
        half: "-48px 0px"
    };
    var hidden = new Element("input", {
        type: "hidden",
        name: options.name,
        className: options.inputClassName
    });
    var stardivs = $A([]);
    element.disabled = (options.disabled == "true" || options.disabled === true) ? true : false;
    element.setStyle({
        display: 'inline-block',
        width: ((parseInt(options.stars, 10) + (options.resetButton ? 1 : 0)) * 20) + "px",
        cursor: options.disabled ? "default" : "pointer"
    });
    element.setUnselectable();
    if (options.cleanFirst) {
        element.update();
    }
    var setStar = function (i) {
        var elval = i;
        i = i || 0;
        var desc = $A(element.descendants());
        desc.each(function (e) {
            e.setStyle({
                backgroundPosition: image.blank
            }).removeClassName("rated");
        });
        desc.each(function (e, c) {
            if (c < i) {
                e.setStyle({
                    backgroundPosition: image.clicked
                }).addClassName("rated");
            }
        });
        hidden.value = i || "";
        if (options.disable) {
            element.disabled = true;
            element.setStyle({
                cursor: "default"
            });
        }
        element.value = elval;
        options.onRate(element, options.name, i);
        element.run('keyup');
        hidden.run('change');
        if (options.resetButton) {
            cross[(i === 0) ? "hide" : "show"]();
        }
    };
    element.setRating = setStar;
    $A($R(1, options.stars)).each(function (i) {
        var star = new Element("div").setStyle({
            height: "16px",
            width: "16px",
            margin: "0.5px",
            cssFloat: "left",
            backgroundImage: "url(" + options.imagePath + ")"
        });
        star.observe("mouseover", function () {
            if (!element.disabled) {
                var desc = $A(element.descendants());
                desc.each(function (e, c) {
                    if (c < i) {
                        e.setStyle({
                            backgroundPosition: e.hasClassName("rated") ? image.clicked : image.over
                        });
                    }
                });
            }
        }).observe("click", function () {
            if (!element.disabled) {
                setStar(i);
            }
        });
        if (options.titles && options.titles[i - 1]) {
            star.title = options.titles[i - 1];
        }
        stardivs.push(star);
    });
    if (!options.disabled) {
        element.observe("mouseout", function () {
            element.descendants().each(function (e) {
                e.setStyle({
                    backgroundPosition: e.hasClassName("rated") ? image.clicked : image.blank
                });
            });
        });
    }
    if (options.resetButton) {
        var cross = new Element("div").setStyle({
            height: "16px",
            width: "16px",
            margin: "0.5px",
            cssFloat: "left",
            color: '#999',
            fontSize: '12px',
            textAlign: 'center'
        });
        if (options.resetButtonImage) {
            cross.insert(new Element('img', {
                src: options.resetButtonImage,
                align: 'absmiddle'
            }));
        } else {
            cross.insert(' x ');
        }
        cross.title = options.resetButtonTitle;
        cross.hide();
        cross.observe('click', function () {
            setStar(undefined);
        });
        stardivs.push(cross);
    }
    stardivs.each(function (star) {
        element.insert(star);
    });
    element.insert(hidden);
    if (options.value > 0) {
        element.descendants().each(function (e, c) {
            c++;
            if (c <= options.value) {
                e.setStyle({
                    backgroundPosition: image.clicked
                }).addClassName("rated");
            }
            if (options.value > c - 1 && options.value < c) {
                e.setStyle({
                    backgroundPosition: image.half
                }).addClassName("rated");
            }
        });
        hidden.value = options.value;
    }
    return element;
},
makeSearchBox: function (element, options) {
    element = $(element);
    if (element.up('.searchbox')) {
        return element;
    }
    options = Object.extend({
        defaultText: "Search",
        onWrite: Prototype.K,
        onClear: Prototype.K,
        imagePath: "/sistema/images/apple_search.png"
    }, options || {});
    element.observe("keyup", function (e) {
        if (cross) {
            cross.setStyle({
                backgroundPosition: element.value !== "" ? "0 -57px" : "0 -38px"
            });
        }
        options.onWrite(element.value, e);
    }).observe("focus", function () {
        if (element.value == options.defaultText) {
            element.value = "";
            element.setStyle({
                color: "#666"
            });
        }
    }).observe("blur", function () {
        if (element.value === "") {
            element.setStyle({
                color: "#999"
            });
            element.value = options.defaultText;
            if (cross) {
                cross.setStyle({
                    backgroundPosition: element.value !== "" ? "0 -57px" : "0 -38px"
                });
            }
        }
    });
    element.value = options.defaultText;
    element.setStyle({
        color: "#999"
    });
    if (element.type !== 'text') {
        element.addClassName("searchbox");
        element.observe('search', function () {
            element.run('keyup');
        });
        return element;
    }
    element.setStyle({
        border: "none",
        background: "none",
        height: "14px",
        width: (parseInt(element.getStyle("width"), 10) - 32) + "px"
    });
    var tbody;
    var table = new Element("table", {
        cellpadding: 0,
        cellspacing: 0,
        className: "searchbox"
    }).setStyle({
        height: "19px",
        fontFamily: "Verdana, Geneva, Arial, Helvetica, sans-serif",
        fontSize: "12px"
    }).insert(tbody = new Element("tbody"));
    var tr = new Element("tr");
    var cont = new Element("td").setStyle({
        backgroundImage: "url(" + options.imagePath + ")",
        backgroundPosition: "0 -19px"
    });
    var cross = new Element("td").insert("&nbsp;").setStyle({
        cursor: 'default'
    });
    tbody.insert(tr.insert(new Element("td").setStyle({
        backgroundImage: "url(" + options.imagePath + ")",
        backgroundPosition: "0 0",
        width: "10px"
    }).insert("&nbsp;")).insert(cont).insert(cross));
    cross.setStyle({
        backgroundImage: "url(" + options.imagePath + ")",
        backgroundPosition: element.value !== "" ? "0 -57px" : "0 -38px",
        width: "17px"
    });
    cross.observe("click", function () {
        element.value = "";
        element.focus();
        element.setStyle({
            color: "#333"
        });
        cross.setStyle({
            backgroundPosition: "0 -38px"
        });
        options.onClear(element);
        element.run('keyup');
    });
    element.parentNode.replaceChild(table, element);
    cont.insert(element);
    return element;
},
slider: function (element, options) {
    element = $(element);
    options = Object.extend({
        width: 100,
        onUpdate: Prototype.K,
        maxValue: 100,
        value: 0,
        buttonBack: 'url("/sistema/images/ball.png") no-repeat scroll 0px 0px transparent'
    }, options || {});
    var valueToPixel = function (value) {
        var val = (value * 100 / options.maxValue) * barWidth / 100;
        val = val < 3 ? 3 : val;
        return Math.round(val);
    };
    var sliderOut = new Element('div', {
        tabindex: 1,
        className: element.className
    });
    var sliderBar = new Element('div');
    var sliderButton = new Element('div', {
        id: new Date().getTime()
    });
    var sliderTable = new Element('table', {
        cellpadding: 0,
        cellspacing: 1,
        border: 0,
        width: options.width
    });
    var tbody = new Element('tbody');
    var tr = new Element('tr');
    var tr2 = new Element('tr');
    var sliderTD = new Element('td', {
        colspan: 3
    });
    var startTD = new Element('td', {
        align: 'center',
        width: 20
    }).insert('0');
    var statTD = new Element('td', {
        align: 'center',
        width: options.width - 40
    }).insert(options.value).setStyle('font-weight:bold');
    var endTD = new Element('td', {
        align: 'center',
        width: 20
    }).insert(options.maxValue);
    var barWidth = options.width - 18;
    options.value = valueToPixel(options.value);
    var moveLEFT = function (amount) {
        var l = parseInt(sliderButton.getStyle('left'), 10) - amount;
        l = (l <= 3) ? 3 : l;
        sliderButton.setStyle({
            left: l + "px"
        });
        updateValue(l);
    };
    var moveRIGTH = function (amount) {
        var l = parseInt(sliderButton.getStyle('left'), 10) + amount;
        l = (l >= barWidth) ? barWidth : l;
        sliderButton.setStyle({
            left: l + "px"
        });
        updateValue(l);
    };
    var sliderKeys = function (e) {
        e = document.getEvent(e);
        if (e.keyCode == 37) {
            moveLEFT(5);
        } else if (key == 39) {
            moveRIGTH(5);
        }
    };
    var sliderWheel = function (e) {
        if (!sliderOut.__hasFocus) {
            return true;
        }
        e.stop();
        sliderOut.focus();
        var w = Event.wheel(e);
        if (w > 0) {
            moveRIGTH(5);
        } else if (w < 0) {
            moveLEFT(5);
        }
    };
    var updateValue = function (pos) {
        var total = barWidth;
        if (parseInt(pos, 10) <= 3) {
            element.value = 0;
        } else {
            element.value = parseInt(((parseInt(pos, 10) * options.maxValue) / total), 10);
        }
        sliderOut.value = element.value === 0 ? "" : element.value;
        options.onUpdate(element.value);
        statTD.innerHTML = element.value;
        return element.value;
    };
    sliderOut.setStyle({
        width: options.width + 'px',
        position: 'relative',
        overflow: 'hidden',
        outline: 'none'
    });
    sliderBar.setStyle({
        border: '1px solid #999',
        background: '#eee',
        margin: '8px',
        overflow: 'hidden',
        height: '3px'
    }).setCSSBorderRadius('4px');
    sliderButton.setStyle({
        position: 'absolute',
        height: '13px',
        width: '13px',
        background: options.buttonBack,
        overflow: 'hidden',
        border: '1px solid transparent',
        top: '3px',
        left: options.value + 'px'
    }).setCSSBorderRadius('8px');
    startTD.setStyle({
        fontFamily: 'Verdana',
        fontSize: '9px'
    });
    statTD.setStyle({
        fontFamily: 'Verdana',
        fontSize: '9px'
    });
    endTD.setStyle({
        fontFamily: 'Verdana',
        fontSize: '9px'
    });
    sliderOut.insert(sliderBar).insert(sliderButton);
    sliderTable.insert(tbody.insert(tr).insert(tr2));
    sliderTD.insert(sliderOut);
    tr.insert(sliderTD);
    tr2.insert(startTD).insert(statTD).insert(endTD);
    sliderButton.setDraggable({
        constraint: 'horizontal',
        dragEffect: false,
        cursor: 'default',
        constrainLeft: 3,
        constrainRight: barWidth,
        onDrag: function (i) {
            updateValue(i.getStyle('left'));
        }
    });
    sliderOut.observe('focus', function () {
        sliderOut.__hasFocus = true;
        sliderOut.setStyle({
            borderColor: '#333'
        });
    }).observe('blur', function () {
        sliderOut.__hasFocus = false;
        sliderOut.setStyle({
            borderColor: '#ccc'
        });
    });
    sliderOut.observe('keypress', sliderKeys).observe(Event.mousewheel, sliderWheel);
    sliderOut.observe('click', function (e) {
        if (e.target.id == sliderButton.id) {
            return false;
        }
        var l = (Event.pointerX(e) - sliderBar.cumulativeOffset().left);
        l = l < 3 ? 3 : l;
        l = l > barWidth ? barWidth : l;
        sliderButton.shift({
            left: l,
            duration: 0.5
        });
        updateValue(l);
    });
    var hidden = new Element('input', {
        type: 'hidden',
        name: element.name,
        id: element.id
    });
    element.parentNode.replaceChild(hidden, element);
    element = hidden;
    $(hidden.parentNode).insert(sliderTable.setUnselectable());
    hidden.setSliderValue = function (val) {
        var v = valueToPixel(val);
        sliderButton.shift({
            left: v,
            duration: 0.5
        });
        updateValue(v);
    };
    return hidden;
},
spinner: function (element, options) {
    element = $(element);
	
    options = Object.extend({
        width: 60,
        cssFloat: false,
        allowNegative: false,
        addAmount: 1,
        maxValue: false,
        minValue: false,
        readonly: false,
        value: false,
        imgPath: '/sistema/images/',
        onChange: Prototype.K
    }, options || {});
    element.size = 5;
    if (options.value === false) {
        element.value = parseFloat(element.value) || '0';
    } else {
        element.value = options.value;
    }
    if (element.value < options.minValue) {
        element.value = options.minValue;
    }
    element.writeAttribute('autocomplete', 'off');
    var buttonStyles = {
        height: '10px',
        cursor: 'default',
        textAlign: 'center',
        width: '7px',
        fontSize: '9px',
        paddingLeft: '4px',
        paddingRight: '2px',
        border: '1px solid #ccc',
        background: '#f5f5f5'
    };
    var spinnerContainer = new Element('div', {
        tabindex: '1'
    });
    if (options.cssFloat) {
        spinnerContainer.setStyle({
            cssFloat: options.cssFloat
        });
    }
    spinnerContainer.setStyle({
        width: options.width + "px"
    });
    var spinnerTable, tbody, tr, tr2, inputTD, upTD, downTD;
    spinnerTable = new Element('table', {
        className: 'form-spinner',
        cellpadding: 0,
        cellspacing: 0,
        border: 0,
        height: 20,
        width: options.width
    });
    tbody = new Element('tbody').insert(tr = new Element('tr'));
    spinnerContainer.insert(spinnerTable);
    spinnerTable.insert(tbody);
    element.parentNode.replaceChild(spinnerContainer, element);
    tr.insert(inputTD = new Element('td', {
        className: 'form-spinner-input-td',
        rowspan: 2
    }).insert(element)).insert(upTD = new Element('td', {
        className: 'form-spinner-up'
    }).insert(new Element('img', {
        src: options.imgPath + 'bullet_arrow_up.png',
        align: 'right'
    })));
    tbody.insert(tr2 = new Element('tr').insert(downTD = new Element('td', {
        className: 'form-spinner-down'
    }).insert(new Element('img', {
        src: options.imgPath + 'bullet_arrow_down.png',
        align: 'right'
    }))));
    spinnerTable.setStyle({
        border: '1px solid #ccc',
        borderCollapse: 'collapse',
        background: '#fff'
    });
    upTD.setStyle(buttonStyles);
    downTD.setStyle(buttonStyles);
    inputTD.setStyle({
        paddingRight: '2px'
    });
    element.setStyle({
        height: '100%',
        width: '100%',
        border: 'none',
        padding: '0px',
        fontSize: '14px',
        textAlign: 'right',
        outline: 'none'
    });
    var numberUP = function (e) {
        if (!parseFloat(element.value)) {
            element.value = 0;
        }
        if (options.maxValue && Number(element.value) >= Number(options.maxValue)) {
            return;
        }
        element.value = parseFloat(element.value) + parseInt(options.addAmount, 10);
        options.onChange(element.value);
    };
    var numberDOWN = function (e) {
        if (!parseFloat(element.value)) {
            element.value = 0;
        }
        if (options.minValue && Number(element.value) <= Number(options.minValue)) {
            return;
        }
        if (!options.allowNegative && element.value == '0') {
            return;
        }
        element.value = parseFloat(element.value) - options.addAmount;
        options.onChange(element.value);
    };
    var spinnerKeys = function (e, mode) {
        if (e.target.tagName == "INPUT" && mode == 2) {
            return;
        }
        e = document.getEvent(e);
        if (e.keyCode == 38) {
            numberUP(e);
        } else if (e.keyCode == 40) {
            numberDOWN(e);
        }
    };
    upTD.observe('click', function (e) {
        element.run('keyup');
        numberUP(e);
    }).setUnselectable();
    downTD.observe('click', function (e) {
        element.run('keyup');
        numberDOWN(e);
    }).setUnselectable();
    element.observe(Prototype.Browser.Gecko ? 'keypress' : 'keydown', function (e) {
        spinnerKeys(e, 1);
    });
    spinnerContainer.observe(Prototype.Browser.Gecko ? 'keypress' : 'keydown', function (e) {
        spinnerKeys(e, 2);
    });
    if (options.readonly) {
        element.writeAttribute('readonly', "readonly");
    }
    element.observe('change', function () {
        options.onChange(element.value);
    });
    return element;
},
colorPicker: function (element, options) {
    options = Object.extend({
        title: 'Pick a Color',
        background: '#eee',
        trigger: false,
        onPicked: Prototype.K,
        onComplete: Prototype.K,
        onStart: Prototype.K,
        onEnd: Prototype.K
    }, options || {});

    function sortColors(cols) {
        var obj = {};
        $H(cols).sortBy(function (p) {
            var rgb = Protoplus.Colors.hexToRgb(p.value);
            return rgb[0] + rgb[1] + rgb[2];
        }).each(function (item) {
            obj[item[0]] = item[1];
        });
        return obj;
    }
    $(options.trigger || element).observe('click', function () {
        if (options.onStart() === false) {
            element.colorPickerEnabled = false;
            return element;
        }
        var validCSSColors = Protoplus.Colors.getPalette();
        if (element.colorPickerEnabled) {
            return false;
        }
        var colorTD, colorTD2, selectTD, tr, colorTR, selectTR, tbody;
        var table = new Element('table', {
            cellpadding: 4,
            cellspacing: 0,
            border: 0,
            width: 140
        }).setStyle({
            zIndex: 100000
        }).insert(tbody = new Element('tbody'));
        if (options.className) {
            table.addClassName(options.className);
        } else {
            table.setStyle({
                background: options.background,
                outline: '1px solid #aaa',
                border: '1px solid #fff'
            });
        }
        tbody.insert(tr = new Element('tr').insert(new Element('th', {
            className: 'titleHandler',
            colspan: '2',
            height: '10'
        }).setText(options.title).setStyle({
            paddingTop: '2px',
            paddingBottom: '0px',
            color: '#333',
            fontSize: '14px'
        }))).insert(colorTR = new Element('tr')).insert(selectTR = new Element('tr'));
        colorTR.insert(colorTD = new Element('td'));
        colorTR.insert(colorTD2 = new Element('td'));
        selectTR.insert(selectTD = new Element('td', {
            colspan: 2
        }));
        var box = new Element('input', {
            type: 'text'
        }).setStyle({
            width: '48px',
            margin: '1px'
        });
        box.observe('keyup', function () {
            box.setStyle({
                background: box.value,
                color: Protoplus.Colors.invert(box.value)
            });
        });
        var flip = new Element('input', {
            type: 'button',
            value: 'Flip'
        });
        flip.observe('click', function () {
            var sc = overFlowDiv.getScroll();
            scr = 0;
            if (sc.y >= 0) {
                scr = 140;
            }
            if (sc.y >= colorTable.getHeight() - 140) {
                scr = 0;
            } else {
                scr = sc.y + 140;
            }
            overFlowDiv.shift({
                scrollTop: scr,
                link: 'ignore',
                duration: 0.3
            });
        });
        var OK = new Element('input', {
            type: 'button',
            value: 'OK'
        }).observe('click', function () {
            if (element.tagName == "INPUT") {
                element.value = box.value;
                element.focus();
            }
            table.remove();
            setTimeout(function () {
                element.colorPickerEnabled = false;
                options.onComplete(box.value, element, table);
            }, 100);
        });
        if (options.buttonClass) {
            $(flip, OK).invoke('addClassName', options.buttonClass);
        } else {
            $(flip, OK).invoke('setStyle', {
                padding: '1px',
                margin: '1px',
                background: '#f5f5f5',
                border: '1px solid #ccc'
            });
        }
        element.closeColorPicker = function () {
            OK.run('click');
        }
        selectTD.insert(box).insert(flip).insert(OK);
        var colorTable = new Element('table', {
            cellpadding: 0,
            cellspacing: 0,
            border: 0,
            width: 140
        });
        var colorTbody = new Element('tbody'),
            colCount = 0,
            colTR;
        $H(validCSSColors).each(function (color) {
            if (colCount == 7) {
                colCount = 0;
            }
            if (colCount++ === 0) {
                colTR = new Element('tr');
                colorTbody.insert(colTR);
            }
            var tdSize = 20;
            var pick = function (e) {
                box.value = color.value;
                box.setStyle({
                    background: box.value,
                    color: Protoplus.Colors.invert(box.value)
                });
                options.onPicked(box.value, element, table);
            };
            if (color.value === false) {
                colTR.insert(new Element('td', {
                    width: tdSize,
                    height: tdSize
                }).setStyle({
                    background: '#fff'
                }).setStyle({}));
            } else {
                colTR.insert(new Element('td', {
                    width: tdSize,
                    height: tdSize
                }).setStyle({
                    background: color.value
                }).observe('click', pick).tooltip(color.value, {
                    delay: 0.6,
                    width: 'auto'
                }));
            }
        });
        colorTable.insert(colorTbody);
        var overFlowDiv = new Element('div').setStyle({
            outline: '1px solid #fff',
            border: '1px solid #666',
            overflow: 'hidden',
            height: '140px'
        });
        var preTable = new Element('table', {
            cellPadding: 0,
            cellspacing: 0,
            width: 40
        }).setStyle({
            outline: '1px solid #fff',
            border: '1px solid #666',
            overflow: 'hidden',
            height: '140px'
        });
        var preTbody = new Element('tbody');
        preTable.insert(preTbody);
        colorTD2.insert(preTable);
        colorTD.insert(overFlowDiv.insert(colorTable));
        var preColors = [
            ["Black:#000000", "Navy:#000080"],
            ["Blue:#0000FF", "Magenta:#FF00FF"],
            ["Red:#FF0000", "Brown:#A52A2A"],
            ["Pink:#FFC0CB", "Orange:#FFA500"],
            ["Green:#008000", "Yellow:#FFFF00"],
            ["Gray:#808080", "Turquoise:#40E0D0"],
            ["Cyan:#00FFFF", "White:#FFFFFF"]
        ];
        $R(0, 6).each(function (i) {
            var tr = new Element('tr');
            preTbody.insert(tr);
            tr.insert(new Element('td', {
                height: 20,
                width: 20
            }).setText('&nbsp;').setStyle({
                background: preColors[i][0].split(':')[1]
            }).tooltip(preColors[i][0].split(':')[0], {
                delay: 0.6,
                width: 'auto'
            }).observe('click', function () {
                box.value = preColors[i][0].split(':')[1];
                box.setStyle({
                    background: box.value,
                    color: Protoplus.Colors.invert(box.value)
                });
                options.onPicked(box.value, element, table);
            }));
            tr.insert(new Element('td', {
                height: 20,
                width: 20
            }).setText('&nbsp;').setStyle({
                background: preColors[i][1].split(':')[1]
            }).tooltip(preColors[i][1].split(':')[0], {
                delay: 0.6,
                width: 'auto'
            }).observe('click', function () {
                box.value = preColors[i][1].split(':')[1];
                box.setStyle({
                    background: box.value,
                    color: Protoplus.Colors.invert(box.value)
                });
                options.onPicked(box.value, element, table);
            }));
        });
        var top = element.cumulativeOffset().top + element.getHeight();
        var left = element.cumulativeOffset().left;
        table.setStyle({
            position: 'absolute',
            top: top + 3 + "px",
            left: left + 2 + 'px'
        });
        table.setDraggable({
            handler: table.select('.titleHandler')[0],
            dragEffect: false
        });
        $(document.body).insert(table);
        options.onEnd(element, table);
        overFlowDiv.setScroll({
            y: '0'
        });
        element.colorPickerEnabled = true;
    });
    return element;
},
colorPicker2: function (element, options) {
    options = Object.extend({
        onStart: Prototype.K,
        onEnd: Prototype.K,
        trigger: false,
        onPicked: Prototype.K,
        onComplete: Prototype.K,
        hideOnBlur: false,
        buttonClass: 'big-button buttons'
    }, options || {});
    $(options.trigger || element).observe('click', function () {
        var docEvent = false;
        if (element.colorPickerEnabled) {
            return element;
        }
        if (options.onStart() === false) {
            return element;
        }
        if (options.hideOnBlur) {
            setTimeout(function () {
                docEvent = Element.on(document, 'click', function (e) {
                    var el = Event.findElement(e, '.plugin, ');
                    if (!el) {
                        element.closeColorPicker();
                    }
                });
            }, 0);
        }
element.colorPickerEnabled = true;
var scrollOffset = element.cumulativeScrollOffset();
var stop = 1;
var top = element.measure('cumulative-top') + 2;
var left = element.measure('cumulative-left') + 1 - scrollOffset.left;
var height = element.measure('border-box-height');
var plugin = new Element('div', {
    className: 'plugin edit-box'
});
var plugCUR = new Element('div', {
    className: 'plugCUR'
});
var plugHEX = new Element('input', {
    type: 'text',
    size: '10',
    className: 'plugHEX'
});
var SV = new Element('div', {
    className: 'SV'
}).setUnselectable();
var SVslide = new Element('div', {
    className: 'SVslide'
});
var H = new Element('form', {
    className: 'H'
}).setUnselectable();
var Hslide = new Element('div', {
    className: 'Hslide'
});
var Hmodel = new Element('div', {
    className: 'Hmodel'
});
var complete = new Element('button', {
    type: 'button',
    className: ''
});
plugin.insert('<br>').insert(SV).insert(H);
plugin.insert(plugCUR).insert(plugHEX.setValue('#FFFFFF')).insert(complete.update('OK'));
SV.insert(SVslide.update('<br>'));
H.insert(Hslide.update('<br>')).insert(Hmodel);
plugin.setStyle({
    position: 'absolute',
    top: (top + height) + 'px',
    left: left + 'px',
    zIndex: '10000000'
});
SVslide.setStyle('top:-4px; left:-4px;');
Hslide.setStyle('top:0px; left:-8px;');
complete.setStyle('float:right;margin-top:8px;').addClassName(options.buttonClass);
plugin.observe('mousedown', function (e) {
    HSVslide('drag', plugin, e);
});
plugHEX.observe('mousedown', function (e) {
    stop = 0;
    setTimeout(function () {
        stop = 1;
    }, 100);
});
SV.observe('mousedown', function (e) {
    HSVslide(SVslide, plugin, e);
});
H.observe('mousedown', function (e) {
    HSVslide(Hslide, plugin, e);
});
complete.observe('click', function () {
    plugin.remove();
    element.colorPickerEnabled = false;
    if (docEvent) {
        docEvent.stop();
    }
    options.onComplete(plugHEX.value);
});
element.closeColorPicker = function () {
    complete.run('click');
}

function abPos(o) {
    o = (typeof(o) == 'object' ? o : $(o));
    var z = {
        X: 0,
        Y: 0
    };
    while (o !== null) {
        z.X += o.offsetLeft;
        z.Y += o.offsetTop;
        o = o.offsetParent;
    }
    return (z);
}

function within(v, a, z) {
    return ((v >= a && v <= z) ? true : false);
}

function XY(e, v) {
    var evt = e || window.event;
    var z = [Event.pointerX(evt), Event.pointerY(evt)];
    v = parseInt(v, 10);
    return (z[!isNaN(v) ? v : 0]);
}
var maxValue = {
    'H': 360,
    'S': 100,
    'V': 100
};
var HSV = {
    H: 360,
    S: 100,
    V: 100
};
var slideHSV = {
    H: 360,
    S: 100,
    V: 100
};

function HSVslide(d, o, e) {
    function tXY(e) {
        tY = XY(e, 1) - ab.Y;
        tX = XY(e) - ab.X;
    }

    function mkHSV(a, b, c) {
        return (Math.min(a, Math.max(0, Math.ceil((parseInt(c, 10) / b) * a))));
    }

    function ckHSV(a, b) {
        if (within(a, 0, b)) {
            return (a);
        } else if (a > b) {
            return (b);
        } else if (a < 0) {
            return ('-' + oo);
        }
    }

    function drag(e) {
        if (!stop) {
            if (d != 'drag') {
                tXY(e);
            }
            if (d == SVslide) {
                ds.left = ckHSV(tX - oo, 162) + 'px';
                ds.top = ckHSV(tY - oo, 162) + 'px';
                slideHSV.S = mkHSV(100, 162, ds.left);
                slideHSV.V = 100 - mkHSV(100, 162, ds.top);
                HSVupdate();
            } else if (d == Hslide) {
                var ck = ckHSV(tY - oo, 163),
                    r = 'HSV',
                    z = {};
                ds.top = (ck) + 'px';
                slideHSV.H = mkHSV(360, 163, ck);
                z.H = maxValue.H - mkHSV(maxValue.H, 163, ck);
                z.S = HSV.S;
                z.V = HSV.V;
                HSVupdate(z);
                SV.style.backgroundColor = '#' + color.HSV_HEX({
                    H: HSV.H,
                    S: 100,
                    V: 100
                });
            } else if (d == 'drag') {
                ds.left = XY(e) + oX - eX + 'px';
                ds.top = XY(e, 1) + oY - eY + 'px';
            }
        }
    }
    if (stop) {
        stop = '';
        var ds = $(d != 'drag' ? d : o).style;
        if (d == 'drag') {
            var oX = parseInt(ds.left, 10),
                oY = parseInt(ds.top, 10),
                eX = XY(e),
                eY = XY(e, 1);
        } else {
            var ab = abPos($(o)),
                tX, tY, oo = (d == Hslide) ? 0 : 4;
            ab.X += 10;
            ab.Y += 22;
            if (d == SVslide) {
                slideHSV.H = HSV.H;
            }
        }
        document.onmousemove = drag;
        document.onmouseup = function () {
            stop = 1;
            document.onmousemove = '';
            document.onmouseup = '';
        };
        drag(e);
    }
}

function HSVupdate(v) {
    v = HSV = v ? v : slideHSV;
    v = color.HSV_HEX(v);
    plugHEX.value = '#' + v;
    plugCUR.style.background = '#' + v;
    if (element.tagName == 'BUTTON') {
        element.__colorvalue = '#' + v
    } else {
        element.value = '#' + v;
    }
    options.onPicked('#' + v, element, plugin);
    return (v);
}

function setValue(colorcode) {
    var rgb = Protoplus.Colors.getRGBarray(colorcode);
    var hsv = color.RGB_HSV(rgb[0], rgb[1], rgb[2]);
    SV.style.backgroundColor = '#' + color.HSV_HEX({
        H: hsv.H,
        S: 100,
        V: 100
    });
    Hslide.style.top = Math.abs(Math.ceil((hsv.H * 163) / 360) - 163) + "px";
    var t = Math.abs((Math.floor((hsv.V * 162) / 100)) - 162);
    var l = Math.abs((Math.floor((hsv.S * 162) / 100)));
    if (t <= 0) {
        t = t - 4;
    }
    if (l <= 0) {
        l = l - 4;
    }
    SVslide.style.top = t + "px";
    SVslide.style.left = l + "px";
    HSVupdate(hsv);
}
element.setColorPickerValue = setValue;

function loadSV() {
    var z = '';
    for (var i = 165; i >= 0; i--) {
        z += "<div style=\"BACKGROUND: #" + color.HSV_HEX({
            H: Math.round((360 / 165) * i),
            S: 100,
            V: 100
        }) + ";\"><br /><\/div>";
    }
    Hmodel.innerHTML = z;
}
var color = {
    cords: function (W) {
        var W2 = W / 2,
            rad = (hsv.H / 360) * (Math.PI * 2),
            hyp = (hsv.S + (100 - hsv.V)) / 100 * (W2 / 2);
        $('mCur').style.left = Math.round(Math.abs(Math.round(Math.sin(rad) * hyp) + W2 + 3)) + 'px';
        $('mCur').style.top = Math.round(Math.abs(Math.round(Math.cos(rad) * hyp) - W2 - 21)) + 'px';
    },
    HEX: function (o) {
        o = Math.round(Math.min(Math.max(0, o), 255));
        return ("0123456789ABCDEF".charAt((o - o % 16) / 16) + "0123456789ABCDEF".charAt(o % 16));
    },
    RGB_HSV: function (r, g, b) {
        r = r / 255;
        g = g / 255;
        b = b / 255;
        var max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        var h, s, v = max;
        var d = max - min;
        s = max == 0 ? 0 : d / max;
        if (max == min) {
            h = 0;
        } else {
            switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
            }
            h /= 6;
        }
        return {
            H: h * 360,
            S: s * 100,
            V: v * 100
        };
    },
    RGB_HEX: function (o) {
        var fu = color.HEX;
        return (fu(o.R) + fu(o.G) + fu(o.B));
    },
    HSV_RGB: function (o) {
        var R, G, A, B, C, S = o.S / 100,
            V = o.V / 100,
            H = o.H / 360;
        if (S > 0) {
            if (H >= 1) {
                H = 0;
            }
            H = 6 * H;
            F = H - Math.floor(H);
            A = Math.round(255 * V * (1 - S));
            B = Math.round(255 * V * (1 - (S * F)));
            C = Math.round(255 * V * (1 - (S * (1 - F))));
            V = Math.round(255 * V);
            switch (Math.floor(H)) {
            case 0:
                R = V;
                G = C;
                B = A;
                break;
            case 1:
                R = B;
                G = V;
                B = A;
                break;
            case 2:
                R = A;
                G = V;
                B = C;
                break;
            case 3:
                R = A;
                G = B;
                B = V;
                break;
            case 4:
                R = C;
                G = A;
                B = V;
                break;
            case 5:
                R = V;
                G = A;
                B = B;
                break;
            }
            return ({
                'R': R ? R : 0,
                'G': G ? G : 0,
                'B': B ? B : 0,
                'A': 1
            });
        } else {
            return ({
                'R': (V = Math.round(V * 255)),
                'G': V,
                'B': V,
                'A': 1
            });
        }
    },
    HSV_HEX: function (o) {
        return (color.RGB_HEX(color.HSV_RGB(o)));
    }
};
$(document.body).insert(plugin);
loadSV();
setValue(element.__colorvalue || element.value || "#FFFFFF");
options.onEnd(element, plugin);
return element;
});
}, miniLabel: function (element, label, options) {
    options = Object.extend({
        position: 'bottom',
        color: '#666',
        size: 9,
        text: '',
        nobr: false
    }, options || {});
    element.wrap('span');
    span = $(element.parentNode);
    span.setStyle({
        whiteSpace: 'nowrap',
        cssFloat: 'left',
        marginRight: '5px'
    });
    var labelStyle = {
        paddingLeft: '1px',
        fontSize: options.size + "px",
        color: options.color,
        cursor: 'default'
    };
    var labelClick = function () {
        element.focus();
    };
    var br = '<br>';
    if (options.nobr) {
        br = '';
    }
    if (options.position == "top") {
        element.insert({
            before: new Element('span').setText(label + br).setStyle(labelStyle).observe('click', labelClick)
        }).insert({
            after: options.text
        });
    } else {
        element.insert({
            after: new Element('span').setText(br + label).setStyle(labelStyle).observe('click', labelClick)
        }).insert({
            after: options.text
        });
    }
    return span;
},
hint: function (element, value, options) {
    element = $(element);
    if ("placeholder" in element) {
        element.writeAttribute('placeholder', value);
    }
    if (element.type == 'number') {
        return element;
    }
    if (element.removeHint) {
        return element.hintClear();
    }
    options = Object.extend({
        hintColor: '#999'
    }, options || {});
    var color = element.getStyle('color') || '#000';
    if (element.value === '') {
        element.setStyle({
            color: options.hintColor
        });
        element.value = value;
        element.hinted = true;
    }
    var focus = function () {
        if (element.value == value) {
            element.value = "";
            element.setStyle({
                color: color
            }).hinted = false;
        }
    };
    var blur = function () {
        if (element.value === "") {
            element.value = value;
            element.setStyle({
                color: options.hintColor
            }).hinted = true;
        }
    };
    var submit = function () {
        if (element.value == value) {
            element.value = "";
            element.hinted = false;
        }
    };
    element.observe('focus', focus);
    element.observe('blur', blur);
    if (element.form) {
        $(element.form).observe('submit', submit);
    }
    element.runHint = blur;
    element.clearHint = function () {
        element.value = "";
        element.setStyle({
            color: color
        }).hinted = false;
    };
    element.hintClear = function () {
        element.value = value;
        element.setStyle({
            color: options.hintColor
        }).hinted = true;
        return element;
    };
    element.removeHint = function () {
        element.setStyle({
            color: color
        });
        if (element.value == value) {
            element.value = "";
        }
        element.hintClear = undefined;
        element.hinted = undefined;
        element.removeHint = undefined;
        element.stopObserving('focus', focus);
        element.stopObserving('blur', blur);
        if (element.form) {
            $(element.form).stopObserving('submit', submit);
        }
        return element;
    };
    return element;
},
resizable: function (element, options) {
    options = Object.extend({
        sensitivity: 10,
        overflow: 0,
        onResize: Prototype.K,
        onResizeEnd: Prototype.K,
        imagePath: '/sistema/images/resize.png',
        element: false,
        maxHeight: false,
        minHeight: false,
        maxWidth: false,
        minWidth: false,
        maxArea: false,
        autoAdjustOverflow: true,
        constrainViewport: true,
        constrainParent: false,
        keepAspectRatio: false,
        displayHandlers: true
    }, options, {});
    var handlerElem = element;
    if (options.element) {
        element = $(options.element);
    }
    element.resized = true;
    var elementPos = handlerElem.getStyle('position');
    if (!elementPos || elementPos == 'static') {
        handlerElem.setStyle({
            position: 'relative'
        });
    }
    var firstDim = element.getDimensions();
    var paddings = {
        top: (parseInt(element.getStyle('padding-top'), 10) || 0) + (parseInt(element.getStyle('padding-bottom'), 10) || 0),
        left: (parseInt(element.getStyle('padding-left'), 10) || 0) + (parseInt(element.getStyle('padding-right'), 10) || 0)
    };
    var handler = new Element('div'),
        rightHandler = new Element('div'),
        bottomHandler = new Element('div');
    handler.setStyle({
        height: options.sensitivity + 'px',
        width: options.sensitivity + 'px',
        position: 'absolute',
        bottom: '-' + options.overflow + 'px',
        right: '-' + options.overflow + 'px',
        cursor: 'se-resize',
        zIndex: 10000
    });
    rightHandler.setStyle({
        height: '100%',
        width: options.sensitivity + 'px',
        position: 'absolute',
        top: '0px',
        right: '-' + options.overflow + 'px',
        cursor: 'e-resize',
        zIndex: 10000
    });
    bottomHandler.setStyle({
        height: options.sensitivity + 'px',
        width: '100%',
        position: 'absolute',
        bottom: '-' + options.overflow + 'px',
        left: '0px',
        cursor: 's-resize',
        zIndex: 10000
    });
    handler.setStyle({
        background: 'url(' + options.imagePath + ') no-repeat bottom right'
    });
    rightHandler.setStyle({});
    bottomHandler.setStyle({});
    var resize = function (e, type) {
        document.stopDrag = true;
        handlerElem.setUnselectable();
        $(document.body).setUnselectable();
        var sDim = $H(element.getDimensions()).map(function (d) {
            if (d.key == "height") {
                return d.value - paddings.top;
            } else if (d.key == "width") {
                return d.value - paddings.left;
            }
            return d.value;
        });
        var startDim = {
            height: sDim[1],
            width: sDim[0]
        };
        var offs = element.cumulativeOffset();
        var pdim = $(element.parentNode).getDimensions();
        var poff = $(element.parentNode).cumulativeOffset();
        var mouseStart = {
            top: Event.pointerY(e),
            left: Event.pointerX(e)
        };
        var dim = document.viewport.getDimensions();
        var overflowHeight = "";
        var overflowWidth = "";
        switch (type) {
        case "both":
            handler.setStyle('height:100%; width:100%');
            break;
        case "horizontal":
            rightHandler.setStyle({
                width: '100%'
            });
            break;
        case "vertical":
            bottomHandler.setStyle({
                height: '100%'
            });
            break;
        }
        var setElementSize = function (dims) {
            var height = dims.height;
            var width = dims.width;
            var type = dims.type || 'both';
            if (height) {
                height = (options.maxHeight && height >= options.maxHeight) ? options.maxHeight : height;
                height = (options.minHeight && height <= options.minHeight) ? options.minHeight : height;
                if (options.maxArea) {
                    if (height * element.getWidth() >= options.maxArea) {
                        return;
                    }
                }
                element.setStyle({
                    height: height + "px"
                });
            }
            if (width) {
                width = (options.maxWidth && width >= options.maxWidth) ? options.maxWidth : width;
                width = (options.minWidth && width <= options.minWidth) ? options.minWidth : width;
                if (options.maxArea) {
                    if (element.getHeight() * width >= options.maxArea) {
                        return;
                    }
                }
                element.setStyle({
                    width: width + "px"
                });
            }
            options.onResize((height || startDim.height) + paddings.top, (width || startDim.width) + paddings.left, type);
        };
        var mousemove = function (e) {
            if (type != "horizontal") {
                var height = startDim.height + (Event.pointerY(e) - mouseStart.top);
                var hskip = false;
                if (options.constrainViewport) {
                    hskip = ((height + offs.top) >= (dim.height - 3));
                }
                if (options.constrainParent) {
                    hskip = ((height + offs.top + paddings.top) >= (pdim.height + poff.top - 3));
                    if (hskip) {
                        setElementSize({
                            height: (pdim.height + poff.top - 3) - (offs.top + paddings.top + 3),
                            type: type
                        });
                    }
                }
                if (!hskip) {
                    setElementSize({
                        height: height,
                        type: type
                    });
                    if (options.keepAspectRatio) {
                        setElementSize({
                            width: startDim.width + (Event.pointerY(e) - mouseStart.top),
                            type: type
                        });
                    }
                }
            }
            if (type != "vertical") {
                var width = startDim.width + (Event.pointerX(e) - mouseStart.left);
                var wskip = false;
                if (options.constrainViewport) {
                    wskip = ((width + offs.left) >= (dim.width - 3));
                }
                if (options.constrainParent) {
                    wskip = ((width + offs.left + paddings.left) >= (pdim.width + poff.left - 3));
                    if (wskip) {
                        setElementSize({
                            width: (pdim.width + poff.left - 3) - (offs.left + paddings.left + 3),
                            type: type
                        });
                    }
                }
                if (!wskip) {
                    setElementSize({
                        width: width,
                        type: type
                    });
                    if (options.keepAspectRatio) {
                        setElementSize({
                            height: startDim.height + (Event.pointerX(e) - mouseStart.left),
                            type: type
                        });
                    }
                }
            }
        };
        var mouseup = function () {
            handler.setStyle({
                height: options.sensitivity + 'px',
                width: options.sensitivity + 'px'
            });
            rightHandler.setStyle({
                width: options.sensitivity + 'px'
            });
            bottomHandler.setStyle({
                height: options.sensitivity + 'px'
            });
            document.stopObserving('mousemove', mousemove).stopObserving('mouseup', mouseup).stopDrag = false;
            handlerElem.setSelectable();
            options.onResizeEnd(element.getHeight(), element.getWidth());
            if (options.autoAdjustOverflow) {}
            $(document.body).setSelectable();
        };
        document.observe('mousemove', mousemove).observe('mouseup', mouseup);
        return false;
    };
    handler.observe('mousedown', function (e) {
        resize(e, 'both');
    });
    rightHandler.observe('mousedown', function (e) {
        resize(e, 'horizontal');
    });
    bottomHandler.observe('mousedown', function (e) {
        resize(e, 'vertical');
    });
    element.hideHandlers = function () {
        handler.hide();
        rightHandler.hide();
        bottomHandler.hide();
    };
    element.showHandlers = function () {
        handler.show();
        rightHandler.show();
        bottomHandler.show();
    };
    handlerElem.insert(bottomHandler).insert(rightHandler).insert(handler);
    return handlerElem;
},
positionFixed: function (element, options) {
	//alert(element)
	
    element = $(element);
    options = Object.extend({
        offset: 10,
        onPinned: Prototype.K,
        onUnpinned: Prototype.K,
        onBeforeScroll: Prototype.K,
        onBeforeScrollFail: Prototype.K,
        onScroll: Prototype.K
    }, options || {});
    var off = element.cumulativeOffset();
    var sOff = element.cumulativeScrollOffset();
    var top = off.top + sOff.top;
    var left = off.left + sOff.left;
	//top =50	;
	//alert(document.documentElement.scrollHeight)
	//alert(off +'='+ sOff +'=' + top +'='+ left);
    var onScroll = function () {
		//alert(top)
        if (element.pinned) {
            return true;
        }
        var style = {};
        var bodyOff = $(document.body).cumulativeScrollOffset();
        if (top <= bodyOff.top + options.offset) {
            style = {
                position: 'fixed',
                top: options.offset + 'px'
            };
        } else {
            style = {
                position: 'absolute',
                top: top + 'px'
            };
        }
        if (options.onBeforeScroll(element, parseInt(style.top, 10), bodyOff.top) !== false) {
            element.setStyle(style);
            options.onScroll(element, bodyOff.top);
        } else {
            if (element.style.position == "fixed") {
                element.setStyle({
                    position: 'absolute',
                    top: bodyOff.top + options.offset + 'px'
                });
                options.onBeforeScrollFail(element, parseInt(style.top, 10), bodyOff.top);
            }
        }
    };
    element.pin = function () {
        var bodyOff = $(document.body).cumulativeScrollOffset();
        element.style.top = bodyOff.top + options.offset + 'px';
        element.style.position = 'absolute';
        options.onPinned(element);
        element.pinned = true;
    };
    element.isPinned = function () {
        options.onPinned(element);
        return element.pinned;
    };
    element.unpin = function () {
        element.pinned = false;
        onScroll();
        options.onUnpinned(element);
    };
	//alert(onScroll)
    element.updateScroll = onScroll;
    element.updateTop = function (topLimit) {
        top = topLimit;
        return element;
    };
    Event.observe(window, 'scroll', onScroll);
    return element;
},
positionFixedBottom: function (element, options) {
    element = $(element);
    options = Object.extend({
        offset: 0,
        onPinned: Prototype.K,
        onUnpinned: Prototype.K,
        onBeforeScroll: Prototype.K,
        onScroll: Prototype.K
    }, options || {});
    var off = element.cumulativeOffset();
    var sOff = element.cumulativeScrollOffset();
    var top = off.top + sOff.top;
    var h = element.getHeight();
    var left = off.left + sOff.left;
    var onScroll = function () {
		
        if (element.pinned) {
            return true;
        }
        var style = {};
        var bodyOff = $(document.body).cumulativeScrollOffset();
        if (top + h >= bodyOff.top + options.offset) {
            style = {
                position: 'fixed',
                bottom: options.offset + 'px'
            };
        } else {
            if (element.style.position == "fixed") {
                element.setStyle({
                    position: 'absolute',
                    top: bodyOff.top + options.offset + 'px'
                });
                options.onBeforeScrollFail(element, parseInt(style.top, 10), bodyOff.top);
            }
        }
    };
    onScroll();
    element.pin = function () {
        var bodyOff = $(document.body).cumulativeScrollOffset();
        element.style.top = bodyOff.top + options.offset + 'px';
        element.style.position = 'absolute';
        options.onPinned(element);
        element.pinned = true;
    };
    element.isPinned = function () {
        options.onPinned(element);
        return element.pinned;
    };
    element.unpin = function () {
        element.pinned = false;
        onScroll();
        options.onUnpinned(element);
    };
    element.updateScroll = onScroll;
    element.updateTop = function (topLimit) {
        top = topLimit;
        return element;
    };
    Event.observe(window, 'scroll', onScroll);
    return element;
},
keepInViewport: function (element, options) {
    element = $(element);
    options = Object.extend({
        offset: [10, 10],
        offsetLeft: false,
        offsetTop: false,
        delay: 0.1,
        onPinned: Prototype.K,
        onUnpinned: Prototype.K,
        onBeforeScroll: Prototype.K,
        onScroll: Prototype.K,
        smooth: false,
        horzontal: false,
        vertical: true,
        animation: {
            duration: 0.2,
            easing: 'sineOut'
        },
        topLimit: parseInt(element.getStyle('top') || 0, 10),
        leftLimit: parseInt(element.getStyle('left') || 0, 10)
    }, options || {});
    options.animation = Object.extend({
        duration: 0.4
    }, options.animation || {});
    options.delay *= 1000;
    if (typeof options.offset == 'number') {
        options.offsetLeft = options.offset;
        options.offsetTop = options.offset;
    } else {
        options.offsetLeft = options.offset[0];
        options.offsetTop = options.offset[1];
    }
    var timer = false;
    var onScroll = function (e) {
		alert(2)
        if (element.pinned) {
            return true;
        }
        if (timer) {
            clearTimeout(timer);
        }
        var anim = options.animation;
        var doScroll = function () {
            var off = element.cumulativeOffset();
            var sOff = element.cumulativeScrollOffset();
            var toff = options.offsetTop;
            var loff = options.offsetLeft;
            if (sOff.top < toff) {
                toff = sOff.top;
            }
            if (sOff.left < loff) {
                loff = sOff.left;
            }
            if (options.vertical) {
                if (sOff.top >= off.top - toff) {
                    if (sOff.top > 0) {
                        anim.top = sOff.top + toff + 'px';
                    }
                } else {
                    if (off.top != options.topLimit) {
                        if (sOff.top + toff > options.topLimit) {
                            anim.top = sOff.top + toff + 'px';
                        } else {
                            anim.top = options.topLimit + 'px';
                        }
                    }
                }
            }
            if (options.horizontal) {
                if (sOff.left >= off.left - loff) {
                    if (sOff.left > 0) {
                        anim.left = sOff.left + loff + 'px';
                    }
                } else {
                    if (off.left != options.leftLimit) {
                        if (sOff.left + loff > options.leftLimit) {
                            anim.left = sOff.left + loff + 'px';
                        } else {
                            anim.left = options.leftLimit + 'px';
                        }
                    }
                }
            }
            if (options.onBeforeScroll(element, parseInt(anim.top, 10) || 0, parseInt(anim.left, 10) || 0) !== false) {
                if (options.smooth) {
                    anim.onEnd = function () {
                        options.onScroll(element, anim.top, anim.left);
                    };
                    element.shift(anim);
                } else {
                    element.style.left = anim.left;
                    element.style.top = anim.top;
                    options.onScroll(element, anim.top, anim.left);
                }
            }
        };
        if (options.smooth === false) {
            doScroll();
        } else {
            timer = setTimeout(doScroll, options.delay);
        }
        return element;
    };
    element.pin = function () {
        options.onPinned(element);
        element.pinned = true;
    };
    element.isPinned = function () {
        return element.pinned;
    };
    element.unpin = function () {
        element.pinned = false;
        onScroll();
        options.onUnpinned(element);
    };
    element.update = onScroll;
    element.updateLimits = function (top, left) {
        options.topLimit = top || parseInt(element.getStyle('top') || 0, 10);
        options.leftLimit = left || parseInt(element.getStyle('left') || 0, 10);
        return element;
    };
    Event.observe(window, 'scroll', onScroll);
    return element;
},
bigSelect: function (element, options) {
    element = $(element);
    if (Prototype.Browser.IE) {
        return element;
    }
    options = Object.extend({
        classpreFix: 'big-select',
        additionalClassName: '',
        onSelect: function (x) {
            return x;
        },
        onComplete: function (x) {
            return x;
        }
    }, options || {});
    if (element.selectConverted) {
        element.selectConverted.remove();
    }
    var cont = new Element('div', {
        className: options.classpreFix + ' ' + options.additionalClassName,
        tabIndex: '1'
    }).setStyle({
        outline: 'none',
        fontSize: element.getStyle('font-size')
    });
    var content = new Element('div', {
        className: options.classpreFix + '-content'
    });
    var list = new Element('div', {
        className: options.classpreFix + '-list'
    }).setStyle('z-index:2000000').hide();
    var arrow = new Element('div', {
        className: options.classpreFix + '-arrow'
    });
    var span = new Element('div', {
        className: options.classpreFix + '-content-span'
    });
    element.selectConverted = cont;
    cont.setUnselectable();
    if (options.width) {
        cont.setStyle({
            width: options.width
        });
    }
    content.update(span);
    cont.insert(content).insert(list).insert(arrow);
    element.insert({
        before: cont
    }).hide();
    element.observe('change', function () {
        span.update(options.onSelect(element.getSelected().text));
    });
    var closeList = function () {
        cont.removeClassName(options.classpreFix + '-open');
        list.hide();
    };
    $A(element.options).each(function (opt) {
        if (opt.selected) {
            span.update(options.onSelect(opt.text));
        }
        var li = new Element('li', {
            value: opt.value
        }).insert(opt.text);
        li.hover(function () {
            li.setStyle('background:#ccc');
        }, function () {
            li.setStyle({
                background: ''
            });
        });
        li.observe('click', function () {
            span.update(options.onSelect(li.innerHTML, li.readAttribute('value')));
            element.selectOption(li.readAttribute('value'));
            closeList();
        });
        list.insert(li);
    });
    cont.observe('blur', function () {
        closeList();
    });
    list.show();
    var currentTop = list.getStyle('top');
    list.hide();
    var toggleList = function () {
        if (list.visible()) {
            closeList();
        } else {
            list.show();
            cont.addClassName(options.classpreFix + '-open');
            list.setStyle({
                height: '',
                overflow: '',
                bottom: ''
            });
            var vh = document.viewport.getHeight();
            var lt = list.cumulativeOffset().top;
            var lh = list.getHeight();
            if (vh < lt + lh) {
                if (vh - lt - 20 < 150) {
                    var h = 'auto';
                    if (lh > lt) {
                        h = (lt - 10) + 'px';
                    }
                    list.setStyle({
                        bottom: content.getHeight() + 'px',
                        top: 'auto',
                        height: h,
                        overflow: 'auto'
                    });
                } else {
                    list.setStyle({
                        height: (vh - lt - 20) + 'px',
                        overflow: 'auto'
                    });
                }
            }
        }
    };
    arrow.observe('click', toggleList);
    content.observe('click', toggleList);
    options.onComplete(cont, element);
    return element;
},
rotatingText: function (element, text, options) {
    element = $(element);
    options = Object.extend({
        delimiter: ' - ',
        duration: 150
    }, options || {});
    var orgText = element.innerHTML.strip();
    text += options.delimiter;
    var orgLength = orgText.length;
    var initialText = text.substr(0, orgLength);
    element.innerHTML = initialText;
    var current = 0;
    var interval = setInterval(function () {
        if (current == text.length) {
            current = 0;
            element.innerHTML = text.substr(current++, orgLength);
        } else if (current + orgLength > text.length) {
            var toInsert = text.substr(current, orgLength);
            toInsert += text.substr(0, orgLength - (text.length - current));
            element.innerHTML = toInsert;
            current++;
        } else {
            element.innerHTML = text.substr(current++, orgLength);
        }
    }, options.duration);
    element.rotatingStop = function () {
        clearTimeout(interval);
        element.innerHTML = orgText;
    };
    return element;
}
};Element.addMethods(Protoplus.ui);;
var Utils = Utils || new Common();

var formID = $('formId').value;
//alert(formID)
var savedform = {
    "form_title": "Untitled Form".locale(),
    "form_style": "Default",
    "form_alignment": "Left",
    "form_labelWidth": "150",
    "form_formWidth": "",
    "form_theme": "Default",
    "form_background": "",
    "form_font": "Verdana",
    "form_fontsize": "12",
    "form_fontcolor": "Black",
    "form_header": "",
    "form_footer": "",
    "form_thankurl": "",
    "form_thanktext": "",
    "form_sendpostdata": "No",
    "form_sendEmail": "Yes",
	"form_editmode": EDIT_MODE,
	"form_theme": 1,
	"1_type":"control_head"

};
var selectEvent = 'mousedown';
var noAutoSave = false;
var undoStack = [];
var redoStack = [];
var changeFlag = false;
var formBuilderTop = 107;
var toolBoxTop = 175;
var flips_are_added = false;
var leftFlip, rightFlip;
var qid = 0;
var selected = false;
var toolboxContents = {};
var lastChange = {};
var initialForm = {};
var form = false;
var formProps = false;
var lastStyle = "form";
var lastTool = false;
var pt = Protoplus.Profiler;
var optionsCache = {};
var saving = false;
var showInfo = false;
var stopUnselect = false;

function getSavedForm(config, forceNew) {


    if (config.success === true) {
        console.log("getFormProperties took " + config.duration + " on the server");
        savedform = config.form;
        formID = savedform.form_id || false;
        if (forceNew === true) {
            formID = false;
        }
        qid = getMaxID(savedform) || 0;
			
    } else {
        if (config.error == 'New Form') {
            showInfo = true;
            return;
        }
    }
}

function getCloneForm(config) {
    getSavedForm(config, true);
    delete savedform.form_id;
}
if ($H(savedform).keys().length > 0) {
    qid = getMaxID(savedform) || 0;
}

function getMaxID(form_prop) {
    form_prop = form_prop ? form_prop : getAllProperties();
    var arr = $H(form_prop).map(function (p) {
        if (p.key.match("qid")) {
            return p.value;
        }
    }).compact();
    if (arr.length < 1) {
        arr = [0];
    }
    return (Math.max.apply(Math, arr));
}

window.onbeforeunload = function (oEvent) {
	
    if (changeFlag) {
		return "You have unsaved changes: Are you sure you want to discard them?".locale();
		/* Utils.confirm("Would you like to <u><b>keep the products</b></u> to be used with another payment gateway?".locale(), "Confirm".locale(), function (but, value) {
				return false																																			
                if (!value) {
                   
                }
            });*/
       // return "You have unsaved changes: Are you sure you want to discard them?".locale();
    }
};

/*window.onbeforeunload = function (e) {
  var e = e || window.event;

  // For IE and Firefox prior to version 4
  if (e) {
    e.returnValue = 'Any string';
  }

  // For Safari
  return 'Any string';
};*/

window.onunload = function () {
    undoStack = undefined;
    redoStack = undefined;
    optionsCache = undefined;
    leftFlip = undefined;
    rightFlip = undefined;
    qid = undefined;
    selected = undefined;
    toolboxContents = undefined;
    lastChange = undefined;
    initialForm = undefined;
    CommonClass = undefined;
    Utils = undefined;
};
document.keyboardMap({
    "Up": {
        handler: function (e) {
            Event.stop(e);
            if (selected) {
                if (selected.previousSibling) {
                    $(selected.previousSibling).run(selectEvent).scrollInto();
                }
                return false;
            } else {
                ($($('list').lastChild) && $($('list').lastChild).run(selectEvent).scrollInto());
            }
        },
        disableOnInputs: true
    },
    "Down": {
        handler: function (e) {
            Event.stop(e);
            if (selected) {
                if (selected.nextSibling) {
                    $(selected.nextSibling).run(selectEvent).scrollInto();
                }
                return false;
            } else {
                ($($('list').firstChild) && $($('list').firstChild).run(selectEvent).scrollInto());
            }
        },
        disableOnInputs: true
    },
    "Left": {
        handler: function () {
            if (selected) {
                var tmp = selected;
                var sibling = $(selected.previousSibling);
                if (!sibling) {
                    return;
                }
                $(selected.parentNode).replaceChild(selected.previousSibling, selected);
                sibling.insert({
                    before: tmp
                });
                onChange("Question moved");
                return false;
            }
        },
        disableOnInputs: true
    },
    "Right": {
        handler: function () {
            if (selected) {
                var tmp = selected;
                var sibling = $(selected.nextSibling);
                if (!sibling) {
                    return;
                }
                $(selected.parentNode).replaceChild(selected.nextSibling, selected);
                sibling.insert({
                    after: tmp
                });
                onChange("Question moved");
                return false;
            }
        },
        disableOnInputs: true
    },
    "Delete": {
        handler: function () {
            if (selected) {
                removeQuestion(selected, selected.getReference('elem'));
                return false;
            }
        },
        disableOnInputs: true
    },
    "Backspace": {
        handler: function (e) {
            Event.stop(e);
            return false;
        },
        disableOnInputs: true
    },
    "Meta+S": {
        handler: function (e) {
            Event.stop(e);
            save();
            return false;
        }
    },
    "Ctrl+S": {
        handler: function (e) {
            Event.stop(e);
            save();
            return false;
        }
    },
    "Ctrl+Z": {
        handler: function () {
            undo();
        },
        disableOnInputs: true
    },
    "Ctrl+Y": {
        handler: function () {
            redo();
        },
        disableOnInputs: true
    },
    "Meta+Z": {
        handler: function () {
            undo();
        },
        disableOnInputs: true
    },
    "Meta+Y": {
        handler: function () {
            redo();
        },
        disableOnInputs: true
    },
    "Ctrl+Shift+I": {
        handler: function (e) {
            Event.stop(e);
            displayQuestionInfo();
        }
    },
    "Meta+Shift+I": {
        handler: function (e) {
            Event.stop(e);
            displayQuestionInfo();
        }
    }
});

function setImageSource(id, source, height, width) {
    imageWizard.wiz.close();
    var elem = getElementById(id);
    elem.setProperty('height', height);
    elem.setProperty('width', width);
    updateValue("src", source, elem.getReference('container'), elem, elem.getProperty('src'));
}

function getElement(tag) {
    return $(document.createElement(tag));
}

function createDivLine(elem, oprop, noreplace,elemId) {
	
	//alert(noreplace)
    var type = elem.readAttribute('type');
	
    var prop = oprop ? oprop : Utils.deepClone(default_properties[type]);
	
    if (!prop) {
        prop = Utils.deepClone(default_properties.control_hidden);
    }
    var p = elem.parentNode;
    var id = -1;
    var title = prop.text ? prop.text.value : "";
    var cname = 'form-input';
    var lcname = 'form-label';
    var alignment = 'Left';
    var label = getElement('div').setStyle('z-index:100');
    var block = getElement('div').setStyle('display:inline-block;width:100%');
    if (!noreplace) {
        id = prop.qid ? prop.qid.value : getMaxID() + 1;
        qid = id;
    }
	//alert(id)
    var container = getElement('li');
    container.id = "id_" + id;
    container.writeAttribute('type', type);
    var clName = (['control_collapse', 'control_head', 'control_pagebreak'].include(type)) ? 'form-input-wide' : 'form-line';
    container.className = clName + ((prop.shrink && prop.shrink.value == 'Yes') ? ' form-line-column' : '') + ((prop.newLine && prop.newLine.value == 'Yes') ? ' form-line-column-clear' : '');
    container.style.cursor = "move";
    container.appendChild(block);
	
    if (form.getProperty('alignment') == 'Top') {
        cname = 'form-input-wide';
        lcname = 'form-label-top';
        label.setStyle('width:100%');
    } else {
		
        cname = 'form-input';
        lcname = 'form-label-' + form.getProperty('alignment').toLowerCase();
        label.setStyle('width:' + form.getProperty('labelWidth') + 'px');
    }
    if (prop.labelAlign && prop.labelAlign.value != 'Auto') {
        if (prop.labelAlign.value == 'Top') {
            cname = 'form-input-wide';
            lcname = 'form-label-top';
            label.setStyle('width:100%');
        } else {
            cname = 'form-input';
            lcname = 'form-label-' + prop.labelAlign.value.toLowerCase();
            label.setStyle('width:' + form.getProperty('labelWidth') + 'px');
        }
    }
	//var rightAlignmentClass =''
	
	/*Added by neelesh*/
	
	if(form.getProperty('alignment') == 'Right')
	{
		cname += ' right_alignment';
	}
	
    cname = (prop.text.nolabel) ? 'form-input-wide' : cname;
    label.className = lcname;
	//alert(title)
    label.innerHTML = (title == "....") ? "Label".locale(): title;
	//alert(label.innerHTML)
    label.id = 'label_' + id;
    if (!('labelAlign' in prop) || prop.labelAlign.value == 'Auto') {
        alignment = form.getProperty('alignment');
    } else {
        alignment = prop.labelAlign.value;
    }
	//alert(alignment)
    var ne = createInput(type, id, prop, noreplace,elemId);
    ne.setReference('container', container);
    container.setReference('elem', ne);
    var inputBox = getElement('div');
    inputBox.className = cname;
	//inputBox.setAttribute('style','border:1px red');
	//alert(inputBox)
	
    inputBox.appendChild(ne);
    if (false) {
        var nfields = ['control_head', 'control_text', 'control_dropdown', 'control_radio', 'control_checkbox', 'control_matrix', 'control_autocomp', 'control_collapse'];
        if (!('sublabels' in prop) && !nfields.include(type)) {
            inputBox.insert(new Element('div').setStyle('position:absolute; top:0px; left:0px; height:100%; width:100%;')).setStyle('position:relative;');
        }
    }
    if (('sublabels' in prop)) {
        ne.observe('on:render', function () {
            ne.select('.form-sub-label').each(function sublabelsLoop(sl) {
                if (sl.id) {
                    sl.editable({
                        className: 'edit-sublabel',
                        onEnd: function (a, b, old, val) {
                            if (old != val) {
                                var sls = ne.getProperty('sublabels');
                                sls[sl.id.replace('sublabel_', '')] = val;
                                onChange('Sub Label Changed');
                            }
                        }
                    });
                }
            });
        });
    }
    if (!prop.text.nolabel) {
        block.appendChild(label);
		//Added by neelesh For double click on label as a edit mode...
        /*label.editable({
            onBeforeStart: function () {
				
                if ("__justSelected" in container && container.__justSelected) {
                    return false;
                }
                label.select('span').each(function (span) {
                    span.remove();
                });
            },
            className: 'edit-text',
            onEnd: function (a, b, old, val) {
                ne.setProperty('name', makeQuestionName(val.strip(), id));
                updateValue('text', val.strip(), container, ne, old);
            }
        });*/
        if (prop.required) {
            if (prop.required.value == "Yes") {
                var children = block.childElements();
                if (children.length > 0) {
                    var textElement = children[0];
                    textElement.appendChild(new Element('span', {
                        className: "form-required"
                    }).update("*"));
                }
            }
        }
    }
    var buttonContainer = getElement('div');
	 var arrowContainer = getElement('div');
	 var arrowImage = getElement('img');
	 arrowImage.src ='/sistema/images/bg_comeceagora_small.png'
	 arrowContainer.setStyle('width: 20px; position: absolute;   right: 0pt;')
	 arrowImage.setStyle('bottom: 0;    float: right;    left: 5px;    padding-left: 10px;    position: absolute;')
	 

//   alert( container.cumulativeOffset().left);
	 
	 arrowContainer.appendChild(arrowImage);
    buttonContainer.addClassName('button-container');
    if (payment_fields.include(type) || type == 'control_image') {
        var wandButton = getElement('img');
        wandButton.src = '/sistema/images/blank.gif';
        wandButton.className = 'form-wandbutton context-menu-wand';
        wandButton.title = 'Wizard'.locale();
        wandButton.preventInitDrag = true;
        wandButton.onclick = function () {
            if (payment_fields.include(type)) {
                Utils.loadScript(CUSTOM_URL+'/javascripts/builder/payment_wizard.js', function (i) {
                    openPaymentWizard(i);
                }, id);
            }
            if (type == 'control_image') {
                Utils.loadScript(CUSTOM_URL+'/javascripts/builder/image_wizard.js', function (i) {
                    imageWizard.openWizard(i);
                }, id);
            }
        };
        buttonContainer.appendChild(wandButton);
    }
    if (type == 'control_text') {
        var editHTMLButton = getElement('button');
        editHTMLButton.className = 'big-button buttons buttons-red';
        editHTMLButton.style.cssText += (';' + 'margin:0; float:left; padding:3px 6px; margin:4px 0 0 4px');
        editHTMLButton.preventInitDrag = true;
        editHTMLButton.innerHTML = "Edit HTML".locale();
        var oldVal = "";
        var openHTMLEdit = function (e) {
            if (!editHTMLButton.editorOpen) {
                oldVal = $("text_" + id).innerHTML;
                Editor.set("text_" + id, 'simple');
                editHTMLButton.innerHTML = "Complete".locale();
                container.observe('on:unselect', openHTMLEdit);
                editHTMLButton.editorOpen = true;
                ne.dblclick = function () {};
            } else {
                var html = Editor.getContent("text_" + id);
                Editor.remove("text_" + id);
                editHTMLButton.innerHTML = "Edit HTML".locale();
                editHTMLButton.editorOpen = false;
                ne.dblclick = openHTMLEdit;
                updateValue('text', html, container, ne, oldVal);
            }
        };
        ne.ondblclick = openHTMLEdit;
        editHTMLButton.observe('click', openHTMLEdit);
        buttonContainer.appendChild(editHTMLButton);
    }
    var propertiesButton = getElement('img');
    propertiesButton.src = '/sistema/images/gear.png';
    propertiesButton.className = 'form-propbutton';
    propertiesButton.title = 'Properties'.locale();
    propertiesButton.alt = "Props";
    propertiesButton.preventInitDrag = true;
    propertiesButton.observe('click', function (e) {
        container.openMenu(e, true);
    });
    buttonContainer.appendChild(propertiesButton);
    var delButton = getElement('img');
    delButton.src = '/sistema/images/blank.gif';
    delButton.className = 'form-delbutton index-cross';
    delButton.title = 'Delete'.locale();
    delButton.alt = "X";
    delButton.preventInitDrag = true;
    delButton.onclick = function (e) {
		//alert(1)
        removeQuestion(container, ne);
        Utils.poof(e);
    };
    buttonContainer.hide();
	 arrowContainer.hide();
    buttonContainer.appendChild(delButton);	 
    container.delButton = buttonContainer;
	 container.arrowButton = arrowContainer
    block.appendChild(inputBox);
    container.appendChild(buttonContainer);
	 if(type != "control_button")
	 container.appendChild(arrowContainer)
	//alert(selectEvent)
    container.observe(selectEvent, function (e) {
			if(container.type == "control_button")							 
			{
				//showFormFields()
				return false;
			}
        $('accordion').show();
        $('style-menu').hide();
        if (selected != container) {
            if (selected && selected.parentNode) {
                (document._stopEdit && document._stopEdit());
                if (stopUnselect) {
                    stopUnselect = false;
                    return;
                }
                selected.removeClassName('question-selected');
                selected.picked = false;
                selected.delButton.hide();
					 selected.arrowButton.hide();
                selected.fire('on:unselect');
                selected.select('.add-button').invoke('hide');
            }
				//container.getHeight()
				if(container.type == "control_radio" || container.type == "control_checkbox")
				{
					var tmpHeight = parseInt(container.getHeight()) * 40/100;
					//alert(tmpHeight)
					container.arrowButton.setStyle('bottom:'+tmpHeight+'px')
				}
				
            container.removeClassName('question-over');
            container.addClassName('question-selected');
            container.delButton.show();
				container.arrowButton.show()
            container.select('.add-button').invoke('setStyle', 'display:block');
            selected = container;
            container.picked = true;	
			//added by neelesh if($(this.id).hasClassName('question-selected'))
			//alert(1)
			//$('selected_prop').value = selected.id;
			
			
            makeToolbar(ne, container);
            container.__justSelected = true;
            setTimeout(function () {
                container.__justSelected = false;
            }, 200);
			
            if (form.getProperty('stopHighlight') != 'Yes') {
				
               $$('#toolbar .big-button-text, #prop-legend').invoke('setStyle', {
                    color: '#000'
                }).invoke('shift', {
                    color: '#FFFFE0',
                    duration: 1,
                    easing: 'pulse'
                });
            }
        }
		
    },this);
    container.setContextMenu({
        title: prop.text.value.stripTags().shorten(20),
        onStart: function () {
            if (!container.hasClassName('question-selected')) {
                container.run(selectEvent);
            }
            if (!container.previousSibling) {
                container.disableButton('moveup');
                container.enableButton('movedown');
            } else if (!container.nextSibling) {
                container.disableButton('movedown');
                container.enableButton('moveup');
            } else {
                container.enableButton('movedown');
                container.enableButton('moveup');
            }
            if (true || ['control_collapse', 'control_pagebreak', 'control_head'].include(type)) {
                container.disableButton('shrink');
            }
            if (type == 'control_captcha' || payment_fields.include(type)) {
                container.disableButton('duplicate');
            }
        },
        onOpen: function () {
            if (ne.getProperty('required') == 'Yes') {
                container.getButton('required').addClassName('context-menu-check');
            } else if (ne.getProperty('required') == 'No') {
                container.getButton('required').removeClassName('context-menu-check');
            } else {
                container.getButton('required').hide();
            }
        },
        menuItems: [{
            title: 'Required'.locale(),
            name: 'required',
            icon: "/sistema/images/blank.gif",
            iconClassName: "context-menu-required-small",
            handler: function () {
                if (ne.getProperty('required') == 'Yes') {
                    updateValue('required', "No", container, ne, "Yes");
                    container.getButton('required').addClassName('button-over');
                } else {
                    updateValue('required', "Yes", container, ne, "No");
                    container.getButton('required').removeClassName('button-over');
                }
            }
        },
        {
            title: 'Move Up'.locale(),
            icon: "/sistema/images/blank.gif",
            iconClassName: "context-menu-up",
            name: 'moveup',
            handler: function () {
                var tmp = container;
                var sibling = $(container.previousSibling);
                if (!sibling) {
                    return;
                }
                $(container.parentNode).replaceChild(container.previousSibling, container);
                sibling.insert({
                    before: tmp
                });
                onChange("Question moved");
            }
        },
        {
            title: 'Move Down'.locale(),
            iconClassName: "context-menu-down",
            icon: "/sistema/images/blank.gif",
            name: 'movedown',
            handler: function () {
                var tmp = container;
                var sibling = $(container.nextSibling);
                if (!sibling) {
                    return;
                }
                $(container.parentNode).replaceChild(container.nextSibling, container);
                sibling.insert({
                    after: tmp
                });
                onChange("Question moved");
            }
        }, '-',
        {
            title: 'Image Wizard'.locale(),
            hidden: type != 'control_image',
            name: 'imagewizard',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'context-menu-wand',
            handler: function () {
                Utils.loadScript(CUSTOM_URL+'/javascripts/builder/image_wizard.js', function (i) {
                    imageWizard.openWizard(i);
                }, id);
            }
        },
        {
            title: 'Payment Wizard'.locale(),
            hidden: !payment_fields.include(type),
            name: 'paymentwizard',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'context-menu-wand',
            handler: function () {
                Utils.loadScript(CUSTOM_URL+ '/javascripts/builder/payment_wizard.js', function (i) {
                    openPaymentWizard(i);
                }, id);
            }
        },
        {
            title: container.hasClassName('form-line-column') ? 'Expand'.locale() : 'Shrink'.locale(),
            icon: "/sistema/images/blank.gif",
            iconClassName: container.hasClassName('form-line-column') ? "context-menu-expand" : "context-menu-shrink",
            name: 'shrink',
            handler: function (e) {
                if (container.hasClassName('form-line-column')) {
                    container.removeClassName('form-line-column');
                    ne.setProperty('labelAlign', 'Auto');
                    updateValue('shrink', "No", container, ne, "Yes");
                } else {
                    container.addClassName('form-line-column');
                    ne.setProperty('labelAlign', 'Top');
                    updateValue('shrink', "Yes", container, ne, "No");
                }
            }
        },
        {
            title: container.hasClassName('form-line-column-clear') ? 'Merge to above line'.locale() : 'Move to a new line'.locale(),
            icon: "/sistema/images/blank.gif",
            iconClassName: container.hasClassName('form-line-column-clear') ? "context-menu-merge-line" : "context-menu-new-line",
            hidden: !container.hasClassName('form-line-column'),
            name: 'merge-line',
            handler: function () {
                if (container.hasClassName('form-line-column-clear')) {
                    container.removeClassName('form-line-column-clear');
                    updateValue('newLine', "No", container, ne, "Yes");
                } else {
                    container.addClassName('form-line-column-clear');
                    updateValue('newLine', "Yes", container, ne, "No");
                }
            }
        },
        {
            title: "Duplicate".locale(),
            icon: "/sistema/images/blank.gif",
            iconClassName: "context-menu-add",
            name: 'duplicate',
            handler: function () {
                var dprop = Utils.deepClone(ne.retrieve('properties'));
                var elem = new Element('li', {
                    type: type
                });
                dprop.qid.value = getMaxID() + 1;
                dprop.name.value = dprop.name.value.replace(/\d+/, '') + dprop.qid.value;
                container.insert({
                    after: elem
                });
				alert(3)
                createDivLine(elem, dprop);
                createList();
            }
        },
        {
            title: 'Delete'.locale(),
            name: 'delete',
            iconClassName: 'context-menu-cross_shine',
            icon: "/sistema/images/blank.gif",
            handler: function (e) {
				
                removeQuestion(container, ne);
                Utils.poof(e);
            }
        }, '-',
       /* {
            title: 'Show Properties',
            name: 'properties',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'context-menu-gear',
            handler: function () {
                makeProperties(ne, container);
            }
        }*/]
    });
    container.hiLite = function () {
        setTimeout(function () {
            $(container, buttonContainer).invoke('shift', {
                backgroundColor: '#D2FEC7',
                easing: 'pulse',
                easingCustom: 2,
                duration: 2,
                onEnd: function () {
                    container.setStyle({
                        backgroundColor: ''
                    });
                }
            });
        }, 500);
    };
    container.hover(function () {
        if ($(container.parentNode).hasClassName('dragging')) {
            return;
        }
        if (container.picked) {
            return;
        }
        if (container.highlighting) {
            return;
        }
		  if(container.type == "control_button")							 
			{
				//showFormFields()
				return false;
			}
        container.addClassName('question-over');
    }, function () {
        if (container.picked) {
            return;
        }
        container.removeClassName('question-over');
    });
    if (!noreplace && p) {
        p.replaceChild(container, elem);
        ne.fire('on:render');
    }

	return {
        container: container,
        elem: ne
    };
}

function unselectField() {

	$('tabbed_box_1').childElements().first().removeAttribute('id')
	$$('.tabs li').last().childElements().first().removeClassName('add-custom-padding-unselected')
		customCssForTab()
	/*Added by neelesh for make again show the properties of element*/
	$('selected_prop').value =0;
	
	
    if (stopUnselect) {
        stopUnselect = false;
        return;
    }
	
		if(jQuery('ul.tabs li:first-child').children().hasClass("active"))
			return;

			jQuery(".active").removeClass("active");			

			jQuery('ul.tabs li:first-child').children().addClass("active");

			// slide all content up
			jQuery(".content").slideUp();
			

			// slide this content up
			//var content_show = jQuery(this).attr("title");
			jQuery("#content_1").css('display', 'block');
		//	document.getElementById('content_1').style.display = 'block';
			
			
	//jQuery("#tool_bar").css('display','block');
	
	 	//jQuery("#content_4").css('display','none');
			//alert(this)
			// switch all tabs off
		/*	jQuery(".active").removeClass("active");
			
			//jQuery("#content_1").removeClass("content");
			// switch this tab on
			jQuery("#content_1").addClass("active");
			jQuery(".content").slideUp();
			//jQuery("#content_1").addClass("content");
			// slide all content up
			//jQuery(".content").slideUp();
			// slide this content up
			
			jQuery("#content_1").slideDown();*/
		  
		  
    if (selected && selected.parentNode && !$('toolbar').editorIsOn && !document._onedit) {
        selected.removeClassName('question-selected');
        selected.picked = false;
        selected.delButton.hide();
		  selected.arrowButton.hide();
        selected.fire('on:unselect');
        selected.select('.add-button').invoke('hide');
        selected = false;
        $('prop-legend').hide();
        $('group-formproperties').show();
        $('properties').update();
        makeTabOpen('form-property-legend');
        $('group-properties').hide();
    }
}

function getUsableElements(filter, inverse) {
	
    var filters = {
        condition: ['control_matrix', 'control_grading', 'control_location'],
        email: ['control_textbox', 'control_textarea', 'control_dropdown', 'control_radio', 'control_checkbox', 'control_email', 'control_autocomp', 'control_hidden'],
        name: ['control_textbox', 'control_textarea', 'control_dropdown', 'control_radio', 'control_checkbox', 'control_fullname', 'control_autocomp', 'control_hidden']
    };
    var elems = [];
    $$("div.question-input").each(function getUsableLoop(input) {
        if (!$A(not_input).include(input.getProperty('type'))) {
            if (filter && filters[filter] && filters[filter].include(input.getProperty('type'))) {
                if (inverse) {
                    elems.push(input);
                }
                return;
            }
            if (!inverse) {
                elems.push(input);
            }
        }
    });
    return elems;
}

function getAllElements() {
    return $$('div.question-input');
}

function getAllPayments() {
    var elems = [];
    $$("div.question-input").each(function allPaymentsLoop(input) {
        if ($A(payment_fields).include(input.getProperty('type'))) {
            elems.push(input);
        }
    });
    return elems.length > 0 ? elems : false;
}

function hasUpload() {
    if (getElementsByType('control_fileupload')) {
        return true;
    }
    return false;
}

function getElementsByType(type) {
    var elems = [];
    $$("div.question-input").each(function getByTypeLoop(input) {
        if (input.getProperty('type') == type) {
            elems.push(input);
        }
    });
    return elems.length > 0 ? elems : false;
}

function getElementById(id) {
    var res = $$('#id_' + id + " div.question-input");
    if (res.length > 0) {
        return res[0];
    }
    return false;
}

function getElementByOrder(order) {
	//alert(order)
    var rel;
    $$("div.question-input").each(function getByOrderLoop(el, i) {
        if (order == ++i) {
            rel = el;
        }
        el.setProperty("order", i);
    });
    return rel;
}

function getElementsByOrderRange(minOrder, maxOrder) {
    var rel = [];
    $$("div.question-input").each(function getByRangeLoop(el, i) {
        ++i;
        if (minOrder <= i && maxOrder >= i) {
            rel.push(el);
        }
        el.setProperty("order", i);
    });
    return rel;
}

function removeQuestion(container, elem) {
	
//	elem.setAttribute('style','border:solid 1px red');

	id=$(container).id
	// "q" + (id.split("id_")[1]) + '_' +
	

	var firstElement = Form.getElements($(id)).find(function(element) {
		return element.type != 'hidden' && !element.disabled &&
		['input','button'].include(element.tagName.toLowerCase());
	});
	var qname='';
	if (firstElement)		
		qname =firstElement.name.replace('[]','');


	
	var willElementDelete = true;
	if(EDIT_MODE)
	{
		
		for(i in edit_prop)
		{
			
			if(edit_prop[i]==qname)	
			{
				willElementDelete = false
			}
		}
		
	}

	if(!willElementDelete && (edit_prop["entries_count"]))
	{
		
		if(!confirm("Are you sure?You will lost the data associated with this field"))	
			return ;	
		
				
	}
	if(typeof(firstElement)!='undefined')
	{
		if(firstElement.hasClassName('form-submit-button'))
		{
			Utils.alert("You can not delete the submit button.",'Error'.locale());
			return;
		}
	}
	
	container.makeClipping();
    document._onedit = false;
    (document._stopEdit && document._stopEdit());
    if ($A(payment_fields).include(elem.getProperty('type'))) {
        if (form.getProperty('products')) {
            Utils.confirm("Would you like to <u><b>keep the products</b></u> to be used with another payment gateway?".locale(), "Confirm".locale(), function (but, value) {
                if (!value) {
                    form.setProperty('products', false);
                    form.setProperty('productMaxID', 100);
                }
            });
        }
    }
    makeTabOpen('form-property-legend');
    $('prop-legend').hide();
    var clearSelected = false;
	var test;
    if (container.nextSibling) {
			
		//alert($(container.nextSibling).id)
		//$$('#id[style="display:none"]').first()
		//alert($$('#'+$(container.nextSibling).id+'input[type=text]').first())
//		alert($$('#'+$(container.nextSibling).id).first().firstChild.id)
        $(container.nextSibling).run(selectEvent);
    } else if (container.previousSibling) {
		
			

		//alert($$('#'+$(container.previousSibling).id).first().firstChild.id)
        container.previousSibling.run(selectEvent);
    } else {
        clearSelected = true;
    }


    container.shift({
        opacity: 0,
        height: 0,
        duration: 0.5,
        onEnd: function () {
            container.remove();
            onChange("Question Removed");
            Utils.updateBuildMenusize();
            Utils.fixBars();
            if (clearSelected) {
                selected = false;
            }
        }
    });
}
/*Get the properties of element,Which about to add*/
function collectEleProp(oprop,elem)
{

	//var oprop =  defaultProp;
		
	for(editElePropId in MergeElementProperties.eleProp)	
	{
		
		if(editElePropId == elem.id)
		{
			
			//alert(editElePropId +"---" +elem.id)
			for(defPropKey in oprop)	
			{
				for (key in MergeElementProperties.eleProp[editElePropId])
				{
						if(key == defPropKey)
						{
							//var o = oprop[defPropKey].value;
							//alert(MergeElementProperties.eleProp[editElePropId][key].strip().length)
							//alert(oprop[defPropKey].value + '--'+MergeElementProperties.eleProp[editElePropId][key] + '--'+key +'-old-' + o)
							
							if(MergeElementProperties.eleProp[editElePropId][key].strip())
								oprop[defPropKey].value = MergeElementProperties.eleProp[editElePropId][key]
							
							
						}
						
				}	
				
				
			}
				
			return oprop;	
			
		}
	}
	return false
}

/*function objectClone(srcInstance)
{
	
	return Utils.deepClone(srcInstance);
	
	if(typeof(srcInstance) != "object" || srcInstance == null)
		return srcInstance;
	var newInstance = srcInstance.constructor();
	for(var i in srcInstance)
		newInstance[i] = objectClone(srcInstance[i]);
	return newInstance;
}*/
function isMergeableField(elem)
{
	
	var attrDefaultProp;
	switch(elem.readAttribute('type'))
	{
		case 'control_checkbox':	
			attrDefaultProp = default_properties["control_checkbox"]
		break
		case 'control_textbox':	
			attrDefaultProp = default_properties.control_textbox
		break
		case 'control_number':	
			attrDefaultProp = default_properties.control_number
		break
		case 'control_head':	
			attrDefaultProp = default_properties.control_head
		break
		case 'control_money':	
			attrDefaultProp = default_properties.control_money
		break
		case 'control_phonenumber':	
			attrDefaultProp = default_properties.control_phonenumber
		break
		case 'control_radio':	
			attrDefaultProp = default_properties.control_radio
		break
		case 'control_textbox':	
			attrDefaultProp = default_properties.control_textbox
		break
		case 'control_paragraph':	
			attrDefaultProp = default_properties.control_paragraph
		break
		case 'control_datetime':	
			attrDefaultProp = default_properties.control_datetime
		break
		case 'control_email':	
			attrDefaultProp = default_properties.control_email
		break
		case 'control_dropdown':	
			attrDefaultProp = default_properties.control_dropdown
		break
		case 'control_textarea':	
			attrDefaultProp = default_properties.control_textarea
		break
		case 'control_fileupload':	
			attrDefaultProp = default_properties.control_fileupload
		break
		default:
		
		break
		
	}
	
	if(attrDefaultProp)	
	{
		
		//var tmp = jQuery.extend(true, {}, attrDefaultProp)
		//var tmp = ObjectHandler.getCloneOfObject(attrDefaultProp);
		//alert("PRE : "+attrDefaultProp.text.value);
	
		
		var val = collectEleProp(Utils.deepClone(attrDefaultProp),elem);

		return val;

	}
	return false
}

function addQuestions() {

    $$("#list .drags").each(function addQuestionsLoop(elem) {	
													  
        if (payment_fields.include(elem.readAttribute('type')) && getAllPayments()) {
            Utils.alert('You cannot add more than one <u>payment</u> tool. Please delete the existing one first.'.locale(),'Error'.locale());
            elem.remove();
            return;
        }
        if (elem.readAttribute('type') == "control_captcha" && getElementsByType('control_captcha')) {
            Utils.alert('You cannot add more than one <u>captcha</u> tool. Please delete the existing one first.'.locale(),'Error'.locale());
            elem.remove();
            return;
        }
		
		if(elem.id.length>1)
		var op = isMergeableField(elem)
		
		if (elem.id.length<1 && elem.type=="control_button")
		{
			elem.setAttribute('id','submitButtonOfForm__'+databaseId)
		}
		
		//$$('#list li').each(function(){
									 
									 
		//})
		//if(elem.type=="control_button")
		//return false
		var isElementExist = findByNameElement(elem.id.split('__')[0])
		
		if(op!== undefined && isElementExist )
		{
			elem.remove()
			Utils.alert("This element already added in the form".locale(),'Error'.locale())
			return false;
		}
		//alert(isChildForm +":"+EDIT_MODE)
		//alert(isChildForm +":" + elem.id + ":" +findByNameElement(elem.id.split('__')[0]))
		//		alert(elem.id)
		if(EDIT_MODE && isChildForm && isElementExist)
		{
			
			elem.remove()
			Utils.alert("As this is child form,So new field can not be added in the form." ,'Error'.locale())
			return false;
		}
		
		$('related_database').disabled = "disabled"
		Event.stopObserving('view_field_link', 'click');
	
		if ($('change_link'))
			$('change_link').hide();
		
		
		if(op)
		{
			//elem.id has a old name of field 
			
			var res = createDivLine(elem,op,undefined,elem.id);				
		}
		else		
		{
			
			var res = createDivLine(elem);
		}
		
		//var t = elem.readAttribute('type')
		//alert(MergeElementProperties.eleProp)
		//alert(default_properties.control_checkbox)
        
		//res.elem.setProperty('options','sdsdsd')
		//alert(res.elem.retrieve('properties'))
		//alert(res.elem.getProperty('options'))
		//elem.setAttribute('style','border:solid 1px red')
		
		//res.elem.setProperty('options','neele')
		

		//alert(res.elem.getProperty('options'))
        createList();
        elem.__onrails = undefined;
        if (payment_fields.include(res.elem.getProperty('type'))) {
            Utils.loadScript('/sistema/javascripts/builder/payment_wizard.js', function (i) {
                openPaymentWizard(i);
            }, res.elem.getProperty('qid'));
        }
        if (res.elem.getProperty('type') == 'control_image') {
            Utils.loadScript('/sistema/javascripts/builder/image_wizard.js', function (i) {
                imageWizard.openWizard(i);
            }, res.elem.getProperty('qid'));
        }
		//alert($$("#list li").length)
        if ($$("#list li").length == 2 && $$("#list li")[1].readAttribute('type') == 'control_button') {
            var el = $$("#list li")[0];
            el.run(selectEvent);
            el.__justSelected = false;
            el.hiLite();
            if ($$("#list li div[id*=label]")[0]) {
                $$("#list li div[id*=label]")[0].run('click');
            }
        } else {
            res.container.run(selectEvent);
            res.container.__justSelected = false;
            res.container.hiLite();
            if (res.container.select('div[id*=label]')[0]) {
                res.container.select('div[id*=label]')[0].run('click');
            }
        }
        onChange('Questions added');
    });
	addEmailToSendConfirmation()
}

function renewElement(elem, cont) {
	 
	if($('related_database').disabled && isChildForm)
    	var res = createDivLine(cont, elem.retrieve("properties"),undefined,getSelectedInputFieldName(cont.id));
	else
		var res = createDivLine(cont, elem.retrieve("properties"));
		
    createList();
	//alert(res.container)
	//res.container.setAttribute('style','border:solid 1px red');
	
    if (selected.id == res.container.id) {
	//	res.container.addClassName('question-selected')
        res.container.run(selectEvent);
    }
    return res;
}

function updateValue(key, val, cont, elem, old, callback) {
	
    elem.setProperty(key, val);
    var res = {
        elem: elem,
        container: cont
    };
    var nobuildList = ["fontcolor", "background", "font", "fontsize", "styles"];
    if (elem.id == "stage") {
        applyFormProperties(false, nobuildList.include(key));
    } else {
        res = renewElement(elem, cont);
    }
    if (old != val) {
        onChange(key + " has changed from: '" + old + "' to: '" + val + "'");
    }
    if (callback) {
        callback(res);
    }
    return res;
}

function emailList(but) {
    updateEmails();
    var button = $(but);
    if (button.menuList) {
        button.menuList.closeMenu();
        return;
    }
    if (closeActiveButton(button) === false) {
        return false;
    }
    lastTool = button;
    button.addClassName('button-over');
    var menuContainer = new Element('div');
    menuContainer.setStyle({
        width: '250px',
        zIndex: 10000,
        padding: '5px'
    });
    menuContainer.addClassName('edit-box');
    var top = button.cumulativeOffset().top + button.getHeight() + 3;
    var left = button.cumulativeOffset().left;
    menuContainer.setStyle({
        top: top + 'px',
        left: left + 'px'
    });
    menuContainer.insert('<b style="font-size:14px; color:#333">' + 'Email List'.locale() + '</b><br>');
    menuContainer.closeMenu = function () {
        menuContainer.remove();
        button.removeClassName('button-over');
        button.menuList = false;
        lastTool = false;
    };
    button.menuList = menuContainer;
    var list = new Element('div');
    list.setStyle('border:1px solid #aaa; background:#fff; width:99%; list-style:none; list-style-position:outside; margin:5px 0px;');
    var econds = [];
    $A(form.getProperty('conditions')).each(function (c) {
        if (c.type == 'email') {
            econds.push(c.action.email);
        }
    });
    $A(form.getProperty('emails')).each(function emailsLoop(email, index) {
        var emailLi = new Element('li');
        var icon = '/sistema/images/mail' + ((email.type == 'autorespond') ? '-auto' : '') + '.png';
        if (econds.include('email-' + index)) {
            icon = '/sistema/images/cond_small.png';
        }
        var emailIcon = new Element('img', {
            src: icon,
            align: 'absmiddle',
            title: ((email.type == 'autorespond') ? 'Auto Responder' : 'Notification')
        }).setStyle('margin-right:5px');
        emailLi.insert(emailIcon);
        emailLi.insert(new Element('span', {
            title: (email.name.length > 30 ? email.name : '')
        }).update(email.name.shorten(30)));
        if (econds.include('email-' + index)) {
            emailLi.insert('<span class="its-conditional" title="' + 'This email is conditional and will not be sent until all conditions are matched.'.locale() + '"> Conditional </span>');
        }
        emailLi.setStyle({
            margin: '3px',
            border: '1px solid #ccc',
            background: '#eee',
            padding: '3px',
            cursor: 'pointer',
            position: 'relative'
        });
        emailLi.mouseEnter(function () {
            emailLi.setStyle({
                background: '#ddd',
                border: '1px solid #aaa'
            });
        }, function () {
            emailLi.setStyle({
                background: '#eee',
                border: '1px solid #ccc'
            });
        });
        emailLi.observe('click', function () {
            Utils.loadScript('/sistema/javascripts/builder/email_wizard.js', function (ind) {
                EmailWizard.openWizard(ind);
            }, index);
            menuContainer.closeMenu();
        });
        list.insert(emailLi);
    });
    menuContainer.insert(list);
    var addNewButton = new Element('button', {
        type: 'button',
        className: 'big-button buttons'
    }).setStyle({
        cssFloat: 'right',
        fontSize: '14px'
    });
    addNewButton.insert('<img src="/sistema/images/add.png" align="top" > ' + 'Add New Email'.locale());
    menuContainer.insert(addNewButton);
    addNewButton.observe('click', function () {
        Utils.loadScript('/sistema/javascripts/builder/email_wizard.js', function () {
            EmailWizard.openWizard();
        });
    });
    $(document.body).insert(menuContainer);
    menuContainer.positionFixed({
        offset: 68
    });
    menuContainer.updateTop(formBuilderTop + (Utils.isFullScreen ? 0 : 68));
    menuContainer.updateScroll();
}

function makeTabOpen(id) {
	
    if ($('button_form_styles') && $('button_form_styles').hasClassName('button-over')) {
        openStyleMenu(false, $('button_form_styles'));
    }
    $$('.tab-legend-open').invoke('removeClassName', 'tab-legend-open');
    $$('.index-tab-legend-image').invoke('removeClassName', 'index-tab-legend-image');
    $(id).addClassName('tab-legend-open');
    $(id).addClassName('index-tab-legend-image');
    switch (id.id || id) {
    case "form-property-legend":
        $('group-setup').hide();
        $('group-formproperties').show();
        $('group-properties').hide();
        break;
    case "form-setup-legend":
        $('group-setup').show();
        $('group-formproperties').hide();
        $('group-properties').hide();
        break;
    case "prop-legend":
	

		
		$('group-setup').hide();
		
		
		
		jQuery(".active").removeClass("active");
		jQuery(".content").slideUp("fast");
		jQuery("#content_4").slideDown("slow");
		//alert("done")
		
		$('group-setup').hide();
		//$('group-formproperties').hide();
		$('group-properties').show();
        break;
    }
	
    closeActiveButton();
}

function makeProperties(elem, cont) {
    var table, tbody;
    var isForm = elem.id == 'stage';
    table = new Element("table", {
        cellpadding: 4,
        cellspacing: 0,
        className: 'prop-table'
    }).insert(tbody = new Element('tbody'));
    $H($(elem).retrieve("properties")).each(function propertiesLoop(pair) {
        if (pair.value.hidden === true && document.debug !== true) {
            if (!(elem.getProperty('inputType') == "Drop Down" && pair.key == "dropdown")) {
                return;
            }
        }
        if (typeof pair.value == "function") {
            return;
        }
        if (pair.key == "status" && pair.value.value === "") {
            pair.value.value = "Enabled";
        }
        var tr = new Element('tr'),
            labelTD, infoTD, valueTD, valueDIV;
        tr.insert(labelTD = new Element('td', {
            valign: 'top',
            className: 'prop-table-label',
            nowrap: true
        }).insert(pair.value.text || pair.key));
        tr.insert(infoTD = new Element('td', {
            width: 16,
            align: 'left',
            valign: 'top'
        }).setStyle('padding:0; padding-top:6px; background:#fff'));
        if (pair.key in tips) {
            var tip = tips[pair.key];
            tip = Object.extend({
                shadow: true,
                fadeIn: {
                    duration: 0.5
                }
            }, tip || {});
            infoTD.insert(new Element('img', {
                src: '/sistema/images/info.gif',
                align: 'absmiddle'
            }).tooltip(tip.tip, tip));
        }
        if (pair.value.hidden === true && document.debug === true) {
            infoTD.insert(new Element('img', {
                src: '/sistema/images/debug.png',
                width: 12,
                height: 12,
                align: 'absmiddle'
            }).tooltip("Debug Mode hidden values"));
        }
        if (pair.value.splitter) {
            valueDIV = new Element('div', {
                className: 'valueDiv-long'
            }).insert(pair.value.value.replace(/\|/gim, "<br>"));
            tr.insert(valueTD = new Element('td', {
                valign: 'top',
                className: 'prop-table-value'
            }).insert(valueDIV));
        } else {
            var valueDivInsert;
            if (pair.key == 'emails') {
                valueDivInsert = pair.value.value[0].name;
            } else {
                valueDivInsert = pair.value.value;
            }
            valueDIV = new Element('div', {
                className: pair.value.textarea ? 'valueDiv-long' : 'valueDiv'
            }).insert(valueDivInsert);
            tr.insert(valueTD = new Element('td', {
                valign: 'top',
                className: 'prop-table-value'
            }).insert(valueDIV));
        }
        if (pair.value.textarea) {
            if (pair.value.splitter) {
                valueDIV.editable({
                    className: 'edit-textarea',
                    labelEl: labelTD,
                    type: 'textarea',
                    escapeHTML: false,
                    defaultText: 'Label'.locale(),
                    onStart: function () {
                        valueDIV.removeClassName('valueDiv-long');
                    },
                    processBefore: function (text) {
                        return text.replace(/\<br\>/gim, "\n");
                    },
                    processAfter: function (text) {
                        return text.replace(/\n/gim, "<br>");
                    },
                    onEnd: function (e, edited, old, val) {
                        edited = edited.replace(/\<br\>/gim, "|").replace(/\|+/g, "|").replace(/^\|+|\|+$/g, "");
                        var newEl = updateValue(pair.key, edited, cont, elem, old);
                        elem = newEl.elem;
                        cont = newEl.container;
                    }
                });
            } else {
                valueDIV.editable({
                    className: 'edit-textarea',
                    type: 'textarea',
                    labelEl: labelTD,
                    defaultText: 'Label'.locale(),
                    onStart: function () {
                        valueDIV.removeClassName('valueDiv-long');
                    },
                    onEnd: function (e, eht, old, val) {
                        var newEl = updateValue(pair.key, val, cont, elem, old);
                        elem = newEl.elem;
                        cont = newEl.container;
                    }
                });
            }
        } else if (pair.value.dropdown) {
            var opts = pair.value.dropdown;
            if (pair.value.dropdown == "options") {
                opts = elem.getProperty('options').split('|');
                if (elem.getProperty('special') != 'None') {
                    opts = Utils.deepClone(special_options[elem.getProperty('special')].value);
                }
                if (opts[0] !== '') {
                    opts.splice(0, 0, '');
                }
            } else {
                opts = $A(opts).map(function (n) {
                    if (Object.isString(n)) {
                        return {
                            text: n,
                            value: n
                        };
                    }
                    return {
                        text: n[1],
                        value: n[0]
                    };
                });
            }
            valueDIV.editable({
                className: 'edit-dropdown',
                type: 'dropdown',
                labelEl: labelTD,
                options: opts,
                onEnd: function (e, sel_value, old, val) {
                    var newEl = updateValue(pair.key, (val.value || val.text) || sel_value, cont, elem, old);
                    elem = newEl.elem;
                    cont = newEl.container;
                }
            });
        } else {
            var onStart = Prototype.K;
            if (pair.value.color) {
                onStart = function (el, val, input) {
                    input.colorPicker2({
                        onComplete: function () {
                            el.finishEdit();
                        }
                    });
                    input.run('click');
                };
            }
            valueDIV.editable({
                className: 'edit-text',
                onStart: onStart,
                labelEl: labelTD,
                defaultText: 'Label'.locale(),
                onEnd: function (e, eht, old, val) {
					
                    var newEl = updateValue(pair.key, val, cont, elem, old);
                    elem = newEl.elem;
                    cont = newEl.container;
                }
            });
        }
        tbody.insert(tr);
    });
    table.id = "prop-" + elem.id;
    if ($("prop-" + elem.id)) {
        $($("prop-" + elem.id).parentNode).update(table);
    } else {
        document.window({
            title: isForm ? 'Preferences'.locale() : 'Properties'.locale(),
            content: table,
            modal: false,
            width: 420,
            buttonsAlign: 'center',
            onInsert: function () {
                if (!isForm) {
                    table.insert({
                        after: '<div style="font-size:10px; margin-top:5px;padding:3px; background:lightyellow;">' + '<img src="/sistema/images/light-bulb.png" align="absmiddle">' + 'Tip: Did you know you can also change these properties from the toolbar?'.locale() + '</div>'
                    });
                }
            },
            buttons: [{
                title: 'OK'.locale(),
                name: 'ok',
                handler: function (w) {
                    w.close();
                }
            }]
        });
    }
}

function closeActiveButton(tool) {
    if (lastTool) {
        lastTool.open = false;
        lastTool.removeClassName("button-over");
        if (lastTool.div) {
            lastTool.div.remove();
            if (lastTool.colorPickerEnabled) {
                lastTool.colorPickerEnabled = false;
            }
        }
        if (lastTool.menuList) {
            lastTool.menuList.closeMenu();
        }
        $('accordion').show();
        $('style-menu').hide();
        if (lastTool.id == 'button_form_styles') {
            lastTool.select('.big-button-text')[0].update('Themes'.locale());
        }
        if (tool && lastTool == tool) {
            lastTool = false;
            return false;
        }
    }
    return true;
}

function editFormTexts() {
    document.window({
        title: "Edit Form Texts",
        content: "",
        modal: false,
        width: 420,
        buttonsAlign: 'center',
        buttons: [{
            title: 'OK'.locale(),
            name: 'ok',
            handler: function (w) {
                w.close();
            }
        }]
    });
}

function makeToolbar(elem, cont) {
	//alert(elem.id)
	var flag=true;
    var isForm = (elem.id == 'stage');
    var toolBarEl = isForm ? 'group-formproperties' : 'toolbar';
	
    var id = elem.getProperty('qid') || 'form';
//alert(id)
//selected_prop
	var objectProperties = new Object();
	
	var myJSONObject = {"ircEvent": "PRIVMSG", "method": "newURI", "regex": "^http://.*"}
    
		Object.toJSON(myJSONObject);
	
	

			//	alert(Object.toJSON(myJSONObject))

//alert(myJSONObject.bindings[1].ircEvent)
	if(!isForm)
	{
		if($('selected_prop').value !=$$('li.question-selected').first().id)
			{
				
				$('tabbed_box_1').childElements().first().setAttribute('id','tab_css')
				customCssForTab();
				
				$$('.tabs li').last().childElements().first().addClassName('add-custom-padding-unselected')
				objGetProperties =new GetElementProperties(id);
				
				//objectProperties = {"field_label":"title","field_type":"single_line_text","field_size":"30","max_length":"25","default_value":"100","required":true,"allow_duplicate":false,"loged_user":true};		
				
				//alert(objectProperties)
				
				$('selected_prop').value = $$('li.question-selected').first().id
				var obj = new ElementProperties(id);
				
				obj.objectProperties = objGetProperties.getProperties();
				
				//alert(obj.objectProperties)	
				if(obj.getToolBar())
					obj.toolTipInit();
					
			}
			else{
				flag = false;
				}
			
	}
	else
	{
		
		/* For form Properties */
		new ElementProperties(elem.id,objectProperties);
		//new GetElementProperties(elem.id);
	}
	
    var allowedFormProps = ['alignment', 'font', 'fontcolor', 'fontsize', 'background', 'labelWidth', 'formWidth', 'styles'];
    var highlightConf = {
        background: '#FFFFE0',
        duration: 1,
        easing: 'pulse',
        easingCustom: 2,
        link: 'ignore'
    };
    $$('.edit-box').invoke('remove');
    if ($('button_form_styles') && $('button_form_styles').hasClassName('button-over')) {
        openStyleMenu(false, $('button_form_styles'));
    }
	//alert(toolBarEl)
    $(toolBarEl).update();
    var tmp_div = new Element('div').setStyle('position:relative; height:100%px;width:98%;border:solid 1px green');
    var toolCount = 0;
    if (!isForm) {
        $('group-properties').show();
      //  $('prop-legend').update("Properties".locale() + ((elem.getProperty('text')) ? ": " + elem.getProperty('text') : ": Form").stripTags().shorten(70)).show();

	 
	
		if(flag)
        makeTabOpen('prop-legend');
       // $('group-formproperties').hide();
        $('group-setup').hide();
    }
	//alert(tmp_div)
    $(toolBarEl).insert(tmp_div);
	
    $H(elem.retrieve('properties')).each(function toolbarLoop(prop) {
        if ((prop.key == 'text' && !prop.value.forceDisplay) || prop.key == 'getItem') {
            return;
        }
        if (prop.value.toolbar === false) {
            return;
        }
        if (prop.value.hidden === true) {
            return;
        }
        if (isForm && !allowedFormProps.include(prop.key)) {
			
            return;
        }
		
        var item = toolbarItems[prop.key];
        if (!item) {
            item = {};
            if (prop.value.hidden) {
                return;
            }
            if (prop.value.text) {
                item.text = prop.value.text;
            }
            if (prop.value.dropdown) {
                item.type = 'dropdown';
                item.values = prop.value.dropdown;
            }
            if (prop.value.textarea) {
                item.type = 'textarea';
            }
        }
        if (!item.icon || item.icon === "") {
            item.icon = '/sistema/images/builder/settings.png';
        }
        if (prop.value.type) {
            item.type = prop.value.type;
        }
        if (prop.value.hint) {
            item.hint = prop.value.hint;
        }
        if (prop.value.handler) {
            item.handler = prop.value.handler;
        }
        if (prop.value.icon) {
            item.icon = prop.value.icon;
        }
        if (prop.value.iconClassName) {
            item.iconClassName = prop.value.iconClassName;
        }
		/* Added by neelesh*/
		var rowDiv = new Element('div',{
			className: 'element_prop_row',
		})
		//alert(1)
		var elementType = null;
		var elementName = null;
		//alert(prop.value.hType)
		
		switch(prop.value.hType)
		{
			case 'textbox':
				elementName ='input';
				elementType ='text';
				break;
			case 'checkbox':
				elementName ='input';
				elementType ='checkbox';
				break;
			case 'textarea':
				elementName ='textarea';
				elementType ='textarea';
			break
			default:
				elementType ='button';
				elementName ='button';
			break;	
		}
			elementType ='button';
			elementName ='button';
			
        var tool = new Element(elementName, {
            type: elementType,
			value:'No',
            className: 'big-button',
			style:'border:solid 1px #000;widht:100%',
            id: "button_" + id + "_" + prop.key
        });
		
		//if(!isForm)
			//tool.setProperty('checked','checked');
        var span = new Element('span', {
            //className: 'big-button-text'
        }).insert(item.text);
        if (!item.iconClassName) {
            item.iconClassName = "";
        }
        var button_icon = new Element('img', {
            align: 'top',
            className: item.iconClassName,
            src: item.icon
        }).setStyle('min-height:24px;min-width:24px;');
        tool.insert(button_icon);
        tool.insert('<br>').insert(span);
        var itemOffset = 69;
        var editBoxTop = (Utils.isFullScreen ? 0 : itemOffset);
        if (prop.value.disabled === true) {
            tool.disable();
        }
        var getDim = function (tool) {
            var dim = {};
            if (tool.hasFixedContainer()) {
                dim = tool.cumulativeOffset();
                dim.top = $(document.body).cumulativeScrollOffset().top;
            } else {
                dim = tool.cumulativeOffset();
            }
            return dim;
        };
        tool.observe('click', function () {
            form.setProperty('stopHighlight', 'Yes');
        });
		
        if (item.type == 'toggle') {
            tool.currentVal = prop.value.value;
            tool.observe('mousedown', function () {
												
                var val = (tool.toggled) ? item.values[0][0] : item.values[1][0];
                var old = tool.currentVal;
                updateValue(prop.key, val, cont, elem, old);
            });
            var bval = '';
            if (item.values[1][0] == prop.value.value) {
                tool.addClassName('button-over');
                button_icon.setStyle({
                    opacity: 1
                });
                bval = 'ON'.locale() + ' ';
                tool.toggled = true;
            }
            button_icon.insert({
                before: '<span style="font-size:9px;">' + bval + '</span>'
            });
        } else if (item.type == 'textarea-combined') {
            tool.observe('mousedown', function (e) {
												
                if (closeActiveButton(tool) === false) {
                    return false;
                }
                lastTool = tool;
                tool.addClassName("button-over");
                if (!tool.open) {
                    tool.open = true;
                    var div = new Element('div', {
                        className: 'edit-box'
                    });
                    lastTool.div = div;
                }
                var oldVal = prop.value.value.split("-");
                var dropdown = new Element('select').setStyle('outline: medium none; border: 1px solid rgb(170, 170, 170);');
                $A(prop.value.values).each(function (v) {
                    dropdown.insert(new Element('option', {
                        value: v[0]
                    }).update(v[1]));
                });
                dropdown.selectOption(oldVal[0]);
                var input = new Element('input', {
                    type: 'text',
                    size: 4
                }).setStyle('outline: medium none; border: 1px solid rgb(170, 170, 170); padding: 4px;margin-right:5px;');
                input.value = oldVal[1];
                var complete = function () {
                    var val = dropdown.value + "-" + input.value;
                    var old = prop.value.value;
                    updateValue(prop.key, val, cont, elem, old);
                    div.remove();
                    tool.removeClassName("button-over");
                    tool.open = false;
                    lastTool = false;
                };
                div.insert(input).insert(dropdown).insert(new Element('input', {
                    type: 'button',
                    value: 'OK'.locale(),
                    className: 'big-button buttons buttons-green'
                }).observe('click', complete));
                if (item.hint) {
                    div.insert('<div class="edit-hint">' + item.hint + '</div>');
                }
                var dim = getDim(tool);
                div.setStyle({
                    position: 'absolute',
                    top: dim.top + editBoxTop + 'px',
                    left: dim.left + 'px',
                    zIndex: 100000
                });
                $(document.body).insert(div);
                div.positionFixed({
                    offset: itemOffset
                });
                div.updateTop(formBuilderTop + editBoxTop);
                div.updateScroll();
            });
        } else if (item.type == 'colorpicker') {
            var onEnd = function (val) {
                var old = prop.value.value;
                updateValue(prop.key, val, cont, elem, old);
            };
            var dim = getDim(tool);
            tool.__colorvalue = prop.value.value
            tool.colorPicker2({
                title: item.hint || item.text,
                className: 'edit-box',
                buttonClass: 'big-button buttons buttons-green',
                onStart: function () {
                    if (closeActiveButton(tool) === false) {
                        return false;
                    }
                    lastTool = tool;
                    tool.addClassName("button-over");
                    return true;
                },
                onEnd: function (el, table) {
                    table.positionFixed({
                        offset: itemOffset
                    });
                    table.updateTop(formBuilderTop + editBoxTop);
                    table.updateScroll();
                    lastTool.div = table;
                },
                onPicked: onEnd,
                onComplete: function (v) {
                    tool.removeClassName("button-over");
                    lastTool = false;
                    onEnd(v);
                }
            });
        } else if (item.type == 'textarea') {
            tool.observe('mousedown', function (e) {
                if (closeActiveButton(tool) === false) {
                    return false;
                }
                lastTool = tool;
                tool.addClassName("button-over");
                if (!tool.open) {
                    tool.open = true;
                    var div = new Element('div', {
                        className: 'edit-box'
                    });
                    lastTool.div = div;
                    var input = new Element('textarea', {
                        cols: 40,
                        rows: 6
                    }).setStyle({
                        outline: 'none',
                        border: '1px solid #aaa'
                    });
                    if (prop.value.splitter) {
                        var reg = new RegExp('\\' + prop.value.splitter + '', 'gim');
                        input.value = prop.value.value.replace(reg, '\n');
                    } else {
                        input.value = prop.value.value;
                    }
                    var complete = function () {
                        var val = input.value;
                        if (prop.value.splitter) {
                            val = val.replace(/\n\r|\n|\r\n|\r/g, '\n').replace(/^\n|\n$/g, '').replace(/\n/g, prop.value.splitter);
                        }
                        var old = prop.value.value;
                        old = prop.value.value;
                        updateValue(prop.key, val, cont, elem, old);
                        div.remove();
                        tool.removeClassName("button-over");
                        tool.open = false;
                        lastTool = false;
                    };
                    if (item.hint) {
                        div.insert('<div class="edit-hint">' + item.hint + '</div>');
                    }
                    var dim = getDim(tool);
                    div.insert(input);
                    div.insert(' ').insert(new Element('input', {
                        type: 'button',
                        value: 'OK'.locale(),
                        className: 'big-button buttons buttons-green'
                    }).observe('click', complete));
                    div.setStyle({
                        position: 'absolute',
                        top: dim.top + editBoxTop + 'px',
                        left: dim.left + 'px',
                        zIndex: 100000
                    });
                    $(document.body).insert(div);
                    div.positionFixed({
                        offset: itemOffset
                    });
                    div.updateTop(formBuilderTop + editBoxTop);
                    div.updateScroll();
                    input.focus();
                }
            });
        } else if (item.type == 'dropdown') {
            var opts = prop.value.dropdown;
            if (prop.value.dropdown == "options") {
                opts = elem.getProperty('options').split('|');
                if (elem.getProperty('special') != 'None') {
                    opts = Utils.deepClone(special_options[elem.getProperty('special')].value);
                }
                if (opts[0] !== '') {
                    opts.splice(0, 0, '');
                }
            }
            var useList = (opts.length < 10);
            tool.observe('mousedown', function (e) {
                if (closeActiveButton(tool) === false) {
                    return false;
                }
                lastTool = tool;
                if (!tool.open) {
                    tool.open = true;
                    tool.addClassName("button-over");
                    var div = new Element('div', {
                        className: 'edit-box'
                    });
                    lastTool.div = div;
                    var dim = getDim(tool);
                    if (useList) {
                        var list = new Element('ul');
                        $A(opts).each(function dropdownListLoop(o, i) {
                            var t = typeof o == "string" ? o : o[1];
                            var v = typeof o == "string" ? o : o[0];
                            var op = new Element('input', {
                                type: 'radio',
                                className: 'input_field',
                                checked: prop.value.value == v,
                                name: 'rad_' + prop.key,
                                value: v,
                                id: 'rad_' + i
                            }).setStyle('margin-left:0; margin-right:5px;');
                            var lab = new Element('label', {
                                htmlFor: 'rad_' + i
                            }).update(op).setStyle({
                                marginLeft: 0
                            });
                            lab.insert(t);
                            var li = new Element('li').setStyle('margin:0');
                            li.insert(lab);
                            list.insert(li);
                        });
                        div.insert(list);
                        list.select('.input_field').each(function inputListLoop(field) {
                            field.onclick = function () {
                                tool.removeClassName("button-over");
                                var val = field.value;
                                var old = prop.value.value;
                                updateValue(prop.key, val, cont, elem, old);
                                div.remove();
                                tool.open = false;
                                lastTool = false;
                            };
                        });
                    } else {
                        var input = new Element('select').setStyle({
                            outline: 'none',
                            border: '1px solid #aaa'
                        });
                        $A(opts).each(function (o) {
                            var t = typeof o == "string" ? o : o[1];
                            var v = typeof o == "string" ? o : o[0];
                            var op = $(new Option()).setText(t);
                            op.value = v;
                            input.appendChild(op);
                        });
                        div.insert(input);
                        input.selectOption(prop.value.value);
                        var complete = function () {
                            tool.removeClassName("button-over");
                            var s = input.getSelected();
                            var val = s.value;
                            var old = prop.value.value;
                            updateValue(prop.key, val, cont, elem, old);
                            div.remove();
                            tool.open = false;
                            lastTool = false;
                        };
                        div.insert(' ').insert(new Element('input', {
                            type: 'button',
                            value: 'OK'.locale(),
                            className: 'big-button buttons buttons-green'
                        }).observe('click', complete));
                        input.observe('keyup', function (e) {
                            e = document.getEvent(e);
                            if (e.keyCode == 13) {
                                complete();
                            }
                        });
                        input.observe('change', function (e) {
                            complete();
                        });
                        input.focus();
                    }
                    if (item.hint) {
                        div.insert('<span class="edit-hint">' + item.hint + '</span><br>');
                    }
                    div.setStyle({
                        position: 'absolute',
                        top: dim.top + editBoxTop + 'px',
                        left: dim.left + 'px',
                        zIndex: 100000
                    });
                    $(document.body).insert(div);
                    div.positionFixed({
                        offset: itemOffset
                    });
                    div.updateTop(formBuilderTop + editBoxTop);
                    div.updateScroll();
                }
            });
        } else if (item.type == 'menu') {
            var itemOptions = item.values;
            tool.observe('mousedown', function (e) {

                if (closeActiveButton(tool) === false) {
                    return false;
                }
                lastTool = tool;
                if (!tool.open) {
                    tool.open = true;
                    tool.addClassName("button-over");
                    var div = new Element('div', {
                        className: 'edit-box'
                    });
                    lastTool.div = div;
                    var apply = function () {
                        group.select('input[type=radio]').each(function (r) {
                            if (r.checked) {
                                var val = r.value;
                                var old = prop.value.value;
                                if (val != old) {
                                    updateValue(prop.key, val, cont, elem, old);
                                }
                                closeActiveButton(tool);
                            }
                        });
                    };
                    var group = new Element('div').setStyle('list-style:none; list-style-position:outside;');
                    $A(itemOptions).each(function (o, i) {
												   
                        var elID = i + '_el_id';
                        var li = new Element('li');
                        var lb = new Element('label', {
                            htmlFor: elID
                        });
                        if (o.icon) {
                            var ic = new Element('img', {
                                align: 'absmiddle',
                                src: o.icon
                            }).setStyle('margin-right:5px;');
                            lb.insert(ic);
                        }
                        lb.insert(o.text);
                        if (prop.key == 'font') {
                            lb.setStyle('font-family:' + o.text);
                        }
                        var rd = new Element('input', {
                            type: 'radio',
                            id: elID,
                            name: 'sp_menu_item',
                            value: o.value
                        }).setStyle('margin:0px; margin-top:2px; padding:0px;');
						//alert(apply)
                        rd.onclick = apply;
                        li.insert(rd).insert(lb);
                        rd.checked = (prop.value.value == o.value);
                        group.insert(li);
                    });
                    var complete = function () {
                        console.error("You have found a place to use this complete");
                    };
                    if (item.hint) {
                        div.insert('<span class="edit-hint">' + item.hint + '</span><br>');
                    }
                    var dim = getDim(tool);
                    div.insert(group);
                    div.setStyle({
                        position: 'absolute',
                        top: dim.top + editBoxTop + 'px',
                        left: dim.left + 'px',
                        zIndex: 100000
                    });
                    $(document.body).insert(div);
                    div.positionFixed({
                        offset: itemOffset
                    });
                    div.updateTop(formBuilderTop + editBoxTop);
                    div.updateScroll();
                }
            });
        } else if (item.type == "handler") {
            tool.observe('mousedown', function (e) {
                item.handler(item, tool);
            });
        } else {
            tool.observe('mousedown', function (e) {
                if (lastTool) {
                    lastTool.open = false;
                    lastTool.removeClassName("button-over");
                    if (lastTool.div) {
                        lastTool.div.remove();
                        if (lastTool.colorPickerEnabled) {
                            lastTool.colorPickerEnabled = false;
                        }
                    }
                    $('accordion').show();
                    $('style-menu').hide();
                    if (lastTool == tool) {
                        if (prop.key == "formWidth") {
                            $('list').setStyle({
                                borderRight: '',
                                width: prop.value.value + 'px'
                            });
                        }
                        if (prop.key == "labelWidth") {
                            $$('.form-label-left, .form-label-right').each(function (e) {
                                e.setStyle({
                                    outline: '',
                                    width: prop.value.value + 'px'
                                });
                            });
                        }
                        lastTool = false;
                        return true;
                    }
                }
                lastTool = tool;
                if (!tool.open) {
                    tool.addClassName("button-over");
                    tool.open = true;
                    var div = new Element('div', {
                        className: 'edit-box'
                    });
                    lastTool.div = div;
                    var input = new Element('input', {
                        type: 'text',
                        size: item.size || 25
                    }).setStyle({
                        outline: 'none',
                        border: '1px solid #aaa',
                        padding: '4px'
                    });
                    input.value = prop.value.value;
                    var complete = function () {
                        tool.removeClassName("button-over");
                        var val = input.value;
                        var old = prop.value.value;
                        updateValue(prop.key, val, cont, elem, old);
                        if (prop.key == "formWidth") {
                            $('list').setStyle({
                                borderRight: ''
                            });
                        }
                        if (prop.key == "labelWidth") {
                            $$('.form-label-left, .form-label-right').each(function (e) {
                                e.setStyle({
                                    outline: ''
                                });
                            });
                        }
                        div.remove();
                        tool.open = false;
                        lastTool = false;
                    };
                    if (item.hint) {
                        div.insert('<span class="edit-hint">' + item.hint + '</span><br>');
                    }
                    var dim = getDim(tool);
                    div.insert(input);
                    div.insert(' ').insert(new Element('input', {
                        type: 'button',
                        value: 'OK'.locale(),
                        className: 'big-button buttons buttons-green'
                    }).observe('click', complete));
                    input.observe('keyup', function (e) {
                        e = document.getEvent(e);
                        if (e.keyCode == 13) {
                            complete();
                        }
                    });
					
                    if (item.type == "spinner") {
                        input.spinner({
                            cssFloat: 'left',
                            addAmount: 1,
                            onChange: function (val) {
                                if (prop.key == "font") {
                                    $('list').setStyle({
                                        fontFamily: val
                                    });
                                }
                                if (prop.key == "fontsize") {
                                    val = parseInt(val, 10);
                                    $('list').setStyle({
                                        fontSize: val + 'px'
                                    });
                                }
                                if (prop.key == "formWidth") {
                                    val = parseFloat(val);
                                    $('list').setStyle({
                                        width: val + 'px'
                                    });
                                }
                                if (prop.key == "labelWidth") {
                                    $$('.form-label-left, .form-label-right').each(function (e) {
                                        e.setStyle({
                                            width: val + 'px'
                                        });
                                    });
                                }
                            }
                        });
                        if (prop.key == "formWidth") {
                            $('list').setStyle('border-right:2px dashed #ccc;');
                        }
                        if (prop.key == "labelWidth") {
                            $$('.form-label-left, .form-label-right').each(function (e) {
                                e.setStyle({
                                    outline: '2px dashed #ccc'
                                });
                            });
                        }
                    }
                    div.setStyle({
                        position: 'absolute',
                        top: dim.top + 46 + 'px',
                        left: (dim.left) + 'px',
                        zIndex: 100000
                    });
                    $(document.body).insert(div);
                    div.positionFixed({
                        offset: itemOffset
                    });
                    div.updateTop(formBuilderTop + editBoxTop);
                    div.updateScroll();
                    input.focus();
                    input.select();
                }
            });
        }
		rowDiv.insert(tool)
        tmp_div.insert(rowDiv);
        if (prop.key in tips) {
            var tip = tips[prop.key];
            buttonToolTips(tool, {
                message: tip.tip,
                offsetTop: 10,
                offsetLeft: 200,
                arrowPosition: 'top',
                parent: $('tool_bar')
            });
        }
        if (false) {
            toolCount++;
            if (toolCount == 4) {
                tmp_div.insert('<hr style="background:none; padding:0px; margin:2px; border:0px; height:1px; border-top:1px dotted #aaa;">');
                toolCount = 0;
            }
        }
    });
    if ($(toolBarEl).lastChild && $(toolBarEl).lastChild.tagName == 'HR') {
        $($(toolBarEl).lastChild).remove();
    }
}
/*Old tool tip*/
function buttonToolTips(button, options) {
	return false
	//alert(button)
    if (Utils.lang != "en") {
        return;
    }
    options = Object.extend({
        offsetTop: 0,
        offsetLeft: 0,
        parent: $(button.parentNode),
        arrowPosition: 'top'
    }, options || {});
    var create = function () {
        var bubble = new Element('div', {
            className: 'form-description'
        });
        var arrow = new Element('div', {
            className: 'form-description-arrow-' + options.arrowPosition
        });
        var arrowsmall = new Element('div', {
            className: 'form-description-arrow-' + options.arrowPosition + '-small'
        });
        var title = new Element('div', {
            className: 'form-description-title'
        });
        var content = new Element('div', {
            className: 'form-description-content'
        });
        if (options.width) {
            bubble.setStyle({
                width: options.width + 'px',
                minWidth: options.width + 'px',
                maxWidth: 'none'
            });
        }
        content.insert(options.message);
        if (options.title) {
            title.insert(options.title);
            arrowsmall.setStyle('border-bottom-color:#ddd');
        } else {
            title.hide();
        }
        bubble.insert(arrow).insert(arrowsmall).insert(title).insert(content).hide();
        options.parent.insert(bubble);
        switch (options.arrowPosition) {
        case "top":
            var w = ((bubble.getWidth() - 6) / 2) - 10;

            arrow.setStyle('left:' + w + 'px');
            arrowsmall.setStyle('left:' + (w + 3) + 'px');
            h = button.positionedOffset()[1] + button.getHeight() + options.offsetTop;
            var l = (button.positionedOffset()[0] + button.getWidth() / 2) - (bubble.getWidth() / 2) + options.offsetLeft;
            bubble.setStyle('top:' + (h + 25) + 'px; left:' + l + 'px; opacity:0;');
            break;
        }
        return bubble;
    };
    var h;
    var dtime;
    button.bubblebox = false;
    var clickStop = function () {
        if (dtime) {
            clearTimeout(dtime);
        }(button.bubblebox && button.bubblebox.shift({
            link: 'ignore',
            top: h + 25,
            opacity: 0,
            duration: 0.3,
            onEnd: function (e) {
                button.bubblebox.remove();
                button.bubblebox = false;
            }
        }));
    };
    $(options.trigger ? options.trigger : button).mouseEnter(function () {
        if (button.hasClassName('dragging') || (button.hasClassName('drags') && button.style.position == 'absolute')) {
            clickStop();
            return;
        }
        dtime = setTimeout(function () {
            if (button.bubblebox !== false) {
                return;
            }
            if (button.hasClassName('button-over')) {
                return;
            }
            if (!button.parentNode || !button.parentNode.parentNode) {
                return;
            }
            button.bubblebox = create();
            button.bubblebox.observe('click', clickStop);
            button.bubblebox.show().shift({
                link: 'ignore',
                top: h,
                opacity: 1,
                duration: 0.3
            });
            setTimeout(function () {
                clearTimeout(dtime);
                (button.bubblebox && button.bubblebox.shift({
                    top: h + 25,
                    opacity: 0,
                    duration: 0.3,
                    onEnd: function (e) {
                        button.bubblebox.remove();
                        button.bubblebox = false;
                    }
                }));
            }, 10000);
        }, options.delay ? options.delay * 1000 : 1000);
    }, function (el, e) {
        if (dtime) {
            clickStop();
            clearTimeout(dtime);
        }(button.bubblebox && button.bubblebox.shift({
            top: h + 25,
            opacity: 0,
            duration: 0.3,
            onEnd: function (e) {
                button.bubblebox.remove();
                button.bubblebox = false;
            }
        }));
    });
    $(button).observe('click', clickStop);
}

function openStyleMenu(item, button) {
    if (closeActiveButton(button) === false) {
        return false;
    }
    lastTool = button;
    button.addClassName('button-over');
    button.select('.big-button-text')[0].update('Close<br>Themes'.locale());
    $('accordion').hide();
    buildStyleMenu();
    $('style-menu').show();
}

function buildStyleMenu(button) {
    $('style-content').setStyle('height:400px; overflow:auto;').update();
    $A(styles).each(function buildStyleLoop(style) {
        var cont = new Element('div').setStyle('text-align:center; margin:4px; padding:2px; cursor:pointer;');
        cont.mouseEnter(function () {
            cont.setStyle('background:#ddd;');
        }, function () {
            cont.setStyle('background:transparent;');
        });
        cont.observe('click', function () {
            var old = form.getProperty('styles');
            if (old != style.value) {
                justSelectedATheme = true;
                form.setProperty('styles', style.value);
                updateValue('styles', style.value, false, form, old);
            }
        });
        var sshot = new Element('img', {
            align: 'absmiddle',
            src: style.image
        }).setStyle('border:1px solid #aaa;');
        cont.insert(sshot).insert('<br>').insert(style.text);
        $('style-content').insert(cont);
    });
    Utils.updateBuildMenusize();
}

function openOptionEdit(id, index) {
    if ($('label_input_' + id + '_' + index)) {
        $('label_input_' + id + '_' + index).run('click');
    } else if ($('label_input_' + id + '_' + (index - 1))) {
        $('label_input_' + id + '_' + (index - 1)).run('click');
    }
    $('id_' + id).run(selectEvent);
}

function setOptionsEditable(id, type) {
	
    var sp = new Element('button', {
        type: 'button',
        className: 'big-button buttons add-button'
    }).setStyle({
        padding: '4px',
        margin: '15px 0px 0',
        cursor: 'pointer'
    });
    var addImg = new Element('img', {
        src: "/sistema/images/add.png",
        align: "absmiddle"
    });
    sp.insert(addImg);
	
    sp.insert('Add New Option'.locale());
    var ne = getElementById(id);	
    if (!ne) {
        return;
    }
    var addNewOption = function () {
        setTimeout(function () {
            stopUnselect = true;
            var ops = (ne.getProperty('special') != 'None') ? Utils.deepClone(special_options[ne.getProperty('special')].value) : ne.getProperty('options').split('|');
            var old = ops.join('|');
            ops.push('Option'.locale() + (ops.length + 1));
            var val = ops.join('|');
            if (ne.getProperty('special') != 'None') {
                ne.setProperty('special', 'None');
            }
            document._onedit = false;
            var res = updateValue('options', val, $('id_' + id), ne, old, function () {
                openOptionEdit(id, ops.length);
            });
        }, 200);
    };
    sp.observe('mousedown', addNewOption);
    sp.hide();
    //ne.insert(sp);
	/*Added by neelesh*/
	return;
    $$('#id_' + id + ' .form-' + type + '-item label').each(function optionsLabelLoop(l, i) {
        var parent = $(l.parentNode);
        l.editable({
            className: 'edit-option',
            processAfter: function (val, outer, value, oldValue) {
                if (!val) {
                    return oldValue;
                }
                return value;
            },
            onStart: function (el, val, inp) {
				//inp.setAttribute('style','border:solid 1px red')
                inp.setStyle('width:100px; padding:0px; margin:0px;');
                var del = new Element('img', {
                    src: 'sistema/images/dicon_delete_on.gif',
                    align: 'absmiddle',
					alt:'X'
                }).setStyle('margin-left:3px;');
                del.observe('mousedown', function () {
												  
                    inp.value = " ";
                    inp.run('blur');
                    setTimeout(function () {
						$(parent).setAttribute('style','border:solid 1px red')
						return
                        $(parent).remove();
                        onChange('option removed');
                    }, 20);
                });
                l.insert(del);
                if (inp.value.match(/Option\s+\d+/)) {
                    inp.value = "";
                }
            },
            onEnd: function (el, val, old, value) {
				
                but = false;
                var values = [];
	
//				#id_1 .form-checkbox-item label
                $$('#id_' + id + ' .form-' + type + '-item label').each(function (rad) {
                    var val = rad.innerHTML.strip();
					//parent.setAttribute('style','border:solid 1px red');
					
                    if (val) {
                        values.push(val);
                    }
                });
                var ne = $(parent.parentNode.parentNode);
                old = ne.getProperty('options');
				
                if (ne.getProperty('special') != 'None') {
                    ne.setProperty('special', 'None');
                }
				
                ne.setProperty('options', values.join('|'));
				old = ne.getProperty('options');
				
            }
        });
    });
}

function createControls() {

    $$('.tools').each(function createControlsLoop(toolbox) {
										  
        Sortable.create(toolbox, {
            constraint: '',
            containment: [],
            revert: true,
            ghosting: true,
            starteffect: function () {
                return false;
            },
            scroll: window,
            onDrag: function (obj, e) {
				//alert(1)
                if (!obj.element.__onrails && obj.element.hasClassName('dragging')) {
                    obj.options.constraint = 'vertical';
                    obj.element.style.left = '0';
                    obj.element.__onrails = true;
                }
            },
            onChange: function (el) {
                if (Sortable._emptyPlaceMarker) {
                    Sortable._emptyPlaceMarker.setStyle({
                        width: form.getProperty('formWidth') + "px"
                    });
                }
                el.addClassName("dragging");
                el.setStyle({
                    width: form.getProperty('formWidth') + "px"
                });
                return true;
            },
            onUpdate: function () {
				
                if (Sortable._guide) {
                    Sortable._guide.tools = false;
                }
                handleNoSubmit();
                addQuestions();
                Sortable.destroy(toolbox);
				
                toolbox.innerHTML = toolboxContents[toolbox.id];
                createControls();
                setClicks();
                setControlTooltips();
            }
        });
    });
}

function setClicks() {
	
    $$(".drags").each(function clicksLoop1(el) {
			  
        if (el.clickSet) {
            return true;
        }
        var dblclick = false;
        el.observe("click", function (e) {
            if (dblclick) {
                return;
            }
            if (e.element().hasClassName('info')) {
                return;
            }
            dblclick = true;
            var cl = el.cloneNode(true);
            $('list').cleanWhitespace();
            if (selected) {
                $(selected).insert({
                    after: cl
                });
            } else {
                if ($$('#list li:last-child')[0] && $$('#list li:last-child')[0].readAttribute('type') == 'control_button') {
                    $$('#list li:last-child')[0].insert({
                        before: cl
                    });
                } else {
                    $('list').insert(cl);
                }
            }
            handleNoSubmit();
            addQuestions();
            setTimeout(function () {
                dblclick = false;
            }, 1000);
        });
        el.clickSet = true;
    });
}

function handleNoSubmit() {
	var submitNotFound = true
	$$('#list li').each(function(el){
								 
		if (el.readAttribute('type') == 'control_button')						 
			submitNotFound = false
		})


   /* if ($$('#list > li.form-line, #list > li.form-input-wide').length < 2 && !$$('#list .drags').collect(function (el) {
				alert( el.readAttribute('type'))																											   

			return el.readAttribute('type') == 'control_button';
    }).any()) {
		
        $('list').insert({
            bottom: new Element('li', {
                className: 'drags',
                type: 'control_button'
            })
        });
    }*/
	if(submitNotFound)
	$('list').insert({
            bottom: new Element('li', {
                className: 'drags',
                type: 'control_button'
            })
        });
}

function updateOrders(changetype) {
    $$("div.question-input").each(function updateOrdersLoop(el, i) {
        el.setProperty("order", ++i);
    });
    if (changetype != "nochange") {
        onChange("Question order changed or new question added", true);
    }
}

function getAllProperties(markDefaults) {
    var allprop = {},
        proparray = {};
    updateOrders("nochange");
    $$("div.question-input").each(function getAllPropertiesLoop(el, i) {
        allprop[el.getProperty("order") + "-" + el.getProperty("type")] = $(el).retrieve("properties");
    });
    $H(allprop).each(function getAllPropertiesLoop2(prop) {
        var type = prop.key.split('-')[1];
        $H(prop.value).each(function (kv) {
            if (markDefaults && default_properties[type][kv.key] && default_properties[type][kv.key].value == kv.value.value) {
                proparray[prop.value.qid.value + "_" + kv.key] = '%%default%%';
            } else {
                proparray[prop.value.qid.value + "_" + kv.key] = kv.value.value;
            }
        });
    });
    $H(form.retrieve('properties')).each(function getAllPropertiesLoop3(prop) {
        if (markDefaults && default_properties.form[prop.key] && default_properties.form[prop.key].value === prop.value.value) {
            proparray["form_" + prop.key] = '%%default%%';
        } else {
            proparray["form_" + prop.key] = prop.value.value;
        }
    });
    proparray = Object.extend({
        form_height: $('stage').getHeight()
    }, proparray);
    return proparray;
}

function onChange(log, order) {
    if (Utils.isFullScreen) {
        Utils.updateBarHeightInFullScreen();
    }
    changeFlag = true;
    $('log').setText(log);
    if (undoStack.length === 0) {
        undoStack.push(initialForm);
    } else {
        undoStack.push(lastChange);
    }
    redoStack = [];
    lastChange = {
        log: log,
        undo: getAllProperties()
    };
   /* $('stage').disableButton('redo');
    $('redoButton').disable();
    $('redoicon').src = '/sistema/images/blank.gif';
    $('redoicon').className = 'toolbar-redo_disabled';
    $('stage').enableButton('undo');
    $('undoButton').enable();
    $('undoicon').src = '/sistema/images/blank.gif';
    $('undoicon').className = 'toolbar-undo';
    $('saveButton').shift({
        opacity: 1,
        duration: 0.5
    });*/
    $('save_button_text').innerHTML = "Save".locale();
    $('save_button_text').saved = false;
}

function createList() {
	//alert(1)
    var cont = $$('.tools').map(function toolsMapLoop(e) {
        return e.id;
    });
    cont.push('list');
    Sortable.create("list", {
        containment: cont,
        constraint: 'vertical',
        starteffect: false,
        markDropZone: true,
        delay: Prototype.Browser.IE ? false : 200,
        scroll: window,
        dropZoneCss: 'dropZone',
        dropOnEmpty: true,
        onDrag: function (obj) {
            if (!obj.element.__onrails && obj.element.hasClassName('form-line-column')) {
                obj.element.__onrails = true;
                obj.options.constraint = '';
            } else if (!obj.element.__onrails) {
                obj.options.constraint = 'vertical';
            }
        },
        onChange: function () {
            if (!Sortable._guide.tools && Sortable._guide.style.width != '1px') {
                $(Sortable._guide).setStyle({
                    width: '1px',
                    height: '0px'
                });
            }
        },
        onUpdate: function () {
            updateOrders();
        }
    });
}

function getUserEmail() {
    if (Utils.user.email) {
        return Utils.user.email;
    }
    var emailFound = false;
    $A(form.getProperty('emails')).each(function getEmailsLoop(email) {
        if (Utils.checkEmailFormat(email.from)) {
            emailFound = Utils.checkEmailFormat(email.from)[0];
            throw $break;
        }
        if (Utils.checkEmailFormat(email.to)) {
            emailFound = Utils.checkEmailFormat(email.to)[0];
            throw $break;
        }
    });
    return emailFound;
}

function updateEmails() {
    if (form.getProperty('defaultEmailAssigned') != "Yes" && Utils.user.email && (!form.getProperty('emails') || form.getProperty('emails').length < 1)) {
        var defEmail = {
            type: "notification",
            name: 'Notification',
            from: 'default',
            to: Utils.user.email,
            subject: "New submission: {form_title}".locale(),
            html: true,
            body: Utils.defaultEmail()
        };
        form.setProperty('emails', [defEmail]);
        form.setProperty('defaultEmailAssigned', 'Yes');
    }
    var emails = form.getProperty('emails');
    $A(emails).each(function updateEmailsLoop(email) {
        if (!email.dirty && email.type == 'notification') {
            email.body = Utils.defaultEmail(email.type, !email.html);
        }
    });
}

function quickLogin(email, callback) {
    Utils.prompt("Hey! It seems that you already have an account with this email address. Login now and we will move these forms to your account.".locale() + "<br><br><b>" + "Enter your password to login:".locale() + "</b>", "", "We seem to know you!".locale(), function (password, c, button, passWin) {
        if (button) {
            if (!password) {
                passWin.inputBox.addClassName('error');
                return false;
            }
            passWin.inputBox.removeClassName('error');
            Utils.Request({
                parameters: {
                    action: 'login',
                    username: email,
                    password: password
                },
                onComplete: function (res) {
                    try {
                        if (res.success) {
                            $('myaccount').update(res.accountBox);
                            Utils.user = res.user;
                            Utils.user.usage = res.usage;
                            Locale.changeHTMLStrings();
                            callback(true);
                            passWin.close();
                        } else {
                            if (!passWin.inputBox.hasClassName('error')) {
                                passWin.inputBox.addClassName('error');
                                if (!passWin.inputBox.nextSibling) {
                                    passWin.inputBox.insert({
                                        after: new Element('span').insert(res.error.locale()).setStyle('font-size:9px; color:red;')
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
            return false;
        } else {
            callback(false);
            return true;
        }
        return false;
    }, {
        okText: 'Login Now'.locale(),
        cancelText: 'Login Later'.locale(),
        fieldType: 'password',
        width: 400
    });
}

function publishWizard() {
    save(function () {
        Utils.loadScript('/sistema/javascripts/builder/publish_wizard.js', function () {
            PublishWizard.openWizard();
        });
    });
}

function finishWizard(type) {
//alert(3)
    save(function () {
        var content = '<div style="text-align:center" id="complete-page">';
        content += '<h2>Your form is almost ready!</h2>';
        content += '<button class="big-button" id="open-emails"><img src="/sistema/images/notification.png" /><br>Setup Email Notifications</button>';
        content += '<button class="big-button" id="open-thankyou"><img src="/sistema/images/toolbar/thank_page.png" /><br>Setup Thank You Page</button>';
        content += '<button class="big-button" id="open-source"><img src="/sistema/images/toolbar/code.png" /><br>Add It To Your Site</button>';
        content += '<br>';
        content += '<button class="big-button" id="open-submission"><img src="/sistema/images/toolbar/myforms/submissions.png" /><br>See Your Submissions</button>';
        content += '<button class="big-button" id="open-reports"><img src="/sistema/images/toolbar/myforms/reports.png" /><br>Create & Share Reports</button>';
        content += '</div>';
        document.window({
            title: 'Finish Building Your Form',
            content: content,
            width: 500,
            height: 270,
            buttonsAlign: 'center',
            onInsert: function (w) {
                $('open-emails').observe('click', function () {
                    w.close();
                    makeTabOpen('form-setup-legend');
                    setTimeout(function () {
                        $('emailButton').click();
                    }, 500);
                });
                $('open-thankyou').observe('click', function () {
                    w.close();
                    setTimeout(function () {
                        $('thanksButton').click();
                    }, 500);
                });
                $('open-source').observe('click', function () {
                    w.close();
                    setTimeout(function () {
                        $('sourceButton').click();
                    }, 500);
                });
                $('open-submission').observe('click', function () {
                    w.close();
                    setTimeout(function () {
                        location.href = "submissions/" + formID;
                    }, 500);
                });
                $('open-reports').observe('click', function () {
                    w.close();
                    setTimeout(function () {
                        location.href = "myforms/#reports-" + formID;
                    }, 500);
                });
            },
            buttons: [{
                title: 'Close',
                handler: function (w) {
                    w.close();
                }
            }]
        });
    });
}

function save(callback, auto) {
	
//alert(document.getElementById('list').innerHTML)
//alert(auto + ''+form.getProperty('emailAsked'))
    if (saving) {
       // return;
    }
 

   // saving = true;
//     if (!auto && !getUserEmail() && form.getProperty('emailAsked') != 'Yes') {
// 
//         Utils.prompt("<div style='line-height:11px;'><img src='/sistema/images/notification.png' align='left' style='margin:5px 10px 0px 0px' /><br/>" + "To receive responses for this form, enter your e-mail address:".locale() + "</div>", "Enter your email here!".locale(), "Receive Form Responses by Email".locale(), function (email, a, b, win) {
// 		
//             if (email) {
//                 if (!Utils.checkEmailFormat(email)) {
//                     if (!win.inputBox.hasClassName('error')) {
//                         win.inputBox.addClassName('error');
//                         win.inputBox.insert({
//                             after: new Element('span').insert('Please enter a valid address'.locale()).setStyle('font-size:9px; color:red;')
//                         });
//                     }
//                     return false;
//                 }
//                 var emails = form.getProperty('emails');
//                 if (emails[0]) {
//                     emails[0].to = email;
//                     emails[1].from = email;
//                 }
//                 Utils.user.email = email;
//                 Utils.Request({
//                     parameters: {
//                         action: 'setGuestEmail',
//                         email: email
//                     },
//                     onComplete: function (res) {
//                         if (res.success) {
//                             if (res.hasAccount) {
//                                 quickLogin(email, function (loggedin) {
//                                     form.setProperty('emailAsked', 'Yes');
//                                     saving = false;
//                                     save(callback);
//                                 });
//                             } else {
//                                 form.setProperty('emailAsked', 'Yes');
//                                 saving = false;
//                                 save(callback);
//                             }
//                         } else {
//                             Utils.alert(res.error, 'Error!!');
//                         }
//                     }
//                 });
//             } else {
//                 form.setProperty('emailAsked', 'Yes');
//                 saving = false;
//                 save(callback);
//             }
//         }, {
//             okText: 'Save E-mail Address'.locale(),
//             cancelText: 'Do not send notifications'.locale(),
//             width: 450
//         });
//         saving = false;
//         return false;
//     }
    if (auto && $$('.form-line, .form-input-wide').length < 1) {
        saving = false;
        return;
    }
   // updateEmails();

    if ($('save_button_text').saved && callback && formID) {
		/*Added by neelesh alert(1+callBack)*/
        try {
            callback();
        } catch (e) {
            console.error(e);
        }
        saving = false;
        return;
    }

    if (!form.getProperty('slug') && formID) {
        form.setProperty('slug', formID);
    }
//alert(document.getElementById('list').innerHTML);
    var prop = getAllProperties();
//	prop .= document.getElementById('list').innerHTML;
//alert(BuildSource )
    BuildSource.init(prop);
//alert((prop))
	//alert(formID)
    $('saveIcon').src = '/sistema/images/loader-big.gif';
    $('saveIcon').removeClassName('toolbar-save');
	// $('').send();

if(!this.HTTP_URL)
	{
		
		this.HTTP_URL =  'http://'+ window.location.host+'/';
	}
    Utils.Request({
        method: 'post',
        parameters: {
            action:  CUSTOM_URL+'/builder/save_form',
            formID: formID,
//             source: BuildSource.getCode({
//                 type: 'css',
//                 config: false,
//                 pagecode: true
//             }),
            properties: Object.toJSON(prop)
        },
        onComplete: function (res) {
		
            changeFlag = false;
            $('saveIcon').src = '/sistema/images/blank.gif';
            $('saveIcon').className = 'toolbar-save';
            if (!res.success) {
                Utils.alert(res.message, "Error on save".locale(),'Error'.locale());
                return;
            }
			/*Added by neelesh*/
            //formID = res.id;
			//alert(formID)
            form.setProperty('id', formID);
            $('saveButton').shift({
                opacity: 0.5,
                duration: 0.5
            });
            $('save_button_text').innerHTML = "Saved".locale();
            $('save_button_text').saved = true;
            if (callback) {
                try {
                    callback(res);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
    saving = true;
}

function openInTab(url) {

    Utils.redirect(url , {
        target: '_blank'
    });
}
function checkValdationForLabel()
{
	var flag = true;
	$$('#list li').each(function(container){
									 
		if(typeof container != undefined && container.type!="control_button")							 
		{
			var ne = getQuestionSelectedInputWithId(container.id.toString().replace("id_",""))
			if(ne.getProperty('text').toString().length<1)
			{	
				flag = false				
				Utils.alert("Field label can not be empty",'Error'.locale(),function(){
					selected.removeClassName('question-selected');
					selected.picked = false;
					selected.delButton.hide();
					selected.fire('on:unselect');
					selected.select('.add-button').invoke('hide');
				
					//container.setStyle('border:solid 1px red')	
					//container.addClassName('question-selected')	
					
					
					container.removeClassName('question-over');
					container.addClassName('question-selected');
					container.delButton.show();
					container.select('.add-button').invoke('setStyle', 'display:block');
					selected = container;
					container.picked = true;	
					makeToolbar(ne, container);															
				})
				
				return false		
					
			}
			
		}
	})
	/*var container = $('id_2');
	var ne = $$('#id_2 div.question-input').first();	
	ne.setStyle('border:solid 1px green')
	alert(ne)*/

	return flag 
	
}
function customeValidationOnForm(){
		
	if(!checkValdationForLabel())
		return false
	if($('send_confirmation_mail').checked)
	{
		
		if (!parseInt($('send_to').value) ||$('mail_reply_to').value.length<1 || $('stage').getProperty('replyToEmailId').length<1 || $('stage').getProperty('emailText').length <1 || (!$('email_textarea_id').checked && !$('email_url_id').checked))
		{
			Utils.alert('Please fill all values for send confirmation email option'.locale(),'Error'.locale());	
			return false	
		}

		if(Utils.checkEmailFormat($('mail_reply_to').value.toString()) == null)	
			{
				Utils.alert('Please fill all valid email address'.locale(),'Error'.locale());	
				return false	
			}
	}
	return true
}
function sourceOptions(type) {
	CommonClass.setAsynchronousLoadingIndicator();
	
	if($('title-hint_text').value.replace(Locale.trimRexp, '').length<1)
		{
			unselectField();
			Utils.alert('Please enter form name'.locale(),'Error'.locale());	
			
			return false
		}
	 if(parseInt($$('#list li').length)<1)
		{
			Utils.alert('Please select at least one question'.locale(),'Error'.locale());	
			return false
		}
	if($('stage').getProperty('scheduledPublication'))	
	{
		if($('start_date').value.length <1 || $('end_date').value.length <1)	
			{
				Utils.alert('Please select at Start and End date for Form publication'.locale(),'Error on Page');	
				return false
			}
		
	}
	if(!customeValidationOnForm())
	{
		return false;
	}
	{	
	
		
	//alert($('related_database').disabled)
	new Ajax.Request(CUSTOM_URL+'/builder/is_formname_unique', {
                parameters: {                  
                    formName: $('title-hint_text').value,
					idEditMode:EDIT_MODE,
					database_id: isChildForm ? $('related_database').value :  "0",
					form_id :formID
                },
                evalJSON: 'force',
				asynchronous:true,
                onComplete: function (t) {
					
					if(t.responseJSON.success)	
					{
						
						if (t.responseJSON.redirect!== undefined && t.responseJSON.redirect)
						{
							window.onbeforeunload =''
							window.location.href = "buildders/"+t.responseJSON.form_id+"/edit"
							
						}
						else				
						{
							Utils.alert(t.responseJSON.message,'Error'.locale());
							
						}
							
						if (t.responseJSON.saveButton)
						{
							$('title-hint_text').value =''
							$('title-hint_text').setAttribute('style','border:solid 1px red')
							CommonClass.removeAsynchronousLoadingIndicator()
							unselectField();
						
						}else{
								
							
						}
						return;
					}
					$('title-hint_text').setAttribute('style','border:null');
					$('title-hint_text').disabled = "disabled"
					if (type == "preview") {
						$('preview-close').onclick();
					}
					if (type === "share") {
						return save(function () {
							Utils.loadScript('/sistema/javascripts/builder/share_wizard2.js', function (a) {
								new ShareWizard(a);
							}, {
								type: type
							});
						});
						} else {
						
						return save(function () {
						
							Utils.loadScript('/sistema/javascripts/builder/share_wizard.js', function (a) {
								shareWizard(a);
							}, type == "code");
						});
					}
				
				}.bind(this)
            });
		
	}
}
function formPreviewOnWindow() { 

if ($$('#stage li').length < 1) {
           Utils.alert("Please add a question to preview your form".locale(),'Error'.locale());
          return;
    }
	var prop = getAllProperties();
	BuildSource.init(prop);
	
	var theameName = objectCollection.theme[$('stage').getProperty('theme')];
	 	//	alert(objectCollection.theme[3])
	new Ajax.Request(CUSTOM_URL+'/builder/preview_form', {
			parameters: {
				formID:	$('formId').value,
				data :	BuildSource.getCode({type: "css",nosubmit:true,theme:theameName,noTryBlock:true})
			},
			evalJSON: 'force',
			onComplete: function (t) {				
				t = t.responseJSON || t;	
			
				if (t.success) {
					var tmpUrl = FULL_URL + "/builder/render_preview_form/"+$('formId').value
					openInTab(tmpUrl)
				}
			}
		});
}

function preview(button) {
alert("No implementation definde.")
return;
    save(function () {
        if (!formID && $$('#stage li').length < 1) {
            Utils.alert("Please add a question to preview your form.",'Error'.locale());
            return;
        }
        var formBackground = form.getProperty('background');
        if (!formBackground) {
            formBackground = 'white';
        }
        var formWidth = (Number(form.getProperty('formWidth')) + 31);
        var formHeight = $('stage').getHeight();
        var preview = new Element('div');
        preview.insert('<h3 style="margin-bottom:2px;display:block;max-width:200px">' + 'Preview'.locale() + '</h3><label>' + 'Form URL'.locale() + '</label><input onfocus="this.select()" onclick="this.select()" size="40" readonly=' + '"readonly" style="margin-bottom:5px;margin-right:5px;" type="text" value="' + Utils.HTTP_URL + 'form/' + formID + '" />');
        preview.insert('<button class="big-button buttons" style="margin-left:0px;margin-right:5px;" onclick="openInTab()">' + 'Open in new tab'.locale() + '</button>');
        preview.insert('<button class="big-button buttons" style="" onclick="sourceOptions(\'preview\')">' + 'Form Source'.locale() + '</button>');
        var iframe = new Element('iframe', {
            name: 'preview_frame',
            id: 'preview_frame',
            src: 'form/' + formID + '?prev',
            allowtransparency: true,
            frameborder: 0
        }).setStyle({
            border: '1px solid #aaa',
            width: formWidth + 'px',
            height: '500px',
            background: formBackground
        });
        preview.insert(iframe);
        Utils.lightWindow({
            content: preview,
            width: formWidth,
            height: formHeight,
            onReCenter: function (height, width) {
                iframe.setStyle({
                    height: height - 90 + 'px'
                });
            },
            onClose: function () {
                var frame = window.frames.preview_frame;
                try {
                    if (frame && frame.document) {
                        frame.document.close();
                    }
                } catch (e) {}
            }
        });
    });
}

function convertSavedToProp_old(arr) {
    pt.start("Convert Properties");
    var prop = {};
    var ps, id, pname, pvalue, key, type;
    for (var k in arr) {
        ps = k.split("_");
        id = ps[0];
        pname = ps[1];
        pvalue = arr[k];
        key = "id_" + id;
        type = arr[id + "_type"];
        if (id == "form") {
            if (!formProps) {
                formProps = Utils.deepClone(default_properties.form);
            }
            if (!(pname in formProps)) {
                formProps[pname] = {
                    hidden: true,
                    value: pvalue
                };
                continue;
            } else {
                formProps[pname].value = pvalue;
                continue;
            }
        } else {
            if (!(key in prop)) {
                prop[key] = Utils.deepClone(default_properties[type]);
            }
            if (!prop[key]) {
                continue;
            }
            if (!(pname in prop[key])) {
                prop[key][pname] = {
                    hidden: true,
                    value: pvalue
                };
                continue;
            } else {
                prop[key][pname].value = pvalue;
                continue;
            }
        }
    }
    pt.end("Convert Properties");
    return prop;
}

function buildQuestions(config) {
	
    pt.start('Build Questions');
    $H(config).each(function buildQuestionsLoop(pair) {
												
        var li = getElement('li');		
        li.className = 'drags';
		
        li.writeAttribute('type', pair.value ? pair.value.type.value : "");
        $('list').appendChild(li);
		
        createDivLine(li, pair.value);
    });
	
    createList();
	
    pt.end('Build Questions');
	
}

function undo() {
    if (undoStack.length === 0) {
        return;
    }
    if (undoStack.length == 1) {
        $('stage').disableButton('undo');
        $('undoButton').disable();
        $('undoicon').src = '/sistema/images/blank.gif';
        $('undoicon').className = 'toolbar-undo_disabled';
    }
    var undoInfo = undoStack.pop();
    var undo_val = BuildSource.convertSavedToProp(undoInfo.undo);
    redoStack.push({
        log: 'Redo',
        undo: getAllProperties()
    });
    $('stage').enableButton('redo');
    $('redoButton').enable();
    $('redoicon').src = '/sistema/images/blank.gif';
    $('redoicon').className = 'toolbar-redo';
    $('log').setText(undoInfo.log);
    $("list").innerHTML = "";
    applyFormProperties(undo_val);
}

function redo() {
    if (redoStack.length === 0) {
        return;
    }
    if (redoStack.length == 1) {
        $('stage').disableButton('redo');
        $('redoButton').disable();
        $('redoicon').src = '/sistema/images/blank.gif';
        $('redoicon').className = 'toolbar-redo_disabled';
    }
    var redoInfo = redoStack.pop();
    var redo_val = BuildSource.convertSavedToProp(redoInfo.undo);
    undoStack.push({
        log: 'Undo',
        undo: getAllProperties()
    });
    $('stage').enableButton('undo');
    $('undoButton').enable();
    $('undoicon').src = '/sistema/images/blank.gif';
    $('undoicon').className = 'toolbar-undo';
    $('log').setText(redoInfo.log);
    $("list").innerHTML = "";
    applyFormProperties(redo_val);
}

function formProperties() {
	
    makeToolbar(form, false);
    if (selected && selected.parentNode) {
        selected.removeClassName('question-selected');
        selected.picked = false;
        selected.select('.add-button').invoke('hide');
        selected.delButton.hide();
        selected = false;
    }
}

function setForm() {
	
    form = $('stage');
    var p = formProps || Utils.deepClone(default_properties.form);
    form.store('properties', p);
	
    $('form-title').innerHTML = p.title.value;
	//$('title-hint_text').value = p.title.value;
    form.getProperty = function (key) {
        try {
            var pr = form.retrieve("properties");
            if (pr[key] && typeof pr[key].value == "string") {
                var unit = pr[key].unit || "";
                if (unit) {
                    return parseInt(pr[key].value, 10);
                }
                return pr[key].value;
            }
            return pr[key] ? pr[key].value : false;
        } catch (e) {
            return false;
        }
    };
    form.setProperty = function (key, value) {
		//alert(key)
        if (key == 'injectCSS') {
            value = value.stripTags();
        }
        var pr = form.retrieve("properties");
        if (!(key in pr)) {
            pr[key] = {
                value: "",
                hidden: true
            };
        }
        var unit = pr[key].unit || "";
        if (typeof value == "string") {
            if (unit) {
                pr[key].value = parseInt(value, 10) + unit;
            }
            pr[key].value = value;
        } else {
            pr[key].value = value;
        }
        if (key == 'visibility' && value == 'Hidden') {
            pr.status.value = 'Open';
        }
        BuildSource.config['form_' + key] = value;
        form.store("properties", pr);
        return value;
    };
}
var justSelectedATheme = false;

function applyFormProperties(prop, noBuild) {

    if (!noBuild) {
        if (!prop) {
            prop = BuildSource.convertSavedToProp(getAllProperties());
        }
        $("list").innerHTML = "";
        buildQuestions(prop);
    }
    var props = form.retrieve('properties');
    $('form-title').innerHTML = props.title.value;
	//$('title-hint_text').value= props.title.value;
    var family = (props.font.value.match(/\s/g)) ? '"' + props.font.value + '"' : props.font.value;
    var list = $('list');
    var main = $('stage');
    if (props.styles.value != lastStyle) {
        $('formcss').href = Utils.HTTP_URL + "css/styles/" + props.styles.value + ".css?" + Utils.session;
        lastStyle = props.styles.value;
        list.removeAttribute('style');
        Utils.cssloaded = false;
        Utils.tryCSSLoad(function () {
            setTimeout(function () {
                Utils.updateBuildMenusize();
            }, 200);
            var s = Utils.getStyleBySelector('.form-all');
            if (s && justSelectedATheme) {
                form.setProperty('font', s.fontFamily.replace(/\"/g, ""));
                form.setProperty('fontsize', s.fontSize);
                form.setProperty('fontcolor', s.color);
                form.setProperty('background', s.background);
                main.setStyle({
                    background: s.background
                });
                justSelectedATheme = false;
            }
        });
        list.setStyle({
            fontSize: parseInt(props.fontsize.value, 10) + "px",
            width: parseInt(props.formWidth.value, 10) + 'px'
        });
    } else {
        list.setStyle({
            fontFamily: family,
            fontSize: parseInt(props.fontsize.value, 10) + "px",
            color: props.fontcolor.value,
            background: props.background.value,
            width: parseInt(props.formWidth.value, 10) + 'px'
        });
    }
    var lc = form.getProperty('lineSpacing');
    var lc_margin, lc_padding;
    if (lc < 4) {
        lc_margin = 0;
        lc_padding = lc;
    } else {
        lc_margin = Math.floor((lc - 2) / 2);
        lc_padding = lc - lc_margin;
    }
    Utils.createCSS(".form-line", 'padding-top: ' + lc + 'px !important;' + 'padding-bottom: ' + lc + 'px !important;');
    $$('style[id*=stage]').invoke('remove');
    if (props.injectCSS.value) {
        var cssArr = Utils.getCSSArray(props.injectCSS.value);
        $H(cssArr).each(function (pair) {
            Utils.createCSS("#stage " + pair.key, pair.value);
        });
    }
    if (props.background.value) {
        main.setStyle({
            background: props.background.value
        });
    }
}

function toggleSetupMenu(button) {
    if ($('group-setup').style.display == "none") {
        if (selected) {
            selected.run(selectEvent);
        }
        if (Object.isElement(button)) {
            button.addClassName('button-over');
        }
        $('group-setup').show();
    } else {
        if (Object.isElement(button)) {
            button.removeClassName('button-over');
        }
        $('group-setup').hide();
    }
}
function setControlTooltips() {
    $$('#accordion .drags').each(function tooltipsLoop(el) {
        if (el.tooltipset) {
            return;
        }
        var type = el.readAttribute('type');
        var tooltip = Object.extend({
            image: type + '.png',
            title: el.select('span')[0] ? el.select('span')[0].innerHTML : 'Not Found'
        }, control_tooltips[type]);
        el.tooltipset = true;
        buttonToolTips(el, {
            offsetTop: 10,
            trigger: el.select('.info')[0],
            message: '<div class="control-tooltip-text">' + tooltip.tip + '</div><div style="margin-top:4px;">' + 'Example'.locale() + ':<br><img class="tooltip-preview" src="' + Utils.HTTP_URL + '/sistema/images/tool_previews/' + tooltip.image + '?2" /></div>',
            arrowPosition: 'top',
            width: 210,
            title: tooltip.title
        });
    });
}
function setControlTooltipsMine() {
    $$('#accordion a').each(function tooltipsLoop(el) {
        if (el.tooltipset) {
            return;
        }
        var type = el.readAttribute('type');
        var tooltip = Object.extend({
            image: type + '.png',
            title: el.select('span')[0] ? el.select('span')[0].innerHTML : 'Not Found'
        }, control_tooltips[type]);
        el.tooltipset = true;
        buttonToolTips(el, {
            offsetTop: 10,
            trigger: el.select('.info')[0],
            message: '<div class="control-tooltip-text">' + tooltip.tip + '</div><div style="margin-top:4px;">' + 'Example'.locale() + ':<br><img class="tooltip-preview" src="' + Utils.HTTP_URL + '/sistema/images/tool_previews/' + tooltip.image + '?2" /></div>',
            arrowPosition: 'top',
            width: 210,
            title: tooltip.title
        });
    });
}
var loadTimer = false;
if(Protoplus.getIEVersion()<1)
loadTimer = setTimeout(function () {
	
	if($('load-bar'))							 
    ($('load-bar') && $('load-bar').update("OK. This is taking a while. Please hang on!".locale()));
    loadTimer = setTimeout(function () {
        ($('load-bar') && $('load-bar').update("Wow! This must be a huge form. We are almost there.".locale()));
        loadTimer = setTimeout(function () {
            ($('load-bar') && $('load-bar').update("Ok! I give up. I wasn't able to load this form. Please try it later.".locale()));
        }, 30000);
    }, 10000);
}, 5000);
else
{
	$('load-bar').update('We are still having some compatibility problems with Internet Explorer. At this moment we highly recomend the use of Google Chrome.'.locale())
	makeAllFierldsDisabled()
}
	
function makeAllFierldsDisabled()
{

	$('floating').disable();
	$('sourceButton').setAttribute('onclick','')
	$('sourceButton').observe('click',function(){
			Utils.alert('We are still having some compatibility problems with Internet Explorer. At this moment we highly recomend the use of Google Chrome.'.locale(),'Error'.locale());										  
		})
}
/*Added by manish*/
if($('load-bar'))	
($('load-bar') && $('load-bar').show());
/*Starting point*/
function initiate() {
    if (!navigator.cookieEnabled) {
        Utils.alert('In order to use Ng Form Builder, you must enable <b>cookies</b> otherwise your work cannot be saved and you will lose all your changes.'.locale() + '</br>' + '<a target="_blank" href="http://www.google.com/support/websearch/bin/answer.py?hl=en&answer=35851"> ' + 'For more information.'.locale() + '</a>','Error'.locale());
    }
    try {
        pt.start('Initialize');
    	//  alert(savedform)
	   BuildSource.init(savedform);
	   
	   
        if (formID) {
            $('form-setup-legend').run('click');
        }
        pt.start('Form Show');
		
        var convertedProp = BuildSource.convertSavedToProp(savedform);
        setForm();
		
        applyFormProperties(convertedProp);
       // clearTimeout(loadTimer);
		
        makeToolbar(form);
        pt.end('Form Show');
        $$('.tools').each(function toolsLoop(toolbox) {
										 
			 toolboxContents[toolbox.id] = toolbox.innerHTML;
        });
		
        initialForm = {
            log: "Initial form",
            undo: savedform
        };
		
        setTimeout(function () {
            createControls();			
			setClicks();
			/*$('toolbox').innerHTML= $('toolbox').innerHTML+('<li class="drags" type="control_fileupload">										<img alt="" src="/sistema/images/blank.gif" class="controls-upload" align="left">	<span>												File Upload	</span>	<img class="info  toolbar-info_grey" src="/sistema/images/blank.gif" alt="" title=""										align="right">		</li>')*/
            $('undoButton').disable();
            $('undoicon').src = '/sistema/images/blank.gif';
            $('undoicon').className = 'toolbar-undo_disabled';
            $('redoButton').disable();
            $('redoicon').src = '/sistema/images/blank.gif';
            $('redoicon').className = 'toolbar-redo_disabled';
			/*Added by neelesh for sliding up/down in form geration popup*/
           /* Utils.setAccordion($('accordion'), {
                openIndex: 0
            });*/
            //Utils.setToolbarFloat();
            //Utils.setToolboxFloat();
            Utils.fullScreenListener();
		
            $('group-form', 'group-setup', 'accordion').invoke('cleanWhitespace');
            $$('.big-button').invoke('cleanWhitespace');
				/*Added by manish . Context menu for form builder*/
           /* Protoplus.ui.setContextMenu('stage', {
                title: 'Form Actions'.locale(),
                onOpen: function () {
                    if (noAutoSave) {
                        $('stage').getButton('easave').show();
                        $('stage').getButton('dasave').hide();
                    } else {
                        $('stage').getButton('easave').hide();
                        $('stage').getButton('dasave').show();
                    }
                },
                menuItems: [{
                    title: 'Save'.locale(),
                    icon: '/sistema/images/blank.gif',
                    iconClassName: "context-menu-disk",
                    name: 'save',
                    handler: function () {
                        save();
                    }
                },
                {
                    title: 'Enable Auto Save'.locale(),
                    icon: '/sistema/images/context-menu/auto-on.png',
                    name: 'easave',
                    hiden: true,
                    handler: function () {
                        document.eraseCookie('no-auto-save');
                        noAutoSave = false;
                    }
                },
                {
                    title: 'Disable Auto Save'.locale(),
                    icon: '/sistema/images/context-menu/auto-off.png',
                    name: 'dasave',
                    handler: function () {
                        noAutoSave = true;
                        document.createCookie('no-auto-save', 'yes');
                    }
                },
                {
                    title: 'Preview'.locale(),
                    name: 'preview',
                    icon: '/sistema/images/blank.gif',
                    iconClassName: 'context-menu-preview',
                    handler: function () {
                        preview();
                    }
                },
                {
                    title: 'Show Transparency'.locale(),
                    name: 'transback',
                    icon: '/sistema/images/blank.gif',
                    iconClassName: 'context-menu-transparent',
                    handler: function () {
                        if ($('stage').hasClassName('trans-back')) {
                            $('stage').removeClassName('trans-back');
                            this.changeButtonText('transback', 'Show Transparency'.locale());
                        } else {
                            $('stage').addClassName('trans-back');
                            this.changeButtonText('transback', 'Hide Transparency'.locale());
                        }
                    }
                }, '-',
                {
                    title: 'Undo'.locale(),
                    name: 'undo',
                    icon: '/sistema/images/blank.gif',
                    iconClassName: 'context-menu-undo',
                    disabled: true,
                    handler: function () {
                        undo();
                    }
                },
                {
                    title: 'Redo'.locale(),
                    name: 'redo',
                    icon: '/sistema/images/blank.gif',
                    iconClassName: 'context-menu-redo',
                    disabled: true,
                    handler: function () {
                        redo();
                    }
                }, '-',
                {
                    title: 'Setup E-mails'.locale(),
                    name: 'emails',
                    iconClassName: "context-menu-emails",
                    icon: '/sistema/images/blank.gif',
                    handler: function () {
                        emailList($('emailButton'));
                    }
                },
                {
                    title: 'Embed Form'.locale(),
                    name: 'share',
                    icon: '/sistema/images/blank.gif',
                    iconClassName: 'context-menu-share',
                    handler: function () {
                        save(function () {
                            sourceOptions('share');
                        });
                    }
                }]
            });*/
			
			
	
            $('title-hint').onclick = function () {
				//alert(111)
                //$('title-hint').hide();
                //$('form-title').run('click');
            };
            pt.end('Initialize');
            if (document.readCookie('no-auto-save') == 'yes') {
                noAutoSave = true;
            }
            setInterval(function () {
                if (noAutoSave == true) {
                    return true;
                }
                if (!$('save_button_text').saved) {/*
                    save(function () {
                        $('save_button_text').update('Auto Saved'.locale());
                        $('save_button_text').saved = true;
                    }, true);
                */}
            }, 60000);
            $('stage', 'list').invoke('observe', 'click', function (e) {
                if (e.target.id != 'stage' && e.target.id != 'list') {
                    return;
                }
                unselectField();
            });
            if (document.readCookie('formIDRenewed')) {
                document.eraseCookie('formIDRenewed');
                Utils.alert("Your form ID is successfully renewed. Please open Share Wizard again to update your form source and for your new Form URL",'Error'.locale());
            }
            setControlTooltips();
			//setControlTooltipsMine();
            var tempButtons = [{
                button: $('emailButton'),
                message: 'Send notification and confirmation emails on submissions'.locale()
            },
            {
                button: $('thanksButton'),
                message: 'Redirect user to a page after submission'.locale()
            },
            {
                button: $('sourceButton'),
                message: 'Add form to your website or send to others'.locale()
            },
            {
                button: $('propButton'),
                message: 'Update Form Settings'.locale()
            },
            {
                button: $('condButton'),
                message: 'Setup Conditional Fields'.locale()
            }];
            for (var i = 0, l = tempButtons.length; i < l; i++) {
                var pair = tempButtons[i];
                buttonToolTips(pair.button, {
                    message: pair.message,
                    arrowPosition: 'top',
                    offset: 10
                });
            }
			/*Added by manish*/
			/*Event.observe('title-hint_text', 'change', function(){
																			  
				
			},this);*/
			Event.observe('list', 'click', function(){
																  
				//alert(111)
			});

		},
		
		
		0);
    } catch (e) {
        $(document.body).insert(new Element('div', {
            id: 'error-div'
        }));
        console.error(e);
    }
}
function onMyTextKeypress() {
			
			alert(121)
			}
			
function displayQuestionInfo() {
    var qs = getUsableElements();
    table = '<table width="100%" class="prop-table" cellspacing="0" cellpadding="4">';
    qs.each(function (q) {
        table += ('<tr><td class="prop-table-label">' + q.getProperty('text') + '</td><td class="prop-table-value">{' + q.getProperty('name') + '}</td></tr>');
    });
    table += '</table>';
    document.window({
        title: 'Question Names',
        content: table,
        modal: false,
        buttonsAlign: 'center',
        buttons: [{
            title: 'Close',
            handler: function (w) {
                w.close()
            }
        }]
    })
}

if(Protoplus.getIEVersion()>0)
	{
		Utils.alert('We are still having some compatibility problems with Internet Explorer. At this moment we highly recomend the use of Google Chrome.'.locale(),'Error'.locale());		
			
	}
else	
	document.ready(initiate);
	
Feedback = {
    formWindow: false,
    iframeEl: false,
    openFeedbackForm: function () {
        if (Feedback.formWindow) {
            Feedback.formWindow.close();
            return;
        }
        if (!Feedback.iframeEl) {
            Feedback.iframeEl = new Element('iframe', {
                src: (Utils.HTTP_URL || "") + "form/1062041021&prev",
                allowTransparency: 'true',
                frameborder: '0'
            }).setStyle({
                width: '100%',
                height: '100%',
                border: 'none'
            });
        }
        this.formWindow = document.window({
            title: "Post Feedback".locale(),
            width: "415px",
            height: Prototype.Browser.IE ? "510px" : "490px",
            content: Feedback.iframeEl,
            contentPadding: 0,
            onClose: function () {
                Feedback.formWindow = false;
            }
        })
    },
    init: function () {
		
   document.observe('dom:loaded', function () {
//		$('tabbed_box_1').childElements().first().hide()

		//	$('loading-indicator').show()		
			
			Feedback.customFunctions();		
            Element.observe('feedback-tab-link', 'click', function () {
                Feedback.openFeedbackForm();
            });
            $('feedback-tab').show();
        });
    },
	heighlightFormPropertyTabs:function(){
		//$('input_submit')
		$$('.row-1').each(function(e){
			e.observe('mouseover', function (ele) {
				/*Defined in prop_custom.js*/											 
				setHeightLighted(1)									 
			},this);	
			e.observe('mouseout', function (ele) {
				/*Defined in prop_custom.js*/											 
				removeHeightLighted()									 
			},this);
										   
		})
		$$('.row-2').each(function(e){
			e.observe('mouseover', function (ele) {
				/*Defined in prop_custom.js*/											 
				setHeightLighted(2)									 
			},this);	
			e.observe('mouseout', function (ele) {
				/*Defined in prop_custom.js*/											 
				removeHeightLighted()									 
			},this);
										   
		})
		$$('.row-3').each(function(e){
			e.observe('mouseover', function (ele) {
				/*Defined in prop_custom.js*/											 
				setHeightLighted(3)									 
			},this);	
			e.observe('mouseout', function (ele) {
				/*Defined in prop_custom.js*/											 
				removeHeightLighted()									 
			},this);
										   
		})
		$$('.row-4').each(function(e){
											
			e.observe('mouseover', function (ele) {
				/*Defined in prop_custom.js*/											 
				setHeightLighted(4)									 
			},this);	
			e.observe('mouseout', function (ele) {
				/*Defined in prop_custom.js*/											 
				removeHeightLighted()									 
			},this);
										   
		})
													 
	},
	setSelectedTheame:function(selectedId){
		
		$$('#form_style_tab li').each(function(e){
				if(selectedId != e.id)
				{
					e.removeClassName('theane-selected')	
					
				}
				
			},this)
		
			var selectedThemeLiTagId = selectedId.toString().replace("theme_li_","");					
			//objectCollection.selctedTheme = selectedThemeLiTagId;
			//alert(objectCollection)

			updateValue('theme', selectedThemeLiTagId, '', $('stage'), $('stage').getProperty('theme')); 			
			$(selectedId).addClassName('theane-selected')
			
		},
	customFunctions:function(){
	//	alert(objectCollection.theme[3])
		var head_prop = Utils.deepClone(default_properties['control_head']).text


		/*Write your custom code for execution after dom load*/
		var formDefaultProp = $('stage').retrieve('properties');

		this.heighlightFormPropertyTabs();
		
		$('view_field_link').observe('click', function (e) {
			viewFieldsList()			
			$('related_database').observe('change', function (e) {
				viewFieldsList()												
			},this)
		},this)
		
		this.formSettings();
		//$$('.tip').tooltip();
		customeToolTip('tip')
		$('related_database').observe('change', function (e) {
			if(this.value != "" && parseInt(this.value)>0)
				{
					
					$('view_field_link').show('block')
				}
			else
				{
					$('view_field_link').hide()
					
				}
		},this)
		//$('input_submit').value=(Utils.deepClone(default_properties.control_button.text.value))
		$('input_submit').observe('keyup', function (e) {
		id='list'
			
			//return
		var firstElement = Form.getElements($(id)).find(function(element) {
			return element.type != 'hidden' && !element.disabled &&
			element.hasClassName('form-submit-button')
			});
		
			if(typeof(firstElement)!='undefined')
			{
				
				if(firstElement.hasClassName('form-submit-button'))
				{
					//alert(this.value + firstElement.id)
					firstElement.setText(this.value);
					
					updateValue('text', this.value, firstElement.up(), $('stage'), '');
					
				}
			}
			
		});
		$(document.body).select('input.datepicker').each( function(e) {
															   
											//					   alert(Control.DatePicker.i18n.baseLocales.us.dateFormat)
			var obj = new Control.DatePicker(e, { 'icon': '/sistema/images/builder/calendar.png','dateFormat':'dd/MM/yyyy' }); 
			
			
		} ); 
		$(document.body).select('input.timepicker').each( function(e) {
			new Control.DatePicker(e, {  datePicker: false, timePicker: true}); 

		} );

		
		$('form_alignment').observe('change',function(e){
				setFormAllignment(this)						 
			},this)
		$('language_list').observe('change',function(e){
				setFormLanguage(this)
		},this)
		$('title-hint_text').observe('keyup',function(e){
				setFormName(this)
		},this)
		
		$('captcha_list').observe('change',function(e){
				setCaptcha(this)
		},this)
		
		
		$('scheduled_form_chk').observe('click', function (e) {
			
			var selected = this.checked;

			if(selected)
			{
				
				updateValue('scheduledPublication', true, '', $('stage'), '');
				jQuery("#publication_row").show("slow");

			}
			else{
				updateValue('scheduledPublication', false, '', $('stage'), '');
				jQuery("#publication_row").hide("slow");
			}	
		},this);

		
		
		$('allow_ip').observe('click', function (e) {
			var old =$('stage').getProperty('isAllowEntryForOneIp');	
			
		   if($('allow_ip').checked)
		   	{
				updateValue('isAllowEntryForOneIp', true, '', $('stage'), old);				
			}
			else
			{
				updateValue('isAllowEntryForOneIp', false, '', $('stage'), old);				
			}
		});
		/*For theme selected*/
		Feedback.setSelectedTheame("theme_li_"+$('stage').getProperty('theme'))
		
		$$('#form_style_tab li').each(function(e){
				$(e).observe('click', function (ele) {
					Feedback.setSelectedTheame(this.id)
				},this)												 
		},this)
		
	/*	createDivLine($('id_1'))		
		createList();*/
			if(EDIT_MODE)
			{

				if($('stage').getProperty('activeRedirect')=="thanktext")
				{
					$('submit_message_id').checked="checked"
					$('show_textarea').value = $('stage').getProperty('thanktext');
					jQuery("#show_textarea").show("slow");
					jQuery("#show_url").hide("slow");
				//	$('show_textarea').
				}
				
				if($('stage').getProperty('activeRedirect')=="thankurl")
				{
					
					$('show_url_id').checked="checked"
					$('show_url').value = $('stage').getProperty('thanktext')
					jQuery("#show_textarea").hide("slow");
					jQuery("#show_url").show("slow");
				}
				if($('stage').getProperty('scheduledPublication'))
				{
					
					$('scheduled_form_chk').checked="checked"
					$('start_date').value = $('stage').getProperty('scheduledPublicationStart')
					$('start_time').value = $('stage').getProperty('scheduledPublicationStartTime')
					$('end_date').value = $('stage').getProperty('scheduledPublicationEnd')
					$('end_time').value = $('stage').getProperty('scheduledPublicationEndTime')
					
					$('start_ampm').value = $('stage').getProperty('scheduledPublicationStartAmPm')
					$('end_ampm').value = $('stage').getProperty('scheduledPublicationEndAmPm')
					jQuery("#publication_row").show("slow");
					
					
				}

				if($('stage').getProperty('isSendConfirmationMail'))
				{
					
					$('send_confirmation_mail').checked="checked"					
					$('mail_reply_to').value = $('stage').getProperty('replyToEmailId')
					addEmailToSendConfirmation()
					
					if($('stage').getProperty('emailMsgType')=="text")
						{
							
							$('email_textarea_id').checked="checked"
							radioSelectionConfirmationMail("email_textarea")
							$('show_textarea_email').value = $('stage').getProperty('emailText')
							
						}
					else
						{
							$('email_url_id').checked="checked"
							radioSelectionConfirmationMail("email_url")
							$('show_url_email').value = $('stage').getProperty('emailText')		
							
						}
						
					
					jQuery("#confirmation_row").show("slow");
					
					
				}
				
				//show_url_id
				if($('stage').getProperty('maxEntries'))
				{
					
					$('max_entries').value=$('stage').getProperty('maxEntries')
				}
				
				$('captcha_list').value = parseInt($('stage').getProperty('captcha'));
				
				
			}
			
		$('send_confirmation_mail').observe('click',function(e) {
								//	alert(this.id)		   
			var selected = jQuery(this).is(':checked');
			 
			updateValue('isSendConfirmationMail', selected, '', $('stage'), '');
			if(selected)
			{
				jQuery("#confirmation_row").show("slow");
				Feedback.getEmailFields();
			}
			else{
				jQuery("#confirmation_row").hide("slow");
			}	
			
    	},this);

			

	floatingMenu.add('floating',  
         {  
             // Represents distance from top or  
             // bottom browser window border  
             // depending upon property used.  
             // Only one should be specified.  
            targetTop: 10	,					
				
             // prohibits movement on x-axis  
             prohibitXMovement: true,  
   
             // Remove this one if you don't  
             // want snap effect  
             snap: true  
         });
	
		
		
	},
	getEmailFields:function()
	{
		/*Defined in prop_custome.js*/
		addEmailToSendConfirmation();
	},
	formSettings:function()
	{
		if(EDIT_MODE)
			$('view_field_link').show('block')
			
	},
	saveForm:function()
	{
		
		$('sourceButton').observe('click', function (e) {
		   alert('Not implemented... :(');return
		});
		
	}
};
Feedback.init();

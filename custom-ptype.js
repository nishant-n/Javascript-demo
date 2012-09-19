var BuildSource = {
	editMode:true,
    type: null,
    config: null,
    isSecure: false,
    pagecode: null,
    qscript: null,
    baseURL: null,
    options: null,
    config: null,
    standAlone: !('$' in window),
    HTTP_URL: null,
    SSL_URL: null,
    username: null,
    debug: false,
    formID: null,
    VERSION: '3.1.96',
    init: function (config) {
		
		this.editMode = config.form_editmode;
        this.config = config;
        this.formID = config.form_id;

        if (!this.standAlone) {
            this.config.form_height = $('stage').getHeight();
            this.HTTP_URL = Utils.HTTP_URL;
            this.SSL_URL = Utils.SSL_URL;
            this.username = Utils.user.username;
            this.debug = document.debug;
            this.debugOptions = document.debugOptions || {};
            this.isSecure = Utils.isSecure;
        } else {
            this.HTTP_URL = V8Config.HTTP_URL;
            this.SSL_URL = V8Config.SSL_URL;
            this.debug = DEBUGMODE;
            this.debugOptions = {
                compressForm: true
            };
            this.isSecure = /^\bhttps\b\:\/\//.test(V8Config.HTTP_URL);
        }
		
    },
    toJSON: function (obj) {
        if (this.standAlone) {
            return JSON.stringify(obj);
        }
        return Object.toJSON(obj);
    },
    stripslashes: function (str) {
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
    fbcode: false,
    getFaceBookCode: function () {
        if (this.standAlone) {
            return "";
        } else {
            if (this.fbcode) {
                return this.fbcode;
            }
            var code = "";
            Utils.Request({
                server: 'js/widgets/facebook.js',
                asynchronous: false,
                evalJSON: false,
                onComplete: function (t) {
                    code = t.message;
                }
            });
            this.fbcode = code;
            return code;
        }
    },
    cleanWordFormat: function (str) {
        str = str.replace(/\<\!--(\w|\W)+?--\>/gim, '');
        str = str.replace(/\<title\>(\w|\W)+?\<\/title\>/gim, '');
        str = str.replace(/\s?class=\w+/gim, '');
        str = str.replace(/<(meta|link|\/?o:|\/?style|\/?st\d|\/?head|\/?html|body|\/?body|!\[)[^>]*?>/gim, '');
        str = str.replace(/(<[^>]+>)+&nbsp;(<\/\w+>)/gim, '');
        str = str.replace(/\s+v:\w+=""[^""]+""/gim, '');
        str = str.replace(/"(\n\r){2,}/gim, '');
        str = str.replace("&ldquo;", "\"");
        str = str.replace("&rdquo;", "\"");
        str = str.replace("&mdash;", "–");
        str = str.replace(/<\?xml.* \/>/gim, '');
        return str;
    },
    capitalize: function (str) {
        return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    },
    fixNumbers: function (number) {
        if (typeof number == "string") {
            return number.replace(/\D/gim, '');
        }
        return number;
    },
    fixUTF: function (str) {
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
        str = str.toString();
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
    htmlDecode: function (string, quote_style) {
        var optTemp = 0,
            i = 0,
            noquotes = false;
        if (typeof quote_style === 'undefined') {
            quote_style = 2;
        }
        string = string.toString().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        var OPTS = {
            'ENT_NOQUOTES': 0,
            'ENT_HTML_QUOTE_SINGLE': 1,
            'ENT_HTML_QUOTE_DOUBLE': 2,
            'ENT_COMPAT': 2,
            'ENT_QUOTES': 3,
            'ENT_IGNORE': 4
        };
        if (quote_style === 0) {
            noquotes = true;
        }
        if (typeof quote_style !== 'number') {
            quote_style = [].concat(quote_style);
            for (i = 0; i < quote_style.length; i++) {
                if (OPTS[quote_style[i]] === 0) {
                    noquotes = true;
                } else if (OPTS[quote_style[i]]) {
                    optTemp = optTemp | OPTS[quote_style[i]];
                }
            }
            quote_style = optTemp;
        }
        if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
            string = string.replace(/&#0*39;/g, "'");
        }
        if (!noquotes) {
            string = string.replace(/&quot;/g, '"');
        }
        string = string.replace(/&amp;/g, '&');
        return string;
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
    },
    formatPrice: function (amount, curr, id, nofree) {
        if (!curr) {
            curr = 'USD';
        }
        id = id || "";
        if (parseFloat(amount) == 0 && nofree !== true) {
            return 'Free';
        }
        amount = this.numberFormat(amount, 2, '.', ',');
        switch (curr) {
        case "USD":
            return "$<span id=\"" + id + "\">" + amount + '</span> USD';
        case "EUR":
            return "&euro;<span id=\"" + id + "\">" + amount + '</span> EUR';
        case "GBP":
            return "&pound;<span id=\"" + id + "\">" + amount + '</span> GBP';
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
    isArray: function (obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    },
    deepClone: function (obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        var clone = this.isArray(obj) ? [] : {};
        for (var i in obj) {
            var node = obj[i];
            if (typeof node == 'object') {
                if (this.isArray(node)) {
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
    convertSavedToProp: function (arr) {
		
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
                if (!('formProps' in window) || !formProps) {
                    formProps = this.deepClone(default_properties.form);
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
						 
                    prop[key] = this.deepClone(default_properties[type]);
						 
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
		  
        return prop;
    },
    makeProductText: function (name, price, curr, duration, setupfee, trial) {
        var text = '';
        var fprice = '<b>' + this.formatPrice(price || 0, curr) + '</b>';
        var fsetupfee = '<b>' + this.formatPrice(Number(setupfee) || 0, curr) + '</b>';
        var setuptext = "";
        var trialText = setupfee > 0 ? fsetupfee : "Free";
        if (duration && trial && trial != 'None' && trial != 'Enabled') {
            if (trial == 'One Day') {
                text += trialText + " for the first day then, ";
            } else {
                text += trialText + ' for the first <u>' + (trial.toLowerCase()) + '</u> then, ';
            }
        }
        if (trial == 'Enabled') {
            fsetupfee = 'Free';
        }
        setuptext = fsetupfee + " for the <u>first payment</u> then, ";
        if (duration) {
            switch (duration) {
            case "Daily":
                setuptext = fsetupfee + " for the <u>first day</u> then, ";
                text += fprice + " for each <u>day</u>.";
                break;
            case "Weekly":
                setuptext = fsetupfee + " for the <u>first week</u> then, ";
                text += fprice + " for each <u>week</u>.";
                break;
            case "Bi-Weekly":
                text += fprice + " for each <u>two weeks</u>.";
                break;
            case "Monthly":
                setuptext = fsetupfee + " for the <u>first month</u> then, ";
                text += fprice + " for each <u>month</u>.";
                break;
            case "Bi-Monthly":
                text += fprice + " for each <u>two months</u>.";
                break;
            case "Quarterly":
                text += fprice + " for each <u>three months</u>.";
                break;
            case "Semi-Yearly":
                text += fprice + " for each <u>six months</u>.";
                break;
            case "Yearly":
                setuptext = fsetupfee + " for the <u>first year</u> then, ";
                text += fprice + " for each <u>year</u>.";
                break;
            case "Bi-Yearly":
                text += fprice + " for each <u>two years</u>.";
                break;
            default:
                setuptext = fsetupfee + " for the <u>first month</u> then, ";
                text += fprice + " for each <u>month</u>.";
            }
            if ((!trial || trial == 'None') && setupfee > 0 || trial == "Enabled") {
                text = setuptext + text;
            }
            text = '(' + text + ')';
        } else {
            text += fprice;
        }
        return (name || '') + ' <span class="form-product-details">' + text + "</span>";
    },
    getProperty: function (prop, id) {
		 
        id = id || 'form';
        return this.config[id + '_' + prop] || false;
    },
    hasUpload: function () {
        for (var key in this.config) {
			  
            var value = this.config[key];
            if (key.match(/_type/g) && value == 'control_fileupload') {
                return true;
            }
        }
        return false;
    },
    getCode: function (options) {
		
        BuildSource.options = {
            type: 'jsembed',
            isSSL: false
        };
        for (attrname in options) {
            BuildSource.options[attrname] = options[attrname];
        }
        BuildSource.qscript = "";
		
        BuildSource.baseURL = BuildSource.options.isSSL ? this.SSL_URL : this.HTTP_URL;
		
        switch (BuildSource.options.type) {
        case "iframe":
        case "blogger":
            return BuildSource.createIFrame();
        case "url":
            return BuildSource.createURL();
        case "secureUrl":
            return BuildSource.createSecureURL();
        case "shortUrl":
        case "twitter":
            return BuildSource.createShortURL();
        case "customUrl":
            return BuildSource.createCustomURL();
        case "jsembed":
        case "default":
        case "wordpress":
        case "typePad":
        case "typepad":
        case "liveJournal":
        case "livejournal":
        case "vox":
        case "tumblr":
        case "yola":
        case "webs":
        case "geocities":
        case "drupal":
        case "joomla":
        case "joomla2":
        case "memberkit":
        case "designerPro":
        case "xara":
        case "webDesigner":
		
            return BuildSource.createJSEmbed();
        case "css":
        case "source":
        case "dreamweaver":
        case "dreamWeaver":
        case "frontPage":
        case "frontpage":
        case "iweb":
        case "iWeb":
        case "expression":
        case "expressionWeb":
			//return BuildSource.createIFrame();           
			return BuildSource.createFullCode();
        case "facebook":
            return BuildSource.createFacebookCode(true);
        case "pdfCode":
            return BuildSource.createPdfCode();
        case "zip":
            BuildSource.baseURL = "";
            return BuildSource.createZipURL();
        case "lightbox":
            return BuildSource.createLightBoxCode();
        case "lightbox2":
            return BuildSource.createLightBoxCode(true);
        case "popupBox":
        case "popup":
            return BuildSource.createPopupBoxCode();
        case "googleSites":
        case "googlesites":
            return "http://hosting.gmodules.com/ig/gadgets/file/102235888454881850738/ngforms.xml";
        case "feedbackBox":
            return BuildSource.createFeedbackCode();
        case "feedback2":
            return BuildSource.createFeedbackCode(true);
        case "email":
            return "Hi,<br/>Please click on the link below to complete this form.<br/><a href=\"" + BuildSource.baseURL + "forms/" + form.getProperty('id') + "\">" + BuildSource.baseURL + "form/" + form.getProperty('id') + "</a><br/><br/>Thank you!";
        default:
            return "Not Implemented yet";
        }
    },
    createFeedbackCode: function (isNew) {
        if (typeof isNew !== "undefined") {
            return "<script src=\"" + BuildSource.baseURL + "min/g=feedback\" type=\"text/javascript\">\n" + "new NgFormsFeedback({\n" + "formId: \"" + this.getProperty("id") + "\",\n" + "buttonText: \"" + this.getProperty("feedbackButtonText") + "\",\n" + "base: \"" + BuildSource.baseURL + "\",\n" + "background:'" + this.getProperty("feedbackBackgroundColor") + "',\n" + "fontColor:'" + this.getProperty("feedbackFontColor") + "',\n" + "buttonSide: \"" + this.getProperty("feedbackButtonSide") + "\",\n" + "buttonAlign: \"" + this.getProperty("feedbackButtonAlign") + "\",\n" + "type:" + this.getProperty("feedbackStyle") + ",\n" + "width: " + this.getProperty("feedbackWidth") + "," + "height: " + this.getProperty("feedbackHeight") + "});\n</script>";
        } else {
            return "<script src=\"" + BuildSource.baseURL + "min/g=orangebox\" type=\"text/javascript\"></script>\n" + "<div id=\"feedback-tab\" style=\"display:none\">" + "<button boxwidth=\"100\" class=\"orangebox\" id=\"feedback-tab-link\" formID=\"" + this.getProperty('id') + "\" base=\"" + this.HTTP_URL + "\" height=\"500\" width=\"700\" title=\"" + this.getProperty('feedbackButtonLabel') + "\">" + this.getProperty('feedbackButtonLabel') + "</button></div>";
        }
    },
    createPopupBoxCode: function () {
        return "<a href=\"javascript:void( window.open('" + BuildSource.baseURL + "form/" + this.getProperty('id') + "', 'blank','scrollbars=yes,toolbar=no,width=700,height=500'))\">" + this.getProperty('title') + "</a>";
    },
    createLightBoxCode: function (isNew) {
        var code = "";
        if (typeof isNew !== "undefined") {
            code = "<" + "script src=\"" + BuildSource.baseURL.sanitize() + "min/g=feedback\" type=\"text/javascript\">\n" + "new NgFormsFeedback({\n" + "formId:'" + this.getProperty('id') + "',\n" + "base:'" + this.HTTP_URL.sanitize() + "',\n" + "windowTitle:'" + this.getProperty("lightboxTitle").sanitize() + "',\n" + "background:'" + this.getProperty("lightboxBackgroundColor") + "',\n" + "fontColor:'" + this.getProperty("lightboxFontColor") + "',\n" + "type:" + this.getProperty("lightboxStyle") + ",\n" + "height:" + this.getProperty("lightboxHeight") + ",\n" + "width:" + this.getProperty("lightboxWidth") + "\n" + "});\n" + "<" + "/script>\n" + "<a id=\"lightbox-" + this.getProperty('id') + "\" style=\"cursor:pointer;color:blue;text-decoration:underline;\">" + this.getProperty('title') + "</a>";
        } else {
            code = "<" + "script src=\"" + BuildSource.baseURL + "min/g=orangebox\" type=\"text/javascript\"><" + "/script>\n" + "<a class=\"orangebox\" formID=\"" + this.getProperty('id') + "\" base=\"" + this.HTTP_URL + "\" height=\"500\" " + "width=\"700\" title=\"" + this.getProperty('title') + "\" style=\"color:blue;text-decoration:underline;\">" + this.getProperty('title') + "</a>";
        }
        return code;
    },
    createZipURL: function () {
        var $this = this;
        Utils.Request({
            parameters: {
                action: 'getFormSourceZip',
                id: $this.getProperty('id'),
                source: BuildSource.createFullCode('zip')
            },
            onSuccess: function (res) {
                location.href = res.zipURL;
            },
            onFail: function (res) {
                Utils.alert("Cannot create zip file.", "Error");
            }
        });
    },
    createIFrame: function () {
		var addHeight = 0;
		if(parseInt($('stage').getProperty('captcha'))>0)
		{
				if ($('stage').getProperty('alignment') == "Top")
					addHeight  = 30
				else if	($('stage').getProperty('alignment') == "Left")
					addHeight  = 60
			}
			
		var html=''
		html+='\n<div>'		
        html+='\n\t<' + 'iframe allowtransparency="true" height="'+(parseInt($('list').getHeight())+parseInt(60)+addHeight)+'" src="' + BuildSource.baseURL + 'builder/rander_form/' + this.getProperty('id') + '" frameborder="0" style="width:100%; overflow:visible; border:none;" scrolling="yes">\n' + '<' + '/iframe>';
		html+='\n</div>'
		return html;
		
    },
    createURL: function () {
        return BuildSource.baseURL + 'builder/rander_form/' + this.getProperty('id');
    },
    createSecureURL: function () {
        return this.SSL_URL + 'form/' + this.getProperty('id');
    },
    createShortURL: function () {
        if (this.getProperty('hash')) {
            return "http://jotfor.ms/" + this.getProperty('hash');
        }
        return "";
    },
    createCustomURL: function () {
        var slugName = "Title_Me";
        if (this.getProperty('slug') && this.getProperty('slug') != this.getProperty('id')) {
            slugName = this.getProperty('slug');
        }
        return (BuildSource.baseURL + this.username + "/" + slugName).replace(/\s+/gim, "_");
    },
    createJSEmbed: function () {
        return "<" + "script src=\"" + BuildSource.baseURL + "forms/" + this.getProperty('id') + ".html\"><" + "/script>";
    },
    createFullCode: function createCSS(mode) {
		 
		 
        this.isZip = mode == "zip";
        var source = this.createHTMLCode();
		
		  if(BuildSource.options.noTryBlock === undefined)
			source +="\n\n<script>try {if(parent.document.firstChild) {}}catch(e){document.getElementById('embedded-form-style').className='no-form-border';document.getElementById('bottom-img').style.display='none'}</script>"
			
        var mobile = '<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;" />\n';
        mobile += '<meta name="HandheldFriendly" content="true" />\n';
        var style = this.createCSSCode();
        var script = this.createJSCode();
        var page = "";
        page += '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n';
        page += '<html><head>\n';
        page += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n';
        page += mobile;
        page += '<title>Form</title>\n';
        page += style;
        page += script;
        page += '</head>\n';
        page += '<body>\n';
        page += source;
        page += '</body>\n';
        page += '</html>';
        if (this.isZip || this.options.pagecode) {
            this.isZip = false;
            return page;
        }
        this.isZip = false;
        source = script + style + source;
        return source;
    },
    createFacebookCode: function () {
        var style = this.createCSSCode(true);
        var source = this.createHTMLCode(true);
        var fullSource = style + source;
        return fullSource;
    },
    createPdfCode: function () {
        var page = '';
        page += '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n';
        page += '<html><head>\n';
        page += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n';
        page += '<title>Form</title>\n';
        page += '<body>\n';
        page += BuildSource.createFacebookCode();
        page += '</body>\n</html>';
        return page;
    },
    createJSCode: function () {
        var script = "";
        var debug = "";
		var qString = rand(1000,9999);
		
        if (this.isZip || (this.debug && this.debugOptions.compressForm)) {
            script = '<' + 'script src="' + BuildSource.baseURL + 'js/prototype.js?v=' + this.VERSION + '" type="text/javascript"><' + '/script>\n' + '<' + 'script src="' + BuildSource.baseURL + 'js/protoplus.js?v=' + this.VERSION + '" type="text/javascript"><' + '/script>\n' + '<' + 'script src="' + BuildSource.baseURL + 'js/protoplus-ui.js?v=' + this.VERSION + '" type="text/javascript"><' + '/script>\n' + '<' + 'script src="' + BuildSource.baseURL + 'js/ngforms.js?v=' + this.VERSION + '" type="text/javascript"><' + '/script>\n' + '<' + 'script src="' + BuildSource.baseURL + 'js/calendarview.js?v=' + this.VERSION + '" type="text/javascript"><' + '/script>\n';
            if (this.debug) {
                debug = '\n   NgForms.debug = true;';
            }
        } else {
			script = '<' + 'script src="' + BuildSource.baseURL + 'sistema/javascripts/builder/date.format.js?' + qString+ '" type="text/javascript"><' + '/script>\n';			script += '<' + 'script src="' + BuildSource.baseURL + 'sistema/javascripts/builder/masks.js' +  '" type="text/javascript"><' + '/script>\n';
			 	script += '<' + 'script src="' + BuildSource.baseURL + 'sistema/javascripts/builder/live-locale.js?' +  qString+'" type="text/javascript"><' + '/script>\n';
            script += '<' + 'script src="' + BuildSource.baseURL + 'sistema/javascripts/builder/live-ngforms.js?' +qString+  '" type="text/javascript"><' + '/script>\n';
			
        }
        script += '<' + 'script type="text/javascript">';
        if (this.getProperty('highlightLine') && this.getProperty('highlightLine') == 'Disabled') {
            script += '\n   NgForms.highlightInputs = false;';
        }
        if (BuildSource.options.pagecode) {
            script += '<' + '? if(defined("JSFORM")){ ' + 'echo "var jsTime = setInterval(function(){try{";\n ' + 'echo "NgForms.jsForm = true;";\n' + '} ?>\n';
        }
        if (this.getProperty('conditions')) {
            var conds = this.deepClone(this.getProperty('conditions'));
            var newConds = [];
            for (var c = 0; c < conds.length; c++) {
                if (conds[c].type == 'page' || conds[c].type == 'field') {
                    newConds.push(conds[c]);
                }
            }
            if (newConds.length > 0) {
                script += '\n   NgForms.setConditions(' + this.toJSON(newConds) + ');';
            }
        }
        script += debug;
        if (BuildSource.qscript) {
			
            script += '\n   NgForms.init(function(){\n' + BuildSource.qscript + '  \n';
												  
			script +=	' NgForms.customLoadFunctions(); });\n';
        } else {
            script += '\n   NgForms.init();\n';
        }
        if (BuildSource.options.pagecode) {
            script += '<' + '? if(defined("JSFORM")){ ' + 'echo "clearInterval(jsTime);}catch(e){}}, 1000);"; ' + '} ?>\n';
        }
		
		script += '<' + '/script>\n';
        return script;
    },
    fixBackgroundURL: function (background) {
        if (background) {
            return background.replace(/url\("(\.\.\/)*images/, 'url("' + this.HTTP_URL + 'images');
        }
        return background;
    },
    hashGetFirst: function (hash) {
        for (var x in hash) {
            return hash[x];
        }
    },
    createCSSCode: function (forFacebook) {
        var formCustoms = "";
        var style = "";
        var font = this.getProperty('font') ? this.getProperty('font') : "default";
        var family = (font.match(/\s/g)) ? '"' + font + '"' : font;
        var styles = this.getProperty('styles');
        var labelWidth = parseInt(this.getProperty('labelWidth'), 10);
        var fullURL = (this.isZip) ? "" : this.baseURL;
        if (this.getProperty('background')) {
            formCustoms += '        background:' + this.fixBackgroundURL(this.getProperty('background')) + ';\n';
        }
        if (this.getProperty('fontcolor')) {
            formCustoms += '        color:' + this.getProperty('fontcolor') + ' !important;\n';
        }
        if (this.getProperty('font')) {
            formCustoms += '        font-family:' + family + ';\n';
        }
        if (this.getProperty('fontsize')) {
            formCustoms += '        font-size:' + parseInt(this.getProperty('fontsize'), 10) + 'px;\n';
        }
        if (forFacebook) {
            style += '<link type="text/css" rel="stylesheet" href="' + fullURL + 'formstyle/' + this.getProperty('id') + '.css?v=' + this.VERSION + '"/>\n';
        }
		var themeFolderName = "defaultTemplate"
		var qString = rand(100,9999);
		
		themeFolderName= objectCollection.theme[$('stage').getProperty('theme')];
		
		
		   style += '<link type="text/css" rel="stylesheet" href="' + fullURL + 'sistema/stylesheets/builder/live-common.css?' +qString+ '"/>\n';
			
        style += '<link type="text/css" rel="stylesheet" href="' + fullURL + 'sistema/stylesheets/builder/themes/'+themeFolderName+'/live.css?' + qString+ '"/>\n';
        if (styles && styles != 'form') {
            style += '<link type="text/css" rel="stylesheet" href="' + fullURL + 'sistema/css/styles/' + styles + '.css" />\n';
        }
        style += '<link href="' + fullURL + 'sistema/stylesheets/builder/themes/'+themeFolderName+'/calendar.css' + '" rel="stylesheet" type="text/css" />\n';
        var paddingTop = 20;
        var prop = this.convertSavedToProp(this.config);
        if (this.hashGetFirst(prop) && (this.hashGetFirst(prop).type.value == 'control_head' || this.hashGetFirst(prop).type.value == 'control_paragraph')) {
            paddingTop = 0;
        }
        if (!forFacebook) {
            style += '<style type="text/css">\n' + '    .form-label{\n' + '        width:' + labelWidth + 'px !important;\n' + '    }\n' + '    .form-label-left{\n' + '        width:' + labelWidth + 'px !important;\n' + '    }\n';
            if (this.getProperty('lineSpacing')) {
                style += '    .form-line{\n' + '        padding:' + parseInt(this.getProperty('lineSpacing'), 10) + 'px;\n' + '    }\n';
            }
            style += '    .form-label-right{\n' + '        width:' + labelWidth + 'px !important;\n' + '    }\n';
            if (BuildSource.options.pagecode) {
                style += '    body, html{\n' + '        margin:0;\n' + '        padding:0;\n' + '        background:' + this.fixBackgroundURL(this.getProperty('background')) + ';\n' + '    }\n' + '\n';
            }
            style += '    .form-all{\n';
            if (BuildSource.options.pagecode) {
                style += '        margin:0px auto;\n';
                style += '        padding-top:' + paddingTop + 'px;\n';
            }
			//alert(this.getProperty('formWidth'))
			//this.getProperty('formWidth') // Added by manish
            style += '        width:' + parseInt(650, 10) + 'px;\n' + formCustoms + '    }\n';
            if (this.getProperty('injectCSS')) {
                style += '    /* Injected CSS Code */\n';
                style += this.getProperty('injectCSS');
                style += '\n    /* Injected CSS Code */\n';
            }
			if(this.getProperty('alignment')=="Right")
			{
				style += '    .label-right{\n';
				
					style += '              border:solid 1px #F5F5F5;\n';
					style += '              width:30%;';
					style += '              \nfloat:left;';
					style += '              \ntext-align:right;';
					style += '              \nmargin-right: 6px;';
					
					
					
				style += '\n} ';
				}
            style += '</style>\n\n';
        }
        return style; 
    },
    needSecure: function () {
        return false;
    },
	/*func : For form html Generation*/
    createHTMLCode: function (forFacebook) {
		//alert(forFacebook)
		/*Added by manish*/
		
        var source = "";
        var hiddenFields = "";
        var multipart = "";
        if (this.hasUpload()) {
            multipart = 'enctype="multipart/form-data"';
        }
        var formID = this.getProperty('id') || "{formID}";
		
		
        if (forFacebook) {
            source += '<script type="text/javascript">\n' + this.getFaceBookCode() + '\n</script>';
        }
        var onFacebookSubmit = "";
        if (forFacebook) {
            onFacebookSubmit = ' onsubmit="return Facebook.checkForm();"';
        }
        var submitURL = this.HTTP_URL;
        if (this.needSecure()) {
            submitURL = this.SSL_URL;
        }
		var hiddenElements = ''
		if($('stage').getProperty('activeRedirect')=="thanktext")
		{
			hiddenElements += '<input type="hidden" name="submit_msg" value="' + $('stage').getProperty('thanktext')+ '">';
		}
		if($('stage').getProperty('activeRedirect')=="thankurl")
		{
			hiddenElements += '<input type="hidden" name="submit_url" value="' + $('stage').getProperty('thankurl')+ '">';
		}
		if($('stage').getProperty('emailText'))
		{
			hiddenElements += '<input type="hidden" name="mail_msg" value="' + $('stage').getProperty('emailText')+ '">';
		}
		if($('stage').getProperty('maxEntries'))
		{
			hiddenElements += '<input type="hidden" name="maxEntries" value="' + $('stage').getProperty('maxEntries')+ '">';
		}
		if($('stage').getProperty('isAllowEntryForOneIp'))
		{
			hiddenElements += '<input type="hidden" name="isAllowEntryForOneIp" value="' + $('stage').getProperty('isAllowEntryForOneIp')+ '">';
		}
		if($('stage').getProperty('scheduledPublication'))
		{
			hiddenElements += '<input type="hidden" name="scheduledPublication" value="' + $('stage').getProperty('scheduledPublication')+ '">';
			
			if($('stage').getProperty('scheduledPublicationStart'))
				hiddenElements += '<input type="hidden" name="scheduleStartDate" value="' + $('stage').getProperty('scheduledPublicationStart')+ '">';
			if($('stage').getProperty('scheduledPublicationEnd'))
				hiddenElements += '<input type="hidden" name="scheduleEndDate" value="' + $('stage').getProperty('scheduledPublicationEnd')+ '">';		
	
			if($('stage').getProperty('scheduledPublicationStart'))
				hiddenElements += '<input type="hidden" name="scheduledStartTime" value="' + $('stage').getProperty('scheduledPublicationStartTime')+ '">';
			if($('stage').getProperty('scheduledPublicationEndTime'))
				hiddenElements += '<input type="hidden" name="scheduledEndTime" value="' + $('stage').getProperty('scheduledPublicationEndTime')+ '">';
				
			if($('stage').getProperty('scheduledPublicationStartAmPm'))
				hiddenElements += '<input type="hidden" name="scheduledStartAmPm" value="' + $('stage').getProperty('scheduledPublicationStartAmPm')+ '">';
			if($('stage').getProperty('scheduledPublicationEndAmPm'))
				hiddenElements += '<input type="hidden" name="scheduledEndAmPm" value="' + $('stage').getProperty('scheduledPublicationEndAmPm')+ '">';
				
				
		}
		if($('send_confirmation_mail').checked)
		{
			if($('stage').getProperty('confirmationEmailId'))
				hiddenElements += '<input type="hidden" name="confirmationEmailId" value="' + $('stage').getProperty('confirmationEmailId')+ '">';
				
			if($('stage').getProperty('replyToEmailId'))
			
				hiddenElements += '<input type="hidden" name="replyToEmailId" value="' + $('stage').getProperty('replyToEmailId')+ '">';
			
		}
		var captchaHtml='';
		//alert($('stage').getProperty('captcha'))
		if(parseInt($('stage').getProperty('captcha'))){
			
			var cssCap = 'margin-left:198px'
			if($('stage').getProperty('alignment')=="Top")
				cssCap = 'margin-left:198px'
			if($('stage').getProperty('alignment')=="Right")
				cssCap = 'margin-left:198px'	;
			var qid = 'input_'+($$("#list li").length+1);			
			
           	captchaHtml = '<li class="form-line" id="li_input_captcha"><div style="'+cssCap+'" class="form-buttons-wrapper">'
			
			captchaHtml +='<div class="form-captcha">';
            captchaHtml += '<label for="captcha_label">';

            captchaHtml += '<img alt="Captcha - Reload if it\'s not displayed" id="image_captcha" class="form-captcha-image" style="background:url(' + this.HTTP_URL + 'sistema/images/loader-big.gif) no-repeat center;" src="' + this.HTTP_URL + '/sistema/images/blank.gif" width="150" height="41" />';
    
            captchaHtml += '</label>';
            captchaHtml += '<div style="" class="form-input"><input type="text" id="input_captcha" name="captcha" class ="validate[required]" style="width:130px;" autocomplete="off" />';
           
                captchaHtml += '<img src="' + this.HTTP_URL + 'sistema/images/builder/reload.png" alt="Reload" align="absmiddle" style="cursor:pointer" onclick="NgForms.reloadCaptcha(\'' + qid + '\',this );" />';
               
            
            captchaHtml += '<input type="hidden" name="captcha_id" id="' + qid + '_captcha_id" value="0">';
            captchaHtml += '</div>';
            captchaHtml += '</div>';
			captchaHtml += '</div></li>';
            
		}
	//alert(hiddenElements)
		var actionUrl = "submit"
		if(BuildSource.options.nosubmit !== undefined)
			actionUrl= "preview"
			
        source += '<form class="ngforms-form"' + onFacebookSubmit + ' action="' + submitURL + 'builder/'+actionUrl+'" method="post" ' + multipart + ' name="form_' + formID + '" id="' + formID + '" accept-charset="utf-8">';
        source += '<input type="hidden" name="formID" id="formID" value="' + formID + '" />';
		source += '<input type="hidden" name="captch_name" id="captch_name" value="' + $('captch_name').value + '" />';
		
		source +=hiddenElements;	
		
        var savedProp = this.convertSavedToProp(this.config);
		//alert(savedProp)
        if (forFacebook === true) {
            var reqhidden = '';
			
            for (var key in savedProp) {
                var prop = savedProp[key];
				
                var id = "input_" + key.replace('id_', '');
                if (prop.required && prop.required.value == "Yes") {
                    var etype = prop.type.value.split("_")[1];
                    if (!prop.text.nolabel) {
                        if (reqhidden == '') {
                            reqhidden += id + '*' + etype + '*' + this.stripslashes(prop.text.value);
                        } else {
                            reqhidden += ',' + id + '*' + etype + '*' + this.stripslashes(prop.text.value);
                        }
                    } else {
                        if (reqhidden == '') {
                            reqhidden += id + '*' + etype + '*' + etype;
                        } else {
                            reqhidden += ',' + id + '*' + etype + '*' + etype;
                        }
                    }
                }
            }
            source += '<input type="hidden" id="reqids" name="requireds" value="' + reqhidden + '">';
        }
        source += '<div class="form-all" >';
        source += '<ul class="form-section">';
		//alert(savedProp)
		var elementCounter=0;
		var someMoreValidaton ='NgForms.propValidation = {'
		BuildSource.qscript += " NgForms.isLoggedIn();\n";

        for (var key in savedProp) {
			elementCounter +=1;
            var prop = savedProp[key];
			//alert(prop.startRange)
            var id = key.replace('id_', '');
            var line_id = key;
            var input = this.createInputHTML(prop.type.value, id, prop, false, forFacebook);
            var html = input.html;
            var cname = 'form-input';
            var lcname = 'form-label';
            var tag_type = 'div';
            var hide = "";
			var inputEleId = 'input_'+id
			
			var validationProp = '"'+inputEleId+'":{';
			
            if (forFacebook != true && input.script) {
                BuildSource.qscript += input.script;
            }
			var isLoggedClass ='';
		//alert(prop)
			if(prop.islogged && prop.islogged.value == "Yes")
				{
						
						isLoggedClass =' is_logged';
						
					
				}
			
			if(prop.startRange && prop.endRange)
				{
					
					 if (prop.type.value=="control_datetime")					 
						if(prop.startRange.value && prop.endRange.value)
						{	
							var startDateTmp = (new Date(getStanderdDate(prop.startRange.value.toString(),"dd/mm/yyyy")).formatDateByMask("dd/mm/yyyy")).toString()
							var endDateTmp = (new Date(getStanderdDate(prop.endRange.value.toString(),"dd/mm/yyyy")).formatDateByMask("dd/mm/yyyy")).toString()
							
								validationProp	+='\n\t\t"range":{\n'+
									'\t\t\t\"start":"'+startDateTmp+'",'+
									'\n\t\t\t"end":"'+endDateTmp+'",'+
									'\n\t\t\t"type":"'+prop.type.value+'"'+
									'\t\t\n},\n';	
									
						}
					else
						if(prop.startRange.value && prop.endRange.value)
						{	
								validationProp	+='\n\t\t"range":{\n'+
								'\t\t\t\"start":"'+prop.startRange.value.toString()+'",'+
								'\n\t\t\t"end":"'+prop.endRange.value.toString()+'",'+
								'\n\t\t\t"type":"'+prop.type.value+'"'+
								'\t\t\n},\n';					
						}
				}
			
			
			if((prop.fieldMask && prop.fieldMask.value )|| (prop.decimalPosition && prop.currencyFormat))
				{
					
					var value =0;
					var decimalPosition=0;
					if(prop.fieldMask)	
						value = prop.fieldMask.value
					if(prop.decimalPosition && prop.decimalPosition.value.length>0 && parseInt(value) )	
						decimalPosition = parseInt(prop.decimalPosition.value)	


	//				alert(prop.text)

					if (value !=0)			
					{
					validationProp	+='\n\t\t"mask":{\n'+
									'\t\t\t\"value":'+value+','+
									'\n\t\t\t\"decimal":'+decimalPosition+','+
									'\n\t\t\t\"type":"'+prop.type.value+'"'+
									'\t\t \n}\n';	
									
								
					}
					
		//			alert(1)
				}
				
		/*	else if)
				{
					//alert("===:"+prop.text.value + prop.decimalPosition)	
					validationProp	+='\n\t\t"mask":{\n'+
									'\t\t\t\"value":0,'+
									'\n\t\t\t\"decimal":'+prop.decimalPosition.value+','+
									'\t\t \n}\n';	
					
					
				}*/
				validationProp	+='\t},\n';
			
			someMoreValidaton +=validationProp
			
			
			
            if (prop.type.value == "control_hidden" || input.hidden === true) {
                hiddenFields += html;
                continue;
            }
            if (prop.hasCondition && prop.hasCondition.value == "Yes") {
                hide = 'style="display:none;" ';
            }
			
            if (prop.type.value == "control_collapse" || prop.type.value == "control_pagebreak" || prop.type.value == "control_head") {
                if (prop.type.value == "control_collapse") {
                    source += '</ul><ul class="form-section' + ((prop.status && prop.status.value == 'Closed') ? '-closed' : '') + '" id="section_' + id + '">';
                }
                tag_type = 'li';
            } else {
                var shrink = ((prop.shrink && prop.shrink.value == 'Yes') ? ' form-line-column' : '');
                if (shrink && prop.newLine && prop.newLine.value == 'Yes') {
                    shrink += ' form-line-column-clear';
                }
                source += '<li class="form-line' + shrink + isLoggedClass+ '" ' + hide + 'id="' + line_id + '" >';
            }
			

            if (this.getProperty('alignment') == 'Top') {
                cname = 'form-input-wide';
                lcname = 'form-label-top';
            }else if(this.getProperty('alignment') == 'Right') 
				var lalignFlag = true;	

			else {
				var lalignFlag = false
                var lalign = 'left';
                if (this.getProperty('alignment')) {
                    lalign = this.getProperty('alignment');
                }
                cname = 'form-input';
                lcname = 'form-label-' + lalign.toLowerCase();
            }
            if (prop.labelAlign && prop.labelAlign.value != 'Auto') {
                if (prop.labelAlign.value == 'Top') {
                    cname = 'form-input-wide';
                    lcname = 'form-label-top';
                } else {
                    cname = 'form-input';
                    lcname = 'form-label-' + prop.labelAlign.value.toLowerCase();
                }
            }
            cname = (prop.text.nolabel) ? 'form-input-wide' : cname;
            var requiredStar = "";
            if (prop.required && prop.required.value == "Yes") {
                requiredStar = '<span class="form-required">*</span>';
                prop.text.value += requiredStar;
            }
			var labelHtml ='';
			var floatLeft =''
            if (!prop.text.nolabel) {
				if(lalignFlag)
				{
					labelHtml =  '<div class="label-right"><label class="' + lcname + '" id="label_' + id + '" for="input_' + id + '"> ' + this.stripslashes(prop.text.value) + ' </label></div>';		
					floatLeft ='style="float:left"';
				}
				else				
                	source += '<label class="' + lcname + '" id="label_' + id + '" for="input_' + id + '" '+floatLeft+'> ' + this.stripslashes(prop.text.value) + ' </label>';
            }
			
            source += '<' + tag_type + ' id="cid_' + id + '" class="' + cname + '"> ' + html + ' </' + tag_type + '>';
			source +=labelHtml ;
            if (!(prop.type.value == "control_collapse" || prop.type.value == "control_pagebreak" || prop.type.value == "control_head")) {
                source += '</li>';
            } else {
                if (prop.type.value == "control_pagebreak") {
                    source += '</ul><ul class="form-section">';
                }
            }
			
            if (prop.hint && prop.hint.value && (prop.hint.value != " ")) {
                BuildSource.qscript += "      $('input_" + prop.qid.value + "').hint('" + prop.hint.value.sanitize() + "');\n";
            }
				
            if (prop.description && prop.description.value  && (prop.type.value!= "control_head" && prop.type.value!= "control_paragraph")) {
                BuildSource.qscript += "      NgForms.description('input_" + prop.qid.value + "', '" + (this.stripslashes(prop.description.value).sanitize().nl2br()) + "');\n";
            }
				
			if (prop.maxsize && prop.maxsize.value  && ["control_email","control_textbox","control_number","control_textarea"].include(prop.type.value) ) {
                BuildSource.qscript += "      NgForms.counter('input_" + prop.qid.value + "', '" + (this.stripslashes(prop.maxsize.value).sanitize().nl2br()) + "');\n";
            }
			
			if($$("#list li").length-1==elementCounter)
			{
				source +=captchaHtml;			
				
				if(parseInt($('stage').getProperty('captcha')))	
				 {
					BuildSource.qscript += " NgForms.initCaptcha('input_captcha');\n";
				 	BuildSource.qscript += " NgForms.description('input_captcha', 'Please enter value given in image');\n";
				 }
				
			}
        }
		someMoreValidaton +='};'
		BuildSource.qscript +=someMoreValidaton;
        source += '<li style="display:none">Should be Empty: <input type="text" name="website" value="" /></li>';
		  
		  if(BuildSource.options.noTryBlock === undefined)
	        	source += '<li><div style="float: right; position: absolute; bottom: 5px; right: 27%;"><a href="http://www.ngprofessionals.com.br" target="_blank"><img alt="Logo" src="/sistema/images/builder/logo_formtemplate.jpg" style="border: 0px"></a></div></li></ul><img alt="" src="/sistema/images/bottom.png" id="bottom-img" ></div>';
			else
				source += '</ul></div>';		
				
        if (forFacebook != true) {
            source += '<input type="hidden" id="simple_spc" name="simple_spc" value="' + formID + '"/>';
            source += '<script type="text/javascript">document.getElementById("si"+"mple"+"_spc").value = "' + formID + '-' + formID + '";</script>';
        } else {
            source += '<input type="hidden" id="simple_spc" name="simple_spc" value="' + formID + '"/>';
            source += '<script>document.getElementById("si"+"mple"+"_spc").setValue("' + formID + '-' + formID + '");</script>';
        }
        source += hiddenFields;
		
        source += "</form>";
        source = BuildSource.styleHTML(source, 4, ' ', 1000);
        source = source.replace(/<textarea(.*?)>\n?\s+(.*?)\s+\n?<\/textarea>/gim, '<textarea$1>$2</textarea>');
        source = source.replace(/(<(option|label).*?\>)\n?\s+(.*?)\s+\n?(<\/\2\>)/gim, '$1 $3 $4');
        source = source.replace(/\s*\<span(.*?)\>\s*/gim, '<span$1>');
        source = source.replace(/\s*\<\/span\>/gim, '</span>');
        return source;
    },
	
    addValidation: function (name, prop, additional) {
        var val = [];
		
		
        if (prop.required && prop.required.value == "Yes") {
            val.push("required");
			//alert("neele"+val)
        }
        if (prop.validation && prop.validation.value != "None") {
            val.push(prop.validation.value);
        }
		if(prop.dulicate && prop.dulicate.value=="Yes")
		{
			val.push("dulicate");
		}
        if (additional) {
            val.push(additional);
        }
        if (val.length > 0) {
            name += " validate[" + val.join(", ") + "]";
        }
        return name;
    },
    jsBeautify: function (js_source_text, options) {
        var input, output, token_text, last_type, last_text, last_word, current_mode, modes, indent_string;
        var whitespace, wordchar, punct, parser_pos, line_starters, in_case;
        var prefix, token_type, do_block_just_closed, var_line, var_line_tainted, if_line_flag;
        var indent_level;
        options = options || {};
        var opt_indent_size = options.indent_size || 4;
        var opt_indent_char = options.indent_char || ' ';
        var opt_preserve_newlines = typeof options.preserve_newlines === 'undefined' ? true : options.preserve_newlines;
        var opt_indent_level = options.indent_level || 0;

        function trim_output() {
            while (output.length && (output[output.length - 1] === ' ' || output[output.length - 1] === indent_string)) {
                output.pop();
            }
        }
        function print_newline(ignore_repeated) {
            ignore_repeated = typeof ignore_repeated === 'undefined' ? true : ignore_repeated;
            if_line_flag = false;
            trim_output();
            if (!output.length) {
                return;
            }
            if (output[output.length - 1] !== "\n" || !ignore_repeated) {
                output.push("\n");
            }
            for (var i = 0; i < indent_level; i++) {
                output.push(indent_string);
            }
        }
        function print_space() {
            var last_output = ' ';
            if (output.length) {
                last_output = output[output.length - 1];
            }
            if (last_output !== ' ' && last_output !== '\n' && last_output !== indent_string) {
                output.push(' ');
            }
        }
        function print_token() {
            output.push(token_text);
        }
        function indent() {
            indent_level++;
        }
        function unindent() {
            if (indent_level) {
                indent_level--;
            }
        }
        function remove_indent() {
            if (output.length && output[output.length - 1] === indent_string) {
                output.pop();
            }
        }
        function set_mode(mode) {
            modes.push(current_mode);
            current_mode = mode;
        }
        function restore_mode() {
            do_block_just_closed = current_mode === 'DO_BLOCK';
            current_mode = modes.pop();
        }
        function in_array(what, arr) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === what) {
                    return true;
                }
            }
            return false;
        }
        function get_next_token() {
            var n_newlines = 0;
            if (parser_pos >= input.length) {
                return ['', 'TK_EOF'];
            }
            var c = input.charAt(parser_pos);
            parser_pos += 1;
            while (in_array(c, whitespace)) {
                if (parser_pos >= input.length) {
                    return ['', 'TK_EOF'];
                }
                if (c === "\n") {
                    n_newlines += 1;
                }
                c = input.charAt(parser_pos);
                parser_pos += 1;
            }
            var wanted_newline = false;
            if (opt_preserve_newlines) {
                if (n_newlines > 1) {
                    for (var i = 0; i < 2; i++) {
                        print_newline(i === 0);
                    }
                }
                wanted_newline = (n_newlines === 1);
            }
            if (in_array(c, wordchar)) {
                if (parser_pos < input.length) {
                    while (in_array(input.charAt(parser_pos), wordchar)) {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos === input.length) {
                            break;
                        }
                    }
                }
                if (parser_pos !== input.length && c.match(/^[0-9]+[Ee]$/) && (input.charAt(parser_pos) === '-' || input.charAt(parser_pos) === '+')) {
                    var sign = input.charAt(parser_pos);
                    parser_pos += 1;
                    var t = get_next_token(parser_pos);
                    c += sign + t[0];
                    return [c, 'TK_WORD'];
                }
                if (c === 'in') {
                    return [c, 'TK_OPERATOR'];
                }
                if (wanted_newline && last_type !== 'TK_OPERATOR' && !if_line_flag) {
                    print_newline();
                }
                return [c, 'TK_WORD'];
            }
            if (c === '(' || c === '[') {
                return [c, 'TK_START_EXPR'];
            }
            if (c === ')' || c === ']') {
                return [c, 'TK_END_EXPR'];
            }
            if (c === '{') {
                return [c, 'TK_START_BLOCK'];
            }
            if (c === '}') {
                return [c, 'TK_END_BLOCK'];
            }
            if (c === ';') {
                return [c, 'TK_SEMICOLON'];
            }
            if (c === '/') {
                var comment = '';
                if (input.charAt(parser_pos) === '*') {
                    parser_pos += 1;
                    if (parser_pos < input.length) {
                        while (!(input.charAt(parser_pos) === '*' && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === '/') && parser_pos < input.length) {
                            comment += input.charAt(parser_pos);
                            parser_pos += 1;
                            if (parser_pos >= input.length) {
                                break;
                            }
                        }
                    }
                    parser_pos += 2;
                    return ['/*' + comment + '*/', 'TK_BLOCK_COMMENT'];
                }
                if (input.charAt(parser_pos) === '/') {
                    comment = c;
                    while (input.charAt(parser_pos) !== "\x0d" && input.charAt(parser_pos) !== "\x0a") {
                        comment += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos >= input.length) {
                            break;
                        }
                    }
                    parser_pos += 1;
                    if (wanted_newline) {
                        print_newline();
                    }
                    return [comment, 'TK_COMMENT'];
                }
            }
            if (c === "'" || c === '"' || (c === '/' && ((last_type === 'TK_WORD' && last_text === 'return') || (last_type === 'TK_START_EXPR' || last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK' || last_type === 'TK_OPERATOR' || last_type === 'TK_EOF' || last_type === 'TK_SEMICOLON')))) {
                var sep = c;
                var esc = false;
                var resulting_string = '';
                if (parser_pos < input.length) {
                    while (esc || input.charAt(parser_pos) !== sep) {
                        resulting_string += input.charAt(parser_pos);
                        if (!esc) {
                            esc = input.charAt(parser_pos) === '\\';
                        } else {
                            esc = false;
                        }
                        parser_pos += 1;
                        if (parser_pos >= input.length) {
                            break;
                        }
                    }
                }
                parser_pos += 1;
                resulting_string = sep + resulting_string + sep;
                if (sep == '/') {
                    while (parser_pos < input.length && in_array(input.charAt(parser_pos), wordchar)) {
                        resulting_string += input.charAt(parser_pos);
                        parser_pos += 1;
                    }
                }
                return [resulting_string, 'TK_STRING'];
            }
            if (in_array(c, punct)) {
                while (parser_pos < input.length && in_array(c + input.charAt(parser_pos), punct)) {
                    c += input.charAt(parser_pos);
                    parser_pos += 1;
                    if (parser_pos >= input.length) {
                        break;
                    }
                }
                return [c, 'TK_OPERATOR'];
            }
            return [c, 'TK_UNKNOWN'];
        }
        indent_string = '';
        while (opt_indent_size--) {
            indent_string += opt_indent_char;
        }
        indent_level = opt_indent_level;
        input = js_source_text;
        last_word = '';
        last_type = 'TK_START_EXPR';
        last_text = '';
        output = [];
        do_block_just_closed = false;
        var_line = false;
        var_line_tainted = false;
        whitespace = "\n\r\t ".split('');
        wordchar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'.split('');
        punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! !! , : ? ^ ^= |= ::'.split(' ');
        line_starters = 'continue,try,throw,return,var,if,switch,case,default,for,while,break,function'.split(',');
        current_mode = 'BLOCK';
        modes = [current_mode];
        parser_pos = 0;
        in_case = false;
        while (true) {
            var t = get_next_token(parser_pos);
            token_text = t[0];
            token_type = t[1];
            if (token_type === 'TK_EOF') {
                break;
            }
            switch (token_type) {
            case 'TK_START_EXPR':
                var_line = false;
                set_mode('EXPRESSION');
                if (last_text === ';') {
                    print_newline();
                } else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR') {} else if (last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                    print_space();
                } else if (in_array(last_word, line_starters) && last_word !== 'function') {
                    print_space();
                }
                print_token();
                break;
            case 'TK_END_EXPR':
                print_token();
                restore_mode();
                break;
            case 'TK_START_BLOCK':
                if (last_word === 'do') {
                    set_mode('DO_BLOCK');
                } else {
                    set_mode('BLOCK');
                }
                if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                    if (last_type === 'TK_START_BLOCK') {
                        print_newline();
                    } else {
                        print_space();
                    }
                }
                print_token();
                indent();
                break;
            case 'TK_END_BLOCK':
                if (last_type === 'TK_START_BLOCK') {
                    trim_output();
                    unindent();
                } else {
                    unindent();
                    print_newline();
                }
                print_token();
                restore_mode();
                break;
            case 'TK_WORD':
                if (do_block_just_closed) {
                    print_space();
                    print_token();
                    print_space();
                    do_block_just_closed = false;
                    break;
                }
                if (token_text === 'case' || token_text === 'default') {
                    if (last_text === ':') {
                        remove_indent();
                    } else {
                        unindent();
                        print_newline();
                        indent();
                    }
                    print_token();
                    in_case = true;
                    break;
                }
                prefix = 'NONE';
                if (last_type === 'TK_END_BLOCK') {
                    if (!in_array(token_text.toLowerCase(), ['else', 'catch', 'finally'])) {
                        prefix = 'NEWLINE';
                    } else {
                        prefix = 'SPACE';
                        print_space();
                    }
                } else if (last_type === 'TK_SEMICOLON' && (current_mode === 'BLOCK' || current_mode === 'DO_BLOCK')) {
                    prefix = 'NEWLINE';
                } else if (last_type === 'TK_SEMICOLON' && current_mode === 'EXPRESSION') {
                    prefix = 'SPACE';
                } else if (last_type === 'TK_STRING') {
                    prefix = 'NEWLINE';
                } else if (last_type === 'TK_WORD') {
                    prefix = 'SPACE';
                } else if (last_type === 'TK_START_BLOCK') {
                    prefix = 'NEWLINE';
                } else if (last_type === 'TK_END_EXPR') {
                    print_space();
                    prefix = 'NEWLINE';
                }
                if (last_type !== 'TK_END_BLOCK' && in_array(token_text.toLowerCase(), ['else', 'catch', 'finally'])) {
                    print_newline();
                } else if (in_array(token_text, line_starters) || prefix === 'NEWLINE') {
                    if (last_text === 'else') {
                        print_space();
                    } else if ((last_type === 'TK_START_EXPR' || last_text === '=') && token_text === 'function') {} else if (last_type === 'TK_WORD' && (last_text === 'return' || last_text === 'throw')) {
                        print_space();
                    } else if (last_type !== 'TK_END_EXPR') {
                        if ((last_type !== 'TK_START_EXPR' || token_text !== 'var') && last_text !== ':') {
                            if (token_text === 'if' && last_type === 'TK_WORD' && last_word === 'else') {
                                print_space();
                            } else {
                                print_newline();
                            }
                        }
                    } else {
                        if (in_array(token_text, line_starters) && last_text !== ')') {
                            print_newline();
                        }
                    }
                } else if (prefix === 'SPACE') {
                    print_space();
                }
                print_token();
                last_word = token_text;
                if (token_text === 'var') {
                    var_line = true;
                    var_line_tainted = false;
                }
                if (token_text === 'if' || token_text === 'else') {
                    if_line_flag = true;
                }
                break;
            case 'TK_SEMICOLON':
                print_token();
                var_line = false;
                break;
            case 'TK_STRING':
                if (last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK' || last_type == 'TK_SEMICOLON') {
                    print_newline();
                } else if (last_type === 'TK_WORD') {
                    print_space();
                }
                print_token();
                break;
            case 'TK_OPERATOR':
                var start_delim = true;
                var end_delim = true;
                if (var_line && token_text !== ',') {
                    var_line_tainted = true;
                    if (token_text === ':') {
                        var_line = false;
                    }
                }
                if (var_line && token_text === ',' && current_mode === 'EXPRESSION') {
                    var_line_tainted = false;
                }
                if (token_text === ':' && in_case) {
                    print_token();
                    print_newline();
                    break;
                }
                if (token_text === '::') {
                    print_token();
                    break;
                }
                in_case = false;
                if (token_text === ',') {
                    if (var_line) {
                        if (var_line_tainted) {
                            print_token();
                            print_newline();
                            var_line_tainted = false;
                        } else {
                            print_token();
                            print_space();
                        }
                    } else if (last_type === 'TK_END_BLOCK') {
                        print_token();
                        print_newline();
                    } else {
                        if (current_mode === 'BLOCK') {
                            print_token();
                            print_newline();
                        } else {
                            print_token();
                            print_space();
                        }
                    }
                    break;
                } else if (token_text === '--' || token_text === '++') {
                    if (last_text === ';') {
                        start_delim = true;
                        end_delim = false;
                    } else {
                        start_delim = false;
                        end_delim = false;
                    }
                } else if (token_text === '!' && last_type === 'TK_START_EXPR') {
                    start_delim = false;
                    end_delim = false;
                } else if (last_type === 'TK_OPERATOR') {
                    start_delim = false;
                    end_delim = false;
                } else if (last_type === 'TK_END_EXPR') {
                    start_delim = true;
                    end_delim = true;
                } else if (token_text === '.') {
                    start_delim = false;
                    end_delim = false;
                } else if (token_text === ':') {
                    if (last_text.match(/^\d+$/)) {
                        start_delim = true;
                    } else {
                        start_delim = false;
                    }
                }
                if (start_delim) {
                    print_space();
                }
                print_token();
                if (end_delim) {
                    print_space();
                }
                break;
            case 'TK_BLOCK_COMMENT':
                print_newline();
                print_token();
                print_newline();
                break;
            case 'TK_COMMENT':
                print_space();
                print_token();
                print_newline();
                break;
            case 'TK_UNKNOWN':
                print_token();
                break;
            }
            last_type = token_type;
            last_text = token_text;
        }
        return output.join('');
    },
    styleHTML: function (html_source, indent_size, indent_character, max_char) {
        var multi_parser;

        function Parser() {
            this.pos = 0;
            this.token = '';
            this.current_mode = 'CONTENT';
            this.tags = {
                parent: 'parent1',
                parentcount: 1,
                parent1: ''
            };
            this.tag_type = '';
            this.token_text = this.last_token = this.last_text = this.token_type = '';
            this.Utils = {
                whitespace: "\n\r\t ".split(''),
                single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed'.split(','),
                extra_liners: 'head,body,/html'.split(','),
                in_array: function (what, arr) {
                    for (var i = 0; i < arr.length; i++) {
                        if (what === arr[i]) {
                            return true;
                        }
                    }
                    return false;
                }
            };
            this.get_content = function () {
                var input_char = '';
                var content = [];
                var space = false;
                while (this.input.charAt(this.pos) !== '<') {
                    if (this.pos >= this.input.length) {
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }
                    input_char = this.input.charAt(this.pos);
                    this.pos++;
                    this.line_char_count++;
                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        if (content.length) {
                            space = true;
                        }
                        this.line_char_count--;
                        continue;
                    } else if (space) {
                        if (this.line_char_count >= this.max_char) {
                            content.push('\n');
                            for (var i = 0; i < this.indent_level; i++) {
                                content.push(this.indent_string);
                            }
                            this.line_char_count = 0;
                        } else {
                            content.push(' ');
                            this.line_char_count++;
                        }
                        space = false;
                    }
                    content.push(input_char);
                }
                return content.length ? content.join('') : '';
            };
            this.get_script = function () {
                var input_char = '';
                var content = [];
                var reg_match = new RegExp('\<\/script' + '\>', 'igm');
                reg_match.lastIndex = this.pos;
                var reg_array = reg_match.exec(this.input);
                var end_script = reg_array ? reg_array.index : this.input.length;
                while (this.pos < end_script) {
                    if (this.pos >= this.input.length) {
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }
                    input_char = this.input.charAt(this.pos);
                    this.pos++;
                    content.push(input_char);
                }
                return content.length ? content.join('') : '';
            };
            this.record_tag = function (tag) {
                if (this.tags[tag + 'count']) {
                    this.tags[tag + 'count']++;
                    this.tags[tag + this.tags[tag + 'count']] = this.indent_level;
                } else {
                    this.tags[tag + 'count'] = 1;
                    this.tags[tag + this.tags[tag + 'count']] = this.indent_level;
                }
                this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent;
                this.tags.parent = tag + this.tags[tag + 'count'];
            };
            this.retrieve_tag = function (tag) {
                if (this.tags[tag + 'count']) {
                    var temp_parent = this.tags.parent;
                    while (temp_parent) {
                        if (tag + this.tags[tag + 'count'] === temp_parent) {
                            break;
                        }
                        temp_parent = this.tags[temp_parent + 'parent'];
                    }
                    if (temp_parent) {
                        this.indent_level = this.tags[tag + this.tags[tag + 'count']];
                        this.tags.parent = this.tags[temp_parent + 'parent'];
                    }
                    delete this.tags[tag + this.tags[tag + 'count'] + 'parent'];
                    delete this.tags[tag + this.tags[tag + 'count']];
                    if (this.tags[tag + 'count'] == 1) {
                        delete this.tags[tag + 'count'];
                    } else {
                        this.tags[tag + 'count']--;
                    }
                }
            };
            this.get_tag = function () {
                var input_char = '';
                var content = [];
                var space = false;
                do {
                    if (this.pos >= this.input.length) {
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }
                    input_char = this.input.charAt(this.pos);
                    this.pos++;
                    this.line_char_count++;
                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        space = true;
                        this.line_char_count--;
                        continue;
                    }
                    if (input_char === "'" || input_char === '"') {
                        if (!content[1] || content[1] !== '!') {
                            input_char += this.get_unformatted(input_char);
                            space = true;
                        }
                    }
                    if (input_char === '=') {
                        space = false;
                    }
                    if (content.length && content[content.length - 1] !== '=' && input_char !== '>' && space) {
                        if (this.line_char_count >= this.max_char) {
                            this.print_newline(false, content);
                            this.line_char_count = 0;
                        } else {
                            content.push(' ');
                            this.line_char_count++;
                        }
                        space = false;
                    }
                    content.push(input_char);
                } while (input_char !== '>');
                var tag_complete = content.join('');
                var tag_index;
                if (tag_complete.indexOf(' ') != -1) {
                    tag_index = tag_complete.indexOf(' ');
                } else {
                    tag_index = tag_complete.indexOf('>');
                }
                var tag_check = tag_complete.substring(1, tag_index).toLowerCase();
                if (tag_complete.charAt(tag_complete.length - 2) === '/' || this.Utils.in_array(tag_check, this.Utils.single_token)) {
                    this.tag_type = 'SINGLE';
                } else if (tag_check === 'script') {
                    this.record_tag(tag_check);
                    this.tag_type = 'SCRIPT';
                } else if (tag_check === 'style') {
                    this.record_tag(tag_check);
                    this.tag_type = 'STYLE';
                } else if (tag_check.charAt(0) === '!') {
                    if (tag_check.indexOf('[if') != -1) {
                        if (tag_complete.indexOf('!IE') != -1) {
                            var comment = this.get_unformatted('-->', tag_complete);
                            content.push(comment);
                        }
                        this.tag_type = 'START';
                    } else if (tag_check.indexOf('[endif') != -1) {
                        this.tag_type = 'END';
                        this.unindent();
                    } else if (tag_check.indexOf('[cdata[') != -1) {
                        comment = this.get_unformatted(']]>', tag_complete);
                        content.push(comment);
                        this.tag_type = 'SINGLE';
                    } else {
                        comment = this.get_unformatted('-->', tag_complete);
                        content.push(comment);
                        this.tag_type = 'SINGLE';
                    }
                } else {
                    if (tag_check.charAt(0) === '/') {
                        this.retrieve_tag(tag_check.substring(1));
                        this.tag_type = 'END';
                    } else {
                        this.record_tag(tag_check);
                        this.tag_type = 'START';
                    }
                    if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) {
                        this.print_newline(true, this.output);
                    }
                }
                return content.join('');
            };
            this.get_unformatted = function (delimiter, orig_tag) {
                if (orig_tag && orig_tag.indexOf(delimiter) != -1) {
                    return '';
                }
                var input_char = '';
                var content = '';
                var space = true;
                do {
                    input_char = this.input.charAt(this.pos);
                    this.pos++;
                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        if (!space) {
                            this.line_char_count--;
                            continue;
                        }
                        if (input_char === '\n' || input_char === '\r') {
                            content += '\n';
                            for (var i = 0; i < this.indent_level; i++) {
                                content += this.indent_string;
                            }
                            space = false;
                            this.line_char_count = 0;
                            continue;
                        }
                    }
                    content += input_char;
                    this.line_char_count++;
                    space = true;
                } while (content.indexOf(delimiter) == -1);
                return content;
            };
            this.get_token = function () {
                var token;
                if (this.last_token === 'TK_TAG_SCRIPT') {
                    var temp_token = this.get_script();
                    if (typeof temp_token !== 'string') {
                        return temp_token;
                    }
                    token = BuildSource.jsBeautify(temp_token, {
                        indent_size: this.indent_size,
                        indent_char: this.indent_character,
                        indent_level: this.indent_level
                    });
                    return [token, 'TK_CONTENT'];
                }
                if (this.current_mode === 'CONTENT') {
                    token = this.get_content();
                    if (typeof token !== 'string') {
                        return token;
                    } else {
                        return [token, 'TK_CONTENT'];
                    }
                }
                if (this.current_mode === 'TAG') {
                    token = this.get_tag();
                    if (typeof token !== 'string') {
                        return token;
                    } else {
                        var tag_name_type = 'TK_TAG_' + this.tag_type;
                        return [token, tag_name_type];
                    }
                }
            };
            this.printer = function (js_source, indent_character, indent_size, max_char) {
                this.input = js_source || '';
                this.output = [];
                this.indent_character = indent_character || ' ';
                this.indent_string = '';
                this.indent_size = indent_size || 2;
                this.indent_level = 0;
                this.max_char = max_char || 70;
                this.line_char_count = 0;
                for (var i = 0; i < this.indent_size; i++) {
                    this.indent_string += this.indent_character;
                }
                this.print_newline = function (ignore, arr) {
                    this.line_char_count = 0;
                    if (!arr || !arr.length) {
                        return;
                    }
                    if (!ignore) {
                        while (this.Utils.in_array(arr[arr.length - 1], this.Utils.whitespace)) {
                            arr.pop();
                        }
                    }
                    arr.push('\n');
                    for (var i = 0; i < this.indent_level; i++) {
                        arr.push(this.indent_string);
                    }
                };
                this.print_token = function (text) {
                    this.output.push(text);
                };
                this.indent = function () {
                    this.indent_level++;
                };
                this.unindent = function () {
                    if (this.indent_level > 0) {
                        this.indent_level--;
                    }
                };
            };
            return this;
        }
        multi_parser = new Parser();
        multi_parser.printer(html_source, indent_character, indent_size, max_char);
        while (true) {
            var t = multi_parser.get_token();
            multi_parser.token_text = t[0];
            multi_parser.token_type = t[1];
            if (multi_parser.token_type === 'TK_EOF') {
                break;
            }
            switch (multi_parser.token_type) {
            case 'TK_TAG_START':
            case 'TK_TAG_SCRIPT':
            case 'TK_TAG_STYLE':
                multi_parser.print_newline(false, multi_parser.output);
                multi_parser.print_token(multi_parser.token_text);
                multi_parser.indent();
                multi_parser.current_mode = 'CONTENT';
                break;
            case 'TK_TAG_END':
                multi_parser.print_newline(true, multi_parser.output);
                multi_parser.print_token(multi_parser.token_text);
                multi_parser.current_mode = 'CONTENT';
                break;
            case 'TK_TAG_SINGLE':
                multi_parser.print_newline(false, multi_parser.output);
                multi_parser.print_token(multi_parser.token_text);
                multi_parser.current_mode = 'CONTENT';
                break;
            case 'TK_CONTENT':
                if (multi_parser.token_text !== '') {
                    multi_parser.print_newline(false, multi_parser.output);
                    multi_parser.print_token(multi_parser.token_text);
                }
                multi_parser.current_mode = 'TAG';
                break;
            }
            multi_parser.last_token = multi_parser.token_type;
            multi_parser.last_text = multi_parser.token_text;
        }
        return multi_parser.output.join('');
    }
};;
var lastHundredYears = [];
(function () {
    var date = new Date();
    cyear = (date.getYear() < 1000) ? date.getYear() + 1900 : date.getYear();
    var years = [];
    for (var year = cyear; year >= (cyear - 100); year--) {
        years.push(year + "");
    }
lastHundredYears = years;
})();
var special_options = {
    "None": {
        controls: "dropdown,radio,checkbox,matrix"
    },
    "US States": {
        controls: "dropdown",
        value: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "District of Columbia", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "District of Columbia", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"]
    },
    "US States Abbr": {
        controls: "dropdown",
        value: ["AL", "AK", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]
    },
    "Countries": {
        controls: "dropdown",
        value: ["United States", "Abkhazia", "Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "The Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Central African Republic", "Chad", "Chile", "People's Republic of China", "Republic of China", "Christmas Island", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo", "Cook Islands", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Polynesia", "Gabon", "The Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana Guyana", "Haiti Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "North Korea", "South Korea", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Nagorno-Karabakh", "Namibia", "Nauru", "Nepal", "Netherlands", "Netherlands Antilles", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "Turkish Republic of Northern Cyprus", "Northern Mariana", "Norway", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn Islands", "Poland", "Portugal", "Transnistria Pridnestrovie", "Puerto Rico", "Qatar", "Romania", "Russia", "Rwanda", "Saint Barthelemy", "Saint Helena", "Saint Kitts and Nevis", "Saint Lucia", "Saint Martin", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "Somaliland", "South Africa", "South Ossetia", "Spain", "Sri Lanka", "Sudan", "Suriname", "Svalbard", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tristan da Cunha", "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "British Virgin Islands", "US Virgin Islands", "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"]
    },
    "Last 100 Years": {
        controls: 'dropdown',
        value: lastHundredYears
    },
    "Gender": {
        controls: "dropdown,radio,checkbox",
        value: ["Male".locale(), "Female".locale(), "N/A".locale()]
    },
    "Days": {
        controls: "dropdown,radio,checkbox",
        value: ["Monday".locale(), "Tuesday".locale(), "Wednesday".locale(), "Thursday".locale(), "Friday".locale(), "Saturday".locale(), "Sunday".locale()]
    },
    "Months": {
        controls: "dropdown,radio,checkbox",
        value: ["January".locale(), "February".locale(), "March".locale(), "April".locale(), "May".locale(), "June".locale(), "July".locale(), "August".locale(), "September".locale(), "October".locale(), "November".locale(), "December".locale()],
        nonLocale: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    },
    "Time Zones": {
        controls: "dropdown",
        value: ["[[Africa]]", "Abidjan (GMT)", "Accra (GMT)", "Addis Ababa (GMT+03:00)", "Algiers (GMT+01:00)", "Asmara (GMT+03:00)", "Bamako (GMT)", "Bangui (GMT+01:00)", "Banjul (GMT)", "Bissau (GMT)", "Blantyre (GMT+02:00)", "Brazzaville (GMT+01:00)", "Bujumbura (GMT+02:00)", "Cairo (GMT+03:00)", "Casablanca (GMT)", "Ceuta (GMT+02:00)", "Conakry (GMT)", "Dakar (GMT)", "Dar es Salaam (GMT+03:00)", "Djibouti (GMT+03:00)", "Douala (GMT+01:00)", "El Aaiun (GMT)", "Freetown (GMT)", "Gaborone (GMT+02:00)", "Harare (GMT+02:00)", "Johannesburg (GMT+02:00)", "Kampala (GMT+03:00)", "Khartoum (GMT+03:00)", "Kigali (GMT+02:00)", "Kinshasa (GMT+01:00)", "Lagos (GMT+01:00)", "Libreville (GMT+01:00)", "Lome (GMT)", "Luanda (GMT+01:00)", "Lubumbashi (GMT+02:00)", "Lusaka (GMT+02:00)", "Malabo (GMT+01:00)", "Maputo (GMT+02:00)", "Maseru (GMT+02:00)", "Mbabane (GMT+02:00)", "Mogadishu (GMT+03:00)", "Monrovia (GMT)", "Nairobi (GMT+03:00)", "Ndjamena (GMT+01:00)", "Niamey (GMT+01:00)", "Nouakchott (GMT)", "Ouagadougou (GMT)", "Porto-Novo (GMT+01:00)", "Sao Tome (GMT)", "Tripoli (GMT+02:00)", "Tunis (GMT+02:00)", "Windhoek (GMT+01:00)", "[[America]]", "Adak (GMT-09:00)", "Anchorage (GMT-08:00)", "Anguilla (GMT-04:00)", "Antigua (GMT-04:00)", "Araguaina (GMT-03:00)", "Buenos Aires, Argentina (GMT-03:00)", "Catamarca, Argentina (GMT-03:00)", "Cordoba, Argentina (GMT-03:00)", "Jujuy, Argentina (GMT-03:00)", "La Rioja, Argentina (GMT-03:00)", "Mendoza, Argentina (GMT-03:00)", "Rio Gallegos, Argentina (GMT-03:00)", "Salta, Argentina (GMT-03:00)", "San Juan, Argentina (GMT-03:00)", "San Luis, Argentina (GMT-04:00)", "Tucuman, Argentina (GMT-03:00)", "Ushuaia, Argentina (GMT-03:00)", "Aruba (GMT-04:00)", "Asuncion (GMT-04:00)", "Atikokan (GMT-05:00)", "Bahia (GMT-03:00)", "Barbados (GMT-04:00)", "Belem (GMT-03:00)", "Belize (GMT-06:00)", "Blanc-Sablon (GMT-04:00)", "Boa Vista (GMT-04:00)", "Bogota (GMT-05:00)", "Boise (GMT-06:00)", "Cambridge Bay (GMT-06:00)", "Campo Grande (GMT-04:00)", "Cancun (GMT-05:00)", "Caracas (GMT-04:30)", "Cayenne (GMT-03:00)", "Cayman (GMT-05:00)", "Chicago (GMT-05:00)", "Chihuahua (GMT-06:00)", "Costa Rica (GMT-06:00)", "Cuiaba (GMT-04:00)", "Curacao (GMT-04:00)", "Danmarkshavn (GMT)", "Dawson (GMT-07:00)", "Dawson Creek (GMT-07:00)", "Denver (GMT-06:00)", "Detroit (GMT-04:00)", "Dominica (GMT-04:00)", "Edmonton (GMT-06:00)", "Eirunepe (GMT-04:00)", "El Salvador (GMT-06:00)", "Fortaleza (GMT-03:00)", "Glace Bay (GMT-03:00)", "Godthab (GMT-02:00)", "Goose Bay (GMT-03:00)", "Grand Turk (GMT-04:00)", "Grenada (GMT-04:00)", "Guadeloupe (GMT-04:00)", "Guatemala (GMT-06:00)", "Guayaquil (GMT-05:00)", "Guyana (GMT-04:00)", "Halifax (GMT-03:00)", "Havana (GMT-04:00)", "Hermosillo (GMT-07:00)", "Indianapolis, Indiana (GMT-04:00)", "Knox, Indiana (GMT-05:00)", "Marengo, Indiana (GMT-04:00)", "Petersburg, Indiana (GMT-04:00)", "Tell City, Indiana (GMT-05:00)", "Vevay, Indiana (GMT-04:00)", "Vincennes, Indiana (GMT-04:00)", "Winamac, Indiana (GMT-04:00)", "Inuvik (GMT-06:00)", "Iqaluit (GMT-04:00)", "Jamaica (GMT-05:00)", "Juneau (GMT-08:00)", "Louisville, Kentucky (GMT-04:00)", "Monticello, Kentucky (GMT-04:00)", "La Paz (GMT-04:00)", "Lima (GMT-05:00)", "Los Angeles (GMT-07:00)", "Maceio (GMT-03:00)", "Managua (GMT-06:00)", "Manaus (GMT-04:00)", "Marigot (GMT-04:00)", "Martinique (GMT-04:00)", "Mazatlan (GMT-06:00)", "Menominee (GMT-05:00)", "Merida (GMT-05:00)", "Mexico City (GMT-05:00)", "Miquelon (GMT-02:00)", "Moncton (GMT-03:00)", "Monterrey (GMT-05:00)", "Montevideo (GMT-03:00)", "Montreal (GMT-04:00)", "Montserrat (GMT-04:00)", "Nassau (GMT-04:00)", "New York (GMT-04:00)", "Nipigon (GMT-04:00)", "Nome (GMT-08:00)", "Noronha (GMT-02:00)", "Center, North Dakota (GMT-05:00)", "New Salem, North Dakota (GMT-05:00)", "Panama (GMT-05:00)", "Pangnirtung (GMT-04:00)", "Paramaribo (GMT-03:00)", "Phoenix (GMT-07:00)", "Port-au-Prince (GMT-05:00)", "Port of Spain (GMT-04:00)", "Porto Velho (GMT-04:00)", "Puerto Rico (GMT-04:00)", "Rainy River (GMT-05:00)", "Rankin Inlet (GMT-05:00)", "Recife (GMT-03:00)", "Regina (GMT-06:00)", "Resolute (GMT-05:00)", "Rio Branco (GMT-04:00)", "Santarem (GMT-03:00)", "Santiago (GMT-04:00)", "Santo Domingo (GMT-04:00)", "Sao Paulo (GMT-03:00)", "Scoresbysund (GMT)", "Shiprock (GMT-06:00)", "St Barthelemy (GMT-04:00)", "St Johns (GMT-02:30)", "St Kitts (GMT-04:00)", "St Lucia (GMT-04:00)", "St Thomas (GMT-04:00)", "St Vincent (GMT-04:00)", "Swift Current (GMT-06:00)", "Tegucigalpa (GMT-06:00)", "Thule (GMT-03:00)", "Thunder Bay (GMT-04:00)", "Tijuana (GMT-07:00)", "Toronto (GMT-04:00)", "Tortola (GMT-04:00)", "Vancouver (GMT-07:00)", "Whitehorse (GMT-07:00)", "Winnipeg (GMT-05:00)", "Yakutat (GMT-08:00)", "Yellowknife (GMT-06:00)", "[[Antarctica]]", "Casey (GMT+11:00)", "Davis (GMT+05:00)", "DumontDUrville (GMT+10:00)", "Mawson (GMT+05:00)", "McMurdo (GMT+12:00)", "Palmer (GMT-04:00)", "Rothera (GMT-03:00)", "South Pole (GMT+12:00)", "Syowa (GMT+03:00)", "Vostok (GMT+06:00)", "[[Arctic]]", "Longyearbyen (GMT+02:00)", "[[Asia]]", "Aden (GMT+03:00)", "Almaty (GMT+06:00)", "Amman (GMT+03:00)", "Anadyr (GMT+13:00)", "Aqtau (GMT+05:00)", "Aqtobe (GMT+05:00)", "Ashgabat (GMT+05:00)", "Baghdad (GMT+03:00)", "Bahrain (GMT+03:00)", "Baku (GMT+05:00)", "Bangkok (GMT+07:00)", "Beirut (GMT+03:00)", "Bishkek (GMT+06:00)", "Brunei (GMT+08:00)", "Choibalsan (GMT+08:00)", "Chongqing (GMT+08:00)", "Colombo (GMT+05:30)", "Damascus (GMT+03:00)", "Dhaka (GMT+07:00)", "Dili (GMT+09:00)", "Dubai (GMT+04:00)", "Dushanbe (GMT+05:00)", "Gaza (GMT+03:00)", "Harbin (GMT+08:00)", "Ho Chi Minh (GMT+07:00)", "Hong Kong (GMT+08:00)", "Hovd (GMT+07:00)", "Irkutsk (GMT+09:00)", "Jakarta (GMT+07:00)", "Jayapura (GMT+09:00)", "Jerusalem (GMT+03:00)", "Kabul (GMT+04:30)", "Kamchatka (GMT+13:00)", "Karachi (GMT+06:00)", "Kashgar (GMT+08:00)", "Kathmandu (GMT+05:45)", "Kolkata (GMT+05:30)", "Krasnoyarsk (GMT+08:00)", "Kuala Lumpur (GMT+08:00)", "Kuching (GMT+08:00)", "Kuwait (GMT+03:00)", "Macau (GMT+08:00)", "Magadan (GMT+12:00)", "Makassar (GMT+08:00)", "Manila (GMT+08:00)", "Muscat (GMT+04:00)", "Nicosia (GMT+03:00)", "Novokuznetsk (GMT+07:00)", "Novosibirsk (GMT+07:00)", "Omsk (GMT+07:00)", "Oral (GMT+05:00)", "Phnom Penh (GMT+07:00)", "Pontianak (GMT+07:00)", "Pyongyang (GMT+09:00)", "Qatar (GMT+03:00)", "Qyzylorda (GMT+06:00)", "Rangoon (GMT+06:30)", "Riyadh (GMT+03:00)", "Sakhalin (GMT+11:00)", "Samarkand (GMT+05:00)", "Seoul (GMT+09:00)", "Shanghai (GMT+08:00)", "Singapore (GMT+08:00)", "Taipei (GMT+08:00)", "Tashkent (GMT+05:00)", "Tbilisi (GMT+04:00)", "Tehran (GMT+04:30)", "Thimphu (GMT+06:00)", "Tokyo (GMT+09:00)", "Ulaanbaatar (GMT+08:00)", "Urumqi (GMT+08:00)", "Vientiane (GMT+07:00)", "Vladivostok (GMT+11:00)", "Yakutsk (GMT+10:00)", "Yekaterinburg (GMT+06:00)", "Yerevan (GMT+05:00)", "[[Atlantic]]", "Azores (GMT)", "Bermuda (GMT-03:00)", "Canary (GMT+01:00)", "Cape Verde (GMT-01:00)", "Faroe (GMT+01:00)", "Madeira (GMT+01:00)", "Reykjavik (GMT)", "South Georgia (GMT-02:00)", "St Helena (GMT)", "Stanley (GMT-04:00)", "[[Australia]]", "Adelaide (GMT+09:30)", "Brisbane (GMT+10:00)", "Broken Hill (GMT+09:30)", "Currie (GMT+10:00)", "Darwin (GMT+09:30)", "Eucla (GMT+08:45)", "Hobart (GMT+10:00)", "Lindeman (GMT+10:00)", "Lord Howe (GMT+10:30)", "Melbourne (GMT+10:00)", "Perth (GMT+08:00)", "Sydney (GMT+10:00)", "[[Europe]]", "Amsterdam (GMT+02:00)", "Andorra (GMT+02:00)", "Athens (GMT+03:00)", "Belgrade (GMT+02:00)", "Berlin (GMT+02:00)", "Bratislava (GMT+02:00)", "Brussels (GMT+02:00)", "Bucharest (GMT+03:00)", "Budapest (GMT+02:00)", "Chisinau (GMT+03:00)", "Copenhagen (GMT+02:00)", "Dublin (GMT+01:00)", "Gibraltar (GMT+02:00)", "Guernsey (GMT+01:00)", "Helsinki (GMT+03:00)", "Isle of Man (GMT+01:00)", "Istanbul (GMT+03:00)", "Jersey (GMT+01:00)", "Kaliningrad (GMT+03:00)", "Kiev (GMT+03:00)", "Lisbon (GMT+01:00)", "Ljubljana (GMT+02:00)", "London (GMT+01:00)", "Luxembourg (GMT+02:00)", "Madrid (GMT+02:00)", "Malta (GMT+02:00)", "Mariehamn (GMT+03:00)", "Minsk (GMT+03:00)", "Monaco (GMT+02:00)", "Moscow (GMT+04:00)", "Oslo (GMT+02:00)", "Paris (GMT+02:00)", "Podgorica (GMT+02:00)", "Prague (GMT+02:00)", "Riga (GMT+03:00)", "Rome (GMT+02:00)", "Samara (GMT+05:00)", "San Marino (GMT+02:00)", "Sarajevo (GMT+02:00)", "Simferopol (GMT+03:00)", "Skopje (GMT+02:00)", "Sofia (GMT+03:00)", "Stockholm (GMT+02:00)", "Tallinn (GMT+03:00)", "Tirane (GMT+02:00)", "Uzhgorod (GMT+03:00)", "Vaduz (GMT+02:00)", "Vatican (GMT+02:00)", "Vienna (GMT+02:00)", "Vilnius (GMT+03:00)", "Volgograd (GMT+04:00)", "Warsaw (GMT+02:00)", "Zagreb (GMT+02:00)", "Zaporozhye (GMT+03:00)", "Zurich (GMT+02:00)", "[[Indian]]", "Antananarivo (GMT+03:00)", "Chagos (GMT+06:00)", "Christmas (GMT+07:00)", "Cocos (GMT+06:30)", "Comoro (GMT+03:00)", "Kerguelen (GMT+05:00)", "Mahe (GMT+04:00)", "Maldives (GMT+05:00)", "Mauritius (GMT+04:00)", "Mayotte (GMT+03:00)", "Reunion (GMT+04:00)", "[[Pacific]]", "Apia (GMT-11:00)", "Auckland (GMT+12:00)", "Chatham (GMT+12:45)", "Easter (GMT-06:00)", "Efate (GMT+11:00)", "Enderbury (GMT+13:00)", "Fakaofo (GMT-10:00)", "Fiji (GMT+12:00)", "Funafuti (GMT+12:00)", "Galapagos (GMT-06:00)", "Gambier (GMT-09:00)", "Guadalcanal (GMT+11:00)", "Guam (GMT+10:00)", "Honolulu (GMT-10:00)", "Johnston (GMT-10:00)", "Kiritimati (GMT+14:00)", "Kosrae (GMT+11:00)", "Kwajalein (GMT+12:00)", "Majuro (GMT+12:00)", "Marquesas (GMT-09:30)", "Midway (GMT-11:00)", "Nauru (GMT+12:00)", "Niue (GMT-11:00)", "Norfolk (GMT+11:30)", "Noumea (GMT+11:00)", "Pago Pago (GMT-11:00)", "Palau (GMT+09:00)", "Pitcairn (GMT-08:00)", "Ponape (GMT+11:00)", "Port Moresby (GMT+10:00)", "Rarotonga (GMT-10:00)", "Saipan (GMT+10:00)", "Tahiti (GMT-10:00)", "Tarawa (GMT+12:00)", "Tongatapu (GMT+13:00)", "Truk (GMT+10:00)", "Wake (GMT+12:00)", "Wallis (GMT+12:00)"]
    },
    "LocationCountries": {
        controls: 'location',
        value: ["Canada", "United States", "Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia\/Herzegowina", "Botswana", "Bouvet Island", "Brazil", "British Ind. Ocean", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Cape Verde", "Cayman Islands", "Central African Rep.", "Chad", "Chile", "China", "Christmas Island", "Cocoa (Keeling) Is.", "Colombia", "Comoros", "Congo", "Cook Islands", "Costa Rica", "Cote Divoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea", "Kuwait", "Kyrgyzstan", "Lao", "Latvia", "Lebanon", "Lesotho", "Liberia", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russia", "Rwanda", "Saint Lucia", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Solomon Islands", "Somalia", "South Africa", "Spain", "Sri Lanka", "St. Helena", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican", "Venezuela", "Viet Nam", "Virgin Islands", "Western Sahara", "Yeman", "Yugoslavia", "Zaire", "Zambia"]
    },
    getByType: function (type) {
        var options = [];
        for (var key in special_options) {
            if (special_options[key].controls && special_options[key].controls.indexOf(type) >= 0) {
                options.push(key);
            }
        }
return options;
}
};
var fonts = ['Default', 'Arial', 'Arial Black', 'Courier', 'Courier New', 'Comic Sans MS', 'Georgia', 'Gill Sans', 'Helvetica', 'Lucida', 'Lucida Grande', 'Trebuchet MS', 'Tahoma', 'Times New Roman', 'Verdana'];
var payment_fields = ['control_payment', 'control_paypal', 'control_paypalpro', 'control_clickbank', 'control_2co', 'control_worldpay', 'control_googleco', 'control_onebip', 'control_authnet'];
var not_input = ['control_pagebreak', 'control_collapse', 'control_head', 'control_text', 'control_image', 'control_button', 'control_captcha'];
var recurring_periods = [
    ['Daily', 'Daily'.locale()],
    ['Weekly', 'Weekly'.locale()],
    ['Bi-Weekly', 'Bi-Weekly'.locale()],
    ['Monthly', 'Monthly'.locale()],
    ['Bi-Monthly', 'Bi-Monthly'.locale()],
    ['Quarterly', 'Quarterly'.locale()],
    ['Semi-Yearly', 'Semi-Yearly'.locale()],
    ['Yearly', 'Yearly'.locale()],
    ['Bi-Yearly', 'Bi-Yearly'.locale()]
];
var trial_periods = [
    ['None', 'None'.locale()],
    ['One Day', 'One Day'.locale()],
    ['Three Days', 'Three Days'.locale()],
    ['Five Days', 'Five Days'.locale()],
    ['10 Days', '10 Days'.locale()],
    ['15 Days', '15 Days'.locale()],
    ['30 Days', '30 Days'.locale()],
    ['60 Days', '60 Days'.locale()],
    ['6 Months', '6 Months'.locale()],
    ['1 Year', '1 Year'.locale()]
];
var default_email = "<table bgcolor=\"#f7f9fc\" width=\"100%\" height=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr><td height=\"30\">&nbsp;</td></tr><tr><td align=\"center\">Not implemented yet</td></tr></table>";
var styles = [{
    value: 'form',
    text: 'Default'.locale(),
    image: 'images/styles/default.png'
},
{
    value: 'jottheme',
    text: 'Jot Theme'.locale(),
    image: '/sistema/images/styles/jottheme.png'
},
{
    value: 'baby_blue',
    text: 'Baby Blue'.locale(),
    image: '/sistema/images/styles/babyblue.png'
},
{
    value: 'paper_grey',
    text: 'Paper Grey'.locale(),
    image: '/sistema/images/styles/papergrey.png'
},
{
    value: 'post_it_yellow',
    text: 'Post-It Yellow'.locale(),
    image: '/sistema/images/styles/postit.png'
},
{
    value: 'denimjeans',
    text: 'Denim Jeans'.locale(),
    image: '/sistema/images/styles/denimjeans.png'
},
{
    value: 'industrial_dark',
    text: 'Industrial Dark'.locale(),
    image: '/sistema/images/styles/industry.png'
},
{
    value: 'OldPaper',
    text: 'Old Paper'.locale(),
    image: '/sistema/images/styles/oldpaper.png'
},
{
    value: 'solid',
    text: 'Solid Form'.locale(),
    image: '/sistema/images/styles/solid.png'
},
{
    value: 'big',
    text: 'XXL Form'.locale(),
    image: '/sistema/images/styles/biginput.png'
}];
var stylesDropDown = [];
(function () {
    for (var x = 0; x < styles.length; x++) {
        stylesDropDown.push([styles[x].value, styles[x].text]);
    }
})();
var default_properties = {
    "form": {
        title: {
            text: 'Title'.locale(),
            value: 'Untitled Form'.locale(),
            toolbar: false,			
			hType:'checkbox'
        },
        styles: {
            text: 'Themes'.locale(),
            value: 'form',
            dropdown: stylesDropDown,
            toolbar: false,			
			hType:'checkbox'
        },
        font: {
            text: 'Font Family'.locale(),
            value: 'Verdana',
            dropdown: fonts,			
			hType:'checkbox',
			toolbar: false
        },
        fontsize: {
            text: 'Font Size'.locale(),
            value: '12',
            unit: 'px',			
			hType:'checkbox',
			toolbar: false
        },
        fontcolor: {
            text: 'Font Color'.locale(),
            value: 'Black',
            color: true,			
			hType:'checkbox',
			toolbar: false
        },
        lineSpacing: {
            text: 'Question Spacing'.locale(),
            value: '10',
            unit: 'px',
            toolbar: false,			
			hType:'checkbox'
        },
        background: {
            text: 'Background'.locale(),
            value: '',
            color: true,			
			hType:'checkbox',
			toolbar: false
        },
        formWidth: {
            text: 'Form Width'.locale(),
            value: '690',
            unit: 'px',			
			hType:'checkbox',
			toolbar: false
        },
        labelWidth: {
            text: 'Label Width'.locale(),
            value: '150',			
			hType:'checkbox',
			toolbar: false
        },
        alignment: {
            text: 'Label Alignment'.locale(),
            value: 'Left',
            dropdown: [
                ['Left', 'Left'.locale()],
                ['Top', 'Top'.locale()],
                ['Right', 'Right'.locale()]
            ],			
			hType:'checkbox'
        },
        thankurl: {
            text: 'Thank You URL'.locale(),
            value: '',
            hidden: true,			
			hType:'checkbox'
        },
        thanktext: {
            text: 'Thank You Text'.locale(),
            value: '',
            textarea: true,
            hidden: true,			
			hType:'checkbox'
        },
        highlightLine: {
            text: 'Highlight Effect'.locale(),
            value: 'Enabled'.locale(),
            dropdown: [
                ['Enabled', 'Enabled'.locale()],
                ['Disabled', 'Disabled'.locale()]
            ],
            toolbar: false,			
			hType:'checkbox'
        },
        activeRedirect: {
            text: 'Active Redirect'.locale(),
            value: 'default',
            dropdown: [
                ['default', 'Default'.locale()],
                ['thankurl', 'Thank You URL'.locale()],
                ['thanktext', 'Thank You Text'.locale()]
            ],
            hidden: true,			
			hType:'checkbox'
        },
        sendpostdata: {
            text: 'Send Post Data'.locale(),
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],
            toolbar: false,			
			hType:'checkbox'
        },
        unique: {
            text: 'Unique Submission'.locale(),
            value: 'None',
            dropdown: [
                ['None', 'No Check'.locale()],
                ['Loose', 'Loose Check'.locale()],
                ['Strict', 'Strict Check'.locale()]
            ],
            toolbar: false,			
			hType:'checkbox'
        },
        status: {
            text: 'Status'.locale(),
            value: 'Enabled'.locale(),
            dropdown: [
                ['Enabled', 'Enabled'.locale()],
                ['Disabled', 'Disabled'.locale()]
            ],
            toolbar: false,			
			hType:'checkbox'
        },
        injectCSS: {
            text: 'Inject Custom CSS',
            value: '',
            textarea: true,
            toolbar: false,			
			hType:'checkbox'
        },
        emails: {
            text: 'Emails',
            value: [],
            hidden: true,			
			hType:'checkbox'
        },
		emailText:{
			text: 'Email Text',
            value: false,
            hidden: true,	
			textarea: true,
			hType:'checkbox'
		},
		isSendConfirmationMail:{
			text: 'Will mail send after submit the form',
            value: false,
            hidden: true,	
			hType:'checkbox'
		},
		confirmationEmailId:{
			text: 'Selected email id to send to:',
            value: 'E-mail field',
            hidden: true,	
			hType:'doptdown'
			
		},
		replyToEmailId:{
			text: 'Define the email id ',
            value: '',
            hidden: true,	
			hType:'text'
		},
		emailMsgType:{
			text: 'Is data to be send is a Url or text msg',
            value: '',
            hidden: true,	
			hType:'textare',
			textarea:true
		},
		maxEntries:{
			text: 'Max form submission',
            value: false,
            hidden: true,	
			hType:'checkbox'
		
		},
		isAllowEntryForOneIp:{
			text: 'Allow form data for only one Ip',
            value: false,
            hidden: true,	
			hType:'checkbox'
			
		},
		scheduledPublication:{
			text: 'Form activation periode',
            value: false,
            hidden: true,	
			hType:'checkbox'		
		},
		scheduledPublicationStart:{
			text: 'Form activation start date',
            value: false,
            hidden: true,	
			hType:'checkbox'		
		},
		scheduledPublicationEnd:{
			text: 'Form activation end date ',
            value: false,
            hidden: true,	
			hType:'checkbox'		
		},
		scheduledPublicationStartTime:{
			text: 'Form activation end time ',
            value: '00:00',
            hidden: true,	
			hType:'checkbox'		
		},
		scheduledPublicationEndTime:{
			text: 'Form activation end time ',
            value: '00:00',
            hidden: true,	
			hType:'checkbox'		
		},
		scheduledPublicationStartAmPm:{
			text: 'Form activation start time ',
            value: "AM",
            hidden: true,	
			hType:'checkbox'	
		},
		scheduledPublicationEndAmPm:{
			text: 'Form activation end time ',
            value: "AM",
            hidden: true,	
			hType:'checkbox'	
		},
		confirmationEmailId:{
			text: 'Confirmation mail will be send on this id',
            value: false,
            hidden: true,	
			hType:'checkbox'		
		},
		replyToEmailId:{
			text: 'Reply to of Confirmation mail',
            value: false,
            hidden: true,	
			hType:'checkbox'		
		},
		language:{
			text: 'Form Language',
            value: 1,
            hidden: true,	
			hType:'checkbox'
			
		},
		captcha:{
			text: 'Captcha'.locale(),
            value: 1,
            hidden: true,	
			hType:'checkbox'	
			
		},
		theme:{
			text: 'Theme'.locale(),
         value: 1,
         hidden: true			
			
		}
		
    },
    "control_text": {
        text: {
            text: 'HTML'.locale(),
            value: 'Click to edit this text...'.locale(),
            nolabel: true,
            forceDisplay: true,
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-font_new',
            type: 'textarea',
            hint: 'Be careful with the code. If you place unclosed tags or broken HTML it may break your form completely.',			
			hType:'checkbox'
        }
    },
    "control_head": {
        text: {
            text: 'Text'.locale(),
            value: 'Headline Text'.locale(),
            nolabel: true,
			size:'Medium',			
			hType:'text'
        },
		name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
        subHeader: {
            text: 'Sub Heading'.locale(),
            value: 'This is sub heading'.locale(),			
			hType:'text'
        },
        headerType: {
            text: 'Heading Type'.locale(),
            value: 'Medium'.locale(),
            dropdown: [
                ['Default', 'Medium'.locale()],
                ['Large', 'Large'.locale()],
                ['Small', 'Small'.locale()]
            ],			
			hType:'dropdown'
        },
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		}
    },
	 "control_paragraph": {
		 name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
        text: {
            text: 'Text'.locale(),
            value: 'Paragraph'.locale(),
            nolabel: true,
			size:'Medium',			
			hType:'text'
        },
        subHeader: {
            text: 'Sub Heading'.locale(),
            value: 'This is for paragraph text'.locale(),			
			hType:'label'
        },
        headerType: {
            text: 'Heading Type'.locale(),
            value: 'Medium'.locale(),
            dropdown: [
                ['Default', 'Medium'.locale()],
                ['Large', 'Large'.locale()],
                ['Small', 'Small'.locale()]
            ],			
			hType:'dropdown'
        },
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		}
    },
    "control_textbox": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: 'Label',			
			hType:'label'
        },
        /*labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top1'.locale()]
            ]
        },*/
        required: {
            text: 'Required'.locale(),
            value: 'No',
            dropdown: [
                ['No', 'unchecked'],
                ['Yes', 'checked']
            ],
			hType:'checkbox'
        },
        size: {
            text: 'Size'.locale(),
            value: 30,			
			hType:'dropdown'
        },
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		dulicate:{
			text: 'Dulicate'.locale(),
            value: 'No',			
			hType:'hidden'
		},
       /* validation: {
            text: 'Validation'.locale(),
            value: 'None',
            dropdown: [
                ['None', 'None'.locale()],
                ['Email', 'Email'.locale()],
                ['AlphaNumeric', 'AlphaNumeric'.locale()],
                ['Alphabetic', 'Alphabetic'.locale()],
                ['Numeric', 'Numeric'.locale()]
            ],			
			hType:'dropdown'
        },*/
        maxsize: {
            text: 'Max Size'.locale(),
            value: '',			
			hType:'textbox'
        },
        defaultValue: {
            text: 'Default Value'.locale(),
            value: '',			
			hType:'textbox'
        },
       /* subLabel: {
            text: 'Sub Label'.locale(),
            value: '',			
			hType:'textbox'
        },*/
        hint: {
            text: 'Hint Example'.locale(),
            value: '',			
			hType:'textbox'
        },
        description: {
            text: 'Hover Text'.locale(),
            value: '',
            textarea: true,			
			hType:'textarea'
        },
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		}
    },	
    "control_textarea": {
		name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
			},
        text: {
            text: 'Title'.locale(),
            value: 'Label',			
			hType:'control_textarea'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required'.locale(),
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        cols: {
            text: 'Columns'.locale(),
            value: 30,			
			hType:'checkbox'
        },
        rows: {
            text: 'Rows'.locale(),
            value: 5,			
			hType:'checkbox'
        },
        validation: {
            text: 'Validation'.locale(),
            value: 'None',
            dropdown: [
                ['None', 'None'.locale()],
                ['Email', 'Email'.locale()],
                ['AlphaNumeric', 'AlphaNumeric'.locale()],
                ['Alphabetic', 'Alphabetic'.locale()],
                ['Numeric', 'Numeric'.locale()]
            ],			
			hType:'checkbox'
        },
        entryLimit: {
            text: 'Entry Limit'.locale(),
            value: 'None-0',
            values: [
                ['None', 'No-Limit'.locale()],
                ['Words', 'Words'.locale()],
                ['Letters', 'Letters'.locale()]
            ],
            type: 'textarea-combined',
            hint: 'Limity entry by words or letters'.locale(),			
			hType:'checkbox'
        },
        defaultValue: {
            text: 'Default Value'.locale(),
            value: '',			
			hType:'checkbox'
        },
        subLabel: {
            text: 'Sub Label'.locale(),
            value: '',			
			hType:'checkbox'
        },
        hint: {
            text: 'Hint Example'.locale(),
            value: '',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text'.locale(),
            value: '',
            textarea: true,			
			hType:'checkbox'
        },
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		maxsize: {
            text: 'Max Size',
            value: 50000,			
			hType:'checkbox'
        },
		size: {
            text: 'Size'.locale(),
            value: 30,			
			hType:'dropdown'
        },
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		dulicate:{
			text: 'Dulicate'.locale(),
            value: 'No',			
			hType:'hidden'
		},
    },
    "control_dropdown": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "Dropdown",			
			hType:'checkbox'
        },
        /*labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },*/
        required: {
            text: 'Required'.locale(),
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        options: {
            text: 'Options'.locale(),
            value: "Option 1|Option 2|Option 3".locale(),
            textarea: true,
            splitter: '|',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-dropdown_options',			
			hType:'checkbox'
        },
        special: {
            text: 'Special Options',
            value: 'None',
            dropdown: special_options.getByType('dropdown'),
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-dropdown_special',			
			hType:'checkbox'
        },
        size: {
            text: 'Height',
            value: 0,
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-dropdown_size',			
			hType:'checkbox'
        },
        width: {
            text: 'Width',
            value: 150,
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-dropdown_width',			
			hType:'checkbox'
        },
        selected: {
            text: 'Selected',
            value: '',
            dropdown: 'options',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-dropdown_selected',			
			hType:'checkbox'
        },
        subLabel: {
            text: 'Sub Label'.locale(),
            value: '',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        },
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		limit:{
			text: 'Limit Options',
            value: false,            		
			hType:'checkbox'			
		},
		spreadCols: {
            text: 'Spread to Columns',
            value: '1',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-checkbox_columns',			
			hType:'checkbox'
        } 
    },
    "control_checkbox": {
	    name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "Label",			
			hType:'checkbox'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        options: {
            text: 'Options',
            value: "Option 1|Option 2|Option 3".locale(),
            textarea: true,
            splitter: '|',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-checkbox_options',			
			hType:'checkbox'
        },
        special: {
            text: 'Special Options',
            value: 'None',
            dropdown: special_options.getByType('checkbox'),
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-checkbox_special',			
			hType:'checkbox'
        },
        spreadCols: {
            text: 'Spread to Columns',
            value: '1',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-checkbox_columns',			
			hType:'checkbox'
        },
        selected: {
            text: 'Selected',
            value: '',
            dropdown: 'options',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-checkbox_selected',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        },
		limit:{
			text: 'Limit Options',
            value: false,            		
			hType:'checkbox'			
		},
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		}
    },
    "control_radio": {
	   name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "RadioLabel",			
			hType:'checkbox'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        options: {
            text: 'Options',
            value: "Option 1|Option 2|Option 3".locale(),
            textarea: true,
            splitter: '|',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-radio_options',			
			hType:'checkbox'
        },
        special: {
            text: 'Special Options',
            value: 'None',
            dropdown: special_options.getByType('radio'),
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-radio_special',			
			hType:'checkbox'
        },
        allowOther: {
            text: 'Allow Other',
            value: 'No',
            dropdown: [
                ['Yes', 'Yes'.locale()],
                ['No', 'No'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-radio_other',			
			hType:'checkbox'
        },
        selected: {
            text: 'Selected',
            value: '',
            dropdown: 'options',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-radio_selected',			
			hType:'checkbox'
        },
        spreadCols: {
            text: 'Spread to Columns',
            value: '1',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-radio_columns',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        },
		limit:{
			text: 'Limit Options',
            value: false,            		
			hType:'checkbox'			
		},
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		}
    },
    "control_datetime": { 
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "DateField",			
			hType:'checkbox'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        format: {
            text: 'Date Format',
            value: 'DD/MM/YYYY',
            dropdown: [
                ['mmddyyyy', 'mmddyyyy'.locale()],
                ['ddmmyyyy', 'ddmmyyyy'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-date_format',			
			hType:'checkbox'
        },
		oldFormat:{
				text: 'Date Format',
				value: 'DD/MM/YYYY',
				hType:'hidden'
			
			},
        allowTime: {
            text: 'Allow Time',
            value: "No",
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-allow_time',			
			hType:'checkbox'
        },
        timeFormat: {
            text: 'Time Format',
            value: "AM/PM",
            dropdown: [
                ['24 Hour', '24 Hour'.locale()],
                ['AM/PM', 'AM/PM'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-time_format_24',			
			hType:'checkbox'
        },
        defaultTime: {
            text: 'Default Time',
            value: 'No',
            dropdown: [
                ['Yes', 'Yes'.locale()],
                ['No', 'No'.locale()]
            ],			
			hType:'checkbox'
        },
		defaultDate:{
			text: 'Current time',
            value: 'No',
			hType:'checkbox'
		},
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                day: 'Day'.locale(),
                month: 'Month'.locale(),
                year: 'Year'.locale(),
                last: 'Last Name'.locale(),
                hour: 'Hour'.locale(),
                minutes: 'Minutes'.locale()
            },
            hidden: true,
            toolbar: false,			
			hType:'checkbox'
        },
		defaultValue: {
            text: 'Default Value',
            value: ''+new Date(),			
			hType:'checkbox',

        },
		defaultValueBackup:{
			text: 'Default Value backup',
            value: ''+new Date(),			
			hType:'hidden',
			
			
		},
		size: {
            text: 'Size'.locale(),
            value: 30,			
			hType:'dropdown'
        },
		maxsize: {
            text: 'Max Size',
            value: '',			
			hType:'checkbox'
        },
		endRange:{
			text: 'Date from',
            value: '',			
			hType:'text'
			},
		startRange:{
			text: 'Date to',
            value: '',			
			hType:'text'
		},
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		 dulicate:{
			text: 'Dulicate'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		fieldMask:{
			text: 'Field Mask',
            value: '1',
			hType:'hidden'	
		}
    },
    "control_fileupload": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'File Upload'.locale(),
            value: "Fileupload",			
			hType:'checkbox'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        maxFileSize: {
            text: 'Max File Size',
            value: "2048",
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-max_value',			
			hType:'checkbox'
        },
        extensions: {
            text: 'Extensions',
            value: "pdf, doc, docx, xls, csv, txt, rtf, html, zip, mp3, wma, mpg, flv, avi, jpg, jpeg, png, gif",
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-upload_extensions',			
			hType:'checkbox'
        },
        subLabel: {
            text: 'Sub Label'.locale(),
            value: '',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        },
		 subHeader: {
            text: 'File upload sub heading'.locale(),
            value: 'This is description of file upload'.locale(),			
			hType:'label'
        },
        headerType: {
            text: 'File upload'.locale(),
            value: 'Medium'.locale(),
            dropdown: [
                ['Default', 'Medium'.locale()],
                ['Large', 'Large'.locale()],
                ['Small', 'Small'.locale()]
            ],			
			hType:'dropdown'
        },
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		size: {
            text: 'Size'.locale(),
            value: 30,			
			hType:'dropdown'
        },
    },
    "control_button": {
	    name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Submit Text',
            value: "Submit Form".locale(),
            nolabel: true,
            forceDisplay: true,
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-font_new',			
			hType:'checkbox'
        },
        buttonAlign: {
            text: 'Button Align',
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Center', 'Center'.locale()],
                ['Right', 'Right'.locale()]
            ],			
			hType:'checkbox'
        },
        clear: {
            text: 'Reset Button',
            value: 'No',
            dropdown: [
                ["Yes", "Yes".locale()],
                ["No", "No".locale()]
            ],			
			hType:'checkbox'
        },
        print: {
            text: 'Print Button',
            value: 'No',
            dropdown: [
                ["Yes", "Yes".locale()],
                ["No", "No".locale()]
            ],			
			hType:'checkbox'
        }
    },
    "control_passwordbox": {
	    name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: '....',			
			hType:'checkbox'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        size: {
            text: 'Size',
            value: 30
        },
        validation: {
            text: 'Validation',
            value: 'None',
            dropdown: [
                ['None', 'None'.locale()],
                ['Email', 'Email'.locale()],
                ['AlphaNumeric', 'AlphaNumeric'.locale()],
                ['Alphabetic', 'Alphabetic'.locale()],
                ['Numeric', 'Numeric'.locale()]
            ],			
			hType:'checkbox'
        },
        maxsize: {
            text: 'Max Size',
            value: '',			
			hType:'checkbox'
        },
        defaultValue: {
            text: 'Default Value',
            value: '',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        }
    },
    "control_hidden": {
    name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: '....',			
			hType:'checkbox'
        },
        defaultValue: {
            text: 'Default Value',
            value: '',			
			hType:'checkbox'
        }
    },
    "control_image": {
    name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Text'.locale(),
            value: 'Image',
            nolabel: true,			
			hType:'checkbox'
        },
        src: {
            text: 'Image Source'.locale(),
            value: '/sistema/images/logo.png',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-image_source',			
			hType:'checkbox'
        },
        link: {
            text: 'Image Link'.locale(),
            value: '',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-image_link',			
			hType:'checkbox'
        },
        height: {
            text: 'Height'.locale(),
            value: '93',			
			hType:'checkbox'
        },
        width: {
            text: 'Width'.locale(),
            value: '210',			
			hType:'checkbox'
        },
        align: {
            text: 'Align'.locale(),
            value: 'Left',
            dropdown: [
                ['Left', 'Left'.locale()],
                ['Center', 'Center'.locale()],
                ['Right', 'Right'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-image_align',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        }
    },
    "control_captcha": {
    name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "Enter the message as it's shown".locale(),			
			hType:'checkbox'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        useReCaptcha: {
            text: 'reCaptcha'.locale(),
            value: 'Yes',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required',
            value: 'Yes',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],
            hidden: true,			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        }
    },
    "control_autocomp": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: '....'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        items: {
            text: 'Items'.locale(),
            value: "Item 1|Item 2|Item 3".locale(),
            textarea: true,
            splitter: '|',			
			hType:'checkbox'
        },
        size: {
            text: 'Size',
            value: 30,			
			hType:'checkbox'
        },
        validation: {
            text: 'Validation',
            value: 'None',
            dropdown: [
                ['None', 'None'.locale()],
                ['Email', 'Email'.locale()],
                ['AlphaNumeric', 'AlphaNumeric'.locale()],
                ['Alphabetic', 'Alphabetic'.locale()],
                ['Numeric', 'Numeric'.locale()]
            ],			
			hType:'checkbox'
        },
        maxsize: {
            text: 'Max Size',
            value: '',			
			hType:'checkbox'
        },
        defaultValue: {
            text: 'Default Value',
            value: '',			
			hType:'checkbox'
        },
        subLabel: {
            text: 'Sub Label'.locale(),
            value: '',			
			hType:'checkbox'
        },
        hint: {
            text: 'Hint Example',
            value: '',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        }
    },
    "control_rating": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "....",			
			hType:'checkbox'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ],			
			hType:'checkbox'
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],			
			hType:'checkbox'
        },
        stars: {
            text: 'Star Amount'.locale(),
            value: "5",
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-star_amount',			
			hType:'checkbox'
        },
        starStyle: {
            text: 'Star Style'.locale(),
            value: 'Stars',
            dropdown: [
                ['Stars', 'Stars'.locale()],
                ['Stars 2', 'Stars 2'.locale()],
                ['Hearts', 'Hearts'.locale()],
                ['Light Bulps', 'Light Bulps'.locale()],
                ['Lightnings', 'Lightnings'.locale()],
                ['Flags', 'Flags'.locale()],
                ['Shields', 'Shields'.locale()],
                ['Pluses', 'Pluses'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-star_style',			
			hType:'checkbox'
        },
        defaultValue: {
            text: 'Default Value',
            value: '',			
			hType:'checkbox'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true,			
			hType:'checkbox'
        }
    },
    "control_scale": {
    name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "....",			
			hType:'checkbox'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        fromText: {
            text: '"Worst" Text',
            value: 'Worst',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-scale_from'
        },
        toText: {
            text: '"Best" Text',
            value: 'Best',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-scale_to'
        },
        scaleAmount: {
            text: 'Scale Amount',
            value: '5',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-scale_amount'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        }
    },
    "control_slider": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "...."
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        maxValue: {
            text: 'Maximum Value',
            value: "100"
        },
        width: {
            text: 'Width',
            value: "200"
        },
        defaultValue: {
            text: 'Default Value',
            value: '0'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        }
    },
    "control_spinner": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "...."
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        width: {
            text: 'Width',
            value: "60",
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-spinner_size'
        },
        maxValue: {
            text: 'Maximum Value',
            value: ''
        },
        minValue: {
            text: 'Minimum Value',
            value: ''
        },
        addAmount: {
            text: 'Stepping',
            value: '1'
        },
        allowMinus: {
            text: 'Allow Negatives',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        defaultValue: {
            text: 'Default Value',
            value: '0'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        }
    },
    "control_range": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "...."
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        addAmount: {
            text: 'Stepping',
            value: '1'
        },
        allowMinus: {
            text: 'Allow Negatives',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        defaultFrom: {
            text: 'Default From',
            value: '0',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-range_default_from'
        },
        defaultTo: {
            text: 'Default To',
            value: '0',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-range_default_to'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                from: 'From'.locale(),
                to: 'To'.locale()
            },
            hidden: true,
            toolbar: false
        }
    },
    "control_grading": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "...."
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        options: {
            text: 'Options',
            value: 'Item 1|Item 2|Item 3',
            textarea: true,
            splitter: '|',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-grading_options'
        },
        total: {
            text: 'Total',
            value: '100',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-grading_total'
        },
        boxAlign: {
            text: 'Box Alignment',
            value: 'Left',
            dropdown: [
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_align'
        }
    },
    "control_matrix": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "...."
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Top',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        mrows: {
            text: 'Rows',
            value: 'Service Quality'.locale() + '|' + 'Overall Hygiene'.locale() + '|' + 'Responsiveness'.locale() + '|' + 'Kindness and Helpfulness'.locale(),
            textarea: true,
            splitter: '|'
        },
        mcolumns: {
            text: 'Columns',
            value: 'Very Satisfied'.locale() + '|' + 'Satisfied'.locale() + '|' + 'Somewhat Satisfied'.locale() + '|' + 'Not Satisfied'.locale(),
            textarea: true,
            splitter: '|'
        },
        inputType: {
            text: 'Input Type',
            value: 'Radio Button',
            dropdown: [
                ['Radio Button', 'Radio Button'.locale()],
                ['Check Box', 'Check Box'.locale()],
                ['Text Box', 'Text Box'.locale()],
                ['Drop Down', 'Drop Down'.locale()]
            ]
        },
        dropdown: {
            text: 'Dropdown Options',
            value: 'Yes|No',
            textarea: true,
            splitter: '|',
            hidden: true
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        }
    },
    "control_collapse": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Text'.locale(),
            value: 'Click to edit this text...',
            nolabel: true
        },
        status: {
            text: 'Status',
            value: 'Closed',
            dropdown: [
                ['Closed', 'Closed'.locale()],
                ['Open', 'Open'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-collapse_open'
        },
        visibility: {
            text: 'Visibility',
            value: 'Visible',
            dropdown: [
                ['Visible', 'Visible'.locale()],
                ['Hidden', 'Hidden'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-visibility'
        }
    },
    "control_pagebreak": {
    	name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Text'.locale(),
            value: 'Page Break',
            nolabel: true
        }
    },
    "control_fullname": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "Full Name".locale()
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        prefix: {
            text: 'Prefix',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-name_prefix'
        },
        suffix: {
            text: 'Suffix',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-name_suffix'
        },
        middle: {
            text: 'Middle Name',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-name_middle'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                prefix: 'Prefix'.locale(),
                first: 'First Name'.locale(),
                middle: 'Middle Name'.locale(),
                last: 'Last Name'.locale(),
                suffix: 'Suffix'.locale()
            },
            hidden: true,
            toolbar: false
        }
    },
    "control_location": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "...."
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        }
    },
    "control_address": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: "Address".locale()
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        selectedCountry: {
            text: 'Country',
            value: '',
            dropdown: special_options.Countries.value,
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-dropdown_selected'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                cc_firstName: 'First Name'.locale(),
                cc_lastName: 'Last Name'.locale(),
                cc_number: 'Credit Card Number'.locale(),
                cc_ccv: 'Security Code'.locale(),
                cc_exp_month: 'Expiration Month'.locale(),
                cc_exp_year: 'Expiration Year'.locale(),
                addr_line1: 'Street Address'.locale(),
                addr_line2: 'Street Address Line 2'.locale(),
                city: 'City'.locale(),
                state: 'State / Province'.locale(),
                postal: 'Postal / Zip Code'.locale(),
                country: 'Country'.locale()
            },
            hidden: true,
            toolbar: false
        }
    },
    "control_email": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: 'E-mail'.locale()
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        size: {
            text: 'Size',
            value: 30
        },
        validation: {
            text: 'Validation',
            value: 'Email',
            dropdown: [
                ['None', 'None'.locale()],
                ['Email', 'Email'.locale()],
                ['AlphaNumeric', 'AlphaNumeric'.locale()],
                ['Alphabetic', 'Alphabetic'.locale()],
                ['Numeric', 'Numeric'.locale()]
            ]
        },
        maxsize: {
            text: 'Max Size',
            value: ''
        },
        defaultValue: {
            text: 'Default Value',
            value: ''
        },
        subLabel: {
            text: 'Sub Label'.locale(),
            value: ''
        },
        hint: {
            text: 'Hint Example',
            value: 'ex: myname@example.com'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        },
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		dulicate:{
			text: 'Dulicate'.locale(),
            value: 'No',			
			hType:'hidden'
		}
    },
    "control_number": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: 'Number'.locale()
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        size: {
            text: 'Size',
            value: 30
        },
        validation: {
            text: 'Validation',
            value: 'Numeric',
            dropdown: [
                ['None', 'None'.locale()],
                ['Email', 'Email'.locale()],
                ['AlphaNumeric', 'AlphaNumeric'.locale()],
                ['Alphabetic', 'Alphabetic'.locale()],
                ['Numeric', 'Numeric'.locale()]
            ]
        },
        maxsize: {
            text: 'Max Size',
            value: ''
        },
        defaultValue: {
            text: 'Default Value',
            value: ''
        },
        subLabel: {
            text: 'Sub Label'.locale(),
            value: ''
        },
        hint: {
            text: 'Hint Example',
            value: 'ex: 100'
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        },
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		dulicate:{
			text: 'Dulicate'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		startRange:{
			text: 'Start range'.locale(),
            value: ''
			
		},
		endRange:{
			text: 'End range'.locale(),
            value: ''
			
		},
		numberTextAligned:{
			text:''.locale(),
			value :'No',
			hType:'hidden'
		},
		fieldMask:{
			text: 'Field Mask',
            value: '0',
			hType:'hidden'	
		},
		decimalPosition:{
			text: 'Decimal position',
            value: '',
			hType:'hidden'	
		},
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		}
    },
	"control_phonenumber":{
		name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
        text: {
            text: 'Title'.locale(),
            value: 'Phone Number'.locale()
        },
		size: {
            text: 'Size'.locale(),
            value: 30,			
			hType:'dropdown'
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                area: 'Area Code'.locale(),
                phone: 'Phone Number'.locale()
            },
            hidden: true,
            toolbar: false
        },
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		dulicate:{
			text: 'Dulicate'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		defaultValue: {
            text: 'Default Value',
            value: '',			
			hType:'checkbox'
        },
		fieldMask:{
			text: 'Field Mask',
            value: '0',
			hType:'hidden'	
		},
    
		
	},
    "control_phone": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: 'Phone Number'.locale()
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required',
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        description: {
            text: 'Hover Text',
            value: '',
            textarea: true
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                area: 'Area Code'.locale(),
                phone: 'Phone Number'.locale()
            },
            hidden: true,
            toolbar: false
        }
    },
    "control_birthdate": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: 'Birth Date'.locale()
        },
        labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top'.locale()]
            ]
        },
        required: {
            text: 'Required'.locale(),
            value: 'No',
            dropdown: [
                ['No', 'No'.locale()],
                ['Yes', 'Yes'.locale()]
            ]
        },
        format: {
            text: 'Date Format'.locale(),
            value: 'mmddyyyy',
            dropdown: [
                ['mmddyyyy', 'mmddyyyy'.locale()],
                ['ddmmyyyy', 'ddmmyyyy'.locale()]
            ],
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-date_format'
        },
        description: {
            text: 'Hover Text'.locale(),
            value: '',
            textarea: true
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                month: 'Month'.locale(),
                day: 'Day'.locale(),
                year: 'Year'.locale()
            },
            hidden: true,
            toolbar: false
        }
    },
    "control_payment": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		currency: {
            text: 'Currency'.locale(),
            value: 'USD',
            dropdown: [
                ['USD', 'U.S. Dollar'],
                ['EUR', 'Euro'],
                ['CAD', 'Canadian Dollar'],
                ['AUD', 'Australian Dollar'],
                ['CHF', 'Swiss Franc'],
                ['CZK', 'Czech Koruna'],
                ['DKK', 'Danish Krone'],
                ['GBP', 'Pound Sterling'],
                ['HKD', 'Hong Kong Dollar'],
                ['HUF', 'Hungarian Forint'],
                ['ILS', 'Israeli New Sheqel'],
                ['JPY', 'Japanese Yen'],
                ['MXN', 'Mexican Peso'],
                ['NOK', 'Norwegian Krone'],
                ['NZD', 'New Zealand Dollar'],
                ['PLN', 'Polish Zloty'],
                ['SEK', 'Swedish Krona'],
                ['SGD', 'Singapore Dollar']
            ]
        },
        bridge: {
            text: 'Bridge',
            hidden: true,
            toolbar: false,
            value: ''
        }
    },
    "control_paypal": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},account: {
            text: 'PayPal Account'.locale(),
            value: '',
            toolbar: false
        },
        payeraddress: {
            text: 'Need Payer Address'.locale(),
            value: 'Yes',
            dropdown: [
                ['Yes', 'Yes'.locale()],
                ['No', 'No'.locale()]
            ],
            toolbar: false
        },
        currency: {
            text: 'Currency'.locale(),
            value: 'USD',
            dropdown: [
                ['USD', 'U.S. Dollar'],
                ['EUR', 'Euro'],
                ['CAD', 'Canadian Dollar'],
                ['AUD', 'Australian Dollar'],
                ['CHF', 'Swiss Franc'],
                ['CZK', 'Czech Koruna'],
                ['DKK', 'Danish Krone'],
                ['GBP', 'Pound Sterling'],
                ['HKD', 'Hong Kong Dollar'],
                ['HUF', 'Hungarian Forint'],
                ['ILS', 'Israeli New Sheqel'],
                ['JPY', 'Japanese Yen'],
                ['MXN', 'Mexican Peso'],
                ['NOK', 'Norwegian Krone'],
                ['NZD', 'New Zealand Dollar'],
                ['PLN', 'Polish Zloty'],
                ['SEK', 'Swedish Krona'],
                ['SGD', 'Singapore Dollar']
            ]
        },
        bridge: {
            text: 'Bridge',
            hidden: true,
            toolbar: false,
            value: ''
        }
    },
    "control_paypalpro": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		username: {
            text: 'API Username'.locale(),
            value: '',
            size: '30',
            toolbar: false
        },
        password: {
            text: 'API Password'.locale(),
            value: '',
            size: '40',
            toolbar: false
        },
        signature: {
            text: 'Signature'.locale(),
            value: '',
            size: '40',
            toolbar: false
        },
        currency: {
            text: 'Currency'.locale(),
            value: 'USD',
            dropdown: [
                ['USD', 'U.S. Dollar'],
                ['EUR', 'Euro'],
                ['CAD', 'Canadian Dollar'],
                ['AUD', 'Australian Dollar'],
                ['CHF', 'Swiss Franc'],
                ['CZK', 'Czech Koruna'],
                ['DKK', 'Danish Krone'],
                ['GBP', 'Pound Sterling'],
                ['HKD', 'Hong Kong Dollar'],
                ['HUF', 'Hungarian Forint'],
                ['ILS', 'Israeli New Sheqel'],
                ['JPY', 'Japanese Yen'],
                ['MXN', 'Mexican Peso'],
                ['NOK', 'Norwegian Krone'],
                ['NZD', 'New Zealand Dollar'],
                ['PLN', 'Polish Zloty'],
                ['SEK', 'Swedish Krona'],
                ['SGD', 'Singapore Dollar']
            ]
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                cc_firstName: 'First Name'.locale(),
                cc_lastName: 'Last Name'.locale(),
                cc_number: 'Credit Card Number'.locale(),
                cc_ccv: 'Security Code'.locale(),
                cc_exp_month: 'Expiration Month'.locale(),
                cc_exp_year: 'Expiration Year'.locale(),
                addr_line1: 'Street Address'.locale(),
                addr_line2: 'Street Address Line 2'.locale(),
                city: 'City'.locale(),
                state: 'State / Province'.locale(),
                postal: 'Postal / Zip Code'.locale(),
                country: 'Country'.locale()
            },
            hidden: true,
            toolbar: false
        }
    },
    "control_authnet": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		apiLoginId: {
            text: 'API Login ID'.locale(),
            value: '',
            toolbar: false
        },
        transactionKey: {
            text: 'Transaction Key'.locale(),
            value: '',
            toolbar: false
        },
        currency: {
            text: 'Currency'.locale(),
            value: 'USD',
            dropdown: [
                ['USD', 'USD'.locale()]
            ]
        },
        sublabels: {
            text: 'Sub Labels',
            value: {
                cc_firstName: 'First Name'.locale(),
                cc_lastName: 'Last Name'.locale(),
                cc_number: 'Credit Card Number'.locale(),
                cc_ccv: 'Security Code'.locale(),
                cc_exp_month: 'Expiration Month'.locale(),
                cc_exp_year: 'Expiration Year'.locale(),
                addr_line1: 'Street Address'.locale(),
                addr_line2: 'Street Address Line 2'.locale(),
                city: 'City'.locale(),
                state: 'State / Province'.locale(),
                postal: 'Postal / Zip Code'.locale(),
                country: 'Country'.locale()
            },
            hidden: true,
            toolbar: false
        }
    },
    "control_googleco": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		merchantID: {
            text: 'Merchant ID'.locale(),
            value: '',
            toolbar: false
        },
        currency: {
            text: 'Currency'.locale(),
            value: 'USD',
            dropdown: [
                ['USD', 'USD'.locale()],
                ['GBP', 'GBP'.locale()]
            ]
        }
    },
    "control_onebip": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		username: {
            text: 'OneBip Username',
            value: '',
            toolbar: false
        },
        itemNo: {
            text: 'Item Number',
            value: '',
            size: 6,
            toolbar: false
        },
        productName: {
            text: 'Product Name'.locale(),
            value: '',
            toolbar: false
        },
        productPrice: {
            text: 'Product Price'.locale(),
            value: '',
            size: 6,
            toolbar: false
        },
        currency: {
            text: 'Currency'.locale(),
            value: 'USD',
            dropdown: [
                ['USD', 'USD'.locale()],
                ['EUR', 'EUR'.locale()]
            ]
        }
    },
    "control_worldpay": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		installationID: {
            text: 'WorldPay Installation ID',
            value: '',
            toolbar: false
        },
        currency: {
            text: 'Currency'.locale(),
            value: 'USD',
            dropdown: [
                ['USD', 'USD'.locale()],
                ['GBP', 'GBP'.locale()],
                ['EUR', 'EUR'.locale()]
            ]
        }
    },
    "control_2co": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		vendorNumber: {
            text: '2CheckOut Vendor Number',
            value: '',
            toolbar: false
        },
        currency: {
            text: 'Currency'.locale(),
            value: 'USD',
            dropdown: [
                ['USD', 'USD'.locale()],
                ['EUR', 'EUR'.locale()]
            ]
        }
    },
    "control_clickbank": {
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		login: {
            text: 'ClickBank Account name',
            value: '',
            toolbar: false
        },
        itemNo: {
            text: 'Item Number',
            value: '',
            size: 6,
            toolbar: false
        },
        productName: {
            text: 'Product Name'.locale(),
            value: '',
            toolbar: false
        },
        productPrice: {
            text: 'Product Price'.locale(),
            value: '',
            size: 6,
            toolbar: false
        },
        currency: {
            text: 'Currency',
            value: 'USD',
            dropdown: [
                ['USD', 'USD'.locale()],
                ['EUR', 'EUR'.locale()]
            ]
        }
    },
	"control_money":{
        name:{
			text: 'Title'.locale(),
            value: '',			
			hType:'checkbox'
		},
		text: {
            text: 'Title'.locale(),
            value: 'Money',			
			hType:'label'
        },
        /*labelAlign: {
            text: 'Label Align'.locale(),
            value: 'Auto',
            dropdown: [
                ['Auto', 'Auto'.locale()],
                ['Left', 'Left'.locale()],
                ['Right', 'Right'.locale()],
                ['Top', 'Top1'.locale()]
            ]
        },*/
        required: {
            text: 'Required'.locale(),
            value: 'No',
            dropdown: [
                ['No', 'unchecked'],
                ['Yes', 'checked']
            ],
			hType:'checkbox'
        },
        size: {
            text: 'Size'.locale(),
            value: 30,			
			hType:'dropdown'
        },
		islogged:{
			text: 'No'.locale(),
            value: 'No',			
			hType:'hidden'
		},
		dulicate:{
			text: 'Dulicate'.locale(),
            value: 'No',			
			hType:'hidden'
		},
       /* validation: {
            text: 'Validation'.locale(),
            value: 'None',
            dropdown: [
                ['None', 'None'.locale()],
                ['Email', 'Email'.locale()],
                ['AlphaNumeric', 'AlphaNumeric'.locale()],
                ['Alphabetic', 'Alphabetic'.locale()],
                ['Numeric', 'Numeric'.locale()]
            ],			
			hType:'dropdown'
        },*/
        maxsize: {
            text: 'Max Size'.locale(),
            value: '',			
			hType:'textbox'
        },
        defaultValue: {
            text: 'Default Value'.locale(),
            value: '',			
			hType:'textbox'
        },
       /* subLabel: {
            text: 'Sub Label'.locale(),
            value: '',			
			hType:'textbox'
        },*/
        hint: {
            text: 'Hint Example'.locale(),
            value: '',			
			hType:'textbox'
        },
        description: {
            text: 'Hover Text'.locale(),
            value: '',
            textarea: true,			
			hType:'textarea'
        },
		association: {
            text: 'Associate Fields'.locale(),
            value: 0,
            textarea: true,			
			hType:'text'
        },
		dbname:{
			text: 'Associate datatable'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		dbfieldName:{
			text: 'Associate datatable\'s field'.locale(),
            value: null,
            textarea: true,			
			hType:'text'
			
		},
		startRange:{
			text: 'Start range'.locale(),
            value: ''
			
		},
		endRange:{
			text: 'End range'.locale(),
            value: ''
			
		},
		numberTextAligned:{
			text:''.locale(),
			value :'No',
			hType:'hidden'
		},
		decimalPosition:{
			text: 'Decimal position',
            value: '',
			hType:'hidden'	
		},
		currencyFormat:{
			text: 'Currency signs',
            value: '',
			hType:'text'	
		}
    }
};
var default_payments_properties = {
    text: {
        text: 'Title'.locale(),
        value: "My Products"
    },
    labelAlign: {
        text: 'Label Align'.locale(),
        value: 'Auto',
        dropdown: [
            ['Auto', 'Auto'.locale()],
            ['Left', 'Left'.locale()],
            ['Right', 'Right'.locale()],
            ['Top', 'Top'.locale()]
        ]
    },
    required: {
        text: 'Required'.locale(),
        value: 'No',
        dropdown: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ]
    },
    description: {
        text: 'Hover Text'.locale(),
        value: '',
        textarea: true
    },
    products: {
        text: 'Products'.locale(),
        value: '',
        toolbar: false,
        hidden: true
    },
    showTotal: {
        text: 'Total',
        value: 'No',
        dropdown: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ]
    },
    paymentType: {
        text: 'Payment Type'.locale(),
        value: 'product',
        dropdown: [
            ['product', 'Product'.locale()],
            ['subscription', 'Subscription'.locale()],
            ['donation', 'Donation'.locale()]
        ],
        toolbar: false
    },
    multiple: {
        text: 'Multiple'.locale(),
        value: 'Yes',
        dropdown: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ],
        toolbar: false
    },
    donationText: {
        text: 'Donation Text'.locale(),
        value: 'Donation',
        toolbar: false
    },
    suggestedDonation: {
        text: 'Suggested Donation'.locale(),
        value: '',
        toolbar: false
    }
};
(function () {
    for (var i = 0; i < payment_fields.length; i++) {
        var key = payment_fields[i];
        for (var k in default_payments_properties) {
            default_properties[key][k] = default_payments_properties[k];
        }
    }
})();
var toolbarItems = {
    background: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-form_background',
        text: 'Background'.locale(),
        type: 'colorpicker',
		hType: null
    },
    font: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-font',
        text: 'Font'.locale(),
        type: 'menu',
		hType: null,
        values: [{
            text: 'Arial',
            value: 'Arial'
        },
        {
            text: 'Arial Black',
            value: 'Arial Black'
        },
        {
            text: 'Courier',
            value: 'Courier'
        },
        {
            text: 'Courier New',
            value: 'Courier New'
        },
        {
            text: 'Comic Sans MS',
            value: 'Comic Sans MS'
        },
        {
            text: 'Gill Sans',
            value: 'Gill Sans'
        },
        {
            text: 'Helvetica',
            value: 'Helvetica'
        },
        {
            text: 'Lucida',
            value: 'Lucida'
        },
        {
            text: 'Lucida Grande',
            value: 'Lucida Grande'
        },
        {
            text: 'Trebuchet MS',
            value: 'Trebuchet MS'
        },
        {
            text: 'Tahoma',
            value: 'Tahoma'
        },
        {
            text: 'Times New Roman',
            value: 'Times New Roman'
        },
        {
            text: 'Verdana',
            value: 'Verdana'
        }]
    },
    fontcolor: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-font_color',
        text: 'Font Color'.locale(),
        type: 'colorpicker',
		hType: null
    },
    fontsize: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-font_size',
        text: 'Font Size'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    required: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-required',
        text: 'Required'.locale(),
        type: 'toggle',
		hType: 'textbox',
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ]
    },
    useReCaptcha: {
        icon: '/sistema/images/toolbar/recaptcha.png',
        text: 'reCaptcha'.locale(),
        type: 'toggle',
		hType: null,
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ]
    },
    size: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-input_size',
        text: 'Size'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    validation: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-validation',
        text: 'Validation'.locale(),
        type: 'menu',
		hType: null,
        values: [{
            text: 'None'.locale(),
            value: 'None'
        },
        {
            text: 'Email'.locale(),
            value: 'Email'
        },
        {
            text: 'AlphaNumeric'.locale(),
            value: 'AlphaNumeric'
        },
        {
            text: 'Alphabetic'.locale(),
            value: 'Alphabetic'
        },
        {
            text: 'Numeric'.locale(),
            value: 'Numeric'
        }]
    },
    defaultValue: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-default',
        text: 'Default Value'.locale(),
        type: 'text',
        size: 15,
		hType: null
    },
    defaultTime: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-default',
        text: 'Default Time'.locale(),
        type: 'toggle',
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ],
		hType: null
    },
    subLabel: {
        icon: '/sistema/images/toolbar/input_subLabel.png',
        text: 'Sub Label'.locale(),
        type: 'text',
		hType: null
    },
    hint: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-hint',
        text: 'Hint Example'.locale(),
        type: 'text',
        size: 15,
		hType: null
    },
    description: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-description',
        text: 'Hover Text'.locale(),
        type: 'textarea',
        hint: 'Write a description for your field',
		hType: null
    },
    cols: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-textarea_columns',
        text: 'Columns'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    rows: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-textarea_rows',
        text: 'Rows'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    mcolumns: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-matrix_columns',
        text: 'Columns'.locale(),
        type: 'textarea',
		hType: null
    },
    mrows: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-matrix_rows',
        text: 'Rows'.locale(),
        type: 'textarea',
		hType: null
    },
    inputType: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-matrix_input_type',
        text: 'Input Type'.locale(),
        type: 'dropdown',
		hType: null
    },
    alignment: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-label_align',
        text: 'Label Align'.locale(),
        type: 'menu',
        values: [{
            text: 'Left Aligned'.locale(),
            value: 'Left',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_left'
        },
        {
            text: 'Right Aligned'.locale(),
            value: 'Right',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_right'
        },
        {
            text: 'Top Aligned'.locale(),
            value: 'Top',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_top'
        }],
		hType: null
    },
    special: {
        text: 'Special'.locale(),
        type: 'dropdown',
        values: special_options.getByType('dropdown'),
		hType: null
    },
    labelWidth: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-label_width',
        text: 'Label Width'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    formWidth: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-form_width',
        text: 'Form Width'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    allowMinus: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-negatives',
        text: 'Negatives'.locale(),
        type: 'toggle',
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ],
		hType: null
    },
    maxsize: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-max_size',
        text: 'Max Size'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    entryLimit: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-max_size',
        text: 'Entry Limit'.locale(),
		hType: null
    },
    maxFileSize: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-max_size',
        text: 'Max File Size'.locale(),
        hint: 'Enter a value in KB such as 1024',
        type: 'spinner',
        size: 10,
		hType: null
    },
    maxValue: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-max_value',
        text: 'Max Value'.locale(),
        type: 'spinner',
        size: 10
    },
    minValue: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-min_value',
        text: 'Min Value'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    width: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-width',
        text: 'Width'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    height: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-height',
        text: 'Height'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    addAmount: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-stepping',
        text: 'Stepping'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    selected: {
        text: 'Selected'.locale(),
        type: 'dropdown',
		hType: null
    },
    showTotal: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-payment_total',
        text: 'Show Total'.locale(),
        type: 'toggle',
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ],
		hType: null
    },
    allowTime: {
        text: 'Allow Time'.locale(),
        type: 'toggle',
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ],
		hType: null
    },
    dropdown: {
        icon: '/sistema/images/toolbar/options.png',
        text: 'Options'.locale(),
        type: 'textarea',
        hint: 'Separate the options with new line',
		hType: null
    },
    options: {
        text: 'Options'.locale(),
        type: 'textarea',
        hint: 'Separate the options with new line',
		hType: null
    },
    items: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-autocomplete_options',
        text: 'Items'.locale(),
        type: 'textarea',
        hint: 'Separate the options with new line',
		hType: null
    },
    spreadCols: {
        text: 'Spread Columns'.locale(),
        type: 'spinner',
        size: 10,
		hType: null
    },
    allowOther: {
        text: 'Allow Other'.locale(),
        type: 'toggle',
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ],
		hType: null
    },
    currency: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-currency',
        text: 'Currency'.locale(),
        type: 'dropdown',
		hType: null
    },
    print: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-button_print',
        text: 'Print Button'.locale(),
        type: 'toggle',
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ],
		hType: null
    },
    clear: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-button_clear',
        text: 'Reset Button'.locale(),
        type: 'toggle',
        values: [
            ['No', 'No'.locale()],
            ['Yes', 'Yes'.locale()]
        ],
		hType: null
    },
    headerType: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-header_size',
        text: 'Heading Size'.locale(),
        type: 'menu',
        values: [{
            value: 'Default',
            text: 'Default'.locale()
        },
        {
            value: 'Large',
            text: 'Large'.locale()
        },
        {
            value: 'Small',
            text: 'Small'.locale()
        }],
		hType: null
    },
    subHeader: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-sub_header',
        text: 'Sub Heading'.locale(),
        size: 30,
		hType: null
    },
    labelAlign: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-label_align',
        text: 'Label Align'.locale(),
        type: 'menu',
        values: [{
            text: 'Auto'.locale(),
            value: 'Auto',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_auto'
        },
        {
            text: 'Left'.locale(),
            value: 'Left',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_left'
        },
        {
            text: 'Right'.locale(),
            value: 'Right',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_right'
        },
        {
            text: 'Top'.locale(),
            value: 'Top',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_top'
        }],
		hType: null
    },
    buttonAlign: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-button_align',
        text: 'Button Align'.locale(),
        type: 'menu',
        values: [{
            text: 'Auto'.locale(),
            value: 'Auto',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_auto'
        },
        {
            text: 'Left'.locale(),
            value: 'Left',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_left'
        },
        {
            text: 'Center'.locale(),
            value: 'Center',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_center'
        },
        {
            text: 'Right'.locale(),
            value: 'Right',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_right'
        }],
		hType: null
    },
    align: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-button_align',
        text: 'Align'.locale(),
        type: 'menu',
        values: [{
            text: 'Left'.locale(),
            value: 'Left',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_left'
        },
        {
            text: 'Center'.locale(),
            value: 'Center',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_center'
        },
        {
            text: 'Right'.locale(),
            value: 'Right',
            icon: '/sistema/images/blank.gif',
            iconClassName: 'toolbar-label_right'
        }],
		hType: null
    },
    styles: {
        icon: '/sistema/images/blank.gif',
        iconClassName: 'toolbar-themes',
        text: 'Themes'.locale(),
        type: 'handler',
        handler: openStyleMenu,
		hType: null
    }
};
var tips = {
    labelAlign: {
        title: 'Label Align'.locale(),
        tip: 'Align question label'.locale()
    },
    required: {
        title: 'Require'.locale(),
        tip: 'Require completing question'.locale()
    },
    size: {
        title: 'Size'.locale(),
        tip: 'Set number of characters users can enter'.locale()
    },
    validation: {
        title: 'Validation'.locale(),
        tip: 'Validate entry format'.locale()
    },
    maxsize: {
        title: 'Max Size'.locale(),
        tip: 'Maximum allowed characters for this field'.locale()
    },
    maxFileSize: {
        title: 'Max File Size'.locale(),
        tip: 'Maximum file size allowed. Defined as Kilo Bytes. Keep in mind that 1024 KB equals to 1MB'
    },
    description: {
        title: 'Hover Text'.locale(),
        tip: 'Show description about question'.locale()
    },
    styles: {
        title: 'Themes'.locale(),
        tip: 'Apply nice styles to your form'.locale()
    },
    font: {
        title: 'Font'.locale(),
        tip: 'Change font style'.locale()
    },
    fontsize: {
        title: 'Font'.locale(),
        tip: 'Change font size'.locale()
    },
    fontcolor: {
        title: 'Font Color'.locale(),
        tip: 'Change font color'.locale()
    },
    background: {
        title: 'Background'.locale(),
        tip: 'Change form background color'.locale()
    },
    formWidth: {
        title: 'Form Width'.locale(),
        tip: 'Resize form width'.locale()
    },
    labelWidth: {
        title: 'Label Width'.locale(),
        tip: 'Resize question label width'.locale()
    },
    alignment: {
        title: 'Alignment'.locale(),
        tip: 'Align questions and answers'.locale()
    },
    emails: {
        title: 'Emails'.locale(),
        tip: 'Send notification and confirmation emails on submissions'.locale()
    },
    thankurl: {
        title: 'Thank You URL'.locale(),
        tip: 'Redirect user to a page after submission'.locale()
    },
    share: {
        title: 'Embed Form'.locale(),
        tip: 'Add form to your website or send to others'.locale()
    },
    properties: {
        title: 'Preferences'.locale(),
        tip: 'Update Form Settings'.locale()
    },
    cond: {
        title: 'Conditions'.locale(),
        tip: 'Setup Conditional Fields'.locale()
    },
    cols: {
        title: 'Columns'.locale(),
        tip: 'Width of textarea'.locale()
    },
    rows: {
        title: 'Rows'.locale(),
        tip: 'Number of lines on textarea'.locale()
    },
    defaultValue: {
        title: 'Default Value'.locale(),
        tip: 'Pre-populate a value'.locale()
    },
    special: {
        title: 'Special Options'.locale(),
        tip: 'Collection of predefined values to be used on your form. Such as <u>Countries</u>.'.locale()
    },
    hint: {
        title: 'Input Hint'.locale(),
        tip: 'Show an example in gray'.locale()
    },
    selected: {
        title: 'Selected'.locale(),
        tip: 'Default selected answer'.locale()
    },
    allowMinus: {
        title: 'Allow Negatives'.locale(),
        tip: 'Allows user to select or enter negative values'.locale()
    },
    addAmount: {
        title: 'Stepping'.locale(),
        tip: 'Defines increase/descrease amount'.locale()
    },
    maxValue: {
        title: 'Maximum Value'.locale(),
        tip: 'When you set this value, it won\'t let users to select more than this number'.locale()
    },
    minValue: {
        title: 'Minimum Value'.locale(),
        tip: 'When you set this value, it won\'t let users to select less than this number'.locale()
    },
    spreadCols: {
        title: 'Spread To Columns'.locale(),
        tip: 'Spread inputs into multiple columns. Useful if you have lots of options.'.locale()
    },
    sendpostdata: {
        title: 'Send Post Data'.locale(),
        tip: 'When you have a submission, entry data will be posted to the thank you page.'.locale()
    },
    options: {
        title: 'Options'.locale(),
        tip: 'Users can choose from these options'.locale()
    },
    headerType: {
        title: 'Heading Type'.locale(),
        tip: 'Size of heading'.locale()
    },
    subHeader: {
        title: 'Sub Header'.locale(),
        tip: 'Text below heading'.locale()
    },
    allowOther: {
        title: 'Allow Other'.locale(),
        tip: 'Let users type a text'.locale()
    },
    extensions: {
        title: 'Extensions'.locale(),
        tip: 'Allowed file types'.locale()
    },
    text: {
        title: 'Text'.locale(),
        tip: 'Submit button text'.locale()
    },
    buttonAlign: {
        title: 'Button Align'.locale(),
        tip: 'Align submit button to left, center or right'.locale()
    },
    clear: {
        title: 'Reset Button'.locale(),
        tip: 'Show a clear button or not.'.locale()
    },
    print: {
        title: 'Print Button'.locale(),
        tip: 'Show a print button or not.'.locale()
    },
    width: {
        title: 'Width'.locale(),
        tip: 'Change width'.locale()
    },
    highlightLine: {
        title: 'Hightlight Effect'.locale(),
        tip: 'Enables/Disables the yellow background effect on focused inputs'.locale()
    },
    lineSpacing: {
        title: 'Question Spacing'.locale(),
        tip: 'Defines the distance between question lines. Make them closer or separate them apart.'.locale()
    },
    status: {
        title: 'Form Status'.locale(),
        tip: 'Close form to reject further submissions.'
    },
    injectCSS: {
        title: 'Inject Custom CSS'.locale(),
        tip: '<br>' + 'Add your own CSS code to your form. You can change every aspect of the form by using CSS codes. For example:'.locale() + '<br><pre><code>.form-line-active {\n  background:lightblue;\n  color:#000000;\n}\n</code></pre>' + 'will change the selected line\'s background color on the live form.'.locale() + '<br><br>' + 'Using Firebug or similar tools will help you identify class names and defined styles.'.locale()
    }
};
var control_tooltips = {
    "control_text": {
        tip: 'Add HTML text into your form.'.locale()
    },
    "control_head": {
        tip: 'Add headings to indicate what the section below is about.'.locale()
    },
	 "control_paragraph": {
        tip: 'Add paragraph to the user form.'.locale()
    },
    "control_textbox": {
        tip: 'Text inputs to add single line of text .'.locale()
    },
    "control_textarea": {
        tip: 'When you need a longer text entry.'.locale()
    },
    "control_dropdown": {
        tip: 'Let users select one of the options'.locale()
    },
    "control_checkbox": {
        tip: 'Allows multiple selections.'.locale()
    },
    "control_radio": {
        tip: 'Allows user to choose only one option.'.locale()
    },
    "control_datetime": {
        tip: 'Ask date and time values in your form.'.locale()
    },
    "control_fileupload": {
        tip: 'Let users send you photos or any other kind of files.'.locale()
    },
    "control_button": {
        tip: 'Users click on buttons to submit a completed form.'.locale()
    },
    "control_passwordbox": {
        tip: 'Use this to ask for passwords in your form.'.locale()
    },
    "control_hidden": {
        tip: 'Hidden field is not seen but submitted with the form nonetheless.'.locale()
    },
    "control_image": {
        tip: 'Add an image for your form. ie. Your company logo'.locale()
    },
    "control_captcha": {
        tip: 'Captcha prevents spam submissions.'.locale()
    },
    "control_autocomp": {
        tip: 'Helps user to pick the exact value.'.locale()
    },
    "control_rating": {
        tip: 'When you want to receive ratings, as stars, lightbulbs etc.'.locale()
    },
    "control_scale": {
        tip: 'Allows user to give points based on a scale.'.locale()
    },
    "control_slider": {
        tip: 'Allows user to visually select a number within a range.'.locale()
    },
    "control_spinner": {
        tip: 'Makes it easier to submit numbers.'.locale()
    },
    "control_range": {
        tip: 'Allow user to define a number range.'.locale()
    },
    "control_grading": {
        tip: 'Allows user to select a total value into options as a grade.'.locale()
    },
    "control_matrix": {
        tip: 'Allows users to select multiple values for multiple options.'.locale()
    },
    "control_collapse": {
        tip: 'Hides a section of the form. Split your form into expandable parts'.locale()
    },
    "control_pagebreak": {
        tip: 'Splits your form into pages. Works best with a heading.'.locale()
    },
    "control_fullname": {
        tip: 'Makes sure user enters his/her name in a specified format.'.locale()
    },
    "control_location": {
        tip: 'Allows users to select their country then automatically populates states and cities for that selection.'.locale()
    },
    "control_address": {
        tip: 'Allows users to enter their address in a correct format.'.locale()
    },
    "control_email": {
        tip: 'Helps users to enter their e-mail correctly.'.locale()
    },
    "control_number": {
        tip: 'Helps users to enter a number correctly.'.locale()
    },
    "control_phone": {
        tip: 'Helps users to enter a phone number in a correct format.'.locale()
    },
	"control_phonenumber":{
		tip: 'Helps users to enter a phone number in a correct format.'.locale()		
	},
    "control_birthdate": {
        tip: 'Helps users to pick any date easily.'.locale()
    },
    "control_payment": {
        tip: 'Allows you to create offline payment option.'.locale(),
        image: 'control_payment.png'
    },
    "control_paypal": {
        tip: 'Allows you to collect payments through PayPal.'.locale(),
        image: 'control_payment.png'
    },
    "control_paypalpro": {
        tip: 'Allows you to collect payments through credit cards with PayPal Pro.'.locale(),
        image: 'control_payment.png'
    },
    "control_authnet": {
        tip: 'Allows you to collect payments through credit cards with Authorize.Net.'.locale(),
        image: 'control_payment.png'
    },
    "control_googleco": {
        tip: 'Allows you to collect payments through Google Checkout.'.locale(),
        image: 'control_payment.png'
    },
    "control_onebip": {
        tip: 'Allows you to collect payments through mobile phones with 1Bip.'.locale(),
        image: 'control_payment.png'
    },
    "control_worldpay": {
        tip: 'Allows you to collect payments through WorldPay.'.locale(),
        image: 'control_payment.png'
    },
    "control_2co": {
        tip: 'Allows you to collect payments through 2CheckOut.'.locale(),
        image: 'control_payment.png'
    },
    "control_clickbank": {
        tip: 'Allows you to collect payments through ClickBank.'.locale(),
        image: 'control_payment.png'
    },
	 "control_money": {
        tip: 'Text inputs box for Money .'.locale()
    },
};;
function makeQuestionName(text, id) {
    var name = text.stripTags().replace('&nbsp;', '');
    var tokens = name.split(/\s+/);
    name = ((tokens["1"]) ? tokens["0"].toLowerCase() + (tokens["1"].toLowerCase()).capitalize() : tokens["0"].toLowerCase()).fixUTF();
    name = name.replace(/\W/gim, '');
    return fixQuestionName(name, id);
}
var NgForms = {
    totalCounter: function (prices) {}
};
var htmlCommentMatch = /\<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)\>/gim;

function fixQuestionName(name, id) {
    if (name.empty()) {
        return id;
    }
    var allProp = getAllProperties();
    var allNames = $H(allProp).map(function (pair) {
        if (pair.key.match('_name')) {
            return pair.value;
        }
    }).compact();
    if (allNames.include(name)) {
        return name + id;
    }
    return name;
}

function createInput(type, id, prop, noreplace,elemOldName) {
	
    var ne = getElement('div');
    if (!noreplace) {
        ne.className = "question-input";
    }
	
    var el = BuildSource.createInputHTML(type, id, prop, ne,undefined,elemOldName);
	
    ne.insert(el.html);
    ne.observe('on:render', function () {});
    prop = el.prop;
    prop.getItem = function (name) {
        return this[name].value;
    }.bind(prop);
    var name = prop.name ? prop.name.value : "";
    if (!prop.name) {
        name = makeQuestionName(prop.text.value, id);
        prop.name = {
            hidden: true,
            value: name
        };
    }
    $(ne).store("properties", prop);
    ne.getProperty = function (key) {
        try {
            return prop[key] ? prop[key].value : false;
        } catch (e) {
            return false;
        }
    };
    ne.setProperty = function (key, value) {
        if (value === undefined) {
            value = "";
        }
        var pr = prop;
        if (key == 'name' && pr[key].value) {
            fixQuestionNamesInEmails(pr[key].value, value);
        }
        if (['text', 'options', 'items', 'description', 'subHeader'].include(key)) {
            value = value.stripScripts();
				
        }
        if (key == 'text') {
            value = value.replace(htmlCommentMatch, '');
            value = BuildSource.cleanWordFormat(value);
        }
        if (!(key in pr)) {
            pr[key] = {
                value: "",
                hidden: true
            };
        }
        BuildSource.config[id + '_' + key] = value;
        pr[key].value = value;
        $(ne).store("properties", pr);
        return value;
    };
    ne.setProperty("qid", id);
    ne.setProperty("type", type);
    return ne;
}

function fixQuestionNamesInEmails(oldName, newName) {
    var emails = form.getProperty('emails');
    $A(emails).each(function (email, i) {
        emails[i].from = email.from ? email.from.replace(new RegExp('\\{' + oldName + '\\}', 'gim'), '{' + newName + '}') : false;
        emails[i].to = email.to ? email.to.replace(new RegExp('\\{' + oldName + '\\}', 'gim'), '{' + newName + '}') : false;
        emails[i].subject = email.subject ? email.subject.replace(new RegExp('\\{' + oldName + '\\}', 'gim'), '{' + newName + '}') : false;
        emails[i].body = email.body ? email.body.replace(new RegExp('\\{' + oldName + '\\}', 'gim'), '{' + newName + '}') : false;
    });
    form.setProperty('emails', emails);
}
BuildSource.subLabel = function (input, label, link, labelName) {
    var htmlFor = "";
    var htmlId = "";
    var html = '<span class="form-sub-label-container">';
    html += input;
    if (label !== undefined && typeof label !== "string" && label.text) {
        htmlId = ' id="sublabel_' + label.id + '"';
        label = label.text;
    }
    html += " " + (link || "") + " ";
    var id = input.match(/.*?id=\"(.*?)\".*?/);
    if (id) {
        htmlFor = ' for="' + id[1] + '"';
    }
    html += '<label class="form-sub-label"' + htmlFor + htmlId + '>' + (label || "&nbsp;&nbsp;&nbsp;") + '</label>';
    html += '</span>';
    return html;
};
BuildSource.escapeValue = function (str) {
    return str.replace(/\"/gim, '&quot;');
};
BuildSource.makeQuestionName = function (text) {
    var name = text.replace('&nbsp;', '');
    var tokens = name.split(/\s+/);
    name = this.fixUTF((tokens["1"]) ? tokens["0"].toLowerCase() + this.capitalize(tokens["1"].toLowerCase()) : tokens["0"].toLowerCase());
    name = name.replace(/\W/gim, '');
    return name;
};
/*Element creation for : list div*/
BuildSource.createInputHTML = function (type, id, prop, passive, forFacebook,elemOldName) {
	//passive.setAttribute('style','border:solid 1px red');
	//alert(passive)
	//alert(type +"="+ id+"="+ prop.text.value+"="+ passive+"="+forFacebook)
    var html = "";	
    var script = "";
	var qname ;
	/*Added by manish for name in edit mode*/
	
	//alert(elemOldName)
	if(elemOldName===undefined)
	{
		
		if(EDIT_MODE)
			{
				var name = id+'_name'
				for(i in edit_prop)
				{
					if(i==name)	
					{
						qname = edit_prop[i]
					}
				}
				
			}
			else 
			{	

				if(prop.name && prop.name.value.length>2)
					qname = prop.name.value
				else					
					qname = "q" + id + '_' + this.makeQuestionName(prop.text.value);
				
				
			}
	}else{
		/*Question name for secondary form*/
		qname = elemOldName.split('__')[0]
		/* 	Disabled the select database option,Becuase 1 field added from an selected database */
		$('related_database').disabled = "disabled"
		Event.stopObserving('view_field_link', 'click');
		if ($('change_link'))
			$('change_link').hide();
		
	}
	//alert(elemOldName)
	
	if(typeof qname === 'undefined')
	{


		qname = "q" + id + '_' + this.makeQuestionName(prop.text.value);
		 if (prop.name && prop.name.value) {
       		qname = "q" + id + '_' + prop.name.value;
   		 }
		 
	}
   
	//alert(qname)
    var sublabel = function (key) {
        if (prop.sublabels && prop.sublabels.value[key]) {
            return {
                text: prop.sublabels.value[key],
                id: key
            };
        }
        return "";
    }
	
    var qid = "input_" + id;
    var classNames = {
        textbox: "form-textbox",
        password: "form-password",
        radio: "form-radio",
        checkbox: "form-checkbox",
        textarea: "form-textarea",
        upload: "form-upload",
        dropdown: "form-dropdown",
        list: "form-list"
    };
	
    switch (type) {
    case "control_text":
        html = '<div id="text_' + id + '" class="form-html">' + this.htmlDecode(this.stripslashes(prop.text.value)) + '</div>';
        if (passive) {}
        break;
		

    case "control_head":
	
        var head = 'h2';
		var styleHeadFont='';
		var headFontSize = 'font-size:18px;font-weight:bold;'
		//alert(1)
        if (prop.headerType.value == "Large") {
            head = 'h1';
			headFontSize = 'font-size:28px;font-weight:bold;'
        } else if (prop.headerType.value == "Small") {
            head = 'h3';
			headFontSize = 'font-size:14px;font-weight:bold;'
        }
		
        html += '<div class="form-header-group">';
        html += "<div style=\"float:left;width:100%\"><" + head;
        html += ' id="header_' + id + '" style="'+ headFontSize +'"';
        if (forFacebook) html += ' style="font-size:24px;"';
        html += ' class="form-header">';
        html += prop.text.value;
        html += '</' + head + '></div>';
		
        if (prop.subHeader.value && prop.subHeader.value != "Click to edit sub heading...") {
            html += ' <div id="subHeader_' + id + '"  class="form-subHeader" style="float:left;width:100%">' + prop.subHeader.value + '</div>';
        }
        html += "</div>";
        if (passive) {
			//passive.setAttribute('style','border:solid 1px red')
            Element.observe(passive, 'on:render', function () {
                if ($('subHeader_' + id)) {/*
                    Protoplus.ui.editable('subHeader_' + id, {
                        className: 'subHeader-edit',
                        onEnd: function (a, b, old, val) {
                            val = val.strip();
                            passive.setProperty("subHeader", val);
                            if (old != val) {
                                onChange("Label changed from: '" + old + "' to: '" + val + "'");
                            }
                        }
                    });
                */}
              /*  Protoplus.ui.editable('header_' + id, {
                    className: 'header-edit',
                    onKeyUp: function (e) {
						
                        var old = $('form-title').innerHTML;
                        if (form.getProperty('title') == 'Untitled Form'.locale() || form.getProperty('title') == 'Title Me'.locale()) {
                            $('form-title').update(e.target.value);
                        }
                    },
                    onEnd: function (a, b, old, val) {
                        if (form.getProperty('title') == 'Untitled Form'.locale() || form.getProperty('title') == 'Title Me'.locale()) {
                            form.setProperty('title', val);
                        }
                        val = val.strip();
                        passive.setProperty("text", val);
                        if (old != val) {
                            onChange("Label changed from: '" + old + "' to: '" + val + "'");
                        }
                    }
                });*/
            });
        }
        break;
	case "control_paragraph":
		
      var head = 'p';
		var styleHeadFont='font-size:16px';
		
        if (prop.headerType.value == "Large") {
            //head = 'h1';
			styleHeadFont ='font-size:18px'
        } else if (prop.headerType.value == "Small") {
           // head = 'h3';
			styleHeadFont ='font-size:14px'
        }
		
        html += '<div class="form-header-group">';
        html += "<div style=\"float:left;width:100%\"><" + head;
        html += ' id="header_' + id + '" style="'+ styleHeadFont +'"';
        if (forFacebook) html += ' style="font-size:24px;"';
		
        html += ' class="form-header">';
        html += prop.subHeader.value;
        html += '</' + head + '></div>';
		
        if (prop.subHeader.value && prop.subHeader.value != "Click to edit sub heading...") {
            html += ' <div id="subHeader_' + id + '"  class="form-subHeader" style="float:left;width:100%;display:none">' + prop.text.value + '</div>';
        }
        html += "</div>";
        
        break;
	case "control_datetime":
	case "control_phonenumber":	
	case "control_money":	
	case "control_passwordbox":
	case "control_hidden":
	case "control_autocomp":
	case "control_textbox":
	case "control_email":
	case "control_number":
	var maxCharValue=''
	var calederPath = 'sistema/stylesheets/builder/themes/'+objectCollection.theme[$('stage').getProperty('theme')]+'/calendar.png'
        var inputType = "text";
        if (type == "control_passwordbox") {
            inputType = "password";
        } else if (type == "control_hidden") {
            inputType = "hidden";
        } else if (type == "control_number") {
            inputType = "text";
        } else if (type == "control_email") {
            inputType = "email";
        } 
			
		
		//alert(classNames.textbox)+\
		var text_align_right ='';
		var hiddenHtml ='';
		var add_validation_class = Array();
		//var filedMaskFunc =''
		//var functionName =''
		if(type == "control_datetime")
		{
			
			
			 if (prop.defaultTime.value == 'Yes') 
			 {

				prop.defaultValue.value =  new Date(prop.defaultValueBackup.value.toString()).formatDateByMask(prop.format.value.toLowerCase())


			 }
			
			
			 var icon = '<div style="height:15px;float:left"><img alt="' + 'Pick a Date'.locale() + '" id="' + qid + '_pick" src="' +this.HTTP_URL+calederPath+'" align="absmiddle" /><div>';		 
		
		}
		
		
		if(type =="control_number" || type == "control_money" || type == "control_phonenumber" || type == "control_datetime")
		{
			
			// prop.currencyFormat for identify the money field
			if((prop.fieldMask && prop.fieldMask.value) || (prop.currencyFormat && prop.decimalPosition && prop.decimalPosition.value))
			{
				var decimal_pos ='';
				if(prop.fieldMask.value!=0)
					add_validation_class.push('mask')
			}
			if(prop.startRange && prop.endRange && prop.startRange.value && prop.endRange.value)
			{
				
				if (type == "control_datetime") 
				{
					if(prop.startRange.value.length<15)
					{
						tmpSDate = getStanderdDate(prop.startRange.value,"dd/mm/yyyy")
						tmpEDate = getStanderdDate(prop.endRange.value,"dd/mm/yyyy")
					}
					else	
					{
							tmpSDate = (new Date(prop.startRange.value)).formatDateByMask("dd/mm/yyyy")
							tmpEDate = (new Date(prop.endRange.value)).formatDateByMask("dd/mm/yyyy")
					}
					
					
					var cond = tmpSDate.toString() +'**'+ tmpEDate.toString()				
				}
				else
					var cond = prop.startRange.value +'**'+prop.endRange.value
					
				hiddenHtml ='<input type="hidden" id="'+ qid +'_hidden" value="'+cond+'" />';
				add_validation_class.push('range')
			}
			if(prop.numberTextAligned && prop.numberTextAligned.value=="Yes")	
			{
				text_align_right +=' text_align_right'	
			}
		}
		
		if(prop.currencyFormat!== undefined && parseInt(prop.currencyFormat.value))
			{
				
				html ='<span class="currecny-label"> &nbsp;'+CURRENCIES_SIGN[prop.currencyFormat.value]+'&nbsp;</span>';;	
			}
        html += '<input type="' + inputType + '" ';
        html += 'class="' + this.addValidation(classNames.textbox, prop,add_validation_class) + text_align_right + '"';
        html += 'id="' + qid + '" ';
        html += 'name="' + qname + '" ';
        if (type == 'control_autocomp') {
            html += 'autocomplete="off" ';
        }
        if (prop.size) {
            html += 'size="' + prop.size.value + '" ';
		 if(prop.size.value=='20'){
		    html += 'style= "width:107px;"';
		 }else if(prop.size.value=='30'){
		 	html += 'style= "width:250px;"';
		 }else{
			 	html += 'style= "width:300px;"';
		 }
			
			
        }
		
		if(type == "control_datetime" )
		{
			if(prop.defaultValue && prop.defaultValue.value && prop.defaultTime && prop.defaultTime.value=="Yes")
				html += ' value="' + prop.defaultValue.value + '" ';
			
		}
		else
		html += ' value="' + prop.defaultValue.value + '" ';
		
       /* if (prop.defaultValue && prop.defaultValue.value) {
			if(type == "control_datetime" )
			{
				
				if(prop.defaultTime && prop.defaultTime.value=="Yes")	
            		html += ' value="' + prop.defaultValue.value + '" ';
			}
			else
			{
				 html += ' value="' + prop.defaultValue.value + '" ';
			}
			
        }*/
		  
        if (prop.maxsize && prop.maxsize.value && prop.maxsize.value > 0) {
            html += ' maxlength="' + prop.maxsize.value + '" ';
				maxCharValue ='<span class="currecny-label"> &nbsp;'+prop.maxsize.value.toString()+'&nbsp;</span>';;	
        }
		
        html += ' />';
		html+=maxCharValue
		html += hiddenHtml;
		
		if(type == "control_datetime")
		{
			
			
			 var icon = '<div style="height:15px;float:left"><img alt="' + 'Pick a Date'.locale() + '" id="' + qid + '_pick" src="' + this.HTTP_URL + calederPath+' " align="absmiddle" /></div>';		 
			html += this.subLabel(icon);
		}
		
		if(prop.dulicate && prop.dulicate.value == "Yes")
			{
					
				html += '<label id="input_'+id+'_label"></label>';

				
			}
			
        if (type == "control_hidden" && passive) {
            Element.observe(passive, 'on:render', function () {
                Element.setOpacity('hidden_' + id, 0.8);
            });
            html = '<input type="text" readonly="readonly" value="' + prop.defaultValue.value + '" style="border:1px dashed #ccc" id="hidden_' + id + '" />';
        } else if (type == "control_hidden") {
            html = '<input type="hidden" class="form-hidden" value="' + prop.defaultValue.value + '" id="' + qid + '" name="' + qname + '" />';
        }
        if (type =="control_email" 	&& prop.hint && prop.hint.value && passive) {
			
            Element.observe(passive, 'on:render', function () {
															
                Protoplus.ui.hint(qid, prop.hint.value);
            });
        } else if (prop.hint && prop.hint.value == "") {
            prop.hint.value = " ";
        }
		
        if (prop.subLabel && prop.subLabel.value) {
            html = this.subLabel(html, prop.subLabel.value);
        }
		
        if (type == 'control_autocomp') {
            script += "      NgForms.autoCompletes['" + qid + "'] = '" + (prop.items.value.replace(/\'/gim, "\\'")) + "';\n";
            if (passive) {
                Element.observe(passive, 'on:render', function () {
                    var img = getElement('img');
                    img.src = '/sistema/images/builder/dropdown-properties.png';
                    img.className = 'dropdown-edit';
                    img.align = 'absmiddle';
                    img.onclick = function () {
                        $('button_' + id + '_items').run('mousedown');
                    };
                    passive.appendChild(img);
                });
            }
        }
		if (type == 'control_datetime')
		{
			var isDefaultDate = false
			
			if(prop.defaultValue && prop.defaultValue.value && prop.defaultTime && prop.defaultTime.value=="Yes")
				isDefaultDate  = true
				
				script += 'NgForms.setCalendar("' + id + '",{format:"' + prop.format.value.toString().toLowerCase()+'",isDefaultDate:'+ (isDefaultDate)+'});\n';
			
		
		
			
		}
		//alert(this)
		
        break;
    case "control_textarea":
        html = '<textarea ';
        html += 'id="' + qid + '" ';
		var widthClass = 'text-area-medium'

		if(prop.size.value == "20")
			widthClass = ' text-area-small'
		else if (prop.size.value == "40")
			widthClass = ' text-area-large'
		
        html += 'class="' + this.addValidation(classNames.textarea, prop) + ' '+widthClass+'" ';
        html += 'name="' + qname + '" ';
        html += 'cols="' + prop.cols.value + '" ';
        html += 'rows="' + prop.rows.value + '" ';
        if (prop.maxsize && prop.maxsize.value && prop.maxsize.value > 0) {
            html += ' onkeypress ="return imposeMaxLength(this,event,' + prop.maxsize.value + ')" ';
			html += ' onkeyup ="return removeExtraChar(this,event,' + prop.maxsize.value + ')" ';
        }
        html += '>' + prop.defaultValue.value + '</textarea>';
		var maxCharValue ='';
		if (prop.maxsize && prop.maxsize.value && prop.maxsize.value > 0) {
           
				maxCharValue ='<span class="currecny-label"> &nbsp;'+prop.maxsize.value.toString()+'&nbsp;</span>';;	
        }
		html +=maxCharValue;
		
        if (prop.entryLimit && prop.entryLimit.value) {
            var l = prop.entryLimit.value.split('-');
            if (l[0] != 'None' && l[1] > 1) {
                var textarea = html;
                html = '<div class="form-textarea-limit"><span>';
                html += textarea;
                html += '<div class="form-textarea-limit-indicator">';
                if (prop.subLabel && prop.subLabel.value) {
                    html += '<label for="' + qid + '" style="float:left">' + prop.subLabel.value + '</label>';
                }
                html += '<span type="' + l[0] + '" limit="' + l[1] + '" id="' + qid + '-limit">0/' + l[1] + '</span>';
                html += '</div>';
                html += '</span></div>';
            } else if (prop.subLabel && prop.subLabel.value) {
                html = this.subLabel(html, prop.subLabel.value);
            }
        } else if (prop.subLabel && prop.subLabel.value) {
            html = this.subLabel(html, prop.subLabel.value);
        }
        break;
    case "control_dropdown":
        var dropwidth = "";
        if (prop.width && (prop.width.value != 'auto' || !prop.width.value)) {
            dropwidth = ' style="width:' + parseInt(prop.width.value, 10) + 'px"';
        }
        var cl = classNames.dropdown;
        if (prop.size.value > 1) {
            cl = classNames.list;
        }
        html = '<select class="' + this.addValidation(cl, prop) + '"' + dropwidth + ' id="' + qid + '" name="' + qname;
        if (prop.size.value > 1) {
            html += '[]" size="' + prop.size.value + '" ';
        }
        html += '" >';
        opts = prop.options.value.split("|");
        html += '<option></option>';
        if (prop.special.value != "None") {
            prop.options.disabled = true;
            opts = this.deepClone(special_options[prop.special.value].value);
        } else {
            prop.options.disabled = false;
        }
        var ddop = "";
        var groupOpen = false;
        for (var d = 0; d < opts.length; d++) {
            var selec = (prop.selected.value == opts[d]) ? ' selected="selected"' : '';
            var option_value = opts[d];
            var option_group = option_value.match(/^\[\[(.*?)\]\]$/);
            if (option_group) {
                if (groupOpen) {
                    ddop += '</optgroup>';
                }
                ddop += '<optgroup label="' + this.escapeValue(option_group[1]) + '">';
                groupOpen = true;
            } else {
                ddop += '<option' + selec + ' value="' + this.escapeValue(option_value) + '">' + option_value + '</option>';
            }
        }
        if (groupOpen) {
            ddop += '</optgroup>';
        }
        if (prop.special.value != "None" && !(prop.special.value in optionsCache)) {
            optionsCache[prop.special.value] = ddop;
        }
        html += ddop;
        html += '</select>';
        if (prop.subLabel && prop.subLabel.value) {
            html = this.subLabel(html, prop.subLabel.value);
        }
        if (passive) {
			/*Added by manish :show the icon on the right of the dropdown*/
           /* Element.observe(passive, 'on:render', function () {
                var img = getElement('img');
                img.src = '/sistema/images/builder/dropdown-properties.png';
                img.className = 'dropdown-edit';
                img.align = 'absmiddle';
                img.onclick = function () {
                    if ($('button_' + id + '_options').disabled) {
                        $('button_' + id + '_special').run('mousedown');
                    } else {
                        $('button_' + id + '_options').run('mousedown');
                    }
                };
                passive.appendChild(img);
            });*/
        }
        break;
    case "control_checkbox":
    case "control_radio":
	
        opts = prop.options.value.split("|");
        if (prop.special.value != "None") {
            opts = this.deepClone(special_options[prop.special.value].value);
        }
        var inputType = type.replace('control_', '');
		
        if (inputType == "checkbox") {
            qname += "[]";
        }
		
        var col = (prop.spreadCols.value > 1) ? prop.spreadCols.value : 0;
        var colCount = 0;
	
		if (col==0){
			html += '<div class="' +'form-single-column' + '">';	
		}else{
			 html += '<div class="' + (col < 3 ? 'form-two-column' : 'form-multiple-column') + '">';			
		}
       		 
       //html += '<div class="' + (col < 2 ? 'form-single-column' : 'form-multiple-column') + '">';	  Old line removed at 8june by neelesh
		
		var chk_selected = prop.selected.value.split("|")
		//alert(chk_selected)
        for (var r = 0; r < opts.length; r++) {
            var strippedVal = opts[r].strip();
			
            var rd_selected = (prop.selected.value.strip() == strippedVal) ? 'checked="checked"' : '';
			/*Added by manish*/
			rd_selected = chk_selected.include(strippedVal) ? 'checked="checked"' : ''
            var rinp = '<input type="' + inputType + '" class="' + this.addValidation(classNames[inputType], prop) + '" id="' + qid + '_' + r + '" name="' + qname + '" ' + rd_selected + ' value="' + this.escapeValue(strippedVal) + '" />';
            var rlab = '<label ' + (passive ? 'id="label_' + qid + '_' + r + '"' : 'for="' + qid + '_' + r + '"') + '>' + strippedVal + '</label>';
            var clear = '';
            colCount++;
            if (colCount > col) {
                clear += ' style="clear:left;"';
                colCount = 1;
            }
            html += '<span class="form-' + inputType + '-item"' + clear + '>' + rinp + rlab + '</span>';
            html += '<span class="clearfix"></span>';
        }
        if (prop.allowOther && prop.allowOther.value == "Yes") {
            var otherRadio, otherInput;
            html += '<span class="form-radio-item" style="clear:left">';
            html += '<input type="radio" class="form-radio-other ' + this.addValidation(classNames.radio, prop) + '" name="' + qname + '" id="other_' + id + '" />';
            html += '<input type="text" class="form-radio-other-input" name="' + qname + '[other]" size="15" id="' + qid + '" disabled="disabled" />';
            html += '<br />';
            html += '</span>';
            if (passive) {
                Element.observe(passive, 'on:render', function () {
                    Protoplus.ui.hint(qid, 'Other');
                });
            }
        }
        html += '</div>';
        if (passive) {
            Element.observe(passive, 'on:render', function () {
               setOptionsEditable(id, inputType);
            });
        }
        break;
    case "control_datetime_old":
	
        var icon = '<img alt="' + 'Pick a Date'.locale() + '" id="' + qid + '_pick" src="' + this.HTTP_URL + 'sistema/images/builder/calendar.png" align="absmiddle" />';
        var date = new Date();
        var month = this.addZeros(date.getMonth() + 1, 2);
        var day = this.addZeros(date.getDate(), 2);
        var year = date.getYear() < 1000 ? date.getYear() + 1900 : date.getYear();
        var hour = this.addZeros(date.getHours(), 2);
        var min = this.addZeros(date.getMinutes(), 2);
        var noDefault = "";
        if (prop.defaultTime.value != 'Yes') {
            month = day = year = hour = min = "";
            noDefault = "noDefault ";
        }
        var dd = '<input class="' + noDefault + this.addValidation(classNames.textbox, prop) + '" id="day_' + id + '" name="' + qname + '[day]" type="text" size="2" maxlength="2" value="' + day + '" />';
        var mm = '<input class="' + this.addValidation(classNames.textbox, prop) + '" id="month_' + id + '" name="' + qname + '[month]" type="text" size="2" maxlength="2" value="' + month + '" />';
        var yy = '<input class="' + this.addValidation(classNames.textbox, prop) + '" id="year_' + id + '" name="' + qname + '[year]" type="text" size="4" maxlength="4" value="' + year + '" />';
        var hh = '<input class="' + this.addValidation(classNames.textbox, prop) + '" id="hour_' + id + '" name="' + qname + '[hour]" type="text" size="2" maxlength="2" value="' + hour + '" />';
        var ii = '<input class="' + this.addValidation(classNames.textbox, prop) + '" id="min_' + id + '" name="' + qname + '[min]" type="text" size="2" maxlength="2" value="' + min + '" />';
        var ampm = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" id="ampm_' + id + '" name="' + qname + '[ampm]"><option value="AM">AM</option><option value="PM">PM</option></select>';
        var at = 'at';
        if (prop.allowTime.value != 'Yes') {
            at = '';
        }
     /*   dd = this.subLabel(dd, sublabel('day'), '-');
        mm = this.subLabel(mm, sublabel('month'), '-');
        yy = this.subLabel(yy, sublabel('year'), at);
        hh = this.subLabel(hh, sublabel('hour'), '/');
        ii = this.subLabel(ii, sublabel('minutes'));*/
        ampm = this.subLabel(ampm, '');
        if (prop.format.value == "mmddyyyy") {
            html += mm;
            html += dd;
        } else {
            html += dd;
            html += mm;
        }
        html += yy;
        if (prop.allowTime.value == 'Yes') {
            html += hh;
            html += ii;
            if (prop.timeFormat.value == "AM/PM") {
                html += ampm;
            }
        }
        html += this.subLabel(icon);
		
        if (!passive) {
            script += '      NgForms.setCalendar("' + id + '");\n';
        }
        break;
    case "control_fileupload":
        html += '<input size="'+prop.size.value +'" class="' + this.addValidation(classNames.upload, prop) + '" type="file" name="' + qname + '" id="' + qid + '"';
        html += ' file-accept="' + prop.extensions.value + '"';
        html += ' file-maxsize="' + prop.maxFileSize.value + '"';
		       
        html += ' /> up to 2 MB';
        if (prop.subLabel && prop.subLabel.value) {
            html = this.subLabel(html, prop.subLabel.value);
        }
        break;
    case "control_rating":
        var stars = "stars";
        switch (prop.starStyle.value) {
        case "Hearts":
            stars = "hearts";
            break;
        case "Stars":
            stars = "stars";
            break;
        case "Stars 2":
            stars = "stars2";
            break;
        case "Lightnings":
            stars = "lightnings";
            break;
        case "Light Bulps":
            stars = "bulps";
            break;
        case "Shields":
            stars = "shields";
            break;
        case "Flags":
            stars = "flags";
            break;
        case "Pluses":
            stars = "pluses";
            break;
        default:
            stars = "stars";
        }
        html += '<div id="' + qid + '" name="' + qname + '">';
        html += '<select name="' + qname + '">';
        for (var s = 1; s <= prop.stars.value; s++) {
            html += '<option value="' + s + '">' + s + '</option>';
        }
        html += '</select>';
        html += '</div>';
        script += "      $('" + qid + "').rating({stars:'" + prop.stars.value + "', inputClassName:'" + this.addValidation(classNames.textbox, prop) + "', imagePath:'" + this.HTTP_URL + "images/" + stars + ".png', cleanFirst:true, value:'" + prop.defaultValue.value + "'});\n";
        if (passive) {
            Element.observe(passive, 'on:render', function () {
                Protoplus.ui.rating(qid, {
                    stars: prop.stars.value,
                    imagePath: "images/" + stars + ".png",
                    cleanFirst: true,
                    value: prop.defaultValue.value
                });
            });
        }
        break;
    case "control_captcha":
	
        if (prop.useReCaptcha.value == 'Yes') {
            if (passive) {
                html += '<img src="/sistema/images/recaptcha-sample.png">';
            } else {
                html += '<script type="text/javascript" src="http://www.google.com/recaptcha/api/js/recaptcha_ajax.js"></script>';
                html += '<div id="recaptcha_' + qid + '"></div>';
                html += '<script type="text/javascript">';
                html += 'Recaptcha.create("6Ld9UAgAAAAAAMon8zjt30tEZiGQZ4IIuWXLt1ky","recaptcha_' + qid + '",{theme: "clean", callback: Recaptcha.focus_response_field});';
                html += '</script>';
            }
        } else {
            html += '<div class="form-captcha">';
            html += '<label for="' + qid + '">';
            if (passive) {
                html += '<img alt="Captcha - Reload if it\'s not displayed" class="form-captcha-image" src="/sistema/images/builder/captcha-02.jpg" width="150" />';
            } else {
                html += '<img alt="Captcha - Reload if it\'s not displayed" id="' + qid + '_captcha" class="form-captcha-image" style="background:url(' + this.HTTP_URL + 'images/loader-big.gif) no-repeat center;" src="' + this.HTTP_URL + 'images/blank.gif" width="150" height="41" />';
            }
            html += '</label>';
            html += '<div style="white-space:nowrap;"><input type="text" id="' + qid + '" name="captcha" style="width:130px;" />';
            if (passive) {
                html += '<img src="/sistema/images/builder/reload.png" alt="Reload" align="absmiddle" style="cursor:pointer" />';
            } else {
                html += '<img src="' + this.HTTP_URL + 'sistema/images/builder/reload.png" alt="Reload" align="absmiddle" style="cursor:pointer" onclick="NgForms.reloadCaptcha(\'' + qid + '\');" />';
                script += "      NgForms.initCaptcha('" + qid + "');\n";
            }
            html += '<input type="hidden" name="captcha_id" id="' + qid + '_captcha_id" value="0">';
            html += '</div>';
            html += '</div>';
			
            script += "      $('" + qid + "').hint('" + "Type the above text".locale() + "');\n";
        }
        break;
    case "control_image":
	
        if (prop.link.value) {
            if (!prop.link.value.match(/^http/)) {
                prop.link.value = "http://" + prop.link.value;
            }
            html += '<a href="' + prop.link.value + '" target="_blank">';
        }
        var imgAlign = '';
        var src = prop.src.value;
        if (this.isSecure && (src.match("http://ngforms.ngprofessionals.com.br") !== null)) {
            src = src.replace("http://ngforms.ngprofessionals.com.br", "https://ngforms.ngprofessionals.com.br");
        }
        html += '<img alt="" ' + imgAlign + ' class="form-image" border="0" src="' + src + '" height="' + prop.height.value + '" width="' + prop.width.value + '" />';
        if (prop.link.value) {
            html += "</a>";
        }
        if (prop.align.value == "Center") {
            html = '<div style="text-align:center;">' + html + '</div>';
        }
        if (prop.align.value == "Right") {
            html = '<div style="text-align:right;">' + html + '</div>';
        }
		
        break;
    case "control_button":
	
        var buttonAlign = 'text-align:' + prop.buttonAlign.value.toLowerCase();

        if (prop.buttonAlign.value.toLowerCase() == 'auto') {
            var pad = 0;
            try {
                pad = parseInt(Utils.getStyleBySelector('.form-label-left').padding, 10);
            } catch (e) {}
            buttonAlign = 'margin-left:' + (parseInt(this.getProperty('labelWidth'), 10) + (pad ? pad * 2 : 6)) + 'px';
        }
			
			/*Overwrited by manish for fixed postion of subbit button*/
			buttonAlign = ''
        html = '<div style="' + buttonAlign + '" class="form-buttons-wrapper submit-button-pos" >';
		
        if (forFacebook) {
            html += '<input id="input_' + id + '" type="submit" value="' + (prop.text.value || 'Submit Form'.locale()) + '" class="form-submit-button">';
        } else {
			
			//alert($('input_submit').value) //prop.text.value 
            html += '<button name ="submitButtonOfForm" id="input_' + id + '" type="submit" class="form-submit-button" >' + ($('input_submit').value|| 'Submit Form'.locale()) + '</button>';
            if (prop.clear.value == "Yes") {
                html += ' &nbsp; <button id="input_reset_' + id + '" type="' + (passive ? 'button' : 'reset') + '" class="form-submit-reset">' + 'Clear Form' + '</button>';
            }
            if (prop.print.value == "Yes") {
                html += ' &nbsp; <button id="input_print_' + id + '" style="margin-left:25px;" class="form-submit-print" type="button" ><img src="' + this.HTTP_URL + 'images/printer.png" align="absmiddle" /> ' + ' Print Form' + '</button>';
            }
        }
        html += '</div>';
        break;
    case "control_slider":
        html += '<input type="range" class="' + this.addValidation(classNames.textbox, prop) + '" id="' + qid + '" name="' + qname + '" />';
        script += "      $('" + qid + "').slider({ width: '" + prop.width.value + "', maxValue: '" + prop.maxValue.value + "', value: '" + prop.defaultValue.value + "'});\n";
        if (passive) {
            Element.observe(passive, 'on:render', function () {
                Protoplus.ui.slider(qid, {
                    width: prop.width.value,
                    maxValue: prop.maxValue.value,
                    value: prop.defaultValue.value,
                    buttonBack: 'url("/sistema/images/ball.png") no-repeat scroll 0px 0px transparent'
                });
            });
        }
        break;
    case "control_spinner":
        html = '<input type="number" id="' + qid + '" name="' + qname + '" />';
        script += "      $('" + qid + "').spinner({ imgPath:'" + this.HTTP_URL + "images/', width: '" + prop.width.value + "', maxValue:'" + this.fixNumbers(prop.maxValue.value) + "', minValue:'" + this.fixNumbers(prop.minValue.value) + "', allowNegative: " + (prop.allowMinus.value == 'Yes' ? 'true' : 'false') + ", addAmount: " + this.fixNumbers(prop.addAmount.value) + ", value:'" + this.fixNumbers(prop.defaultValue.value) + "' });\n";
        if (passive) {
            Element.observe(passive, 'on:render', function () {
                Protoplus.ui.spinner(qid, {
                    imgPath: "/sistema/images/",
                    width: prop.width.value,
                    maxValue: prop.maxValue.value,
                    minValue: prop.minValue.value,
                    allowNegative: (prop.allowMinus.value == 'Yes'),
                    addAmount: prop.addAmount.value,
                    value: prop.defaultValue.value
                });
            });
        }
        break;
    case "control_range":
        html = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="number" id="' + qid + '_from" name="' + qname + '[from]" />', sublabel('from'));
        html += this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="number" id="' + qid + '_to" name="' + qname + '[to]" />', sublabel('to'));
        script += "      $('" + qid + "_to').spinner({ imgPath:'" + this.HTTP_URL + "images/', width: '60', allowNegative: " + (prop.allowMinus.value == 'Yes' ? 'true' : 'false') + ", addAmount: " + this.fixNumbers(prop.addAmount.value) + ", value:'" + this.fixNumbers(prop.defaultTo.value) + "' });\n";
        script += "      $('" + qid + "_from').spinner({ imgPath:'" + this.HTTP_URL + "images/', width: '60', allowNegative: " + (prop.allowMinus.value == 'Yes' ? 'true' : 'false') + ", addAmount: " + this.fixNumbers(prop.addAmount.value) + ", value:'" + this.fixNumbers(prop.defaultFrom.value) + "' });\n";
        if (passive) {
            Element.observe(passive, 'on:render', function () {
                Protoplus.ui.spinner(qid + '_to', {
                    imgPath: "/sistema/images/",
                    width: '60',
                    allowNegative: prop.allowMinus.value == 'Yes',
                    addAmount: prop.addAmount.value,
                    value: prop.defaultTo.value
                });
                Protoplus.ui.spinner(qid + '_from', {
                    imgPath: "/sistema/images/",
                    width: '60',
                    allowNegative: prop.allowMinus.value == 'Yes',
                    addAmount: prop.addAmount.value,
                    value: prop.defaultFrom.value
                });
            });
        }
        break;
    case "control_fullname":
        if (prop.prefix.value == 'Yes') {
            html += this.subLabel('<input class="' + classNames.textbox + '" type="text" name="' + qname + '[prefix]" size="4" id="pre_' + id + '" />', sublabel('prefix'));
        }
        html += this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="text" size="10" name="' + qname + '[first]" id="first_' + id + '" />', sublabel('first'));
        if (prop.middle.value == 'Yes') {
            html += this.subLabel('<input class="' + classNames.textbox + '" type="text" size="10" name="' + qname + '[middle]" id="middle_' + id + '" />', sublabel('middle'));
        }
        html += this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="text" size="15" name="' + qname + '[last]" id="last_' + id + '" />', sublabel('last'));
        if (prop.suffix.value == "Yes") {
            html += this.subLabel('<input class="' + classNames.textbox + '" type="text" size="4" name="' + qname + '[suffix]" id="suf_' + id + '" />', sublabel('suffix'));
        }
        break;
    case "control_grading":
        var gradingOptions = prop.options.value.split("|");
        for (var i = 0; i < gradingOptions.length; i++) {
            var option = gradingOptions[i];
            var gbox = '<input class="form-grading-input ' + this.addValidation(classNames.textbox, prop) + '" type="text" size="3" id="' + qid + '_' + i + '" name="' + qname + '[]" /> ';
            var glabel = '<label class="form-grading-label" for="' + qid + '">' + option + '</label>';
            html += '<div class="form-grading-item">';
            if (prop.boxAlign.value == "Left") {
                html += gbox + glabel;
            } else {
                html += glabel + gbox;
            }
            html += '</div>';
        }
        if (prop.total.value != "0") {
            html += '<div> ' + 'Total'.locale() + ': <span id="grade_point_' + id + '">0</span> / <span id="grade_total_' + id + '">' + prop.total.value + '</span> <span class="form-grading-error" id="grade_error_' + id + '"></span>  </div>';
        }
        if (passive) {
            Element.observe(passive, 'on:render', function () {
                var img = getElement('img');
                img.src = '/sistema/images/builder/dropdown-properties.png';
                img.className = 'dropdown-edit';
                img.align = 'absmiddle';
                img.setStyle('position:absolute; bottom:0px; right:-20px;');
                img.onclick = function () {
                    $('button_' + id + '_options').run('mousedown');
                };
                passive.appendChild(img);
            });
        }
        break;
    case "control_matrix":
        html = '<table summary="" cellpadding="4" cellspacing="0" class="form-matrix-table"><tr>';
        html += '<th style="border:none">&nbsp;</th>';
        var cols = prop.mcolumns.value.split('|');
        var colWidth = (100 / cols.length + 2) + "%";
        for (var coli = 0; coli < cols.length; coli++) {
            html += '<th class="form-matrix-column-headers" style="width:' + colWidth + '">' + cols[coli] + '</th>';
        }
        html += '</tr>';
        var mrows = prop.mrows.value.split('|');
        var mcolumns = prop.mcolumns.value.split('|');
        for (var ri = 0; ri < mrows.length; ri++) {
            var row = mrows[ri];
            html += '<tr>';
            html += '<th align="left" class="form-matrix-row-headers" nowrap="nowrap">' + row + '</th>';
            for (var j = 0; j < mcolumns.length; j++) {
                var mcol = mcolumns[j];
                var input;
                switch (prop.inputType.value) {
                case "Radio Button":
                    input = '<input class="' + this.addValidation(classNames.radio, prop) + '" type="radio" name="' + qname + '[' + ri + ']" value="' + mcol.sanitize() + '" />';
                    break;
                case "Check Box":
                    input = '<input class="' + this.addValidation(classNames.checkbox, prop) + '" type="checkbox" name="' + qname + '[' + ri + '][]" value="' + mcol.sanitize() + '" />';
                    break;
                case "Text Box":
                    input = '<input class="' + this.addValidation(classNames.textbox, prop) + '" type="text" size="5" name="' + qname + '[' + ri + '][]" />';
                    break;
                case "Drop Down":
                    input = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" name="' + qname + '[' + ri + '][]"><option></option>';
                    var dp = prop.dropdown.value.split('|');
                    for (var dpd = 0; dpd < dp.length; dpd++) {
                        input += '<option value="' + this.escapeValue(dp[dpd]) + '">' + dp[dpd] + '</option>';
                    }
                    input += '</select>';
                    break;
                }
                html += '<td align="center" class="form-matrix-values" >' + input + '</td>';
            }
            html += "</tr>";
        }
        html += "</table>";
        break;
    case "control_collapse":
        var im = (prop.status.value == "Closed") ? "hide" : "show";
        var hidden = ((prop.visibility.value == "Hidden") ? ' form-collapse-hidden' : '');
        if (passive) {
            hidden = '';
        }
        html += '<div class="form-collapse-table' + hidden + '" id="collapse_' + id + '">';
        html += '<span class="form-collapse-mid" id="collapse-text_' + id + '">' + prop.text.value + '</span>';
        html += '<span class="form-collapse-right form-collapse-right-' + im + '">&nbsp;</span>';
        html += '</div>';
        if (passive) {
            Element.observe(passive, 'on:render', function () {
                Protoplus.ui.editable('collapse-text_' + id, {
                    className: 'edit-text',
                    onEnd: function (a, b, old, val) {
                        val = val.strip();
                        updateValue('text', val, passive.getReference('container'), passive, old);
                    }
                });
                if (prop.visibility.value == 'Hidden') {
                    Element.setOpacity('collapse_' + id, 0.5);
                }
            });
        }
        break;
    case "control_pagebreak":
        var pagingButtonAlign = '';
        if (passive) {
            pagingButtonAlign = ' style="width:' + (form.getProperty('labelWidth') - 14) + 'px"';
        }
        html += '<div class="form-pagebreak" >';
        html += '<div class="form-pagebreak-back-container form-label-left"' + pagingButtonAlign + '>';
        html += '<button type="button" class="form-pagebreak-back" id="form-pagebreak-back_' + id + '">' + 'Back'.locale() + '</button>';
        html += '</div>';
        html += '<div class="form-pagebreak-next-container">';
        html += '<button type="button" class="form-pagebreak-next" id="form-pagebreak-next_' + id + '">' + 'Next'.locale() + '</button>';
        html += '</div>';
        html += '</div>';
        break;
    case "control_birthdate":
        var bmonth, bmontho = "",
            bday, bdayo = "",
            byear, byearo = "",
            cyear;
        var bdate = new Date();
        cyear = ((bdate.getYear() < 1000) ? bdate.getYear() + 1900 : bdate.getYear()) + 4;
        bmonth = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" name="' + qname + '[month]" id="' + qid + '_month">';
        bmonth += '<option></option>';
        if (optionsCache.months) {
            bmontho += optionsCache.months;
        } else {
            for (var mi = 0; mi < special_options.Months.value.length; mi++) {
                bmontho += '<option value="' + special_options.Months.value[mi] + '">' + special_options.Months.value[mi] + '</option>';
            }
            optionsCache.months = bmontho;
        }
        bmonth += bmontho;
        bmonth += '</select>';
        bday = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" name="' + qname + '[day]" id="' + qid + '_day">';
        bday += '<option></option>';
        if (optionsCache.days) {
            bdayo += optionsCache.days;
        } else {
            for (var dayn = 31; dayn >= 1; dayn--) {
                bdayo += '<option value="' + dayn + '">' + dayn + '</option>';
            }
            optionsCache.days = bdayo;
        }
        bday += bdayo;
        bday += '</select>';
        byear = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" name="' + qname + '[year]" id="' + qid + '_year">';
        byear += '<option></option>';
        if (optionsCache.years) {
            byearo += optionsCache.years;
        } else {
            for (var yearn = cyear; yearn >= 1920; yearn--) {
                byearo += '<option value="' + yearn + '">' + yearn + '</option>';
            }
            optionsCache.years = byearo;
        }
        byear += byearo;
        byear += '</select>';
        bmonth = this.subLabel(bmonth, sublabel('month'));
        bday = this.subLabel(bday, sublabel('day'));
        byear = this.subLabel(byear, sublabel('year'));
        if (prop.format.value == "mmddyyyy") {
            html += bmonth + bday + byear;
        } else {
            html += bday + bmonth + byear;
        }
        break;
    case "control_phone":
        html += this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="tel" name="' + qname + '[area]" id="' + qid + '_area" size="3">', sublabel('area'), '-');
        html += this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="tel" name="' + qname + '[phone]" id="' + qid + '_phone" size="8">', sublabel('phone'));
        break;
    case "control_location":
        var lcountry = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" id="' + qid + '_country" name="' + qname + '[country]" ><option selected>Please Select</option>';
        for (var lci = 0; lci < special_options.LocationCountries.value.length; lci++) {
            lcountry += '<option value="' + (++lci) + '">' + special_options.LocationCountries.value[lci] + '</option>';
        }
        lcountry += '<option value="other">Other</option></select>';
        var lstate = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" id="' + qid + '_state" name="' + qname + '[state]"><option>Any</option></select>';
        var lcity = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" id="' + qid + '_city" name="' + qname + '[city]"><option>Any</option></select>';
        lcountry = this.subLabel(lcountry, 'Country:');
        lstate = this.subLabel(lstate, 'State:');
        lcity = this.subLabel(lcity, 'City / Province:');
        html += lcountry + lstate + lcity;
        script += "      setLocationEvents($('" + qid + "_country'), $('" + qid + "_state'), $('" + qid + "_city'));\n";
        break;
    case "control_scale":
        html += '<table summary="" cellpadding="4" cellspacing="0" class="form-scale-table"><tr>';
        html += '<th>&nbsp;</th>';
        for (x = 1; x <= prop.scaleAmount.value; x++) {
            html += '<th align="center"><label for="' + qid + '_' + x + '">' + x + '</label></th>';
        }
        html += '<th>&nbsp;</th></tr>';
        html += '<tr>';
        html += '<td><label for="' + qid + '_1" >' + prop.fromText.value + '</label></td>';
        for (x = 1; x <= prop.scaleAmount.value; x++) {
            html += '<td align="center"><input class="' + this.addValidation(classNames.radio, prop) + '" type="radio" name="' + qname + '" value="' + x + '" title="' + x + '" id="' + qid + '_' + x + '" /></td>';
        }
        html += '<td><label for="' + qid + '_' + (x - 1) + '">' + prop.toText.value + '</label></td>';
        html += '</tr></table>';
        break;
    case "control_payment":
    case "control_paypal":
    case "control_paypalpro":
    case "control_clickbank":
    case "control_2co":
    case "control_googleco":
    case "control_worldpay":
    case "control_onebip":
    case "control_authnet":
        html += '';
        if (prop.sublabels && typeof prop.sublabels.value == "string") {
            prop.sublabels.value = this.deepClone(default_properties[type].sublabels.value);
        }
        if (prop.paymentType.value == "donation") {
            html += this.subLabel('<input type="text" class="' + this.addValidation(classNames.textbox, prop, 'Numeric') + '" size="4" id="' + qid + '_donation" name="' + qname + '[price]" value="' + prop.suggestedDonation.value + '" >', prop.donationText.value, prop.currency.value);
        } else {
            opts = this.getProperty('products');
            var ptype = prop.multiple.value == "Yes" ? 'checkbox' : 'radio';
            var totalCounter = {};
            var hasOptions = false;
            if (opts === false) {
                if (passive) {
                    html += "<p style='margin-top:4px;'><img src='/sistema/images/exclamation.png' align='top'> ";
                    html += "This integration has not yet been configured".locale() + ", <br>";
                    html += "Run the wizard for configurations.".locale() + "</p>";
                } else {
                    return {
                        html: '',
                        hidden: true
                    };
                }
            } else {
                if ((opts.length < 2) && (type != "control_authnet" && type != "control_paypalpro") && (!opts[0].options || (opts[0].options && opts[0].options.length < 1))) {
                    if (passive) {
                        html += "<p style='background:lightYellow;margin-bottom:-10px;margin-top:4px;padding:4px;'><img src='/sistema/images/information.png' align='top'> ";
                        html += "Since there is only one product, this item will not be seen on the form.".locale() + " <br>";
                        html += "Run wizard to update payment details.".locale() + "<p>";
                    } else {
                        return {
                            html: '<input type="hidden" name="' + qname + '[][id]" value="' + opts[0].pid + '" />',
                            hidden: true
                        };
                    }
                }
                for (var pc = 0; pc < opts.length; pc++) {
                    var p = opts[pc];
                    html += '<span class="form-product-item">';
                    html += '<input class="' + this.addValidation(classNames[ptype], prop) + '" type="' + ptype + '" id="' + qid + '_' + p.pid + '" name="' + qname + '[][id]" value="' + p.pid + '" />';
                    totalCounter[qid + '_' + p.pid] = {
                        "price": p.price
                    };
                    html += '<label for="' + qid + '_' + p.pid + '"> ';
                    if (prop.paymentType.value == 'product') {
                        html += this.makeProductText(p.name, p.price, prop.currency.value, false, false, false);
                    } else {
                        html += this.makeProductText(p.name, p.price, prop.currency.value, p.period, p.setupfee, p.trial);
                    }
                    html += '</label>';
                    if (p.options && p.options.length > 0) {
                        html += '<br /><br />';
                    }
                    if (p.options && p.options.length > 0) {
                        hasOptions = true;
                        for (var po = 0; po < p.options.length; po++) {
                            var opt = p.options[po];
                            var sid = qid + '_' + opt.type + '_' + p.pid + '_' + po;
                            var opthtml = "";
                            if (opt.type == "quantity") {
                                totalCounter[qid + '_' + p.pid].quantityField = sid;
                            }
                            opthtml += '<select class="' + this.addValidation(classNames.dropdown, prop) + '" name="' + qname + '[special_' + p.pid + '][item_' + po + ']" id="' + sid + '">';
                            var sopts = opt.properties.split('\n');
                            for (var v = 0; v < sopts.length; v++) {
                                opthtml += '<option value="' + this.escapeValue(sopts[v]) + '">' + sopts[v] + '</option>';
                            }
                            opthtml += '</select> ';
                            opthtml = this.subLabel(opthtml, opt.name);
                            html += opthtml;
                        }
                    }
                    if (p.icon) {
                        var imgCls = hasOptions ? "form-product-image-with-options" : "form-product-image";
                        html += '<img src="' + p.icon + '" class="' + imgCls + '" height="50" width="50" align="absmiddle" />';
                    }
                    html += '</span><br />';
                }
                script += "      NgForms.totalCounter(" + this.toJSON(totalCounter) + ");\n";
                if (prop.showTotal.value == 'Yes') {
                    html += '<br /><b>' + 'Total'.locale() + ':&nbsp; <span>' + this.formatPrice(0, prop.currency.value, "payment_total", true) + '</span></b>';
                }
            }
        }
        if (type != "control_authnet" && type != "control_paypalpro") {
            break;
        } else {
            html += "<hr>";
        }
    case "control_authnet":
    case "control_paypalpro":
    case "control_address":
        var tableStyle = "",
            tableId = "";
        if (type == "control_paypalpro") {
            html += '<table summary="" class="form-address-table" border="0" cellpadding="4" cellspacing="0">';
            html += '<tr><th colspan="2" align="left">Payment Method</th></tr>';
            html += '<tr><td valign="middle">';
            html += '<input type="radio" class="paymentTypeRadios" id="' + qid + '_paymentType_credit" name="' + qname + '[paymentType]" value="credit"> <label for="' + qid + '_paymentType_credit" ><img align="absmiddle" src="' + this.HTTP_URL + 'images/credit-card-logo.png"></label>';
            html += '</td><td align="right">';
            html += '<input type="radio" class="paymentTypeRadios" id="' + qid + '_paymentType_express" name="' + qname + '[paymentType]" checked="checked" value="express"> <label for="' + qid + '_paymentType_express" ><img align="absmiddle" src="' + this.HTTP_URL + 'images/paypal_logo.png"></label>';
            html += '</td></tr></table>';
            tableStyle = 'style="display:none"';
            tableId = 'id="creditCardTable"';
        }
        html += '<table summary="" ' + tableStyle + ' ' + tableId + ' class="form-address-table" border="0" cellpadding="0" cellspacing="0">';
        if (type == "control_authnet" || type == "control_paypalpro") {
            var cc_firstName = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="text" name="' + qname + '[cc_firstName]" id="' + qid + '_cc_firstName" size="20" />', sublabel('cc_firstName'));
            var cc_lastName = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="text" name="' + qname + '[cc_lastName]" id="' + qid + '_cc_lastName" size="20" />', sublabel('cc_lastName'));
            var cc_number = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="text" name="' + qname + '[cc_number]" id="' + qid + '_cc_number" size="35" />', sublabel('cc_number'), '-');
            var cc_ccv = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + '" type="text" name="' + qname + '[cc_ccv]" id="' + qid + '_cc_ccv" size="6" />', sublabel('cc_ccv'));
            var cc_exp_month = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" name="' + qname + '[cc_exp_month]" id="' + qid + '_cc_exp_month" >';
            cc_exp_month += "<option></option>";
            for (var m = 0; m < special_options.Months.value.length; m++) {
                cc_exp_month += '<option value="' + special_options.Months.nonLocale[m] + '">' + special_options.Months.value[m] + '</option>';
            }
            cc_exp_month += '</select>';
            cc_exp_month = this.subLabel(cc_exp_month, sublabel('cc_exp_month'), '/');
            var cc_exp_year = '<select class="' + this.addValidation(classNames.dropdown, prop) + '" name="' + qname + '[cc_exp_year]" id="' + qid + '_cc_exp_year" >';
            var dyear = (new Date()).getYear() < 1000 ? (new Date()).getYear() + 1900 : (new Date()).getYear();
            cc_exp_year += "<option></option>";
            for (var y = dyear; y < (dyear + 10); y++) {
                cc_exp_year += '<option value="' + y + '">' + y + '</option>';
            }
            cc_exp_year += '</select>';
            cc_exp_year = this.subLabel(cc_exp_year, sublabel('cc_exp_year'));
            html += '<tr><th colspan="2" align="left">Credit Card</th></tr>';
            html += '<tr><td width="50%">';
            html += cc_firstName;
            html += '</td><td width="50%">';
            html += cc_lastName;
            html += '</td></tr><td colspan="2">';
            html += cc_number;
            html += cc_ccv;
            html += '</td></tr>';
            html += '<tr><td colspan="2">';
            html += cc_exp_month;
            html += cc_exp_year;
            html += '</td></tr>';
            html += '<tr><th colspan="2" align="left">Billing Address</th></tr>';
        }
        var addr_line1 = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + ' form-address-line" type="text" name="' + qname + '[addr_line1]" id="' + qid + '_addr_line1" />', sublabel('addr_line1'));
        var addr_line2 = this.subLabel('<input class="' + classNames.textbox + ' form-address-line" type="text" name="' + qname + '[addr_line2]" id="' + qid + '_addr_line2" size="46" />', sublabel('addr_line2'));
        var addr_city = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + ' form-address-city" type="text"  name="' + qname + '[city]" id="' + qid + '_city" size="21" />', sublabel('city'));
        var addr_state = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + ' form-address-state" type="text"  name="' + qname + '[state]" id="' + qid + '_state" size="22" />', sublabel('state'));
        var addr_zip = this.subLabel('<input class="' + this.addValidation(classNames.textbox, prop) + ' form-address-postal" type="text" name="' + qname + '[postal]" id="' + qid + '_postal" size="10" />', sublabel('postal'));
        var addr_country = '<select class="' + this.addValidation(classNames.dropdown, prop) + ' form-address-country" name="' + qname + '[country]" id="' + qid + '_country" >';
        addr_country += '<option selected>' + 'Please Select'.locale() + '</option>';
        var locCountries = special_options.Countries.value;
        for (var loc = 0; loc < locCountries.length; loc++) {
            var selec = "";
            if (prop.selectedCountry && (prop.selectedCountry.value == locCountries[loc])) {
                selec = ' selected="selected"';
            }
            addr_country += '<option ' + selec + ' value="' + locCountries[loc] + '">' + locCountries[loc] + '</option>';
        }
        addr_country += '<option value="other">' + 'Other'.locale() + '</option></select>';
        addr_country = this.subLabel(addr_country, sublabel('country'));
        html += '<tr><td colspan="2">';
        html += addr_line1;
        html += '</td></tr><tr><td colspan="2">';
        html += addr_line2;
        html += '</td></tr><tr><td width="50%">';
        html += addr_city;
        html += '</td><td>';
        html += addr_state;
        html += '</td></tr><tr><td width="50%">';
        html += addr_zip;
        html += '</td><td>';
        html += addr_country;
        html += '</td></tr></table>';
        break;
    default:
        html = "<b>Question is not defined,</b> should be defiend at <i>createInputHTML()</i> function";
    }
	//alert(html)
    return {
        html: html,
        script: script,
        prop: prop
    };
};;

function setLocationEvents(country, state, city) {
    var server = "http://jotfor.ms/server.php";
    country = $(country);
    state = $(state);
    city = $(city);
    var countryChange = function () {
        var sel = country.getSelected();
        if (sel.value == "other") {
            var inp = new Element('input', {
                size: '10'
            });
            country.parentNode.replaceChild(inp, country);
            country = inp;
            country.hint('Country');
            var inp1 = new Element('input', {
                size: '10'
            });
            state.parentNode.replaceChild(inp1, state);
            state = inp1;
            state.hint('State');
            var inp2 = new Element('input', {
                size: '10'
            });
            city.parentNode.replaceChild(inp2, city);
            city = inp2;
            city.hint('City');
            return;
        }
        var load = new Element('img', {
            src: '/sistema/images/loader.gif',
            align: 'absmiddle'
        }).setStyle({
            marginLeft: '3px',
            display: 'none'
        });
        country.insert({
            after: load
        });
        setTimeout(function () {
            load.setStyle({
                display: 'inline'
            });
        }, 400);
        new Ajax.Jsonp(server, {
            parameters: {
                action: 'getStates',
                countryId: sel.value
            },
            onComplete: function (t) {
                load.remove();
                var states = t.responseText ? t.responseText.evalJSON().states : t.states;
                console.log(states);
                if (t.success === false) {
                    return;
                }
                if (states.length <= 0) {
                    var inp = new Element('input', {
                        size: '10'
                    });
                    state.parentNode.replaceChild(inp, state);
                    state = inp;
                } else {
                    var sel = "";
                    if (state.tagName == "INPUT") {
                        sel = new Element('select');
                        state.parentNode.replaceChild(sel, state);
                        state = sel;
                        state.observe('change', stateChange);
                    }
                    if (city.tagName == "INPUT") {
                        sel = new Element('select');
                        city.parentNode.replaceChild(sel, city);
                        city = sel;
                        city.observe('change', cityChange);
                    }
                    state.update($(new Option()).insert('<option>Any</option>'));
                    city.update($(new Option()).insert('<option>Any</option>'));
                    states.each(function (item) {
                        var op = new Option();
                        op.value = item.id;
                        op.innerHTML = item.state;
                        state.appendChild(op);
                    });
                    state.insert("<option value='other'>Other</option>");
                    state.selectOption('Any');
                }
            }
        });
    };
    var stateChange = function () {
        var sel = state.getSelected();
        if (sel.value == "other") {
            var inp = new Element('input', {
                size: '10'
            });
            state.parentNode.replaceChild(inp, state);
            state = inp;
            state.hint('State');
            var inp2 = new Element('input', {
                size: '10'
            });
            city.parentNode.replaceChild(inp2, city);
            city = inp2;
            city.hint('City');
            return;
        }
        var load = new Element('img', {
            src: '/sistema/images/loader.gif',
            align: 'absmiddle'
        }).setStyle({
            marginLeft: '3px',
            display: 'none'
        });
        state.insert({
            after: load
        });
        setTimeout(function () {
            load.setStyle({
                display: 'inline'
            });
        }, 400);
        new Ajax.Jsonp(server, {
            parameters: {
                action: 'getCities',
                stateId: sel.value
            },
            onComplete: function (t) {
                load.remove();
                var cities = (t.responseText) ? t.responseText.evalJSON().cities : t.cities;
                console.log(t, cities);
                if (t.success === false) {
                    return;
                }
                if (cities.length <= 0) {
                    var inp = new Element('input', {
                        size: '10'
                    });
                    city.parentNode.replaceChild(inp, city);
                    city = inp;
                } else {
                    if (city.tagName == "INPUT") {
                        var sel = new Element('select');
                        city.parentNode.replaceChild(sel, city);
                        city = sel;
                        city.observe('change', cityChange);
                    }
                    city.update($(new Option()).insert('<option>Any</option>'));
                    cities.each(function (item, i) {
                        var op = new Option();
                        op.value = ++i;
                        op.innerHTML = item;
                        city.appendChild(op);
                    });
                    city.insert('<option value="other">Other</option>');
                    city.selectOption('Any');
                }
            }
        });
    };
    var cityChange = function () {
        var sel = city.getSelected();
        if (sel.value == "other") {
            var inp = new Element('input', {
                size: '10'
            });
            city.parentNode.replaceChild(inp, city);
            city = inp;
            city.hint('City');
        }
    };
    country.observe('change', countryChange);
    state.observe('change', stateChange);
    city.observe('change', cityChange);
};
(function () {
    if ('loginIncluded' in window) {
        return;
    }
    window.loginIncluded = true;
    var Utils = window.Utils || new Common();
    var confirmCallback = function (msg, success) {
        if (success) {
            callServer(true);
        }
    };
    var callServer = function (forceDeleted) {
        Utils.Request({
            parameters: {
                action: "login",
                username: $('username').value,
                password: $('password').value,
                remember: $('remember').checked,
                includeUsage: 'MyForms' in window,
                forceDeleted: (forceDeleted ? 1 : 0)
            },
            onSuccess: function (response) {
                if ($('login_referer') && $('login_referer').value) {
                    if ($('login_referer').value.endsWith('login/') || $('login_referer').value.endsWith('login')) {
                        Utils.redirect(Utils.HTTP_URL + 'myforms/');
                    } else {
                        Utils.redirect($('login_referer').value);
                    }
                    return;
                }
                if (location.href.include('/login')) {
                    $('myaccount').update('<h3>' + 'Login Successful!' + '</h3>' + 'Please wait wile redirecting...'.locale());
                    setTimeout(function () {
                        Utils.redirect(Utils.HTTP_URL + 'myforms/');
                    }, 100);
                    return;
                }
                $('myaccount').update(response.accountBox);
                if (document.readCookie('no-translate')) {
                    if ($('total-translate-container')) {
                        $('total-translate-container').remove();
                    }
                }
                if (window.Utils) {
                    window.Utils.user = response.user;
                    window.Utils.user.usage = response.usage;
                }
                if (response.user.accountType == 'ADMIN') {
                    if ($('nav')) {
                        if (!$('tickets-link') && !document.APP) {
                            $('nav').insert('<li class="navItem" id="tickets-link"><a href="ticket">Tickets</a></li>');
                        }
                        if (!$('admin-link')) {
                            $('nav').insert('<li class="navItem" id="admin-link"><a href="admin">Admin</a></li>');
                        }
                    }
                }
                Locale.changeHTMLStrings();
                if ('MyForms' in window) {
                    $('account-notification').hide();
                    window.scroll(0, 0);
                    MyForms.updatePage();
                }
            },
            onFail: function (response) {
                if (response.error == "DELETED") {
                    var deletedMsg = "This account has been deleted by the owner.<br><br>Do you want to enable it?";
                    Utils.confirm(deletedMsg, "Enable Account?", confirmCallback);
                } else if (response.error == "AUTOSUSPENDED") {
                    var autoSuspensionMsg = "Due to <a href=\"http://ngforms.ngprofessionals.com.br/c/faq/\" target=\"blank\"><b><u>terms of use</u></b></a> " + "violation, your account has been " + "suspended.<br>It was suspected to be used for phishing (stealing information). If you think this is a mistake please " + "<a href=\"http://www.interlogy.com/contact.html?NgForms=yes\" target=\"blank\"><b><u>contact us</u></b></a> " + "to resolve this issue.";
                    Utils.alert(autoSuspensionMsg, "Account Suspended");
                } else if (response.error == "SUSPENDED") {
                    var suspensionMsg = "Due to <a href=\"http://ngforms.ngprofessionals.com.br/c/faq/\" target=\"blank\"><b><u>terms of use</u></b></a> " + "violation, your account has been " + "suspended. If you think this is a mistake please " + "<a href=\"http://www.interlogy.com/contact.html?NgForms=yes\" target=\"blank\"><b><u>contact us</u></b></a> " + "to resolve this issue.";
                    Utils.alert(suspensionMsg, "Account Suspended");
                } else {
                    $('error-box').update(response.error);
                    $('error-box').show();
                }
            }
        });
    };

    function login() {
        $$('.error-div').each(function (el) {
            el.update("");
        });
        $('username', 'password').invoke('removeClassName', 'error');
        if (!$('username').value) {
            $('username').addClassName('error').focus();
            $('usernameErrorDiv').update('Username cannot be blank'.locale());
            $('usernameErrorDiv').show();
            return;
        }
        if (!$('password').value) {
            $('password').addClassName('error').focus();
            $('passwordErrorDiv').update('Password cannot be blank'.locale());
            $('passwordErrorDiv').show();
            return;
        }
        callServer();
    }

    function openResetBox() {
        $('myaccount').removeClassName('signin');
        $('myaccount').addClassName('forgotPassword');
    }

    function remindSuccessCallback() {
        $('myaccount').addClassName('signin');
        $('myaccount').removeClassName('forgotPassword');
    }

    function sendPasswordReset() {
        var userResetData = $('resetData').value;
        $('passResetButton').disable();
        Utils.Request({
            parameters: {
                action: 'sendPasswordReset',
                resetData: userResetData
            },
            onSuccess: function (response) {
                $('passResetButton').enable();
                $('passResetButton').value = "Instructions Sent";
                Utils.alert("Information needed to reset your password has been sent to your e-mail address.<br /><br />Please check your email and follow the instructions.".locale(), "Password Reset".locale(), remindSuccessCallback);
            },
            onFail: function (response) {
                Utils.alert(response.error.locale(), "Password Reset".locale());
            }
        });
    }

    function checkKeypress(event) {
        event = document.getEvent(event);
        var keyCode = event.keyCode;
        if (keyCode != Event.KEY_RETURN) {
            return;
        }
        if (this.id == "resetData") {
            return;
        }
        login();
    }
    document.observe('dom:loaded', function () {
        if ($('username')) {
            Element.observe('username', 'keypress', checkKeypress);
            Element.observe('password', 'keypress', checkKeypress);
            Element.observe('resetData', 'keypress', checkKeypress);
            Element.observe('loginButton', 'click', login);
            Element.observe('forgotPasswordButton', 'click', openResetBox);
            Element.observe('passResetButton', 'click', sendPasswordReset);
            Element.observe('returnLoginBox', 'click', remindSuccessCallback);
        }
    });
})();

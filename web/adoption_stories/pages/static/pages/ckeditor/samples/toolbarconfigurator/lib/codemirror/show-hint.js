﻿(function (f) {
    "object" == typeof exports && "object" == typeof module ? f(require("../../lib/codemirror")) : "function" == typeof define && define.amd ? define(["../../lib/codemirror"], f) : f(CodeMirror)
})(function (f) {
    function m(a, b) {
        this.cm = a;
        this.options = this.buildOptions(b);
        this.widget = null;
        this.tick = this.debounce = 0;
        this.startPos = this.cm.getCursor();
        this.startLen = this.cm.getLine(this.startPos.line).length;
        var c = this;
        a.on("cursorActivity", this.activityFunc = function () {
            c.cursorActivity()
        })
    }

    function t(a, b) {
        function c(a,
                   c) {
            var d;
            d = "string" != typeof c ? function (a) {
                return c(a, b)
            } : e.hasOwnProperty(c) ? e[c] : c;
            f[a] = d
        }

        var e = {
            Up: function () {
                b.moveFocus(-1)
            }, Down: function () {
                b.moveFocus(1)
            }, PageUp: function () {
                b.moveFocus(-b.menuSize() + 1, !0)
            }, PageDown: function () {
                b.moveFocus(b.menuSize() - 1, !0)
            }, Home: function () {
                b.setFocus(0)
            }, End: function () {
                b.setFocus(b.length - 1)
            }, Enter: b.pick, Tab: b.pick, Esc: b.close
        }, d = a.options.customKeys, f = d ? {} : e;
        if (d)for (var g in d)d.hasOwnProperty(g) && c(g, d[g]);
        if (d = a.options.extraKeys)for (g in d)d.hasOwnProperty(g) &&
        c(g, d[g]);
        return f
    }

    function s(a, b) {
        for (; b && b != a;) {
            if ("LI" === b.nodeName.toUpperCase() && b.parentNode == a)return b;
            b = b.parentNode
        }
    }

    function l(a, b) {
        this.completion = a;
        this.data = b;
        this.picked = !1;
        var c = this, e = a.cm, d = this.hints = document.createElement("ul");
        d.className = "CodeMirror-hints";
        this.selectedHint = b.selectedHint || 0;
        for (var k = b.list, g = 0; g < k.length; ++g) {
            var j = d.appendChild(document.createElement("li")), h = k[g], i = u + (g != this.selectedHint ? "" : " " + q);
            null != h.className && (i = h.className + " " + i);
            j.className = i;
            h.render ?
                h.render(j, b, h) : j.appendChild(document.createTextNode(h.displayText || ("string" == typeof h ? h : h.text)));
            j.hintId = g
        }
        var g = e.cursorCoords(a.options.alignWithWord ? b.from : null), o = g.left, p = g.bottom, l = !0;
        d.style.left = o + "px";
        d.style.top = p + "px";
        j = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
        i = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
        (a.options.container || document.body).appendChild(d);
        h = d.getBoundingClientRect();
        if (0 < h.bottom - i) {
            var r = h.bottom - h.top;
            0 < g.top - (g.bottom - h.top) - r ? (d.style.top = (p = g.top - r) + "px", l = !1) : r > i && (d.style.height = i - 5 + "px", d.style.top = (p = g.bottom - h.top) + "px", i = e.getCursor(), b.from.ch != i.ch && (g = e.cursorCoords(i), d.style.left = (o = g.left) + "px", h = d.getBoundingClientRect()))
        }
        i = h.right - j;
        0 < i && (h.right - h.left > j && (d.style.width = j - 5 + "px", i -= h.right - h.left - j), d.style.left = (o = g.left - i) + "px");
        e.addKeyMap(this.keyMap = t(a, {
            moveFocus: function (a, b) {
                c.changeActive(c.selectedHint + a, b)
            }, setFocus: function (a) {
                c.changeActive(a)
            },
            menuSize: function () {
                return c.screenAmount()
            }, length: k.length, close: function () {
                a.close()
            }, pick: function () {
                c.pick()
            }, data: b
        }));
        if (a.options.closeOnUnfocus) {
            var m;
            e.on("blur", this.onBlur = function () {
                m = setTimeout(function () {
                    a.close()
                }, 100)
            });
            e.on("focus", this.onFocus = function () {
                clearTimeout(m)
            })
        }
        var n = e.getScrollInfo();
        e.on("scroll", this.onScroll = function () {
            var c = e.getScrollInfo(), b = e.getWrapperElement().getBoundingClientRect(), f = p + n.top - c.top, g = f - (window.pageYOffset || (document.documentElement || document.body).scrollTop);
            l || (g = g + d.offsetHeight);
            if (g <= b.top || g >= b.bottom)return a.close();
            d.style.top = f + "px";
            d.style.left = o + n.left - c.left + "px"
        });
        f.on(d, "dblclick", function (a) {
            if ((a = s(d, a.target || a.srcElement)) && a.hintId != null) {
                c.changeActive(a.hintId);
                c.pick()
            }
        });
        f.on(d, "click", function (b) {
            if ((b = s(d, b.target || b.srcElement)) && b.hintId != null) {
                c.changeActive(b.hintId);
                a.options.completeOnSingleClick && c.pick()
            }
        });
        f.on(d, "mousedown", function () {
            setTimeout(function () {
                e.focus()
            }, 20)
        });
        f.signal(b, "select", k[0], d.firstChild);
        return !0
    }

    var u = "CodeMirror-hint", q = "CodeMirror-hint-active";
    f.showHint = function (a, b, c) {
        if (!b)return a.showHint(c);
        c && c.async && (b.async = !0);
        b = {hint: b};
        if (c)for (var e in c)b[e] = c[e];
        return a.showHint(b)
    };
    f.defineExtension("showHint", function (a) {
        1 < this.listSelections().length || this.somethingSelected() || (this.state.completionActive && this.state.completionActive.close(), a = this.state.completionActive = new m(this, a), a.options.hint && (f.signal(this, "startCompletion", this), a.update()))
    });
    var v = window.requestAnimationFrame ||
        function (a) {
            return setTimeout(a, 1E3 / 60)
        }, w = window.cancelAnimationFrame || clearTimeout;
    m.prototype = {
        close: function () {
            this.active() && (this.tick = this.cm.state.completionActive = null, this.cm.off("cursorActivity", this.activityFunc), this.widget && this.widget.close(), f.signal(this.cm, "endCompletion", this.cm))
        }, active: function () {
            return this.cm.state.completionActive == this
        }, pick: function (a, b) {
            var c = a.list[b];
            c.hint ? c.hint(this.cm, a, c) : this.cm.replaceRange("string" == typeof c ? c : c.text, c.from || a.from, c.to || a.to,
                "complete");
            f.signal(a, "pick", c);
            this.close()
        }, showHints: function (a) {
            if (!a || !a.list.length || !this.active())return this.close();
            this.options.completeSingle && 1 == a.list.length ? this.pick(a, 0) : this.showWidget(a)
        }, cursorActivity: function () {
            this.debounce && (w(this.debounce), this.debounce = 0);
            var a = this.cm.getCursor(), b = this.cm.getLine(a.line);
            if (a.line != this.startPos.line || b.length - a.ch != this.startLen - this.startPos.ch || a.ch < this.startPos.ch || this.cm.somethingSelected() || a.ch && this.options.closeCharacters.test(b.charAt(a.ch -
                    1)))this.close(); else {
                var c = this;
                this.debounce = v(function () {
                    c.update()
                });
                this.widget && this.widget.disable()
            }
        }, update: function () {
            if (null != this.tick)if (this.data && f.signal(this.data, "update"), this.options.hint.async) {
                var a = ++this.tick, b = this;
                this.options.hint(this.cm, function (c) {
                    b.tick == a && b.finishUpdate(c)
                }, this.options)
            } else this.finishUpdate(this.options.hint(this.cm, this.options), a)
        }, finishUpdate: function (a) {
            this.data = a;
            var b = this.widget && this.widget.picked;
            this.widget && this.widget.close();
            a && a.list.length &&
            (b && 1 == a.list.length ? this.pick(a, 0) : this.widget = new l(this, a))
        }, showWidget: function (a) {
            this.data = a;
            this.widget = new l(this, a);
            f.signal(a, "shown")
        }, buildOptions: function (a) {
            var b = this.cm.options.hintOptions, c = {}, e;
            for (e in n)c[e] = n[e];
            if (b)for (e in b)void 0 !== b[e] && (c[e] = b[e]);
            if (a)for (e in a)void 0 !== a[e] && (c[e] = a[e]);
            return c
        }
    };
    l.prototype = {
        close: function () {
            if (this.completion.widget == this) {
                this.completion.widget = null;
                this.hints.parentNode.removeChild(this.hints);
                this.completion.cm.removeKeyMap(this.keyMap);
                var a = this.completion.cm;
                this.completion.options.closeOnUnfocus && (a.off("blur", this.onBlur), a.off("focus", this.onFocus));
                a.off("scroll", this.onScroll)
            }
        }, disable: function () {
            this.completion.cm.removeKeyMap(this.keyMap);
            var a = this;
            this.keyMap = {
                Enter: function () {
                    a.picked = !0
                }
            };
            this.completion.cm.addKeyMap(this.keyMap)
        }, pick: function () {
            this.completion.pick(this.data, this.selectedHint)
        }, changeActive: function (a, b) {
            a >= this.data.list.length ? a = b ? this.data.list.length - 1 : 0 : 0 > a && (a = b ? 0 : this.data.list.length - 1);
            if (this.selectedHint != a) {
                var c = this.hints.childNodes[this.selectedHint];
                c.className = c.className.replace(" " + q, "");
                c = this.hints.childNodes[this.selectedHint = a];
                c.className += " " + q;
                c.offsetTop < this.hints.scrollTop ? this.hints.scrollTop = c.offsetTop - 3 : c.offsetTop + c.offsetHeight > this.hints.scrollTop + this.hints.clientHeight && (this.hints.scrollTop = c.offsetTop + c.offsetHeight - this.hints.clientHeight + 3);
                f.signal(this.data, "select", this.data.list[this.selectedHint], c)
            }
        }, screenAmount: function () {
            return Math.floor(this.hints.clientHeight /
                    this.hints.firstChild.offsetHeight) || 1
        }
    };
    f.registerHelper("hint", "auto", function (a, b) {
        var c = a.getHelpers(a.getCursor(), "hint");
        if (c.length)for (var e = 0; e < c.length; e++) {
            var d = c[e](a, b);
            if (d && d.list.length)return d
        } else if (c = a.getHelper(a.getCursor(), "hintWords")) {
            if (c)return f.hint.fromList(a, {words: c})
        } else if (f.hint.anyword)return f.hint.anyword(a, b)
    });
    f.registerHelper("hint", "fromList", function (a, b) {
        for (var c = a.getCursor(), e = a.getTokenAt(c), d = [], k = 0; k < b.words.length; k++) {
            var g = b.words[k];
            g.slice(0,
                e.string.length) == e.string && d.push(g)
        }
        if (d.length)return {list: d, from: f.Pos(c.line, e.start), to: f.Pos(c.line, e.end)}
    });
    f.commands.autocomplete = f.showHint;
    var n = {
        hint: f.hint.auto,
        completeSingle: !0,
        alignWithWord: !0,
        closeCharacters: /[\s()\[\]{};:>,]/,
        closeOnUnfocus: !0,
        completeOnSingleClick: !1,
        container: null,
        customKeys: null,
        extraKeys: null
    };
    f.defineOption("hintOptions", null)
});
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports, require('@angular/core'), require('@angular/common'), require('rxjs'), require('rxjs/operators'))
    : typeof define === 'function' && define.amd
    ? define('@swimlane/ngx-datatable', [
        'exports',
        '@angular/core',
        '@angular/common',
        'rxjs',
        'rxjs/operators'
      ], factory)
    : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self),
      factory(
        ((global.swimlane = global.swimlane || {}), (global.swimlane['ngx-datatable'] = {})),
        global.ng.core,
        global.ng.common,
        global.rxjs,
        global.rxjs.operators
      ));
})(this, function (exports, core, common, rxjs, operators) {
  'use strict';

  /**
   * Gets the width of the scrollbar.  Nesc for windows
   * http://stackoverflow.com/a/13382873/888165
   */
  var ScrollbarHelper = /** @class */ (function () {
    function ScrollbarHelper(document) {
      this.document = document;
      this.width = this.getWidth();
    }
    ScrollbarHelper.prototype.getWidth = function () {
      var outer = this.document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.width = '100px';
      outer.style.msOverflowStyle = 'scrollbar';
      this.document.body.appendChild(outer);
      var widthNoScroll = outer.offsetWidth;
      outer.style.overflow = 'scroll';
      var inner = this.document.createElement('div');
      inner.style.width = '100%';
      outer.appendChild(inner);
      var widthWithScroll = inner.offsetWidth;
      outer.parentNode.removeChild(outer);
      return widthNoScroll - widthWithScroll;
    };
    return ScrollbarHelper;
  })();
  ScrollbarHelper.decorators = [{ type: core.Injectable }];
  ScrollbarHelper.ctorParameters = function () {
    return [{ type: undefined, decorators: [{ type: core.Inject, args: [common.DOCUMENT] }] }];
  };

  /**
   * Gets the width of the scrollbar.  Nesc for windows
   * http://stackoverflow.com/a/13382873/888165
   */
  var DimensionsHelper = /** @class */ (function () {
    function DimensionsHelper() {}
    DimensionsHelper.prototype.getDimensions = function (element) {
      return element.getBoundingClientRect();
    };
    return DimensionsHelper;
  })();
  DimensionsHelper.decorators = [{ type: core.Injectable }];

  /**
   * service to make DatatableComponent aware of changes to
   * input bindings of DataTableColumnDirective
   */
  var ColumnChangesService = /** @class */ (function () {
    function ColumnChangesService() {
      this.columnInputChanges = new rxjs.Subject();
    }
    Object.defineProperty(ColumnChangesService.prototype, 'columnInputChanges$', {
      get: function () {
        return this.columnInputChanges.asObservable();
      },
      enumerable: false,
      configurable: true
    });
    ColumnChangesService.prototype.onInputChange = function () {
      this.columnInputChanges.next();
    };
    return ColumnChangesService;
  })();
  ColumnChangesService.decorators = [{ type: core.Injectable }];

  var DataTableFooterTemplateDirective = /** @class */ (function () {
    function DataTableFooterTemplateDirective(template) {
      this.template = template;
    }
    return DataTableFooterTemplateDirective;
  })();
  DataTableFooterTemplateDirective.decorators = [
    { type: core.Directive, args: [{ selector: '[ngx-datatable-footer-template]' }] }
  ];
  DataTableFooterTemplateDirective.ctorParameters = function () {
    return [{ type: core.TemplateRef }];
  };

  /**
   * Visibility Observer Directive
   *
   * Usage:
   *
   * 		<div
   * 			visibilityObserver
   * 			(visible)="onVisible($event)">
   * 		</div>
   *
   */
  var VisibilityDirective = /** @class */ (function () {
    function VisibilityDirective(element, zone) {
      this.element = element;
      this.zone = zone;
      this.isVisible = false;
      this.visible = new core.EventEmitter();
    }
    VisibilityDirective.prototype.ngOnInit = function () {
      this.runCheck();
    };
    VisibilityDirective.prototype.ngOnDestroy = function () {
      clearTimeout(this.timeout);
    };
    VisibilityDirective.prototype.onVisibilityChange = function () {
      var _this = this;
      // trigger zone recalc for columns
      this.zone.run(function () {
        _this.isVisible = true;
        _this.visible.emit(true);
      });
    };
    VisibilityDirective.prototype.runCheck = function () {
      var _this = this;
      var check = function () {
        // https://davidwalsh.name/offsetheight-visibility
        var _a = _this.element.nativeElement,
          offsetHeight = _a.offsetHeight,
          offsetWidth = _a.offsetWidth;
        if (offsetHeight && offsetWidth) {
          clearTimeout(_this.timeout);
          _this.onVisibilityChange();
        } else {
          clearTimeout(_this.timeout);
          _this.zone.runOutsideAngular(function () {
            _this.timeout = setTimeout(function () {
              return check();
            }, 50);
          });
        }
      };
      this.timeout = setTimeout(function () {
        return check();
      });
    };
    return VisibilityDirective;
  })();
  VisibilityDirective.decorators = [{ type: core.Directive, args: [{ selector: '[visibilityObserver]' }] }];
  VisibilityDirective.ctorParameters = function () {
    return [{ type: core.ElementRef }, { type: core.NgZone }];
  };
  VisibilityDirective.propDecorators = {
    isVisible: [{ type: core.HostBinding, args: ['class.visible'] }],
    visible: [{ type: core.Output }]
  };

  /**
   * Draggable Directive for Angular2
   *
   * Inspiration:
   *   https://github.com/AngularClass/angular2-examples/blob/master/rx-draggable/directives/draggable.ts
   *   http://stackoverflow.com/questions/35662530/how-to-implement-drag-and-drop-in-angular2
   *
   */
  var DraggableDirective = /** @class */ (function () {
    function DraggableDirective(element) {
      this.dragX = true;
      this.dragY = true;
      this.dragStart = new core.EventEmitter();
      this.dragging = new core.EventEmitter();
      this.dragEnd = new core.EventEmitter();
      this.isDragging = false;
      this.element = element.nativeElement;
    }
    DraggableDirective.prototype.ngOnChanges = function (changes) {
      if (changes['dragEventTarget'] && changes['dragEventTarget'].currentValue && this.dragModel.dragging) {
        this.onMousedown(changes['dragEventTarget'].currentValue);
      }
    };
    DraggableDirective.prototype.ngOnDestroy = function () {
      this._destroySubscription();
    };
    DraggableDirective.prototype.onMouseup = function (event) {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.element.classList.remove('dragging');
      if (this.subscription) {
        this._destroySubscription();
        this.dragEnd.emit({
          event: event,
          element: this.element,
          model: this.dragModel
        });
      }
    };
    DraggableDirective.prototype.onMousedown = function (event) {
      var _this = this;
      // we only want to drag the inner header text
      var isDragElm = event.target.classList.contains('draggable');
      if (isDragElm && (this.dragX || this.dragY)) {
        event.preventDefault();
        this.isDragging = true;
        var mouseDownPos_1 = { x: event.clientX, y: event.clientY };
        var mouseup = rxjs.fromEvent(document, 'mouseup');
        this.subscription = mouseup.subscribe(function (ev) {
          return _this.onMouseup(ev);
        });
        var mouseMoveSub = rxjs
          .fromEvent(document, 'mousemove')
          .pipe(operators.takeUntil(mouseup))
          .subscribe(function (ev) {
            return _this.move(ev, mouseDownPos_1);
          });
        this.subscription.add(mouseMoveSub);
        this.dragStart.emit({
          event: event,
          element: this.element,
          model: this.dragModel
        });
      }
    };
    DraggableDirective.prototype.move = function (event, mouseDownPos) {
      if (!this.isDragging) return;
      var x = event.clientX - mouseDownPos.x;
      var y = event.clientY - mouseDownPos.y;
      if (this.dragX) this.element.style.left = x + 'px';
      if (this.dragY) this.element.style.top = y + 'px';
      this.element.classList.add('dragging');
      this.dragging.emit({
        event: event,
        element: this.element,
        model: this.dragModel
      });
    };
    DraggableDirective.prototype._destroySubscription = function () {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = undefined;
      }
    };
    return DraggableDirective;
  })();
  DraggableDirective.decorators = [{ type: core.Directive, args: [{ selector: '[draggable]' }] }];
  DraggableDirective.ctorParameters = function () {
    return [{ type: core.ElementRef }];
  };
  DraggableDirective.propDecorators = {
    dragEventTarget: [{ type: core.Input }],
    dragModel: [{ type: core.Input }],
    dragX: [{ type: core.Input }],
    dragY: [{ type: core.Input }],
    dragStart: [{ type: core.Output }],
    dragging: [{ type: core.Output }],
    dragEnd: [{ type: core.Output }]
  };

  var ResizeableDirective = /** @class */ (function () {
    function ResizeableDirective(element, renderer) {
      this.renderer = renderer;
      this.resizeEnabled = true;
      this.resize = new core.EventEmitter();
      this.resizing = false;
      this.element = element.nativeElement;
    }
    ResizeableDirective.prototype.ngAfterViewInit = function () {
      var renderer2 = this.renderer;
      this.resizeHandle = renderer2.createElement('span');
      if (this.resizeEnabled) {
        renderer2.addClass(this.resizeHandle, 'resize-handle');
      } else {
        renderer2.addClass(this.resizeHandle, 'resize-handle--not-resizable');
      }
      renderer2.appendChild(this.element, this.resizeHandle);
    };
    ResizeableDirective.prototype.ngOnDestroy = function () {
      this._destroySubscription();
      if (this.renderer.destroyNode) {
        this.renderer.destroyNode(this.resizeHandle);
      } else if (this.resizeHandle) {
        this.renderer.removeChild(this.renderer.parentNode(this.resizeHandle), this.resizeHandle);
      }
    };
    ResizeableDirective.prototype.onMouseup = function () {
      this.resizing = false;
      if (this.subscription && !this.subscription.closed) {
        this._destroySubscription();
        this.resize.emit(this.element.clientWidth);
      }
    };
    ResizeableDirective.prototype.onMousedown = function (event) {
      var _this = this;
      var isHandle = event.target.classList.contains('resize-handle');
      var initialWidth = this.element.clientWidth;
      var mouseDownScreenX = event.screenX;
      if (isHandle) {
        event.stopPropagation();
        this.resizing = true;
        var mouseup = rxjs.fromEvent(document, 'mouseup');
        this.subscription = mouseup.subscribe(function (ev) {
          return _this.onMouseup();
        });
        var mouseMoveSub = rxjs
          .fromEvent(document, 'mousemove')
          .pipe(operators.takeUntil(mouseup))
          .subscribe(function (e) {
            return _this.move(e, initialWidth, mouseDownScreenX);
          });
        this.subscription.add(mouseMoveSub);
      }
    };
    ResizeableDirective.prototype.move = function (event, initialWidth, mouseDownScreenX) {
      var movementX = event.screenX - mouseDownScreenX;
      var newWidth = initialWidth + movementX;
      var overMinWidth = !this.minWidth || newWidth >= this.minWidth;
      var underMaxWidth = !this.maxWidth || newWidth <= this.maxWidth;
      if (overMinWidth && underMaxWidth) {
        this.element.style.width = newWidth + 'px';
      }
    };
    ResizeableDirective.prototype._destroySubscription = function () {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = undefined;
      }
    };
    return ResizeableDirective;
  })();
  ResizeableDirective.decorators = [
    {
      type: core.Directive,
      args: [
        {
          selector: '[resizeable]',
          host: {
            '[class.resizeable]': 'resizeEnabled'
          }
        }
      ]
    }
  ];
  ResizeableDirective.ctorParameters = function () {
    return [{ type: core.ElementRef }, { type: core.Renderer2 }];
  };
  ResizeableDirective.propDecorators = {
    resizeEnabled: [{ type: core.Input }],
    minWidth: [{ type: core.Input }],
    maxWidth: [{ type: core.Input }],
    resize: [{ type: core.Output }],
    onMousedown: [{ type: core.HostListener, args: ['mousedown', ['$event']] }]
  };

  /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
  /* global Reflect, Promise */
  var extendStatics = function (d, b) {
    extendStatics =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (d, b) {
          d.__proto__ = b;
        }) ||
      function (d, b) {
        for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
      };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
  }
  var __assign = function () {
    __assign =
      Object.assign ||
      function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
  function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
      }
    return t;
  }
  function __decorate(decorators, target, key, desc) {
    var c = arguments.length,
      r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i])) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }
  function __param(paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  }
  function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(metadataKey, metadataValue);
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }
  function __generator(thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t = op[0] & 2 ? y['return'] : op[0] ? y['throw'] || ((t = y['return']) && t.call(y), 0) : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  }
  var __createBinding = Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          }
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      };
  function __exportStar(m, o) {
    for (var p in m) if (p !== 'default' && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
  }
  function __values(o) {
    var s = typeof Symbol === 'function' && Symbol.iterator,
      m = s && o[s],
      i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === 'number')
      return {
        next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? 'Object is not iterable.' : 'Symbol.iterator is not defined.');
  }
  function __read(o, n) {
    var m = typeof Symbol === 'function' && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o),
      r,
      ar = [],
      e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
      e = { error: error };
    } finally {
      try {
        if (r && !r.done && (m = i['return'])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  }
  function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
  }
  function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
    return r;
  }
  function __await(v) {
    return this instanceof __await ? ((this.v = v), this) : new __await(v);
  }
  function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError('Symbol.asyncIterator is not defined.');
    var g = generator.apply(thisArg, _arguments || []),
      i,
      q = [];
    return (
      (i = {}),
      verb('next'),
      verb('throw'),
      verb('return'),
      (i[Symbol.asyncIterator] = function () {
        return this;
      }),
      i
    );
    function verb(n) {
      if (g[n])
        i[n] = function (v) {
          return new Promise(function (a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume('next', value);
    }
    function reject(value) {
      resume('throw', value);
    }
    function settle(f, v) {
      if ((f(v), q.shift(), q.length)) resume(q[0][0], q[0][1]);
    }
  }
  function __asyncDelegator(o) {
    var i, p;
    return (
      (i = {}),
      verb('next'),
      verb('throw', function (e) {
        throw e;
      }),
      verb('return'),
      (i[Symbol.iterator] = function () {
        return this;
      }),
      i
    );
    function verb(n, f) {
      i[n] = o[n]
        ? function (v) {
            return (p = !p) ? { value: __await(o[n](v)), done: n === 'return' } : f ? f(v) : v;
          }
        : f;
    }
  }
  function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError('Symbol.asyncIterator is not defined.');
    var m = o[Symbol.asyncIterator],
      i;
    return m
      ? m.call(o)
      : ((o = typeof __values === 'function' ? __values(o) : o[Symbol.iterator]()),
        (i = {}),
        verb('next'),
        verb('throw'),
        verb('return'),
        (i[Symbol.asyncIterator] = function () {
          return this;
        }),
        i);
    function verb(n) {
      i[n] =
        o[n] &&
        function (v) {
          return new Promise(function (resolve, reject) {
            (v = o[n](v)), settle(resolve, reject, v.done, v.value);
          });
        };
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function (v) {
        resolve({ value: v, done: d });
      }, reject);
    }
  }
  function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) {
      Object.defineProperty(cooked, 'raw', { value: raw });
    } else {
      cooked.raw = raw;
    }
    return cooked;
  }
  var __setModuleDefault = Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      };
  function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  }
  function __importDefault(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  }
  function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
      throw new TypeError('attempted to get private field on non-instance');
    }
    return privateMap.get(receiver);
  }
  function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
      throw new TypeError('attempted to set private field on non-instance');
    }
    privateMap.set(receiver, value);
    return value;
  }

  var OrderableDirective = /** @class */ (function () {
    function OrderableDirective(differs, document) {
      this.document = document;
      this.reorder = new core.EventEmitter();
      this.targetChanged = new core.EventEmitter();
      this.differ = differs.find({}).create();
    }
    OrderableDirective.prototype.ngAfterContentInit = function () {
      // HACK: Investigate Better Way
      this.updateSubscriptions();
      this.draggables.changes.subscribe(this.updateSubscriptions.bind(this));
    };
    OrderableDirective.prototype.ngOnDestroy = function () {
      this.draggables.forEach(function (d) {
        d.dragStart.unsubscribe();
        d.dragging.unsubscribe();
        d.dragEnd.unsubscribe();
      });
    };
    OrderableDirective.prototype.updateSubscriptions = function () {
      var _this = this;
      var diffs = this.differ.diff(this.createMapDiffs());
      if (diffs) {
        var subscribe = function (_a) {
          var currentValue = _a.currentValue,
            previousValue = _a.previousValue;
          unsubscribe_1({ previousValue: previousValue });
          if (currentValue) {
            currentValue.dragStart.subscribe(_this.onDragStart.bind(_this));
            currentValue.dragging.subscribe(_this.onDragging.bind(_this));
            currentValue.dragEnd.subscribe(_this.onDragEnd.bind(_this));
          }
        };
        var unsubscribe_1 = function (_a) {
          var previousValue = _a.previousValue;
          if (previousValue) {
            previousValue.dragStart.unsubscribe();
            previousValue.dragging.unsubscribe();
            previousValue.dragEnd.unsubscribe();
          }
        };
        diffs.forEachAddedItem(subscribe);
        // diffs.forEachChangedItem(subscribe.bind(this));
        diffs.forEachRemovedItem(unsubscribe_1);
      }
    };
    OrderableDirective.prototype.onDragStart = function () {
      var e_1, _a;
      this.positions = {};
      var i = 0;
      try {
        for (var _b = __values(this.draggables.toArray()), _c = _b.next(); !_c.done; _c = _b.next()) {
          var dragger = _c.value;
          var elm = dragger.element;
          var left = parseInt(elm.offsetLeft.toString(), 0);
          this.positions[dragger.dragModel.prop] = {
            left: left,
            right: left + parseInt(elm.offsetWidth.toString(), 0),
            index: i++,
            element: elm
          };
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
    };
    OrderableDirective.prototype.onDragging = function (_a) {
      var element = _a.element,
        model = _a.model,
        event = _a.event;
      var prevPos = this.positions[model.prop];
      var target = this.isTarget(model, event);
      if (target) {
        if (this.lastDraggingIndex !== target.i) {
          this.targetChanged.emit({
            prevIndex: this.lastDraggingIndex,
            newIndex: target.i,
            initialIndex: prevPos.index
          });
          this.lastDraggingIndex = target.i;
        }
      } else if (this.lastDraggingIndex !== prevPos.index) {
        this.targetChanged.emit({
          prevIndex: this.lastDraggingIndex,
          initialIndex: prevPos.index
        });
        this.lastDraggingIndex = prevPos.index;
      }
    };
    OrderableDirective.prototype.onDragEnd = function (_a) {
      var element = _a.element,
        model = _a.model,
        event = _a.event;
      var prevPos = this.positions[model.prop];
      var target = this.isTarget(model, event);
      if (target) {
        this.reorder.emit({
          prevIndex: prevPos.index,
          newIndex: target.i,
          model: model
        });
      }
      this.lastDraggingIndex = undefined;
      element.style.left = 'auto';
    };
    OrderableDirective.prototype.isTarget = function (model, event) {
      var i = 0;
      var x = event.x || event.clientX;
      var y = event.y || event.clientY;
      var targets = this.document.elementsFromPoint(x, y);
      var _loop_1 = function (prop) {
        // current column position which throws event.
        var pos = this_1.positions[prop];
        // since we drag the inner span, we need to find it in the elements at the cursor
        if (
          model.prop !== prop &&
          targets.find(function (el) {
            return el === pos.element;
          })
        ) {
          return {
            value: {
              pos: pos,
              i: i
            }
          };
        }
        i++;
      };
      var this_1 = this;
      for (var prop in this.positions) {
        var state_1 = _loop_1(prop);
        if (typeof state_1 === 'object') return state_1.value;
      }
    };
    OrderableDirective.prototype.createMapDiffs = function () {
      return this.draggables.toArray().reduce(function (acc, curr) {
        acc[curr.dragModel.$$id] = curr;
        return acc;
      }, {});
    };
    return OrderableDirective;
  })();
  OrderableDirective.decorators = [{ type: core.Directive, args: [{ selector: '[orderable]' }] }];
  OrderableDirective.ctorParameters = function () {
    return [
      { type: core.KeyValueDiffers },
      { type: undefined, decorators: [{ type: core.Inject, args: [common.DOCUMENT] }] }
    ];
  };
  OrderableDirective.propDecorators = {
    reorder: [{ type: core.Output }],
    targetChanged: [{ type: core.Output }],
    draggables: [{ type: core.ContentChildren, args: [DraggableDirective, { descendants: true }] }]
  };

  var LongPressDirective = /** @class */ (function () {
    function LongPressDirective() {
      this.pressEnabled = true;
      this.duration = 500;
      this.longPressStart = new core.EventEmitter();
      this.longPressing = new core.EventEmitter();
      this.longPressEnd = new core.EventEmitter();
      this.mouseX = 0;
      this.mouseY = 0;
    }
    Object.defineProperty(LongPressDirective.prototype, 'press', {
      get: function () {
        return this.pressing;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(LongPressDirective.prototype, 'isLongPress', {
      get: function () {
        return this.isLongPressing;
      },
      enumerable: false,
      configurable: true
    });
    LongPressDirective.prototype.onMouseDown = function (event) {
      var _this = this;
      // don't do right/middle clicks
      if (event.which !== 1 || !this.pressEnabled) return;
      // don't start drag if its on resize handle
      var target = event.target;
      if (target.classList.contains('resize-handle')) return;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      this.pressing = true;
      this.isLongPressing = false;
      var mouseup = rxjs.fromEvent(document, 'mouseup');
      this.subscription = mouseup.subscribe(function (ev) {
        return _this.onMouseup();
      });
      this.timeout = setTimeout(function () {
        _this.isLongPressing = true;
        _this.longPressStart.emit({
          event: event,
          model: _this.pressModel
        });
        _this.subscription.add(
          rxjs
            .fromEvent(document, 'mousemove')
            .pipe(operators.takeUntil(mouseup))
            .subscribe(function (mouseEvent) {
              return _this.onMouseMove(mouseEvent);
            })
        );
        _this.loop(event);
      }, this.duration);
      this.loop(event);
    };
    LongPressDirective.prototype.onMouseMove = function (event) {
      if (this.pressing && !this.isLongPressing) {
        var xThres = Math.abs(event.clientX - this.mouseX) > 10;
        var yThres = Math.abs(event.clientY - this.mouseY) > 10;
        if (xThres || yThres) {
          this.endPress();
        }
      }
    };
    LongPressDirective.prototype.loop = function (event) {
      var _this = this;
      if (this.isLongPressing) {
        this.timeout = setTimeout(function () {
          _this.longPressing.emit({
            event: event,
            model: _this.pressModel
          });
          _this.loop(event);
        }, 50);
      }
    };
    LongPressDirective.prototype.endPress = function () {
      clearTimeout(this.timeout);
      this.isLongPressing = false;
      this.pressing = false;
      this._destroySubscription();
      this.longPressEnd.emit({
        model: this.pressModel
      });
    };
    LongPressDirective.prototype.onMouseup = function () {
      this.endPress();
    };
    LongPressDirective.prototype.ngOnDestroy = function () {
      this._destroySubscription();
    };
    LongPressDirective.prototype._destroySubscription = function () {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = undefined;
      }
    };
    return LongPressDirective;
  })();
  LongPressDirective.decorators = [{ type: core.Directive, args: [{ selector: '[long-press]' }] }];
  LongPressDirective.propDecorators = {
    pressEnabled: [{ type: core.Input }],
    pressModel: [{ type: core.Input }],
    duration: [{ type: core.Input }],
    longPressStart: [{ type: core.Output }],
    longPressing: [{ type: core.Output }],
    longPressEnd: [{ type: core.Output }],
    press: [{ type: core.HostBinding, args: ['class.press'] }],
    isLongPress: [{ type: core.HostBinding, args: ['class.longpress'] }],
    onMouseDown: [{ type: core.HostListener, args: ['mousedown', ['$event']] }]
  };

  var ScrollerComponent = /** @class */ (function () {
    function ScrollerComponent(ngZone, element, renderer) {
      this.ngZone = ngZone;
      this.renderer = renderer;
      this.scrollbarV = false;
      this.scrollbarH = false;
      this.scroll = new core.EventEmitter();
      this.scrollYPos = 0;
      this.scrollXPos = 0;
      this.prevScrollYPos = 0;
      this.prevScrollXPos = 0;
      this._scrollEventListener = null;
      this.element = element.nativeElement;
    }
    ScrollerComponent.prototype.ngOnInit = function () {
      // manual bind so we don't always listen
      if (this.scrollbarV || this.scrollbarH) {
        var renderer = this.renderer;
        this.parentElement = renderer.parentNode(renderer.parentNode(this.element));
        this._scrollEventListener = this.onScrolled.bind(this);
        this.parentElement.addEventListener('scroll', this._scrollEventListener);
      }
    };
    ScrollerComponent.prototype.ngOnDestroy = function () {
      if (this._scrollEventListener) {
        this.parentElement.removeEventListener('scroll', this._scrollEventListener);
        this._scrollEventListener = null;
      }
    };
    ScrollerComponent.prototype.setOffset = function (offsetY) {
      if (this.parentElement) {
        this.parentElement.scrollTop = offsetY;
      }
    };
    ScrollerComponent.prototype.onScrolled = function (event) {
      var _this = this;
      var dom = event.currentTarget;
      requestAnimationFrame(function () {
        _this.scrollYPos = dom.scrollTop;
        _this.scrollXPos = dom.scrollLeft;
        _this.updateOffset();
      });
    };
    ScrollerComponent.prototype.updateOffset = function () {
      var direction;
      if (this.scrollYPos < this.prevScrollYPos) {
        direction = 'down';
      } else if (this.scrollYPos > this.prevScrollYPos) {
        direction = 'up';
      }
      this.scroll.emit({
        direction: direction,
        scrollYPos: this.scrollYPos,
        scrollXPos: this.scrollXPos
      });
      this.prevScrollYPos = this.scrollYPos;
      this.prevScrollXPos = this.scrollXPos;
    };
    return ScrollerComponent;
  })();
  ScrollerComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-scroller',
          template: ' <ng-content></ng-content> ',
          host: {
            class: 'datatable-scroll'
          },
          changeDetection: core.ChangeDetectionStrategy.OnPush
        }
      ]
    }
  ];
  ScrollerComponent.ctorParameters = function () {
    return [{ type: core.NgZone }, { type: core.ElementRef }, { type: core.Renderer2 }];
  };
  ScrollerComponent.propDecorators = {
    scrollbarV: [{ type: core.Input }],
    scrollbarH: [{ type: core.Input }],
    scrollHeight: [{ type: core.HostBinding, args: ['style.height.px'] }, { type: core.Input }],
    scrollWidth: [{ type: core.HostBinding, args: ['style.width.px'] }, { type: core.Input }],
    scroll: [{ type: core.Output }]
  };

  var DatatableGroupHeaderTemplateDirective = /** @class */ (function () {
    function DatatableGroupHeaderTemplateDirective(template) {
      this.template = template;
    }
    return DatatableGroupHeaderTemplateDirective;
  })();
  DatatableGroupHeaderTemplateDirective.decorators = [
    {
      type: core.Directive,
      args: [
        {
          selector: '[ngx-datatable-group-header-template]'
        }
      ]
    }
  ];
  DatatableGroupHeaderTemplateDirective.ctorParameters = function () {
    return [{ type: core.TemplateRef }];
  };

  var DatatableGroupHeaderDirective = /** @class */ (function () {
    function DatatableGroupHeaderDirective() {
      /**
       * Row height is required when virtual scroll is enabled.
       */
      this.rowHeight = 0;
      /**
       * Track toggling of group visibility
       */
      this.toggle = new core.EventEmitter();
    }
    Object.defineProperty(DatatableGroupHeaderDirective.prototype, 'template', {
      get: function () {
        return this._templateInput || this._templateQuery;
      },
      enumerable: false,
      configurable: true
    });
    /**
     * Toggle the expansion of a group
     */
    DatatableGroupHeaderDirective.prototype.toggleExpandGroup = function (group) {
      this.toggle.emit({
        type: 'group',
        value: group
      });
    };
    /**
     * Expand all groups
     */
    DatatableGroupHeaderDirective.prototype.expandAllGroups = function () {
      this.toggle.emit({
        type: 'all',
        value: true
      });
    };
    /**
     * Collapse all groups
     */
    DatatableGroupHeaderDirective.prototype.collapseAllGroups = function () {
      this.toggle.emit({
        type: 'all',
        value: false
      });
    };
    return DatatableGroupHeaderDirective;
  })();
  DatatableGroupHeaderDirective.decorators = [
    { type: core.Directive, args: [{ selector: 'ngx-datatable-group-header' }] }
  ];
  DatatableGroupHeaderDirective.propDecorators = {
    rowHeight: [{ type: core.Input }],
    _templateInput: [{ type: core.Input, args: ['template'] }],
    _templateQuery: [
      {
        type: core.ContentChild,
        args: [DatatableGroupHeaderTemplateDirective, { read: core.TemplateRef, static: true }]
      }
    ],
    toggle: [{ type: core.Output }]
  };

  /**
   * Always returns the empty string ''
   */
  function emptyStringGetter() {
    return '';
  }
  /**
   * Returns the appropriate getter function for this kind of prop.
   * If prop == null, returns the emptyStringGetter.
   */
  function getterForProp(prop) {
    if (prop == null) {
      return emptyStringGetter;
    }
    if (typeof prop === 'number') {
      return numericIndexGetter;
    } else {
      // deep or simple
      if (prop.indexOf('.') !== -1) {
        return deepValueGetter;
      } else {
        return shallowValueGetter;
      }
    }
  }
  /**
   * Returns the value at this numeric index.
   * @param row array of values
   * @param index numeric index
   * @returns any or '' if invalid index
   */
  function numericIndexGetter(row, index) {
    if (row == null) {
      return '';
    }
    // mimic behavior of deepValueGetter
    if (!row || index == null) {
      return row;
    }
    var value = row[index];
    if (value == null) {
      return '';
    }
    return value;
  }
  /**
   * Returns the value of a field.
   * (more efficient than deepValueGetter)
   * @param obj object containing the field
   * @param fieldName field name string
   */
  function shallowValueGetter(obj, fieldName) {
    if (obj == null) {
      return '';
    }
    if (!obj || !fieldName) {
      return obj;
    }
    var value = obj[fieldName];
    if (value == null) {
      return '';
    }
    return value;
  }
  /**
   * Returns a deep object given a string. zoo['animal.type']
   */
  function deepValueGetter(obj, path) {
    if (obj == null) {
      return '';
    }
    if (!obj || !path) {
      return obj;
    }
    // check if path matches a root-level field
    // { "a.b.c": 123 }
    var current = obj[path];
    if (current !== undefined) {
      return current;
    }
    current = obj;
    var split = path.split('.');
    if (split.length) {
      for (var i = 0; i < split.length; i++) {
        current = current[split[i]];
        // if found undefined, return empty string
        if (current === undefined || current === null) {
          return '';
        }
      }
    }
    return current;
  }

  function optionalGetterForProp(prop) {
    return (
      prop &&
      function (row) {
        return getterForProp(prop)(row, prop);
      }
    );
  }
  /**
   * This functions rearrange items by their parents
   * Also sets the level value to each of the items
   *
   * Note: Expecting each item has a property called parentId
   * Note: This algorithm will fail if a list has two or more items with same ID
   * NOTE: This algorithm will fail if there is a deadlock of relationship
   *
   * For example,
   *
   * Input
   *
   * id -> parent
   * 1  -> 0
   * 2  -> 0
   * 3  -> 1
   * 4  -> 1
   * 5  -> 2
   * 7  -> 8
   * 6  -> 3
   *
   *
   * Output
   * id -> level
   * 1      -> 0
   * --3    -> 1
   * ----6  -> 2
   * --4    -> 1
   * 2      -> 0
   * --5    -> 1
   * 7     -> 8
   *
   *
   * @param rows
   *
   */
  function groupRowsByParents(rows, from, to) {
    if (from && to) {
      var nodeById = {};
      var l = rows.length;
      var node = null;
      nodeById[0] = new TreeNode(); // that's the root node
      var uniqIDs = rows.reduce(function (arr, item) {
        var toValue = to(item);
        if (arr.indexOf(toValue) === -1) {
          arr.push(toValue);
        }
        return arr;
      }, []);
      for (var i = 0; i < l; i++) {
        // make TreeNode objects for each item
        nodeById[to(rows[i])] = new TreeNode(rows[i]);
      }
      for (var i = 0; i < l; i++) {
        // link all TreeNode objects
        node = nodeById[to(rows[i])];
        var parent = 0;
        var fromValue = from(node.row);
        if (!!fromValue && uniqIDs.indexOf(fromValue) > -1) {
          parent = fromValue;
        }
        node.parent = nodeById[parent];
        node.row['level'] = node.parent.row['level'] + 1;
        node.parent.children.push(node);
      }
      var resolvedRows_1 = [];
      nodeById[0].flatten(function () {
        resolvedRows_1 = __spread(resolvedRows_1, [this.row]);
      }, true);
      return resolvedRows_1;
    } else {
      return rows;
    }
  }
  var TreeNode = /** @class */ (function () {
    function TreeNode(row) {
      if (row === void 0) {
        row = null;
      }
      if (!row) {
        row = {
          level: -1,
          treeStatus: 'expanded'
        };
      }
      this.row = row;
      this.parent = null;
      this.children = [];
    }
    TreeNode.prototype.flatten = function (f, recursive) {
      if (this.row['treeStatus'] === 'expanded') {
        for (var i = 0, l = this.children.length; i < l; i++) {
          var child = this.children[i];
          f.apply(child, Array.prototype.slice.call(arguments, 2));
          if (recursive) child.flatten.apply(child, arguments);
        }
      }
    };
    return TreeNode;
  })();

  /**
   * Converts strings from something to camel case
   * http://stackoverflow.com/questions/10425287/convert-dash-separated-string-to-camelcase
   */
  function camelCase(str) {
    // Replace special characters with a space
    str = str.replace(/[^a-zA-Z0-9 ]/g, ' ');
    // put a space before an uppercase letter
    str = str.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    // Lower case first character and some other stuff
    str = str
      .replace(/([^a-zA-Z0-9 ])|^[0-9]+/g, '')
      .trim()
      .toLowerCase();
    // uppercase characters preceded by a space or number
    str = str.replace(/([ 0-9]+)([a-zA-Z])/g, function (a, b, c) {
      return b.trim() + c.toUpperCase();
    });
    return str;
  }
  /**
   * Converts strings from camel case to words
   * http://stackoverflow.com/questions/7225407/convert-camelcasetext-to-camel-case-text
   */
  function deCamelCase(str) {
    return str
      .replace(/([A-Z])/g, function (match) {
        return ' ' + match;
      })
      .replace(/^./, function (match) {
        return match.toUpperCase();
      });
  }

  /**
   * Creates a unique object id.
   * http://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
   */
  function id() {
    return ('0000' + ((Math.random() * Math.pow(36, 4)) << 0).toString(36)).slice(-4);
  }

  /**
   * Sets the column defaults
   */
  function setColumnDefaults(columns) {
    var e_1, _a;
    if (!columns) return;
    // Only one column should hold the tree view
    // Thus if multiple columns are provided with
    // isTreeColumn as true we take only the first one
    var treeColumnFound = false;
    try {
      for (
        var columns_1 = __values(columns), columns_1_1 = columns_1.next();
        !columns_1_1.done;
        columns_1_1 = columns_1.next()
      ) {
        var column = columns_1_1.value;
        if (!column.$$id) {
          column.$$id = id();
        }
        // prop can be numeric; zero is valid not a missing prop
        // translate name => prop
        if (isNullOrUndefined(column.prop) && column.name) {
          column.prop = camelCase(column.name);
        }
        if (!column.$$valueGetter) {
          column.$$valueGetter = getterForProp(column.prop);
        }
        // format props if no name passed
        if (!isNullOrUndefined(column.prop) && isNullOrUndefined(column.name)) {
          column.name = deCamelCase(String(column.prop));
        }
        if (isNullOrUndefined(column.prop) && isNullOrUndefined(column.name)) {
          column.name = ''; // Fixes IE and Edge displaying `null`
        }
        if (!column.hasOwnProperty('resizeable')) {
          column.resizeable = true;
        }
        if (!column.hasOwnProperty('sortable')) {
          column.sortable = true;
        }
        if (!column.hasOwnProperty('draggable')) {
          column.draggable = true;
        }
        if (!column.hasOwnProperty('canAutoResize')) {
          column.canAutoResize = true;
        }
        if (!column.hasOwnProperty('width')) {
          column.width = 150;
        }
        if (!column.hasOwnProperty('isTreeColumn')) {
          column.isTreeColumn = false;
        } else {
          if (column.isTreeColumn && !treeColumnFound) {
            // If the first column with isTreeColumn is true found
            // we mark that treeCoulmn is found
            treeColumnFound = true;
          } else {
            // After that isTreeColumn property for any other column
            // will be set as false
            column.isTreeColumn = false;
          }
        }
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (columns_1_1 && !columns_1_1.done && (_a = columns_1.return)) _a.call(columns_1);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
  }
  function isNullOrUndefined(value) {
    return value === null || value === undefined;
  }
  /**
   * Translates templates definitions to objects
   */
  function translateTemplates(templates) {
    var e_2, _a, e_3, _b;
    var result = [];
    try {
      for (
        var templates_1 = __values(templates), templates_1_1 = templates_1.next();
        !templates_1_1.done;
        templates_1_1 = templates_1.next()
      ) {
        var temp = templates_1_1.value;
        var col = {};
        var props = Object.getOwnPropertyNames(temp);
        try {
          for (
            var props_1 = ((e_3 = void 0), __values(props)), props_1_1 = props_1.next();
            !props_1_1.done;
            props_1_1 = props_1.next()
          ) {
            var prop = props_1_1.value;
            col[prop] = temp[prop];
          }
        } catch (e_3_1) {
          e_3 = { error: e_3_1 };
        } finally {
          try {
            if (props_1_1 && !props_1_1.done && (_b = props_1.return)) _b.call(props_1);
          } finally {
            if (e_3) throw e_3.error;
          }
        }
        if (temp.headerTemplate) {
          col.headerTemplate = temp.headerTemplate;
        }
        if (temp.cellTemplate) {
          col.cellTemplate = temp.cellTemplate;
        }
        if (temp.summaryFunc) {
          col.summaryFunc = temp.summaryFunc;
        }
        if (temp.summaryTemplate) {
          col.summaryTemplate = temp.summaryTemplate;
        }
        result.push(col);
      }
    } catch (e_2_1) {
      e_2 = { error: e_2_1 };
    } finally {
      try {
        if (templates_1_1 && !templates_1_1.done && (_a = templates_1.return)) _a.call(templates_1);
      } finally {
        if (e_2) throw e_2.error;
      }
    }
    return result;
  }

  (function (ColumnMode) {
    ColumnMode['standard'] = 'standard';
    ColumnMode['flex'] = 'flex';
    ColumnMode['force'] = 'force';
  })(exports.ColumnMode || (exports.ColumnMode = {}));

  (function (SelectionType) {
    SelectionType['single'] = 'single';
    SelectionType['multi'] = 'multi';
    SelectionType['multiClick'] = 'multiClick';
    SelectionType['cell'] = 'cell';
    SelectionType['checkbox'] = 'checkbox';
  })(exports.SelectionType || (exports.SelectionType = {}));

  (function (SortType) {
    SortType['single'] = 'single';
    SortType['multi'] = 'multi';
  })(exports.SortType || (exports.SortType = {}));

  (function (ContextmenuType) {
    ContextmenuType['header'] = 'header';
    ContextmenuType['body'] = 'body';
  })(exports.ContextmenuType || (exports.ContextmenuType = {}));

  var DataTableColumnHeaderDirective = /** @class */ (function () {
    function DataTableColumnHeaderDirective(template) {
      this.template = template;
    }
    return DataTableColumnHeaderDirective;
  })();
  DataTableColumnHeaderDirective.decorators = [
    { type: core.Directive, args: [{ selector: '[ngx-datatable-header-template]' }] }
  ];
  DataTableColumnHeaderDirective.ctorParameters = function () {
    return [{ type: core.TemplateRef }];
  };

  var DataTableColumnCellDirective = /** @class */ (function () {
    function DataTableColumnCellDirective(template) {
      this.template = template;
    }
    return DataTableColumnCellDirective;
  })();
  DataTableColumnCellDirective.decorators = [
    { type: core.Directive, args: [{ selector: '[ngx-datatable-cell-template]' }] }
  ];
  DataTableColumnCellDirective.ctorParameters = function () {
    return [{ type: core.TemplateRef }];
  };

  var DataTableColumnCellTreeToggle = /** @class */ (function () {
    function DataTableColumnCellTreeToggle(template) {
      this.template = template;
    }
    return DataTableColumnCellTreeToggle;
  })();
  DataTableColumnCellTreeToggle.decorators = [
    { type: core.Directive, args: [{ selector: '[ngx-datatable-tree-toggle]' }] }
  ];
  DataTableColumnCellTreeToggle.ctorParameters = function () {
    return [{ type: core.TemplateRef }];
  };

  var DataTableColumnDirective = /** @class */ (function () {
    function DataTableColumnDirective(columnChangesService) {
      this.columnChangesService = columnChangesService;
      this.isFirstChange = true;
    }
    Object.defineProperty(DataTableColumnDirective.prototype, 'cellTemplate', {
      get: function () {
        return this._cellTemplateInput || this._cellTemplateQuery;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableColumnDirective.prototype, 'headerTemplate', {
      get: function () {
        return this._headerTemplateInput || this._headerTemplateQuery;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableColumnDirective.prototype, 'treeToggleTemplate', {
      get: function () {
        return this._treeToggleTemplateInput || this._treeToggleTemplateQuery;
      },
      enumerable: false,
      configurable: true
    });
    DataTableColumnDirective.prototype.ngOnChanges = function () {
      if (this.isFirstChange) {
        this.isFirstChange = false;
      } else {
        this.columnChangesService.onInputChange();
      }
    };
    return DataTableColumnDirective;
  })();
  DataTableColumnDirective.decorators = [{ type: core.Directive, args: [{ selector: 'ngx-datatable-column' }] }];
  DataTableColumnDirective.ctorParameters = function () {
    return [{ type: ColumnChangesService }];
  };
  DataTableColumnDirective.propDecorators = {
    name: [{ type: core.Input }],
    prop: [{ type: core.Input }],
    frozenLeft: [{ type: core.Input }],
    frozenRight: [{ type: core.Input }],
    flexGrow: [{ type: core.Input }],
    resizeable: [{ type: core.Input }],
    comparator: [{ type: core.Input }],
    pipe: [{ type: core.Input }],
    sortable: [{ type: core.Input }],
    draggable: [{ type: core.Input }],
    canAutoResize: [{ type: core.Input }],
    minWidth: [{ type: core.Input }],
    width: [{ type: core.Input }],
    maxWidth: [{ type: core.Input }],
    checkboxable: [{ type: core.Input }],
    headerCheckboxable: [{ type: core.Input }],
    headerClass: [{ type: core.Input }],
    cellClass: [{ type: core.Input }],
    isTreeColumn: [{ type: core.Input }],
    treeLevelIndent: [{ type: core.Input }],
    summaryFunc: [{ type: core.Input }],
    summaryTemplate: [{ type: core.Input }],
    _cellTemplateInput: [{ type: core.Input, args: ['cellTemplate'] }],
    _cellTemplateQuery: [
      { type: core.ContentChild, args: [DataTableColumnCellDirective, { read: core.TemplateRef, static: true }] }
    ],
    _headerTemplateInput: [{ type: core.Input, args: ['headerTemplate'] }],
    _headerTemplateQuery: [
      { type: core.ContentChild, args: [DataTableColumnHeaderDirective, { read: core.TemplateRef, static: true }] }
    ],
    _treeToggleTemplateInput: [{ type: core.Input, args: ['treeToggleTemplate'] }],
    _treeToggleTemplateQuery: [
      { type: core.ContentChild, args: [DataTableColumnCellTreeToggle, { read: core.TemplateRef, static: true }] }
    ]
  };

  var DatatableRowDetailTemplateDirective = /** @class */ (function () {
    function DatatableRowDetailTemplateDirective(template) {
      this.template = template;
    }
    return DatatableRowDetailTemplateDirective;
  })();
  DatatableRowDetailTemplateDirective.decorators = [
    {
      type: core.Directive,
      args: [
        {
          selector: '[ngx-datatable-row-detail-template]'
        }
      ]
    }
  ];
  DatatableRowDetailTemplateDirective.ctorParameters = function () {
    return [{ type: core.TemplateRef }];
  };

  var DatatableRowDetailDirective = /** @class */ (function () {
    function DatatableRowDetailDirective() {
      /**
       * The detail row height is required especially
       * when virtual scroll is enabled.
       */
      this.rowHeight = 0;
      /**
       * Row detail row visbility was toggled.
       */
      this.toggle = new core.EventEmitter();
    }
    Object.defineProperty(DatatableRowDetailDirective.prototype, 'template', {
      get: function () {
        return this._templateInput || this._templateQuery;
      },
      enumerable: false,
      configurable: true
    });
    /**
     * Toggle the expansion of the row
     */
    DatatableRowDetailDirective.prototype.toggleExpandRow = function (row) {
      this.toggle.emit({
        type: 'row',
        value: row
      });
    };
    /**
     * API method to expand all the rows.
     */
    DatatableRowDetailDirective.prototype.expandAllRows = function () {
      this.toggle.emit({
        type: 'all',
        value: true
      });
    };
    /**
     * API method to collapse all the rows.
     */
    DatatableRowDetailDirective.prototype.collapseAllRows = function () {
      this.toggle.emit({
        type: 'all',
        value: false
      });
    };
    return DatatableRowDetailDirective;
  })();
  DatatableRowDetailDirective.decorators = [{ type: core.Directive, args: [{ selector: 'ngx-datatable-row-detail' }] }];
  DatatableRowDetailDirective.propDecorators = {
    rowHeight: [{ type: core.Input }],
    _templateInput: [{ type: core.Input, args: ['template'] }],
    _templateQuery: [
      { type: core.ContentChild, args: [DatatableRowDetailTemplateDirective, { read: core.TemplateRef, static: true }] }
    ],
    toggle: [{ type: core.Output }]
  };

  var DatatableFooterDirective = /** @class */ (function () {
    function DatatableFooterDirective() {}
    Object.defineProperty(DatatableFooterDirective.prototype, 'template', {
      get: function () {
        return this._templateInput || this._templateQuery;
      },
      enumerable: false,
      configurable: true
    });
    return DatatableFooterDirective;
  })();
  DatatableFooterDirective.decorators = [{ type: core.Directive, args: [{ selector: 'ngx-datatable-footer' }] }];
  DatatableFooterDirective.propDecorators = {
    footerHeight: [{ type: core.Input }],
    totalMessage: [{ type: core.Input }],
    selectedMessage: [{ type: core.Input }],
    pagerLeftArrowIcon: [{ type: core.Input }],
    pagerRightArrowIcon: [{ type: core.Input }],
    pagerPreviousIcon: [{ type: core.Input }],
    pagerNextIcon: [{ type: core.Input }],
    _templateInput: [{ type: core.Input, args: ['template'] }],
    _templateQuery: [{ type: core.ContentChild, args: [DataTableFooterTemplateDirective, { read: core.TemplateRef }] }]
  };

  /**
   * Returns the columns by pin.
   */
  function columnsByPin(cols) {
    var e_1, _a;
    var ret = {
      left: [],
      center: [],
      right: []
    };
    if (cols) {
      try {
        for (var cols_1 = __values(cols), cols_1_1 = cols_1.next(); !cols_1_1.done; cols_1_1 = cols_1.next()) {
          var col = cols_1_1.value;
          if (col.frozenLeft) {
            ret.left.push(col);
          } else if (col.frozenRight) {
            ret.right.push(col);
          } else {
            ret.center.push(col);
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (cols_1_1 && !cols_1_1.done && (_a = cols_1.return)) _a.call(cols_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
    }
    return ret;
  }
  /**
   * Returns the widths of all group sets of a column
   */
  function columnGroupWidths(groups, all) {
    return {
      left: columnTotalWidth(groups.left),
      center: columnTotalWidth(groups.center),
      right: columnTotalWidth(groups.right),
      total: Math.floor(columnTotalWidth(all))
    };
  }
  /**
   * Calculates the total width of all columns and their groups
   */
  function columnTotalWidth(columns, prop) {
    var e_2, _a;
    var totalWidth = 0;
    if (columns) {
      try {
        for (
          var columns_1 = __values(columns), columns_1_1 = columns_1.next();
          !columns_1_1.done;
          columns_1_1 = columns_1.next()
        ) {
          var c = columns_1_1.value;
          var has = prop && c[prop];
          var width = has ? c[prop] : c.width;
          totalWidth = totalWidth + parseFloat(width);
        }
      } catch (e_2_1) {
        e_2 = { error: e_2_1 };
      } finally {
        try {
          if (columns_1_1 && !columns_1_1.done && (_a = columns_1.return)) _a.call(columns_1);
        } finally {
          if (e_2) throw e_2.error;
        }
      }
    }
    return totalWidth;
  }
  /**
   * Calculates the total width of all columns and their groups
   */
  function columnsTotalWidth(columns, prop) {
    var e_3, _a;
    var totalWidth = 0;
    try {
      for (
        var columns_2 = __values(columns), columns_2_1 = columns_2.next();
        !columns_2_1.done;
        columns_2_1 = columns_2.next()
      ) {
        var column = columns_2_1.value;
        var has = prop && column[prop];
        totalWidth = totalWidth + (has ? column[prop] : column.width);
      }
    } catch (e_3_1) {
      e_3 = { error: e_3_1 };
    } finally {
      try {
        if (columns_2_1 && !columns_2_1.done && (_a = columns_2.return)) _a.call(columns_2);
      } finally {
        if (e_3) throw e_3.error;
      }
    }
    return totalWidth;
  }
  function columnsByPinArr(val) {
    var colsByPinArr = [];
    var colsByPin = columnsByPin(val);
    colsByPinArr.push({ type: 'left', columns: colsByPin['left'] });
    colsByPinArr.push({ type: 'center', columns: colsByPin['center'] });
    colsByPinArr.push({ type: 'right', columns: colsByPin['right'] });
    return colsByPinArr;
  }

  /**
   * This object contains the cache of the various row heights that are present inside
   * the data table.   Its based on Fenwick tree data structure that helps with
   * querying sums that have time complexity of log n.
   *
   * Fenwick Tree Credits: http://petr-mitrichev.blogspot.com/2013/05/fenwick-tree-range-updates.html
   * https://github.com/mikolalysenko/fenwick-tree
   *
   */
  var RowHeightCache = /** @class */ (function () {
    function RowHeightCache() {
      /**
       * Tree Array stores the cumulative information of the row heights to perform efficient
       * range queries and updates.  Currently the tree is initialized to the base row
       * height instead of the detail row height.
       */
      this.treeArray = [];
    }
    /**
     * Clear the Tree array.
     */
    RowHeightCache.prototype.clearCache = function () {
      this.treeArray = [];
    };
    /**
     * Initialize the Fenwick tree with row Heights.
     *
     * @param rows The array of rows which contain the expanded status.
     * @param rowHeight The row height.
     * @param detailRowHeight The detail row height.
     */
    RowHeightCache.prototype.initCache = function (details) {
      var rows = details.rows,
        rowHeight = details.rowHeight,
        detailRowHeight = details.detailRowHeight,
        externalVirtual = details.externalVirtual,
        rowCount = details.rowCount,
        rowIndexes = details.rowIndexes,
        rowExpansions = details.rowExpansions;
      var isFn = typeof rowHeight === 'function';
      var isDetailFn = typeof detailRowHeight === 'function';
      if (!isFn && isNaN(rowHeight)) {
        throw new Error(
          "Row Height cache initialization failed. Please ensure that 'rowHeight' is a\n        valid number or function value: (" +
            rowHeight +
            ") when 'scrollbarV' is enabled."
        );
      }
      // Add this additional guard in case detailRowHeight is set to 'auto' as it wont work.
      if (!isDetailFn && isNaN(detailRowHeight)) {
        throw new Error(
          "Row Height cache initialization failed. Please ensure that 'detailRowHeight' is a\n        valid number or function value: (" +
            detailRowHeight +
            ") when 'scrollbarV' is enabled."
        );
      }
      var n = externalVirtual ? rowCount : rows.length;
      this.treeArray = new Array(n);
      for (var i = 0; i < n; ++i) {
        this.treeArray[i] = 0;
      }
      for (var i = 0; i < n; ++i) {
        var row = rows[i];
        var currentRowHeight = rowHeight;
        if (isFn) {
          currentRowHeight = rowHeight(row);
        }
        // Add the detail row height to the already expanded rows.
        // This is useful for the table that goes through a filter or sort.
        var expanded = rowExpansions.has(row);
        if (row && expanded) {
          if (isDetailFn) {
            var index = rowIndexes.get(row);
            currentRowHeight += detailRowHeight(row, index);
          } else {
            currentRowHeight += detailRowHeight;
          }
        }
        this.update(i, currentRowHeight);
      }
    };
    /**
     * Given the ScrollY position i.e. sum, provide the rowIndex
     * that is present in the current view port.  Below handles edge cases.
     */
    RowHeightCache.prototype.getRowIndex = function (scrollY) {
      if (scrollY === 0) return 0;
      return this.calcRowIndex(scrollY);
    };
    /**
     * When a row is expanded or rowHeight is changed, update the height.  This can
     * be utilized in future when Angular Data table supports dynamic row heights.
     */
    RowHeightCache.prototype.update = function (atRowIndex, byRowHeight) {
      if (!this.treeArray.length) {
        throw new Error(
          'Update at index ' +
            atRowIndex +
            ' with value ' +
            byRowHeight +
            ' failed:\n        Row Height cache not initialized.'
        );
      }
      var n = this.treeArray.length;
      atRowIndex |= 0;
      while (atRowIndex < n) {
        this.treeArray[atRowIndex] += byRowHeight;
        atRowIndex |= atRowIndex + 1;
      }
    };
    /**
     * Range Sum query from 1 to the rowIndex
     */
    RowHeightCache.prototype.query = function (atIndex) {
      if (!this.treeArray.length) {
        throw new Error('query at index ' + atIndex + ' failed: Fenwick tree array not initialized.');
      }
      var sum = 0;
      atIndex |= 0;
      while (atIndex >= 0) {
        sum += this.treeArray[atIndex];
        atIndex = (atIndex & (atIndex + 1)) - 1;
      }
      return sum;
    };
    /**
     * Find the total height between 2 row indexes
     */
    RowHeightCache.prototype.queryBetween = function (atIndexA, atIndexB) {
      return this.query(atIndexB) - this.query(atIndexA - 1);
    };
    /**
     * Given the ScrollY position i.e. sum, provide the rowIndex
     * that is present in the current view port.
     */
    RowHeightCache.prototype.calcRowIndex = function (sum) {
      if (!this.treeArray.length) return 0;
      var pos = -1;
      var dataLength = this.treeArray.length;
      // Get the highest bit for the block size.
      var highestBit = Math.pow(2, dataLength.toString(2).length - 1);
      for (var blockSize = highestBit; blockSize !== 0; blockSize >>= 1) {
        var nextPos = pos + blockSize;
        if (nextPos < dataLength && sum >= this.treeArray[nextPos]) {
          sum -= this.treeArray[nextPos];
          pos = nextPos;
        }
      }
      return pos + 1;
    };
    return RowHeightCache;
  })();

  var cache = {};
  var testStyle = typeof document !== 'undefined' ? document.createElement('div').style : undefined;
  var ɵ0 = function () {
    var styles = typeof window !== 'undefined' ? window.getComputedStyle(document.documentElement, '') : undefined;
    var match =
      typeof styles !== 'undefined'
        ? Array.prototype.slice
            .call(styles)
            .join('')
            .match(/-(moz|webkit|ms)-/)
        : null;
    var pre = match !== null ? match[1] : undefined;
    // tslint:disable-next-line: tsr-detect-non-literal-regexp
    var dom = typeof pre !== 'undefined' ? 'WebKit|Moz|MS|O'.match(new RegExp('(' + pre + ')', 'i'))[1] : undefined;
    return dom
      ? {
          dom: dom,
          lowercase: pre,
          css: '-' + pre + '-',
          js: pre[0].toUpperCase() + pre.substr(1)
        }
      : undefined;
  };
  // Get Prefix
  // http://davidwalsh.name/vendor-prefix
  var prefix = ɵ0();
  function getVendorPrefixedName(property) {
    var name = camelCase(property);
    if (!cache[name]) {
      if (prefix !== undefined && testStyle[prefix.css + property] !== undefined) {
        cache[name] = prefix.css + property;
      } else if (testStyle[property] !== undefined) {
        cache[name] = property;
      }
    }
    return cache[name];
  }

  // browser detection and prefixing tools
  var transform = typeof window !== 'undefined' ? getVendorPrefixedName('transform') : undefined;
  var backfaceVisibility = typeof window !== 'undefined' ? getVendorPrefixedName('backfaceVisibility') : undefined;
  var hasCSSTransforms = typeof window !== 'undefined' ? !!getVendorPrefixedName('transform') : undefined;
  var hasCSS3DTransforms = typeof window !== 'undefined' ? !!getVendorPrefixedName('perspective') : undefined;
  var ua = typeof window !== 'undefined' ? window.navigator.userAgent : 'Chrome';
  var isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
  function translateXY(styles, x, y) {
    if (typeof transform !== 'undefined' && hasCSSTransforms) {
      if (!isSafari && hasCSS3DTransforms) {
        styles[transform] = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
        styles[backfaceVisibility] = 'hidden';
      } else {
        styles[camelCase(transform)] = 'translate(' + x + 'px, ' + y + 'px)';
      }
    } else {
      styles.top = y + 'px';
      styles.left = x + 'px';
    }
  }

  var DataTableBodyComponent = /** @class */ (function () {
    /**
     * Creates an instance of DataTableBodyComponent.
     */
    function DataTableBodyComponent(cd) {
      var _this = this;
      this.cd = cd;
      this.selected = [];
      this.scroll = new core.EventEmitter();
      this.page = new core.EventEmitter();
      this.activate = new core.EventEmitter();
      this.select = new core.EventEmitter();
      this.detailToggle = new core.EventEmitter();
      this.rowContextmenu = new core.EventEmitter(false);
      this.treeAction = new core.EventEmitter();
      this.rowHeightsCache = new RowHeightCache();
      this.temp = [];
      this.offsetY = 0;
      this.indexes = {};
      this.rowIndexes = new WeakMap();
      this.rowExpansions = [];
      /**
       * Get the height of the detail row.
       */
      this.getDetailRowHeight = function (row, index) {
        if (!_this.rowDetail) {
          return 0;
        }
        var rowHeight = _this.rowDetail.rowHeight;
        return typeof rowHeight === 'function' ? rowHeight(row, index) : rowHeight;
      };
      // declare fn here so we can get access to the `this` property
      this.rowTrackingFn = function (index, row) {
        var idx = _this.getRowIndex(row);
        if (_this.trackByProp) {
          return row[_this.trackByProp];
        } else {
          return idx;
        }
      };
    }
    Object.defineProperty(DataTableBodyComponent.prototype, 'setGroupHeader', {
      set: function (groupHeader) {
        this.groupHeader = groupHeader;
        if (this.groupHeader && !this.listener) {
          this.setGroupHeaderListener();
        }
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'pageSize', {
      get: function () {
        return this._pageSize;
      },
      set: function (val) {
        this._pageSize = val;
        this.recalcLayout();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'rows', {
      get: function () {
        return this._rows;
      },
      set: function (val) {
        this._rows = val;
        this.recalcLayout();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'columns', {
      get: function () {
        return this._columns;
      },
      set: function (val) {
        this._columns = val;
        var colsByPin = columnsByPin(val);
        this.columnGroupWidths = columnGroupWidths(colsByPin, val);
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'offset', {
      get: function () {
        return this._offset;
      },
      set: function (val) {
        this._offset = val;
        if (!this.scrollbarV || (this.scrollbarV && !this.virtualization)) this.recalcLayout();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'rowCount', {
      get: function () {
        return this._rowCount;
      },
      set: function (val) {
        this._rowCount = val;
        this.recalcLayout();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'bodyWidth', {
      get: function () {
        if (this.scrollbarH) {
          return this.innerWidth + 'px';
        } else {
          return '100%';
        }
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'bodyHeight', {
      get: function () {
        return this._bodyHeight;
      },
      set: function (val) {
        if (this.scrollbarV) {
          this._bodyHeight = val + 'px';
        } else {
          this._bodyHeight = 'auto';
        }
        this.recalcLayout();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'selectEnabled', {
      /**
       * Returns if selection is enabled.
       */
      get: function () {
        return !!this.selectionType;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyComponent.prototype, 'scrollHeight', {
      /**
       * Property that would calculate the height of scroll bar
       * based on the row heights cache for virtual scroll and virtualization. Other scenarios
       * calculate scroll height automatically (as height will be undefined).
       */
      get: function () {
        if (this.scrollbarV && this.virtualization && this.rowCount) {
          return this.rowHeightsCache.query(this.rowCount - 1);
        }
        // avoid TS7030: Not all code paths return a value.
        return undefined;
      },
      enumerable: false,
      configurable: true
    });
    /**
     * Called after the constructor, initializing input properties
     */
    DataTableBodyComponent.prototype.ngOnInit = function () {
      var _this = this;
      if (this.rowDetail) {
        this.listener = this.rowDetail.toggle.subscribe(function (_a) {
          var type = _a.type,
            value = _a.value;
          if (type === 'row') {
            _this.toggleRowExpansion(value);
          }
          if (type === 'all') {
            _this.toggleAllRows(value);
          }
          // Refresh rows after toggle
          // Fixes #883
          _this.updateIndexes();
          _this.updateRows();
          _this.cd.markForCheck();
        });
      }
      if (this.groupHeader) {
        this.setGroupHeaderListener();
      }
    };
    DataTableBodyComponent.prototype.setGroupHeaderListener = function () {
      var _this = this;
      this.listener = this.groupHeader.toggle.subscribe(function (_a) {
        var type = _a.type,
          value = _a.value;
        if (type === 'group') {
          _this.toggleRowExpansion(value);
        }
        if (type === 'all') {
          _this.toggleAllRows(value);
        }
        // Refresh rows after toggle
        // Fixes #883
        _this.updateIndexes();
        _this.updateRows();
        _this.cd.markForCheck();
      });
    };
    /**
     * Called once, before the instance is destroyed.
     */
    DataTableBodyComponent.prototype.ngOnDestroy = function () {
      if ((this.rowDetail || this.groupHeader) && this.listener) {
        this.listener.unsubscribe();
      }
    };
    /**
     * Updates the Y offset given a new offset.
     */
    DataTableBodyComponent.prototype.updateOffsetY = function (offset) {
      // scroller is missing on empty table
      if (!this.scroller) {
        return;
      }
      if (this.scrollbarV && this.virtualization && offset) {
        // First get the row Index that we need to move to.
        var rowIndex = this.pageSize * offset;
        offset = this.rowHeightsCache.query(rowIndex - 1);
      } else if (this.scrollbarV && !this.virtualization) {
        offset = 0;
      }
      this.scroller.setOffset(offset || 0);
    };
    /**
     * Body was scrolled, this is mainly useful for
     * when a user is server-side pagination via virtual scroll.
     */
    DataTableBodyComponent.prototype.onBodyScroll = function (event) {
      var scrollYPos = event.scrollYPos;
      var scrollXPos = event.scrollXPos;
      // if scroll change, trigger update
      // this is mainly used for header cell positions
      if (this.offsetY !== scrollYPos || this.offsetX !== scrollXPos) {
        this.scroll.emit({
          offsetY: scrollYPos,
          offsetX: scrollXPos
        });
      }
      this.offsetY = scrollYPos;
      this.offsetX = scrollXPos;
      this.updateIndexes();
      this.updatePage(event.direction);
      this.updateRows();
    };
    /**
     * Updates the page given a direction.
     */
    DataTableBodyComponent.prototype.updatePage = function (direction) {
      var offset = this.indexes.first / this.pageSize;
      if (direction === 'up') {
        offset = Math.ceil(offset);
      } else if (direction === 'down') {
        offset = Math.floor(offset);
      }
      if (direction !== undefined && !isNaN(offset)) {
        this.page.emit({ offset: offset });
      }
    };
    /**
     * Updates the rows in the view port
     */
    DataTableBodyComponent.prototype.updateRows = function () {
      var _this = this;
      var _a = this.indexes,
        first = _a.first,
        last = _a.last;
      var rowIndex = first;
      var idx = 0;
      var temp = [];
      // if grouprowsby has been specified treat row paging
      // parameters as group paging parameters ie if limit 10 has been
      // specified treat it as 10 groups rather than 10 rows
      if (this.groupedRows) {
        var maxRowsPerGroup = 3;
        // if there is only one group set the maximum number of
        // rows per group the same as the total number of rows
        if (this.groupedRows.length === 1) {
          maxRowsPerGroup = this.groupedRows[0].value.length;
        }
        while (rowIndex < last && rowIndex < this.groupedRows.length) {
          // Add the groups into this page
          var group = this.groupedRows[rowIndex];
          this.rowIndexes.set(group, rowIndex);
          if (group.value) {
            // add indexes for each group item
            group.value.forEach(function (g, i) {
              var _idx = rowIndex + '-' + i;
              _this.rowIndexes.set(g, _idx);
            });
          }
          temp[idx] = group;
          idx++;
          // Group index in this context
          rowIndex++;
        }
      } else {
        while (rowIndex < last && rowIndex < this.rowCount) {
          var row = this.rows[rowIndex];
          if (row) {
            // add indexes for each row
            this.rowIndexes.set(row, rowIndex);
            temp[idx] = row;
          }
          idx++;
          rowIndex++;
        }
      }
      this.temp = temp;
    };
    /**
     * Get the row height
     */
    DataTableBodyComponent.prototype.getRowHeight = function (row) {
      // if its a function return it
      if (typeof this.rowHeight === 'function') {
        return this.rowHeight(row);
      }
      return this.rowHeight;
    };
    /**
     * @param group the group with all rows
     */
    DataTableBodyComponent.prototype.getGroupHeight = function (group) {
      var rowHeight = 0;
      if (group.value) {
        for (var index = 0; index < group.value.length; index++) {
          rowHeight += this.getRowAndDetailHeight(group.value[index]);
        }
      }
      return rowHeight;
    };
    /**
     * Calculate row height based on the expanded state of the row.
     */
    DataTableBodyComponent.prototype.getRowAndDetailHeight = function (row) {
      var rowHeight = this.getRowHeight(row);
      var expanded = this.getRowExpanded(row);
      // Adding detail row height if its expanded.
      if (expanded) {
        rowHeight += this.getDetailRowHeight(row);
      }
      return rowHeight;
    };
    /**
     * Calculates the styles for the row so that the rows can be moved in 2D space
     * during virtual scroll inside the DOM.   In the below case the Y position is
     * manipulated.   As an example, if the height of row 0 is 30 px and row 1 is
     * 100 px then following styles are generated:
     *
     * transform: translate3d(0px, 0px, 0px);    ->  row0
     * transform: translate3d(0px, 30px, 0px);   ->  row1
     * transform: translate3d(0px, 130px, 0px);  ->  row2
     *
     * Row heights have to be calculated based on the row heights cache as we wont
     * be able to determine which row is of what height before hand.  In the above
     * case the positionY of the translate3d for row2 would be the sum of all the
     * heights of the rows before it (i.e. row0 and row1).
     *
     * @param rows the row that needs to be placed in the 2D space.
     * @returns the CSS3 style to be applied
     *
     * @memberOf DataTableBodyComponent
     */
    DataTableBodyComponent.prototype.getRowsStyles = function (rows) {
      var styles = {};
      // only add styles for the group if there is a group
      if (this.groupedRows) {
        styles.width = this.columnGroupWidths.total;
      }
      if (this.scrollbarV && this.virtualization) {
        var idx = 0;
        if (this.groupedRows) {
          // Get the latest row rowindex in a group
          var row = rows[rows.length - 1];
          idx = row ? this.getRowIndex(row) : 0;
        } else {
          idx = this.getRowIndex(rows);
        }
        // const pos = idx * rowHeight;
        // The position of this row would be the sum of all row heights
        // until the previous row position.
        var pos = this.rowHeightsCache.query(idx - 1);
        translateXY(styles, 0, pos);
      }
      return styles;
    };
    /**
     * Calculate bottom summary row offset for scrollbar mode.
     * For more information about cache and offset calculation
     * see description for `getRowsStyles` method
     *
     * @returns the CSS3 style to be applied
     *
     * @memberOf DataTableBodyComponent
     */
    DataTableBodyComponent.prototype.getBottomSummaryRowStyles = function () {
      if (!this.scrollbarV || !this.rows || !this.rows.length) {
        return null;
      }
      var styles = { position: 'absolute' };
      var pos = this.rowHeightsCache.query(this.rows.length - 1);
      translateXY(styles, 0, pos);
      return styles;
    };
    /**
     * Hides the loading indicator
     */
    DataTableBodyComponent.prototype.hideIndicator = function () {
      var _this = this;
      setTimeout(function () {
        return (_this.loadingIndicator = false);
      }, 500);
    };
    /**
     * Updates the index of the rows in the viewport
     */
    DataTableBodyComponent.prototype.updateIndexes = function () {
      var first = 0;
      var last = 0;
      if (this.scrollbarV) {
        if (this.virtualization) {
          // Calculation of the first and last indexes will be based on where the
          // scrollY position would be at.  The last index would be the one
          // that shows up inside the view port the last.
          var height = parseInt(this.bodyHeight, 0);
          first = this.rowHeightsCache.getRowIndex(this.offsetY);
          last = this.rowHeightsCache.getRowIndex(height + this.offsetY) + 1;
        } else {
          // If virtual rows are not needed
          // We render all in one go
          first = 0;
          last = this.rowCount;
        }
      } else {
        // The server is handling paging and will pass an array that begins with the
        // element at a specified offset.  first should always be 0 with external paging.
        if (!this.externalPaging) {
          first = Math.max(this.offset * this.pageSize, 0);
        }
        last = Math.min(first + this.pageSize, this.rowCount);
      }
      this.indexes = { first: first, last: last };
    };
    /**
     * Refreshes the full Row Height cache.  Should be used
     * when the entire row array state has changed.
     */
    DataTableBodyComponent.prototype.refreshRowHeightCache = function () {
      var e_1, _a;
      if (!this.scrollbarV || (this.scrollbarV && !this.virtualization)) {
        return;
      }
      // clear the previous row height cache if already present.
      // this is useful during sorts, filters where the state of the
      // rows array is changed.
      this.rowHeightsCache.clearCache();
      // Initialize the tree only if there are rows inside the tree.
      if (this.rows && this.rows.length) {
        var rowExpansions = new Set();
        try {
          for (var _b = __values(this.rows), _c = _b.next(); !_c.done; _c = _b.next()) {
            var row = _c.value;
            if (this.getRowExpanded(row)) {
              rowExpansions.add(row);
            }
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
        this.rowHeightsCache.initCache({
          rows: this.rows,
          rowHeight: this.rowHeight,
          detailRowHeight: this.getDetailRowHeight,
          externalVirtual: this.scrollbarV && this.externalPaging,
          rowCount: this.rowCount,
          rowIndexes: this.rowIndexes,
          rowExpansions: rowExpansions
        });
      }
    };
    /**
     * Gets the index for the view port
     */
    DataTableBodyComponent.prototype.getAdjustedViewPortIndex = function () {
      // Capture the row index of the first row that is visible on the viewport.
      // If the scroll bar is just below the row which is highlighted then make that as the
      // first index.
      var viewPortFirstRowIndex = this.indexes.first;
      if (this.scrollbarV && this.virtualization) {
        var offsetScroll = this.rowHeightsCache.query(viewPortFirstRowIndex - 1);
        return offsetScroll <= this.offsetY ? viewPortFirstRowIndex - 1 : viewPortFirstRowIndex;
      }
      return viewPortFirstRowIndex;
    };
    /**
     * Toggle the Expansion of the row i.e. if the row is expanded then it will
     * collapse and vice versa.   Note that the expanded status is stored as
     * a part of the row object itself as we have to preserve the expanded row
     * status in case of sorting and filtering of the row set.
     */
    DataTableBodyComponent.prototype.toggleRowExpansion = function (row) {
      // Capture the row index of the first row that is visible on the viewport.
      var viewPortFirstRowIndex = this.getAdjustedViewPortIndex();
      var rowExpandedIdx = this.getRowExpandedIdx(row, this.rowExpansions);
      var expanded = rowExpandedIdx > -1;
      // If the detailRowHeight is auto --> only in case of non-virtualized scroll
      if (this.scrollbarV && this.virtualization) {
        var detailRowHeight = this.getDetailRowHeight(row) * (expanded ? -1 : 1);
        // const idx = this.rowIndexes.get(row) || 0;
        var idx = this.getRowIndex(row);
        this.rowHeightsCache.update(idx, detailRowHeight);
      }
      // Update the toggled row and update thive nevere heights in the cache.
      if (expanded) {
        this.rowExpansions.splice(rowExpandedIdx, 1);
      } else {
        this.rowExpansions.push(row);
      }
      this.isAllGroupCollapsed = this.rowExpansions.length === 0;
      this.detailToggle.emit({
        rows: [row],
        currentIndex: viewPortFirstRowIndex
      });
    };
    /**
     * Expand/Collapse all the rows no matter what their state is.
     */
    DataTableBodyComponent.prototype.toggleAllRows = function (expanded) {
      var e_2, _a;
      // clear prev expansions
      this.rowExpansions = [];
      // Capture the row index of the first row that is visible on the viewport.
      var viewPortFirstRowIndex = this.getAdjustedViewPortIndex();
      if (expanded) {
        try {
          for (var _b = __values(this.rows), _c = _b.next(); !_c.done; _c = _b.next()) {
            var row = _c.value;
            this.rowExpansions.push(row);
          }
        } catch (e_2_1) {
          e_2 = { error: e_2_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_2) throw e_2.error;
          }
        }
      }
      if (this.scrollbarV) {
        // Refresh the full row heights cache since every row was affected.
        this.recalcLayout();
      }
      // Emit all rows that have been expanded.
      this.detailToggle.emit({
        rows: this.rows,
        currentIndex: viewPortFirstRowIndex
      });
    };
    /**
     * Recalculates the table
     */
    DataTableBodyComponent.prototype.recalcLayout = function () {
      this.refreshRowHeightCache();
      this.updateIndexes();
      this.updateRows();
    };
    /**
     * Tracks the column
     */
    DataTableBodyComponent.prototype.columnTrackingFn = function (index, column) {
      return column.$$id;
    };
    /**
     * Gets the row pinning group styles
     */
    DataTableBodyComponent.prototype.stylesByGroup = function (group) {
      var widths = this.columnGroupWidths;
      var offsetX = this.offsetX;
      var styles = {
        width: widths[group] + 'px'
      };
      if (group === 'left') {
        translateXY(styles, offsetX, 0);
      } else if (group === 'right') {
        var bodyWidth = parseInt(this.innerWidth + '', 0);
        var totalDiff = widths.total - bodyWidth;
        var offsetDiff = totalDiff - offsetX;
        var offset = offsetDiff * -1;
        translateXY(styles, offset, 0);
      }
      return styles;
    };
    /**
     * Returns if the row was expanded and set default row expansion when row expansion is empty
     */
    DataTableBodyComponent.prototype.getRowExpanded = function (row) {
      var e_3, _a;
      if (this.rowExpansions.length === 0 && this.groupExpansionDefault && !this.isAllGroupCollapsed) {
        try {
          for (var _b = __values(this.groupedRows), _c = _b.next(); !_c.done; _c = _b.next()) {
            var group = _c.value;
            this.rowExpansions.push(group);
          }
        } catch (e_3_1) {
          e_3 = { error: e_3_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_3) throw e_3.error;
          }
        }
      }
      return this.getRowExpandedIdx(row, this.rowExpansions) > -1;
    };
    DataTableBodyComponent.prototype.getRowExpandedIdx = function (row, expanded) {
      var _this = this;
      if (!expanded || !expanded.length) return -1;
      var rowId = this.rowIdentity(row);
      return expanded.findIndex(function (r) {
        var id = _this.rowIdentity(r);
        return id === rowId;
      });
    };
    /**
     * Gets the row index given a row
     */
    DataTableBodyComponent.prototype.getRowIndex = function (row) {
      return this.rowIndexes.get(row) || 0;
    };
    DataTableBodyComponent.prototype.onTreeAction = function (row) {
      this.treeAction.emit({ row: row });
    };
    return DataTableBodyComponent;
  })();
  DataTableBodyComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-body',
          template:
            '\n    <datatable-progress *ngIf="loadingIndicator"> </datatable-progress>\n    <datatable-selection\n      #selector\n      [selected]="selected"\n      [rows]="rows"\n      [selectCheck]="selectCheck"\n      [selectEnabled]="selectEnabled"\n      [selectionType]="selectionType"\n      [rowIdentity]="rowIdentity"\n      (select)="select.emit($event)"\n      (activate)="activate.emit($event)"\n    >\n      <datatable-scroller\n        *ngIf="rows?.length"\n        [scrollbarV]="scrollbarV"\n        [scrollbarH]="scrollbarH"\n        [scrollHeight]="scrollHeight"\n        [scrollWidth]="columnGroupWidths?.total"\n        (scroll)="onBodyScroll($event)"\n      >\n        <datatable-summary-row\n          *ngIf="summaryRow && summaryPosition === \'top\'"\n          [rowHeight]="summaryHeight"\n          [offsetX]="offsetX"\n          [innerWidth]="innerWidth"\n          [rows]="rows"\n          [columns]="columns"\n        >\n        </datatable-summary-row>\n        <datatable-row-wrapper\n          [groupedRows]="groupedRows"\n          *ngFor="let group of temp; let i = index; trackBy: rowTrackingFn"\n          [innerWidth]="innerWidth"\n          [ngStyle]="getRowsStyles(group)"\n          [rowDetail]="rowDetail"\n          [groupHeader]="groupHeader"\n          [offsetX]="offsetX"\n          [detailRowHeight]="getDetailRowHeight(group && group[i], i)"\n          [row]="group"\n          [expanded]="getRowExpanded(group)"\n          [rowIndex]="getRowIndex(group && group[i])"\n          (rowContextmenu)="rowContextmenu.emit($event)"\n        >\n          <datatable-body-row\n            role="row"\n            *ngIf="!groupedRows; else groupedRowsTemplate"\n            tabindex="-1"\n            [isSelected]="selector.getRowSelected(group)"\n            [innerWidth]="innerWidth"\n            [offsetX]="offsetX"\n            [columns]="columns"\n            [rowHeight]="getRowHeight(group)"\n            [row]="group"\n            [rowIndex]="getRowIndex(group)"\n            [expanded]="getRowExpanded(group)"\n            [rowClass]="rowClass"\n            [selectCheck]="selectCheck"\n            [displayCheck]="displayCheck"\n            [treeStatus]="group && group.treeStatus"\n            (treeAction)="onTreeAction(group)"\n            (activate)="selector.onActivate($event, indexes.first + i)"\n          >\n          </datatable-body-row>\n          <ng-template #groupedRowsTemplate>\n            <datatable-body-row\n              role="row"\n              *ngFor="let row of group.value; let i = index; trackBy: rowTrackingFn"\n              tabindex="-1"\n              [isSelected]="selector.getRowSelected(row)"\n              [innerWidth]="innerWidth"\n              [offsetX]="offsetX"\n              [columns]="columns"\n              [rowHeight]="getRowHeight(row)"\n              [row]="row"\n              [group]="group.value"\n              [rowIndex]="getRowIndex(row)"\n              [expanded]="getRowExpanded(row)"\n              [rowClass]="rowClass"\n              [treeStatus]="row.treeStatus"\n              (treeAction)="onTreeAction(row)"\n              (activate)="selector.onActivate($event, i)"\n            >\n            </datatable-body-row>\n          </ng-template>\n        </datatable-row-wrapper>\n        <datatable-summary-row\n          role="row"\n          *ngIf="summaryRow && summaryPosition === \'bottom\'"\n          [ngStyle]="getBottomSummaryRowStyles()"\n          [rowHeight]="summaryHeight"\n          [offsetX]="offsetX"\n          [innerWidth]="innerWidth"\n          [rows]="rows"\n          [columns]="columns"\n        >\n        </datatable-summary-row>\n      </datatable-scroller>\n      <div class="empty-row" *ngIf="!rows?.length && !loadingIndicator" [innerHTML]="emptyMessage"></div>\n    </datatable-selection>\n  ',
          changeDetection: core.ChangeDetectionStrategy.OnPush,
          host: {
            class: 'datatable-body'
          }
        }
      ]
    }
  ];
  DataTableBodyComponent.ctorParameters = function () {
    return [{ type: core.ChangeDetectorRef }];
  };
  DataTableBodyComponent.propDecorators = {
    scrollbarV: [{ type: core.Input }],
    scrollbarH: [{ type: core.Input }],
    loadingIndicator: [{ type: core.Input }],
    externalPaging: [{ type: core.Input }],
    rowHeight: [{ type: core.Input }],
    offsetX: [{ type: core.Input }],
    emptyMessage: [{ type: core.Input }],
    selectionType: [{ type: core.Input }],
    selected: [{ type: core.Input }],
    rowIdentity: [{ type: core.Input }],
    rowDetail: [{ type: core.Input }],
    setGroupHeader: [{ type: core.Input, args: ['groupHeader'] }],
    selectCheck: [{ type: core.Input }],
    displayCheck: [{ type: core.Input }],
    trackByProp: [{ type: core.Input }],
    rowClass: [{ type: core.Input }],
    groupedRows: [{ type: core.Input }],
    groupExpansionDefault: [{ type: core.Input }],
    innerWidth: [{ type: core.Input }],
    groupRowsBy: [{ type: core.Input }],
    virtualization: [{ type: core.Input }],
    summaryRow: [{ type: core.Input }],
    summaryPosition: [{ type: core.Input }],
    summaryHeight: [{ type: core.Input }],
    pageSize: [{ type: core.Input }],
    rows: [{ type: core.Input }],
    columns: [{ type: core.Input }],
    offset: [{ type: core.Input }],
    rowCount: [{ type: core.Input }],
    bodyWidth: [{ type: core.HostBinding, args: ['style.width'] }],
    bodyHeight: [{ type: core.Input }, { type: core.HostBinding, args: ['style.height'] }],
    scroll: [{ type: core.Output }],
    page: [{ type: core.Output }],
    activate: [{ type: core.Output }],
    select: [{ type: core.Output }],
    detailToggle: [{ type: core.Output }],
    rowContextmenu: [{ type: core.Output }],
    treeAction: [{ type: core.Output }],
    scroller: [{ type: core.ViewChild, args: [ScrollerComponent] }]
  };

  var DataTableHeaderComponent = /** @class */ (function () {
    function DataTableHeaderComponent(cd) {
      this.cd = cd;
      this.sort = new core.EventEmitter();
      this.reorder = new core.EventEmitter();
      this.resize = new core.EventEmitter();
      this.select = new core.EventEmitter();
      this.columnContextmenu = new core.EventEmitter(false);
      this._columnGroupWidths = {
        total: 100
      };
      this._styleByGroup = {
        left: {},
        center: {},
        right: {}
      };
      this.destroyed = false;
    }
    Object.defineProperty(DataTableHeaderComponent.prototype, 'innerWidth', {
      get: function () {
        return this._innerWidth;
      },
      set: function (val) {
        var _this = this;
        this._innerWidth = val;
        setTimeout(function () {
          if (_this._columns) {
            var colByPin = columnsByPin(_this._columns);
            _this._columnGroupWidths = columnGroupWidths(colByPin, _this._columns);
            _this.setStylesByGroup();
          }
        });
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderComponent.prototype, 'headerHeight', {
      get: function () {
        return this._headerHeight;
      },
      set: function (val) {
        if (val !== 'auto') {
          this._headerHeight = val + 'px';
        } else {
          this._headerHeight = val;
        }
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderComponent.prototype, 'columns', {
      get: function () {
        return this._columns;
      },
      set: function (val) {
        var _this = this;
        this._columns = val;
        var colsByPin = columnsByPin(val);
        this._columnsByPin = columnsByPinArr(val);
        setTimeout(function () {
          _this._columnGroupWidths = columnGroupWidths(colsByPin, val);
          _this.setStylesByGroup();
        });
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderComponent.prototype, 'offsetX', {
      get: function () {
        return this._offsetX;
      },
      set: function (val) {
        this._offsetX = val;
        this.setStylesByGroup();
      },
      enumerable: false,
      configurable: true
    });
    DataTableHeaderComponent.prototype.ngOnDestroy = function () {
      this.destroyed = true;
    };
    DataTableHeaderComponent.prototype.onLongPressStart = function (_a) {
      var event = _a.event,
        model = _a.model;
      model.dragging = true;
      this.dragEventTarget = event;
    };
    DataTableHeaderComponent.prototype.onLongPressEnd = function (_a) {
      var _this = this;
      var event = _a.event,
        model = _a.model;
      this.dragEventTarget = event;
      // delay resetting so sort can be
      // prevented if we were dragging
      setTimeout(function () {
        // datatable component creates copies from columns on reorder
        // set dragging to false on new objects
        var column = _this._columns.find(function (c) {
          return c.$$id === model.$$id;
        });
        if (column) {
          column.dragging = false;
        }
      }, 5);
    };
    Object.defineProperty(DataTableHeaderComponent.prototype, 'headerWidth', {
      get: function () {
        if (this.scrollbarH) {
          return this.innerWidth + 'px';
        }
        return '100%';
      },
      enumerable: false,
      configurable: true
    });
    DataTableHeaderComponent.prototype.trackByGroups = function (index, colGroup) {
      return colGroup.type;
    };
    DataTableHeaderComponent.prototype.columnTrackingFn = function (index, column) {
      return column.$$id;
    };
    DataTableHeaderComponent.prototype.onColumnResized = function (width, column) {
      if (width <= column.minWidth) {
        width = column.minWidth;
      } else if (width >= column.maxWidth) {
        width = column.maxWidth;
      }
      this.resize.emit({
        column: column,
        prevValue: column.width,
        newValue: width
      });
    };
    DataTableHeaderComponent.prototype.onColumnReordered = function (_a) {
      var prevIndex = _a.prevIndex,
        newIndex = _a.newIndex,
        model = _a.model;
      var column = this.getColumn(newIndex);
      column.isTarget = false;
      column.targetMarkerContext = undefined;
      this.reorder.emit({
        column: model,
        prevValue: prevIndex,
        newValue: newIndex
      });
    };
    DataTableHeaderComponent.prototype.onTargetChanged = function (_a) {
      var prevIndex = _a.prevIndex,
        newIndex = _a.newIndex,
        initialIndex = _a.initialIndex;
      if (prevIndex || prevIndex === 0) {
        var oldColumn = this.getColumn(prevIndex);
        oldColumn.isTarget = false;
        oldColumn.targetMarkerContext = undefined;
      }
      if (newIndex || newIndex === 0) {
        var newColumn = this.getColumn(newIndex);
        newColumn.isTarget = true;
        if (initialIndex !== newIndex) {
          newColumn.targetMarkerContext = {
            class: 'targetMarker '.concat(initialIndex > newIndex ? 'dragFromRight' : 'dragFromLeft')
          };
        }
      }
    };
    DataTableHeaderComponent.prototype.getColumn = function (index) {
      var leftColumnCount = this._columnsByPin[0].columns.length;
      if (index < leftColumnCount) {
        return this._columnsByPin[0].columns[index];
      }
      var centerColumnCount = this._columnsByPin[1].columns.length;
      if (index < leftColumnCount + centerColumnCount) {
        return this._columnsByPin[1].columns[index - leftColumnCount];
      }
      return this._columnsByPin[2].columns[index - leftColumnCount - centerColumnCount];
    };
    DataTableHeaderComponent.prototype.onSort = function (_a) {
      var column = _a.column,
        prevValue = _a.prevValue,
        newValue = _a.newValue;
      // if we are dragging don't sort!
      if (column.dragging) {
        return;
      }
      var sorts = this.calcNewSorts(column, prevValue, newValue);
      this.sort.emit({
        sorts: sorts,
        column: column,
        prevValue: prevValue,
        newValue: newValue
      });
    };
    DataTableHeaderComponent.prototype.calcNewSorts = function (column, prevValue, newValue) {
      var idx = 0;
      if (!this.sorts) {
        this.sorts = [];
      }
      var sorts = this.sorts.map(function (s, i) {
        s = Object.assign({}, s);
        if (s.prop === column.prop) {
          idx = i;
        }
        return s;
      });
      if (newValue === undefined) {
        sorts.splice(idx, 1);
      } else if (prevValue) {
        sorts[idx].dir = newValue;
      } else {
        if (this.sortType === exports.SortType.single) {
          sorts.splice(0, this.sorts.length);
        }
        sorts.push({ dir: newValue, prop: column.prop });
      }
      return sorts;
    };
    DataTableHeaderComponent.prototype.setStylesByGroup = function () {
      this._styleByGroup.left = this.calcStylesByGroup('left');
      this._styleByGroup.center = this.calcStylesByGroup('center');
      this._styleByGroup.right = this.calcStylesByGroup('right');
      if (!this.destroyed) {
        this.cd.detectChanges();
      }
    };
    DataTableHeaderComponent.prototype.calcStylesByGroup = function (group) {
      var widths = this._columnGroupWidths;
      var offsetX = this.offsetX;
      var styles = {
        width: widths[group] + 'px'
      };
      if (group === 'center') {
        translateXY(styles, offsetX * -1, 0);
      } else if (group === 'right') {
        var totalDiff = widths.total - this.innerWidth;
        var offset = totalDiff * -1;
        translateXY(styles, offset, 0);
      }
      return styles;
    };
    return DataTableHeaderComponent;
  })();
  DataTableHeaderComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-header',
          template:
            '\n    <div\n      role="row"\n      orderable\n      (reorder)="onColumnReordered($event)"\n      (targetChanged)="onTargetChanged($event)"\n      [style.width.px]="_columnGroupWidths.total"\n      class="datatable-header-inner"\n    >\n      <div\n        *ngFor="let colGroup of _columnsByPin; trackBy: trackByGroups"\n        [class]="\'datatable-row-\' + colGroup.type"\n        [ngStyle]="_styleByGroup[colGroup.type]"\n      >\n        <datatable-header-cell\n          role="columnheader"\n          *ngFor="let column of colGroup.columns; trackBy: columnTrackingFn"\n          resizeable\n          [resizeEnabled]="column.resizeable"\n          (resize)="onColumnResized($event, column)"\n          long-press\n          [pressModel]="column"\n          [pressEnabled]="reorderable && column.draggable"\n          (longPressStart)="onLongPressStart($event)"\n          (longPressEnd)="onLongPressEnd($event)"\n          draggable\n          [dragX]="reorderable && column.draggable && column.dragging"\n          [dragY]="false"\n          [dragModel]="column"\n          [dragEventTarget]="dragEventTarget"\n          [headerHeight]="headerHeight"\n          [isTarget]="column.isTarget"\n          [targetMarkerTemplate]="targetMarkerTemplate"\n          [targetMarkerContext]="column.targetMarkerContext"\n          [column]="column"\n          [sortType]="sortType"\n          [sorts]="sorts"\n          [selectionType]="selectionType"\n          [sortAscendingIcon]="sortAscendingIcon"\n          [sortDescendingIcon]="sortDescendingIcon"\n          [sortUnsetIcon]="sortUnsetIcon"\n          [allRowsSelected]="allRowsSelected"\n          (sort)="onSort($event)"\n          (select)="select.emit($event)"\n          (columnContextmenu)="columnContextmenu.emit($event)"\n        >\n        </datatable-header-cell>\n      </div>\n    </div>\n  ',
          host: {
            class: 'datatable-header'
          },
          changeDetection: core.ChangeDetectionStrategy.OnPush
        }
      ]
    }
  ];
  DataTableHeaderComponent.ctorParameters = function () {
    return [{ type: core.ChangeDetectorRef }];
  };
  DataTableHeaderComponent.propDecorators = {
    sortAscendingIcon: [{ type: core.Input }],
    sortDescendingIcon: [{ type: core.Input }],
    sortUnsetIcon: [{ type: core.Input }],
    scrollbarH: [{ type: core.Input }],
    dealsWithGroup: [{ type: core.Input }],
    targetMarkerTemplate: [{ type: core.Input }],
    innerWidth: [{ type: core.Input }],
    sorts: [{ type: core.Input }],
    sortType: [{ type: core.Input }],
    allRowsSelected: [{ type: core.Input }],
    selectionType: [{ type: core.Input }],
    reorderable: [{ type: core.Input }],
    headerHeight: [{ type: core.HostBinding, args: ['style.height'] }, { type: core.Input }],
    columns: [{ type: core.Input }],
    offsetX: [{ type: core.Input }],
    sort: [{ type: core.Output }],
    reorder: [{ type: core.Output }],
    resize: [{ type: core.Output }],
    select: [{ type: core.Output }],
    columnContextmenu: [{ type: core.Output }],
    headerWidth: [{ type: core.HostBinding, args: ['style.width'] }]
  };

  /**
   * Throttle a function
   */
  function throttle(func, wait, options) {
    options = options || {};
    var context;
    var args;
    var result;
    var timeout = null;
    var previous = 0;
    function later() {
      previous = options.leading === false ? 0 : +new Date();
      timeout = null;
      result = func.apply(context, args);
    }
    return function () {
      var now = +new Date();
      if (!previous && options.leading === false) {
        previous = now;
      }
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  }
  /**
   * Throttle decorator
   *
   *  class MyClass {
   *    throttleable(10)
   *    myFn() { ... }
   *  }
   */
  function throttleable(duration, options) {
    return function innerDecorator(target, key, descriptor) {
      return {
        configurable: true,
        enumerable: descriptor.enumerable,
        get: function getter() {
          Object.defineProperty(this, key, {
            configurable: true,
            enumerable: descriptor.enumerable,
            value: throttle(descriptor.value, duration, options)
          });
          return this[key];
        }
      };
    };
  }

  /**
   * Calculates the Total Flex Grow
   */
  function getTotalFlexGrow(columns) {
    var e_1, _a;
    var totalFlexGrow = 0;
    try {
      for (
        var columns_1 = __values(columns), columns_1_1 = columns_1.next();
        !columns_1_1.done;
        columns_1_1 = columns_1.next()
      ) {
        var c = columns_1_1.value;
        totalFlexGrow += c.flexGrow || 0;
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (columns_1_1 && !columns_1_1.done && (_a = columns_1.return)) _a.call(columns_1);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
    return totalFlexGrow;
  }
  /**
   * Adjusts the column widths.
   * Inspired by: https://github.com/facebook/fixed-data-table/blob/master/src/FixedDataTableWidthHelper.js
   */
  function adjustColumnWidths(allColumns, expectedWidth) {
    var columnsWidth = columnsTotalWidth(allColumns);
    var totalFlexGrow = getTotalFlexGrow(allColumns);
    var colsByGroup = columnsByPin(allColumns);
    if (columnsWidth !== expectedWidth) {
      scaleColumns(colsByGroup, expectedWidth, totalFlexGrow);
    }
  }
  /**
   * Resizes columns based on the flexGrow property, while respecting manually set widths
   */
  function scaleColumns(colsByGroup, maxWidth, totalFlexGrow) {
    var e_2, _a, e_3, _b;
    // calculate total width and flexgrow points for coulumns that can be resized
    for (var attr in colsByGroup) {
      try {
        for (var _c = ((e_2 = void 0), __values(colsByGroup[attr])), _d = _c.next(); !_d.done; _d = _c.next()) {
          var column = _d.value;
          if (!column.canAutoResize) {
            maxWidth -= column.width;
            totalFlexGrow -= column.flexGrow ? column.flexGrow : 0;
          } else {
            column.width = 0;
          }
        }
      } catch (e_2_1) {
        e_2 = { error: e_2_1 };
      } finally {
        try {
          if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        } finally {
          if (e_2) throw e_2.error;
        }
      }
    }
    var hasMinWidth = {};
    var remainingWidth = maxWidth;
    // resize columns until no width is left to be distributed
    do {
      var widthPerFlexPoint = remainingWidth / totalFlexGrow;
      remainingWidth = 0;
      for (var attr in colsByGroup) {
        try {
          for (var _e = ((e_3 = void 0), __values(colsByGroup[attr])), _f = _e.next(); !_f.done; _f = _e.next()) {
            var column = _f.value;
            // if the column can be resize and it hasn't reached its minimum width yet
            if (column.canAutoResize && !hasMinWidth[column.prop]) {
              var newWidth = column.width + column.flexGrow * widthPerFlexPoint;
              if (column.minWidth !== undefined && newWidth < column.minWidth) {
                remainingWidth += newWidth - column.minWidth;
                column.width = column.minWidth;
                hasMinWidth[column.prop] = true;
              } else {
                column.width = newWidth;
              }
            }
          }
        } catch (e_3_1) {
          e_3 = { error: e_3_1 };
        } finally {
          try {
            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
          } finally {
            if (e_3) throw e_3.error;
          }
        }
      }
    } while (remainingWidth !== 0);
  }
  /**
   * Forces the width of the columns to
   * distribute equally but overflowing when necessary
   *
   * Rules:
   *
   *  - If combined withs are less than the total width of the grid,
   *    proportion the widths given the min / max / normal widths to fill the width.
   *
   *  - If the combined widths, exceed the total width of the grid,
   *    use the standard widths.
   *
   *  - If a column is resized, it should always use that width
   *
   *  - The proportional widths should never fall below min size if specified.
   *
   *  - If the grid starts off small but then becomes greater than the size ( + / - )
   *    the width should use the original width; not the newly proportioned widths.
   */
  function forceFillColumnWidths(allColumns, expectedWidth, startIdx, allowBleed, defaultColWidth, level) {
    var e_4, _a, e_5, _b;
    if (defaultColWidth === void 0) {
      defaultColWidth = 300;
    }
    if (level === void 0) {
      level = 0;
    }
    var columnsToResize = allColumns.slice(startIdx + 1, allColumns.length).filter(function (c) {
      return c.canAutoResize !== false;
    });
    try {
      for (
        var columnsToResize_1 = __values(columnsToResize), columnsToResize_1_1 = columnsToResize_1.next();
        !columnsToResize_1_1.done;
        columnsToResize_1_1 = columnsToResize_1.next()
      ) {
        var column = columnsToResize_1_1.value;
        if (!column.$$oldWidth) {
          column.$$oldWidth = column.width;
        }
      }
    } catch (e_4_1) {
      e_4 = { error: e_4_1 };
    } finally {
      try {
        if (columnsToResize_1_1 && !columnsToResize_1_1.done && (_a = columnsToResize_1.return))
          _a.call(columnsToResize_1);
      } finally {
        if (e_4) throw e_4.error;
      }
    }
    var additionWidthPerColumn = 0;
    var exceedsWindow = false;
    var contentWidth = getContentWidth(allColumns, defaultColWidth);
    var remainingWidth = expectedWidth - contentWidth;
    var columnsProcessed = [];
    var remainingWidthLimit = 1; // when to stop
    // This loop takes care of the
    do {
      additionWidthPerColumn = remainingWidth / columnsToResize.length;
      exceedsWindow = contentWidth >= expectedWidth;
      try {
        for (
          var columnsToResize_2 = ((e_5 = void 0), __values(columnsToResize)),
            columnsToResize_2_1 = columnsToResize_2.next();
          !columnsToResize_2_1.done;
          columnsToResize_2_1 = columnsToResize_2.next()
        ) {
          var column = columnsToResize_2_1.value;
          if (exceedsWindow && allowBleed) {
            column.width = column.$$oldWidth || column.width || defaultColWidth;
          } else {
            var newSize = (column.width || defaultColWidth) + additionWidthPerColumn;
            if (column.minWidth && newSize < column.minWidth) {
              column.width = column.minWidth;
              columnsProcessed.push(column);
            } else if (column.maxWidth && newSize > column.maxWidth) {
              column.width = column.maxWidth;
              columnsProcessed.push(column);
            } else {
              column.width = newSize;
            }
          }
          column.width = Math.max(0, column.width);
        }
      } catch (e_5_1) {
        e_5 = { error: e_5_1 };
      } finally {
        try {
          if (columnsToResize_2_1 && !columnsToResize_2_1.done && (_b = columnsToResize_2.return))
            _b.call(columnsToResize_2);
        } finally {
          if (e_5) throw e_5.error;
        }
      }
      contentWidth = getContentWidth(allColumns);
      remainingWidth = expectedWidth - contentWidth;
      removeProcessedColumns(columnsToResize, columnsProcessed);
    } while (remainingWidth > remainingWidthLimit && columnsToResize.length !== 0);
    if (Math.abs(remainingWidth) > 1 && level < 5) {
      forceFillColumnWidths(allColumns, expectedWidth, startIdx, allowBleed, defaultColWidth, level + 1);
    }
  }
  /**
   * Remove the processed columns from the current active columns.
   */
  function removeProcessedColumns(columnsToResize, columnsProcessed) {
    var e_6, _a;
    try {
      for (
        var columnsProcessed_1 = __values(columnsProcessed), columnsProcessed_1_1 = columnsProcessed_1.next();
        !columnsProcessed_1_1.done;
        columnsProcessed_1_1 = columnsProcessed_1.next()
      ) {
        var column = columnsProcessed_1_1.value;
        var index = columnsToResize.indexOf(column);
        columnsToResize.splice(index, 1);
      }
    } catch (e_6_1) {
      e_6 = { error: e_6_1 };
    } finally {
      try {
        if (columnsProcessed_1_1 && !columnsProcessed_1_1.done && (_a = columnsProcessed_1.return))
          _a.call(columnsProcessed_1);
      } finally {
        if (e_6) throw e_6.error;
      }
    }
  }
  /**
   * Gets the width of the columns
   */
  function getContentWidth(allColumns, defaultColWidth) {
    var e_7, _a;
    if (defaultColWidth === void 0) {
      defaultColWidth = 300;
    }
    var contentWidth = 0;
    try {
      for (
        var allColumns_1 = __values(allColumns), allColumns_1_1 = allColumns_1.next();
        !allColumns_1_1.done;
        allColumns_1_1 = allColumns_1.next()
      ) {
        var column = allColumns_1_1.value;
        contentWidth += column.width || defaultColWidth;
      }
    } catch (e_7_1) {
      e_7 = { error: e_7_1 };
    } finally {
      try {
        if (allColumns_1_1 && !allColumns_1_1.done && (_a = allColumns_1.return)) _a.call(allColumns_1);
      } finally {
        if (e_7) throw e_7.error;
      }
    }
    return contentWidth;
  }

  (function (SortDirection) {
    SortDirection['asc'] = 'asc';
    SortDirection['desc'] = 'desc';
  })(exports.SortDirection || (exports.SortDirection = {}));

  /**
   * Gets the next sort direction
   */
  function nextSortDir(sortType, current) {
    if (sortType === exports.SortType.single) {
      if (current === exports.SortDirection.asc) {
        return exports.SortDirection.desc;
      } else {
        return exports.SortDirection.asc;
      }
    } else {
      if (!current) {
        return exports.SortDirection.asc;
      } else if (current === exports.SortDirection.asc) {
        return exports.SortDirection.desc;
      } else if (current === exports.SortDirection.desc) {
        return undefined;
      }
      // avoid TS7030: Not all code paths return a value.
      return undefined;
    }
  }
  /**
   * Adapted from fueld-ui on 6/216
   * https://github.com/FuelInteractive/fuel-ui/tree/master/src/pipes/OrderBy
   */
  function orderByComparator(a, b) {
    if (a === null || typeof a === 'undefined') a = 0;
    if (b === null || typeof b === 'undefined') b = 0;
    if (a instanceof Date && b instanceof Date) {
      if (a < b) return -1;
      if (a > b) return 1;
    } else if (isNaN(parseFloat(a)) || !isFinite(a) || isNaN(parseFloat(b)) || !isFinite(b)) {
      // Convert to string in case of a=0 or b=0
      a = String(a);
      b = String(b);
      // Isn't a number so lowercase the string to properly compare
      if (a.toLowerCase() < b.toLowerCase()) return -1;
      if (a.toLowerCase() > b.toLowerCase()) return 1;
    } else {
      // Parse strings as numbers to compare properly
      if (parseFloat(a) < parseFloat(b)) return -1;
      if (parseFloat(a) > parseFloat(b)) return 1;
    }
    // equal each other
    return 0;
  }
  /**
   * creates a shallow copy of the `rows` input and returns the sorted copy. this function
   * does not sort the `rows` argument in place
   */
  function sortRows(rows, columns, dirs) {
    if (!rows) return [];
    if (!dirs || !dirs.length || !columns) return __spread(rows);
    /**
     * record the row ordering of results from prior sort operations (if applicable)
     * this is necessary to guarantee stable sorting behavior
     */
    var rowToIndexMap = new Map();
    rows.forEach(function (row, index) {
      return rowToIndexMap.set(row, index);
    });
    var temp = __spread(rows);
    var cols = columns.reduce(function (obj, col) {
      if (col.comparator && typeof col.comparator === 'function') {
        obj[col.prop] = col.comparator;
      }
      return obj;
    }, {});
    // cache valueGetter and compareFn so that they
    // do not need to be looked-up in the sort function body
    var cachedDirs = dirs.map(function (dir) {
      var prop = dir.prop;
      return {
        prop: prop,
        dir: dir.dir,
        valueGetter: getterForProp(prop),
        compareFn: cols[prop] || orderByComparator
      };
    });
    return temp.sort(function (rowA, rowB) {
      var e_1, _a;
      try {
        for (
          var cachedDirs_1 = __values(cachedDirs), cachedDirs_1_1 = cachedDirs_1.next();
          !cachedDirs_1_1.done;
          cachedDirs_1_1 = cachedDirs_1.next()
        ) {
          var cachedDir = cachedDirs_1_1.value;
          // Get property and valuegetters for column to be sorted
          var prop = cachedDir.prop,
            valueGetter = cachedDir.valueGetter;
          // Get A and B cell values from rows based on properties of the columns
          var propA = valueGetter(rowA, prop);
          var propB = valueGetter(rowB, prop);
          // Compare function gets five parameters:
          // Two cell values to be compared as propA and propB
          // Two rows corresponding to the cells as rowA and rowB
          // Direction of the sort for this column as SortDirection
          // Compare can be a standard JS comparison function (a,b) => -1|0|1
          // as additional parameters are silently ignored. The whole row and sort
          // direction enable more complex sort logic.
          var comparison =
            cachedDir.dir !== exports.SortDirection.desc
              ? cachedDir.compareFn(propA, propB, rowA, rowB, cachedDir.dir)
              : -cachedDir.compareFn(propA, propB, rowA, rowB, cachedDir.dir);
          // Don't return 0 yet in case of needing to sort by next property
          if (comparison !== 0) return comparison;
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (cachedDirs_1_1 && !cachedDirs_1_1.done && (_a = cachedDirs_1.return)) _a.call(cachedDirs_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      if (!(rowToIndexMap.has(rowA) && rowToIndexMap.has(rowB))) return 0;
      /**
       * all else being equal, preserve original order of the rows (stable sort)
       */
      return rowToIndexMap.get(rowA) < rowToIndexMap.get(rowB) ? -1 : 1;
    });
  }

  var DatatableComponent = /** @class */ (function () {
    function DatatableComponent(
      scrollbarHelper,
      dimensionsHelper,
      cd,
      element,
      differs,
      columnChangesService,
      configuration
    ) {
      var _this = this;
      this.scrollbarHelper = scrollbarHelper;
      this.dimensionsHelper = dimensionsHelper;
      this.cd = cd;
      this.columnChangesService = columnChangesService;
      this.configuration = configuration;
      /**
       * List of row objects that should be
       * represented as selected in the grid.
       * Default value: `[]`
       */
      this.selected = [];
      /**
       * Enable vertical scrollbars
       */
      this.scrollbarV = false;
      /**
       * Enable horz scrollbars
       */
      this.scrollbarH = false;
      /**
       * The row height; which is necessary
       * to calculate the height for the lazy rendering.
       */
      this.rowHeight = 30;
      /**
       * Type of column width distribution formula.
       * Example: flex, force, standard
       */
      this.columnMode = exports.ColumnMode.standard;
      /**
       * The minimum header height in pixels.
       * Pass a falsey for no header
       */
      this.headerHeight = 30;
      /**
       * The minimum footer height in pixels.
       * Pass falsey for no footer
       */
      this.footerHeight = 0;
      /**
       * If the table should use external paging
       * otherwise its assumed that all data is preloaded.
       */
      this.externalPaging = false;
      /**
       * If the table should use external sorting or
       * the built-in basic sorting.
       */
      this.externalSorting = false;
      /**
       * Show the linear loading bar.
       * Default value: `false`
       */
      this.loadingIndicator = false;
      /**
       * Enable/Disable ability to re-order columns
       * by dragging them.
       */
      this.reorderable = true;
      /**
       * Swap columns on re-order columns or
       * move them.
       */
      this.swapColumns = true;
      /**
       * The type of sorting
       */
      this.sortType = exports.SortType.single;
      /**
       * Array of sorted columns by property and type.
       * Default value: `[]`
       */
      this.sorts = [];
      /**
       * Css class overrides
       */
      this.cssClasses = {
        sortAscending: 'datatable-icon-up',
        sortDescending: 'datatable-icon-down',
        sortUnset: 'datatable-icon-sort-unset',
        pagerLeftArrow: 'datatable-icon-left',
        pagerRightArrow: 'datatable-icon-right',
        pagerPrevious: 'datatable-icon-prev',
        pagerNext: 'datatable-icon-skip'
      };
      /**
       * Message overrides for localization
       *
       * emptyMessage     [default] = 'No data to display'
       * totalMessage     [default] = 'total'
       * selectedMessage  [default] = 'selected'
       */
      this.messages = {
        // Message to show when array is presented
        // but contains no values
        emptyMessage: 'Нет данных для отображения',
        // Footer total message
        totalMessage: 'Всего',
        // Footer selected message
        selectedMessage: 'Выбрано'
      };
      /**
       * A boolean you can use to set the detault behaviour of rows and groups
       * whether they will start expanded or not. If ommited the default is NOT expanded.
       *
       */
      this.groupExpansionDefault = false;
      /**
       * Property to which you can use for determining select all
       * rows on current page or not.
       *
       * @memberOf DatatableComponent
       */
      this.selectAllRowsOnPage = false;
      /**
       * A flag for row virtualization on / off
       */
      this.virtualization = true;
      /**
       * A flag for switching summary row on / off
       */
      this.summaryRow = false;
      /**
       * A height of summary row
       */
      this.summaryHeight = 30;
      /**
       * A property holds a summary row position: top/bottom
       */
      this.summaryPosition = 'top';
      /**
       * Body was scrolled typically in a `scrollbarV:true` scenario.
       */
      this.scroll = new core.EventEmitter();
      /**
       * A cell or row was focused via keyboard or mouse click.
       */
      this.activate = new core.EventEmitter();
      /**
       * A cell or row was selected.
       */
      this.select = new core.EventEmitter();
      /**
       * Column sort was invoked.
       */
      this.sort = new core.EventEmitter();
      /**
       * The table was paged either triggered by the pager or the body scroll.
       */
      this.page = new core.EventEmitter();
      /**
       * Columns were re-ordered.
       */
      this.reorder = new core.EventEmitter();
      /**
       * Column was resized.
       */
      this.resize = new core.EventEmitter();
      /**
       * The context menu was invoked on the table.
       * type indicates whether the header or the body was clicked.
       * content contains either the column or the row that was clicked.
       */
      this.tableContextmenu = new core.EventEmitter(false);
      /**
       * A row was expanded ot collapsed for tree
       */
      this.treeAction = new core.EventEmitter();
      this.rowCount = 0;
      this._offsetX = new rxjs.BehaviorSubject(0);
      this._count = 0;
      this._offset = 0;
      this._subscriptions = [];
      /**
       * This will be used when displaying or selecting rows.
       * when tracking/comparing them, we'll use the value of this fn,
       *
       * (`fn(x) === fn(y)` instead of `x === y`)
       */
      this.rowIdentity = function (x) {
        if (_this._groupRowsBy) {
          // each group in groupedRows are stored as {key, value: [rows]},
          // where key is the groupRowsBy index
          return x.key;
        } else {
          return x;
        }
      };
      // get ref to elm for measuring
      this.element = element.nativeElement;
      this.rowDiffer = differs.find({}).create();
      // apply global settings from Module.forRoot
      if (this.configuration && this.configuration.messages) {
        this.messages = Object.assign({}, this.configuration.messages);
      }
    }
    Object.defineProperty(DatatableComponent.prototype, 'rows', {
      /**
       * Gets the rows.
       */
      get: function () {
        return this._rows;
      },
      /**
       * Rows that are displayed in the table.
       */
      set: function (val) {
        var _this = this;
        this._rows = val;
        if (val) {
          this._internalRows = __spread(val);
        }
        // auto sort on new updates
        if (!this.externalSorting) {
          this.sortInternalRows();
        }
        // auto group by parent on new update
        this._internalRows = groupRowsByParents(
          this._internalRows,
          optionalGetterForProp(this.treeFromRelation),
          optionalGetterForProp(this.treeToRelation)
        );
        // recalculate sizes/etc
        this.recalculate();
        if (this._rows && this._groupRowsBy) {
          // If a column has been specified in _groupRowsBy created a new array with the data grouped by that row
          this.groupedRows = this.groupArrayBy(this._rows, this._groupRowsBy);
          this.groupedRows.forEach(function (group) {
            group.value = groupRowsByParents(
              group.value,
              optionalGetterForProp(_this.treeFromRelation),
              optionalGetterForProp(_this.treeToRelation)
            );
          });
        }
        this.cd.markForCheck();
        this.cd.detectChanges();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'groupRowsBy', {
      get: function () {
        return this._groupRowsBy;
      },
      /**
       * This attribute allows the user to set the name of the column to group the data with
       */
      set: function (val) {
        if (val) {
          this._groupRowsBy = val;
          if (this._rows && this._groupRowsBy) {
            // cretes a new array with the data grouped
            this.groupedRows = this.groupArrayBy(this._rows, this._groupRowsBy);
          }
        }
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'columns', {
      /**
       * Get the columns.
       */
      get: function () {
        return this._columns;
      },
      /**
       * Columns to be displayed.
       */
      set: function (val) {
        if (val) {
          this._internalColumns = __spread(val);
          setColumnDefaults(this._internalColumns);
          this.recalculateColumns();
        }
        this._columns = val;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'limit', {
      /**
       * Gets the limit.
       */
      get: function () {
        return this._limit;
      },
      /**
       * The page size to be shown.
       * Default value: `undefined`
       */
      set: function (val) {
        this._limit = val;
        // recalculate sizes/etc
        this.recalculate();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'count', {
      /**
       * Gets the count.
       */
      get: function () {
        return this._count;
      },
      /**
       * The total count of all rows.
       * Default value: `0`
       */
      set: function (val) {
        this._count = val;
        // recalculate sizes/etc
        this.recalculate();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'offset', {
      get: function () {
        return Math.max(Math.min(this._offset, Math.ceil(this.rowCount / this.pageSize) - 1), 0);
      },
      /**
       * The current offset ( page - 1 ) shown.
       * Default value: `0`
       */
      set: function (val) {
        this._offset = val;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isFixedHeader', {
      /**
       * CSS class applied if the header height if fixed height.
       */
      get: function () {
        var headerHeight = this.headerHeight;
        return typeof headerHeight === 'string' ? headerHeight !== 'auto' : true;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isFixedRow', {
      /**
       * CSS class applied to the root element if
       * the row heights are fixed heights.
       */
      get: function () {
        return this.rowHeight !== 'auto';
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isVertScroll', {
      /**
       * CSS class applied to root element if
       * vertical scrolling is enabled.
       */
      get: function () {
        return this.scrollbarV;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isVirtualized', {
      /**
       * CSS class applied to root element if
       * virtualization is enabled.
       */
      get: function () {
        return this.virtualization;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isHorScroll', {
      /**
       * CSS class applied to the root element
       * if the horziontal scrolling is enabled.
       */
      get: function () {
        return this.scrollbarH;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isSelectable', {
      /**
       * CSS class applied to root element is selectable.
       */
      get: function () {
        return this.selectionType !== undefined;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isCheckboxSelection', {
      /**
       * CSS class applied to root is checkbox selection.
       */
      get: function () {
        return this.selectionType === exports.SelectionType.checkbox;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isCellSelection', {
      /**
       * CSS class applied to root if cell selection.
       */
      get: function () {
        return this.selectionType === exports.SelectionType.cell;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isSingleSelection', {
      /**
       * CSS class applied to root if single select.
       */
      get: function () {
        return this.selectionType === exports.SelectionType.single;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isMultiSelection', {
      /**
       * CSS class added to root element if mulit select
       */
      get: function () {
        return this.selectionType === exports.SelectionType.multi;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'isMultiClickSelection', {
      /**
       * CSS class added to root element if mulit click select
       */
      get: function () {
        return this.selectionType === exports.SelectionType.multiClick;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'columnTemplates', {
      /**
       * Returns the column templates.
       */
      get: function () {
        return this._columnTemplates;
      },
      /**
       * Column templates gathered from `ContentChildren`
       * if described in your markup.
       */
      set: function (val) {
        this._columnTemplates = val;
        this.translateColumns(val);
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DatatableComponent.prototype, 'allRowsSelected', {
      /**
       * Returns if all rows are selected.
       */
      get: function () {
        var allRowsSelected = this.rows && this.selected && this.selected.length === this.rows.length;
        if (this.bodyComponent && this.selectAllRowsOnPage) {
          var indexes = this.bodyComponent.indexes;
          var rowsOnPage = indexes.last - indexes.first;
          allRowsSelected = this.selected.length === rowsOnPage;
        }
        return this.selected && this.rows && this.rows.length !== 0 && allRowsSelected;
      },
      enumerable: false,
      configurable: true
    });
    /**
     * Lifecycle hook that is called after data-bound
     * properties of a directive are initialized.
     */
    DatatableComponent.prototype.ngOnInit = function () {
      // need to call this immediatly to size
      // if the table is hidden the visibility
      // listener will invoke this itself upon show
      this.recalculate();
    };
    /**
     * Lifecycle hook that is called after a component's
     * view has been fully initialized.
     */
    DatatableComponent.prototype.ngAfterViewInit = function () {
      var _this = this;
      if (!this.externalSorting) {
        this.sortInternalRows();
      }
      // this has to be done to prevent the change detection
      // tree from freaking out because we are readjusting
      if (typeof requestAnimationFrame === 'undefined') {
        return;
      }
      requestAnimationFrame(function () {
        _this.recalculate();
        // emit page for virtual server-side kickoff
        if (_this.externalPaging && _this.scrollbarV) {
          _this.page.emit({
            count: _this.count,
            pageSize: _this.pageSize,
            limit: _this.limit,
            offset: 0
          });
        }
      });
    };
    /**
     * Lifecycle hook that is called after a component's
     * content has been fully initialized.
     */
    DatatableComponent.prototype.ngAfterContentInit = function () {
      var _this = this;
      this.columnTemplates.changes.subscribe(function (v) {
        return _this.translateColumns(v);
      });
      this.listenForColumnInputChanges();
    };
    /**
     * Translates the templates to the column objects
     */
    DatatableComponent.prototype.translateColumns = function (val) {
      if (val) {
        var arr = val.toArray();
        if (arr.length) {
          this._internalColumns = translateTemplates(arr);
          setColumnDefaults(this._internalColumns);
          this.recalculateColumns();
          this.sortInternalRows();
          this.cd.markForCheck();
        }
      }
    };
    /**
     * Creates a map with the data grouped by the user choice of grouping index
     *
     * @param originalArray the original array passed via parameter
     * @param groupByIndex  the index of the column to group the data by
     */
    DatatableComponent.prototype.groupArrayBy = function (originalArray, groupBy) {
      // create a map to hold groups with their corresponding results
      var map = new Map();
      var i = 0;
      originalArray.forEach(function (item) {
        var key = item[groupBy];
        if (!map.has(key)) {
          map.set(key, [item]);
        } else {
          map.get(key).push(item);
        }
        i++;
      });
      var addGroup = function (key, value) {
        return { key: key, value: value };
      };
      // convert map back to a simple array of objects
      return Array.from(map, function (x) {
        return addGroup(x[0], x[1]);
      });
    };
    /*
     * Lifecycle hook that is called when Angular dirty checks a directive.
     */
    DatatableComponent.prototype.ngDoCheck = function () {
      if (this.rowDiffer.diff(this.rows)) {
        if (!this.externalSorting) {
          this.sortInternalRows();
        } else {
          this._internalRows = __spread(this.rows);
        }
        // auto group by parent on new update
        this._internalRows = groupRowsByParents(
          this._internalRows,
          optionalGetterForProp(this.treeFromRelation),
          optionalGetterForProp(this.treeToRelation)
        );
        this.recalculatePages();
        this.cd.markForCheck();
      }
    };
    /**
     * Recalc's the sizes of the grid.
     *
     * Updated automatically on changes to:
     *
     *  - Columns
     *  - Rows
     *  - Paging related
     *
     * Also can be manually invoked or upon window resize.
     */
    DatatableComponent.prototype.recalculate = function () {
      this.recalculateDims();
      this.recalculateColumns();
      this.cd.markForCheck();
    };
    /**
     * Window resize handler to update sizes.
     */
    DatatableComponent.prototype.onWindowResize = function () {
      this.recalculate();
    };
    /**
     * Recalulcates the column widths based on column width
     * distribution mode and scrollbar offsets.
     */
    DatatableComponent.prototype.recalculateColumns = function (columns, forceIdx, allowBleed) {
      if (columns === void 0) {
        columns = this._internalColumns;
      }
      if (forceIdx === void 0) {
        forceIdx = -1;
      }
      if (allowBleed === void 0) {
        allowBleed = this.scrollbarH;
      }
      if (!columns) return undefined;
      var width = this._innerWidth;
      if (this.scrollbarV) {
        width = width - this.scrollbarHelper.width;
      }
      if (this.columnMode === exports.ColumnMode.force) {
        forceFillColumnWidths(columns, width, forceIdx, allowBleed);
      } else if (this.columnMode === exports.ColumnMode.flex) {
        adjustColumnWidths(columns, width);
      }
      return columns;
    };
    /**
     * Recalculates the dimensions of the table size.
     * Internally calls the page size and row count calcs too.
     *
     */
    DatatableComponent.prototype.recalculateDims = function () {
      var dims = this.dimensionsHelper.getDimensions(this.element);
      this._innerWidth = Math.floor(dims.width);
      if (this.scrollbarV) {
        var height = dims.height;
        if (this.headerHeight) height = height - this.headerHeight;
        if (this.footerHeight) height = height - this.footerHeight;
        this.bodyHeight = height;
      }
      this.recalculatePages();
    };
    /**
     * Recalculates the pages after a update.
     */
    DatatableComponent.prototype.recalculatePages = function () {
      this.pageSize = this.calcPageSize();
      this.rowCount = this.calcRowCount();
    };
    /**
     * Body triggered a page event.
     */
    DatatableComponent.prototype.onBodyPage = function (_a) {
      var offset = _a.offset;
      // Avoid pagination caming from body events like scroll when the table
      // has no virtualization and the external paging is enable.
      // This means, let's the developer handle pagination by my him(her) self
      if (this.externalPaging && !this.virtualization) {
        return;
      }
      this.offset = offset;
      this.page.emit({
        count: this.count,
        pageSize: this.pageSize,
        limit: this.limit,
        offset: this.offset
      });
    };
    /**
     * The body triggered a scroll event.
     */
    DatatableComponent.prototype.onBodyScroll = function (event) {
      this._offsetX.next(event.offsetX);
      this.scroll.emit(event);
      this.cd.detectChanges();
    };
    /**
     * The footer triggered a page event.
     */
    DatatableComponent.prototype.onFooterPage = function (event) {
      this.offset = event.page - 1;
      this.bodyComponent.updateOffsetY(this.offset);
      this.page.emit({
        count: this.count,
        pageSize: this.pageSize,
        limit: this.limit,
        offset: this.offset
      });
      if (this.selectAllRowsOnPage) {
        this.selected = [];
        this.select.emit({
          selected: this.selected
        });
      }
    };
    /**
     * Recalculates the sizes of the page
     */
    DatatableComponent.prototype.calcPageSize = function (val) {
      if (val === void 0) {
        val = this.rows;
      }
      // Keep the page size constant even if the row has been expanded.
      // This is because an expanded row is still considered to be a child of
      // the original row.  Hence calculation would use rowHeight only.
      if (this.scrollbarV && this.virtualization) {
        var size = Math.ceil(this.bodyHeight / this.rowHeight);
        return Math.max(size, 0);
      }
      // if limit is passed, we are paging
      if (this.limit !== undefined) {
        return this.limit;
      }
      // otherwise use row length
      if (val) {
        return val.length;
      }
      // other empty :(
      return 0;
    };
    /**
     * Calculates the row count.
     */
    DatatableComponent.prototype.calcRowCount = function (val) {
      if (val === void 0) {
        val = this.rows;
      }
      if (!this.externalPaging) {
        if (!val) return 0;
        if (this.groupedRows) {
          return this.groupedRows.length;
        } else if (this.treeFromRelation != null && this.treeToRelation != null) {
          return this._internalRows.length;
        } else {
          return val.length;
        }
      }
      return this.count;
    };
    /**
     * The header triggered a contextmenu event.
     */
    DatatableComponent.prototype.onColumnContextmenu = function (_a) {
      var event = _a.event,
        column = _a.column;
      this.tableContextmenu.emit({ event: event, type: exports.ContextmenuType.header, content: column });
    };
    /**
     * The body triggered a contextmenu event.
     */
    DatatableComponent.prototype.onRowContextmenu = function (_a) {
      var event = _a.event,
        row = _a.row;
      this.tableContextmenu.emit({ event: event, type: exports.ContextmenuType.body, content: row });
    };
    /**
     * The header triggered a column resize event.
     */
    DatatableComponent.prototype.onColumnResize = function (_a) {
      var column = _a.column,
        newValue = _a.newValue;
      /* Safari/iOS 10.2 workaround */
      if (column === undefined) {
        return;
      }
      var idx;
      var cols = this._internalColumns.map(function (c, i) {
        c = Object.assign({}, c);
        if (c.$$id === column.$$id) {
          idx = i;
          c.width = newValue;
          // set this so we can force the column
          // width distribution to be to this value
          c.$$oldWidth = newValue;
        }
        return c;
      });
      this.recalculateColumns(cols, idx);
      this._internalColumns = cols;
      this.resize.emit({
        column: column,
        newValue: newValue
      });
    };
    /**
     * The header triggered a column re-order event.
     */
    DatatableComponent.prototype.onColumnReorder = function (_a) {
      var column = _a.column,
        newValue = _a.newValue,
        prevValue = _a.prevValue;
      var cols = this._internalColumns.map(function (c) {
        return Object.assign({}, c);
      });
      if (this.swapColumns) {
        var prevCol = cols[newValue];
        cols[newValue] = column;
        cols[prevValue] = prevCol;
      } else {
        if (newValue > prevValue) {
          var movedCol = cols[prevValue];
          for (var i = prevValue; i < newValue; i++) {
            cols[i] = cols[i + 1];
          }
          cols[newValue] = movedCol;
        } else {
          var movedCol = cols[prevValue];
          for (var i = prevValue; i > newValue; i--) {
            cols[i] = cols[i - 1];
          }
          cols[newValue] = movedCol;
        }
      }
      this._internalColumns = cols;
      this.reorder.emit({
        column: column,
        newValue: newValue,
        prevValue: prevValue
      });
    };
    /**
     * The header triggered a column sort event.
     */
    DatatableComponent.prototype.onColumnSort = function (event) {
      // clean selected rows
      if (this.selectAllRowsOnPage) {
        this.selected = [];
        this.select.emit({
          selected: this.selected
        });
      }
      this.sorts = event.sorts;
      // this could be optimized better since it will resort
      // the rows again on the 'push' detection...
      if (this.externalSorting === false) {
        // don't use normal setter so we don't resort
        this.sortInternalRows();
      }
      // auto group by parent on new update
      this._internalRows = groupRowsByParents(
        this._internalRows,
        optionalGetterForProp(this.treeFromRelation),
        optionalGetterForProp(this.treeToRelation)
      );
      // Always go to first page when sorting to see the newly sorted data
      this.offset = 0;
      this.bodyComponent.updateOffsetY(this.offset);
      this.sort.emit(event);
    };
    /**
     * Toggle all row selection
     */
    DatatableComponent.prototype.onHeaderSelect = function (event) {
      var _a, _b;
      if (this.bodyComponent && this.selectAllRowsOnPage) {
        // before we splice, chk if we currently have all selected
        var first = this.bodyComponent.indexes.first;
        var last = this.bodyComponent.indexes.last;
        var selectableRows =
          this.selectCheck && typeof this.selectCheck === 'function'
            ? this._internalRows.slice(first, last).filter(this.selectCheck.bind(this))
            : this._internalRows.slice(first, last);
        var allSelected = this.selected.length === selectableRows.length;
        // remove all existing either way
        this.selected = [];
        // do the opposite here
        if (!allSelected) {
          (_a = this.selected).push.apply(_a, __spread(selectableRows));
        }
      } else {
        var selectableRows =
          this.selectCheck && typeof this.selectCheck === 'function'
            ? this.rows.filter(this.selectCheck.bind(this))
            : this.rows;
        // before we splice, chk if we currently have all selected
        var allSelected = this.selected.length === selectableRows.length;
        // remove all existing either way
        this.selected = [];
        // do the opposite here
        if (!allSelected) {
          (_b = this.selected).push.apply(_b, __spread(selectableRows));
        }
      }
      this.select.emit({
        selected: this.selected
      });
    };
    /**
     * A row was selected from body
     */
    DatatableComponent.prototype.onBodySelect = function (event) {
      this.select.emit(event);
    };
    /**
     * A row was expanded or collapsed for tree
     */
    DatatableComponent.prototype.onTreeAction = function (event) {
      var _this = this;
      var row = event.row;
      // TODO: For duplicated items this will not work
      var rowIndex = this._rows.findIndex(function (r) {
        return r[_this.treeToRelation] === event.row[_this.treeToRelation];
      });
      this.treeAction.emit({ row: row, rowIndex: rowIndex });
    };
    DatatableComponent.prototype.ngOnDestroy = function () {
      this._subscriptions.forEach(function (subscription) {
        return subscription.unsubscribe();
      });
    };
    /**
     * listen for changes to input bindings of all DataTableColumnDirective and
     * trigger the columnTemplates.changes observable to emit
     */
    DatatableComponent.prototype.listenForColumnInputChanges = function () {
      var _this = this;
      this._subscriptions.push(
        this.columnChangesService.columnInputChanges$.subscribe(function () {
          if (_this.columnTemplates) {
            _this.columnTemplates.notifyOnChanges();
          }
        })
      );
    };
    DatatableComponent.prototype.sortInternalRows = function () {
      this._internalRows = sortRows(this._internalRows, this._internalColumns, this.sorts);
    };
    return DatatableComponent;
  })();
  DatatableComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'ngx-datatable',
          template:
            '<div role="table" visibilityObserver (visible)="recalculate()">\r\n  <datatable-footer\r\n    *ngIf="footerHeight"\r\n    [rowCount]="rowCount"\r\n    [pageSize]="pageSize"\r\n    [offset]="offset"\r\n    [footerHeight]="footerHeight"\r\n    [footerTemplate]="footer"\r\n    [totalMessage]="messages.totalMessage"\r\n    [pagerLeftArrowIcon]="cssClasses.pagerLeftArrow"\r\n    [pagerRightArrowIcon]="cssClasses.pagerRightArrow"\r\n    [pagerPreviousIcon]="cssClasses.pagerPrevious"\r\n    [selectedCount]="selected.length"\r\n    [selectedMessage]="!!selectionType && messages.selectedMessage"\r\n    [pagerNextIcon]="cssClasses.pagerNext"\r\n    (page)="onFooterPage($event)"\r\n  >\r\n  </datatable-footer>\r\n  <datatable-header\r\n    role="rowgroup"\r\n    *ngIf="headerHeight"\r\n    [sorts]="sorts"\r\n    [sortType]="sortType"\r\n    [scrollbarH]="scrollbarH"\r\n    [innerWidth]="_innerWidth"\r\n    [offsetX]="_offsetX | async"\r\n    [dealsWithGroup]="groupedRows !== undefined"\r\n    [columns]="_internalColumns"\r\n    [headerHeight]="headerHeight"\r\n    [reorderable]="reorderable"\r\n    [targetMarkerTemplate]="targetMarkerTemplate"\r\n    [sortAscendingIcon]="cssClasses.sortAscending"\r\n    [sortDescendingIcon]="cssClasses.sortDescending"\r\n    [sortUnsetIcon]="cssClasses.sortUnset"\r\n    [allRowsSelected]="allRowsSelected"\r\n    [selectionType]="selectionType"\r\n    (sort)="onColumnSort($event)"\r\n    (resize)="onColumnResize($event)"\r\n    (reorder)="onColumnReorder($event)"\r\n    (select)="onHeaderSelect($event)"\r\n    (columnContextmenu)="onColumnContextmenu($event)"\r\n  >\r\n  </datatable-header>\r\n  <datatable-body\r\n    role="rowgroup"\r\n    [groupRowsBy]="groupRowsBy"\r\n    [groupedRows]="groupedRows"\r\n    [rows]="_internalRows"\r\n    [groupExpansionDefault]="groupExpansionDefault"\r\n    [scrollbarV]="scrollbarV"\r\n    [scrollbarH]="scrollbarH"\r\n    [virtualization]="virtualization"\r\n    [loadingIndicator]="loadingIndicator"\r\n    [externalPaging]="externalPaging"\r\n    [rowHeight]="rowHeight"\r\n    [rowCount]="rowCount"\r\n    [offset]="offset"\r\n    [trackByProp]="trackByProp"\r\n    [columns]="_internalColumns"\r\n    [pageSize]="pageSize"\r\n    [offsetX]="_offsetX | async"\r\n    [rowDetail]="rowDetail"\r\n    [groupHeader]="groupHeader"\r\n    [selected]="selected"\r\n    [innerWidth]="_innerWidth"\r\n    [bodyHeight]="bodyHeight"\r\n    [selectionType]="selectionType"\r\n    [emptyMessage]="messages.emptyMessage"\r\n    [rowIdentity]="rowIdentity"\r\n    [rowClass]="rowClass"\r\n    [selectCheck]="selectCheck"\r\n    [displayCheck]="displayCheck"\r\n    [summaryRow]="summaryRow"\r\n    [summaryHeight]="summaryHeight"\r\n    [summaryPosition]="summaryPosition"\r\n    (page)="onBodyPage($event)"\r\n    (activate)="activate.emit($event)"\r\n    (rowContextmenu)="onRowContextmenu($event)"\r\n    (select)="onBodySelect($event)"\r\n    (scroll)="onBodyScroll($event)"\r\n    (treeAction)="onTreeAction($event)"\r\n  >\r\n  </datatable-body>\r\n  <datatable-footer\r\n    *ngIf="footerHeight"\r\n    [rowCount]="rowCount"\r\n    [pageSize]="pageSize"\r\n    [offset]="offset"\r\n    [footerHeight]="footerHeight"\r\n    [footerTemplate]="footer"\r\n    [totalMessage]="messages.totalMessage"\r\n    [pagerLeftArrowIcon]="cssClasses.pagerLeftArrow"\r\n    [pagerRightArrowIcon]="cssClasses.pagerRightArrow"\r\n    [pagerPreviousIcon]="cssClasses.pagerPrevious"\r\n    [selectedCount]="selected.length"\r\n    [selectedMessage]="!!selectionType && messages.selectedMessage"\r\n    [pagerNextIcon]="cssClasses.pagerNext"\r\n    (page)="onFooterPage($event)"\r\n  >\r\n  </datatable-footer>\r\n</div>\r\n',
          changeDetection: core.ChangeDetectionStrategy.OnPush,
          encapsulation: core.ViewEncapsulation.None,
          host: {
            class: 'ngx-datatable'
          },
          styles: [
            '.ngx-datatable{display:block;justify-content:center;overflow:hidden;position:relative;transform:translateZ(0)}.ngx-datatable [hidden]{display:none!important}.ngx-datatable *,.ngx-datatable :after,.ngx-datatable :before{box-sizing:border-box}.ngx-datatable.scroll-vertical .datatable-body{overflow-y:auto}.ngx-datatable.scroll-vertical.virtualized .datatable-body .datatable-row-wrapper{position:absolute}.ngx-datatable.scroll-horz .datatable-body{-webkit-overflow-scrolling:touch;overflow-x:visible}.ngx-datatable.fixed-header .datatable-header .datatable-header-inner{white-space:nowrap}.ngx-datatable.fixed-header .datatable-header .datatable-header-inner .datatable-header-cell{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ngx-datatable.fixed-row .datatable-scroll,.ngx-datatable.fixed-row .datatable-scroll .datatable-body-row{white-space:nowrap}.ngx-datatable.fixed-row .datatable-scroll .datatable-body-row .datatable-body-cell,.ngx-datatable.fixed-row .datatable-scroll .datatable-body-row .datatable-body-group-cell{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ngx-datatable .datatable-body-row,.ngx-datatable .datatable-header-inner,.ngx-datatable .datatable-row-center{-o-flex-flow:row;display:flex;flex-direction:row;flex-flow:row}.ngx-datatable .datatable-body-cell,.ngx-datatable .datatable-header-cell{display:inline-block;line-height:1.625;overflow-x:visible;vertical-align:top}.ngx-datatable .datatable-body-cell:focus,.ngx-datatable .datatable-header-cell:focus{outline:none}.ngx-datatable .datatable-row-left,.ngx-datatable .datatable-row-right{z-index:9}.ngx-datatable .datatable-row-center,.ngx-datatable .datatable-row-group,.ngx-datatable .datatable-row-left,.ngx-datatable .datatable-row-right{position:relative}.ngx-datatable .datatable-header{display:block;overflow:hidden}.ngx-datatable .datatable-header .datatable-header-inner{-webkit-align-items:stretch;align-items:stretch}.ngx-datatable .datatable-header .datatable-header-cell{display:inline-block;position:relative}.ngx-datatable .datatable-header .datatable-header-cell.sortable .datatable-header-cell-wrapper{cursor:pointer}.ngx-datatable .datatable-header .datatable-header-cell.longpress .datatable-header-cell-wrapper{cursor:move}.ngx-datatable .datatable-header .datatable-header-cell .sort-btn{cursor:pointer;display:inline-block;line-height:100%;vertical-align:middle}.ngx-datatable .datatable-header .datatable-header-cell .resize-handle,.ngx-datatable .datatable-header .datatable-header-cell .resize-handle--not-resizable{bottom:0;display:inline-block;padding:0 4px;position:absolute;right:0;top:0;visibility:hidden;width:5px}.ngx-datatable .datatable-header .datatable-header-cell .resize-handle{cursor:ew-resize}.ngx-datatable .datatable-header .datatable-header-cell.resizeable:hover .resize-handle{visibility:visible}.ngx-datatable .datatable-header .datatable-header-cell:hover .resize-handle--not-resizable{visibility:visible}.ngx-datatable .datatable-header .datatable-header-cell .targetMarker{bottom:0;position:absolute;top:0}.ngx-datatable .datatable-header .datatable-header-cell .targetMarker.dragFromLeft{right:0}.ngx-datatable .datatable-header .datatable-header-cell .targetMarker.dragFromRight{left:0}.ngx-datatable .datatable-header .datatable-header-cell .datatable-header-cell-template-wrap{height:inherit}.ngx-datatable .datatable-body{display:block;position:relative;z-index:10}.ngx-datatable .datatable-body .datatable-scroll{display:inline-block}.ngx-datatable .datatable-body .datatable-row-detail{overflow-y:hidden}.ngx-datatable .datatable-body .datatable-row-wrapper{display:flex;flex-direction:column}.ngx-datatable .datatable-body .datatable-body-row{outline:none}.ngx-datatable .datatable-body .datatable-body-row>div{display:flex}.ngx-datatable .datatable-footer{display:block;overflow:auto;width:100%}.ngx-datatable .datatable-footer .datatable-footer-inner{align-items:center;display:flex;width:100%}.ngx-datatable .datatable-footer .selected-count .page-count{flex:1 1 40%}.ngx-datatable .datatable-footer .selected-count .datatable-pager{flex:1 1 60%}.ngx-datatable .datatable-footer .page-count{flex:1 1 20%}.ngx-datatable .datatable-footer .datatable-pager{flex:1 1 80%;text-align:right}.ngx-datatable .datatable-footer .datatable-pager .pager,.ngx-datatable .datatable-footer .datatable-pager .pager li{display:inline-block;list-style:none;margin:0;padding:0}.ngx-datatable .datatable-footer .datatable-pager .pager li,.ngx-datatable .datatable-footer .datatable-pager .pager li a{outline:none}.ngx-datatable .datatable-footer .datatable-pager .pager li a{cursor:pointer;display:inline-block}.ngx-datatable .datatable-footer .datatable-pager .pager li.disabled a{cursor:not-allowed}'
          ]
        }
      ]
    }
  ];
  DatatableComponent.ctorParameters = function () {
    return [
      { type: ScrollbarHelper, decorators: [{ type: core.SkipSelf }] },
      { type: DimensionsHelper, decorators: [{ type: core.SkipSelf }] },
      { type: core.ChangeDetectorRef },
      { type: core.ElementRef },
      { type: core.KeyValueDiffers },
      { type: ColumnChangesService },
      { type: undefined, decorators: [{ type: core.Optional }, { type: core.Inject, args: ['configuration'] }] }
    ];
  };
  DatatableComponent.propDecorators = {
    targetMarkerTemplate: [{ type: core.Input }],
    rows: [{ type: core.Input }],
    groupRowsBy: [{ type: core.Input }],
    groupedRows: [{ type: core.Input }],
    columns: [{ type: core.Input }],
    selected: [{ type: core.Input }],
    scrollbarV: [{ type: core.Input }],
    scrollbarH: [{ type: core.Input }],
    rowHeight: [{ type: core.Input }],
    columnMode: [{ type: core.Input }],
    headerHeight: [{ type: core.Input }],
    footerHeight: [{ type: core.Input }],
    externalPaging: [{ type: core.Input }],
    externalSorting: [{ type: core.Input }],
    limit: [{ type: core.Input }],
    count: [{ type: core.Input }],
    offset: [{ type: core.Input }],
    loadingIndicator: [{ type: core.Input }],
    selectionType: [{ type: core.Input }],
    reorderable: [{ type: core.Input }],
    swapColumns: [{ type: core.Input }],
    sortType: [{ type: core.Input }],
    sorts: [{ type: core.Input }],
    cssClasses: [{ type: core.Input }],
    messages: [{ type: core.Input }],
    rowClass: [{ type: core.Input }],
    selectCheck: [{ type: core.Input }],
    displayCheck: [{ type: core.Input }],
    groupExpansionDefault: [{ type: core.Input }],
    trackByProp: [{ type: core.Input }],
    selectAllRowsOnPage: [{ type: core.Input }],
    virtualization: [{ type: core.Input }],
    treeFromRelation: [{ type: core.Input }],
    treeToRelation: [{ type: core.Input }],
    summaryRow: [{ type: core.Input }],
    summaryHeight: [{ type: core.Input }],
    summaryPosition: [{ type: core.Input }],
    scroll: [{ type: core.Output }],
    activate: [{ type: core.Output }],
    select: [{ type: core.Output }],
    sort: [{ type: core.Output }],
    page: [{ type: core.Output }],
    reorder: [{ type: core.Output }],
    resize: [{ type: core.Output }],
    tableContextmenu: [{ type: core.Output }],
    treeAction: [{ type: core.Output }],
    isFixedHeader: [{ type: core.HostBinding, args: ['class.fixed-header'] }],
    isFixedRow: [{ type: core.HostBinding, args: ['class.fixed-row'] }],
    isVertScroll: [{ type: core.HostBinding, args: ['class.scroll-vertical'] }],
    isVirtualized: [{ type: core.HostBinding, args: ['class.virtualized'] }],
    isHorScroll: [{ type: core.HostBinding, args: ['class.scroll-horz'] }],
    isSelectable: [{ type: core.HostBinding, args: ['class.selectable'] }],
    isCheckboxSelection: [{ type: core.HostBinding, args: ['class.checkbox-selection'] }],
    isCellSelection: [{ type: core.HostBinding, args: ['class.cell-selection'] }],
    isSingleSelection: [{ type: core.HostBinding, args: ['class.single-selection'] }],
    isMultiSelection: [{ type: core.HostBinding, args: ['class.multi-selection'] }],
    isMultiClickSelection: [{ type: core.HostBinding, args: ['class.multi-click-selection'] }],
    columnTemplates: [{ type: core.ContentChildren, args: [DataTableColumnDirective] }],
    rowDetail: [{ type: core.ContentChild, args: [DatatableRowDetailDirective] }],
    groupHeader: [{ type: core.ContentChild, args: [DatatableGroupHeaderDirective] }],
    footer: [{ type: core.ContentChild, args: [DatatableFooterDirective] }],
    bodyComponent: [{ type: core.ViewChild, args: [DataTableBodyComponent] }],
    headerComponent: [{ type: core.ViewChild, args: [DataTableHeaderComponent] }],
    rowIdentity: [{ type: core.Input }],
    onWindowResize: [{ type: core.HostListener, args: ['window:resize'] }]
  };
  __decorate([throttleable(5)], DatatableComponent.prototype, 'onWindowResize', null);

  var DataTableHeaderCellComponent = /** @class */ (function () {
    function DataTableHeaderCellComponent(cd) {
      this.cd = cd;
      this.sort = new core.EventEmitter();
      this.select = new core.EventEmitter();
      this.columnContextmenu = new core.EventEmitter(false);
      this.sortFn = this.onSort.bind(this);
      this.selectFn = this.select.emit.bind(this.select);
      this.cellContext = {
        column: this.column,
        sortDir: this.sortDir,
        sortFn: this.sortFn,
        allRowsSelected: this.allRowsSelected,
        selectFn: this.selectFn
      };
    }
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'allRowsSelected', {
      get: function () {
        return this._allRowsSelected;
      },
      set: function (value) {
        this._allRowsSelected = value;
        this.cellContext.allRowsSelected = value;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'column', {
      get: function () {
        return this._column;
      },
      set: function (column) {
        this._column = column;
        this.cellContext.column = column;
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'sorts', {
      get: function () {
        return this._sorts;
      },
      set: function (val) {
        this._sorts = val;
        this.sortDir = this.calcSortDir(val);
        this.cellContext.sortDir = this.sortDir;
        this.sortClass = this.calcSortClass(this.sortDir);
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'columnCssClasses', {
      get: function () {
        var e_1, _a;
        var cls = 'datatable-header-cell';
        if (this.column.sortable) cls += ' sortable';
        if (this.column.resizeable) cls += ' resizeable';
        if (this.column.headerClass) {
          if (typeof this.column.headerClass === 'string') {
            cls += ' ' + this.column.headerClass;
          } else if (typeof this.column.headerClass === 'function') {
            var res = this.column.headerClass({
              column: this.column
            });
            if (typeof res === 'string') {
              cls += res;
            } else if (typeof res === 'object') {
              var keys = Object.keys(res);
              try {
                for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                  var k = keys_1_1.value;
                  if (res[k] === true) cls += ' ' + k;
                }
              } catch (e_1_1) {
                e_1 = { error: e_1_1 };
              } finally {
                try {
                  if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
                } finally {
                  if (e_1) throw e_1.error;
                }
              }
            }
          }
        }
        var sortDir = this.sortDir;
        if (sortDir) {
          cls += ' sort-active sort-' + sortDir;
        }
        return cls;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'name', {
      get: function () {
        // guaranteed to have a value by setColumnDefaults() in column-helper.ts
        return this.column.headerTemplate === undefined ? this.column.name : undefined;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'minWidth', {
      get: function () {
        return this.column.minWidth;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'maxWidth', {
      get: function () {
        return this.column.maxWidth;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'width', {
      get: function () {
        return this.column.width;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableHeaderCellComponent.prototype, 'isCheckboxable', {
      get: function () {
        return this.column.checkboxable && this.column.headerCheckboxable;
      },
      enumerable: false,
      configurable: true
    });
    DataTableHeaderCellComponent.prototype.onContextmenu = function ($event) {
      this.columnContextmenu.emit({ event: $event, column: this.column });
    };
    DataTableHeaderCellComponent.prototype.ngOnInit = function () {
      this.sortClass = this.calcSortClass(this.sortDir);
    };
    DataTableHeaderCellComponent.prototype.calcSortDir = function (sorts) {
      var _this = this;
      if (sorts && this.column) {
        var sort = sorts.find(function (s) {
          return s.prop === _this.column.prop;
        });
        if (sort) return sort.dir;
      }
    };
    DataTableHeaderCellComponent.prototype.onSort = function () {
      if (!this.column.sortable) return;
      var newValue = nextSortDir(this.sortType, this.sortDir);
      this.sort.emit({
        column: this.column,
        prevValue: this.sortDir,
        newValue: newValue
      });
    };
    DataTableHeaderCellComponent.prototype.calcSortClass = function (sortDir) {
      if (!this.cellContext.column.sortable) return;
      if (sortDir === exports.SortDirection.asc) {
        return 'sort-btn sort-asc ' + this.sortAscendingIcon;
      } else if (sortDir === exports.SortDirection.desc) {
        return 'sort-btn sort-desc ' + this.sortDescendingIcon;
      } else {
        return 'sort-btn ' + this.sortUnsetIcon;
      }
    };
    return DataTableHeaderCellComponent;
  })();
  DataTableHeaderCellComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-header-cell',
          template:
            '\n    <div class="datatable-header-cell-template-wrap">\n      <ng-template\n        *ngIf="isTarget"\n        [ngTemplateOutlet]="targetMarkerTemplate"\n        [ngTemplateOutletContext]="targetMarkerContext"\n      >\n      </ng-template>\n      <label *ngIf="isCheckboxable" class="datatable-checkbox">\n        <input type="checkbox" [checked]="allRowsSelected" (change)="select.emit(!allRowsSelected)" />\n      </label>\n      <span *ngIf="!column.headerTemplate" class="datatable-header-cell-wrapper">\n        <span class="datatable-header-cell-label draggable" (click)="onSort()" [innerHTML]="name"> </span>\n      </span>\n      <ng-template\n        *ngIf="column.headerTemplate"\n        [ngTemplateOutlet]="column.headerTemplate"\n        [ngTemplateOutletContext]="cellContext"\n      >\n      </ng-template>\n      <span (click)="onSort()" [class]="sortClass"> </span>\n    </div>\n  ',
          host: {
            class: 'datatable-header-cell'
          },
          changeDetection: core.ChangeDetectionStrategy.OnPush
        }
      ]
    }
  ];
  DataTableHeaderCellComponent.ctorParameters = function () {
    return [{ type: core.ChangeDetectorRef }];
  };
  DataTableHeaderCellComponent.propDecorators = {
    sortType: [{ type: core.Input }],
    sortAscendingIcon: [{ type: core.Input }],
    sortDescendingIcon: [{ type: core.Input }],
    sortUnsetIcon: [{ type: core.Input }],
    isTarget: [{ type: core.Input }],
    targetMarkerTemplate: [{ type: core.Input }],
    targetMarkerContext: [{ type: core.Input }],
    allRowsSelected: [{ type: core.Input }],
    selectionType: [{ type: core.Input }],
    column: [{ type: core.Input }],
    headerHeight: [{ type: core.HostBinding, args: ['style.height.px'] }, { type: core.Input }],
    sorts: [{ type: core.Input }],
    sort: [{ type: core.Output }],
    select: [{ type: core.Output }],
    columnContextmenu: [{ type: core.Output }],
    columnCssClasses: [{ type: core.HostBinding, args: ['class'] }],
    name: [{ type: core.HostBinding, args: ['attr.title'] }],
    minWidth: [{ type: core.HostBinding, args: ['style.minWidth.px'] }],
    maxWidth: [{ type: core.HostBinding, args: ['style.maxWidth.px'] }],
    width: [{ type: core.HostBinding, args: ['style.width.px'] }],
    onContextmenu: [{ type: core.HostListener, args: ['contextmenu', ['$event']] }]
  };

  var DataTableFooterComponent = /** @class */ (function () {
    function DataTableFooterComponent() {
      this.selectedCount = 0;
      this.page = new core.EventEmitter();
    }
    Object.defineProperty(DataTableFooterComponent.prototype, 'isVisible', {
      get: function () {
        return this.rowCount / this.pageSize > 1;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableFooterComponent.prototype, 'curPage', {
      get: function () {
        return this.offset + 1;
      },
      enumerable: false,
      configurable: true
    });
    return DataTableFooterComponent;
  })();
  DataTableFooterComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-footer',
          template:
            '\n    <div\n      class="datatable-footer-inner"\n      [ngClass]="{ \'selected-count\': selectedMessage }"\n      [style.height.px]="footerHeight"\n    >\n      <ng-template\n        *ngIf="footerTemplate"\n        [ngTemplateOutlet]="footerTemplate.template"\n        [ngTemplateOutletContext]="{\n          rowCount: rowCount,\n          pageSize: pageSize,\n          selectedCount: selectedCount,\n          curPage: curPage,\n          offset: offset\n        }"\n      >\n      </ng-template>\n      <div class="page-count" *ngIf="!footerTemplate">\n        <span *ngIf="selectedMessage"> {{ selectedCount?.toLocaleString() }} {{ selectedMessage }} / </span>\n        {{ rowCount?.toLocaleString() }} {{ totalMessage }}\n      </div>\n      <datatable-pager\n        *ngIf="!footerTemplate"\n        [pagerLeftArrowIcon]="pagerLeftArrowIcon"\n        [pagerRightArrowIcon]="pagerRightArrowIcon"\n        [pagerPreviousIcon]="pagerPreviousIcon"\n        [pagerNextIcon]="pagerNextIcon"\n        [page]="curPage"\n        [size]="pageSize"\n        [count]="rowCount"\n        [hidden]="!isVisible"\n        (change)="page.emit($event)"\n      >\n      </datatable-pager>\n    </div>\n  ',
          host: {
            class: 'datatable-footer'
          },
          changeDetection: core.ChangeDetectionStrategy.OnPush
        }
      ]
    }
  ];
  DataTableFooterComponent.propDecorators = {
    footerHeight: [{ type: core.Input }],
    rowCount: [{ type: core.Input }],
    pageSize: [{ type: core.Input }],
    offset: [{ type: core.Input }],
    pagerLeftArrowIcon: [{ type: core.Input }],
    pagerRightArrowIcon: [{ type: core.Input }],
    pagerPreviousIcon: [{ type: core.Input }],
    pagerNextIcon: [{ type: core.Input }],
    totalMessage: [{ type: core.Input }],
    footerTemplate: [{ type: core.Input }],
    selectedCount: [{ type: core.Input }],
    selectedMessage: [{ type: core.Input }],
    page: [{ type: core.Output }]
  };

  var DataTablePagerComponent = /** @class */ (function () {
    function DataTablePagerComponent() {
      this.showLastPage = true;
      this.change = new core.EventEmitter();
      this._count = 0;
      this._page = 1;
      this._size = 0;
    }
    Object.defineProperty(DataTablePagerComponent.prototype, 'size', {
      get: function () {
        return this._size;
      },
      set: function (val) {
        this._size = val;
        this.pages = this.calcPages();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTablePagerComponent.prototype, 'count', {
      get: function () {
        return this._count;
      },
      set: function (val) {
        this._count = val;
        this.pages = this.calcPages();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTablePagerComponent.prototype, 'page', {
      get: function () {
        return this._page;
      },
      set: function (val) {
        this._page = val;
        this.pages = this.calcPages();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTablePagerComponent.prototype, 'totalPages', {
      get: function () {
        var count = this.size < 1 ? 1 : Math.ceil(this.count / this.size);
        return Math.max(count || 0, 1);
      },
      enumerable: false,
      configurable: true
    });
    DataTablePagerComponent.prototype.canPrevious = function () {
      return this.page > 1;
    };
    DataTablePagerComponent.prototype.canNext = function () {
      return this.page < this.totalPages;
    };
    DataTablePagerComponent.prototype.prevPage = function () {
      this.selectPage(this.page - 1);
    };
    DataTablePagerComponent.prototype.nextPage = function () {
      this.selectPage(this.page + 1);
    };
    DataTablePagerComponent.prototype.selectPage = function (page) {
      if (page > 0 && page <= this.totalPages && page !== this.page) {
        this.page = page;
        this.change.emit({
          page: page
        });
      }
    };
    DataTablePagerComponent.prototype.calcPages = function (page) {
      var pages = [];
      var startPage = 1;
      var endPage = this.totalPages;
      var maxSize = 5;
      var isMaxSized = maxSize < this.totalPages;
      page = page || this.page;
      if (isMaxSized) {
        startPage = page - Math.floor(maxSize / 2);
        endPage = page + Math.floor(maxSize / 2);
        if (startPage < 1) {
          startPage = 1;
          endPage = Math.min(startPage + maxSize - 1, this.totalPages);
        } else if (endPage > this.totalPages) {
          startPage = Math.max(this.totalPages - maxSize + 1, 1);
          endPage = this.totalPages;
        }
      }
      for (var num = startPage; num <= endPage; num++) {
        pages.push({
          number: num,
          text: num
        });
      }
      return pages;
    };
    return DataTablePagerComponent;
  })();
  DataTablePagerComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-pager',
          template:
            '\n    <ul class="pager">\n      <li [class.disabled]="!canPrevious()">\n        <a role="button" aria-label="go to first page" href="javascript:void(0)" (click)="selectPage(1)">\n          <i class="{{ pagerPreviousIcon }}"></i>\n        </a>\n      </li>\n      <li [class.disabled]="!canPrevious()">\n        <a role="button" aria-label="go to previous page" href="javascript:void(0)" (click)="prevPage()">\n          <i class="{{ pagerLeftArrowIcon }}"></i>\n        </a>\n      </li>\n      <li\n        role="button"\n        [attr.aria-label]="\'page \' + pg.number"\n        class="pages"\n        *ngFor="let pg of pages"\n        [class.active]="pg.number === page"\n      >\n        <a href="javascript:void(0)" (click)="selectPage(pg.number)">\n          {{ pg.text }}\n        </a>\n      </li>\n      <li [class.disabled]="!canNext()">\n        <a role="button" aria-label="go to next page" href="javascript:void(0)" (click)="nextPage()">\n          <i class="{{ pagerRightArrowIcon }}"></i>\n        </a>\n      </li>\n      <li *ngIf="showLastPage" [class.disabled]="!canNext()">\n        <a role="button" aria-label="go to last page" href="javascript:void(0)" (click)="selectPage(totalPages)">\n          <i class="{{ pagerNextIcon }}"></i>\n        </a>\n      </li>\n    </ul>\n  ',
          host: {
            class: 'datatable-pager'
          },
          changeDetection: core.ChangeDetectionStrategy.OnPush
        }
      ]
    }
  ];
  DataTablePagerComponent.propDecorators = {
    pagerLeftArrowIcon: [{ type: core.Input }],
    pagerRightArrowIcon: [{ type: core.Input }],
    pagerPreviousIcon: [{ type: core.Input }],
    pagerNextIcon: [{ type: core.Input }],
    showLastPage: [{ type: core.Input }],
    size: [{ type: core.Input }],
    count: [{ type: core.Input }],
    page: [{ type: core.Input }],
    change: [{ type: core.Output }]
  };

  var ProgressBarComponent = /** @class */ (function () {
    function ProgressBarComponent() {}
    return ProgressBarComponent;
  })();
  ProgressBarComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-progress',
          template:
            '\n    <div class="progress-linear" role="progressbar">\n      <div class="container">\n        <div class="bar"></div>\n      </div>\n    </div>\n  ',
          changeDetection: core.ChangeDetectionStrategy.OnPush
        }
      ]
    }
  ];

  (function (Keys) {
    Keys[(Keys['up'] = 38)] = 'up';
    Keys[(Keys['down'] = 40)] = 'down';
    Keys[(Keys['return'] = 13)] = 'return';
    Keys[(Keys['escape'] = 27)] = 'escape';
    Keys[(Keys['left'] = 37)] = 'left';
    Keys[(Keys['right'] = 39)] = 'right';
  })(exports.Keys || (exports.Keys = {}));

  var DataTableBodyRowComponent = /** @class */ (function () {
    function DataTableBodyRowComponent(differs, scrollbarHelper, cd, element) {
      this.differs = differs;
      this.scrollbarHelper = scrollbarHelper;
      this.cd = cd;
      this.treeStatus = 'collapsed';
      this.activate = new core.EventEmitter();
      this.treeAction = new core.EventEmitter();
      this._groupStyles = {
        left: {},
        center: {},
        right: {}
      };
      this._element = element.nativeElement;
      this._rowDiffer = differs.find({}).create();
    }
    Object.defineProperty(DataTableBodyRowComponent.prototype, 'columns', {
      get: function () {
        return this._columns;
      },
      set: function (val) {
        this._columns = val;
        this.recalculateColumns(val);
        this.buildStylesByGroup();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyRowComponent.prototype, 'innerWidth', {
      get: function () {
        return this._innerWidth;
      },
      set: function (val) {
        if (this._columns) {
          var colByPin = columnsByPin(this._columns);
          this._columnGroupWidths = columnGroupWidths(colByPin, this._columns);
        }
        this._innerWidth = val;
        this.recalculateColumns();
        this.buildStylesByGroup();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyRowComponent.prototype, 'offsetX', {
      get: function () {
        return this._offsetX;
      },
      set: function (val) {
        this._offsetX = val;
        this.buildStylesByGroup();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyRowComponent.prototype, 'cssClass', {
      get: function () {
        var e_1, _a;
        var cls = 'datatable-body-row';
        if (this.isSelected) {
          cls += ' active';
        }
        if (this.rowIndex % 2 !== 0) {
          cls += ' datatable-row-odd';
        }
        if (this.rowIndex % 2 === 0) {
          cls += ' datatable-row-even';
        }
        if (this.rowClass) {
          var res = this.rowClass(this.row);
          if (typeof res === 'string') {
            cls += ' ' + res;
          } else if (typeof res === 'object') {
            var keys = Object.keys(res);
            try {
              for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var k = keys_1_1.value;
                if (res[k] === true) {
                  cls += ' ' + k;
                }
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
              } finally {
                if (e_1) throw e_1.error;
              }
            }
          }
        }
        return cls;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyRowComponent.prototype, 'columnsTotalWidths', {
      get: function () {
        return this._columnGroupWidths.total;
      },
      enumerable: false,
      configurable: true
    });
    DataTableBodyRowComponent.prototype.ngDoCheck = function () {
      if (this._rowDiffer.diff(this.row)) {
        this.cd.markForCheck();
      }
    };
    DataTableBodyRowComponent.prototype.trackByGroups = function (index, colGroup) {
      return colGroup.type;
    };
    DataTableBodyRowComponent.prototype.columnTrackingFn = function (index, column) {
      return column.$$id;
    };
    DataTableBodyRowComponent.prototype.buildStylesByGroup = function () {
      this._groupStyles.left = this.calcStylesByGroup('left');
      this._groupStyles.center = this.calcStylesByGroup('center');
      this._groupStyles.right = this.calcStylesByGroup('right');
      this.cd.markForCheck();
    };
    DataTableBodyRowComponent.prototype.calcStylesByGroup = function (group) {
      var widths = this._columnGroupWidths;
      var offsetX = this.offsetX;
      var styles = {
        width: widths[group] + 'px'
      };
      if (group === 'left') {
        translateXY(styles, offsetX, 0);
      } else if (group === 'right') {
        var bodyWidth = parseInt(this.innerWidth + '', 0);
        var totalDiff = widths.total - bodyWidth;
        var offsetDiff = totalDiff - offsetX;
        var offset = (offsetDiff + this.scrollbarHelper.width) * -1;
        translateXY(styles, offset, 0);
      }
      return styles;
    };
    DataTableBodyRowComponent.prototype.onActivate = function (event, index) {
      event.cellIndex = index;
      event.rowElement = this._element;
      this.activate.emit(event);
    };
    DataTableBodyRowComponent.prototype.onKeyDown = function (event) {
      var keyCode = event.keyCode;
      var isTargetRow = event.target === this._element;
      var isAction =
        keyCode === exports.Keys.return ||
        keyCode === exports.Keys.down ||
        keyCode === exports.Keys.up ||
        keyCode === exports.Keys.left ||
        keyCode === exports.Keys.right;
      if (isAction && isTargetRow) {
        event.preventDefault();
        event.stopPropagation();
        this.activate.emit({
          type: 'keydown',
          event: event,
          row: this.row,
          rowElement: this._element
        });
      }
    };
    DataTableBodyRowComponent.prototype.onMouseenter = function (event) {
      this.activate.emit({
        type: 'mouseenter',
        event: event,
        row: this.row,
        rowElement: this._element
      });
    };
    DataTableBodyRowComponent.prototype.recalculateColumns = function (val) {
      if (val === void 0) {
        val = this.columns;
      }
      this._columns = val;
      var colsByPin = columnsByPin(this._columns);
      this._columnsByPin = columnsByPinArr(this._columns);
      this._columnGroupWidths = columnGroupWidths(colsByPin, this._columns);
    };
    DataTableBodyRowComponent.prototype.onTreeAction = function () {
      this.treeAction.emit();
    };
    return DataTableBodyRowComponent;
  })();
  DataTableBodyRowComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-body-row',
          changeDetection: core.ChangeDetectionStrategy.OnPush,
          template:
            '\n    <div\n      *ngFor="let colGroup of _columnsByPin; let i = index; trackBy: trackByGroups"\n      class="datatable-row-{{ colGroup.type }} datatable-row-group"\n      [ngStyle]="_groupStyles[colGroup.type]"\n    >\n      <datatable-body-cell\n        role="cell"\n        *ngFor="let column of colGroup.columns; let ii = index; trackBy: columnTrackingFn"\n        tabindex="-1"\n        [row]="row"\n        [group]="group"\n        [expanded]="expanded"\n        [isSelected]="isSelected"\n        [rowIndex]="rowIndex"\n        [column]="column"\n        [rowHeight]="rowHeight"\n        [selectCheck]="selectCheck"\n        [displayCheck]="displayCheck"\n        [treeStatus]="treeStatus"\n        (activate)="onActivate($event, ii)"\n        (treeAction)="onTreeAction()"\n      >\n      </datatable-body-cell>\n    </div>\n  '
        }
      ]
    }
  ];
  DataTableBodyRowComponent.ctorParameters = function () {
    return [
      { type: core.KeyValueDiffers },
      { type: ScrollbarHelper, decorators: [{ type: core.SkipSelf }] },
      { type: core.ChangeDetectorRef },
      { type: core.ElementRef }
    ];
  };
  DataTableBodyRowComponent.propDecorators = {
    columns: [{ type: core.Input }],
    innerWidth: [{ type: core.Input }],
    expanded: [{ type: core.Input }],
    rowClass: [{ type: core.Input }],
    row: [{ type: core.Input }],
    group: [{ type: core.Input }],
    isSelected: [{ type: core.Input }],
    rowIndex: [{ type: core.Input }],
    selectCheck: [{ type: core.Input }],
    displayCheck: [{ type: core.Input }],
    treeStatus: [{ type: core.Input }],
    offsetX: [{ type: core.Input }],
    cssClass: [{ type: core.HostBinding, args: ['class'] }],
    rowHeight: [{ type: core.HostBinding, args: ['style.height.px'] }, { type: core.Input }],
    columnsTotalWidths: [{ type: core.HostBinding, args: ['style.width.px'] }],
    activate: [{ type: core.Output }],
    treeAction: [{ type: core.Output }],
    onKeyDown: [{ type: core.HostListener, args: ['keydown', ['$event']] }],
    onMouseenter: [{ type: core.HostListener, args: ['mouseenter', ['$event']] }]
  };

  var DataTableRowWrapperComponent = /** @class */ (function () {
    function DataTableRowWrapperComponent(cd, differs) {
      this.cd = cd;
      this.differs = differs;
      this.rowContextmenu = new core.EventEmitter(false);
      this._expanded = false;
      this.groupContext = {
        group: this.row,
        expanded: this.expanded,
        rowIndex: this.rowIndex
      };
      this.rowContext = {
        row: this.row,
        expanded: this.expanded,
        rowIndex: this.rowIndex
      };
      this.rowDiffer = differs.find({}).create();
    }
    Object.defineProperty(DataTableRowWrapperComponent.prototype, 'rowIndex', {
      get: function () {
        return this._rowIndex;
      },
      set: function (val) {
        this._rowIndex = val;
        this.rowContext.rowIndex = val;
        this.groupContext.rowIndex = val;
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableRowWrapperComponent.prototype, 'expanded', {
      get: function () {
        return this._expanded;
      },
      set: function (val) {
        this._expanded = val;
        this.groupContext.expanded = val;
        this.rowContext.expanded = val;
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    DataTableRowWrapperComponent.prototype.ngDoCheck = function () {
      if (this.rowDiffer.diff(this.row)) {
        this.rowContext.row = this.row;
        this.groupContext.group = this.row;
        this.cd.markForCheck();
      }
    };
    DataTableRowWrapperComponent.prototype.onContextmenu = function ($event) {
      this.rowContextmenu.emit({ event: $event, row: this.row });
    };
    DataTableRowWrapperComponent.prototype.getGroupHeaderStyle = function () {
      var styles = {};
      styles['transform'] = 'translate3d(' + this.offsetX + 'px, 0px, 0px)';
      styles['backface-visibility'] = 'hidden';
      styles['width'] = this.innerWidth;
      return styles;
    };
    return DataTableRowWrapperComponent;
  })();
  DataTableRowWrapperComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-row-wrapper',
          changeDetection: core.ChangeDetectionStrategy.OnPush,
          template:
            '\n    <div *ngIf="groupHeader && groupHeader.template" class="datatable-group-header" [ngStyle]="getGroupHeaderStyle()">\n      <ng-template\n        *ngIf="groupHeader && groupHeader.template"\n        [ngTemplateOutlet]="groupHeader.template"\n        [ngTemplateOutletContext]="groupContext"\n      >\n      </ng-template>\n    </div>\n    <ng-content *ngIf="(groupHeader && groupHeader.template && expanded) || !groupHeader || !groupHeader.template">\n    </ng-content>\n    <div\n      *ngIf="rowDetail && rowDetail.template && expanded"\n      [style.height.px]="detailRowHeight"\n      class="datatable-row-detail"\n    >\n      <ng-template\n        *ngIf="rowDetail && rowDetail.template"\n        [ngTemplateOutlet]="rowDetail.template"\n        [ngTemplateOutletContext]="rowContext"\n      >\n      </ng-template>\n    </div>\n  ',
          host: {
            class: 'datatable-row-wrapper'
          }
        }
      ]
    }
  ];
  DataTableRowWrapperComponent.ctorParameters = function () {
    return [{ type: core.ChangeDetectorRef }, { type: core.KeyValueDiffers }];
  };
  DataTableRowWrapperComponent.propDecorators = {
    innerWidth: [{ type: core.Input }],
    rowDetail: [{ type: core.Input }],
    groupHeader: [{ type: core.Input }],
    offsetX: [{ type: core.Input }],
    detailRowHeight: [{ type: core.Input }],
    row: [{ type: core.Input }],
    groupedRows: [{ type: core.Input }],
    rowContextmenu: [{ type: core.Output }],
    rowIndex: [{ type: core.Input }],
    expanded: [{ type: core.Input }],
    onContextmenu: [{ type: core.HostListener, args: ['contextmenu', ['$event']] }]
  };

  var DataTableBodyCellComponent = /** @class */ (function () {
    function DataTableBodyCellComponent(element, cd) {
      this.cd = cd;
      this.activate = new core.EventEmitter();
      this.treeAction = new core.EventEmitter();
      this.isFocused = false;
      this.onCheckboxChangeFn = this.onCheckboxChange.bind(this);
      this.activateFn = this.activate.emit.bind(this.activate);
      this.cellContext = {
        onCheckboxChangeFn: this.onCheckboxChangeFn,
        activateFn: this.activateFn,
        row: this.row,
        group: this.group,
        value: this.value,
        column: this.column,
        rowHeight: this.rowHeight,
        isSelected: this.isSelected,
        rowIndex: this.rowIndex,
        treeStatus: this.treeStatus,
        onTreeAction: this.onTreeAction.bind(this)
      };
      this._element = element.nativeElement;
    }
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'group', {
      get: function () {
        return this._group;
      },
      set: function (group) {
        this._group = group;
        this.cellContext.group = group;
        this.checkValueUpdates();
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'rowHeight', {
      get: function () {
        return this._rowHeight;
      },
      set: function (val) {
        this._rowHeight = val;
        this.cellContext.rowHeight = val;
        this.checkValueUpdates();
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'isSelected', {
      get: function () {
        return this._isSelected;
      },
      set: function (val) {
        this._isSelected = val;
        this.cellContext.isSelected = val;
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'expanded', {
      get: function () {
        return this._expanded;
      },
      set: function (val) {
        this._expanded = val;
        this.cellContext.expanded = val;
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'rowIndex', {
      get: function () {
        return this._rowIndex;
      },
      set: function (val) {
        this._rowIndex = val;
        this.cellContext.rowIndex = val;
        this.checkValueUpdates();
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'column', {
      get: function () {
        return this._column;
      },
      set: function (column) {
        this._column = column;
        this.cellContext.column = column;
        this.checkValueUpdates();
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'row', {
      get: function () {
        return this._row;
      },
      set: function (row) {
        this._row = row;
        this.cellContext.row = row;
        this.checkValueUpdates();
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'sorts', {
      get: function () {
        return this._sorts;
      },
      set: function (val) {
        this._sorts = val;
        this.calcSortDir = this.calcSortDir(val);
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'treeStatus', {
      get: function () {
        return this._treeStatus;
      },
      set: function (status) {
        if (status !== 'collapsed' && status !== 'expanded' && status !== 'loading' && status !== 'disabled') {
          this._treeStatus = 'collapsed';
        } else {
          this._treeStatus = status;
        }
        this.cellContext.treeStatus = this._treeStatus;
        this.checkValueUpdates();
        this.cd.markForCheck();
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'columnCssClasses', {
      get: function () {
        var e_1, _a;
        var cls = 'datatable-body-cell';
        if (this.column.cellClass) {
          if (typeof this.column.cellClass === 'string') {
            cls += ' ' + this.column.cellClass;
          } else if (typeof this.column.cellClass === 'function') {
            var res = this.column.cellClass({
              row: this.row,
              group: this.group,
              column: this.column,
              value: this.value,
              rowHeight: this.rowHeight
            });
            if (typeof res === 'string') {
              cls += ' ' + res;
            } else if (typeof res === 'object') {
              var keys = Object.keys(res);
              try {
                for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                  var k = keys_1_1.value;
                  if (res[k] === true) {
                    cls += ' ' + k;
                  }
                }
              } catch (e_1_1) {
                e_1 = { error: e_1_1 };
              } finally {
                try {
                  if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
                } finally {
                  if (e_1) throw e_1.error;
                }
              }
            }
          }
        }
        if (!this.sortDir) {
          cls += ' sort-active';
        }
        if (this.isFocused) {
          cls += ' active';
        }
        if (this.sortDir === exports.SortDirection.asc) {
          cls += ' sort-asc';
        }
        if (this.sortDir === exports.SortDirection.desc) {
          cls += ' sort-desc';
        }
        return cls;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'width', {
      get: function () {
        return this.column.width;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'minWidth', {
      get: function () {
        return this.column.minWidth;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'maxWidth', {
      get: function () {
        return this.column.maxWidth;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(DataTableBodyCellComponent.prototype, 'height', {
      get: function () {
        var height = this.rowHeight;
        if (isNaN(height)) {
          return height;
        }
        return height + 'px';
      },
      enumerable: false,
      configurable: true
    });
    DataTableBodyCellComponent.prototype.ngDoCheck = function () {
      this.checkValueUpdates();
    };
    DataTableBodyCellComponent.prototype.ngOnDestroy = function () {
      if (this.cellTemplate) {
        this.cellTemplate.clear();
      }
    };
    DataTableBodyCellComponent.prototype.checkValueUpdates = function () {
      var value = '';
      if (!this.row || !this.column) {
        value = '';
      } else {
        var val = this.column.$$valueGetter(this.row, this.column.prop);
        var userPipe = this.column.pipe;
        if (userPipe) {
          value = userPipe.transform(val);
        } else if (value !== undefined) {
          value = val;
        }
      }
      if (this.value !== value) {
        this.value = value;
        this.cellContext.value = value;
        this.sanitizedValue = value !== null && value !== undefined ? this.stripHtml(value) : value;
        this.cd.markForCheck();
      }
    };
    DataTableBodyCellComponent.prototype.onFocus = function () {
      this.isFocused = true;
    };
    DataTableBodyCellComponent.prototype.onBlur = function () {
      this.isFocused = false;
    };
    DataTableBodyCellComponent.prototype.onClick = function (event) {
      this.activate.emit({
        type: 'click',
        event: event,
        row: this.row,
        group: this.group,
        rowHeight: this.rowHeight,
        column: this.column,
        value: this.value,
        cellElement: this._element
      });
    };
    DataTableBodyCellComponent.prototype.onDblClick = function (event) {
      this.activate.emit({
        type: 'dblclick',
        event: event,
        row: this.row,
        group: this.group,
        rowHeight: this.rowHeight,
        column: this.column,
        value: this.value,
        cellElement: this._element
      });
    };
    DataTableBodyCellComponent.prototype.onKeyDown = function (event) {
      var keyCode = event.keyCode;
      var isTargetCell = event.target === this._element;
      var isAction =
        keyCode === exports.Keys.return ||
        keyCode === exports.Keys.down ||
        keyCode === exports.Keys.up ||
        keyCode === exports.Keys.left ||
        keyCode === exports.Keys.right;
      if (isAction && isTargetCell) {
        event.preventDefault();
        event.stopPropagation();
        this.activate.emit({
          type: 'keydown',
          event: event,
          row: this.row,
          group: this.group,
          rowHeight: this.rowHeight,
          column: this.column,
          value: this.value,
          cellElement: this._element
        });
      }
    };
    DataTableBodyCellComponent.prototype.onCheckboxChange = function (event) {
      this.activate.emit({
        type: 'checkbox',
        event: event,
        row: this.row,
        group: this.group,
        rowHeight: this.rowHeight,
        column: this.column,
        value: this.value,
        cellElement: this._element,
        treeStatus: 'collapsed'
      });
    };
    DataTableBodyCellComponent.prototype.calcSortDir = function (sorts) {
      var _this = this;
      if (!sorts) {
        return;
      }
      var sort = sorts.find(function (s) {
        return s.prop === _this.column.prop;
      });
      if (sort) {
        return sort.dir;
      }
    };
    DataTableBodyCellComponent.prototype.stripHtml = function (html) {
      if (!html.replace) {
        return html;
      }
      return html.replace(/<\/?[^>]+(>|$)/g, '');
    };
    DataTableBodyCellComponent.prototype.onTreeAction = function () {
      this.treeAction.emit(this.row);
    };
    DataTableBodyCellComponent.prototype.calcLeftMargin = function (column, row) {
      var levelIndent = column.treeLevelIndent != null ? column.treeLevelIndent : 50;
      return column.isTreeColumn ? row.level * levelIndent : 0;
    };
    return DataTableBodyCellComponent;
  })();
  DataTableBodyCellComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-body-cell',
          changeDetection: core.ChangeDetectionStrategy.OnPush,
          template:
            '\n    <div class="datatable-body-cell-label" [style.margin-left.px]="calcLeftMargin(column, row)">\n      <label\n        *ngIf="column.checkboxable && (!displayCheck || displayCheck(row, column, value))"\n        class="datatable-checkbox"\n      >\n        <input type="checkbox" [checked]="isSelected" (click)="onCheckboxChange($event)" [disabled]="selectCheck && !selectCheck(row)" />\n      </label>\n      <ng-container *ngIf="column.isTreeColumn">\n        <button\n          *ngIf="!column.treeToggleTemplate"\n          class="datatable-tree-button"\n          [disabled]="treeStatus === \'disabled\'"\n          (click)="onTreeAction()"\n        >\n          <span>\n            <i *ngIf="treeStatus === \'loading\'" class="icon datatable-icon-collapse"></i>\n            <i *ngIf="treeStatus === \'collapsed\'" class="icon datatable-icon-up"></i>\n            <i *ngIf="treeStatus === \'expanded\' || treeStatus === \'disabled\'" class="icon datatable-icon-down"></i>\n          </span>\n        </button>\n        <ng-template\n          *ngIf="column.treeToggleTemplate"\n          [ngTemplateOutlet]="column.treeToggleTemplate"\n          [ngTemplateOutletContext]="{ cellContext: cellContext }"\n        >\n        </ng-template>\n      </ng-container>\n\n      <span *ngIf="!column.cellTemplate" [title]="sanitizedValue" [innerHTML]="value"> </span>\n      <ng-template\n        #cellTemplate\n        *ngIf="column.cellTemplate"\n        [ngTemplateOutlet]="column.cellTemplate"\n        [ngTemplateOutletContext]="cellContext"\n      >\n      </ng-template>\n    </div>\n  '
        }
      ]
    }
  ];
  DataTableBodyCellComponent.ctorParameters = function () {
    return [{ type: core.ElementRef }, { type: core.ChangeDetectorRef }];
  };
  DataTableBodyCellComponent.propDecorators = {
    displayCheck: [{ type: core.Input }],
    selectCheck: [{ type: core.Input }],
    group: [{ type: core.Input }],
    rowHeight: [{ type: core.Input }],
    isSelected: [{ type: core.Input }],
    expanded: [{ type: core.Input }],
    rowIndex: [{ type: core.Input }],
    column: [{ type: core.Input }],
    row: [{ type: core.Input }],
    sorts: [{ type: core.Input }],
    treeStatus: [{ type: core.Input }],
    activate: [{ type: core.Output }],
    treeAction: [{ type: core.Output }],
    cellTemplate: [{ type: core.ViewChild, args: ['cellTemplate', { read: core.ViewContainerRef, static: true }] }],
    columnCssClasses: [{ type: core.HostBinding, args: ['class'] }],
    width: [{ type: core.HostBinding, args: ['style.width.px'] }],
    minWidth: [{ type: core.HostBinding, args: ['style.minWidth.px'] }],
    maxWidth: [{ type: core.HostBinding, args: ['style.maxWidth.px'] }],
    height: [{ type: core.HostBinding, args: ['style.height'] }],
    onFocus: [{ type: core.HostListener, args: ['focus'] }],
    onBlur: [{ type: core.HostListener, args: ['blur'] }],
    onClick: [{ type: core.HostListener, args: ['click', ['$event']] }],
    onDblClick: [{ type: core.HostListener, args: ['dblclick', ['$event']] }],
    onKeyDown: [{ type: core.HostListener, args: ['keydown', ['$event']] }]
  };

  function selectRows(selected, row, comparefn) {
    var selectedIndex = comparefn(row, selected);
    if (selectedIndex > -1) {
      selected.splice(selectedIndex, 1);
    } else {
      selected.push(row);
    }
    return selected;
  }
  function selectRowsBetween(selected, rows, index, prevIndex, comparefn) {
    var reverse = index < prevIndex;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var greater = i >= prevIndex && i <= index;
      var lesser = i <= prevIndex && i >= index;
      var range = { start: 0, end: 0 };
      if (reverse) {
        range = {
          start: index,
          end: prevIndex
        };
      } else {
        range = {
          start: prevIndex,
          end: index + 1
        };
      }
      if ((reverse && lesser) || (!reverse && greater)) {
        // if in the positive range to be added to `selected`, and
        // not already in the selected array, add it
        if (i >= range.start && i <= range.end) {
          selected.push(row);
        }
      }
    }
    return selected;
  }

  var DataTableSelectionComponent = /** @class */ (function () {
    function DataTableSelectionComponent() {
      this.activate = new core.EventEmitter();
      this.select = new core.EventEmitter();
    }
    DataTableSelectionComponent.prototype.selectRow = function (event, index, row) {
      var _a;
      if (!this.selectEnabled) return;
      if (event instanceof MouseEvent && event.type === 'click' && event.composedPath()) {
        var path = event.composedPath();
        for (var i = 0; !path[i]['localName'].startsWith('datatable-') && i < path.length; i++) {
          if (path[i]['localName'] === 'button' || path[i]['localName'] === 'a') {
            return;
          }
        }
      }
      var chkbox = this.selectionType === exports.SelectionType.checkbox;
      var multi = this.selectionType === exports.SelectionType.multi;
      var multiClick = this.selectionType === exports.SelectionType.multiClick;
      var selected = [];
      if (multi || chkbox || multiClick) {
        if (event.shiftKey) {
          selected = selectRowsBetween([], this.rows, index, this.prevIndex, this.getRowSelectedIdx.bind(this));
        } else if (event.ctrlKey || event.metaKey || multiClick || chkbox) {
          selected = selectRows(__spread(this.selected), row, this.getRowSelectedIdx.bind(this));
        } else {
          selected = selectRows([], row, this.getRowSelectedIdx.bind(this));
        }
      } else {
        selected = selectRows([], row, this.getRowSelectedIdx.bind(this));
      }
      if (typeof this.selectCheck === 'function') {
        selected = selected.filter(this.selectCheck.bind(this));
      }
      this.selected.splice(0, this.selected.length);
      (_a = this.selected).push.apply(_a, __spread(selected));
      this.prevIndex = index;
      this.select.emit({
        selected: selected
      });
    };
    DataTableSelectionComponent.prototype.onActivate = function (model, index) {
      var type = model.type,
        event = model.event,
        row = model.row;
      var chkbox = this.selectionType === exports.SelectionType.checkbox;
      var select = (!chkbox && (type === 'click' || type === 'dblclick')) || (chkbox && type === 'checkbox');
      if (select) {
        this.selectRow(event, index, row);
      } else if (type === 'keydown') {
        if (event.keyCode === exports.Keys.return) {
          this.selectRow(event, index, row);
        } else {
          this.onKeyboardFocus(model);
        }
      }
      this.activate.emit(model);
    };
    DataTableSelectionComponent.prototype.onKeyboardFocus = function (model) {
      var keyCode = model.event.keyCode;
      var shouldFocus =
        keyCode === exports.Keys.up ||
        keyCode === exports.Keys.down ||
        keyCode === exports.Keys.right ||
        keyCode === exports.Keys.left;
      if (shouldFocus) {
        var isCellSelection = this.selectionType === exports.SelectionType.cell;
        if (!model.cellElement || !isCellSelection) {
          this.focusRow(model.rowElement, keyCode);
        } else if (isCellSelection) {
          this.focusCell(model.cellElement, model.rowElement, keyCode, model.cellIndex);
        }
      }
    };
    DataTableSelectionComponent.prototype.focusRow = function (rowElement, keyCode) {
      var nextRowElement = this.getPrevNextRow(rowElement, keyCode);
      if (nextRowElement) nextRowElement.focus();
    };
    DataTableSelectionComponent.prototype.getPrevNextRow = function (rowElement, keyCode) {
      var parentElement = rowElement.parentElement;
      if (parentElement) {
        var focusElement = void 0;
        if (keyCode === exports.Keys.up) {
          focusElement = parentElement.previousElementSibling;
        } else if (keyCode === exports.Keys.down) {
          focusElement = parentElement.nextElementSibling;
        }
        if (focusElement && focusElement.children.length) {
          return focusElement.children[0];
        }
      }
    };
    DataTableSelectionComponent.prototype.focusCell = function (cellElement, rowElement, keyCode, cellIndex) {
      var nextCellElement;
      if (keyCode === exports.Keys.left) {
        nextCellElement = cellElement.previousElementSibling;
      } else if (keyCode === exports.Keys.right) {
        nextCellElement = cellElement.nextElementSibling;
      } else if (keyCode === exports.Keys.up || keyCode === exports.Keys.down) {
        var nextRowElement = this.getPrevNextRow(rowElement, keyCode);
        if (nextRowElement) {
          var children = nextRowElement.getElementsByClassName('datatable-body-cell');
          if (children.length) nextCellElement = children[cellIndex];
        }
      }
      if (nextCellElement) nextCellElement.focus();
    };
    DataTableSelectionComponent.prototype.getRowSelected = function (row) {
      return this.getRowSelectedIdx(row, this.selected) > -1;
    };
    DataTableSelectionComponent.prototype.getRowSelectedIdx = function (row, selected) {
      var _this = this;
      if (!selected || !selected.length) return -1;
      var rowId = this.rowIdentity(row);
      return selected.findIndex(function (r) {
        var id = _this.rowIdentity(r);
        return id === rowId;
      });
    };
    return DataTableSelectionComponent;
  })();
  DataTableSelectionComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-selection',
          template: ' <ng-content></ng-content> ',
          changeDetection: core.ChangeDetectionStrategy.OnPush
        }
      ]
    }
  ];
  DataTableSelectionComponent.propDecorators = {
    rows: [{ type: core.Input }],
    selected: [{ type: core.Input }],
    selectEnabled: [{ type: core.Input }],
    selectionType: [{ type: core.Input }],
    rowIdentity: [{ type: core.Input }],
    selectCheck: [{ type: core.Input }],
    activate: [{ type: core.Output }],
    select: [{ type: core.Output }]
  };

  function defaultSumFunc(cells) {
    var cellsWithValues = cells.filter(function (cell) {
      return !!cell;
    });
    if (!cellsWithValues.length) {
      return null;
    }
    if (
      cellsWithValues.some(function (cell) {
        return typeof cell !== 'number';
      })
    ) {
      return null;
    }
    return cellsWithValues.reduce(function (res, cell) {
      return res + cell;
    });
  }
  function noopSumFunc(cells) {
    return null;
  }
  var DataTableSummaryRowComponent = /** @class */ (function () {
    function DataTableSummaryRowComponent() {
      this.summaryRow = {};
    }
    DataTableSummaryRowComponent.prototype.ngOnChanges = function () {
      if (!this.columns || !this.rows) {
        return;
      }
      this.updateInternalColumns();
      this.updateValues();
    };
    DataTableSummaryRowComponent.prototype.updateInternalColumns = function () {
      this._internalColumns = this.columns.map(function (col) {
        return Object.assign(Object.assign({}, col), { cellTemplate: col.summaryTemplate });
      });
    };
    DataTableSummaryRowComponent.prototype.updateValues = function () {
      var _this = this;
      this.summaryRow = {};
      this.columns
        .filter(function (col) {
          return !col.summaryTemplate;
        })
        .forEach(function (col) {
          var cellsFromSingleColumn = _this.rows.map(function (row) {
            return row[col.prop];
          });
          var sumFunc = _this.getSummaryFunction(col);
          _this.summaryRow[col.prop] = col.pipe
            ? col.pipe.transform(sumFunc(cellsFromSingleColumn))
            : sumFunc(cellsFromSingleColumn);
        });
    };
    DataTableSummaryRowComponent.prototype.getSummaryFunction = function (column) {
      if (column.summaryFunc === undefined) {
        return defaultSumFunc;
      } else if (column.summaryFunc === null) {
        return noopSumFunc;
      } else {
        return column.summaryFunc;
      }
    };
    return DataTableSummaryRowComponent;
  })();
  DataTableSummaryRowComponent.decorators = [
    {
      type: core.Component,
      args: [
        {
          selector: 'datatable-summary-row',
          template:
            '\n    <datatable-body-row\n      *ngIf="summaryRow && _internalColumns"\n      tabindex="-1"\n      [innerWidth]="innerWidth"\n      [offsetX]="offsetX"\n      [columns]="_internalColumns"\n      [rowHeight]="rowHeight"\n      [row]="summaryRow"\n      [rowIndex]="-1"\n    >\n    </datatable-body-row>\n  ',
          host: {
            class: 'datatable-summary-row'
          }
        }
      ]
    }
  ];
  DataTableSummaryRowComponent.propDecorators = {
    rows: [{ type: core.Input }],
    columns: [{ type: core.Input }],
    rowHeight: [{ type: core.Input }],
    offsetX: [{ type: core.Input }],
    innerWidth: [{ type: core.Input }]
  };

  var NgxDatatableModule = /** @class */ (function () {
    function NgxDatatableModule() {}
    /**
     * Configure global configuration via INgxDatatableConfig
     * @param configuration
     */
    NgxDatatableModule.forRoot = function (configuration) {
      return {
        ngModule: NgxDatatableModule,
        providers: [{ provide: 'configuration', useValue: configuration }]
      };
    };
    return NgxDatatableModule;
  })();
  NgxDatatableModule.decorators = [
    {
      type: core.NgModule,
      args: [
        {
          imports: [common.CommonModule],
          providers: [ScrollbarHelper, DimensionsHelper, ColumnChangesService],
          declarations: [
            DataTableFooterTemplateDirective,
            VisibilityDirective,
            DraggableDirective,
            ResizeableDirective,
            OrderableDirective,
            LongPressDirective,
            ScrollerComponent,
            DatatableComponent,
            DataTableColumnDirective,
            DataTableHeaderComponent,
            DataTableHeaderCellComponent,
            DataTableBodyComponent,
            DataTableFooterComponent,
            DataTablePagerComponent,
            ProgressBarComponent,
            DataTableBodyRowComponent,
            DataTableRowWrapperComponent,
            DatatableRowDetailDirective,
            DatatableGroupHeaderDirective,
            DatatableRowDetailTemplateDirective,
            DataTableBodyCellComponent,
            DataTableSelectionComponent,
            DataTableColumnHeaderDirective,
            DataTableColumnCellDirective,
            DataTableColumnCellTreeToggle,
            DatatableFooterDirective,
            DatatableGroupHeaderTemplateDirective,
            DataTableSummaryRowComponent
          ],
          exports: [
            DatatableComponent,
            DatatableRowDetailDirective,
            DatatableGroupHeaderDirective,
            DatatableRowDetailTemplateDirective,
            DataTableColumnDirective,
            DataTableColumnHeaderDirective,
            DataTableColumnCellDirective,
            DataTableColumnCellTreeToggle,
            DataTableFooterTemplateDirective,
            DatatableFooterDirective,
            DataTablePagerComponent,
            DatatableGroupHeaderTemplateDirective
          ]
        }
      ]
    }
  ];

  (function (ClickType) {
    ClickType['single'] = 'single';
    ClickType['double'] = 'double';
  })(exports.ClickType || (exports.ClickType = {}));

  if (typeof document !== 'undefined' && !document.elementsFromPoint) {
    document.elementsFromPoint = elementsFromPoint;
  }
  /*tslint:disable*/
  /**
   * Polyfill for `elementsFromPoint`
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/Document/elementsFromPoint
   * https://gist.github.com/iddan/54d5d9e58311b0495a91bf06de661380
   * https://gist.github.com/oslego/7265412
   */
  function elementsFromPoint(x, y) {
    var elements = [];
    var previousPointerEvents = [];
    var current; // TODO: window.getComputedStyle should be used with inferred type (Element)
    var i;
    var d;
    //if (document === undefined) return elements;
    // get all elements via elementFromPoint, and remove them from hit-testing in order
    while ((current = document.elementFromPoint(x, y)) && elements.indexOf(current) === -1 && current != null) {
      // push the element and its current style
      elements.push(current);
      previousPointerEvents.push({
        value: current.style.getPropertyValue('pointer-events'),
        priority: current.style.getPropertyPriority('pointer-events')
      });
      // add "pointer-events: none", to get to the underlying element
      current.style.setProperty('pointer-events', 'none', 'important');
    }
    // restore the previous pointer-events values
    for (i = previousPointerEvents.length; (d = previousPointerEvents[--i]); ) {
      elements[i].style.setProperty('pointer-events', d.value ? d.value : '', d.priority);
    }
    // return our results
    return elements;
  }
  /*tslint:enable*/

  /*
   * Public API Surface of ngx-datatable
   */

  /**
   * Generated bundle index. Do not edit.
   */

  exports.ColumnChangesService = ColumnChangesService;
  exports.DataTableBodyCellComponent = DataTableBodyCellComponent;
  exports.DataTableBodyComponent = DataTableBodyComponent;
  exports.DataTableBodyRowComponent = DataTableBodyRowComponent;
  exports.DataTableColumnCellDirective = DataTableColumnCellDirective;
  exports.DataTableColumnCellTreeToggle = DataTableColumnCellTreeToggle;
  exports.DataTableColumnDirective = DataTableColumnDirective;
  exports.DataTableColumnHeaderDirective = DataTableColumnHeaderDirective;
  exports.DataTableFooterComponent = DataTableFooterComponent;
  exports.DataTableFooterTemplateDirective = DataTableFooterTemplateDirective;
  exports.DataTableHeaderCellComponent = DataTableHeaderCellComponent;
  exports.DataTableHeaderComponent = DataTableHeaderComponent;
  exports.DataTablePagerComponent = DataTablePagerComponent;
  exports.DataTableRowWrapperComponent = DataTableRowWrapperComponent;
  exports.DataTableSelectionComponent = DataTableSelectionComponent;
  exports.DataTableSummaryRowComponent = DataTableSummaryRowComponent;
  exports.DatatableComponent = DatatableComponent;
  exports.DatatableFooterDirective = DatatableFooterDirective;
  exports.DatatableGroupHeaderDirective = DatatableGroupHeaderDirective;
  exports.DatatableGroupHeaderTemplateDirective = DatatableGroupHeaderTemplateDirective;
  exports.DatatableRowDetailDirective = DatatableRowDetailDirective;
  exports.DatatableRowDetailTemplateDirective = DatatableRowDetailTemplateDirective;
  exports.DimensionsHelper = DimensionsHelper;
  exports.DraggableDirective = DraggableDirective;
  exports.LongPressDirective = LongPressDirective;
  exports.NgxDatatableModule = NgxDatatableModule;
  exports.OrderableDirective = OrderableDirective;
  exports.ProgressBarComponent = ProgressBarComponent;
  exports.ResizeableDirective = ResizeableDirective;
  exports.RowHeightCache = RowHeightCache;
  exports.ScrollbarHelper = ScrollbarHelper;
  exports.ScrollerComponent = ScrollerComponent;
  exports.VisibilityDirective = VisibilityDirective;
  exports.adjustColumnWidths = adjustColumnWidths;
  exports.camelCase = camelCase;
  exports.columnGroupWidths = columnGroupWidths;
  exports.columnTotalWidth = columnTotalWidth;
  exports.columnsByPin = columnsByPin;
  exports.columnsByPinArr = columnsByPinArr;
  exports.columnsTotalWidth = columnsTotalWidth;
  exports.deCamelCase = deCamelCase;
  exports.deepValueGetter = deepValueGetter;
  exports.elementsFromPoint = elementsFromPoint;
  exports.emptyStringGetter = emptyStringGetter;
  exports.forceFillColumnWidths = forceFillColumnWidths;
  exports.getTotalFlexGrow = getTotalFlexGrow;
  exports.getVendorPrefixedName = getVendorPrefixedName;
  exports.getterForProp = getterForProp;
  exports.groupRowsByParents = groupRowsByParents;
  exports.id = id;
  exports.isNullOrUndefined = isNullOrUndefined;
  exports.nextSortDir = nextSortDir;
  exports.numericIndexGetter = numericIndexGetter;
  exports.optionalGetterForProp = optionalGetterForProp;
  exports.orderByComparator = orderByComparator;
  exports.selectRows = selectRows;
  exports.selectRowsBetween = selectRowsBetween;
  exports.setColumnDefaults = setColumnDefaults;
  exports.shallowValueGetter = shallowValueGetter;
  exports.sortRows = sortRows;
  exports.throttle = throttle;
  exports.throttleable = throttleable;
  exports.translateTemplates = translateTemplates;
  exports.translateXY = translateXY;
  exports.ɵ0 = ɵ0;

  Object.defineProperty(exports, '__esModule', { value: true });
});
//# sourceMappingURL=swimlane-ngx-datatable.umd.js.map

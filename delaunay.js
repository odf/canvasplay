(function() {
  var HashMap, HashSet, IntMap, Point2d, Point3d, PointAtInfinity, Queue, Triangle, args, bounce, delaunayTriangulation, equal, hashCode, memo, seq, test, trace, triangulation, _ref, _ref2, _ref3, _ref4, _ref5;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  if (typeof require !== 'undefined') {
    require.paths.unshift('#{__dirname}/../lib');
    _ref = require('core_extensions'), equal = _ref.equal, hashCode = _ref.hashCode;
    bounce = require('functional').bounce;
    seq = require('sequence').seq;
    _ref2 = require('indexed'), IntMap = _ref2.IntMap, HashSet = _ref2.HashSet, HashMap = _ref2.HashMap;
    Queue = require('queue').Queue;
  } else {
    _ref3 = this.pazy, equal = _ref3.equal, hashCode = _ref3.hashCode, bounce = _ref3.bounce, seq = _ref3.seq, IntMap = _ref3.IntMap, HashSet = _ref3.HashSet, HashMap = _ref3.HashMap, Queue = _ref3.Queue;
  }
  trace = function(s) {};
  memo = function(klass, name, f) {
    return klass.prototype[name] = function() {
      var x;
      x = f.call(this);
      return (this[name] = function() {
        return x;
      })();
    };
  };
  Point2d = (function() {
    function Point2d(x, y) {
      this.x = x;
      this.y = y;
    }
    Point2d.prototype.isInfinite = function() {
      return false;
    };
    Point2d.prototype.plus = function(p) {
      return new Point2d(this.x + p.x, this.y + p.y);
    };
    Point2d.prototype.minus = function(p) {
      return new Point2d(this.x - p.x, this.y - p.y);
    };
    Point2d.prototype.times = function(f) {
      return new Point2d(this.x * f, this.y * f);
    };
    memo(Point2d, 'lift', function() {
      return new Point3d(this.x, this.y, this.x * this.x + this.y * this.y);
    });
    Point2d.prototype.equals = function(p) {
      return this.constructor === (p != null ? p.constructor : void 0) && this.x === p.x && this.y === p.y;
    };
    memo(Point2d, 'toString', function() {
      return "(" + this.x + ", " + this.y + ")";
    });
    memo(Point2d, 'hashCode', function() {
      return hashCode(this.toString());
    });
    return Point2d;
  })();
  PointAtInfinity = (function() {
    function PointAtInfinity(x, y) {
      this.x = x;
      this.y = y;
    }
    PointAtInfinity.prototype.isInfinite = function() {
      return true;
    };
    PointAtInfinity.prototype.equals = function(p) {
      return this.constructor === (p != null ? p.constructor : void 0) && this.x === p.x && this.y === p.y;
    };
    memo(PointAtInfinity, 'toString', function() {
      return "inf(" + this.x + ", " + this.y + ")";
    });
    memo(PointAtInfinity, 'hashCode', function() {
      return hashCode(this.toString());
    });
    return PointAtInfinity;
  })();
  Point3d = (function() {
    function Point3d(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    Point3d.prototype.minus = function(p) {
      return new Point3d(this.x - p.x, this.y - p.y, this.z - p.z);
    };
    Point3d.prototype.times = function(f) {
      return new Point3d(this.x * f, this.y * f, this.z * f);
    };
    Point3d.prototype.dot = function(p) {
      return this.x * p.x + this.y * p.y + this.z * p.z;
    };
    Point3d.prototype.cross = function(p) {
      return new Point3d(this.y * p.z - this.z * p.y, this.z * p.x - this.x * p.z, this.x * p.y - this.y * p.x);
    };
    return Point3d;
  })();
  Triangle = (function() {
    function Triangle(a, b, c) {
      this.a = a;
      this.b = b;
      this.c = c;
    }
    memo(Triangle, 'vertices', function() {
      if (this.a.toString() < this.b.toString() && this.a.toString() < this.c.toString()) {
        return [this.a, this.b, this.c];
      } else if (this.b.toString() < this.c.toString()) {
        return [this.b, this.c, this.a];
      } else {
        return [this.c, this.a, this.b];
      }
    });
    memo(Triangle, 'liftedNormal', function() {
      var n;
      n = this.b.lift().minus(this.a.lift()).cross(this.c.lift().minus(this.a.lift()));
      if (n.z <= 0) {
        return n;
      } else {
        return n.times(-1);
      }
    });
    memo(Triangle, 'circumCircleCenter', function() {
      var n;
      n = this.liftedNormal();
      if (1e-6 < Math.abs(n.z)) {
        return new Point2d(n.x, n.y).times(-0.5 / n.z);
      }
    });
    memo(Triangle, 'circumCircleRadius', function() {
      var c, square;
      c = this.circumCircleCenter();
      square = function(x) {
        return x * x;
      };
      return Math.sqrt(square(c.x - this.a.x) + square(c.y - this.a.y));
    });
    Triangle.prototype.inclusionInCircumCircle = function(d) {
      return this.liftedNormal().dot(d.lift().minus(this.a.lift()));
    };
    memo(Triangle, 'toSeq', function() {
      return seq(this.vertices());
    });
    memo(Triangle, 'toString', function() {
      return "T(" + (seq.join(this, ', ')) + ")";
    });
    memo(Triangle, 'hashCode', function() {
      return hashCode(this.toString());
    });
    Triangle.prototype.equals = function(other) {
      return seq.equals(this, other);
    };
    return Triangle;
  })();
  triangulation = (function() {
    var Triangulation;
    Triangulation = (function() {
      function Triangulation(third__) {
        this.third__ = third__ != null ? third__ : new HashMap();
      }
      memo(Triangulation, 'toSeq', function() {
        var _ref4;
        return (_ref4 = seq.map(this.third__, function(_arg) {
          var c, e, t, _ref5;
          e = _arg[0], _ref5 = _arg[1], t = _ref5[0], c = _ref5[1];
          if (equal(c, t.a)) {
            return t;
          }
        })) != null ? _ref4.select(function(x) {
          return x != null;
        }) : void 0;
      });
      Triangulation.prototype.third = function(a, b) {
        var _ref4;
        return (_ref4 = this.third__.get([a, b])) != null ? _ref4[1] : void 0;
      };
      Triangulation.prototype.triangle = function(a, b) {
        var _ref4;
        return (_ref4 = this.third__.get([a, b])) != null ? _ref4[0] : void 0;
      };
      Triangulation.prototype.plus = function(a, b, c) {
        var added, t;
        if (equal(this.third(a, b), c)) {
          return this;
        } else if (seq.find([[a, b], [b, c], [c, a]], __bind(function(_arg) {
          var p, q;
          p = _arg[0], q = _arg[1];
          return this.third(p, q);
        }, this))) {
          throw new Error("Orientation mismatch.");
        } else {
          t = new Triangle(a, b, c);
          added = [[[a, b], [t, c]], [[b, c], [t, a]], [[c, a], [t, b]]];
          return new Triangulation(this.third__.plusAll(added));
        }
      };
      Triangulation.prototype.minus = function(a, b, c) {
        if (!equal(this.third(a, b), c)) {
          return this;
        } else {
          return new Triangulation(this.third__.minusAll([[a, b], [b, c], [c, a]]));
        }
      };
      return Triangulation;
    })();
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return seq.reduce(args, new Triangulation(), function(t, x) {
        return t.plus.apply(t, x);
      });
    };
  })();
  delaunayTriangulation = (function() {
    var Triangulation;
    Triangulation = (function() {
      var doFlips, flip, outer, subdivide;
      outer = new Triangle(new PointAtInfinity(1, 0), new PointAtInfinity(-1, 1), new PointAtInfinity(-1, -1));
      function Triangulation() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.triangulation__ = args[0] || triangulation(outer.vertices());
        this.sites__ = args[1] || new HashSet();
        this.children__ = args[2] || new HashMap();
      }
      memo(Triangulation, 'toSeq', function() {
        return seq.select(this.triangulation__, function(t) {
          return seq.forall(t, function(p) {
            return !p.isInfinite();
          });
        });
      });
      Triangulation.prototype.third = function(a, b) {
        return this.triangulation__.third(a, b);
      };
      Triangulation.prototype.triangle = function(a, b) {
        return this.triangulation__.triangle(a, b);
      };
      Triangulation.prototype.sideOf = function(a, b, p) {
        var ab, ap;
        if (a.isInfinite() && b.isInfinite()) {
          return -1;
        } else if (a.isInfinite()) {
          return -this.sideOf(b, a, p);
        } else {
          ab = b.isInfinite() ? new Point2d(b.x, b.y) : b.minus(a);
          ap = p.minus(a);
          return ap.x * ab.y - ap.y * ab.x;
        }
      };
      Triangulation.prototype.isInTriangle = function(t, p) {
        var a, b, c, _ref4;
        _ref4 = t.vertices(), a = _ref4[0], b = _ref4[1], c = _ref4[2];
        return seq([[a, b], [b, c], [c, a]]).forall(__bind(function(_arg) {
          var r, s;
          r = _arg[0], s = _arg[1];
          return this.sideOf(r, s, p) <= 0;
        }, this));
      };
      Triangulation.prototype.containingTriangle = function(p) {
        var step;
        step = __bind(function(t) {
          var candidates;
          candidates = this.children__.get(t);
          if (seq.empty(candidates)) {
            return t;
          } else {
            return __bind(function() {
              return step(candidates.find(__bind(function(s) {
                return this.isInTriangle(s, p);
              }, this)));
            }, this);
          }
        }, this);
        return bounce(step(outer));
      };
      Triangulation.prototype.mustFlip = function(a, b) {
        var c, d;
        c = this.third(a, b);
        d = this.third(b, a);
        if ((a.isInfinite() && b.isInfinite()) || !(c != null) || !(d != null)) {
          return false;
        } else if (a.isInfinite()) {
          return this.sideOf(d, c, b) > 0;
        } else if (b.isInfinite()) {
          return this.sideOf(c, d, a) > 0;
        } else if (c.isInfinite() || d.isInfinite()) {
          return false;
        } else {
          return this.triangle(a, b).inclusionInCircumCircle(d) > 0;
        }
      };
      subdivide = function(T, t, p) {
        var S, a, b, c, _ref4;
        trace(function() {
          return "subdivide [" + (T.triangulation__.toSeq().join(', ')) + "], " + t + ", " + p;
        });
        _ref4 = t.vertices(), a = _ref4[0], b = _ref4[1], c = _ref4[2];
        S = T.triangulation__.minus(a, b, c).plus(a, b, p).plus(b, c, p).plus(c, a, p);
        return new T.constructor(S, T.sites__.plus(p), T.children__.plus([T.triangle(a, b), seq([S.triangle(a, b), S.triangle(b, c), S.triangle(c, a)])]));
      };
      flip = function(T, a, b) {
        var S, c, children, d;
        trace(function() {
          return "flip [" + (T.triangulation__.toSeq().join(', ')) + "], " + a + ", " + b;
        });
        c = T.third(a, b);
        d = T.third(b, a);
        S = T.triangulation__.minus(a, b, c).minus(b, a, d).plus(b, c, d).plus(a, d, c);
        children = seq([S.triangle(c, d), S.triangle(d, c)]);
        return new T.constructor(S, T.sites__, T.children__.plus([T.triangle(a, b), children], [T.triangle(b, a), children]));
      };
      doFlips = function(T, stack) {
        var a, b, c, _ref4;
        if (seq.empty(stack)) {
          return T;
        } else {
          _ref4 = stack.first(), a = _ref4[0], b = _ref4[1];
          if (T.mustFlip(a, b)) {
            c = T.third(a, b);
            return function() {
              return doFlips(flip(T, a, b), seq([[a, c], [c, b]]).concat(stack.rest()));
            };
          } else {
            return function() {
              return doFlips(T, stack.rest());
            };
          }
        }
      };
      Triangulation.prototype.plus = function(x, y) {
        var a, b, c, p, t, _ref4;
        p = new Point2d(x, y);
        if (this.sites__.contains(p)) {
          return this;
        } else {
          t = this.containingTriangle(p);
          _ref4 = t.vertices(), a = _ref4[0], b = _ref4[1], c = _ref4[2];
          return seq([[b, a], [c, b], [a, c]]).reduce(subdivide(this, t, p), function(T, _arg) {
            var u, v, w;
            u = _arg[0], v = _arg[1];
            if (T.sideOf(u, v, p) === 0) {
              w = T.third(u, v);
              if (w != null) {
                return bounce(doFlips(flip(T, u, v), seq([[u, w], [w, v]])));
              } else {
                return T;
              }
            } else {
              return bounce(doFlips(T, seq([[u, v]])));
            }
          });
        }
      };
      return Triangulation;
    })();
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return seq.reduce(args, new Triangulation(), function(t, x) {
        return t.plus.apply(t, x);
      });
    };
  })();
    if (typeof exports !== "undefined" && exports !== null) {
    exports;
  } else {
    exports = (_ref4 = this.pazy) != null ? _ref4 : this.pazy = {};
  };
  exports.Triangle = Triangle;
  exports.Point2d = Point2d;
  exports.delaunayTriangulation = delaunayTriangulation;
  test = function(n, m) {
    if (n == null) {
      n = 100;
    }
    if (m == null) {
      m = 10;
    }
    return seq.range(1, n).each(function(i) {
      var rnd, t;
      console.log("Run " + i);
      rnd = function() {
        return Math.floor(Math.random() * 100);
      };
      return t = seq.range(1, m).reduce(delaunayTriangulation(), function(s, j) {
        var p;
        p = [rnd(), rnd()];
        try {
          return s.plus.apply(s, p);
        } catch (ex) {
          console.log(seq.join(s, ', '));
          console.log(p);
          console.log(ex.stacktrace);
          throw "Oops!";
        }
      });
    });
  };
  if ((typeof module !== "undefined" && module !== null) && !module.parent) {
    args = (_ref5 = seq.map(process.argv.slice(2), parseInt)) != null ? _ref5.into([]) : void 0;
    test.apply(null, args);
  }
}).call(this);

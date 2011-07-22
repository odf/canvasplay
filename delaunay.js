(function() {
  var HashMap, HashSet, IntMap, Point2d, Point3d, PointAtInfinity, Queue, Triangle, args, circumCircleCenter, delaunayTriangulation, equal, hashCode, inclusionInCircumCircle, lift, liftedNormal, recur, resolve, seq, test, trace, tri, triangulation, unlift, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  if (typeof require !== 'undefined') {
    require.paths.unshift('#{__dirname}/../lib');
    _ref = require('core_extensions'), equal = _ref.equal, hashCode = _ref.hashCode;
    _ref2 = require('functional'), recur = _ref2.recur, resolve = _ref2.resolve;
    seq = require('sequence').seq;
    _ref3 = require('indexed'), IntMap = _ref3.IntMap, HashSet = _ref3.HashSet, HashMap = _ref3.HashMap;
    Queue = require('queue').Queue;
  } else {
    _ref4 = this.pazy, equal = _ref4.equal, hashCode = _ref4.hashCode, recur = _ref4.recur, resolve = _ref4.resolve, seq = _ref4.seq, IntMap = _ref4.IntMap, HashSet = _ref4.HashSet, HashMap = _ref4.HashMap, Queue = _ref4.Queue;
  }
  trace = function(s) {};
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
    Point2d.prototype.toString = function() {
      return "(" + this.x + ", " + this.y + ")";
    };
    Point2d.prototype.equals = function(p) {
      return this.constructor === p.constructor && this.x === p.x && this.y === p.y;
    };
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
    PointAtInfinity.prototype.toString = function() {
      return "inf(" + this.x + ", " + this.y + ")";
    };
    PointAtInfinity.prototype.equals = function(p) {
      return this.constructor === p.constructor && this.x === p.x && this.y === p.y;
    };
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
      var as, bs, cs, _ref5, _ref6;
      _ref5 = seq.map([a, b, c], function(x) {
        return x.toString();
      }).into([]), as = _ref5[0], bs = _ref5[1], cs = _ref5[2];
      _ref6 = as < bs && as < cs ? [a, b, c] : bs < cs ? [b, c, a] : [c, a, b], this.a = _ref6[0], this.b = _ref6[1], this.c = _ref6[2];
    }
    Triangle.prototype.vertices = function() {
      return [this.a, this.b, this.c];
    };
    Triangle.prototype.toSeq = function() {
      return seq([this.a, this.b, this.c]);
    };
    Triangle.prototype.equals = function(other) {
      return equal(this.a, other.a) && equal(this.b, other.b) && equal(this.c, other.c);
    };
    Triangle.prototype.toString = function() {
      return "T(" + this.a + ", " + this.b + ", " + this.c + ")";
    };
    return Triangle;
  })();
  tri = function(a, b, c) {
    return new Triangle(a, b, c);
  };
  lift = function(p) {
    return new Point3d(p.x, p.y, p.x * p.x + p.y * p.y);
  };
  unlift = function(p) {
    return new Point2d(p.x, p.y);
  };
  liftedNormal = function(a, b, c) {
    var n;
    n = lift(b).minus(lift(a)).cross(lift(c).minus(lift(a)));
    if (n.z > 0) {
      return n.times(-1);
    } else {
      return n;
    }
  };
  circumCircleCenter = function(a, b, c) {
    var n;
    n = liftedNormal(a, b, c);
    if (Math.abs(n.z) > 1e-6) {
      return unlift(n.times(-0.5 / n.z));
    }
  };
  inclusionInCircumCircle = function(a, b, c, d) {
    return liftedNormal(a, b, c).dot(lift(d).minus(lift(a)));
  };
  triangulation = (function() {
    var Triangulation;
    Triangulation = (function() {
      function Triangulation() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.triangles__ = args[0] || new HashSet();
        this.third__ = args[1] || new HashMap();
      }
      Triangulation.prototype.toSeq = function() {
        return this.triangles__.toSeq();
      };
      Triangulation.prototype.third = function(a, b) {
        return this.third__.get([a, b]);
      };
      Triangulation.prototype.find = function(a, b, c) {
        var t;
        t = tri(a, b, c != null ? c : this.third(a, b));
        if (this.triangles__.contains(t)) {
          return t;
        }
      };
      Triangulation.prototype.plus = function(a, b, c) {
        var f, g, h, third, triangles, x;
        if (this.find(a, b, c)) {
          return this;
        } else if (x = seq([[a, b], [b, c], [c, a]]).find(__bind(function(e) {
          return this.third__.get(e) != null;
        }, this))) {
          f = x[0], g = x[1];
          h = this.third__.get(x);
          trace(function() {
            var _ref5;
            return "  Error in plus [" + ((_ref5 = this.toSeq()) != null ? _ref5.join(', ') : void 0) + "], (" + a + ", " + b + ", " + c + ")";
          });
          throw new Error("Orientation mismatch.");
        } else {
          triangles = this.triangles__.plus(tri(a, b, c));
          third = this.third__.plusAll(seq([[[a, b], c], [[b, c], a], [[c, a], b]]));
          return new Triangulation(triangles, third);
        }
      };
      Triangulation.prototype.minus = function(a, b, c) {
        var t, third, triangles;
        t = this.find(a, b, c);
        if (t != null) {
          triangles = this.triangles__.minus(t);
          third = this.third__.minusAll(seq([[a, b], [b, c], [c, a]]));
          return new Triangulation(triangles, third);
        } else {
          return this;
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
      outer = tri(new PointAtInfinity(1, 0), new PointAtInfinity(-1, 1), new PointAtInfinity(-1, -1));
      function Triangulation() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.triangulation__ = args[0] || triangulation(outer.vertices());
        this.sites__ = args[1] || new HashSet();
        this.children__ = args[2] || new HashMap();
      }
      Triangulation.prototype.toSeq = function() {
        return seq.select(this.triangulation__, function(t) {
          return seq.forall(t, function(p) {
            return !p.isInfinite();
          });
        });
      };
      Triangulation.prototype.third = function(a, b) {
        return this.triangulation__.third(a, b);
      };
      Triangulation.prototype.find = function(a, b, c) {
        return this.triangulation__.find(a, b, c);
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
        var a, b, c, _ref5;
        _ref5 = t.vertices(), a = _ref5[0], b = _ref5[1], c = _ref5[2];
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
            return recur(__bind(function() {
              return step(candidates.find(__bind(function(s) {
                return this.isInTriangle(s, p);
              }, this)));
            }, this));
          }
        }, this);
        return resolve(step(outer));
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
          return inclusionInCircumCircle(a, b, c, d) > 0;
        }
      };
      subdivide = function(T, t, p) {
        var a, b, c, _ref5;
        trace(function() {
          return "subdivide [" + (T.triangulation__.toSeq().join(', ')) + "], " + t + ", " + p;
        });
        _ref5 = t.vertices(), a = _ref5[0], b = _ref5[1], c = _ref5[2];
        return new T.constructor(T.triangulation__.minus(a, b, c).plus(a, b, p).plus(b, c, p).plus(c, a, p), T.sites__.plus(p), T.children__.plus([T.find(a, b, c), seq([tri(a, b, p), tri(b, c, p), tri(c, a, p)])]));
      };
      flip = function(T, a, b) {
        var c, children, d;
        trace(function() {
          return "flip [" + (T.triangulation__.toSeq().join(', ')) + "], " + a + ", " + b;
        });
        c = T.third(a, b);
        d = T.third(b, a);
        children = seq([tri(b, c, d), tri(a, d, c)]);
        return new T.constructor(T.triangulation__.minus(a, b, c).minus(b, a, d).plus(b, c, d).plus(a, d, c), T.sites__, T.children__.plus([T.find(a, b, c), children], [T.find(b, a, d), children]));
      };
      doFlips = function(T, stack) {
        var a, b, c, _ref5;
        if (seq.empty(stack)) {
          return T;
        } else {
          _ref5 = stack.first(), a = _ref5[0], b = _ref5[1];
          if (T.mustFlip(a, b)) {
            c = T.third(a, b);
            return recur(function() {
              return doFlips(flip(T, a, b), seq([[a, c], [c, b]]).concat(stack.rest()));
            });
          } else {
            return recur(function() {
              return doFlips(T, stack.rest());
            });
          }
        }
      };
      Triangulation.prototype.plus = function(x, y) {
        var a, b, c, p, t, _ref5;
        p = new Point2d(x, y);
        if (this.sites__.contains(p)) {
          return this;
        } else {
          t = this.containingTriangle(p);
          _ref5 = t.vertices(), a = _ref5[0], b = _ref5[1], c = _ref5[2];
          return seq([[b, a], [c, b], [a, c]]).reduce(subdivide(this, t, p), function(T, _arg) {
            var u, v, w;
            u = _arg[0], v = _arg[1];
            if (T.sideOf(u, v, p) === 0) {
              w = T.third(u, v);
              if (w != null) {
                return resolve(doFlips(flip(T, u, v), seq([[u, w], [w, v]])));
              } else {
                return T;
              }
            } else {
              return resolve(doFlips(T, seq([[u, v]])));
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
    exports = (_ref5 = this.pazy) != null ? _ref5 : this.pazy = {};
  };
  exports.Point2d = Point2d;
  exports.delaunayTriangulation = delaunayTriangulation;
  exports.circumCircleCenter = circumCircleCenter;
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
    args = (_ref6 = seq.map(process.argv.slice(2), parseInt)) != null ? _ref6.into([]) : void 0;
    test.apply(null, args);
  }
}).call(this);

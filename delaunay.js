(function() {
  var HashMap, HashSet, IntMap, Point2d, Point3d, Sequence, Triangle, args, circumCircleCenter, delaunayTriangulation, inclusionInCircumCircle, lift, liftedNormal, recur, resolve, seq, test, trace, tri, triangulation, unlift, _ref, _ref2, _ref3, _ref4, _ref5;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  if (typeof require !== 'undefined') {
    require.paths.unshift('#{__dirname}/../lib');
    _ref = require('functional'), recur = _ref.recur, resolve = _ref.resolve;
    Sequence = require('sequence').Sequence;
    _ref2 = require('indexed'), IntMap = _ref2.IntMap, HashSet = _ref2.HashSet, HashMap = _ref2.HashMap;
  } else {
    _ref3 = this.pazy, recur = _ref3.recur, resolve = _ref3.resolve, Sequence = _ref3.Sequence, IntMap = _ref3.IntMap, HashSet = _ref3.HashSet, HashMap = _ref3.HashMap;
  }
  trace = function(s) {};
  seq = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return new Sequence(args);
  };
  Point2d = (function() {
    function Point2d(x, y) {
      this.x = x;
      this.y = y;
    }
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
      return this.x === p.x && this.y === p.y;
    };
    return Point2d;
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
      var h, _ref4;
      _ref4 = a < b && a < c ? [a, b, c] : b < c ? [b, c, a] : [c, a, b], this.a = _ref4[0], this.b = _ref4[1], this.c = _ref4[2];
      h = (this.a * 37 + this.b) * 37 + this.c;
      this.hashcode = function() {
        return h;
      };
    }
    Triangle.prototype.vertices = function() {
      return [this.a, this.b, this.c];
    };
    Triangle.prototype.toSeq = function() {
      return seq(this.a, this.b, this.c);
    };
    Triangle.prototype.equals = function(other) {
      return this.a === other.a && this.b === other.b && this.c === other.c;
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
      function Triangulation(triangles__, third__) {
        this.triangles__ = triangles__ != null ? triangles__ : new HashSet();
        this.third__ = third__ != null ? third__ : new HashMap();
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
        var f, g, h, x;
        if (this.find(a, b, c)) {
          return this;
        } else if (x = seq([a, b], [b, c], [c, a]).find(__bind(function(e) {
          return this.third__.get(e) != null;
        }, this))) {
          f = x[0], g = x[1];
          h = this.third__.get(x);
          throw new Error("Orientation mismatch.");
        } else {
          return new Triangulation(this.triangles__.plus(tri(a, b, c)), this.third__.plusAll(seq([[a, b], c], [[b, c], a], [[c, a], b])));
        }
      };
      Triangulation.prototype.minus = function(a, b, c) {
        var t;
        t = this.find(a, b, c);
        if (t != null) {
          return new Triangulation(this.triangles__.minus(t), this.third__.minusAll(seq([a, b], [b, c], [c, a])));
        } else {
          return this;
        }
      };
      return Triangulation;
    })();
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return Sequence.reduce(args, new Triangulation(), function(t, x) {
        return t.plus.apply(t, x);
      });
    };
  })();
  delaunayTriangulation = (function() {
    var Triangulation;
    Triangulation = (function() {
      var doFlips, flip, outer, subdivide;
      outer = tri(-1, -2, -3);
      function Triangulation() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.triangulation__ = args[0] || triangulation(outer.vertices());
        this.position__ = args[1] || new IntMap();
        this.nextIndex__ = args[2] || 0;
        this.sites__ = args[3] || new HashSet();
        this.children__ = args[4] || new HashMap();
      }
      Triangulation.prototype.toSeq = function() {
        return Sequence.select(this.triangulation__, function(t) {
          return Sequence.forall(t, function(n) {
            return n >= 0;
          });
        });
      };
      Triangulation.prototype.third = function(a, b) {
        return this.triangulation__.third(a, b);
      };
      Triangulation.prototype.find = function(a, b, c) {
        return this.triangulation__.find(a, b, c);
      };
      Triangulation.prototype.position = function(n) {
        return this.position__.get(n);
      };
      Triangulation.prototype.sideOf = function(a, b, p) {
        var r, rp, rs;
        if (a < 0 && b < 0) {
          return -1;
        } else if (a < 0) {
          return -this.sideOf(b, a, p);
        } else {
          r = this.position(a);
          rs = (function() {
            switch (b) {
              case -1:
                return new Point2d(1, 0);
              case -2:
                return new Point2d(-1, 1);
              case -3:
                return new Point2d(-1, -1);
              default:
                return this.position(b).minus(r);
            }
          }).call(this);
          rp = p.minus(r);
          return rp.x * rs.y - rp.y * rs.x;
        }
      };
      Triangulation.prototype.isInTriangle = function(t, p) {
        var a, b, c, _ref4;
        _ref4 = t.vertices(), a = _ref4[0], b = _ref4[1], c = _ref4[2];
        return seq([a, b], [b, c], [c, a]).forall(__bind(function(_arg) {
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
          if (Sequence.empty(candidates)) {
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
        var c, d, pa, pb, pc, pd, _ref4;
        c = this.third(a, b);
        d = this.third(b, a);
        trace("  mustFlip " + a + ", " + b + " - c = " + c + ". d = " + d);
        if ((a < 0 && b < 0) || !(c != null) || !(d != null)) {
          return false;
        } else if (a < 0) {
          return this.sideOf(d, c, this.position(b)) > 0;
        } else if (b < 0) {
          return this.sideOf(c, d, this.position(a)) > 0;
        } else if (c < 0 || d < 0) {
          return false;
        } else {
          _ref4 = seq(a, b, c, d).map(__bind(function(x) {
            return this.position(x);
          }, this)).into([]), pa = _ref4[0], pb = _ref4[1], pc = _ref4[2], pd = _ref4[3];
          return inclusionInCircumCircle(pa, pb, pc, pd) > 0;
        }
      };
      subdivide = function(T, t, p) {
        var a, b, c, n, _ref4;
        trace("subdivide [" + (T.triangulation__.toSeq()) + "], " + t + ", " + p);
        _ref4 = t.vertices(), a = _ref4[0], b = _ref4[1], c = _ref4[2];
        n = T.nextIndex__;
        return new T.constructor(T.triangulation__.minus(a, b, c).plus(a, b, n).plus(b, c, n).plus(c, a, n), T.position__.plus([n, p]), n + 1, T.sites__.plus(p), T.children__.plus([T.find(a, b, c), seq(tri(a, b, n), tri(b, c, n), tri(c, a, n))]));
      };
      flip = function(T, a, b) {
        var c, children, d;
        trace("flip [" + (T.triangulation__.toSeq()) + "], " + a + ", " + b);
        c = T.third(a, b);
        d = T.third(b, a);
        children = seq(tri(b, c, d), tri(a, d, c));
        return new T.constructor(T.triangulation__.minus(a, b, c).minus(b, a, d).plus(b, c, d).plus(a, d, c), T.position__, T.nextIndex__, T.sites__, T.children__.plus([T.find(a, b, c), children], [T.find(b, a, d), children]));
      };
      doFlips = function(T, stack) {
        var a, b, c, _ref4;
        if (Sequence.empty(stack)) {
          return T;
        } else {
          _ref4 = stack.first(), a = _ref4[0], b = _ref4[1];
          if (T.mustFlip(a, b)) {
            c = T.third(a, b);
            return recur(function() {
              return doFlips(flip(T, a, b), seq([a, c], [c, b]).concat(stack.rest()));
            });
          } else {
            return recur(function() {
              return doFlips(T, stack.rest());
            });
          }
        }
      };
      Triangulation.prototype.plus = function(p) {
        var a, b, c, t, _ref4;
        if (this.sites__.contains(p)) {
          return this;
        } else {
          t = this.containingTriangle(p);
          _ref4 = t.vertices(), a = _ref4[0], b = _ref4[1], c = _ref4[2];
          return seq([b, a], [c, b], [a, c]).reduce(subdivide(this, t, p), function(T, _arg) {
            var u, v, w;
            u = _arg[0], v = _arg[1];
            if (T.sideOf(u, v, p) === 0) {
              w = T.third(u, v);
              if (w != null) {
                return resolve(doFlips(flip(T, u, v), seq([u, w], [w, v])));
              } else {
                return T;
              }
            } else {
              return resolve(doFlips(T, seq([u, v])));
            }
          });
        }
      };
      return Triangulation;
    })();
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return Sequence.reduce(args, new Triangulation(), function(t, x) {
        return t.plus(x);
      });
    };
  })();
    if (typeof exports !== "undefined" && exports !== null) {
    exports;
  } else {
    exports = (_ref4 = this.pazy) != null ? _ref4 : this.pazy = {};
  };
  exports.Point2d = Point2d;
  exports.Point3d = Point3d;
  exports.circumCircleCenter = circumCircleCenter;
  exports.inclusionInCircumCircle = inclusionInCircumCircle;
  exports.triangulation = triangulation;
  exports.delaunayTriangulation = delaunayTriangulation;
  test = function(n, m) {
    if (n == null) {
      n = 100;
    }
    if (m == null) {
      m = 10;
    }
    return Sequence.range(1, n).each(function(i) {
      var rnd, t;
      console.log("Run " + i);
      rnd = function() {
        return Math.floor(Math.random() * 100);
      };
      t = Sequence.range(1, m).reduce(delaunayTriangulation(), function(s, j) {
        var p;
        p = new Point2d(rnd(), rnd());
        try {
          return s.plus(p);
        } catch (ex) {
          console.log(Sequence.map(s.position__, function(_arg) {
            var k, p;
            k = _arg[0], p = _arg[1];
            return p;
          }).join(', '));
          console.log(p);
          throw ex;
        }
      });
      return Sequence.each(t, function(triangle) {
        var a, b, c, _ref5;
        _ref5 = triangle.vertices(), a = _ref5[0], b = _ref5[1], c = _ref5[2];
        return Sequence.each([[a, b], [b, c], [c, a]], function(_arg) {
          var r, s, u, v, w, x;
          r = _arg[0], s = _arg[1];
          if (r <= s) {
            u = t.position(r);
            v = t.position(s);
            w = t.position(t.third(r, s)) || t.third(r, s);
            x = t.position(t.third(s, r)) || t.third(s, r);
            if (t.mustFlip(r, s)) {
              throw "  Delaunay condition fails for " + u + "," + v + "," + w + "," + x + ")";
            }
          }
        });
      });
    });
  };
  if ((typeof module !== "undefined" && module !== null) && !module.parent) {
    args = (_ref5 = Sequence.map(process.argv.slice(2), parseInt)) != null ? _ref5.into([]) : void 0;
    test.apply(null, args);
  }
}).call(this);

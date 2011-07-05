(function() {
  var HashMap, HashSet, Point2d, Point3d, Sequence, circumCircleCenter, delaunayTriangulation, inclusionInCircumCircle, lift, liftedNormal, recur, resolve, seq, triangulation, unlift, _ref, _ref2, _ref3, _ref4;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  if (typeof require !== 'undefined') {
    require.paths.unshift('#{__dirname}/../lib');
    _ref = require('functional'), recur = _ref.recur, resolve = _ref.resolve;
    Sequence = require('sequence').Sequence;
    _ref2 = require('indexed'), HashSet = _ref2.HashSet, HashMap = _ref2.HashMap;
  } else {
    _ref3 = this.pazy, recur = _ref3.recur, resolve = _ref3.resolve, Sequence = _ref3.Sequence, HashSet = _ref3.HashSet, HashMap = _ref3.HashMap;
  }
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
  seq = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return new Sequence(args);
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
        return this.third__.get(seq(a, b));
      };
      Triangulation.prototype.find = function(a, b, c) {
        if (c != null) {
          return seq(seq(a, b, c), seq(b, c, a), seq(c, a, b)).find(__bind(function(t) {
            return this.triangles__.contains(t);
          }, this));
        } else {
          c = this.third(a, b);
          if (c != null) {
            return this.find(a, b, c);
          }
        }
      };
      Triangulation.prototype.plus = function(a, b, c) {
        if (this.find(a, b, c)) {
          return this;
        } else if (seq(seq(a, b), seq(b, c), seq(c, a)).find(__bind(function(e) {
          return this.third__.get(e) != null;
        }, this))) {
          throw new Error('Orientation mismatch.');
        } else {
          return new Triangulation(this.triangles__.plus(seq(a, b, c)), this.third__.plusAll(seq([seq(a, b), c], [seq(b, c), a], [seq(c, a), b])));
        }
      };
      Triangulation.prototype.minus = function(a, b, c) {
        var t;
        t = this.find(a, b, c);
        if (t != null) {
          return new Triangulation(this.triangles__.minus(t), this.third__.minusAll(seq(seq(a, b), seq(b, c), seq(c, a))));
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
      outer = seq(-1, -2, -3);
      function Triangulation() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.triangulation__ = args[0] || triangulation(outer.into([]));
        this.position__ = args[1] || [];
        this.sites__ = args[2] || new HashSet();
        this.children__ = args[3] || new HashMap();
      }
      Triangulation.prototype.toSeq = function() {
        return Sequence.select(this.triangulation__, function(t) {
          return t.forall(function(n) {
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
        return this.position__[n];
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
        _ref4 = t.into([]), a = _ref4[0], b = _ref4[1], c = _ref4[2];
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
        if ((a < 0 && b < 0) || !(c != null) || !(d != null) || c < 0 || d < 0) {
          return false;
        } else if (a < 0) {
          return this.sideOf(d, c, this.position(b)) > 0;
        } else if (b < 0) {
          return this.sideOf(c, d, this.position(a)) > 0;
        } else {
          _ref4 = seq(a, b, c, d).map(__bind(function(x) {
            return this.position(x);
          }, this)).into([]), pa = _ref4[0], pb = _ref4[1], pc = _ref4[2], pd = _ref4[3];
          return inclusionInCircumCircle(pa, pb, pc, pd) > 0;
        }
      };
      subdivide = function(T, t, p) {
        var a, b, c, n, _ref4;
        _ref4 = t.into([]), a = _ref4[0], b = _ref4[1], c = _ref4[2];
        n = T.position__.length;
        return new T.constructor(T.triangulation__.minus(a, b, c).plus(a, b, n).plus(b, c, n).plus(c, a, n), T.position__.concat([p]), T.sites__.plus(p), T.children__.plus([T.find(a, b, c), seq(seq(a, b, n), seq(b, c, n), seq(c, a, n))]));
      };
      flip = function(T, a, b) {
        var c, children, d;
        c = T.third(a, b);
        d = T.third(b, a);
        children = seq(seq(b, c, d), seq(a, d, c));
        return new T.constructor(T.triangulation__.minus(a, b, c).minus(b, a, d).plus(b, c, d).plus(a, d, c), T.position__, T.sites__, T.children__.plus([T.find(a, b, c), children], [T.find(b, a, d), children]));
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
          _ref4 = t.into([]), a = _ref4[0], b = _ref4[1], c = _ref4[2];
          return seq([a, b], [b, c], [c, a]).reduce(subdivide(this, t, p), function(T, _arg) {
            var u, v, w;
            u = _arg[0], v = _arg[1];
            if (T.sideOf(u, v, p) === 0) {
              w = T.third(u, v);
              return resolve(doFlips(flip(T, u, v), seq([u, w], [w, v])));
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
}).call(this);
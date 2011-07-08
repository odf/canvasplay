(function() {
  var $, Point, Seq, active, canvas, center, circleSpecs, ctx, debounce, delaunay, distance, down, draw, drawCenters, drawCircles, drawEdges, drawSites, drawVoronoi, farPoint, findSite, handlers, limit, moveSite, moved, newSite, nextId, position, seq, siteAt, sites, source, square, throttle, updateMouse;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $ = jQuery;
  Seq = pazy.Sequence;
  sites = new pazy.IntMap();
  delaunay = pazy.delaunayTriangulation();
  center = pazy.circumCircleCenter;
  Point = pazy.Point2d;
  canvas = null;
  ctx = null;
  source = null;
  active = null;
  moved = false;
  down = false;
  seq = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return new Seq(args);
  };
  nextId = (function() {
    var last;
    last = 0;
    return function() {
      return last += 1;
    };
  })();
  square = function(x) {
    return x * x;
  };
  distance = function(_arg, _arg2) {
    var x1, x2, y1, y2;
    x1 = _arg[0], y1 = _arg[1];
    x2 = _arg2[0], y2 = _arg2[1];
    return Math.sqrt(square(x2 - x1) + square(y2 - y1));
  };
  findSite = function(x, y) {
    var _ref;
    return (_ref = Seq.find(sites, function(_arg) {
      var id, p;
      id = _arg[0], p = _arg[1];
      return distance([x, y], p) < 10;
    })) != null ? _ref[0] : void 0;
  };
  newSite = function(x, y) {
    var id;
    id = nextId();
    sites = sites.plus([id, [x, y]]);
    delaunay = delaunay.plus(new Point(x, y));
    return id;
  };
  moveSite = function(pid, x, y) {
    return sites = sites.plus([pid, [x, y]]);
  };
  siteAt = function(x, y) {
    return findSite(x, y) || newSite(x, y);
  };
  circleSpecs = function(triangulation, a, b, c) {
    var s, u, v, w;
    u = triangulation.position(a);
    v = triangulation.position(b);
    w = triangulation.position(c);
    s = center(u, v, w);
    return [s, distance([u.x, u.y], [s.x, s.y])];
  };
  farPoint = function(triangulation, a, b, s) {
    var d, f, u, v;
    u = triangulation.position(a);
    v = triangulation.position(b);
    d = [v.y - u.y, u.x - v.x];
    f = 2000.0 / distance(d, [0, 0]);
    return s.plus((function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(Point, d, function() {}).times(f));
  };
  drawVoronoi = function(context, triangulation) {
    return Seq.each(triangulation, function(triangle) {
      var a, b, c, _ref;
      _ref = triangle.vertices(), a = _ref[0], b = _ref[1], c = _ref[2];
      return seq([a, b], [b, c], [c, a]).each(function(_arg) {
        var r1, r2, s1, s2, t, u, v, w, _ref2, _ref3, _ref4, _ref5;
        u = _arg[0], v = _arg[1];
        if (u < v || triangulation.third(v, u) < 0) {
          t = triangulation.third(u, v);
          w = triangulation.third(v, u);
          if (t >= 0 && w >= 0) {
            _ref2 = circleSpecs(triangulation, t, u, v), s1 = _ref2[0], r1 = _ref2[1];
            _ref3 = circleSpecs(triangulation, w, v, u), s2 = _ref3[0], r2 = _ref3[1];
          } else if (t < 0) {
            _ref4 = circleSpecs(triangulation, w, v, u), s1 = _ref4[0], r1 = _ref4[1];
            s2 = farPoint(triangulation, v, u, s1);
          } else {
            _ref5 = circleSpecs(triangulation, t, u, v), s1 = _ref5[0], r1 = _ref5[1];
            s2 = farPoint(triangulation, u, v, s1);
          }
          context.beginPath();
          context.moveTo(s1.x, s1.y);
          context.lineTo(s2.x, s2.y);
          context.strokeStyle = 'rgb(200, 128, 200)';
          return context.stroke();
        }
      });
    });
  };
  drawCenters = function(context, triangulation) {
    return Seq.each(triangulation, function(t) {
      var r, s, _ref;
      _ref = circleSpecs.apply(null, [triangulation].concat(__slice.call(t.vertices()))), s = _ref[0], r = _ref[1];
      context.beginPath();
      context.arc(s.x, s.y, 3, 0, Math.PI * 2, true);
      context.fillStyle = 'rgb(200, 255, 0)';
      context.fill();
      context.strokeStyle = 'gray';
      return context.stroke();
    });
  };
  drawCircles = function(context, triangulation) {
    return Seq.each(triangulation, function(t) {
      var r, s, _ref;
      _ref = circleSpecs.apply(null, [triangulation].concat(__slice.call(t.vertices()))), s = _ref[0], r = _ref[1];
      context.beginPath();
      context.arc(s.x, s.y, r, 0, Math.PI * 2, true);
      context.strokeStyle = 'rgb(200, 255, 200)';
      return context.stroke();
    });
  };
  drawEdges = function(context, triangulation) {
    return Seq.each(triangulation, function(triangle) {
      var a, b, c, _ref;
      _ref = triangle.vertices(), a = _ref[0], b = _ref[1], c = _ref[2];
      return seq([a, b], [b, c], [c, a]).each(function(_arg) {
        var p, q, u, v;
        u = _arg[0], v = _arg[1];
        if (u < v || triangulation.third(v, u) < 0) {
          p = triangulation.position(u);
          q = triangulation.position(v);
          context.beginPath();
          context.moveTo(p.x, p.y);
          context.lineTo(q.x, q.y);
          context.strokeStyle = 'black';
          return context.stroke();
        }
      });
    });
  };
  drawSites = function(context, coll) {
    return coll.each(function(_arg) {
      var id, x, y, _ref;
      id = _arg[0], _ref = _arg[1], x = _ref[0], y = _ref[1];
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2, true);
      context.fillStyle = id === active ? 'rgb(200,0,0)' : 'rgb(0,0,200)';
      context.fill();
      context.strokeStyle = 'black';
      return context.stroke();
    });
  };
  draw = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawVoronoi(ctx, delaunay);
    drawCenters(ctx, delaunay);
    drawCircles(ctx, delaunay);
    drawEdges(ctx, delaunay);
    return drawSites(ctx, sites);
  };
  position = function(e) {
    return [e.pageX, e.pageY];
  };
  limit = function(func, wait, debounce) {
    var timeout;
    timeout = null;
    return function() {
      var args, throttler;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      throttler = __bind(function() {
        timeout = null;
        return func.apply(this, args);
      }, this);
      if (debounce) {
        clearTimeout(timeout);
      }
      if (debounce || !timeout) {
        return timeout = setTimeout(throttler, wait);
      }
    };
  };
  throttle = function(wait, func) {
    return limit(func, wait, false);
  };
  debounce = function(wait, func) {
    return limit(func, wait, true);
  };
  updateMouse = function(e) {
    var x, y, _ref;
    _ref = position(e), x = _ref[0], y = _ref[1];
    active = findSite(x, y);
    if (down && source) {
      moveSite(source, x, y);
    }
    return [x, y];
  };
  handlers = {
    canvas: {
      mousemove: throttle(50, function(e) {
        updateMouse(e);
        moved = true;
        return draw();
      }),
      mousedown: function(e) {
        var x, y, _ref;
        _ref = updateMouse(e), x = _ref[0], y = _ref[1];
        source = siteAt(x, y);
        down = true;
        moved = false;
        return draw();
      },
      mouseup: function(e) {
        updateMouse(e);
        if (moved) {
          delaunay = Seq.reduce(sites, new pazy.delaunayTriangulation(), function(t, _arg) {
            var id, x, y, _ref;
            id = _arg[0], _ref = _arg[1], x = _ref[0], y = _ref[1];
            return t.plus(new Point(x, y));
          });
        }
        source = null;
        down = moved = false;
        return draw();
      }
    }
  };
  $(document).ready(function() {
    return $('#canvas').each(function() {
      if (this.getContext) {
        canvas = this;
        ctx = this.getContext('2d');
        draw();
        return $(this).bind(handlers.canvas);
      }
    });
  });
}).call(this);

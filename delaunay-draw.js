(function() {
  var $, Point, Seq, active, canvas, ctx, delaunay, dirty, distFromSite, down, draw, findSite, handlers, moveSite, moved, newSite, nextId, position, seq, siteAt, sites, source, square;
  var __slice = Array.prototype.slice;
  $ = jQuery;
  Seq = pazy.Sequence;
  sites = new pazy.IntMap();
  delaunay = pazy.delaunayTriangulation();
  Point = pazy.Point2d;
  canvas = null;
  ctx = null;
  source = null;
  active = null;
  moved = false;
  down = false;
  dirty = false;
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
  distFromSite = function(_arg, _arg2) {
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
      return distFromSite([x, y], p) < 10;
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
  draw = function() {
    if (!dirty) {
      return;
    }
    dirty = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Seq.each(delaunay, function(tri) {
      var a, b, c, _ref;
      _ref = tri.vertices(), a = _ref[0], b = _ref[1], c = _ref[2];
      return seq([a, b], [b, c], [c, a]).each(function(_arg) {
        var p, q, u, v;
        u = _arg[0], v = _arg[1];
        p = delaunay.position(u);
        q = delaunay.position(v);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        return ctx.stroke();
      });
    });
    return sites.each(function(_arg) {
      var id, x, y, _ref;
      id = _arg[0], _ref = _arg[1], x = _ref[0], y = _ref[1];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2, true);
      ctx.strokeStyle = 'black';
      ctx.stroke();
      ctx.fillStyle = id === active ? 'rgb(200,0,0)' : 'rgb(0,0,200)';
      return ctx.fill();
    });
  };
  position = function(e) {
    return [e.pageX, e.pageY];
  };
  handlers = {
    canvas: {
      mousemove: function(e) {
        var x, y, _ref;
        _ref = position(e), x = _ref[0], y = _ref[1];
        moved = dirty = true;
        active = findSite(x, y);
        if (down && source) {
          return moveSite(source, x, y);
        }
      },
      mousedown: function(e) {
        var x, y, _ref;
        _ref = position(e), x = _ref[0], y = _ref[1];
        down = dirty = true;
        source = siteAt(x, y);
        return moved = false;
      },
      mouseup: function(e) {
        var x, y, _ref;
        down = false;
        _ref = position(e), x = _ref[0], y = _ref[1];
        dirty = true;
        source = null;
        return moved = false;
      }
    }
  };
  $(document).ready(function() {
    return $('#canvas').each(function() {
      if (this.getContext) {
        canvas = this;
        ctx = this.getContext('2d');
        setInterval(draw, 100);
        return $(this).bind(handlers.canvas);
      }
    });
  });
}).call(this);

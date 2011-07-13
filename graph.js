(function() {
  var $, active, canvas, cleanupTemporary, connectTemporary, ctx, deleteEdge, deleteEdgeAtTemporary, deleteVertex, dirty, distFromEdge, distFromVertex, dot, down, draw, edges, findEdge, findVertex, handlers, minus, moveVertex, moved, nearestOnEdge, newEdge, newVertex, nextId, onEdge, plus, position, rubberLine, source, square, temporary, times, vertexAt, vertices;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  $ = jQuery;
  vertices = new pazy.IntMap();
  edges = new pazy.IntMap();
  canvas = null;
  ctx = null;
  source = null;
  active = null;
  temporary = null;
  rubberLine = null;
  moved = false;
  down = false;
  dirty = false;
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
  minus = function(_arg, _arg2) {
    var x1, x2, y1, y2;
    x1 = _arg[0], y1 = _arg[1];
    x2 = _arg2[0], y2 = _arg2[1];
    return [x1 - x2, y1 - y2];
  };
  plus = function(_arg, _arg2) {
    var x1, x2, y1, y2;
    x1 = _arg[0], y1 = _arg[1];
    x2 = _arg2[0], y2 = _arg2[1];
    return [x1 + x2, y1 + y2];
  };
  times = function(f, _arg) {
    var x, y;
    x = _arg[0], y = _arg[1];
    return [f * x, f * y];
  };
  dot = function(_arg, _arg2) {
    var x1, x2, y1, y2;
    x1 = _arg[0], y1 = _arg[1];
    x2 = _arg2[0], y2 = _arg2[1];
    return x1 * x2 + y1 * y2;
  };
  distFromVertex = function(_arg, _arg2) {
    var x1, x2, y1, y2;
    x1 = _arg[0], y1 = _arg[1];
    x2 = _arg2[0], y2 = _arg2[1];
    return Math.sqrt(square(x2 - x1) + square(y2 - y1));
  };
  nearestOnEdge = function(p, _arg) {
    var d, f, from, to, v, w;
    from = _arg[0], to = _arg[1];
    v = vertices.get(from);
    w = vertices.get(to);
    d = minus(w, v);
    f = dot(d, minus(p, v)) / dot(d, d);
    if (f < 0) {
      return v;
    } else if (f > 1) {
      return w;
    } else {
      return plus(v, times(f, d));
    }
  };
  distFromEdge = function(p, e) {
    return distFromVertex(p, nearestOnEdge(p, e));
  };
  findVertex = function(x, y) {
    var _ref;
    return (_ref = seq.find(vertices, function(_arg) {
      var id, p;
      id = _arg[0], p = _arg[1];
      return distFromVertex([x, y], p) < 10;
    })) != null ? _ref[0] : void 0;
  };
  findEdge = function(x, y) {
    var _ref;
    return (_ref = seq.find(edges, function(_arg) {
      var e, id;
      id = _arg[0], e = _arg[1];
      return distFromEdge([x, y], e) < 10;
    })) != null ? _ref[0] : void 0;
  };
  newVertex = function(x, y) {
    var id;
    id = nextId();
    vertices = vertices.plus([id, [x, y]]);
    return id;
  };
  newEdge = function(from, to) {
    var id;
    id = nextId();
    edges = edges.plus([id, [from, to]]);
    return id;
  };
  deleteVertex = function(pid) {
    var obsolete;
    obsolete = seq.select(edges, function(_arg) {
      var e, eid;
      eid = _arg[0], e = _arg[1];
      return __indexOf.call(e, pid) >= 0;
    });
    edges = edges.minusAll(obsolete != null ? obsolete.map(function(_arg) {
      var eid, ends;
      eid = _arg[0], ends = _arg[1];
      return eid;
    }) : void 0);
    return vertices = vertices.minus(pid);
  };
  deleteEdge = function(eid) {
    return edges = edges.minus(eid);
  };
  moveVertex = function(pid, x, y) {
    return vertices = vertices.plus([pid, [x, y]]);
  };
  onEdge = function(x, y) {
    var eid;
    if (eid = findEdge(x, y)) {
      return temporary = newVertex.apply(null, nearestOnEdge([x, y], edges.get(eid)));
    }
  };
  cleanupTemporary = function() {
    if (temporary) {
      deleteVertex(temporary);
      if (source === temporary) {
        source = null;
      }
      return temporary = null;
    }
  };
  connectTemporary = function() {
    var eid, from, to, _ref;
    if (temporary) {
      eid = findEdge.apply(null, vertices.get(temporary));
      _ref = edges.get(eid), from = _ref[0], to = _ref[1];
      deleteEdge(eid);
      newEdge(from, temporary);
      newEdge(temporary, to);
      return temporary = null;
    }
  };
  deleteEdgeAtTemporary = function() {
    return deleteEdge(findEdge.apply(null, vertices.get(temporary)));
  };
  vertexAt = function(x, y) {
    return temporary || findVertex(x, y) || onEdge(x, y) || newVertex(x, y);
  };
  draw = function() {
    var tmp, x, y;
    if (!dirty) {
      return;
    }
    dirty = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (rubberLine) {
      ctx.beginPath();
      ctx.moveTo.apply(ctx, rubberLine[0]);
      ctx.lineTo.apply(ctx, rubberLine[1]);
      ctx.strokeStyle = 'rgb(0,0,200)';
      ctx.stroke();
    }
    edges.each(function(_arg) {
      var from, id, to, _ref;
      id = _arg[0], _ref = _arg[1], from = _ref[0], to = _ref[1];
      ctx.beginPath();
      ctx.moveTo.apply(ctx, vertices.get(from));
      ctx.lineTo.apply(ctx, vertices.get(to));
      ctx.strokeStyle = id === active ? 'rgb(200,0,0)' : 'black';
      return ctx.stroke();
    });
    vertices.each(function(_arg) {
      var id, x, y, _ref;
      id = _arg[0], _ref = _arg[1], x = _ref[0], y = _ref[1];
      if (id === temporary) {
        ;
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2, true);
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.fillStyle = id === active ? 'rgb(200,0,0)' : 'rgb(0,0,200)';
        return ctx.fill();
      }
    });
    if (tmp) {
      x = tmp[0], y = tmp[1];
      ctx.fillStyle = 'rgb(200,200,0';
      ctx.fillRect(x - 3, y - 3, 6, 6);
      return tmp = null;
    }
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
        active = findVertex(x, y) || findEdge(x, y);
        if (down) {
          connectTemporary();
          if (rubberLine) {
            return rubberLine[1] = [x, y];
          } else if (source) {
            return moveVertex(source, x, y);
          }
        } else {
          return cleanupTemporary();
        }
      },
      mousedown: function(e) {
        var x, y, _ref;
        _ref = position(e), x = _ref[0], y = _ref[1];
        down = dirty = true;
        if (moved) {
          rubberLine = null;
        }
        source = vertexAt(x, y);
        return moved = false;
      },
      mouseup: function(e) {
        var pos, target, x, y, _ref;
        down = false;
        _ref = position(e), x = _ref[0], y = _ref[1];
        dirty = true;
        if (rubberLine && !moved) {
          if (source) {
            if (source === temporary) {
              deleteEdgeAtTemporary();
            } else {
              deleteVertex(source);
            }
          }
          source = rubberLine = null;
          cleanupTemporary();
        } else if (rubberLine) {
          target = vertexAt(x, y);
          connectTemporary();
          if (source !== target) {
            newEdge(source, target);
          }
          rubberLine = null;
        } else if (source && !moved) {
          pos = vertices.get(source);
          rubberLine = [pos, pos];
        } else {
          source = null;
        }
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

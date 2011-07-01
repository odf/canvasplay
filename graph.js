var Seq      = pazy.Sequence,
    vertices = new pazy.IntMap(),
    edges    = new pazy.HashMap(),
    lastPoint,
    lastLine,
    dragged  = false,
    moved    = false;

alert("NEW RULES: Click makes a vertex, drag moves, two clicks delete, " +
      "click-release-drag makes an edge.");

function find(point) {
  var points = Seq.map(vertices, function(d) {
    return d[1];
  });
  return Seq.find(points, function(d) {
    return (point - d.position).length < 10;
  });
}

function newVertex(position) {
  var p = new Path.Circle(position, 5);
  p.fillColor = 'blue';
  p.strokeColor = 'black';
  vertices = vertices.plus([p.id, p]);
  return p;
}

function deleteVertex(point) {
  var obsolete = Seq.select(edges, function(item) {
    return item[0][0] == point.id || item[0][1] == point.id;
  });
  Seq.each(obsolete, function(item) {
    item[1].remove();
  });
  edges = edges.minusAll(Seq.map(obsolete, function(item) {
    return item[0];
  }));
  point.remove();
}

function moveVertex(point, position) {
  point.position = position;
  Seq.each(edges, function(item) {
    var s = item[0][0], t = item[0][1], e = item[1];
    if (s == point.id) {
      e.firstSegment.point = position;
    } else if (t == point.id) {
      e.lastSegment.point = position;
    }
  });
}

function highlightActiveVertex(position) {
  var point = find(position);
  Seq.each(vertices, function(item) {
    item[1].fillColor = 'blue';
  });
  if (point) {
    point.fillColor = 'red';
  }
}

function onMouseMove(event) {
  moved = true;
  highlightActiveVertex(event.point);
}

function onMouseDown(event) {
  var point = find(event.point);
  if (lastPoint && moved) {
    lastLine = null;
  }
  lastPoint = point || newVertex(event.point);
  dragged = moved = false;
}

function onMouseDrag(event) {
  dragged = true;
  highlightActiveVertex(event.point);
  if (lastLine) {
    lastLine.lastSegment.point = event.point;
  } else if (lastPoint) {
    moveVertex(lastPoint, event.point);
  }
}

function onMouseUp(event) {
  var target;

  if (lastLine && !dragged) {
    deleteVertex(lastPoint);
    lastLine.remove();
    lastPoint = lastLine = null;
  } else if (lastLine) {
    target = find(event.point) || newVertex(event.point);
    if (lastPoint.id != target.id) {
      edges = edges.plus([[lastPoint.id, target.id], lastLine]);
      lastLine.lastSegment.point = target.position;
    } else {
      lastLine.remove();
    }
    lastLine = null;
  } else if (lastPoint && !dragged) {
    lastLine = new Path.Line(lastPoint.position, lastPoint.position);
    lastLine.strokeColor = 'black';
    lastPoint.fillColor = 'yellow';
  } else {
    lastPoint = null;
  }
  dragged = moved = false;
}

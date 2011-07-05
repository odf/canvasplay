$ = jQuery

canvas     = null
ctx        = null
dirty      = false

Seq        = pazy.Sequence
vertices   = new pazy.IntMap()
edges      = new pazy.IntMap()
lastPoint  = null
rubberLine = null
dragged    = false
moved      = false
down       = false
active     = null
nextId     = 1


nextId = do -> last = 0; -> last += 1

dist = (p, q) ->
  dx = q[0] - p[0]
  dy = q[1] - p[1]
  Math.sqrt dx * dx + dy * dy

find = (x, y) -> Seq.find(vertices, ([id, p]) -> dist([x, y], p) < 10)?[0]

newVertex = (x, y) ->
  id = nextId()
  vertices = vertices.plus [id, [x, y]]
  id

deleteVertex = (pid) ->
  obsolete = Seq.select edges, ([eid, [from, to]]) -> from == pid or to == pid
  edges = edges.minusAll obsolete?.map ([eid, ends]) -> eid
  vertices = vertices.minus pid

moveVertex = (pid, x, y) -> vertices = vertices.plus [pid, [x, y]]

highlightActiveVertex = (x, y) -> active = find x, y


draw = ->
  return unless dirty

  dirty = false
  ctx.clearRect 0, 0, canvas.width, canvas.height

  if rubberLine
    [[x1, y1], [x2, y2]] = rubberLine
    ctx.beginPath
    ctx.moveTo x1, y1
    ctx.lineTo x2, y2
    ctx.stroke()

  edges.each ([id, [from, to]]) ->
    [x1, y1] = vertices.get from
    [x2, y2] = vertices.get to
    ctx.beginPath
    ctx.moveTo x1, y1
    ctx.lineTo x2, y2
    ctx.stroke()

  vertices.each ([id, [x, y]]) ->
    ctx.fillStyle = if id == active then 'rgb(200,0,0)' else 'rgb(0,0,200)'
    ctx.beginPath()
    ctx.arc x, y, 5, 0, Math.PI * 2, true
    ctx.stroke()
    ctx.fill()

position = (e) -> [e.pageX, e.pageY]

handlers =
  canvas:
    mousemove: (e) ->
      [x, y] = position e
      highlightActiveVertex x, y
      dirty = true

      if down
        dragged = true
        if rubberLine
          rubberLine[1] = [x, y]
        else if lastPoint
          moveVertex lastPoint, x, y
      else
        moved = true
        highlightActiveVertex x, y

    mousedown: (e) ->
      [x, y] = position e
      down = true
      dirty = true

      rubberLine = null if lastPoint && moved
      lastPoint = find(x, y) or newVertex x, y
      dragged = moved = false

    mouseup: (e) ->
      down = false
      [x, y] = position e
      dirty = true

      if rubberLine? and not dragged
        deleteVertex lastPoint if lastPoint
        lastPoint = rubberLine = null
      else if rubberLine
        target = find(x, y) or newVertex x, y
        if lastPoint != target
          edges = edges.plus [nextId(), [lastPoint, target]]
        rubberLine = null
      else if lastPoint and not dragged
        pos = vertices.get lastPoint
        rubberLine = [pos, pos]
      else
        lastPoint = null
      dragged = moved = false


$(document).ready ->
  $('#canvas').each ->
    if this.getContext
      canvas = this
      ctx = this.getContext '2d'
      setInterval draw, 50

      $(this).bind handlers.canvas

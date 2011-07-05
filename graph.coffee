$ = jQuery

Seq        = pazy.Sequence
vertices   = new pazy.IntMap()
edges      = new pazy.IntMap()

canvas     = null
ctx        = null

source     = null
active     = null
rubberLine = null

moved      = false
down       = false
dirty      = false


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

newEdge = (from, to) ->
  id = nextId()
  edges = edges.plus [id, [from, to]]
  id

deleteVertex = (pid) ->
  obsolete = Seq.select edges, ([eid, [from, to]]) -> from == pid or to == pid
  edges = edges.minusAll obsolete?.map ([eid, ends]) -> eid
  vertices = vertices.minus pid

moveVertex = (pid, x, y) -> vertices = vertices.plus [pid, [x, y]]


draw = ->
  return unless dirty

  dirty = false
  ctx.clearRect 0, 0, canvas.width, canvas.height

  if rubberLine
    ctx.beginPath
    ctx.moveTo rubberLine[0]...
    ctx.lineTo rubberLine[1]...
    ctx.stroke()

  edges.each ([id, [from, to]]) ->
    ctx.beginPath
    ctx.moveTo vertices.get(from)...
    ctx.lineTo vertices.get(to)...
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
      active = find x, y
      moved = dirty = true

      if down
        if rubberLine
          rubberLine[1] = [x, y]
        else if source
          moveVertex source, x, y

    mousedown: (e) ->
      [x, y] = position e
      down = dirty = true

      rubberLine = null if moved
      source = find(x, y) or newVertex x, y
      moved = false

    mouseup: (e) ->
      down = false
      [x, y] = position e
      dirty = true

      if rubberLine? and not moved
        deleteVertex source if source
        source = rubberLine = null
      else if rubberLine
        target = find(x, y) or newVertex x, y
        newEdge source, target if source != target
        rubberLine = null
      else if source and not moved
        pos = vertices.get source
        rubberLine = [pos, pos]
      else
        source = null
      moved = false


$(document).ready ->
  $('#canvas').each ->
    if this.getContext
      canvas = this
      ctx = this.getContext '2d'
      setInterval draw, 100

      $(this).bind handlers.canvas

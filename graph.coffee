$ = jQuery

vertices   = new pazy.IntMap()
edges      = new pazy.IntMap()

canvas     = null
ctx        = null

source     = null
active     = null
temporary  = null
rubberLine = null

moved      = false
down       = false
dirty      = false


nextId = do -> last = 0; -> last += 1

square = (x) -> x * x

minus = ([x1, y1], [x2, y2]) -> [x1-x2, y1-y2]

plus = ([x1, y1], [x2, y2]) -> [x1+x2, y1+y2]

times = (f, [x, y]) -> [f*x, f*y]

dot = ([x1, y1], [x2, y2]) -> x1*x2 + y1*y2

distFromVertex = ([x1, y1], [x2, y2]) ->
  Math.sqrt square(x2 - x1) + square(y2 - y1)

nearestOnEdge = (p, [from, to]) ->
  v = vertices.get from
  w = vertices.get to
  d = minus w, v
  f = dot(d, minus p, v) / dot(d, d)
  if f < 0 then v else if f > 1 then w else plus v, times f, d

distFromEdge = (p, e) -> distFromVertex p, nearestOnEdge p, e


findVertex = (x, y) ->
  seq.find(vertices, ([id, p]) -> distFromVertex([x, y], p) < 10)?[0]

findEdge = (x, y) ->
  seq.find(edges, ([id, e]) -> distFromEdge([x, y], e) < 10)?[0]

newVertex = (x, y) ->
  id = nextId()
  vertices = vertices.plus [id, [x, y]]
  id

newEdge = (from, to) ->
  id = nextId()
  edges = edges.plus [id, [from, to]]
  id

deleteVertex = (pid) ->
  obsolete = seq.select edges, ([eid, e]) -> pid in e
  edges = edges.minusAll obsolete?.map ([eid, ends]) -> eid
  vertices = vertices.minus pid

deleteEdge = (eid) -> edges = edges.minus eid

moveVertex = (pid, x, y) -> vertices = vertices.plus [pid, [x, y]]

onEdge = (x, y) ->
  if eid = findEdge x, y
    temporary = newVertex nearestOnEdge([x, y], edges.get(eid))...

cleanupTemporary = ->
  if temporary
    deleteVertex temporary
    source = null if source == temporary
    temporary = null

connectTemporary = ->
  if temporary
    eid = findEdge vertices.get(temporary)...
    [from, to] = edges.get eid
    deleteEdge eid
    newEdge from, temporary
    newEdge temporary, to
    temporary = null

deleteEdgeAtTemporary = -> deleteEdge findEdge vertices.get(temporary)...

vertexAt = (x, y) ->
  temporary or findVertex(x, y) or onEdge(x, y) or newVertex(x, y)


draw = ->
  return unless dirty

  dirty = false
  ctx.clearRect 0, 0, canvas.width, canvas.height

  if rubberLine
    ctx.beginPath()
    ctx.moveTo rubberLine[0]...
    ctx.lineTo rubberLine[1]...
    ctx.strokeStyle = 'rgb(0,0,200)'
    ctx.stroke()

  edges.each ([id, [from, to]]) ->
    ctx.beginPath()
    ctx.moveTo vertices.get(from)...
    ctx.lineTo vertices.get(to)...
    ctx.strokeStyle = if id == active then 'rgb(200,0,0)' else 'black'
    ctx.stroke()

  vertices.each ([id, [x, y]]) ->
    if id == temporary
      #ctx.fillStyle = 'rgb(200,200,0)'
      #ctx.fillRect x-4, y-4, 8, 8
    else
      ctx.beginPath()
      ctx.arc x, y, 5, 0, Math.PI * 2, true
      ctx.strokeStyle = 'black'
      ctx.stroke()
      ctx.fillStyle = if id == active then 'rgb(200,0,0)' else 'rgb(0,0,200)'
      ctx.fill()

  if tmp
    [x, y] = tmp
    ctx.fillStyle = 'rgb(200,200,0'
    ctx.fillRect x-3, y-3, 6, 6
    tmp = null

position = (e) -> [e.pageX, e.pageY]

handlers =
  canvas:
    mousemove: (e) ->
      [x, y] = position e
      moved = dirty = true
      active = findVertex(x, y) or findEdge(x, y)

      if down
        connectTemporary()
        if rubberLine
          rubberLine[1] = [x, y]
        else if source
          moveVertex source, x, y
      else
        cleanupTemporary()

    mousedown: (e) ->
      [x, y] = position e
      down = dirty = true

      rubberLine = null if moved
      source = vertexAt x, y
      moved = false

    mouseup: (e) ->
      down = false
      [x, y] = position e
      dirty = true

      if rubberLine and not moved
        if source
          if source == temporary
            deleteEdgeAtTemporary()
          else
            deleteVertex source
        source = rubberLine = null
        cleanupTemporary()
      else if rubberLine
        target = vertexAt x, y
        connectTemporary()
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

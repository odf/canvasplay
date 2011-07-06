$ = jQuery

Seq      = pazy.Sequence
sites    = new  pazy.IntMap()
delaunay = pazy.delaunayTriangulation()
Point    = pazy.Point2d

canvas   = null
ctx      = null

source     = null
active     = null

moved      = false
down       = false
dirty      = false


seq = (args...) -> new Seq args

nextId = do -> last = 0; -> last += 1

square = (x) -> x * x

distFromSite = ([x1, y1], [x2, y2]) ->
  Math.sqrt square(x2 - x1) + square(y2 - y1)

findSite = (x, y) ->
  Seq.find(sites, ([id, p]) -> distFromSite([x, y], p) < 10)?[0]

newSite = (x, y) ->
  id = nextId()
  sites = sites.plus [id, [x, y]]
  delaunay = delaunay.plus new Point x, y
  id

moveSite = (pid, x, y) -> sites = sites.plus [pid, [x, y]]

siteAt = (x, y) -> findSite(x, y) or newSite(x, y)


draw = ->
  return unless dirty

  dirty = false
  ctx.clearRect 0, 0, canvas.width, canvas.height

  Seq.each delaunay, (tri) ->
    [a, b, c] = tri.vertices()
    seq([a, b], [b, c], [c, a]).each ([u, v]) ->
      p = delaunay.position u
      q = delaunay.position v
      ctx.beginPath()
      ctx.moveTo p.x, p.y
      ctx.lineTo q.x, q.y
      ctx.stroke()

  sites.each ([id, [x, y]]) ->
    ctx.beginPath()
    ctx.arc x, y, 5, 0, Math.PI * 2, true
    ctx.strokeStyle = 'black'
    ctx.stroke()
    ctx.fillStyle = if id == active then 'rgb(200,0,0)' else 'rgb(0,0,200)'
    ctx.fill()


position = (e) -> [e.pageX, e.pageY]

handlers =
  canvas:
    mousemove: (e) ->
      [x, y] = position e
      moved = dirty = true
      active = findSite(x, y)

      if down and source
        moveSite source, x, y

    mousedown: (e) ->
      [x, y] = position e
      down = dirty = true

      source = siteAt x, y
      moved = false

    mouseup: (e) ->
      down = false
      [x, y] = position e
      dirty = true

      source = null
      moved = false


$(document).ready ->
  $('#canvas').each ->
    if this.getContext
      canvas = this
      ctx = this.getContext '2d'
      setInterval draw, 100

      $(this).bind handlers.canvas

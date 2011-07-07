$ = jQuery

Seq      = pazy.Sequence
sites    = new  pazy.IntMap()
delaunay = pazy.delaunayTriangulation()
center   = pazy.circumCircleCenter
Point    = pazy.Point2d

canvas   = null
ctx      = null

source     = null
active     = null

moved      = false
down       = false


seq = (args...) -> new Seq args

nextId = do -> last = 0; -> last += 1

square = (x) -> x * x

distance = ([x1, y1], [x2, y2]) -> Math.sqrt square(x2 - x1) + square(y2 - y1)

findSite = (x, y) ->
  Seq.find(sites, ([id, p]) -> distance([x, y], p) < 10)?[0]

newSite = (x, y) ->
  id = nextId()
  sites = sites.plus [id, [x, y]]
  delaunay = delaunay.plus new Point x, y
  id

moveSite = (pid, x, y) -> sites = sites.plus [pid, [x, y]]

siteAt = (x, y) -> findSite(x, y) or newSite(x, y)

circleSpecs = (triangulation, a, b, c) ->
  u = triangulation.position a
  v = triangulation.position b
  w = triangulation.position c
  s = center u, v, w
  [s, distance [u.x, u.y], [s.x, s.y]]

drawVoronoi = (context, triangulation) ->
  Seq.each triangulation, (triangle) ->
    [a, b, c] = triangle.vertices()
    seq([a, b], [b, c], [c, a]).each ([u, v]) ->
      if u < v or triangulation.third(v, u) < 0
        t = triangulation.third u, v
        w = triangulation.third v, u
        if t >= 0 and w >= 0
          [s1, r1] = circleSpecs triangulation, t, u, v
          [s2, r2] = circleSpecs triangulation, w, v, u
          context.beginPath()
          context.moveTo s1.x, s1.y
          context.lineTo s2.x, s2.y
          context.strokeStyle = 'rgb(228, 200, 228)'
          context.stroke()

drawCenters = (context, triangulation) ->
  Seq.each triangulation, (t) ->
    [s, r] = circleSpecs triangulation, t.vertices()...
    context.beginPath()
    context.arc s.x, s.y, 5, 0, Math.PI * 2, true
    context.fillStyle = 'rgb(255, 255, 0)'
    context.fill()
    context.strokeStyle = 'rgb(200, 255, 200)'
    context.stroke()

drawCircles = (context, triangulation) ->
  Seq.each triangulation, (t) ->
    [s, r] = circleSpecs triangulation, t.vertices()...
    context.beginPath()
    context.arc s.x, s.y, r, 0, Math.PI * 2, true
    context.strokeStyle = 'rgb(200, 255, 200)'
    context.stroke()

drawEdges = (context, triangulation) ->
  Seq.each triangulation, (triangle) ->
    [a, b, c] = triangle.vertices()
    seq([a, b], [b, c], [c, a]).each ([u, v]) ->
      if u < v or triangulation.third(v, u) < 0
        p = triangulation.position u
        q = triangulation.position v
        context.beginPath()
        context.moveTo p.x, p.y
        context.lineTo q.x, q.y
        context.strokeStyle = 'black'
        context.stroke()

drawSites = (context, coll) ->
  coll.each ([id, [x, y]]) ->
    context.beginPath()
    context.arc x, y, 5, 0, Math.PI * 2, true
    context.fillStyle = if id == active then 'rgb(200,0,0)' else 'rgb(0,0,200)'
    context.fill()
    context.strokeStyle = 'black'
    context.stroke()

draw = ->
  ctx.clearRect 0, 0, canvas.width, canvas.height
  drawVoronoi ctx, delaunay
  drawCenters ctx, delaunay
  drawCircles ctx, delaunay
  drawEdges   ctx, delaunay
  drawSites   ctx, sites


position = (e) -> [e.pageX, e.pageY]

# The functions `limit`, `throttle` and `debounce` were taken from
# Jeremy Ashkenas' Underscore.js
limit = (func, wait, debounce) ->
  timeout = null
  (args...) ->
    throttler = =>
      timeout = null
      func.apply this, args

    clearTimeout timeout if debounce
    timeout = setTimeout throttler, wait if debounce or not timeout

throttle = (wait, func) -> limit func, wait, false
debounce = (wait, func) -> limit func, wait, true

updateMouse = (e) ->
  [x, y] = position e
  active = findSite(x, y)
  #moveSite source, x, y if down and source
  [x, y]

handlers =
  canvas:
    mousemove: throttle(50, (e) ->
      updateMouse e
      moved = true
      draw()
    )

    mousedown: (e) ->
      [x, y] = updateMouse e
      source = siteAt x, y
      down = true
      moved = false
      draw()

    mouseup: (e) ->
      updateMouse e
      source = null
      down = moved = false
      draw()


$(document).ready ->
  $('#canvas').each ->
    if this.getContext
      canvas = this
      ctx = this.getContext '2d'
      draw()

      $(this).bind handlers.canvas

$ = jQuery

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


nextId = do -> last = 0; -> last += 1

square = (x) -> x * x

distance = ([x1, y1], [x2, y2]) -> Math.sqrt square(x2 - x1) + square(y2 - y1)

findSite = (x, y) -> seq.find(sites, ([id, p]) -> distance([x, y], p) < 10)?[0]

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

farPoint = (triangulation, a, b, s) ->
  u = triangulation.position a
  v = triangulation.position b
  d = [v.y - u.y, u.x - v.x]
  f = 2000.0 / distance d, [0, 0]
  s.plus new Point(d...).times f

drawVoronoi = (context, triangulation) ->
  seq.each triangulation, (triangle) ->
    [a, b, c] = triangle.vertices()
    seq.each [[a, b], [b, c], [c, a]], ([u, v]) ->
      if u < v or triangulation.third(v, u) < 0
        t = triangulation.third u, v
        w = triangulation.third v, u
        if t >= 0 and w >= 0
          [s1, r1] = circleSpecs triangulation, t, u, v
          [s2, r2] = circleSpecs triangulation, w, v, u
        else if t < 0
          [s1, r1] = circleSpecs triangulation, w, v, u
          s2 = farPoint triangulation, v, u, s1
        else
          [s1, r1] = circleSpecs triangulation, t, u, v
          s2 = farPoint triangulation, u, v, s1

        context.beginPath()
        context.moveTo s1.x, s1.y
        context.lineTo s2.x, s2.y
        context.strokeStyle = 'rgb(200, 128, 200)'
        context.stroke()

drawCenters = (context, triangulation) ->
  seq.each triangulation, (t) ->
    [s, r] = circleSpecs triangulation, t.vertices()...
    context.beginPath()
    context.arc s.x, s.y, 3, 0, Math.PI * 2, true
    context.fillStyle = 'rgb(200, 255, 0)'
    context.fill()
    context.strokeStyle = 'gray'
    context.stroke()

drawCircles = (context, triangulation) ->
  seq.each triangulation, (t) ->
    [s, r] = circleSpecs triangulation, t.vertices()...
    context.beginPath()
    context.arc s.x, s.y, r, 0, Math.PI * 2, true
    context.strokeStyle = 'rgb(200, 255, 200)'
    context.stroke()

drawEdges = (context, triangulation) ->
  seq.each triangulation, (triangle) ->
    [a, b, c] = triangle.vertices()
    seq.each [[a, b], [b, c], [c, a]], ([u, v]) ->
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
  moveSite source, x, y if down and source
  $('#position').text "#{x}, #{y}"
  [x, y]

handlers =
  canvas:
    mousemove: throttle(20, (e) ->
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
      if moved
        empty = new pazy.delaunayTriangulation()
        delaunay = seq(sites).map(([id, [x, y]]) -> new Point x, y).into empty
      source = null
      down = moved = false
      draw()


$(document).ready ->
  initial = [
    # [70, 80]
    # [ 6, 91]
    # [91, 92]
    # [33,  5]
    # [67,  3]
    # [32, 11]
    # [ 5, 83]
    # [65, 37]
    # [33,  2]
    # [ 5, 49]
    # [66, 31]
    # [62, 34]
    # [93, 98]
    # [73, 10]
    # [28, 66]
    # [39, 54]
    # [97, 87]
    # [19,  5]
  ]
  $('#canvas').each ->
    if this.getContext
      canvas = this
      ctx = this.getContext '2d'
      i = 0
      if initial.length > 0
        $(this).mousedown =>
          if i >= initial.length
            sites = new pazy.IntMap()
            delaunay = new pazy.delaunayTriangulation()
            draw()
            $(this).unbind 'mousedown'
            $(this).bind handlers.canvas
          else
            siteAt initial[i].map((x) -> x * 8)...
            i += 1
            draw()
      else
        $(this).bind handlers.canvas

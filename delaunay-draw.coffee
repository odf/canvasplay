$ = jQuery

{ IntMap, delaunayTriangulation, seq } = pazy

sites    = new IntMap()
delaunay = delaunayTriangulation()

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
  delaunay = delaunay.plus x, y
  id

moveSite = (pid, x, y) -> sites = sites.plus [pid, [x, y]]

siteAt = (x, y) -> findSite(x, y) or newSite(x, y)

farPoint = (u, v, s) ->
  d = [v.y - u.y, u.x - v.x]
  f = 2000.0 / distance d, [0, 0]
  s.plus new s.constructor(d...).times f

drawVoronoi = (context, triangulation) ->
  seq.each triangulation, (triangle) ->
    [a, b, c] = triangle.vertices()
    seq.each [[a, b], [b, c], [c, a]], ([u, v]) ->
      if u.toString() < v.toString() or triangulation.third(v, u).isInfinite()
        t = triangulation.third u, v
        w = triangulation.third v, u
        if not (t.isInfinite() or w.isInfinite())
          s1 = triangulation.triangle(u, v).circumCircleCenter()
          s2 = triangulation.triangle(v, u).circumCircleCenter()
        else if t.isInfinite()
          s1 = triangulation.triangle(v, u).circumCircleCenter()
          s2 = farPoint v, u, s1
        else
          s1 = triangulation.triangle(u, v).circumCircleCenter()
          s2 = farPoint u, v, s1

        context.beginPath()
        context.moveTo s1.x, s1.y
        context.lineTo s2.x, s2.y
        context.strokeStyle = 'rgb(200, 128, 200)'
        context.stroke()

drawCenters = (context, triangulation) ->
  seq.each triangulation, (t) ->
    s = t.circumCircleCenter()
    context.beginPath()
    context.arc s.x, s.y, 3, 0, Math.PI * 2, true
    context.fillStyle = 'rgb(200, 255, 0)'
    context.fill()
    context.strokeStyle = 'gray'
    context.stroke()

drawCircles = (context, triangulation) ->
  seq.each triangulation, (t) ->
    s = t.circumCircleCenter()
    r = t.circumCircleRadius()
    context.beginPath()
    context.arc s.x, s.y, r, 0, Math.PI * 2, true
    context.strokeStyle = 'rgb(200, 255, 200)'
    context.stroke()

drawEdges = (context, triangulation) ->
  seq.each triangulation, (triangle) ->
    [a, b, c] = triangle.vertices()
    seq.each [[a, b], [b, c], [c, a]], ([u, v]) ->
      if u.toString() < v.toString() or triangulation.third(v, u).isInfinite()
        context.beginPath()
        context.moveTo u.x, u.y
        context.lineTo v.x, v.y
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
        delaunay = seq.reduce sites, delaunayTriangulation(),
          (s, [id, [x, y]]) -> s.plus x, y
        #delaunay = seq(sites).map(([id, p]) -> p).into empty
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
            sites = new IntMap()
            delaunay = delaunayTriangulation()
            draw()
            $(this).unbind 'mousedown'
            $(this).bind handlers.canvas
          else
            siteAt initial[i].map((x) -> x * 8)...
            i += 1
            draw()
      else
        $(this).bind handlers.canvas

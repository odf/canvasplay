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
  ctx.clearRect 0, 0, canvas.width, canvas.height

  Seq.each delaunay, (tri) ->
    [a, b, c] = tri.vertices()
    seq([a, b], [b, c], [c, a]).each ([u, v]) ->
      if u < v or delaunay.third(v, u) < 0
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

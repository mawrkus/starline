<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Visualize the timeline of the stars given to any GitHub repository.">
    <title>💫 Starline - {{ repo.uri }}</title>
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <style>
      .area {
        fill: steelblue;
      }
      .bar {
        fill: steelblue;
        clip-path: url(#clip);
      }
      .zoom {
        cursor: move;
        fill: none;
        pointer-events: all;
      }
      .page-header {
        padding: 0;
        margin: 0;
        position: relative;
      }
      small {
        margin-left: 20px;
      }
      ul {
        list-style-type: square;
      }
      .page-header .back {
        font-size: 12px;
        position: absolute;
        top: 18px;
        right: 16px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="page-header">
        <h1>
          💫 <a href="{{ repo.url }}" target="_blank" title="View GitHub page">{{ repo.uri }}</a>
          <br /><small>{{ repo.description }}</small>
        </h1>
        <ul>
          <li>📅&nbsp;&nbsp;<strong>{{ repo.created }}</strong> --&gt; <strong>{{ repo.updated }}</strong> (last update)</li>
          <li>⭐&nbsp;&nbsp;<strong>{{ repo.stars.count }}</strong> stars.</li>
        </ul>
        <a href="/" class="back" title="Back home">&lt; back</a>
      </div>
      <svg width="1140" height="600"></svg>
    </div>
    <script src="/js/d3.v4.min.js"></script>
    <script>
    var svg = d3.select("svg"),
        margin = {top: 20, right: 20, bottom: 110, left: 40},
        margin2 = {top: 530, right: 20, bottom: 30, left: 40},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        height2 = +svg.attr("height") - margin2.top - margin2.bottom;

    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]);

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x(d.date); })
        .y0(height)
        .y1(function(d) { return y(d.stars); });

    var area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x2(d.date); })
        .y0(height2)
        .y1(function(d) { return y2(d.stars); });

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    var parseDate = d3.timeParse("%Y-%m-%d");

    function brushed() {
      var s = d3.event.selection || x2.range();
      x.domain(s.map(x2.invert, x2));
      focus.select(".area").attr("d", area);
      focus.select(".axis--x").call(xAxis);
      focus.selectAll(".bar")
        .attr("x", function(d) { return x(d.date); });
    }

    d3.csv("/data/{{ repo.dataFile }}", function(d) {
      d.date = parseDate(d.date);
      d.stars = +d.stars;
      return d;
    }, function(error, data) {
      if (error) throw error;

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.stars; })]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      focus.selectAll(".bar")
        .data(data)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d.date); })
          .attr("y", function(d) { return y(d.stars); })
          .attr("width", width / data.length)
          .attr("height", function(d) { return height - y(d.stars); });

      focus.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      focus.append("g")
          .attr("class", "axis axis--y")
          .call(yAxis);

    /* context.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area2); */

      context.selectAll(".bar")
        .data(data)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d.date); })
          .attr("y", function(d) { return y2(d.stars); })
          .attr("width", width / data.length)
          .attr("height", function(d) { return height2 - y2(d.stars); });

      context.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height2 + ")")
          .call(xAxis2);

      context.append("g")
          .attr("class", "brush")
          .call(brush)
          .call(brush.move, x.range());
    });
    </script>
  </body>
</html>

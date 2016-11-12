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
      .axis--x path {
        display: none;
      }
      .line {
        fill: none;
        stroke: steelblue;
        stroke-width: 1.5px;
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
          <li>Creation: <strong>{{ repo.created }}</strong></li>
          <li>Last update: <strong>{{ repo.updated }}</strong></li>
          <li><strong>{{ repo.stars.count }}</strong> stars</li>
        </ul>
        <a href="/" class="back" title="Back home">&lt; back</a>
      </div>
      <svg width="1140" height="600"></svg>
    </div>
    <script src="/js/d3.v4.min.js"></script>
    <script>
    var svg = d3.select("svg"),
        margin = {top: 20, right: 20, bottom: 20, left: 50},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var parseTime = d3.timeParse("%Y-%m-%d");

    var x = d3.scaleTime()
        .rangeRound([0, width]);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.stars); });

    d3.tsv("/data/{{ repo.tsvFile }}", function(d) {
      d.date = parseTime(d.date);
      d.stars = +d.stars;
      return d;
    }, function(error, data) {
      if (error) throw error;

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain(d3.extent(data, function(d) { return d.stars; }));

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));

      g.append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(y))
        .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .style("text-anchor", "end")
          .text("# of stars");

      g.append("path")
          .datum(data)
          .attr("class", "line")
          .attr("d", line);
    });
    </script>
  </body>
</html>

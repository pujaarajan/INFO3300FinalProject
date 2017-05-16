/**
 * scrollVis encapsulates all the code for using reusable charts pattern.
 * source: http://bost.ocks.org/mike/chart/
 */
var scrollVis = function() {
  // dimension of the vis area
  var width = 600;
  var height = 520;
  var margin = {top: 0, left: 20, bottom: 40, right: 10};

  // to keep track of which vis to render
  var lastIndex = -1;
  var activeIndex = 0;

  // main svg container
  var svg = null;

  // d3.selection used for displaying vis
  var g = null;

  // set the domain for when data are processed
  var x = d3.scaleTime()
    .rangeRound([0, width]);

  var y = d3.scaleLinear()
    .rangeRound([height, 0]);

  var xAxisTime = d3.axisBottom()
  .scale(x);

  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];

  // If a section has an update function
  var updateFunctions = [];

  /**
   * This function draws the visualization in specified selection.
   * @param selection - current d3.selection()
   */
  var chart = function(selection) {
    selection.each(function(rawData) {
      // create an svg; set width and height
      svg = d3.select(this).selectAll('svg').data([stockData]);
      var svgE = svg.enter().append('svg');
      // combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr('width', width + margin.left + margin.right);
      svg.attr('height', height + margin.top + margin.bottom);

      svg.append('g');

      // this group element will be used to contain all
      // other elements.
      g = svg.select('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // perform some preprocessing on raw data
      var stockData = getStock(rawData);

      // set the line chart's time domain
      x.domain(d3.extent(stockData, function(d) { return d.date; }));

      // set the line chart's price domain
      y.domain(d3.extent(stockData, function(d) { return d.close; }));

      //if other data, add serializabilly
      setupVis(stockData);

      setupSections();
    });
  };

  /**
   * Creates initial elements for all sections of the visualization.
   * @param stockData - data object for daily closing price.
   */
  var setupVis = function(stockData) {
    // axis
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxisTime);
    g.select('.x.axis').style('opacity', 0);

    // title
    g.append('text')
      .attr('class', 'title openvis-title')
      .attr('x', width / 2)
      .attr('y', height / 3)
      .text('2016');

    g.append('text')
      .attr('class', 'sub-title openvis-title')
      .attr('x', width / 2)
      .attr('y', (height / 3) + (height / 5))
      .text('Apple Product Releases');

    g.selectAll('.openvis-title')
      .attr('opacity', 0);

    // set up line chart
    var line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });

    // var lines = g.append('path').data(stockData);
    // var linesE = lines.selectAll('.bar').enter().attr('class', 'bar');
    // lines = lines.merge(linesE)
    //   .attr('fill', 'none')
    //   .attr("stroke", "steelblue")
    //   .attr("stroke-linejoin", "round")
    //   .attr("stroke-linecap", "round")
    //   .attr("stroke-width", 1.5)
    //   .attr("d", line)
    //   .attr('opacity', 0);
    var lines = g.append('path')
      .datum(stockData)
      .attr('class', 'bar')
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .attr('opacity', 0);
  }

  /**
   * Each section is activated by a separate function.
   */
  var setupSections = function() {
    activateFunctions[0] = showTitle;
    activateFunctions[1] = showLine;

    // update function area if any
  }

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function showTitle() {
    g.selectAll('.count-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.openvis-title')
      .transition()
      .duration(600)
      .attr('opacity', 1.0);

    hideAxis();
  }

  function showLine() {
    showAxis(xAxisTime);
    g.selectAll('.openvis-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.bar')
      .transition()
      .duration(600)
      .attr('opacity', 1);
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisHist or xAxisBar)
   */
  function showAxis(axis) {
    g.select('.x.axis')
      .call(axis)
      .transition().duration(500)
      .style('opacity', 1);
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis() {
    g.select('.x.axis')
      .transition().duration(500)
      .style('opacity', 0);
  }

  /**
   * Maps raw data to array of data objects.
   * @param rawData - data read in from file
   */
  function getStock(rawData) {
    var parseTime = d3.timeParse("%m/%d/%y");
    return rawData.map(function(d) {
      d.date = parseTime(d.date);
      d.close = +d.close;
      return d;
    });
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function (index) {
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  // return chart function
  return chart;
};

/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(data) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  d3.select('#vis')
    .datum(data)
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function (index) {
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });

    // activate current section
    plot.activate(index);
  });
}

// load data and display
d3.csv('data.csv', display);

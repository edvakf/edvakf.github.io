let currentPage = 0;
let hostCities = null;
let mapFeatures = null;

const medalsCountByYear = {};

function changePage(page) {
    currentPage = page;

    const year = hostCities[page].Year;
    const city = hostCities[page].City;

    d3.select('#current-year')
        .text(year + " (" + city + ")");

    const logScale = d3.scaleLog()
        .domain([1, 156])
    const colorScaleLog = d3.scaleSequential(
        (d) => d3.interpolateReds(logScale(d))
    )   

    // The svg
    const svg = d3.select("svg#map"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
        
    // Map and projection
    const projection = d3.geoNaturalEarth1()
        .scale(width / 1.3 / Math.PI)
        .translate([width / 2, height / 2])

    svg.selectAll("*").remove();

    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(mapFeatures)
        .join("path")
            // .attr("fill", "#69b3a2")
            .attr("d", d3.geoPath().projection(projection))
            .style("stroke", "#000")
            .style("stroke-width", "0.5")
            .attr("fill", function (d) {
                const count = medalsCountByYear[year] ? (medalsCountByYear[year][d.id] || 0) : 0;
                // console.log(count);
                return colorScaleLog(count+1);
            })        
            .on("mouseover", function(event, datum) {
                // console.log(datum);
                document.querySelector('#country-name').textContent = datum.properties.name;
                showHist(datum.id);
            })

}


function showHist(code) {
    const data = [];
    let maxcount = 0;
    for (let year in medalsCountByYear) {
        count = medalsCountByYear[year][code] || 0;
        data.push({year: year, medalcount: count});
        maxcount = Math.max(maxcount, count);
    }
    console.log(data);

    var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 1000 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

    const svg = d3.select('svg#hist');
    svg.selectAll("*").remove();

    svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis
    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(data.map(function(d) { return d.year; }))
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
  
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, maxcount])
        .range([ height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
            .attr("x", function(d) { return x(d.year); })
            .attr("y", function(d) { return y(d.medalcount); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d.medalcount); })
            .attr("fill", "#69b3a2")

}

document.addEventListener('DOMContentLoaded', async () => {

    // The "Select Year" Button
    hostCities = await d3.csv("./host-cities.csv");
    // console.log(hostCities);
    d3.select('#dropdown1')
        .selectAll('li')
        .data(hostCities)
        .enter()
            .append('li')
            .html(({Year, City}) => {return "<a href=#>" + Year + " (" + City + ")</a>"})
            .on('click', (ev, {Year, City}) => {
                // console.log(ev, d);
                const page = hostCities.findIndex(d => d.Year == Year);
                changePage(page);
            });
    
    var elems = document.querySelectorAll('.dropdown-trigger');
    var instances = M.Dropdown.init(elems);        
 
    // The "Next" Button
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems);

    d3.select('#next-button')
        .on('click', (a) => {
            const nextPage = currentPage + 1;
            if (nextPage < hostCities.length) {
                changePage(nextPage);
            }
        });


    const csv = await d3.csv("./medals-count-by-year.csv");
    // console.log(csv);

    csv.forEach(d => {
        const {Year, NOC, medalcount} = d;
        if (medalsCountByYear[Year] == null) medalsCountByYear[Year] = {};
        medalsCountByYear[Year][NOC] = +medalcount;
    });
    // console.log(medalsCountByYear);

    const geojson = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
    // console.log(geojson.features.map(d => [d.id, d.properties.name].join("\t") ).join("\n"));
   
    mapFeatures = geojson.features;

    changePage(currentPage);
});

//when filter is clicked, submit a query to flask
const filterButton = d3.select('body').select('#filter-button');
filterButton.on("click", function(d) {
    runQuery();
});

//collect the field values and run the query
function runQuery(){
    const values = fieldCollection();
    const query = buildQuery(values);
    console.log(query);
    d3.json(`http://localhost:5000/api/${query}`).then(data => buildPage(data))
};

//collect the selected filter values from the page
function fieldCollection(){
let timeValue = "0";
    try{
        timeValue = d3.select('input[name="time"]:checked').property("value");
    }
    catch(err) {};
    const minAge = d3.select('#minAge').property("value");
    const numPlayers = d3.select('#numPlayers').property("value");
    const values = {'Time' : timeValue,
                    'Age' : minAge,
                    'Players' : numPlayers};
    return(values)
};

//construct the query string from the field values
function buildQuery(values){
    let query = ''
    if (!(values.Time === "0")){
        query = `gameTime=${values.Time}&playerAge=${values.Age}&numPlayers=${values.Players}`;
    }
    else {
        query = `playerAge=${values.Age}&numPlayers=${values.Players}`;
    }
    return(query)
}

//build the page structure and the swiper slides
function buildPage(data) {
    
    const mySwiper = new Swiper('.swiper-container', {
        grabCursor: true,
        centeredSlides: true,
        spaceBetween: 45,
        slidesPerView: 'auto',
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
      });
      const placeholder = "static/images/no-box-art.jpg"
      const slides = d3.select('.swiper-wrapper').selectAll('.swiper-slide').data(data);
      slides
      .enter()
        .append('div')
        .merge(slides)
        .classed('swiper-slide', true)
        .html(d => `<img src="${d.thumbnail ? d.thumbnail : placeholder}" style="height:400px;display: block;margin-left:auto;margin-right:auto"/>`)
      slides.exit().remove();

    mySwiper.update();

    updateCharts(data[0]);
    blurb(data[0]);
    mySwiper.on('slideChange', function () {
        updateCharts(data[mySwiper.activeIndex]);
        blurb(data[mySwiper.activeIndex]);
    });
}

//update all the charts
function updateCharts(game) {

    d3.select('.langchart').html('<h2>Language Dependency</h2>');
    d3.select('.agechart').html('<h2>Recommended Age</h2>');
    d3.select('.ctchart').html('<h2>Suggested Player Count</h2>');
    

    if (game.language_dependency !== 'NO DATA') {  langChart(game) }
    else {d3.select('.langchart')
            .append('div')
            .attr('id', 'language_poll')
            .html("<h4>NO DATA</h4>")};

    if (game.suggested_player_ct !== 'NO DATA') { playCtChart(game) }
    else {d3.select('.ctchart')
            .append('div')
            .attr('id', 'count_poll')
            .html("<h4>NO DATA</h4>")};

    if (game.suggested_player_age !== 'NO DATA') { ageChart(game) }
    else {d3.select('.agechart')
            .append('div')
            .attr('id', 'age_poll')
            .html("<br><h4>NO DATA</h4>")};
}

function blurb(game) {

    d3.select('.blurb').html('')

    blurbKeys = [{name:'Game Name', key:'gameName'},
                 {name:'Year Published', key:'yearPublished'},
                 {name:'Info', key:'description'},
                 {name:'Max Players', key:'maxPlayers'},
                 {name:'Min. Game Time', key:'minTime'},
                 {name:'GameBoardGeek Rank', key:'ranking'}]

    const blurbItems = d3.select('.blurb')
    .append('ul').selectAll('li').data(blurbKeys);

    blurbItems.enter()
    .append('li')
    .text(d => {
        if (d.key == 'description') {return `${d.name}: ${game[d.key].slice(0,256) + '...'}`}
        else if (d.key == 'minTime') { return `${d.key}: ${game[d.key]} minutes`}
        else {return `${d.name}: ${game[d.key]}`}
    });    
}

//build the language dependency chart
function langChart(game) {
    //append svg area for language chart
    const svg = d3.select('.langchart')
    .append('div')
        .attr('id', 'language_poll')
        .append('svg')
            .attr('id', 'lang_svg');
    //define margins
    const margin = ({top: 30, right: 0, bottom: 10, left: 90});

    //get vote totals into a list
    const votes = []
    for (let [key, value] of Object.entries(game.language_dependency)){
        if (key === "No") {key = "None"};
        if (key === "Unplayable") {key = "Fluency Required"};
        votes.push({"name" : key, "value" : value})
    };
    votes.sort((a,b) => {
        return a.name.length - b.name.length
    });

    //set chart dimensions
    const width = 200;
    const height = votes.length * 25 + margin.top + margin.bottom

    x = d3.scaleLinear()
        .domain([0, d3.max(votes, v => v.value)])
        .range([margin.left, width - margin.right]);

    y = d3.scaleBand()
        .domain(d3.range(votes.length))
        .range([margin.top, height - margin.bottom])
        .padding(0.1);

    xAxis = g => g
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(width / 80));

    yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(i => votes[i].name).tickSizeOuter(0))

    svg.append("g")
        .attr("fill", "#3f3a60")
        .selectAll("rect")
        .data(votes)
            .join("rect")
                .attr("x", x(0))
                .attr("y", (v, i) => y(i))
                .attr("width", v => x(v.value) - x(0))
                .attr("height", y.bandwidth());

    svg.append("g")
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .style("font", "12px sans-serif")
        .selectAll("text")
            .data(votes)
            .join("text")
                .attr("x", v => x(v.value) + 7*(v.value.toString().length))
                .attr("y", (v, i) => y(i) + y.bandwidth() / 2)
                .attr("dy", "0.35em")
                .text(v => (v.value === 0) ? '' : (parseInt(v.value)));

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);
}

//build the recommended player count chart
function playCtChart(game) {
    //append svg area for player count chart
    const svg = d3.select('.ctchart')
    .append('div')
        .attr('id', 'playCt_poll')
        .append('svg')
            .attr('id', 'playCt_svg');
    //define margins
    const margin = ({top: 30, right: 0, bottom: 10, left: 30});

    //get vote totals into a list
    const votes = []
    for (let [key, value] of Object.entries(game.suggested_player_ct)){
        let total = 0;
        for (let [type, votes] of Object.entries(value)){
            if(type === 'Best'){total += votes*2};
            if(type === 'Recommended'){total += votes};
            if(type === 'Not Recommended'){total -= votes};
        }
        if (key.includes("+")){
            key = ">" + key.split("+")[0];
        }
        votes.push({"name" : key, "value" : total})
    };
    votes.sort((a,b) => {
        return a.name.length - b.name.length
    });

    //set chart dimensions
    const width = 200;
    const height = votes.length * 25 + margin.top + margin.bottom

    x = d3.scaleLinear()
        .domain([0, d3.max(votes, v => v.value)])
        .range([margin.left, width - margin.right]);

    y = d3.scaleBand()
        .domain(d3.range(votes.length))
        .range([margin.top, height - margin.bottom])
        .padding(0.1);

    xAxis = g => g
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(width / 80));

    yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(i => votes[i].name).tickSizeOuter(0))

    svg.append("g")
        .attr("fill", "#3f3a60")
        .selectAll("rect")
        .data(votes)
            .join("rect")
                .attr("x", x(0))
                .attr("y", (v, i) => y(i))
                .attr("width", v => (v.value > 0) ? x(v.value) - x(0) : 0)
                .attr("height", y.bandwidth());

    svg.append("g")
        .attr("text-anchor", "end")
        .style("font", "12px sans-serif")
        .selectAll("text")
            .data(votes)
            .join("text")
                .attr("x", v => (v.value > 0) ? x(v.value) + 7*(v.value.toString().length) : margin.left + 7*(v.value.toString().length))
                .attr("y", (v, i) => y(i) + y.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("fill", v => (v.value < 0) ? "red" : "black")
                .text(v => (v.value === 0) ? '' : (parseInt(v.value)));

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);
}

//build the recommended age chart
function ageChart(game) {
    //append svg area for age chart
    const svg = d3.select('.agechart')
    .append('div')
        .attr('id', 'age_poll')
        .append('svg')
            .attr('id', 'age_svg')
            .attr('height', 350);
    //define margins
    const margin = ({top: 30, right: 0, bottom: 10, left: 30});

    //get vote totals into a list
    const votes = []
    for (let [key, value] of Object.entries(game.suggested_player_age)){
        if(key === '21 and up'){key = '21+'};
        votes.push({"name" : key, "value" : value})
    };
    votes.sort();

    //set chart dimensions
    const width = 200;
    const height = votes.length * 25 + margin.top + margin.bottom

    x = d3.scaleLinear()
        .domain([0, d3.max(votes, v => v.value)])
        .range([margin.left, width - margin.right]);

    y = d3.scaleBand()
        .domain(d3.range(votes.length))
        .range([margin.top, height - margin.bottom])
        .padding(0.1);

    xAxis = g => g
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x).ticks(width / 80));

    yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(i => votes[i].name).tickSizeOuter(0))

    svg.append("g")
        .attr("fill", "#3f3a60")
        .selectAll("rect")
        .data(votes)
            .join("rect")
                .attr("x", x(0))
                .attr("y", (v, i) => y(i))
                .attr("width", v => x(v.value) - x(0))
                .attr("height", y.bandwidth());

    svg.append("g")
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .style("font", "12px sans-serif")
        .selectAll("text")
            .data(votes)
            .join("text")
                .attr("x", v => x(v.value) + 7*(v.value.toString().length))
                .attr("y", (v, i) => y(i) + y.bandwidth() / 2)
                .attr("dy", "0.35em")
                .text(v => (v.value === 0) ? '' : (parseInt(v.value)));

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);
}

//for initial page load, load the top 10 ranked games
d3.json(`http://localhost:5000/api/INITIAL_LOAD`).then(data => {
        console.log(data);
        buildPage(data);
    });
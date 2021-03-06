//when filter is clicked, submit a query to flask
const filterButton = d3.select('body').select('#filter-button');
filterButton.on("click", function(d) {
    runQuery();
});

//collect the field values and run the query
function runQuery(){
    const values = fieldCollection();
    const query = buildQuery(values);
    d3.json(`/api/${query}`).then(data => buildPage(data))
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
        .html(d => `<img src="${d.thumbnail ? d.thumbnail : placeholder}" class="swiper-slide-pic"/>`)
      slides.exit().remove();

    mySwiper.update();

    updateCharts(data[0]);
    blurb(data[0]);
    mySwiper.on('slideChange', function () {
        const data = d3.select('.swiper-wrapper').selectAll('.swiper-slide').data();
        updateCharts(data[mySwiper.realIndex]);
        blurb(data[mySwiper.realIndex])});
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
            .html("<h4>NO DATA</h4>")};

}

function blurb(game) {

    d3.select('.blurb').html('');
    
    const name = game['gameName'],
    year = game['yearPublished'],
    //this is a lot of shenanigans to not cut off in the middle of a word
    infolength = 344,
    info = game['description'].slice(0,infolength).split(' ')
        .slice(0,game['description'].slice(0,infolength).split(' ').length-1)
        .join(' ').split('.')
        // .slice(0,game['description'].slice(0,infolength).split('.').length-1)
        // .join('.')
        +'...',
    minct = game['minPlayers'],
    maxct = game['maxPlayers'],
    mintime = game['minTime'],
    maxtime = game['maxTime'],
    ranking = game['ranking'] === 999999 ? 'Unranked' : game['ranking'],
    rating = game['user_rating'];

    //add a row containing title and published year
    const topRow = d3.select('.blurb').append('div')
        .attr('class', 'row');
            
    topRow.append('div')
            .attr('class', 'col-md-6 top')
                .html(`<h2>Title:</h2> ${name}`);
    topRow.append('div')
            .attr('class', 'col-md-6 top')
                .html(`<h2>Published in:</h2> ${year}<br>&nbsp;`);

    //add the description
    d3.select('.blurb').append('div')
        .attr('class', 'row')
            .append('div')
                .attr('class', 'col-md-12 info')
                    .text(`${info}`);

    //add a row containing advertised player count and game time
    const thirdRow = d3.select('.blurb').append('div')
        .attr('class', 'row');

    thirdRow.append('div')
            .attr('class', 'col-md-6 third')
                .html(`<h2>Player Count:</h2> ${minct} - ${maxct}`);

    thirdRow.append('div')
            .attr('class', 'col-md-6 third')
                .html(function() {
                    if (mintime === maxtime) {return `<h2>Est. Time:</h2> ${mintime} min.`}
                    else { return `<h2>Est. Time:</h2> ${mintime} - ${maxtime} min.` }
                });

    //add final row containing ranking and rating info
    const lastRow = d3.select('.blurb').append('div')
        .attr('class', 'row');

    lastRow.append('div')
            .attr('class', 'col-md-6 last')
                .append('svg')
                    .attr('width', '80%')
                    .attr('height', '80%')
                    .attr('viewBox', '0 0 100 100')
                        .html(`<circle cx="50%" cy="50%" r="50%" fill="#8a4b94"></circle>
                                <text x="50%" y="35%" font-family="sans-serif" font-size="14px" text-anchor="middle" fill="black">BGG
                                Ranking</text>
                                <text x="50%" y="57%" font-family="sans-serif" font-size="20px" text-anchor="middle" fill='white'>${ranking}</text>`);
    
                
    lastRow.append('div')
            .attr('class', 'col-md-6 last')
                .append('svg')
                    .attr('width', '80%')
                    .attr('height', '80%')
                    .attr('viewBox', '0 0 100 100')
                        .html(`<circle cx="50%" cy="50%" r="50%" fill="#8a4b94"></circle>
                                <text x="50%" y="35%" font-family="sans-serif" font-size="14px" text-anchor="middle" fill="black">User Rating</text>`)
                            .append('text')
                                .attr('x', '50%')
                                .attr('y', '57%')
                                .attr('font-size', '20px')
                                .attr('text-anchor', 'middle')
                                .attr('fill', function () {
                                    if (rating > 8) { return 'darkgreen' }
                                    else if (rating > 6){ return 'yellow'}
                                    else { return 'red' };
                                })
                                .text(rating.toFixed(2));
                                

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
d3.json(`/api/INITIAL_LOAD`).then(data => {
        buildPage(data);
    });
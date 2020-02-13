// d3.json('http://localhost:5000/api/numPlayers=7').then(data => {
//     // console.log(data);
//     for(let i = 0; i < data.length; i++){
//         console.log(data[i].minAge)
//     }
// });

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
    d3.json(`http://localhost:5000/api/${query}`).then(data => {
        console.log(data);
        buildPage(data);
    })
};

function fieldCollection(){
let timeValue = "0";
    try{
        timeValue = d3.select('input[name="time"]:checked').property("value");
    }
    catch(err) {};
    const minAge = d3.select('#minAge').property("value");
    const numPlayers = d3.select('#numPlayers').property("value");
    let rating = d3.select("#rating").property("value");
    if (!rating) {rating = "0"};
    const values = {'Time' : timeValue,
                    'Age' : minAge,
                    'Players' : numPlayers,
                    'Rating' : rating};
    return(values)
};

function buildQuery(values){
    console.log(values);
    let query = ''
    if (!(values.Time === "0")){
        query = `gameTime=${values.Time}&playerAge=${values.Age}&numPlayers=${values.Players}&rating=${values.Rating}`;
    }
    else {
        query = `playerAge=${values.Age}&numPlayers=${values.Players}&rating=${values.Rating}`;
    }
    return(query)
}

function buildPage(data) {
    // d3.select('#main').text(data[0].gameName)
    
    const mySwiper = new Swiper('.swiper-container', {
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        pagination: {
            el: '.swiper-pagination',
          },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
      });
    mySwiper.removeAllSlides();
    for (let i = 0; i < 10; i++) {
        mySwiper.appendSlide(`<div class="swiper-slide" style="background-image:url(${data[i].thumbnail})">${data[i].gameName}</div>`);
    }
    mySwiper.update();
    // TODO: pass updateCharts which slide swiper is on
    updateCharts(data[0]);
}

function updateCharts(game) {

    d3.select('.charts').html('')
    if (game.language_dependency !== 'NO DATA'){ langChart(game) };
    if (game.suggested_player_ct !== 'NO DATA'){ playCtChart(game) };
    if (game.suggested_player_age !== 'NO DATA'){ ageChart(game) };
    
}

function langChart(game) {
    //append svg area for language chart
    const svg = d3.select('.charts')
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
        .attr("fill", "steelblue")
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
                .text(v => (v.value === 0) ? '' : x.tickFormat(10)(v.value));

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);
}

function playCtChart(game) {
    //append svg area for language chart
    const svg = d3.select('.charts')
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
        .attr("fill", "steelblue")
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
                .text(v => (v.value === 0) ? '' : x.tickFormat(20)(v.value));

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);
}

function ageChart(game) {
    //append svg area for age chart
    const svg = d3.select('.charts')
    .append('div')
        .attr('id', 'age_poll')
        .append('svg')
            .attr('id', 'age_svg')
            .attr('height', 600);
    //define margins
    const margin = ({top: 30, right: 0, bottom: 10, left: 30});

    //get vote totals into a list
    const votes = []
    for (let [key, value] of Object.entries(game.suggested_player_age)){
        if(key === '21 and up'){key = '21+'};
        votes.push({"name" : key, "value" : value})
    };
    votes.sort();
    console.log(votes);

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
        .attr("fill", "steelblue")
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
                .text(v => (v.value === 0) ? '' : x.tickFormat(10)(v.value));

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);
}
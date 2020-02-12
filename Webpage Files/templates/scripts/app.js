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
    d3.select('#main').text(data[0].gameName)

    const mySwiper = new Swiper('.swiper-container')
    mySwiper.removeAllSlides();
    for (let i = 0; i < 10; i++) {
        mySwiper.appendSlide(`<div class="swiper-slide">${data[i].gameName}</div>`);
    }
    mySwiper.update();
}
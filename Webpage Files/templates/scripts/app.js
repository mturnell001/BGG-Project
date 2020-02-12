d3.json('http://localhost:5000/api/numPlayers=7').then(data => {
    // console.log(data);
    for(let i = 0; i < data.length; i++){
        console.log(data[i].minAge)
    }
});

console.log('hi');
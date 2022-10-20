// data for drivers is obtained from Ergast API: "http://ergast.com/mrd/"

// creates a new line graph chart by taking the title, data and labels as parameters
// specifies the way the chart is displayed from 'options' property
function drawChart(xlabels, ydata, title, xAxisLabel)
{
    var ctx = document.getElementById('constructorChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: 
        {
            labels: xlabels,
            datasets: [{
                label: title,
                data: ydata,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            plugins:{
                tooltip:{
                    callbacks:{
                        beforeTitle: function(TooltipItem){
                            return xAxisLabel + ': ';
                        },
                        label: function(TooltipItem){
                            return 'Constructor Standings Position: ' + TooltipItem.raw;
                        }
                    }
                }
            },
            responsive: true,
            aspectRatio: 2.2,
            scales: {
                y: {
                    min: 1,
                    suggestedMax: Math.max(ydata),
                    stepSize: 1,
                    reverse: true,
                    precision: 0,
                    title: {
                        display: true,
                        text: 'Constructor Standings Position'
                    }
                },
                x: {
                    title: {
                        display: true, 
                        text: xAxisLabel
                    }
                }
            }
        }
    });
}

// checks if the constructor had participated in the selected year and alerts the user if not.
async function checkValidYear(constrcutorName, year)
{
    var url = `https://ergast.com/api/f1/constructors/${constrcutorName}/constructorStandings.json?limit=100&offset=0`;
    var response = await fetch(url);
    var result = await response.json();

    const numSeasons = result["MRData"]["total"];

    console.log(result);

    for(let i = 0; i < numSeasons; i++)
    {
        var season = result["MRData"]["StandingsTable"]["StandingsLists"][i]["season"];
        if (season === year)
        {
            return null;
        }
    }
    alert("Constructor has not participated in selected season. Please choose a different year.");
}

// obtains the constructor standings position of the selected driver after each round of the selected season
async function getStandingsPerRace(constructorName, year)
{
    await checkValidYear(constructorName, year);
    var url = `https://ergast.com/api/f1/${year}.json`;
    var response = await fetch(url);
    var result = await response.json();
    const numRaces = parseInt(result["MRData"]["total"]);

    url = `https://ergast.com/api/f1/${year}/1/constructorStandings.json?limit=100&offset=0`;
    response = await fetch(url);
    result = await response.json();
    const numConstructors = result["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"]["length"];
    var raceNumber = [];
    var position = [];

    for(let i = 1; i <= numRaces; i++)
    {
        url = `https://ergast.com/api/f1/${year}/${i}/constructorStandings.json?limit=100&offset=0`;
        response = await fetch(url);
        result = await response.json();
        raceNumber[i-1] = i;
        for(let j = 0; j < numConstructors; j++)
        {
            var constructorId = result["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"][j]["Constructor"]["constructorId"];
            var name = result["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"][j]["Constructor"]["name"];
            if(constructorId === constructorName || name === constructorName)
            {
                position[i-1] = parseInt(result["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"][j]["position"]);
            }
        }
    }

    const title = `${year} Constructor Standings of ${constructorName}`;
    await drawChart(raceNumber, position, title, "Round");
}

// obtains constructor standings positions over the career of selected constructor
async function getOverallStandingsData(constructorName)
{
    const url = `https://ergast.com/api/f1/constructors/${constructorName}/constructorStandings.json?limit=100&offset=0`;
    const response = await fetch (url);
    const result = await response.json();
    const numResults = parseInt(result["MRData"]["StandingsTable"]["StandingsLists"]["length"]);
    const standingsTable = result["MRData"]["StandingsTable"]["StandingsLists"];

    const seasonArray = [];
    const seasonPosition = [];
    for (let i = 0; i < numResults; i++)
    {
        seasonArray[i] = standingsTable[i]["season"];
        seasonPosition[i] = parseInt(standingsTable[i]["ConstructorStandings"][0]["position"]);
    }
    const title = `Seasonal Constructor Standings of ${constructorName}`;
    await drawChart(seasonArray, seasonPosition, title, "Season");
}

// check if constructor name entered is valid and exists
async function checkConstructorName(constructorName)
{
    const url = `https://ergast.com/api/f1/constructors/${constructorName}.json`;
    const response = await fetch (url);
    const result = await response.json();

    const numResult = result["MRData"]["ConstructorTable"]["Constructors"]["length"];
    if(numResult > 0)
    {
        const constructorURL = result["MRData"]["ConstructorTable"]["Constructors"][0]["url"];

        await submitDriverURL(constructorURL).catch(error => {console.log("Server not running. Cannot retrieve image.");});
        const year = document.getElementById("season_year").value;

        if(year === '0')
        {
            getOverallStandingsData(constructorName);
        }
        else
        {
            getStandingsPerRace(constructorName, year);
        }
    }
    else
    {
        alert("Constructor not found or does not exist.");
    }
}

// sends the wikipedia page of the constructor to the server which retrieves the url of the image on the wiki page
// then assigns the source of the image element to that url
async function submitDriverURL(url)
{
    const response = await fetch('http://localhost:3000/images', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body:  JSON.stringify({url})
    });
    const imageURL = await response.text();
    document.getElementById("constructor_image").src = imageURL;
}

// resets the line graph chart if it has not already been made
// gets the constructor name from the text box and checks if it is a valid input
function obtainConstructorName() 
{
    
    let chartStatus = Chart.getChart("constructorChart"); 
    if (chartStatus != undefined) 
    {
        chartStatus.destroy();
    }
    var chart = document.getElementById('constructorChart');

    chart.style.width = "934";
    chart.style.height = "466";
    chart.style.margin = "0";
    

    var name = document.getElementById("constructor").value;
    const nameArray = name.split(" ");
    if(name == "")
    {
        alert("Invalid Input. Please enter a name.");
    }
    else if(nameArray.length > 2)
    {
        alert("Please enter constructor and sponsor seperated by '-'. E.g. 'Lotus-Ford'")
    }
    else
    {
        let constructorName = name.replace(" ","_");
        checkConstructorName(constructorName);
    }
}


document.getElementById("my_button").addEventListener("click", obtainConstructorName);
var input = document.getElementById("constructor");

// emulate the action of clicking the button when the user presses a key on the keyboard
input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("my_button").click();
    }
  });
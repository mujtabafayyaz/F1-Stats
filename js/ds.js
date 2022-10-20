// data for drivers is obtained from Ergast API: "http://ergast.com/mrd/"

// creates a new line graph chart by taking the title, data and labels as parameters
// specifies the way the chart is displayed from 'options' property
function drawChart(xlabels, ydata, title, xAxisLabel)
{
    var ctx = document.getElementById('driverChart').getContext('2d');
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
                            return 'Driver Standings Position: ' + TooltipItem.raw;
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
                        text: 'Drivers Standings Position'
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

// checks if the driver had participated in the selected year and alerts the user if not.
async function checkValidYear(url, year)
{
    const standingsURL = url.replace(".json","/driverStandings.json");
    response = await fetch(standingsURL);
    result = await response.json();
    numSeasons = result["MRData"]["StandingsTable"]["StandingsLists"]["length"];
    for(let i = 0; i < numSeasons; i++)
    {
        var season = result["MRData"]["StandingsTable"]["StandingsLists"][i]["season"];
        if (season === year)
        {
            return null;
        }
    }
    alert("Driver has not participated in selected season. Please choose a different year.");
}

// obtains the driver standings position of the selected driver after each round of the selected season
async function getStandingsPerRace(standingsURL, year, firstName, lastName)
{
    await checkValidYear(standingsURL, year);
    var url = `https://ergast.com/api/f1/${year}.json`;
    var response = await fetch(url);
    var result = await response.json();
    const numRaces = parseInt(result["MRData"]["total"]);

    url = `https://ergast.com/api/f1/${year}/1/driverStandings.json`;
    response = await fetch(url);
    result = await response.json();
    const numDrivers = result["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]["length"];
    var raceNumber = [];
    var position = [];

    for(let i = 1; i <= numRaces; i++)
    {
        url = `https://ergast.com/api/f1/${year}/${i}/driverStandings.json`;
        response = await fetch(url);
        result = await response.json();
        raceNumber[i-1] = i;
        for(let j = 0; j < numDrivers; j++)
        {
            var familyName = result["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"][j]["Driver"]["familyName"];
            var givenName = result["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"][j]["Driver"]["givenName"];
            if(familyName === lastName && givenName === firstName)
            {
                position[i-1] = parseInt(result["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"][j]["position"]);
            }
        }
    }
    const title = `${year} Driver Standings of ${firstName} ${lastName}`;
    await drawChart(raceNumber, position, title, "Round");
}

// obtains driver standings positions over the career of selected driver
async function getOverallStandingsData(url, firstName, lastName)
{
    const standingsURL = url.replace(".json","/driverStandings.json");
    const response = await fetch (standingsURL);
    const result = await response.json();
    const numResults = parseInt(result["MRData"]["StandingsTable"]["StandingsLists"]["length"]);
    const standingsTable = result["MRData"]["StandingsTable"]["StandingsLists"];

    const seasonArray = [];
    const seasonPosition = [];
    for (let i = 0; i < numResults; i++)
    {
        seasonArray[i] = standingsTable[i]["season"];
        seasonPosition[i] = parseInt(standingsTable[i]["DriverStandings"][0]["position"]);
    }
    const title = `Seasonal Driver Standings of ${firstName} ${lastName}`;
    await drawChart(seasonArray, seasonPosition, title, "Season");
}

// check if driver name entered is valid and exists
async function checkDriverName(include, firstName, lastName)
{
    if(include)
    {
        var url = `https://ergast.com/api/f1/drivers/${firstName}_${lastName}.json`;
    }
    else 
    {
        url = `https://ergast.com/api/f1/drivers/${lastName}.json`;
    }
    const response = await fetch (url);
    const result = await response.json();
    var numResults = result["MRData"]["DriverTable"]["Drivers"]["length"];
    if (numResults === 0 && include)
    {
        checkDriverName(false, firstName, lastName);
    }
    else if(numResults === 0 && !include)
    {
        alert("Driver does not exist");
    }
    else
    {
        var year = document.getElementById("season_year").value;
        var driverURL = result["MRData"]["DriverTable"]["Drivers"][0]["url"];
    
        await submitDriverURL(driverURL).catch(error => {console.log("Server not running. Cannot retrieve image.");});
        
        if(year === '0')
        {
            getOverallStandingsData(url, firstName, lastName);
        }
        else
        {
            getStandingsPerRace(url, year, firstName, lastName);
        }
    }
}

// sends the wikipedia page of the driver to the server which retrieves the url of the image on the wiki page
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
    document.getElementById("driver_image").src = imageURL;
}

// resets the line graph chart if it has not already been made
// gets the driver name from the text box and checks if it is a valid input
function obtainDriverName() 
{
    
    let chartStatus = Chart.getChart("driverChart"); 
    if (chartStatus != undefined) 
    {
        chartStatus.destroy();
    }
    var chart = document.getElementById('driverChart');

    chart.style.width = "934";
    chart.style.height = "466";
    chart.style.margin = "0";
    

    var name = document.getElementById("driver").value;
    const nameArray = name.split(" ");
    if(nameArray.length <= 1)
    {
        alert("Please enter the full name of the driver.");
    }
    else
    {
        let firstName = nameArray[0];
        let lastName = nameArray[nameArray.length - 1];
        checkDriverName(true, firstName, lastName);
    }
}

document.getElementById("my_button").addEventListener("click", obtainDriverName);
var input = document.getElementById("driver");

// emulate the action of clicking the button when the user presses a key on the keyboard
input.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("my_button").click();
  }
});
const world = "https://pomber.github.io/covid19/timeseries.json"
const states = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv"
const counties = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"


let data = {}

async function load() {
    const title = document.querySelector("#title")
    let start = Date.now()
    let [worldData, stateData, countyData] = await Promise.all(
        [ƒ(world, "json"),
        ƒ(states, "csv"),
        ƒ(counties, "csv")]
    )
    stateData = stateParse(stateData)
    // console.log(worldData, stateData, countyData)
    data.world = worldData
    data.state = stateData
    data.countyData = countyData
    title.innerHTML = `loaded in ${Math.floor((Date.now() - start) / 10) / 100} seconds`
}

load().then(
    console.log("hallo")
)

async function ƒ(url, type) {
    let res = await fetch(url)
    if (type == "json") {
        return await res.json()
    } else if (type == "csv") {
        return await res.text()
    }
}

function stateParse(data) {
    data = data.split(/\n/).slice(1)
    let ret = {}
    data.forEach(e => {
        e = e.split(/,/)
        let [date, state, fips, cases, deaths] = e
        if (typeof ret[state] != "object")
            ret[state] = []
        ret[state].push({
            date,
            cases,
            deaths
        })
    })
    return ret
}

Chart.defaults.global.defaultFontColor = "#ccc"

const stateInput = document.querySelector("#state_input")

let statesSelected = []
function addState() {
    let state = stateInput.value
    if (data.state[state] == null) {
        alert(`${state} is not a state`)
    } else if (statesSelected.indexOf(state) == -1) {
        statesSelected.push(state)
    }
    renderCharts()
}

function renderCharts() {
    renderChart('cases', 'cases', false)
    renderChart('deaths', 'deaths', false)
}

function renderChart(id, type, log) {
    let state = stateInput.value
    let size = data.state['Washington'].length
    aChart(id, {
        type: 'line',
        data: {
            labels: data.state["Washington"].map(e => {
                return e.date
            }),
            datasets: getDatasets(statesSelected, type, size, log)
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title: {
                text: `Coronavirus ${type} (${log ? "Logarithmic" : "Linear"} scale)`,
                display: true,
                fontSize: 24
            }
        }
    })
}

function getDatasets(states, prop, size, log) {
    console.log(states)
    let i = 0
    return states.map(state => {
        i++
        return getDataset(state, i * 360 / states.length, prop, size, log)
    })
}

function getDataset(state, hue, prop, size, log) {
    let theseData = []
    for (let i = size - data.state[state].length; i > 0; i--) {
        theseData.push(0)
    }
    theseData.push(...data.state[state].map(e => {
        if (log) {
            return Math.log(e[prop])
        }
        return e[prop]
    }))
    return {
        label: `${state}`,
        data: theseData,
        backgroundColor: `hsla(${hue}, 100%, 69%, 0.2)`,
        borderColor: `hsla(${hue}, 100%, 69%, 1)`,
        borderWidth: 1
    }
}

function aChart(id, data) {
    let ctx = document.getElementById(id).getContext('2d');
    let myChart = new Chart(ctx, data);
}

stateInput.value = "California"

function hash(str) {
    var hash = 0;
    if (str.length == 0) {
        return hash;
    }
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
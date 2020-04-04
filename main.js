const world = "https://pomber.github.io/covid19/timeseries.json"
const states = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv"
const counties = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"

let data = {}
let allCharts = {}
let State = {
    log: false,
    states: []
}
load().then(() => {
    intialize()
})

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

let statesSelected = ["California"]

function intialize() {
    MakeChart('cases', 'cases')
    MakeChart('deaths', 'deaths')
}

function MakeChart(id, type) {
    let ctx = document.getElementById(id).getContext('2d');
    allCharts[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.state["Washington"].map(e => {
                return e.date
            }),
            datasets: []
        },
        options: {
            responsive: true,
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Month'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                }]
            },

            title: {
                text: `Coronavirus ${type} (${State.log ? "Logarithmic" : "Linear"} scale)`,
                display: true,
                fontSize: 24
            }
        }
    });
}

function addState() {
    let stateInput = document.querySelector("#state_input")
    let newState = stateInput.value
    if (data.state[newState] == null) {
        alert(`${newState} is not a state`)
    } else if (State.states.indexOf(newState) == -1) {
        State.states.push(newState)
        updateData()
    }
    stateInput.value = ''
}

function updateData() {
    let size = data.state['Washington'].length
    for (prop in allCharts) {
        let chart = allCharts[prop]
        console.log(chart)
        chart.options.title.text = `Coronavirus ${prop} (${State.log ? "Logarithmic" : "Linear"} scale)`
        chart.data.datasets = []
        chart.data.datasets = State.states.map((state, index) => {
            let theseData = []
            for (let i = size - data.state[state].length; i > 0; i--) {
                theseData.push(0)
            }
            theseData.push(...data.state[state].map(e => {
                e[prop] = parseInt(e[prop])
                if (State.log) {
                    return Math.log(e[prop])
                }
                return e[prop]
            }))
            let hue = index * 360 / State.states.length
            return {
                label: state,
                data: theseData,
                backgroundColor: `hsla(${hue}, 100%, 69%, 0.2)`,
                borderColor: `hsla(${hue}, 100%, 69%, 1)`,
            }
        })
        chart.update()
    }
}

function toggleLog() {
    State.log = !State.log
    updateData()
}
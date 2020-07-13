const world = "https://pomber.github.io/covid19/timeseries.json"
const states = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv"
const counties = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"

let data = {}
let allCharts = {}
let allNames = {}
let State = {
    log: false,
    states: [],
    prop: false,
    average: false,
}
load().then(() => {
    intialize()
})

let statePopulations;

let zoom = {
    pan: {
        enabled: true,
        mode: 'x'
    },
    zoom: {
        enabled: true,
        mode: 'x'
    }
}

async function load() {
    const title = document.querySelector("#title")
    let start = Date.now()
    let [worldData, stateData, countyData, statePop] = await Promise.all(
        [ƒ(world, "json"),
        ƒ(states, "csv"),
        ƒ(counties, "csv"),
        ƒ('https://thetazero.github.io/coronizer/populations.json', 'json')]
    )
    console.log(statePop)
    statePopulations = statePop
    stateData = stateParse(stateData)
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
    MakeChart('deaths-increase', 'deaths-increase', 'daily deaths')
    MakeChart('cases-increase', 'cases-increase', 'daily cases')
}

function MakeChart(id, type, name) {
    if (!name) {
        name = type
    }
    let ctx = document.getElementById(id).getContext('2d');
    allNames[id] = name
    allCharts[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.state["Washington"].map(e => {
                return e.date
            }),
            datasets: []
        },
        options: {
            plugins: {
                zoom: zoom
            },
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
                text: `Coronavirus ${name} (${State.log ? "Logarithmic" : "Linear"} scale${State.prop ? ' & proportional' : ''})`,
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
        let name = allNames[prop]
        chart.options.title.text = `Coronavirus ${name} (${State.log ? "Logarithmic" : "Linear"} scale${State.prop ? ' & proportional' : ''}${State.average ? ' & average of 5' : ''})`
        chart.data.datasets = State.states.map((state, index) => {
            let theseData = []
            for (let i = size - data.state[state].length; i > 0; i--) {
                theseData.push(0)
            }
            theseData.push(...data.state[state].map((e, i, arr) => {
                if (prop.includes('increase')) {
                    if (State.average && i < 5) {
                        return 0
                    }
                    if (State.average) {
                        if (prop == 'deaths-increase') {
                            return (parseInt(e.deaths) - parseInt(arr[i - 5].deaths)) / 5
                        } else if (prop == 'cases-increase') {
                            return (parseInt(e.deaths) - parseInt(arr[i - 5].cases)) / 5
                        }
                    }
                }
                let ret = 0
                if (prop == 'deaths-increase') {
                    if (i > 0) {
                        ret = parseInt(e.deaths) - parseInt(arr[i - 1].deaths)
                    }
                } else if (prop == 'cases-increase') {
                    if (i > 0) {
                        ret = parseInt(e.cases) - parseInt(arr[i - 1].cases)
                    }
                } else {
                    ret = parseInt(e[prop])
                }
                if (State.prop) {
                    ret /= statePopulations[state]
                }
                if (State.log && ret > 0) {
                    ret = Math.log(ret)
                }
                return ret
            }))
            let hue = index * 360 / State.states.length + 40
            return {
                label: state,
                data: theseData.slice(State.average ? 5 : 0),
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

function toggleProp() {
    State.prop = !State.prop
    updateData()
}

function toggle5DayAverage() {
    State.average = !State.average
    updateData()
}
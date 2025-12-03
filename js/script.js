//////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES
//////////////////////////////////////////////////////////////////////

// tracks process count for unique ids
let processCount = 0;
// default algo
let selectedAlgorithm = 'FCFS'; 
// default setting for priority
let isLowerPriorityChosen = true;

//////////////////////////////////////////////////////////////////////
// FRONT END
//////////////////////////////////////////////////////////////////////

// fills table with random data
function fillRandomly() {
    const rows = document.querySelectorAll("#inputTable tr");

    // if table empty, make 3 rows then recurse
    if (rows.length === 0) {
        for(let i=0; i<3; i++) addRow();
        fillRandomly(); 
        return;
    }

    // loop rows and add random ints
    rows.forEach(row => {
        const atInput = row.querySelector(".at-input");
        if (atInput) atInput.value = Math.floor(Math.random() * 11); 

        const btInput = row.querySelector(".bt-input");
        if (btInput) btInput.value = Math.floor(Math.random() * 10) + 1; 

        // fill priority if visible
        const prioCol = row.querySelector(".priority-col");
        const prioInput = row.querySelector(".priority-input");
        if (prioCol && prioCol.style.display !== 'none' && prioInput) {
            prioInput.value = Math.floor(Math.random() * 5) + 1;
        }

        // fill deadline if visible
        const deadCol = row.querySelector(".deadline-col");
        const deadInput = row.querySelector(".deadline-input");
        if (deadCol && deadCol.style.display !== 'none' && deadInput) {
            deadInput.value = Math.floor(Math.random() * 16) + 5;
        }
    });
}

// adds new row
function addRow() {
    const currentRows = document.querySelectorAll("#inputTable tr").length;
    
    // hard limit for ui clutter
    if (currentRows >= 9) {
        alert("Maximum limit of 9 processes reached.");
        return; 
    }

    processCount++;

    const table = document.getElementById("inputTable");
    const row = document.createElement("tr");

    // check columns visibility based on algo
    const priorityDisplay = (selectedAlgorithm === 'Priority' || selectedAlgorithm === 'MLQ') ? 'table-cell' : 'none';
    const deadlineDisplay = (selectedAlgorithm === 'Deadline') ? 'table-cell' : 'none';

    // generate row html
    row.innerHTML = `
        <td>
            <button class="btn btn-danger btn-sm border-0" onclick="deleteRow(this)">
                <i class="bi bi-trash-fill"></i>
            </button>
        </td>

        <td class="process-id">P${processCount}</td>
        <td><input type="number" class="form-control at-input" min="0" value="0"></td>
        <td><input type="number" class="form-control bt-input" min="1" value="1"></td>
        
        <td class="priority-col" style="display: ${priorityDisplay};">
            <input type="number" class="form-control priority-input" min="1" value="1">
        </td>
        
        <td class="deadline-col" style="display: ${deadlineDisplay};">
            <input type="number" class="form-control deadline-input" min="1" value="1">
        </td>
    `;
    table.appendChild(row);
}

// remove row
function deleteRow(button) {
    button.closest("tr").remove();
    renumberRows();
}

// renumber rows to fix id gaps
function renumberRows() {
    const rows = document.querySelectorAll("#inputTable tr");
    rows.forEach((row, index) => {
        row.querySelector(".process-id").innerText = `P${index + 1}`;
    });
    // sync global count to current row length
    processCount = rows.length;
}

// handle algo switching
function selectAlgo(algo) {
    selectedAlgorithm = algo;
    
    // check if priority needed
    const showPriority = (algo === 'Priority' || algo === 'MLQ');
    const priorityEls = document.querySelectorAll('.priority-col');
    
    // update header text
    const priorityHeader = document.querySelector('th.priority-col');
    if (priorityHeader) {
        if(algo === 'MLQ') {
            priorityHeader.innerText = "Queue ID";
        } else {
            priorityHeader.innerText = "Priority";
        }
    }

    // toggle priority column
    priorityEls.forEach(el => {
        el.style.display = showPriority ? 'table-cell' : 'none';
    });

    // check if deadline needed
    const showDeadline = (algo === 'Deadline');
    const deadlineEls = document.querySelectorAll('.deadline-col');
    deadlineEls.forEach(el => {
        el.style.display = showDeadline ? 'table-cell' : 'none';
    });

    // show/hide priority settings
    const settingsDiv = document.getElementById('priority-settings');
    if(settingsDiv) {
        settingsDiv.style.display = (algo === 'Priority') ? 'block' : 'none';
    }
}

// set priority order logic
function selectPriorityOrder(order) {
    if (order === 'lower') {
        isLowerPriorityChosen = true; // 1 is highest
    } else {
        isLowerPriorityChosen = false; // Higher number is highest
    }
}

//////////////////////////////////////////////////////////////////////
// SIMULATION
//////////////////////////////////////////////////////////////////////

function simulate() {
    const processes = [];
    const rows = document.querySelectorAll("#inputTable tr");

    // validations
    if (rows.length < 2) {
        alert("Minimum of 2 processes is required to simulate.");
        return;
    }

    // scraping phase: get input data
    rows.forEach(row => {
        const id = row.querySelector(".process-id").innerText;
        const at = parseInt(row.querySelector(".at-input").value) || 0;
        const bt = parseInt(row.querySelector(".bt-input").value) || 0;
        const priority = parseInt(row.querySelector(".priority-input").value) || 1; 
        const deadline = parseInt(row.querySelector(".deadline-input").value) || 0;

        processes.push({ id, at, bt, priority, deadline, completed: false });
    });

    let solvedProcesses = [];

    // routing phase: send to correct calc function
    if (selectedAlgorithm === 'FCFS') {
        solvedProcesses = calculateFCFS(processes);
    } else if (selectedAlgorithm === 'SJF') {
        solvedProcesses = calculateSJF(processes);
    } else if (selectedAlgorithm === 'Priority') {
        solvedProcesses = calculatePriority(processes);
    } else if (selectedAlgorithm === 'Deadline') {
        solvedProcesses = calculateDeadline(processes);
    } else if (selectedAlgorithm === 'MLQ') {
        solvedProcesses = calculateMLQ(processes);
    } else {
        alert("Algorithm not implemented yet!");
        return;
    }

    // render phase: draw table and chart
    renderOutput(solvedProcesses);
    renderGanttChart(solvedProcesses);
}

//////////////////////////////////////////////////////////////////////
// ALGORITHMS
//////////////////////////////////////////////////////////////////////

function calculateFCFS(processes) {
    // sort by arrival time
    processes.sort((a, b) => a.at - b.at);
    let currentTime = 0;
    
    // iterate and calculate timings
    return processes.map(p => {
        // if cpu idle jump to arrival
        const startTime = Math.max(currentTime, p.at);
        const completionTime = startTime + p.bt;
        
        // standard metrics
        const tat = completionTime - p.at;
        const wt = tat - p.bt;
        const rt = startTime - p.at;
        
        currentTime = completionTime;
        return { ...p, st: startTime, ct: completionTime, tat, wt, rt };
    });
}

function calculateSJF(processes) {
    // non-preemptive sjf
    let currentTime = 0;
    let completedCount = 0;
    const n = processes.length;
    const result = [];

    // loop until all finished
    while (completedCount < n) {
        // filter: arrived and not completed
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        if (availableProcesses.length > 0) {
            // sort logic: shortest burst time first
            availableProcesses.sort((a, b) => {
                if (a.bt === b.bt) return a.at - b.at; // tie-breaker: arrival time
                return a.bt - b.bt;
            });

            // pick best candidate
            const p = availableProcesses[0];
            const startTime = currentTime;
            const completionTime = startTime + p.bt;
            
            // calculate metrics
            const tat = completionTime - p.at;
            const wt = tat - p.bt;
            const rt = startTime - p.at;
            
            result.push({ ...p, st: startTime, ct: completionTime, tat, wt, rt });

            // update system state
            currentTime = completionTime;
            p.completed = true;
            completedCount++;
        } else {
            // idle state: jump to next arrival
            const upcoming = processes.filter(p => !p.completed).sort((a, b) => a.at - b.at)[0];
            if (upcoming) currentTime = upcoming.at;
        }
    }
    return result;
}

function calculatePriority(processes) {
    let currentTime = 0;
    let completedCount = 0;
    const n = processes.length;
    const result = [];

    while (completedCount < n) {
        // get ready queue
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        if (availableProcesses.length > 0) {
            // sort logic based on user preference
            availableProcesses.sort((a, b) => {
                if (a.priority !== b.priority) {
                    if (isLowerPriorityChosen) {
                        return a.priority - b.priority; 
                    } else {
                        return b.priority - a.priority; 
                    }
                }
                return a.at - b.at; 
            });

            const p = availableProcesses[0];
            const startTime = currentTime;
            const completionTime = startTime + p.bt;
            const tat = completionTime - p.at;
            const wt = tat - p.bt;
            const rt = startTime - p.at;

            result.push({ ...p, st: startTime, ct: completionTime, tat, wt, rt });

            currentTime = completionTime;
            p.completed = true;
            completedCount++;
        } else {
            // handle idle time
            const upcoming = processes.filter(p => !p.completed).sort((a, b) => a.at - b.at)[0];
            if (upcoming) currentTime = upcoming.at;
        }
    }
    return result;
}

function calculateDeadline(processes) {
    let currentTime = 0;
    let completedCount = 0;
    const n = processes.length;
    const result = [];

    while (completedCount < n) {
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        if (availableProcesses.length > 0) {
            // sort logic: earliest deadline first
            availableProcesses.sort((a, b) => {
                if (a.deadline !== b.deadline) {
                    return a.deadline - b.deadline;
                }
                return a.at - b.at;
            });

            const p = availableProcesses[0];
            const startTime = currentTime;
            const completionTime = startTime + p.bt;
            
            // standard metrics
            const tat = completionTime - p.at;
            const wt = tat - p.bt;
            const rt = startTime - p.at;

            // deadline specific metrics
            const lateness = completionTime - p.deadline;
            const tardiness = (lateness > 0) ? lateness : 0; 

            result.push({ 
                ...p, 
                st: startTime, 
                ct: completionTime, 
                tat, wt, rt,
                lateness,
                tardiness
            });

            currentTime = completionTime;
            p.completed = true;
            completedCount++;
        } else {
            // handle idle time
            const upcoming = processes.filter(p => !p.completed).sort((a, b) => a.at - b.at)[0];
            if (upcoming) currentTime = upcoming.at;
        }
    }
    return result;
}

function calculateMLQ(processes) {
    // note: basic implementation treating priority as queue level
    let currentTime = 0;
    let completedCount = 0;
    const n = processes.length;
    const result = [];

    while (completedCount < n) {
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        if (availableProcesses.length > 0) {
            // sort logic: lower queue id = higher priority
            availableProcesses.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority; 
                }
                return a.at - b.at; 
            });

            const p = availableProcesses[0];
            const startTime = currentTime;
            const completionTime = startTime + p.bt;
            const tat = completionTime - p.at;
            const wt = tat - p.bt;
            const rt = startTime - p.at;

            result.push({ ...p, st: startTime, ct: completionTime, tat, wt, rt });

            currentTime = completionTime;
            p.completed = true;
            completedCount++;
        } else {
             // handle idle time
            const upcoming = processes.filter(p => !p.completed).sort((a, b) => a.at - b.at)[0];
            if (upcoming) currentTime = upcoming.at;
        }
    }
    return result;
}

//////////////////////////////////////////////////////////////////////
// OUTPUT
//////////////////////////////////////////////////////////////////////

function renderOutput(data) {
    const outputTable = document.getElementById("outputTable");
    const outputThead = document.getElementById("outputThead");
    
    if (!outputTable || !outputThead) return;

    // dynamic header
    // rebuild the headers because deadline needs extra columns
    let headersHTML = `
        <th scope="col">ST</th>
        <th scope="col">CT</th>
        <th scope="col">TAT</th>
        <th scope="col">WT</th>
        <th scope="col">RT</th>
    `;

    if (selectedAlgorithm === 'Deadline') {
        headersHTML += `
            <th scope="col">Lateness</th>
            <th scope="col">Tardiness</th>
        `;
    }

    outputThead.innerHTML = `<tr>${headersHTML}</tr>`;

    // clear table at beginning
    outputTable.innerHTML = "";
    
    // variables for holding sums to calculate Averages later
    let totalTAT = 0;
    let totalWT = 0;
    let totalRT = 0;
    let totalLateness = 0;
    let totalTardiness = 0;

    data.forEach(p => {
        // add totals
        totalTAT += p.tat;
        totalWT += p.wt;
        totalRT += p.rt;
        if(p.lateness) totalLateness += p.lateness;
        if(p.tardiness) totalTardiness += p.tardiness;

        const row = document.createElement("tr");

        let rowHTML = `
            <td>${p.st}</td>
            <td>${p.ct}</td>
            <td>${p.tat}</td>
            <td>${p.wt}</td>
            <td>${p.rt}</td>
        `;

        // if deadline algo, append extra cells, color red if late
        if (selectedAlgorithm === 'Deadline') {
            rowHTML += `
                <td class="${p.lateness > 0 ? 'text-danger fw-bold' : 'text-success'}">${p.lateness}</td>
                <td>${p.tardiness}</td>
            `;
        }
        
        row.innerHTML = rowHTML;
        outputTable.appendChild(row);
    });

    // append avg row at the bottom
    if(data.length > 0) {
        const avgTAT = (totalTAT / data.length).toFixed(2);
        const avgWT = (totalWT / data.length).toFixed(2);
        const avgRT = (totalRT / data.length).toFixed(2);
        
        const avgRow = document.createElement("tr");
        avgRow.className = "fw-bold border-top border-secondary-subtle";

        let avgHTML = `
            <td colspan="2" class="text-end text-muted">Average:</td>
            <td>${avgTAT}</td>
            <td>${avgWT}</td>
            <td>${avgRT}</td>
        `;

        if (selectedAlgorithm === 'Deadline') {
            const avgLate = (totalLateness / data.length).toFixed(2);
            const avgTardi = (totalTardiness / data.length).toFixed(2);
            avgHTML += `
                <td>${avgLate}</td>
                <td>${avgTardi}</td>
            `;
        }

        avgRow.innerHTML = avgHTML;
        outputTable.appendChild(avgRow);
    }
}

function renderGanttChart(data) {
    const ganttChart = document.getElementById("gantt-chart");
    if (!ganttChart) return;

    // reset chart container
    ganttChart.className = "col p-4 rounded shadow-sm bg-white mt-4 border";
    ganttChart.innerHTML = `
    <h5 class="fw-bold mb-4 text-secondary">Gantt Chart -<span class="badge bg-primary ms-1">${selectedAlgorithm}</span></h5>
    <div class="gantt-container d-flex rounded border"></div>
    `;

    const chartContainer = ganttChart.querySelector(".gantt-container");
    
    // sort by start time for drawing left-to-right
    data.sort((a, b) => a.st - b.st);

    if (data.length === 0) return;

    let lastCt = data[0].st; 
    const timeScale = 40; // multiplier for width (pixels per unit time)

    // check if there is initial Idle time (e.g. Process starts at 2)
    if (data[0].st > 0) {
        createBlock(chartContainer, "Idle", 0, data[0].st, timeScale, true);
    }

    // loop through sorted processes to draw blocks
    data.forEach((p, index) => {
        // if there is a gap between last finish time and current start time -> Idle
        if (p.st > lastCt) {
            createBlock(chartContainer, "Idle", lastCt, p.st, timeScale, true);
        }
        // Draw Process Block
        createBlock(chartContainer, p.id, p.st, p.ct, timeScale, false, index);
        lastCt = p.ct;
    });
}

// function to create the visual div for Gantt Chart
function createBlock(container, label, start, end, scale, isIdle, index = 0) {
    const duration = end - start;
    const width = duration * scale;
    
    const div = document.createElement("div");
    div.className = "gantt-block";
    div.style.width = `${width}px`;
    div.style.minWidth = "50px"; // Ensure text fits

    if (isIdle) {
        // idle style
        div.classList.add("bg-secondary", "bg-opacity-25", "text-dark");
        div.style.backgroundImage = "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)";
        div.style.backgroundSize = "1rem 1rem";
        div.innerHTML = `<small>Idle</small>`;
    } else {
        // dynamic color for proccesses in gant chart
        const hue = (index * 137.5) % 360;
        div.style.backgroundColor = `hsl(${hue}, 65%, 50%)`;
        div.innerHTML = `<span>${label}</span>`;
    }

    // time
    const startSpan = document.createElement("span");
    startSpan.className = "time-label time-start";
    startSpan.innerText = start;

    const endSpan = document.createElement("span");
    endSpan.className = "time-label time-end";
    endSpan.innerText = end;

    div.appendChild(startSpan);
    div.appendChild(endSpan);
    
    container.appendChild(div);
}

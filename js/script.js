//////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES
//////////////////////////////////////////////////////////////////////

let processCount = 0;
let selectedAlgorithm = 'FCFS'; 
let isLowerPriorityChosen = true; 
let currentTooltip = null; // Track the active tooltip to clean it up

//////////////////////////////////////////////////////////////////////
// FRONT END
//////////////////////////////////////////////////////////////////////

function fillRandomly() {
    const rows = document.querySelectorAll("#inputTable tr");

    if (rows.length === 0) {
        for(let i=0; i<3; i++) addRow();
        fillRandomly(); 
        return;
    }

    rows.forEach(row => {
        const atInput = row.querySelector(".at-input");
        if (atInput) atInput.value = Math.floor(Math.random() * 11); 

        const btInput = row.querySelector(".bt-input");
        if (btInput) btInput.value = Math.floor(Math.random() * 10) + 1; 

        const prioInput = row.querySelector(".priority-input");
        
        if (selectedAlgorithm === 'MLQ') {
            if (prioInput) prioInput.value = Math.floor(Math.random() * 2) + 1;
        } 
        else if (selectedAlgorithm === 'Priority') {
            if (prioInput) prioInput.value = Math.floor(Math.random() * 9) + 1;
        }
        else {
            if (prioInput) prioInput.value = 1;
        }

        const deadInput = row.querySelector(".deadline-col");
        const deadInputVal = row.querySelector(".deadline-input");
        if (deadInput && deadInput.style.display !== 'none' && deadInputVal) {
            deadInputVal.value = Math.floor(Math.random() * 16) + 5;
        }
    });
}

function addRow() {
    const currentRows = document.querySelectorAll("#inputTable tr").length;
    
    if (currentRows >= 9) {
        alert("Maximum limit of 9 processes reached.");
        return; 
    }

    processCount++;

    const table = document.getElementById("inputTable");
    const row = document.createElement("tr");

    let priorityDisplay = 'none';
    let deadlineDisplay = 'none';

    if (selectedAlgorithm === 'MLQ' || selectedAlgorithm === 'Priority') {
        priorityDisplay = 'table-cell';
    }
    if (selectedAlgorithm === 'Deadline') {
        deadlineDisplay = 'table-cell';
    }
    
    let inputValidation = "";
    if (selectedAlgorithm === 'MLQ') {
        inputValidation = "if(this.value > 2) this.value = 2; if(this.value < 1) this.value = 1;";
    }

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
            <input type="number" 
                   class="form-control priority-input" 
                   min="1" 
                   value="1" 
                   oninput="${inputValidation}">
        </td>
        
        <td class="deadline-col" style="display: ${deadlineDisplay};">
            <input type="number" class="form-control deadline-input" min="1" value="1">
        </td>
    `;
    table.appendChild(row);
}

function deleteRow(button) {
    button.closest("tr").remove();
    renumberRows();
}

function renumberRows() {
    const rows = document.querySelectorAll("#inputTable tr");
    rows.forEach((row, index) => {
        row.querySelector(".process-id").innerText = `P${index + 1}`;
    });
    processCount = rows.length;
}

function selectAlgo(algo) {
    selectedAlgorithm = algo;
    
    const prioColElements = document.querySelectorAll('.priority-col');
    const prioHeader = document.querySelector('th.priority-col');
    const deadlineColElements = document.querySelectorAll('.deadline-col');
    const prioSettings = document.getElementById('priority-settings');

    // 1. CLEANUP: Dispose of existing tooltip if it exists
    if (currentTooltip) {
        currentTooltip.dispose();
        currentTooltip = null;
    }

    // Reset Elements
    prioColElements.forEach(el => el.style.display = 'none');
    deadlineColElements.forEach(el => el.style.display = 'none');
    prioSettings.style.display = 'none';

    // Reset Header Text/Attributes
    if (prioHeader) {
        prioHeader.innerHTML = ""; // Clear content
        prioHeader.removeAttribute('title');
        prioHeader.removeAttribute('data-bs-toggle');
        prioHeader.removeAttribute('data-bs-title');
        prioHeader.style.cursor = 'default';
        prioHeader.classList.remove('text-decoration-underline');
    }

    if (algo === 'MLQ') {
        prioColElements.forEach(el => el.style.display = 'table-cell');
        
        if(prioHeader) {
            // Add HTML with an ID for the icon so we can select it
            prioHeader.innerHTML = `Queue ID <i id="mlq-info-icon" class="bi bi-info-circle-fill ms-1 text-primary"></i>`;
            prioHeader.style.cursor = "pointer";

            // Initialize Bootstrap Tooltip on the icon
            const iconElement = document.getElementById('mlq-info-icon');
            if(iconElement) {
                currentTooltip = new bootstrap.Tooltip(iconElement, {
                    title: "Queue 1: FCFS (High Priority) <br> Queue 2: SJF (Low Priority)",
                    placement: "top",
                    trigger: "hover focus",
                    html: true
                });
            }
        }
        
        applyMLQValidation();
    } 
    else if (algo === 'Priority') {
        prioColElements.forEach(el => el.style.display = 'table-cell');
        
        if(prioHeader) {
            prioHeader.innerText = "Priority";
        }
        
        prioSettings.style.display = 'block';
        removeMLQValidation();
    }
    else if (algo === 'Deadline') {
        deadlineColElements.forEach(el => el.style.display = 'table-cell');
        removeMLQValidation(); 
    }
    else {
        // FCFS or SJF
        removeMLQValidation(); 
    }

    renderOutput([]); 
    resetGanttChart();
}

function applyMLQValidation() {
    const inputs = document.querySelectorAll('.priority-input');
    inputs.forEach(input => {
        input.setAttribute('oninput', "if(this.value > 2) this.value = 2; if(this.value < 1) this.value = 1;");
        if (parseInt(input.value) > 2) input.value = 2; 
    });
}

function removeMLQValidation() {
    const inputs = document.querySelectorAll('.priority-input');
    inputs.forEach(input => {
        input.removeAttribute('oninput');
    });
}

function selectPriorityOrder(order) {
    isLowerPriorityChosen = (order === 'lower');
}

function resetGanttChart() {
    const ganttChart = document.getElementById("gantt-chart");
    if (!ganttChart) return;

    ganttChart.className = "col p-5 text-center text-muted border rounded bg-white shadow-sm border-dashed";
    ganttChart.innerHTML = `
        <i class="bi bi-bar-chart-steps fs-1"></i>
        <p class="mt-2">Run simulation to generate Gantt Chart</p>
    `;
}

//////////////////////////////////////////////////////////////////////
// SIMULATION
//////////////////////////////////////////////////////////////////////

function simulate() {
    const processes = [];
    const rows = document.querySelectorAll("#inputTable tr");

    if (rows.length < 2) {
        alert("Minimum of 2 processes is required to simulate.");
        return;
    }

    rows.forEach(row => {
        const id = row.querySelector(".process-id").innerText;
        const at = parseInt(row.querySelector(".at-input").value) || 0;
        const bt = parseInt(row.querySelector(".bt-input").value) || 0;
        let priority = parseInt(row.querySelector(".priority-input").value) || 1; 
        const deadline = parseInt(row.querySelector(".deadline-input").value) || 0;
        
        if (selectedAlgorithm === 'MLQ') {
            if (priority > 2) priority = 2;
            if (priority < 1) priority = 1;
        }

        processes.push({ id, at, bt, priority, deadline, completed: false });
    });

    let solvedProcesses = [];

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
    }

    renderOutput(solvedProcesses);
    renderGanttChart(solvedProcesses);
}

//////////////////////////////////////////////////////////////////////
// ALGORITHMS
//////////////////////////////////////////////////////////////////////

function calculateFCFS(processes) {
    processes.sort((a, b) => a.at - b.at);
    let currentTime = 0;
    
    return processes.map(p => {
        const startTime = Math.max(currentTime, p.at);
        const completionTime = startTime + p.bt;
        const tat = completionTime - p.at;
        const wt = tat - p.bt;
        const rt = startTime - p.at;
        
        currentTime = completionTime;
        return { ...p, st: startTime, ct: completionTime, tat, wt, rt };
    });
}

function calculateSJF(processes) {
    let currentTime = 0;
    let completedCount = 0;
    const n = processes.length;
    const result = [];

    while (completedCount < n) {
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        if (availableProcesses.length > 0) {
            availableProcesses.sort((a, b) => {
                if (a.bt === b.bt) return a.at - b.at;
                return a.bt - b.bt;
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
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        if (availableProcesses.length > 0) {
            availableProcesses.sort((a, b) => {
                if (a.priority !== b.priority) {
                    if (isLowerPriorityChosen) return a.priority - b.priority; 
                    else return b.priority - a.priority; 
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
            availableProcesses.sort((a, b) => {
                if (a.deadline !== b.deadline) return a.deadline - b.deadline;
                return a.at - b.at;
            });

            const p = availableProcesses[0];
            const startTime = currentTime;
            const completionTime = startTime + p.bt;
            const tat = completionTime - p.at;
            const wt = tat - p.bt;
            const rt = startTime - p.at;
            const lateness = completionTime - p.deadline;
            const tardiness = (lateness > 0) ? lateness : 0; 

            result.push({ ...p, st: startTime, ct: completionTime, tat, wt, rt, lateness, tardiness });
            currentTime = completionTime;
            p.completed = true;
            completedCount++;
        } else {
            const upcoming = processes.filter(p => !p.completed).sort((a, b) => a.at - b.at)[0];
            if (upcoming) currentTime = upcoming.at;
        }
    }
    return result;
}

function calculateMLQ(processes) {
    let currentTime = 0;
    let completedCount = 0;
    const n = processes.length;
    const result = [];

    while (completedCount < n) {
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        if (availableProcesses.length > 0) {
            availableProcesses.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority; 
                }
                
                if (a.priority === 2) {
                    if (a.bt !== b.bt) return a.bt - b.bt;
                    return a.at - b.at;
                } else {
                    return a.at - b.at;
                }
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

    outputTable.innerHTML = "";
    
    if(data.length === 0) return;

    let totalTAT = 0, totalWT = 0, totalRT = 0, totalLateness = 0, totalTardiness = 0;

    data.forEach(p => {
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
        if (selectedAlgorithm === 'Deadline') {
            rowHTML += `
                <td class="${p.lateness > 0 ? 'text-danger fw-bold' : 'text-success'}">${p.lateness}</td>
                <td>${p.tardiness}</td>
            `;
        }
        row.innerHTML = rowHTML;
        outputTable.appendChild(row);
    });

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
            avgHTML += `<td>${avgLate}</td><td>${avgTardi}</td>`;
        }
        avgRow.innerHTML = avgHTML;
        outputTable.appendChild(avgRow);
    }
}

function renderGanttChart(data) {
    const ganttChart = document.getElementById("gantt-chart");
    if (!ganttChart) return;

    ganttChart.className = "col p-4 rounded shadow-sm bg-white mt-4 border";
    ganttChart.innerHTML = `
    <h5 class="fw-bold mb-4 text-secondary">Gantt Chart -<span class="badge bg-primary ms-1">${selectedAlgorithm}</span></h5>
    <div class="gantt-container d-flex rounded border"></div>
    `;

    const chartContainer = ganttChart.querySelector(".gantt-container");
    data.sort((a, b) => a.st - b.st);

    if (data.length === 0) return;

    let lastCt = data[0].st; 
    const timeScale = 40; 

    if (data[0].st > 0) {
        createBlock(chartContainer, "Idle", 0, data[0].st, timeScale, true);
    }

    data.forEach((p, index) => {
        if (p.st > lastCt) {
            createBlock(chartContainer, "Idle", lastCt, p.st, timeScale, true);
        }
        createBlock(chartContainer, p.id, p.st, p.ct, timeScale, false, index);
        lastCt = p.ct;
    });
}

function createBlock(container, label, start, end, scale, isIdle, index = 0) {
    const duration = end - start;
    const width = duration * scale;
    const div = document.createElement("div");
    div.className = "gantt-block";
    div.style.width = `${width}px`;
    div.style.minWidth = "50px"; 

    if (isIdle) {
        div.classList.add("bg-secondary", "bg-opacity-25", "text-dark");
        div.style.backgroundImage = "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)";
        div.style.backgroundSize = "1rem 1rem";
        div.innerHTML = `<small>Idle</small>`;
    } else {
        const hue = (index * 137.5) % 360;
        div.style.backgroundColor = `hsl(${hue}, 65%, 50%)`;
        div.innerHTML = `<span>${label}</span>`;
    }

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

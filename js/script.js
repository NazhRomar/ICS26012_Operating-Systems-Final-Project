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

//Function that generates THREE Process with random values
function fillRandomly() {
    //Gets the Table
    const rows = document.querySelectorAll("#inputTable tr");

    //Row Checker
    //No Rows = 3 Random Rows
    //Rows exist = fills the existing rows
    if (rows.length === 0) {
        for (let i = 0; i < 3; i++) addRow();
        fillRandomly();
        return;
    }

    //Loops the Rows to fill each input with random numbers
    rows.forEach(row => {
        //Arrival Time Input
        const atInput = row.querySelector(".at-input");
        if (atInput) atInput.value = Math.floor(Math.random() * 11);

        //Burst Time Input
        const btInput = row.querySelector(".bt-input");
        if (btInput) btInput.value = Math.floor(Math.random() * 10) + 1;

        //Input for Priority and MLQ
        //Since Priority and MLQ has the same logic, we've decided to reuse the column 
        const prioInput = row.querySelector(".priority-input");

        //If MLQ is Selected == Random number from 1 to 2 since there are only 2 queue as per the guidelines
        //If Priority is Selected == Random number from 1 to 9
        if (selectedAlgorithm === 'MLQ') {
            if (prioInput) prioInput.value = Math.floor(Math.random() * 2) + 1;
        }
        else if (selectedAlgorithm === 'Priority') {
            if (prioInput) prioInput.value = Math.floor(Math.random() * 9) + 1;
        }
        else {
            //Default Value
            //Useful when the user is selecting the Algo
            //Press Fill Randomly again to change the value from 1
            if (prioInput) prioInput.value = 1;
        }

        //Gets the deadline column
        //Checks if deadline column exist
        //deadline-col exists == fill random number
        const deadInput = row.querySelector(".deadline-col");
        const deadInputVal = row.querySelector(".deadline-input");
        if (deadInput && deadInput.style.display !== 'none' && deadInputVal) {
            deadInputVal.value = Math.floor(Math.random() * 16) + 5;
        }
    });
}


//Function to add row entries
//Row Entries are New Processes
function addRow() {
    const tableBody = document.getElementById("inputTable");
    //Gets the row count to check if ceiling is reached
    const currentRows = tableBody.getElementsByTagName("tr").length;

    if (currentRows >= 9) {
        //Warn user if they try adding process if total is 9
        alert("Maximum limit of 9 processes reached.");
        return;
    }

    //Increment Process if ceiling is not reached
    processCount = currentRows + 1;

    //Row Intialization
    const row = document.createElement("tr");

    // Default Value for priority and deadline visibility
    let priorityDisplay = 'none';
    let deadlineDisplay = 'none';

    //Same Logic for MLQ and Priority
    //Makes their column visible if selected
    if (selectedAlgorithm === 'MLQ' || selectedAlgorithm === 'Priority') {
        priorityDisplay = 'table-cell';
    }
    //Deadline Selected, then make the column visible
    if (selectedAlgorithm === 'Deadline') {
        deadlineDisplay = 'table-cell';
    }

    // MLQ Validation Logic
    let inputValidation = "";
    if (selectedAlgorithm === 'MLQ') {
        //Validation for MLQ
        //Since 2 queues only, we do not want the user to put higher or lower values
        inputValidation = "if(this.value > 2) this.value = 2; if(this.value < 1) this.value = 1;";
    }

    //Append new Row
    //Final block for add rows since validation is already done
    row.innerHTML = `
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
    tableBody.appendChild(row);
}

// function to remove last process
function removeProcess() {
    const tableBody = document.getElementById("inputTable");
    const lastRow = tableBody.lastElementChild;

    // Check if there are rows to remove
    if (lastRow) {
        lastRow.remove();
        
        // Update the global processCount to match the new length
        processCount = tableBody.getElementsByTagName("tr").length;
    }
}

function selectAlgo(algo) {
    selectedAlgorithm = algo;

    const prioColElements = document.querySelectorAll('.priority-col');
    const prioHeader = document.querySelector('th.priority-col');
    const deadlineColElements = document.querySelectorAll('.deadline-col');
    const prioSettings = document.getElementById('priority-settings');

    //Removes existing tooltip if it exists
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

        if (prioHeader) {
            // Add HTML with an ID for the icon so we can select it
            prioHeader.innerHTML = `Queue ID <i id="mlq-info-icon" class="bi bi-info-circle-fill ms-1 text-primary"></i>`;
            prioHeader.style.cursor = "pointer";

            // Initialize Bootstrap Tooltip on the icon
            const iconElement = document.getElementById('mlq-info-icon');
            if (iconElement) {
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

        if (prioHeader) {
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

//Miscellaneous

//Two Queue Validation for MLQ
function applyMLQValidation() {
    const inputs = document.querySelectorAll('.priority-input');
    inputs.forEach(input => {
        input.setAttribute('oninput', "if(this.value > 2) this.value = 2; if(this.value < 1) this.value = 1;");
        if (parseInt(input.value) > 2) input.value = 2;
    });
}

//MLQ not Selected == remove mlq validation
function removeMLQValidation() {
    const inputs = document.querySelectorAll('.priority-input');
    inputs.forEach(input => {
        input.removeAttribute('oninput');
    });
}

//Misc for priority order
//higher or lower
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

    //Validation
    if (rows.length < 2) {
        alert("Minimum of 2 processes is required to simulate.");
        return;
    }

    //Loop
    //Value is assigned to each variable
    //Each Variable is then bundled into an Object
    //That Object will then be pushed into the Process Array
    rows.forEach(row => {
        const id = row.querySelector(".process-id").innerText;
        const at = parseInt(row.querySelector(".at-input").value) || 0; //Arrival Time
        const bt = parseInt(row.querySelector(".bt-input").value) || 0; //Burst Time
        let priority = parseInt(row.querySelector(".priority-input").value) || 1; //Priority
        const deadline = parseInt(row.querySelector(".deadline-input").value) || 0; //Priority Deadline

        //Validation for MLQ
        if (selectedAlgorithm === 'MLQ') {
            if (priority > 2) priority = 2;
            if (priority < 1) priority = 1;
        }

        processes.push({ id, at, bt, priority, deadline, completed: false });
    });


    //Passes the process array to the chosen algorithm/scheduling
    //solvedProcesses then expects the designated algorithm function to return the solved processes
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

    //Passes the solvedProcesses to create
    //The Output Table and the Gantt Chart
    renderOutput(solvedProcesses);
    renderGanttChart(solvedProcesses);
}

//////////////////////////////////////////////////////////////////////
// ALGORITHMS
//////////////////////////////////////////////////////////////////////


function calculateFCFS(processes) {
    //Sorts the process through the arrival time
    //FCFS == Earliest Arrival Time
    processes.sort((a, b) => a.at - b.at);

    //CPU clock
    let currentTime = 0;

    //each 'p' represents a process
    //iterates through the sorted list to calculate timelines
    return processes.map(p => {
        //Math.max() to handle CPU idle time if a process arrives late
        const startTime = Math.max(currentTime, p.at);
        //Same Computations from Ma'am Zhou's Lectures
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
        //Creates the Ready Queue
        //Filters the process based on if they arrived and if they are completed
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);


        if (availableProcesses.length > 0) {
            //SJF = Shorted Job First
            //Checks the burst time of the process currently in the Running Queue vs the newly Arrived Process
            //IF Same BT then FCFS for the processes
            availableProcesses.sort((a, b) => {
                if (a.bt === b.bt) return a.at - b.at;
                return a.bt - b.bt;
            });

            //Allocates the process based on the selection process
            const p = availableProcesses[0];

            //Standard Calculations for SJF
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
        //Filtering
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        //isLowerPriorityChosen = true, then ascending order
        //isLowerPriorityChosen = false, then descending order
        if (availableProcesses.length > 0) {
            availableProcesses.sort((a, b) => {
                if (a.priority !== b.priority) {
                    if (isLowerPriorityChosen) return a.priority - b.priority;
                    else return b.priority - a.priority;
                }
                return a.at - b.at;
            });

            //Allocates the process based on the selection process
            const p = availableProcesses[0];

            //Standard Computations for Priority
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

        //Filtering
        const availableProcesses = processes.filter(p => p.at <= currentTime && !p.completed);

        if (availableProcesses.length > 0) {
            //Sort by Deadline (Ascending)
            //The process with the smallest deadline number runs first
            //FCFS for tiebreaker
            availableProcesses.sort((a, b) => {
                if (a.deadline !== b.deadline) return a.deadline - b.deadline;
                return a.at - b.at;
            });

            const p = availableProcesses[0];

            //Standard Computation for Deadline
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
                //Since we reused Priority for MLQ
                //MLQ queues is designated as priority

                //Queue 1 - FCFS
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                //Queue 2 - SJF
                if (a.priority === 2) {
                    if (a.bt !== b.bt) return a.bt - b.bt;
                    return a.at - b.at;
                } else {
                    return a.at - b.at;
                }
            });
            //Allocation
            const p = availableProcesses[0];
            //Standard Computation for MLQ
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

//Renders the Output Table from the passed calculated data from the simulate Function
function renderOutput(data) {
    //Gets the table elements for population
    const outputTable = document.getElementById("outputTable");
    const outputThead = document.getElementById("outputThead");

    //Validation checks if elements exist
    if (!outputTable || !outputThead) return;

    //Theads makers
    let headersHTML = `
        <th scope="col">ST</th>
        <th scope="col">CT</th>
        <th scope="col">TAT</th>
        <th scope="col">WT</th>
        <th scope="col">RT</th>
    `;

    //Deadline Algorithm Columns
    //Only adds specific columns if Deadline is selected
    if (selectedAlgorithm === 'Deadline') {
        headersHTML += `
            <th scope="col">Lateness</th>
            <th scope="col">Tardiness</th>
        `;
    }
    //Injects the headers into the DOM
    outputThead.innerHTML = `<tr>${headersHTML}</tr>`;

    //Clears previous table body content
    outputTable.innerHTML = "";

    //No data == no render
    if (data.length === 0) return;

    //Variable initialization for averages
    let totalTAT = 0, totalWT = 0, totalRT = 0, totalLateness = 0, totalTardiness = 0;

    //Loops through the processed data to generate rows
    data.forEach(p => {
        //Accumulate totals for averages
        totalTAT += p.tat;
        totalWT += p.wt;
        totalRT += p.rt;
        if (p.lateness) totalLateness += p.lateness;
        if (p.tardiness) totalTardiness += p.tardiness;

        //Creates the row element
        const row = document.createElement("tr");
        
        //HTML construction for the row data
        let rowHTML = `
            <td>${p.st}</td>
            <td>${p.ct}</td>
            <td>${p.tat}</td>
            <td>${p.wt}</td>
            <td>${p.rt}</td>
        `;
        
        //Conditional column logic for Deadline
        //Lateness > 0 == Red text
        if (selectedAlgorithm === 'Deadline') {
            rowHTML += `
                <td class="${p.lateness > 0 ? 'text-danger fw-bold' : 'text-success'}">${p.lateness}</td>
                <td>${p.tardiness}</td>
            `;
        }
        
        //Appends the constructed HTML to the row and table
        row.innerHTML = rowHTML;
        outputTable.appendChild(row);
    });

    //Footer Row for Averages
    if (data.length > 0) {
        //Calculates Averages fixed to 2 decimals
        const avgTAT = (totalTAT / data.length).toFixed(2);
        const avgWT = (totalWT / data.length).toFixed(2);
        const avgRT = (totalRT / data.length).toFixed(2);

        //Creates the Average Row with styling
        const avgRow = document.createElement("tr");
        avgRow.className = "fw-bold border-top border-secondary-subtle";

        //Average columns
        let avgHTML = `
            <td colspan="2" class="text-end text-muted">Average:</td>
            <td>${avgTAT}</td>
            <td>${avgWT}</td>
            <td>${avgRT}</td>
        `;

        //Puts specific averages if Deadline is selected
        if (selectedAlgorithm === 'Deadline') {
            const avgLate = (totalLateness / data.length).toFixed(2);
            const avgTardi = (totalTardiness / data.length).toFixed(2);
            avgHTML += `<td>${avgLate}</td><td>${avgTardi}</td>`;
        }
        
        //Final append for the average row
        avgRow.innerHTML = avgHTML;
        outputTable.appendChild(avgRow);
    }
}

//Function that visualizes the timeline
function renderGanttChart(data) {
    const ganttChart = document.getElementById("gantt-chart");
    if (!ganttChart) return;

    //Resets container styling and adds header info
    ganttChart.className = "col p-4 rounded shadow-sm bg-white mt-4 border";
    ganttChart.innerHTML = `
    <h5 class="fw-bold mb-4 text-secondary">Gantt Chart -<span class="badge bg-primary ms-1">${selectedAlgorithm}</span></h5>
    <div class="gantt-container d-flex rounded border"></div>
    `;

    //Gets the internal container for the blocks
    const chartContainer = ganttChart.querySelector(".gantt-container");
    
    //Sorts by Start Time to ensure timeline order
    data.sort((a, b) => a.st - b.st);

    //Empty data check
    if (data.length === 0) return;

    //Tracker variables
    let lastCt = data[0].st;
    const timeScale = 40; //Multiplier for width visualization

    //Initial Idle Check
    //If the first process starts > 0, we need an idle block at the start
    if (data[0].st > 0) {
        createBlock(chartContainer, "Idle", 0, data[0].st, timeScale, true);
    }

    //Iterates through processes to build the chart
    data.forEach((p, index) => {
        //Mid-stream Idle Check
        //If current start time > last completion time, there is a gap
        if (p.st > lastCt) {
            createBlock(chartContainer, "Idle", lastCt, p.st, timeScale, true);
        }
        
        //Creates the process block
        createBlock(chartContainer, p.id, p.st, p.ct, timeScale, false, index);
        
        //Updates the last completion time
        lastCt = p.ct;
    });
}

//Helper function to create individual blocks (Process or Idle)
function createBlock(container, label, start, end, scale, isIdle, index = 0) {
    //Calculates width based on duration and scale
    const duration = end - start;
    const width = duration * scale;
    
    //Creates the div element and applies base styles
    const div = document.createElement("div");
    div.className = "gantt-block";
    div.style.width = `${width}px`;
    div.style.minWidth = "50px"; //Ensures readability for short processes

    //Idle Block Styling
    if (isIdle) {
        div.classList.add("bg-secondary", "bg-opacity-25", "text-dark");
        //Striped background for visual distinction
        div.style.backgroundImage = "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)";
        div.style.backgroundSize = "1rem 1rem";
        div.innerHTML = `<small>Idle</small>`;
    } else {
        //Process Block Styling
        //Generates a distinct color based on index (HSL)
        const hue = (index * 137.5) % 360;
        div.style.backgroundColor = `hsl(${hue}, 65%, 50%)`;
        div.innerHTML = `<span>${label}</span>`;
    }

    //Time Labels (Start and End)
    const startSpan = document.createElement("span");
    startSpan.className = "time-label time-start";
    startSpan.innerText = start;

    const endSpan = document.createElement("span");
    endSpan.className = "time-label time-end";
    endSpan.innerText = end;

    //Appends labels and adds block to container
    div.appendChild(startSpan);
    div.appendChild(endSpan);
    container.appendChild(div);
}

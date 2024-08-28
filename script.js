let tasks = [];
let db;

const dbName = "ChecklistDB";
const storeName = "tasks";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = (event) => {
            console.error("IndexedDB error: " + event.target.error);
            alert("An error occurred while accessing the database. Your changes may not be saved.");
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
        };
    });
}

function loadTasks() {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
        tasks = event.target.result;
        renderTasks();
    };

    request.onerror = (event) => {
        console.error("Error loading tasks: ", event.target.error);
        alert("An error occurred while loading tasks. Some tasks may not be displayed.");
    };
}

function saveTasks() {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    
    store.clear();
    tasks.forEach(task => {
        const request = store.add(task);
        request.onerror = (event) => {
            console.error("Error saving task: ", event.target.error);
            alert("An error occurred while saving. Some tasks may not be saved.");
        };
    });
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'fade-in';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.onchange = () => toggleTask(task.id);
        
        const taskText = document.createElement('span');
        taskText.className = `task-text ${task.completed ? 'completed' : ''}`;
        taskText.textContent = task.text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteTask(task.id);
        
        li.appendChild(checkbox);
        li.appendChild(taskText);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
}

function addTask() {
    const input = document.getElementById('taskInput');
    if (input.value.trim() !== '') {
        const newTask = { text: input.value, completed: false };
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.add(newTask);

        request.onsuccess = (event) => {
            newTask.id = event.target.result;
            tasks.push(newTask);
            input.value = '';
            renderTasks();
        };

        request.onerror = (event) => {
            console.error("Error adding task: ", event.target.error);
            alert("An error occurred while adding the task. It may not have been saved.");
        };
    }
}

function toggleTask(id) {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = (event) => {
        const task = event.target.result;
        task.completed = !task.completed;
        const updateRequest = store.put(task);

        updateRequest.onsuccess = () => {
            const index = tasks.findIndex(t => t.id === id);
            tasks[index] = task;
            renderTasks();
        };

        updateRequest.onerror = (event) => {
            console.error("Error updating task: ", event.target.error);
            alert("An error occurred while updating the task. The change may not have been saved.");
        };
    };
}

function deleteTask(id) {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
        tasks = tasks.filter(task => task.id !== id);
        renderTasks();
    };

    request.onerror = (event) => {
        console.error("Error deleting task: ", event.target.error);
        alert("An error occurred while deleting the task. It may not have been removed.");
    };
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "checklist_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Initialize the database and load tasks
openDB().then(() => {
    loadTasks();
}).catch(error => console.error(error));

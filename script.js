document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const aiInput = document.getElementById('ai-input');
    const aiSubmit = document.getElementById('ai-submit');
    const aiMessages = document.getElementById('ai-messages');
    const speakBtn = document.getElementById('speak-btn');
    const listenBtn = document.getElementById('listen-btn');
    const filterCategory = document.getElementById('filter-category');
    const filterPriority = document.getElementById('filter-priority');
    const filterStatus = document.getElementById('filter-status');
    const taskCategory = document.getElementById('task-category');
    const taskPriority = document.getElementById('task-priority');
    const taskDueDate = document.getElementById('task-due-date');
    const totalProgress = document.getElementById('total-progress');
    const progressText = document.querySelector('.progress-text');

    const MISTRAL_API_KEY = 'lCbFw7gRU2Fm0olrj2CtM3h3eK22WQGH';
    const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

    let recognition;
    let synth;
    let tasks = [];

    // Initialize Speech Recognition
    function initSpeechRecognition() {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            aiInput.value = transcript;
            aiSubmit.click();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
    }

    // Initialize Text-to-Speech
    function initTextToSpeech() {
        synth = window.speechSynthesis;
    }

    // Speak the given text
    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    }

    // Update Progress Bar
    function updateProgress() {
        const total = tasks.length;
        if (total === 0) {
            totalProgress.style.width = '0%';
            progressText.textContent = '0% Complete';
            return;
        }
        
        const completed = tasks.filter(task => task.status === 'completed').length;
        const percentage = Math.round((completed / total) * 100);
        totalProgress.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% Complete`;
    }

    // Toggle Theme
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
    });

    // AI Chat Function
    async function sendToAI(message, context = '') {
        try {
            const response = await fetch(MISTRAL_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "mistral-tiny",
                    messages: [
                        {
                            role: "system",
                            content: "You are an integrated AI assistant for task management. Provide concise, practical, and helpful suggestions and assistance."
                        },
                        {
                            role: "user",
                            content: `${context ? 'Context: ' + context + '\n' : ''}${message}`
                        }
                    ]
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI API Error:', error);
            return 'Sorry, I encountered an error. Please try again.';
        }
    }

    // Add Task with AI Enhancement
    addTaskBtn.addEventListener('click', async () => {
        const taskText = taskInput.value.trim();
        if (taskText !== '') {
            // Get AI suggestions for the task
            const suggestion = await sendToAI(`Suggest improvements, next steps, and estimated time for this task: ${taskText}. Consider the category: ${taskCategory.value} and priority: ${taskPriority.value}`);

            const task = {
                id: Date.now(),
                text: taskText,
                category: taskCategory.value,
                priority: taskPriority.value,
                dueDate: taskDueDate.value,
                status: 'pending',
                suggestion,
                completed: false
            };

            tasks.push(task);

            const li = document.createElement('li');
            li.dataset.id = task.id;
            li.innerHTML = `
                <div class="task-content">
                    <div class="task-header">
                        <input type="checkbox" class="task-checkbox">
                        <span class="task-text">${taskText}</span>
                        <span class="task-meta">
                            <span class="task-category ${task.category}">${task.category}</span>
                            <span class="task-priority ${task.priority}">${task.priority}</span>
                        </span>
                    </div>
                    <div class="task-details">
                        ${task.dueDate ? `<div class="task-due-date">Due: ${new Date(task.dueDate).toLocaleString()}</div>` : ''}
                        ${suggestion ? `<div class="task-suggestion">AI Suggestion: ${suggestion}</div>` : ''}
                    </div>
                    <div class="task-status">
                        <select class="status-select">
                            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                </div>
                <button class="delete-btn">Delete</button>
            `;
            taskList.appendChild(li);
            
            // Clear inputs
            taskInput.value = '';
            taskDueDate.value = '';
            
            updateProgress();
            filterTasks();
        }
    });

    // AI Interaction
    aiSubmit.addEventListener('click', async () => {
        const question = aiInput.value.trim();
        if (question !== '') {
            // Add user message
            const userDiv = document.createElement('div');
            userDiv.className = 'ai-message user-message';
            userDiv.textContent = question;
            aiMessages.appendChild(userDiv);

            // Show loading state
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'ai-message ai-loading';
            loadingDiv.textContent = 'AI is thinking...';
            aiMessages.appendChild(loadingDiv);

            // Get AI response with current tasks context
            const tasksContext = tasks.map(task => 
                `${task.text} (${task.category}, ${task.priority}, ${task.status})`
            ).join(', ');
            const response = await sendToAI(question, 'Current tasks: ' + tasksContext);

            // Remove loading message
            aiMessages.removeChild(loadingDiv);

            // Add AI response
            const aiDiv = document.createElement('div');
            aiDiv.className = 'ai-message ai-response';
            aiDiv.textContent = response;
            aiMessages.appendChild(aiDiv);

            // Speak AI response
            speak(response);

            // Clear input
            aiInput.value = '';

            // Scroll to bottom
            aiMessages.scrollTop = aiMessages.scrollHeight;
        }
    });

    // Filter Tasks
    function filterTasks() {
        const category = filterCategory.value;
        const priority = filterPriority.value;
        const status = filterStatus.value;

        Array.from(taskList.children).forEach(li => {
            const task = tasks.find(t => t.id === parseInt(li.dataset.id));
            if (!task) return;

            const categoryMatch = category === 'all' || task.category === category;
            const priorityMatch = priority === 'all' || task.priority === priority;
            const statusMatch = status === 'all' || task.status === status;

            li.style.display = categoryMatch && priorityMatch && statusMatch ? '' : 'none';
        });
    }

    // Event Listeners for Filters
    filterCategory.addEventListener('change', filterTasks);
    filterPriority.addEventListener('change', filterTasks);
    filterStatus.addEventListener('change', filterTasks);

    // Update Task Status
    taskList.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select') || e.target.classList.contains('task-checkbox')) {
            const li = e.target.closest('li');
            const task = tasks.find(t => t.id === parseInt(li.dataset.id));
            if (task) {
                if (e.target.classList.contains('status-select')) {
                    task.status = e.target.value;
                    task.completed = e.target.value === 'completed';
                } else {
                    task.completed = e.target.checked;
                    task.status = e.target.checked ? 'completed' : 'pending';
                    const statusSelect = li.querySelector('.status-select');
                    statusSelect.value = task.status;
                }
                updateProgress();
            }
        }
    });

    // Delete Task
    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const li = e.target.closest('li');
            const taskId = parseInt(li.dataset.id);
            tasks = tasks.filter(t => t.id !== taskId);
            li.remove();
            updateProgress();
        }
    });

    // Initialize Speech Recognition and Text-to-Speech
    initSpeechRecognition();
    initTextToSpeech();

    // Listen Button
    listenBtn.addEventListener('click', () => {
        recognition.start();
    });

    // Speak Button
    speakBtn.addEventListener('click', () => {
        const text = aiInput.value.trim();
        if (text !== '') {
            speak(text);
        }
    });

    // Initialize with AI greeting
    (async () => {
        const greeting = await sendToAI('Welcome to your AI-Powered To-Do List! How can I help you manage your tasks today?');
        const greetingDiv = document.createElement('div');
        greetingDiv.className = 'ai-message ai-response';
        greetingDiv.textContent = greeting;
        aiMessages.appendChild(greetingDiv);
        speak(greeting);
    })();
});
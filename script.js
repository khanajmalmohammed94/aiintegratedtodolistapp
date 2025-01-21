document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const aiInput = document.getElementById('ai-input');
    const aiSubmit = document.getElementById('ai-submit');
    const aiMessages = document.getElementById('ai-messages');

    const MISTRAL_API_KEY = 'lCbFw7gRU2Fm0olrj2CtM3h3eK22WQGH';
    const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

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
            const suggestion = await sendToAI(`Suggest improvements or next steps for this task: ${taskText}`);

            const li = document.createElement('li');
            li.innerHTML = `
                <div class="task-content">
                    <span class="task-text">${taskText}</span>
                    ${suggestion ? `<div class="task-suggestion">AI Suggestion: ${suggestion}</div>` : ''}
                </div>
                <button class="delete-btn">Delete</button>
            `;
            taskList.appendChild(li);
            taskInput.value = '';
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

            // Get AI response
            const response = await sendToAI(question, 'Current tasks: ' + Array.from(taskList.children).map(li => li.querySelector('.task-text').textContent).join(', '));

            // Remove loading message
            aiMessages.removeChild(loadingDiv);

            // Add AI response
            const aiDiv = document.createElement('div');
            aiDiv.className = 'ai-message ai-response';
            aiDiv.textContent = response;
            aiMessages.appendChild(aiDiv);

            // Clear input
            aiInput.value = '';

            // Scroll to bottom
            aiMessages.scrollTop = aiMessages.scrollHeight;
        }
    });

    // Delete Task
    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            e.target.parentElement.remove();
        }
    });

    // Initialize with AI greeting
    (async () => {
        const greeting = await sendToAI('Welcome to your AI-Powered To-Do List! How can I help you manage your tasks today?');
        const greetingDiv = document.createElement('div');
        greetingDiv.className = 'ai-message ai-response';
        greetingDiv.textContent = greeting;
        aiMessages.appendChild(greetingDiv);
    })();
});
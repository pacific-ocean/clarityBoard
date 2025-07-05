// static/js/script.js v2.0
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const liveClock = document.getElementById('live-clock');
    const board = document.getElementById('board');
    const addTaskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');
    const sortToggle = document.getElementById('sort-toggle');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const warningTimeInput = document.getElementById('warning-time');
    const deadlineInput = document.getElementById('deadline-input');

    // --- State Management ---
    let draggedNote = null;
    let isSortByDeadline = false;
    let warningHours = localStorage.getItem('clarity-board-warning-hours') || 24;
    warningTimeInput.value = warningHours;

    // --- Helper Functions ---
    const getFormattedDateTimeLocal = (date) => {
        const pad = (num) => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // --- Live Clock and Default Time ---
    const updateLiveClock = () => {
        liveClock.textContent = new Date().toLocaleString();
    };

    // Set initial clock time and default for the input
    const now = new Date();
    deadlineInput.value = getFormattedDateTimeLocal(now);
    updateLiveClock();

    // Update the live clock every second
    setInterval(updateLiveClock, 1000);

    // --- API & Rendering ---

    const fetchAndRenderTasks = async () => {
        const sortParam = isSortByDeadline ? '?sort=deadline' : '?sort=position';
        const response = await fetch(`/api/tasks${sortParam}`);
        const tasks = await response.json();
        board.innerHTML = '';
        tasks.forEach(task => {
            const noteElement = createTaskElement(task);
            board.appendChild(noteElement);
        });
        updateAllNoteStates();
    };

    const createTaskElement = (task) => {
        const note = document.createElement('div');
        note.classList.add('note');
        if (task.is_completed) note.classList.add('completed');
        
        note.setAttribute('draggable', !isSortByDeadline); // Story 2: Disable drag if sorted
        note.dataset.taskId = task.id;
        note.dataset.deadline = task.deadline || '';

        const formattedDeadline = task.deadline 
            ? new Date(task.deadline).toLocaleString() 
            : 'No deadline';

        note.innerHTML = `
            <div class="content">${task.content}</div>
            <div>
                <div class="deadline">Due: ${formattedDeadline}</div>
                <div class="actions">
                    <input type="checkbox" class="complete-cb" ${task.is_completed ? 'checked' : ''}>
                    <div>
                        <button class="deadline-btn">📅</button>
                        <button class="delete-btn">🗑️</button>
                    </div>
                </div>
            </div>
        `;
        return note;
    };
    
    // --- Event Listeners ---

    addTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = taskInput.value.trim();
        if (!content) return;

        // Read from the new datetime-local input
        const deadlineValue = deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null;

        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content, deadline: deadlineValue })
        });

        // Clear both inputs after submission
        taskInput.value = '';
        // Reset the deadline input to the current time for the next note
        deadlineInput.value = getFormattedDateTimeLocal(new Date());
        
        fetchAndRenderTasks();
    });
    board.addEventListener('click', async (e) => {
        const note = e.target.closest('.note');
        if (!note) return;
        const taskId = note.dataset.taskId;

        // Delete button
        if (e.target.classList.contains('delete-btn')) {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            note.remove();
            if (!isSortByDeadline) await updateTaskOrder();
        }

        // Checkbox for completion
        if (e.target.classList.contains('complete-cb')) {
            const isCompleted = e.target.checked;
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_completed: isCompleted ? 1 : 0 })
            });
            note.classList.toggle('completed', isCompleted);
            updateNoteState(note); // Re-evaluate warning/overdue state
        }

        // Story 1: Deadline button
        if (e.target.classList.contains('deadline-btn')) {
            const deadlineDisplay = note.querySelector('.deadline');
            const actionsDiv = note.querySelector('.actions');

            // Prevent creating multiple inputs if one is already open
            if (note.querySelector('.temp-deadline-input')) return;

            // Hide the normal display
            actionsDiv.style.display = 'none';
            deadlineDisplay.style.display = 'none';

            // Create a temporary input
            const tempInput = document.createElement('input');
            tempInput.type = 'datetime-local';
            tempInput.classList.add('temp-deadline-input');
            
            // Pre-fill with existing deadline, formatted correctly for the input
            if (note.dataset.deadline) {
                // The value must be in 'YYYY-MM-DDTHH:MM' format.
                // Slice the ISO string to get this format.
                tempInput.value = note.dataset.deadline.slice(0, 16);
            }
            
            // Insert the input into the note
            deadlineDisplay.insertAdjacentElement('afterend', tempInput);
            tempInput.focus();

            // When the input loses focus (blur), save the new value
            tempInput.addEventListener('blur', async () => {
                const newDeadline = tempInput.value ? new Date(tempInput.value).toISOString() : null;
                
                await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deadline: newDeadline })
                });

                // Clean up and re-render to show the new state
                tempInput.remove();
                actionsDiv.style.display = 'flex';
                deadlineDisplay.style.display = 'block';
                fetchAndRenderTasks();
            });
        }    
    });

    // Story 2: Sort Toggle
    sortToggle.addEventListener('change', () => {
        isSortByDeadline = sortToggle.checked;
        fetchAndRenderTasks();
    });
    
    // Story 4: Settings Modal Listeners
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });
    warningTimeInput.addEventListener('change', () => {
        warningHours = warningTimeInput.value;
        localStorage.setItem('clarity-board-warning-hours', warningHours);
        updateAllNoteStates();
    });

    // --- Drag and Drop Logic ---

    board.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('note') && !isSortByDeadline) {
            draggedNote = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    board.addEventListener('dragend', () => {
        if (draggedNote) {
            draggedNote.classList.remove('dragging');
            draggedNote = null;
            if (!isSortByDeadline) updateTaskOrder();
        }
    });

    board.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (isSortByDeadline) return;
        const afterElement = getDragAfterElement(board, e.clientY);
        const draggingNote = document.querySelector('.dragging');
        if (draggingNote) {
            if (afterElement == null) {
                board.appendChild(draggingNote);
            } else {
                board.insertBefore(draggingNote, afterElement);
            }
        }
    });

    const getDragAfterElement = (container, y) => {
        const draggableElements = [...container.querySelectorAll('.note:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    const updateTaskOrder = async () => {
        const orderedIds = [...board.querySelectorAll('.note')].map(note => parseInt(note.dataset.taskId));
        await fetch('/api/tasks/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordered_ids: orderedIds })
        });
    };

    // --- Time-Based State Updates (Stories 3 & 4) ---
    
    const updateNoteState = (note) => {
        note.classList.remove('warning', 'overdue');
        const deadline = note.dataset.deadline;
        const isCompleted = note.classList.contains('completed');

        if (!deadline || isCompleted) return;

        const now = new Date();
        const deadlineDate = new Date(deadline);
        const hoursUntilDeadline = (deadlineDate - now) / (1000 * 60 * 60);

        if (hoursUntilDeadline < 0) {
            note.classList.add('overdue');
        } else if (hoursUntilDeadline <= warningHours) {
            note.classList.add('warning');
        }
    };

    const updateAllNoteStates = () => {
        document.querySelectorAll('.note').forEach(updateNoteState);
    };

    // Check deadlines every minute
    setInterval(updateAllNoteStates, 60000);

    // Initial Load
    fetchAndRenderTasks();
});
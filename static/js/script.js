// static/js/script.js
document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const addTaskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');

    let draggedNote = null;

    // --- API Communication ---

    const fetchAndRenderTasks = async () => {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        board.innerHTML = ''; // Clear board before rendering
        tasks.forEach(task => {
            const noteElement = createTaskElement(task);
            board.appendChild(noteElement);
        });
    };

    const createTaskElement = (task) => {
        const note = document.createElement('div');
        note.classList.add('note');
        if (task.is_completed) {
            note.classList.add('completed');
        }
        note.setAttribute('draggable', 'true');
        note.dataset.taskId = task.id;

        note.innerHTML = `
            <div class="content">${task.content}</div>
            <div class="actions">
                <input type="checkbox" class="complete-cb" ${task.is_completed ? 'checked' : ''}>
                <button class="delete-btn">🗑️</button>
            </div>
        `;
        return note;
    };
    
    // --- Event Listeners ---

    addTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = taskInput.value.trim();
        if (!content) return;

        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
        const newTask = await response.json();
        const noteElement = createTaskElement(newTask);
        board.appendChild(noteElement);
        taskInput.value = '';
    });

    board.addEventListener('click', async (e) => {
        const note = e.target.closest('.note');
        if (!note) return;
        const taskId = note.dataset.taskId;

        // Delete button
        if (e.target.classList.contains('delete-btn')) {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            note.remove();
            // We need to update positions after a delete
            await updateTaskOrder(); 
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
        }
    });

    // --- Drag and Drop Logic ---

    board.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('note')) {
            draggedNote = e.target;
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        }
    });

    board.addEventListener('dragend', (e) => {
        if (draggedNote) {
            draggedNote.classList.remove('dragging');
            draggedNote = null;
            updateTaskOrder();
        }
    });

    board.addEventListener('dragover', (e) => {
        e.preventDefault();
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

    // Initial Load
    fetchAndRenderTasks();
});
# app.py

import sqlite3
from flask import Flask, jsonify, request, render_template, g

app = Flask(__name__)
DATABASE = 'clarity_board.db'

# --- Database Helper Functions ---

def get_db():
    """Connects to the specific database."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        # This allows us to access columns by name
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Closes the database again at the end of the request."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """Initializes the database schema."""
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()
    print("Initialized the database.")

# --- API Endpoints ---

@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Fetches all tasks, ordered by their position."""
    db = get_db()
    cursor = db.execute('SELECT * FROM tasks ORDER BY position ASC')
    tasks = [dict(row) for row in cursor.fetchall()]
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    """Adds a new task."""
    new_task = request.get_json()
    db = get_db()
    
    # Get the highest current position to append the new task
    cursor = db.execute('SELECT MAX(position) as max_pos FROM tasks')
    max_pos = cursor.fetchone()['max_pos']
    new_position = (max_pos or 0) + 1

    cursor = db.execute(
        'INSERT INTO tasks (content, position) VALUES (?, ?)',
        [new_task['content'], new_position]
    )
    db.commit()
    
    new_id = cursor.lastrowid
    created_task = {
        'id': new_id,
        'content': new_task['content'],
        'is_completed': 0,
        'position': new_position
    }
    return jsonify(created_task), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Updates a task, specifically for completion status."""
    update_data = request.get_json()
    db = get_db()
    db.execute(
        'UPDATE tasks SET is_completed = ? WHERE id = ?',
        [update_data['is_completed'], task_id]
    )
    db.commit()
    return jsonify({'message': 'Task updated successfully'})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Deletes a task."""
    db = get_db()
    db.execute('DELETE FROM tasks WHERE id = ?', [task_id])
    db.commit()
    return jsonify({'message': 'Task deleted successfully'})

@app.route('/api/tasks/reorder', methods=['POST'])
def reorder_tasks():
    """Updates the position of all tasks based on a provided list of IDs."""
    data = request.get_json()
    ordered_ids = data.get('ordered_ids', [])
    
    db = get_db()
    # Using a transaction ensures atomicity
    with db:
        for index, task_id in enumerate(ordered_ids):
            db.execute('UPDATE tasks SET position = ? WHERE id = ?', [index, task_id])
    
    return jsonify({'message': 'Tasks reordered successfully'})

# --- CLI Command for Database Initialization ---
def init_db_main():
    """A standalone function to initialize the DB."""
    try:
        conn = sqlite3.connect(DATABASE)
        with open('schema.sql', mode='r') as f:
            conn.cursor().executescript(f.read())
        conn.commit()
        conn.close()
        print("Initialized the database successfully.")
    except Exception as e:
        print(f"An error occurred during DB initialization: {e}")

@app.cli.command('init-db')
def init_db_command():
    """Clear existing data and create new tables."""
    init_db_main()

if __name__ == '__main__':
    # You can now also run `python app.py init` as an alternative
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'init':
        init_db_main()
    else:
        app.run(debug=True)
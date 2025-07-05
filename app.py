# app.py v2.0

import sqlite3
from flask import Flask, jsonify, request, render_template, g

app = Flask(__name__)
DATABASE = 'clarity_board.db'

# --- Database Helper Functions (Unchanged) ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# --- API Endpoints (Updated) ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    # Story 2: Automatic Sorting by Deadline
    sort_by = request.args.get('sort', 'position') # Default to position
    
    if sort_by == 'deadline':
        # Sort by deadline, with NULLs last, then by position
        order_clause = 'CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC, position ASC'
    else:
        # Default sort by manual position
        order_clause = 'position ASC'

    db = get_db()
    cursor = db.execute(f'SELECT * FROM tasks ORDER BY {order_clause}') # Use f-string safely as we control the input
    tasks = [dict(row) for row in cursor.fetchall()]
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    # Story 1: Setting a Deadline (optional)
    new_task = request.get_json()
    content = new_task.get('content')
    deadline = new_task.get('deadline') # Will be None if not provided

    db = get_db()
    cursor = db.execute('SELECT MAX(position) as max_pos FROM tasks')
    max_pos = cursor.fetchone()['max_pos']
    new_position = (max_pos or 0) + 1

    cursor = db.execute(
        'INSERT INTO tasks (content, position, deadline) VALUES (?, ?, ?)',
        [content, new_position, deadline]
    )
    db.commit()
    
    new_id = cursor.lastrowid
    created_task = {
        'id': new_id,
        'content': content,
        'is_completed': 0,
        'position': new_position,
        'deadline': deadline
    }
    return jsonify(created_task), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    # Story 1: Updating Deadline / Completion
    update_data = request.get_json()
    db = get_db()

    # Build the query dynamically based on what's provided
    fields_to_update = []
    values = []
    if 'is_completed' in update_data:
        fields_to_update.append('is_completed = ?')
        values.append(update_data['is_completed'])
    
    if 'deadline' in update_data:
        fields_to_update.append('deadline = ?')
        values.append(update_data['deadline'])

    if not fields_to_update:
        return jsonify({'message': 'No update data provided'}), 400

    query = f"UPDATE tasks SET {', '.join(fields_to_update)} WHERE id = ?"
    values.append(task_id)

    db.execute(query, values)
    db.commit()
    return jsonify({'message': 'Task updated successfully'})

# --- Unchanged Endpoints ---
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    db = get_db()
    db.execute('DELETE FROM tasks WHERE id = ?', [task_id])
    db.commit()
    return jsonify({'message': 'Task deleted successfully'})

@app.route('/api/tasks/reorder', methods=['POST'])
def reorder_tasks():
    data = request.get_json()
    ordered_ids = data.get('ordered_ids', [])
    db = get_db()
    with db:
        for index, task_id in enumerate(ordered_ids):
            db.execute('UPDATE tasks SET position = ? WHERE id = ?', [index, task_id])
    return jsonify({'message': 'Tasks reordered successfully'})

# --- CLI and Main execution (unchanged from our last revision) ---
def init_db_main():
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
    init_db_main()

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'init':
        init_db_main()
    else:
        app.run(debug=True)
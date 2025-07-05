# Clarity Board ✨

Clarity Board is a dynamic, time-aware to-do list web application built with Python, Flask, and Vanilla JavaScript. It moves beyond a simple task list by providing a visual, interactive "corkboard" of poster notes that can be prioritized with drag-and-drop and automatically highlighted based on user-defined deadlines.

This project was built step-by-step with AI assistance, demonstrating a modern workflow for rapid prototyping and development.


*[A screenshot of the Clarity Board interface showing several notes, some with warning/overdue indicators, and the live clock in the corner.]*

---

## 🚀 Features

*   **Create, Edit, and Delete Notes:** Core CRUD functionality for managing your tasks.
*   **Drag & Drop Prioritization:** Intuitively reorder notes by dragging them into your preferred position.
*   **Optional Deadlines:** Add a specific date and time deadline to any note using a native datetime selector.
*   **Time-Aware Visual Alerts:**
    *   **🟡 Warning State:** Notes automatically get a yellow, pulsing glow when their deadline is approaching.
    *   **🔴 Overdue State:** Notes automatically get a red, flashing border once their deadline has passed.
*   **Configurable Warning Time:** A user-defined setting to control how many hours before a deadline the "warning" state appears.
*   **Automatic Sorting:** Toggle between your manual drag-and-drop order and an automatic sort that places the most urgent deadlines first.
*   **Live Clock:** A real-time clock in the header provides constant time awareness.
*   **Persistent Storage:** All tasks and their properties are saved to a local SQLite database, so your data is safe between sessions.

---

## 🛠️ Tech Stack

*   **Backend:** Python 3, Flask
*   **Database:** SQLite
*   **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
*   **Dependencies:**
    *   `Flask`: The only Python package required.

---

## 🏃‍♂️ Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

*   Python 3.6+ and Pip installed on your system.
*   Basic knowledge of the command line.

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd clarity-board
    ```

2.  **Create and activate a virtual environment:**
    *   On macOS/Linux:
        ```sh
        python3 -m venv venv
        source venv/bin/activate
        ```
    *   On Windows:
        ```sh
        python -m venv venv
        .\venv\Scripts\activate
        ```

3.  **Install the required dependencies:**
    ```sh
    pip install -r requirements.txt
    ```

4.  **Initialize the database:**
    This is a critical one-time step that creates the `clarity_board.db` file and the `tasks` table.
    ```sh
    flask --app app init-db
    ```
    You should see the message: `Initialized the database successfully.`

5.  **Run the application:**
    ```sh
    python app.py
    ```

6.  **Open the application in your browser:**
    Navigate to `http://127.0.0.1:5000`

---

## 💻 Usage

*   **Adding a Note:** Type your task in the input field, optionally set a deadline using the datetime selector, and click "Add Note".
*   **Completing a Note:** Click the checkbox on the bottom-left of any note.
*   **Deleting a Note:** Click the trash can icon (`🗑️`) on the bottom-right.
*   **Editing a Deadline:** Click the calendar icon (`📅`). An inline editor will appear. Change the time and click outside the input to save.
*   **Reordering:** Click and drag any note to a new position (disabled when "Sort by Deadline" is active).
*   **Sorting:** Use the "Sort by Deadline" toggle in the header to switch between manual and time-based ordering.
*   **Settings:** Click the gear icon (`⚙️`) to open the settings modal and change the deadline warning period.

---

## 📄 API Endpoints

The backend provides a RESTful API for managing tasks.

| Method | Endpoint                    | Description                                       |
| :----- | :-------------------------- | :------------------------------------------------ |
| `GET`  | `/api/tasks`                | Get all tasks. Can use `?sort=deadline`.          |
| `POST` | `/api/tasks`                | Create a new task.                                |
| `PUT`  | `/api/tasks/<id>`           | Update a task (completion status or deadline).    |
| `DELETE`| `/api/tasks/<id>`          | Delete a specific task.                           |
| `POST` | `/api/tasks/reorder`        | Update the manual position of all tasks.          |

---

## 🔮 Future Enhancements

*   **User Accounts:** Implement user authentication to allow for private, secure boards.
*   **Containerization:** Add a `Dockerfile` for easy deployment and environment consistency.
*   **Calendar View:** A monthly/weekly calendar view to visualize deadlines.
*   **Task Editing:** Allow users to edit the text content of a note after it's been created.

---

## 📜 Owner

Reach out to Prashant Kumar for any support or use of the project.

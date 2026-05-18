# CampusLance Backend

This project now includes a Python Flask backend for authentication and user management.

## Setup & Running

1. **Install Dependencies** (if not already done):
   ```bash
   pip install flask flask-cors flask-bcrypt PyJWT python-dotenv
   ```

2. **Start the Server**:
   ```bash
   python app.py
   ```
   The server will run on `http://127.0.0.1:5000`.

## Features
- **Registration**: Saves user data to a local SQLite database (`campuslance.db`).
- **Login**: Validates credentials and returns a JWT token.
- **Persistence**: User info is stored securely and persists across sessions.
- **Role Support**: Automatically adjusts the dashboard based on the user's role (Freelance/Hire).

## Frontend Integration
The `script.js` has been updated to use the `fetch` API to communicate with the backend. It stores the JWT token in `localStorage` to keep you logged in.

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
import datetime
import os
import sqlite3
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

DB_PATH = 'campuslance.db'
SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key_here')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize Database
def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            projects TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            issues TEXT NOT NULL,
            budget TEXT NOT NULL,
            deadline TEXT,
            status TEXT DEFAULT 'Open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount INTEGER NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    try:
        conn.execute('ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute('ALTER TABLE users ADD COLUMN total_earnings INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute('ALTER TABLE users ADD COLUMN total_spent INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()

init_db()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    if not all([full_name, email, password, role]):
        return jsonify({"error": "Missing fields"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            (full_name, email, hashed_password, role)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "User already exists"}), 400
    finally:
        conn.close()
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    if user and bcrypt.check_password_hash(user['password'], password):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            "token": token,
            "user": {
                "full_name": user['full_name'],
                "email": user['email'],
                "role": user['role']
            }
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/me', methods=['GET'])
def get_me():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Missing token"}), 401
    
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],)).fetchone()
        conn.close()
        
        if user:
            return jsonify({
                "id": user['id'],
                "full_name": user['full_name'],
                "email": user['email'],
                "role": user['role'],
                "balance": user['balance'] if 'balance' in user.keys() else 0,
                "total_earnings": user['total_earnings'] if 'total_earnings' in user.keys() else 0,
                "total_spent": user['total_spent'] if 'total_spent' in user.keys() else 0
            }), 200
        return jsonify({"error": "User not found"}), 404
    except:
        return jsonify({"error": "Invalid token"}), 401

@app.route('/api/wallet/deposit', methods=['POST'])
def deposit():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Missing token"}), 401
    
    try:
        auth_data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        data = request.json
        amount = int(data.get('amount', 0))
        if amount <= 0:
            return jsonify({"error": "Invalid amount"}), 400
            
        conn = get_db_connection()
        conn.execute('UPDATE users SET balance = balance + ? WHERE id = ?', (amount, auth_data['user_id']))
        conn.execute('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
                     (auth_data['user_id'], 'deposit', amount, 'Deposited funds'))
        conn.commit()
        conn.close()
        return jsonify({"message": "Deposit successful"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Deposit failed"}), 400

@app.route('/api/wallet/transfer', methods=['POST'])
def transfer():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Missing token"}), 401
    
    try:
        auth_data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        data = request.json
        amount = int(data.get('amount', 0))
        receiver_id = data.get('receiver_id')
        
        if amount <= 0 or not receiver_id:
            return jsonify({"error": "Invalid request"}), 400
            
        conn = get_db_connection()
        sender = conn.execute('SELECT * FROM users WHERE id = ?', (auth_data['user_id'],)).fetchone()
        
        if sender['balance'] < amount:
            conn.close()
            return jsonify({"error": "Insufficient funds"}), 400
            
        # Deduct from sender
        conn.execute('UPDATE users SET balance = balance - ?, total_spent = total_spent + ? WHERE id = ?', 
                     (amount, amount, auth_data['user_id']))
        # Add to receiver
        conn.execute('UPDATE users SET balance = balance + ?, total_earnings = total_earnings + ? WHERE id = ?', 
                     (amount, amount, receiver_id))
        
        # Log transactions
        conn.execute('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
                     (auth_data['user_id'], 'payment', -amount, f'Paid to user {receiver_id}'))
        conn.execute('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
                     (receiver_id, 'earning', amount, f'Received from user {auth_data["user_id"]}'))
                     
        conn.commit()
        conn.close()
        return jsonify({"message": "Transfer successful"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Transfer failed"}), 400

@app.route('/api/services', methods=['POST'])
def create_service():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Missing token"}), 401
    
    try:
        auth_data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        data = request.json
        
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO services (user_id, title, category, description, projects) VALUES (?, ?, ?, ?, ?)',
            (auth_data['user_id'], data['title'], data['category'], data['description'], data.get('projects', ''))
        )
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Service created successfully"}), 201
    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to create service"}), 401

@app.route('/api/services', methods=['GET'])
def get_services():
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    
    if user_id:
        services = conn.execute('SELECT * FROM services WHERE user_id = ?', (user_id,)).fetchall()
    else:
        services = conn.execute('''
            SELECT s.*, u.full_name as freelancer_name 
            FROM services s 
            JOIN users u ON s.user_id = u.id
        ''').fetchall()
    
    conn.close()
    
    return jsonify([dict(ix) for ix in services]), 200

@app.route('/api/projects', methods=['POST'])
def create_project():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Missing token"}), 401
    
    try:
        auth_data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        data = request.json
        
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO projects (user_id, title, category, issues, budget, deadline) VALUES (?, ?, ?, ?, ?, ?)',
            (auth_data['user_id'], data['title'], data['category'], data['issues'], data['budget'], data.get('deadline', ''))
        )
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Project posted successfully"}), 201
    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to post project"}), 401

@app.route('/api/projects', methods=['GET'])
def get_projects():
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    
    if user_id:
        projects = conn.execute('SELECT * FROM projects WHERE user_id = ?', (user_id,)).fetchall()
    else:
        projects = conn.execute('''
            SELECT p.*, u.full_name as client_name 
            FROM projects p 
            JOIN users u ON p.user_id = u.id
        ''').fetchall()
    
    conn.close()
    
    return jsonify([dict(ix) for ix in projects]), 200

@app.route('/api/messages', methods=['POST'])
def send_message():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Missing token"}), 401
    
    try:
        auth_data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        data = request.json
        
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            (auth_data['user_id'], data['receiver_id'], data['content'])
        )
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Message sent"}), 201
    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to send message"}), 401

@app.route('/api/messages', methods=['GET'])
def get_messages():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Missing token"}), 401
    
    try:
        auth_data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = auth_data['user_id']
        
        conn = get_db_connection()
        messages = conn.execute('''
            SELECT m.*, u1.full_name as sender_name, u2.full_name as receiver_name
            FROM messages m
            JOIN users u1 ON m.sender_id = u1.id
            JOIN users u2 ON m.receiver_id = u2.id
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY m.created_at ASC
        ''', (user_id, user_id)).fetchall()
        conn.close()
        
        return jsonify([dict(ix) for ix in messages]), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to load messages"}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5000)

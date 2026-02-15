from gevent import monkey
monkey.patch_all()

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import boto3
import cv2
import numpy as np
import base64
import math
import mediapipe as mp
import random
import botocore.exceptions 
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask_cors import CORS
load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID')
cognito_client = boto3.client('cognito-idp', region_name='us-east-1')

PICTURE_SHAPES = {
    "House": [(150, 350), (150, 200), (250, 100), (350, 200), (350, 350), (280, 350), (280, 260), (220, 260), (220, 350)],
    "Crown": [(150, 300), (150, 150), (210, 220), (250, 100), (290, 220), (350, 150), (350, 300)],
    "Star": [(320, 50), (370, 180), (500, 180), (400, 260), (430, 400), (320, 320), (210, 400), (240, 260), (140, 180), (270, 180)],
    "Lightning Bolt": [(320, 50), (250, 200), (350, 200), (280, 400), (400, 150), (300, 150)],
    "Arrow": [(200, 250), (400, 250), (400, 150), (550, 300), (400, 450), (400, 350), (200, 350)],
    "Tree": [(300, 400), (340, 400), (340, 300), (450, 300), (320, 100), (190, 300), (300, 300)],
    "Envelope": [(150, 150), (450, 150), (450, 350), (150, 350), (150, 150), (300, 250), (450, 150)],
    "Hourglass": [(200, 100), (400, 100), (200, 400), (400, 400), (200, 100)],
    "Bowtie": [(200, 150), (200, 350), (400, 150), (400, 350), (200, 150)],
    "Mushroom": [(250, 400), (350, 400), (350, 300), (450, 300), (300, 150), (150, 300), (250, 300)],
    "Shield": [(150, 100), (450, 100), (450, 250), (300, 400), (150, 250)],
    "Pyramid": [(100, 350), (300, 100), (500, 350), (300, 350), (300, 100)],
    "Heart": [(300, 150), (350, 100), (450, 100), (450, 200), (300, 350), (150, 200), (150, 100), (250, 100)],
    "Hexagon": [(200, 100), (400, 100), (500, 250), (400, 400), (200, 400), (100, 250)],
    "Fish": [(150, 250), (300, 150), (400, 150), (450, 250), (400, 350), (300, 350), (150, 250), (100, 150), (100, 350)],
    "Umbrella": [(300, 150), (450, 300), (150, 300), (300, 150), (300, 400), (250, 400)],
    "Coffee Cup": [(200, 150), (400, 150), (350, 350), (250, 350), (200, 150), (150, 200), (150, 250), (200, 250)]
}

COLORS = [
    (0, 0, 255), (0, 255, 255), (0, 255, 0), (255, 255, 0), (255, 0, 0),
    (255, 0, 255), (128, 0, 128), (255, 165, 0), (0, 128, 128), (200, 200, 200)
]
HIT_RADIUS = 30

user_game_state = {} 

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the backend"})

def get_table():
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    return dynamodb.Table('users')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/register', methods=['POST'])
def register_user():
    """
    Handles AWS Cognito Signup AND creates the DynamoDB user in one go.
    Requires: password, email, and birthdate.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    password = data.get('password')
    email = data.get('email')
    birthdate = data.get('birthdate') ## YYYY-MM-DD
    name = data.get('name', email.split('@')[0] if email else "User")
    
    if not all([password, email, birthdate]):
        return jsonify({"error": "Missing required fields. Please provide password, email, and birthdate."}), 400

    try:
        cognito_response = cognito_client.sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'birthdate', 'Value': birthdate},
                {'Name': 'name', 'Value': name}
            ]
        )
        
        cognito_user_id = cognito_response['UserSub']
        
        table = get_table()
        table.put_item(Item={
            'user-id': cognito_user_id,
            'email': email,
            'name': name,
            'streak': 0,
            'performance': 0,
            'completed_tasks': [],
            'last_streak_date': '',
            'last_task_date': ''
        })
        
        return jsonify({
            "message": "User created in Cognito and Database successfully!",
            "user_id": cognito_user_id
        }), 201

    except botocore.exceptions.ClientError as error:
        error_code = error.response['Error']['Code']
        if error_code == 'InvalidPasswordException':
            return jsonify({"error": "Password does not meet requirements"}), 400
        elif error_code == 'InvalidParameterException':
             return jsonify({"error": f"Invalid parameter: {error.response['Error']['Message']}"}), 400
        else:
            return jsonify({"error": error.response['Error']['Message']}), 500
    except Exception as e:
         return jsonify({"error": str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify_user():
    """
    Confirms the user's email using the code sent by AWS Cognito.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    email = data.get('email')
    code = data.get('code')
    
    if not all([email, code]):
        return jsonify({"error": "Missing email or verification code"}), 400

    try:
        cognito_client.confirm_sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=email,
            ConfirmationCode=code
        )
        return jsonify({"message": "User verified successfully! You can now sign in."}), 200

    except botocore.exceptions.ClientError as error:
        return jsonify({"error": error.response['Error']['Message']}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login_user():
    print("=== LOGIN ROUTE HIT ===", flush=True)
    data = request.get_json()
    print(f"Data received: {data}", flush=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({"error": "Missing email or password"}), 400

    try:
        print("=== CHECKING DATABASE ===", flush=True)
        response = cognito_client.initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )
        print("=== DATABASE CHECK COMPLETE ===", flush=True)
        
        # FIX 1: Safely handle Cognito "Challenges" (like forcing a password reset)
        if 'ChallengeName' in response:
            return jsonify({"error": f"AWS Challenge Required: {response['ChallengeName']}. User may be unconfirmed."}), 403

        # FIX 2: Safely extract the Access Token
        auth_result = response.get('AuthenticationResult')
        if not auth_result:
            return jsonify({"error": "Failed to retrieve authentication tokens."}), 500
            
        access_token = auth_result['AccessToken']
        
        # Get the UserSub safely
        user_response = cognito_client.get_user(AccessToken=access_token)
        user_sub = next(attr['Value'] for attr in user_response['UserAttributes'] if attr['Name'] == 'sub')
        
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user_id": user_sub
        }), 200

    except botocore.exceptions.ClientError as error:
        error_code = error.response['Error']['Code']
        # FIX 3: Catch specific AWS errors so the frontend knows exactly what went wrong
        if error_code == 'UserNotConfirmedException':
            return jsonify({"error": "Please confirm your email address before logging in."}), 400
        elif error_code == 'NotAuthorizedException':
            return jsonify({"error": "Incorrect email/password OR 'ALLOW_USER_PASSWORD_AUTH' is disabled in AWS."}), 400
        else:
            return jsonify({"error": error.response['Error']['Message']}), 400
            
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route('/get-user-stats', methods=['POST'])
def get_user_stats():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    user_id = data.get('user-id')
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    table = get_table()
    try:
        response = table.get_item(Key={'user-id': user_id})
        if 'Item' in response:
            item = response['Item']
            streak = item.get('streak', 0)
            last_streak_date_str = item.get('last_streak_date', '')
            today = datetime.now().date()
            yesterday = today - timedelta(days=1)
            
            # Reset streak if missed a day
            if last_streak_date_str:
                last_streak_date = datetime.strptime(last_streak_date_str, '%Y-%m-%d').date()
                if last_streak_date < yesterday:
                    streak = 0
                    table.update_item(
                        Key={'user-id': user_id},
                        UpdateExpression="SET streak = :s",
                        ExpressionAttributeValues={':s': 0}
                    )
                    item['streak'] = 0

            # Ensure completed_tasks is a list for JSON serialization (handles legacy sets)
            if 'completed_tasks' in item and isinstance(item['completed_tasks'], set):
                item['completed_tasks'] = list(item['completed_tasks'])
            elif 'completed_tasks' not in item:
                item['completed_tasks'] = []

            return jsonify(item), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/increase-streak', methods=['POST'])
def increase_streak():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    user_id = data.get('user-id')
    task = data.get('task')
    if not user_id or not task:
        return jsonify({"error": "Missing user_id or task"}), 400

    table = get_table()
    try:
        # Get current user state
        user_res = table.get_item(Key={'user-id': user_id})
        if 'Item' not in user_res:
             return jsonify({"error": "User not found"}), 404
        
        user = user_res['Item']
        today = datetime.now().date()
        today_str = today.strftime('%Y-%m-%d')
        yesterday = today - timedelta(days=1)
        yesterday_str = yesterday.strftime('%Y-%m-%d')

        last_task_date = user.get('last_task_date', '')
        completed_tasks_list = user.get('completed_tasks', [])
        completed_tasks = set(completed_tasks_list)
        streak = user.get('streak', 0)
        last_streak_date = user.get('last_streak_date', '')

        # If it's a new day, clear completed tasks
        if last_task_date != today_str:
            completed_tasks = set()
            last_task_date = today_str
        
        # Add current task
        completed_tasks.add(task)

        message = f"Task {task} recorded."
        new_streak = streak

        # Check if all 5 unique tasks are completed and not already updated today
        if len(completed_tasks) >= 5 and last_streak_date != today_str:
            if last_streak_date == yesterday_str:
                new_streak += 1
            else:
                new_streak = 1
            last_streak_date = today_str
            message = "All tasks completed! Streak increased."

        # Update database - saving completed_tasks as a list
        table.update_item(
            Key={'user-id': user_id},
            UpdateExpression="SET completed_tasks = :ct, last_task_date = :ltd, streak = :s, last_streak_date = :lsd",
            ExpressionAttributeValues={
                ':ct': list(completed_tasks),
                ':ltd': last_task_date,
                ':s': new_streak,
                ':lsd': last_streak_date
            }
        )

        return jsonify({"message": message, "new_streak": new_streak, "completed_tasks": list(completed_tasks)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/reset-streak', methods=['POST'])
def reset_streak():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    user_id = data.get('user-id')
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    table = get_table()
    try:
        response = table.update_item(
            Key={'user-id': user_id},
            UpdateExpression="SET streak = :val, last_streak_date = :lsd, completed_tasks = :ct",
            ExpressionAttributeValues={':val': 0, ':lsd': '', ':ct': []},
            ReturnValues="UPDATED_NEW"
        )
        return jsonify({"message": "Streak reset", "new_streak": response['Attributes']['streak']}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@socketio.on('process_frame')
def handle_frame(data):
    try:
        image_data = data.get('image')
        user_id = data.get('user_id', 'anonymous')

        if not image_data:
            return

        header, encoded = image_data.split(",", 1)
        decoded = base64.b64decode(encoded)
        np_arr = np.frombuffer(decoded, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        img = cv2.flip(img, 1) 
        h, w, c = img.shape

        if user_id not in user_game_state:
            user_game_state[user_id] = {
                'progress': 0,
                'shape_name': random.choice(list(PICTURE_SHAPES.keys()))
            }
            
        current_node_idx = user_game_state[user_id]['progress']
        current_shape = PICTURE_SHAPES[user_game_state[user_id]['shape_name']]
        game_completed = current_node_idx >= len(current_shape)

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)

        finger_pos = None
        if results.multi_hand_landmarks and not game_completed:
            for hand_landmarks in results.multi_hand_landmarks:
                idx_finger = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                finger_pos = (int(idx_finger.x * w), int(idx_finger.y * h))
                
                cv2.circle(img, finger_pos, 10, (255, 0, 255), cv2.FILLED)

                target_node = current_shape[current_node_idx]
                dist = math.dist(finger_pos, target_node)
                
                if dist < HIT_RADIUS:
                    user_game_state[user_id]['progress'] += 1
                    current_node_idx += 1
                break

        for i in range(1, current_node_idx):
            color = COLORS[(i-1) % len(COLORS)]
            cv2.line(img, current_shape[i-1], current_shape[i], color, 4)

        shape_name = user_game_state[user_id]['shape_name']

        if not game_completed:
            if current_node_idx > 0 and finger_pos:
                active_color = COLORS[current_node_idx % len(COLORS)]
                cv2.line(img, current_shape[current_node_idx-1], finger_pos, active_color, 2)

            for i in range(current_node_idx, len(current_shape)):
                node = current_shape[i]
                color = COLORS[i % len(COLORS)] if i == current_node_idx else (200, 200, 200)
                cv2.circle(img, node, 15, color, cv2.FILLED)
                cv2.putText(img, str(i+1), (node[0]-10, node[1]+5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        else:
            final_color = COLORS[-1 % len(COLORS)]
            cv2.line(img, current_shape[-1], current_shape[0], final_color, 4)

        _, buffer = cv2.imencode('.jpg', img)
        processed_base64 = base64.b64encode(buffer).decode('utf-8')
        
        emit('frame_result', {
            'image': f"data:image/jpeg;base64,{processed_base64}",
            'status': 'completed' if game_completed else 'playing',
            'progress': current_node_idx,
            'shape_name': shape_name,
            'message': f"You drew a {shape_name.upper()}!" if game_completed else "" 
        })
        
    except Exception as e:
        emit('cv_error', {'error': str(e)})

@socketio.on('reset_game')
def handle_reset(data):
    user_id = data.get('user_id', 'anonymous')
    user_game_state[user_id] = {
        'progress': 0,
        'shape_name': random.choice(list(PICTURE_SHAPES.keys()))
    }
    print(f"Game state reset for user: {user_id}")
    emit('status_update', {'message': 'Game reset successfully'})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5050)
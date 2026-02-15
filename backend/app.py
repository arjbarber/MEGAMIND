from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import boto3
import cv2
import numpy as np
import base64
import math
import mediapipe as mp
import random

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

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

@app.route('/create-user', methods=['POST'])
def create_user():
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    user_id = data.get('user-id')
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    
    table = get_table()
    response = table.get_item(Key={'user-id': user_id})
    if 'Item' in response:
        return jsonify({"error": "User already exists"}), 400
    try:
        table = get_table()
        table.put_item(Item={
            'user-id': user_id,
            'streak': 0,
            'performance': 0
        })
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/increase-streak', methods=['POST'])
def increase_streak():
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
            UpdateExpression="ADD streak :val",
            ExpressionAttributeValues={':val': 1},
            ReturnValues="UPDATED_NEW"
        )
        return jsonify({"message": "Streak increased", "new_streak": response['Attributes']['streak']}), 200
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
            UpdateExpression="SET streak = :val",
            ExpressionAttributeValues={':val': 0},
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
            
            shape_name = user_game_state[user_id]['shape_name'].upper()
            cv2.putText(img, f"YOU DREW A {shape_name}!", (50, h//2), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)

        _, buffer = cv2.imencode('.jpg', img)
        processed_base64 = base64.b64encode(buffer).decode('utf-8')
        
        emit('frame_result', {
            'image': f"data:image/jpeg;base64,{processed_base64}",
            'status': 'completed' if game_completed else 'playing',
            'progress': current_node_idx
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
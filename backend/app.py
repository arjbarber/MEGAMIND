from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import boto3
import cv2
import numpy as np
import base64
import math
import mediapipe as mp

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.7, min_tracking_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

SHAPE_NODES = [(100, 100), (300, 100), (300, 300), (100, 300)] 
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
        user_id = data.get('user_id', 'anonymous') # Fallback if missing

        if not image_data:
            return

        # 1. Decode the image
        header, encoded = image_data.split(",", 1)
        decoded = base64.b64decode(encoded)
        np_arr = np.frombuffer(decoded, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        # Mirror image for natural interaction
        img = cv2.flip(img, 1) 
        h, w, c = img.shape

        # Initialize user state if they are new
        if user_id not in user_game_state:
            user_game_state[user_id] = 0
            
        current_node_idx = user_game_state[user_id]
        game_completed = current_node_idx >= len(SHAPE_NODES)

        # 2. Process Hand Tracking
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)

        finger_pos = None
        if results.multi_hand_landmarks and not game_completed:
            for hand_landmarks in results.multi_hand_landmarks:
                # Get Index Finger Tip (Landmark 8 in MediaPipe)
                idx_finger = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                finger_pos = (int(idx_finger.x * w), int(idx_finger.y * h))
                
                # Draw a dot on the finger
                cv2.circle(img, finger_pos, 10, (255, 0, 255), cv2.FILLED)

                # Check if finger touches the current target node
                target_node = SHAPE_NODES[current_node_idx]
                dist = math.dist(finger_pos, target_node)
                
                if dist < HIT_RADIUS:
                    user_game_state[user_id] += 1
                    current_node_idx += 1
                break # Just track one hand for simplicity

        # 3. Draw the Game State
        # Draw all completed lines
        for i in range(1, current_node_idx):
            cv2.line(img, SHAPE_NODES[i-1], SHAPE_NODES[i], (0, 255, 0), 3)

        if not game_completed:
            # Draw a line from last connected node to the finger
            if current_node_idx > 0 and finger_pos:
                cv2.line(img, SHAPE_NODES[current_node_idx-1], finger_pos, (255, 0, 0), 2)

            # Draw the remaining nodes and number them
            for i in range(current_node_idx, len(SHAPE_NODES)):
                node = SHAPE_NODES[i]
                color = (0, 0, 255) if i == current_node_idx else (200, 200, 200)
                cv2.circle(img, node, 15, color, cv2.FILLED)
                cv2.putText(img, str(i+1), (node[0]-10, node[1]+5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        else:
            # Game Finished! Draw final closing line and completion text
            cv2.line(img, SHAPE_NODES[-1], SHAPE_NODES[0], (0, 255, 0), 3)
            cv2.putText(img, "COMPLETED!", (w//2 - 100, h//2), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)

        # 4. Encode and send back
        _, buffer = cv2.imencode('.jpg', img)
        processed_base64 = base64.b64encode(buffer).decode('utf-8')
        
        emit('frame_result', {
            'image': f"data:image/jpeg;base64,{processed_base64}",
            'status': 'completed' if game_completed else 'playing',
            'progress': current_node_idx
        })
        
    except Exception as e:
        emit('cv_error', {'error': str(e)})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5050)
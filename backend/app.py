from flask import Flask, jsonify, request
import boto3

app = Flask(__name__)
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('YourTableName')

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)
from flask import Flask, jsonify, request
import boto3

app = Flask(__name__)
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('YourTableName')

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the backend"})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/create/user', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    user_id = data.get('user-id')
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    
    table = dynamodb.Table('users')
    try:
        table.put_item(Item={'user-id': user_id, 'streak': 0})
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)
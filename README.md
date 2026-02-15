# MEGAMIND

## About the Project
[Insert your project description here]

## Project Structure

The project consists of two main components:
- **Backend**: A Flask-based server (Port 5050) handling hand tracking (MediaPipe), user authentication (AWS Cognito), and data storage (AWS DynamoDB).
- **Frontend**: A React application (Port 5173) featuring 3D visualizations and real-time communication.

## Technologies Used

### Frontend
- **React 19** with **TypeScript**
- **Vite** (Build tool)
- **Three.js** & **@react-three/fiber** (3D Brain Visualization)
- **Socket.io-client** (Real-time hand tracking data)
- **React Router** (Navigation)

### Backend
- **Python 3**
- **Flask** & **Flask-SocketIO**
- **MediaPipe** (Hand tracking and gesture recognition)
- **OpenCV** (Image processing)
- **Boto3** (AWS SDK for Cognito and DynamoDB)
- **Gevent** (Asynchronous server)


---

## Deployment

The frontend is configured for deployment on **Vercel**. Visit the [MEGAMIND!](https://megamind-lac.vercel.app/) website and create an account today!

# MEGAMIND!

## About the Project
With the global prevalence of dementia rising, we wanted to create a solution that goes beyond passive care. We were inspired by research into neuroplasticity which is the brain's ability to reorganize itself. We looked to build a tool that actively stimulates the specific regions most affected by cognitive decline.

**MEGAMIND!** is a cognitive therapy platform designed to mitigate the effects of dementia. By utilizing targeted exercises, the application focuses on stimulating key areas of the brain proven to foster cognitive resilience and neuroplasticity, providing users with a proactive way to manage their brain health.

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

# Meeting Assistant
Meeting Assistant is an AI-powered app that helps you capture, analyze, and act on your meeting insights effortlessly. This mobile application streamlines your meeting activities by providing smart task management, and meeting summaries.

## Features
- **AI-powered Transcription**: Automatically transcribe your meetings to capture every important detail
- **Smart Summaries**: Generate concise summaries of your meetings to quickly understand key points
- **Task Extraction**: Automatically identify and track action items from your meetings
- **Task Management**: Edit, prioritize, and track tasks to ensure follow-through
- **Dark UI**: Clean, modern interface designed for readability and usability
- 
## Technology Stack
- React Native
- Expo
- Firebase (Authetication & Firestone)
- Nebius AI Studio (LLaMA-3.3-70B-Instruct-fast)
- HuggingFace (Whisper Large V3)
  
## Getting Started

### PRerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Firebase account
- Nebius AI Studio API key
- HuggingFace API key
  
### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/meeting-assistant.git
cd meeting-assistant
```
2. Install dependencies
```bash
npm install -r requirements.txt
```
3. Create a .env file in the root directory with your API keys
```bash
HUGGINGFACE_API_KEY=yor_huggingface_api_key
NEBIUS_API_KEY=yor_nebius_api_key
FIREBASE_API_KEY=yor_firebase_api_key
FIREBASE_AUTH_DOMAIN=-yor_firebase_auth_domain
FIREBASE_PROJECT_ID=yor_firebase_project_id
FIREBASE_STORAGE_BUCKET=yor_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=yor_firebase_messaging_sender_id
FIREBASE_APP_ID=yor_firebase_app_id
FIREBASE_MEASUREMENT_ID=yor_firebase_measurement_id
```
4. Start the development server
```bash
npx expo start
```
5. Run on your device using Expo Go app by scanning the QR code

### Usage
1. **Sign Up**: Use your fullname, email and password to sign up
2. **Record Meeting or Upload Transcript**: Start recording your meeting or upload a transcript
3. **View Summary**: After processing, view the AI-generated summary
4. **Manage Tasks**: View, edit, and prioritize extracted tasks
5. **Track Progress**: Mark tasks as complete as you work through them

### Project Structure
- ```/screens```: Main application screens
- ```/components```: Reusable UI components
- ```/services```: API services and utilities
- ```/assets```: Images and other static assets

### Demo
https://drive.google.com/file/d/1DTdMJPZMrhaewE4YCiH3NRbE63-kAXxp/view?usp=sharing

### Author
- **Aniket Patel**

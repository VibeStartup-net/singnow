# SingNow - Open Source Karaoke Party App

SingNow is a collaborative karaoke application that allows a host to run a karaoke session while guests add songs to the queue from their own devices.

## Features

- **Host View**: Plays YouTube karaoke videos, manages the queue, and shows a QR code for guests to join.
- **Guest View**: Guests scan the QR code to join, search for songs using the YouTube API, and add them to the shared queue.
- **Real-time Sync**: Powered by Firebase Firestore for instant updates across all devices.

## Prerequisites

- Node.js (v18 or later recommended)
- A Firebase project
- A YouTube Data API keys

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/singnow.git
    cd singnow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Copy the example environment file and fill in your credentials.
    ```bash
    cp .env.example .env
    ```
    
    Edit `.env` and add your:
    - Firebase configuration keys (found in your Firebase Console > Project Settings)
    - YouTube Data API Key (enable YouTube Data API v3 in Google Cloud Console)

4.  **Run the application:**
    ```bash
    npm run dev
    ```

## Firebase Setup

1.  Create a project at [console.firebase.google.com](https://console.firebase.google.com/).
2.  Enable **Authentication** (Anonymous auth is sufficient for guests, Email/Password for hosts).
3.  Enable **Firestore Database**.
4.  Copy your web app config into the `.env` file.

## Security Note

Ensure your API keys are restricted:
- **Firebase API Key**: Restrict to your domain.
- **YouTube API Key**: Restrict to your domain and the YouTube Data API v3 service.

## License

MIT

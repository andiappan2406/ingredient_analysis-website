# FoodGuardian AI - Personalized Food Ingredient Analyzer

FoodGuardian AI is a premium, client-side serverless application that analyzes food ingredients based on a user's health profile.

## 🚀 Features
- **Split-Pane Dashboard**: Clean and modern side-by-side view where you can edit ingredients on the left and see results updated in real-time on the right.
- **Client-Side AI Service**: Operates 100% serverless by making requests directly to a public AI service.
- **Camera Scanning & Uploads**: Uses Tesseract.js directly in the browser to extract text from packaging labels.
- **Persisted Search History**: Keeps a log of the last 20 scans in your browser's local storage.
- **Additive Dictionary**: A quick search guide for common food additives and coloring agents.
- **Premium Themes**: Smooth transitions between Light and Dark modes.

## 🛠️ Run Locally

This app is completely serverless. You only need to run a static file server to launch it:

1. **Option 1: Live Server (VS Code)**
   - Open this directory in VS Code.
   - Click "Go Live" in the bottom-right status bar.

2. **Option 2: Simple HTTP Server**
   - Run in your terminal:
     ```bash
     npx serve
     # or
     python3 -m http.server 8000
     ```
   - Open the URL shown in your browser.

# Script Automation Backend 🚀

A modern, web-based dashboard for managing, executing, and scheduling Python scripts.

## ✨ Features
- **Modern Dashboard**: Sleek glassmorphism UI for clear script management.
- **One-Click Execution**: Run individual scripts or batch execute multiple selected scripts.
- **Scheduling**: Built-in support for Cron-based automated tasks.
- **Real-time Logs**: View live output from your running scripts directly in the browser.
- **Custom Parameters**: Pass dynamic arguments to your scripts at runtime.
- **Dynamic Management**: Easily add, edit, or remove scripts and their configurations.

## 🛠️ Technology Stack
- **Backend**: Python, FastAPI, APScheduler
- **Frontend**: Vanilla HTML5/CSS3, Javascript (Lucide Icons)

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Installed dependencies:
  ```bash
  pip install fastapi uvicorn apscheduler pydantic
  ```

### 2. Run the Dashboard
```bash
python run.py
```
Visit `http://localhost:8000` in your browser.

## 📂 Project Structure
This project follows a professional Python package structure:
```text
├── app/                  # Core application package
│   ├── main.py           # API and lifecycle
│   ├── core/             # Execution and scheduling engines
│   └── models/           # Data schemas
├── static/               # Web dashboard (HTML/CSS/JS)
├── data/                 # Local configuration (Git ignored)
├── run.py                # Development entry point
└── requirements.txt      # Project dependencies
```

## 📝 Configuration
Scripts are stored in `data/scripts.json`. The dashboard allows you to manage these through the UI.
Example configuration:
```json
{
    "id": "rss-summarizer",
    "name": "RSS Summarizer",
    "path": "C:\\path\\to\\your\\script.py",
    "params": "--env prod",
    "schedule": "0 12 * * *",
    "enabled": true
}
```

## 📝 License
MIT

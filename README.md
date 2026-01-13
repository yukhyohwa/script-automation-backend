# Script Automation Backend 🚀

A modern, web-based dashboard for managing, executing, and scheduling Python scripts.

## ✨ Features
- **Japanese Aesthetic UI**: Sleek, minimalist Japanese-style design for a premium experience.
- **One-Click Execution**: Run individual scripts or batch execute multiple selected scripts.
- **Scheduling**: Built-in support for Cron-based automated tasks.
- **Real-time Logs**: View live output from your running scripts directly in the browser.
- **Report Management**: Browse and view generated reports/outputs for each script.
- **Dynamic Management**: Easily add, edit (soft-delete supported), or remove scripts through the UI.

## 🛠️ Technology Stack
- **Backend**: Python, FastAPI, APScheduler
- **Frontend**: Vanilla HTML5/CSS3 (Japanese Minimalist Theme), Javascript (Lucide Icons)

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Installed dependencies:
  ```bash
  pip install -r requirements.txt
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
Scripts are managed directly through the dashboard UI. Configuration is stored locally in `data/scripts.json`.

## 📝 License
MIT


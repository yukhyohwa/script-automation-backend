import json
scripts = [
    {
        "id": "rss-news-summarizer",
        "name": "RSS News Summarizer",
        "path": "C:\\Users\\5xgames\\Desktop\\github\\rss-news-summarizer\\main.py",
        "params": "",
        "schedule": "12",
        "report_dir": "C:\\Users\\5xgames\\Desktop\\github\\rss-news-summarizer\\output",
        "enabled": True
    },
    {
        "id": "arb-market-scanner",
        "name": "Arb Market Scanner",
        "path": "C:\\Users\\5xgames\\Desktop\\github\\arb-market-scanner\\main.py",
        "params": "",
        "schedule": "12",
        "report_dir": "C:\\Users\\5xgames\\Desktop\\github\\arb-market-scanner\\output",
        "enabled": True
    },
    {
        "id": "5x Sentiment Analysis",
        "name": "",
        "path": "C:\\Users\\5xgames\\Desktop\\github\\fivecross-sentiment-analysis\\main.py",
        "params": "",
        "schedule": "",
        "report_dir": "",
        "enabled": True
    },
    {
        "id": "Alicloud Client",
        "name": "",
        "path": "C:\\Users\\5xgames\\Desktop\\github\\fivecross-sentiment-analysis\\main.py",
        "params": "--env overseas --engine odps --sql_file my_query.sql",
        "schedule": "",
        "report_dir": "",
        "enabled": True
    }
]
with open('data/scripts.json', 'w', encoding='utf-8') as f:
    json.dump(scripts, f, indent=4, ensure_ascii=False)
print("Updated scripts.json")

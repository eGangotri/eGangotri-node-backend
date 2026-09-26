@echo off
wt -w 0 new-tab --title "react-dashboard" -d "C:\ws\egangotri-react-dashboard" cmd /k "pnpm run start" ; new-tab --title "node-backend" -d "C:\ws\egangotri-node-backend" cmd /k "pnpm run upload_db" ; new-tab --title "python" -d "C:\ws\egangotri-python" cmd /k "python -m uvicorn src.main:app --host 0.0.0.0 --port 7000 --timeout-keep-alive 18000"

import re

with open('frontend/src/pages/NurseDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "window.location.reload();",
    "await fetchData();"
)

with open('frontend/src/pages/NurseDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

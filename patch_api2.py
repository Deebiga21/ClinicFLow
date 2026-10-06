import sys
with open('frontend/src/services/api.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("getDashboardOverview: () => fetchWithHandler('/nurse/dashboard'),", "getDashboardOverview: () => fetchWithHandler('/admin/dashboard'),")

with open('frontend/src/services/api.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')

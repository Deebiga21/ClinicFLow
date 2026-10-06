import re

with open('frontend/src/pages/nurse/NurseMedicine.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('setInventory(Array.isArray(invData) ? invData : []);', 'setInventory(invData?.data || []);')
content = content.replace('setExpiryRisks(Array.isArray(expiryData) ? expiryData : []);', 'setExpiryRisks(expiryData?.data || []);')
content = content.replace('setDemandForecast(demandData);', 'setDemandForecast(demandData?.data || demandData);')

with open('frontend/src/pages/nurse/NurseMedicine.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

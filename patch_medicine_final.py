import re

with open('frontend/src/pages/nurse/NurseMedicine.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('setInventory(invData?.data || []);', 'setInventory(Array.isArray(invData) ? invData : []);')
content = content.replace('setExpiryRisks(expiryData?.data || []);', 'setExpiryRisks(Array.isArray(expiryData) ? expiryData : []);')
content = content.replace('setDemandForecast(demandData?.data || demandData);', 'setDemandForecast(demandData);')

with open('frontend/src/pages/nurse/NurseMedicine.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

import re
content = open('core_backend/services/admin_service.py', encoding='utf-8').read()
content = content.replace('"name": d.name,', '"name": d.name,\n                    "department": d.department or "General",')
open('core_backend/services/admin_service.py', 'w', encoding='utf-8').write(content)

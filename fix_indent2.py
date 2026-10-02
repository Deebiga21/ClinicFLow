with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("                        return {", "            return {")
content = content.replace("                \"patients_today\"", "                \"patients_today\"")

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

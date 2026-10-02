import re

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix indent
content = content.replace("            return {", "            return {") # no wait, maybe it was 12 spaces, wait... let me just use textwrap.dedent and properly indent

def fix_indent(text):
    lines = text.split('\n')
    fixed = []
    for line in lines:
        if line.startswith('return {'):
            fixed.append('            return {')
        elif line.startswith('"patients_today"'):
            fixed.append('                "patients_today": patients_today,')
        else:
            fixed.append(line)
    return '\n'.join(fixed)

with open(r'd:\clinic-queue -updated\core_backend\services\admin_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

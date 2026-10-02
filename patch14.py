import os
import glob
import re

directory = 'frontend/src/pages/admin'

for filepath in glob.glob(os.path.join(directory, '*.jsx')):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # Replace `.catch(() => ({ data: null }))` with `.catch(() => null)`
    content = re.sub(r'\.catch\(\s*\(\)\s*=>\s*\{\s*data:\s*null\s*\}\s*\)', '.catch(() => null)', content)
    content = re.sub(r'\.catch\(\s*\(\)\s*=>\s*\(\{\s*data:\s*null\s*\}\)\s*\)', '.catch(() => null)', content)
    
    # Replace `.catch(() => ({ data: [] }))` with `.catch(() => [])`
    content = re.sub(r'\.catch\(\s*\(\)\s*=>\s*\{\s*data:\s*\[\]\s*\}\s*\)', '.catch(() => [])', content)
    content = re.sub(r'\.catch\(\s*\(\)\s*=>\s*\(\{\s*data:\s*\[\]\s*\}\)\s*\)', '.catch(() => [])', content)
    
    # Fix the setters
    # e.g., setAnomalies(response.data); -> setAnomalies(response);
    content = re.sub(r'(set[A-Za-z0-9_]+)\(([A-Za-z0-9_]+)\.data\)', r'\1(\2)', content)

    # Some variables are destructured or have different names, but `.data` on variables in these files mostly come from API responses.
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")

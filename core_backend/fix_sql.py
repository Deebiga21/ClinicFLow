import re
from pathlib import Path

def wrap_text(file_path):
    p = Path(file_path)
    content = p.read_text(encoding='utf-8')
    
    if "from sqlalchemy import text" not in content:
        content = "from sqlalchemy import text\n" + content
        
    # Replace single line f-strings or strings inside execute
    # session.execute("...") -> session.execute(text("..."))
    # Also multiline f-strings: session.execute(f"""...""") -> session.execute(text(f"""..."""))
    
    # We will just do a simple regex for session.execute( ... )
    # A bit dangerous, so let's be careful.
    
    # Let's do it manually line by line or with a safer regex.
    new_lines = []
    lines = content.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        if 'session.execute(' in line:
            # find the opening parenthesis of execute(
            idx = line.find('session.execute(') + len('session.execute(')
            # insert `text(`
            line = line[:idx] + 'text(' + line[idx:]
            
            # Now we need to find the matching closing parenthesis for execute.
            # It could be on the same line or multiple lines down.
            # But wait, python AST is safer.
            
        new_lines.append(line)
        i += 1
    
    # Actually, simpler regex:
    # session.execute(f" -> session.execute(text(f"
    # session.execute(f""" -> session.execute(text(f"""
    # session.execute(" -> session.execute(text("
    # And then we need an extra closing parens.
    pass

# Better approach: I'll just use a small python AST transformer or do it with simple regex since I know the exact formats.

def fix_file(file_path):
    text = Path(file_path).read_text(encoding='utf-8')
    
    if "from sqlalchemy import text" not in text:
        text = "from sqlalchemy import text\n" + text
        
    text = re.sub(r'session\.execute\((f?""")', r'session.execute(text(\1', text)
    text = re.sub(r'session\.execute\((f?".*?")\)', r'session.execute(text(\1))', text)
    
    # For multiline """ ... """ we inserted text( but didn't close it!
    # The multiline ones in orchestration.py all end with:
    # """)
    text = text.replace('""")\n', '"""))\n')
    text = text.replace('""")', '"""))')
    
    Path(file_path).write_text(text, encoding='utf-8')

fix_file('main.py')
fix_file('services/orchestration.py')
print("Fixed!")

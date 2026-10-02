from pathlib import Path
p = Path('services/orchestration.py')
t = p.read_text(encoding='utf-8')
t = t.replace('""")))', '"""))')
p.write_text(t, encoding='utf-8')

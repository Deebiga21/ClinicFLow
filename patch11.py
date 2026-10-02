with open('e2e_test.py', 'r') as f:
    text = f.read()

text = text.replace('para["stock"]', 'para["quantity"]')

with open('e2e_test.py', 'w') as f:
    f.write(text)

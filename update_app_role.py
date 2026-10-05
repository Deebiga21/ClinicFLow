with open(r"d:\ClinicFLow\frontend\src\App.jsx", "r") as f:
    content = f.read()

content = content.replace("user.role === 'admin' || user.role === 'staff'", "user.role === 'admin' || user.role === 'staff' || user.role === 'nurse'")

with open(r"d:\ClinicFLow\frontend\src\App.jsx", "w") as f:
    f.write(content)

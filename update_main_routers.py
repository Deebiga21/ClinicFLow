with open(r"d:\ClinicFLow\core_backend\main.py", "r") as f:
    content = f.read()

if "from routers import auth, payments" not in content:
    content = content.replace("from routers import chat, operational, predictions", "from routers import chat, operational, predictions, auth, payments")
    content = content.replace("app.include_router(chat.router)", "app.include_router(chat.router)\napp.include_router(auth.router)\napp.include_router(payments.router)")

with open(r"d:\ClinicFLow\core_backend\main.py", "w") as f:
    f.write(content)
print("Updated main routers")

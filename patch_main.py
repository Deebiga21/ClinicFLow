
with open("core_backend/main.py", "r") as f:
    lines = f.readlines()
with open("core_backend/main.py", "w") as f:
    for line in lines:
        if "from routers.chat import router as chat_router" in line:
            f.write(line)
            f.write("from routers.billing_notify import router as billing_router\n")
        elif "app.include_router(chat_router)" in line:
            f.write(line)
            f.write("app.include_router(billing_router)\n")
        else:
            f.write(line)


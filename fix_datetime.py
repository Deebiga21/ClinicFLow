import re
with open(r"d:\ClinicFLow\core_backend\services\admin_service.py", "r") as f:
    content = f.read()

# Replace datetime.datetime with just datetime if it's imported as from datetime import datetime
content = content.replace("datetime.datetime", "datetime")

with open(r"d:\ClinicFLow\core_backend\services\admin_service.py", "w") as f:
    f.write(content)

import os

path = r"C:\Users\pintuk300\.gemini\antigravity\scratch\ANOKHI-RESTRO\src\features\history\legacy.model.js"

with open(path, 'rb') as f:
    data = f.read()

# Replace any occurrence of the corrupted sequence with a clean rupee symbol
# We'll replace the common corrupted sequences like EF BF BD (replacement char) + ,1
# or just any non-ascii followed by ,1

import re
# This regex searches for any non-ascii bytes followed by ,1
cleaned_data = re.sub(b'[^\x00-\x7F]+,1', '₹'.encode('utf-8'), data)

with open(path, 'wb') as f:
    f.write(cleaned_data)

print("Cleanup complete.")

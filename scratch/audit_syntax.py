import os
import re

def check_js_syntax(directory):
    pattern = re.compile(r'\btry\s*\{', re.MULTILINE)
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.js'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    # A very simple check for try without catch/finally
                    # This is not perfect but might find obvious mistakes
                    # We look for try { ... } and then check what follows
                    
                    # Instead of complex regex, let's just find all 'try' and see if they are valid
                    # For simplicity, we'll just print the file and line if we suspect anything
                    lines = content.splitlines()
                    for i, line in enumerate(lines):
                        if 'try {' in line or 'try{' in line:
                            # Search forward for catch or finally
                            found = False
                            for j in range(i, min(i + 20, len(lines))):
                                if 'catch' in lines[j] or 'finally' in lines[j]:
                                    found = True
                                    break
                            if not found:
                                print(f"Potential issue in {path} at line {i+1}: {line.strip()}")

if __name__ == "__main__":
    check_js_syntax('src')

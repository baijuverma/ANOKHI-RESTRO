
import os

def check_js_syntax(file_path):
    print(f"Checking {file_path}...")
    if not os.path.exists(file_path):
        print("File not found!")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for simple bracket balancing
    brackets = {
        '(': content.count('(') - content.count(')'),
        '{': content.count('{') - content.count('}'),
        '[': content.count('[') - content.count(']')
    }
    
    print("Bracket Balance (should be 0):", brackets)
    
    # Check for common keywords
    if "window.showSuggestions" in content:
        print("Found: window.showSuggestions")
    else:
        print("MISSING: window.showSuggestions")
        
    if "export function initExpensesLogic" in content:
        print("Found: initExpensesLogic export")

if __name__ == "__main__":
    path = r"C:\Users\pintuk300\.\gemini\antigravity\scratch\ANOKHI-RESTRO\src\features\expenses\model.js"
    check_js_syntax(path)

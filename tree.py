import os

# === CONFIG ===
ROOT_DIR = r"C:\Users\USER\moneytalk"
EXCLUDE_DIR = os.path.normpath(r"C:\Users\USER\moneytalk\node_modules")

def generate_tree(start_path, prefix=""):
    try:
        items = sorted(os.listdir(start_path))
    except PermissionError:
        return

    for index, item in enumerate(items):
        full_path = os.path.join(start_path, item)
        normalized_path = os.path.normpath(full_path)

        # Skip excluded directory
        if normalized_path.startswith(EXCLUDE_DIR):
            continue

        connector = "└── " if index == len(items) - 1 else "├── "
        print(prefix + connector + item)

        if os.path.isdir(full_path):
            extension = "    " if index == len(items) - 1 else "│   "
            generate_tree(full_path, prefix + extension)

if __name__ == "__main__":
    print(ROOT_DIR)
    generate_tree(ROOT_DIR)
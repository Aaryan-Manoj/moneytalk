import os

# === CONFIG ===
ROOT_DIR = r"C:\Users\USER\moneytalk"

EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "__pycache__"
}

def should_exclude(path):
    # Exclude if any part of the path matches excluded dirs
    parts = path.split(os.sep)
    return any(part in EXCLUDE_DIRS for part in parts)

def generate_tree(start_path, prefix=""):
    try:
        items = sorted(os.listdir(start_path))
    except PermissionError:
        return

    # Filter excluded items BEFORE processing
    items = [item for item in items if not should_exclude(os.path.join(start_path, item))]

    for index, item in enumerate(items):
        full_path = os.path.join(start_path, item)

        connector = "└── " if index == len(items) - 1 else "├── "
        print(prefix + connector + item)

        if os.path.isdir(full_path):
            extension = "    " if index == len(items) - 1 else "│   "
            generate_tree(full_path, prefix + extension)

if __name__ == "__main__":
    print(ROOT_DIR)
    generate_tree(ROOT_DIR)
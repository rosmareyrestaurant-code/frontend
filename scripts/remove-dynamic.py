import os, re

api_dir = os.path.join(os.path.dirname(__file__), "..", "src", "app", "api")
api_dir = os.path.normpath(api_dir)

# matches: export const dynamic = "force-dynamic"; (with optional newline after)
pattern = re.compile(r'export const dynamic\s*=\s*["\']force-dynamic["\'];\s*\n?')

fixed = 0
for root, _, files in os.walk(api_dir):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as fh:
                content = fh.read()
            new_content = pattern.sub("", content)
            if new_content != content:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(new_content)
                fixed += 1
                rel = path.replace(api_dir, "")
                print(f"Fixed: {rel}")

print(f"\nTotal fixed: {fixed} files")

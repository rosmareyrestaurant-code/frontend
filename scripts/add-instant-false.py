"""
يُضيف `export const instant = false;` لكل route.ts تحت src/app/api/
بدون إعادة كتابة الملف كاملاً.
"""
import os, re

api_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "src", "app", "api"))
marker = 'export const instant = false;'
# نضعها بعد أول سطر import أو في البداية
insert_pattern = re.compile(r'^(import .+?\n)', re.MULTILINE)

fixed = 0
for root, _, files in os.walk(api_dir):
    for f in files:
        if f == "route.ts":
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as fh:
                content = fh.read()
            if marker in content:
                continue
            # أضف بعد آخر import block
            last_import_end = 0
            for m in re.finditer(r'^import .+;\s*\n', content, re.MULTILINE):
                last_import_end = m.end()
            if last_import_end > 0:
                new_content = content[:last_import_end] + "\n" + marker + "\n" + content[last_import_end:]
            else:
                new_content = marker + "\n\n" + content
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new_content)
            fixed += 1

print(f"Added 'instant = false' to {fixed} route files")

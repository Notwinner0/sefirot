import yaml
import http.server
import socketserver  # type: ignore
import os
import time  # type: ignore
import subprocess
import sys  # type: ignore
import webbrowser  # type: ignore
from livereload import Server, shell


# Рекурсивная функция для генерации HTML из YAML
def build_html_element(element):
    if isinstance(element, str):
        return element

    tag = element.get("tag")
    if not tag:
        return ""

    attrs_str = " ".join([f'{k}="{v}"' for k, v in element.get("attrs", {}).items()])
    attrs_html = f" {attrs_str}" if attrs_str else ""

    content = element.get("content")
    inner_html = ""

    if content is not None:
        if isinstance(content, list):
            inner_html = "".join([build_html_element(item) for item in content])
        else:
            inner_html = content

    return f"<{tag}{attrs_html}>{inner_html}</{tag}>"


# Функция для чтения YAML и генерации HTML
def generate_html_from_yaml(yaml_file, css_file):
    imports = """ {
                    "imports": {
                      "three": "https://cdn.jsdelivr.net/npm/three@0.175.0/build/three.module.js",
                      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.175.0/examples/jsm/"
                    }
                  }"""
    with open(yaml_file, "r") as f:
        data = yaml.safe_load(f)

    html_content = build_html_element(data.get("html", {}))
    return f"""<!DOCTYPE html>
<script type="importmap">
{imports}
</script>
{html_content}

"""


def build_site():
    css_input_file = "static/css/style.css"
    yaml_input_file = "templates/index.yaml"
    js_input_file = "static/js/main.js"

    css_output_file = "output/style.css"
    html_output_file = "output/index.html"
    js_output_file = "output/main.js"

    os.makedirs("output", exist_ok=True)

    # Копирование CSS
    if os.path.exists(css_input_file):
        try:
            if os.name == "nt":
                subprocess.run(
                    [
                        "copy",
                        "/y",
                        css_input_file.replace("/", "\\"),
                        css_output_file.replace("/", "\\"),
                    ],
                    check=True,
                    shell=True,
                )
            else:
                subprocess.run(["cp", css_input_file, css_output_file], check=True)
            print("CSS скопирован.")
        except subprocess.CalledProcessError as e:
            print(f"Ошибка при копировании CSS: {e}")
            with open(css_output_file, "w") as f:
                f.write("/* Styles */\n")
            print(f"Создан пустой файл CSS: {css_output_file}")
    else:
        with open(css_output_file, "w") as f:
            f.write("/* Styles */\n")
        print(f"Создан пустой файл CSS: {css_output_file}")

    # Копирование JS
    if os.path.exists(js_input_file):
        try:
            if os.name == "nt":
                subprocess.run(
                    [
                        "copy",
                        "/y",
                        js_input_file.replace("/", "\\"),
                        js_output_file.replace("/", "\\"),
                    ],
                    check=True,
                    shell=True,
                )
            else:
                subprocess.run(["cp", js_input_file, js_output_file], check=True)
            print("JS скопирован.")
        except subprocess.CalledProcessError as e:
            print(f"Ошибка при копировании JS: {e}")
            with open(js_output_file, "w") as f:
                f.write("// Main JavaScript file \n")
            print(f"Создан пустой файл JS: {js_output_file}")
    else:
        with open(js_output_file, "w") as f:
            f.write("// Main JavaScript file \n")
        print(f"Создан пустой файл JS: {js_output_file}")

    # Генерация HTML
    try:
        html_content = generate_html_from_yaml(yaml_input_file, css_output_file)
        with open(html_output_file, "w") as f:
            f.write(html_content)
        print("HTML обновлён.")
    except Exception as e:
        print(f"Ошибка при обновлении HTML: {e}")


if __name__ == "__main__":
    build_site()  # Первоначальная сборка HTML

    server = Server()
    server.watch(
        "templates/*.yaml", build_site)
    server.watch(
        "static/css/*.css", build_site
    )  # Пересобираем HTML при изменении CSS, чтобы скопировать его
    server.watch(
        "static/js/*.js", build_site)  # livereload сам отследит изменения в JS
    server.watch(
        "*.py", shell("python app.py")
    )
    
    server.serve(root="output", port=8000, open_url_delay=1)

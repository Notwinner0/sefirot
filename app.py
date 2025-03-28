import yaml
import http.server
import socketserver
import os
import time
import subprocess
import sys
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


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
    with open(yaml_file, "r") as f:
        data = yaml.safe_load(f)

    html_content = build_html_element(data.get("html", {}))
    return f"""<!DOCTYPE html>
{html_content}
"""


class FileChangeHandler(FileSystemEventHandler):
    def __init__(self):
        self.process = None
        self.httpd = None # add httpd attribute

    def on_modified(self, event):
        if event.is_directory:
            return
        filepath = event.src_path
        css_input_file = "static/css/style.css"
        css_output_file = "output/style.css"
        if filepath.endswith(".css"):
            print(f"Обнаружены изменения в файле CSS: {filepath}. Копирование CSS...")
            os.makedirs(os.path.dirname(css_output_file), exist_ok=True)
            if os.path.exists(css_input_file):
                subprocess.run(["cp", css_input_file, css_output_file])
                print("CSS скопирован.")
            else:
                with open(css_output_file, "w") as f:
                    f.write("/* Основные стили */\n")
                print(f"Создан пустой файл CSS: {css_output_file}")
        elif filepath.endswith((".py", ".yaml")):
            print(f"Обнаружены изменения в файле: {filepath}. Перезапуск сервера...")
            if self.httpd:
                self.httpd.shutdown()
                self.httpd.server_close()
                self.httpd = None
            self.start_server()

    def start_server(self):
        template_file = "templates/index.yaml"
        css_input_file = "static/css/style.css"
        output_css_file = "output/style.css"
        output_html_file = "output/index.html"

        os.makedirs("output", exist_ok=True)
        # Copy CSS on start
        if os.path.exists(css_input_file):
            if os.name == "nt":
                subprocess.run(["copy", css_input_file, output_css_file], shell=True)
            else:
                subprocess.run(["cp", css_input_file, output_css_file])
            print("CSS скопирован.")
        else:
            with open(output_css_file, "w") as f:
                f.write("/* Styles */\n")  # Создаем пустой CSS, если его нет
            print(f"Создан пустой файл CSS: {output_css_file}")

        html_content = generate_html_from_yaml(template_file, output_css_file)
        with open(output_html_file, "w") as f:
            f.write(html_content)

        PORT = 8000
        DIRECTORY = "output"

        class Handler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                if self.path == "/":
                    self.path = "/index.html"
                return http.server.SimpleHTTPRequestHandler.do_GET(self)

        os.chdir(DIRECTORY)
        with open("main.js", "w") as f:
            f.write("// Main JavaScript file\n")
        Handler.directory = "."
        self.httpd = socketserver.TCPServer(("", PORT), Handler)
        print(f"Сервер запущен на порту http://localhost:{PORT}")
        self.httpd.serve_forever()
        os.chdir("..")  # Возвращаемся в исходную директорию

    def on_created(self, event):
        self.on_modified(event)

    def on_deleted(self, event):
        self.on_modified(event)

    def on_moved(self, event):
        self.on_modified(event)


if __name__ == "__main__":
    event_handler = FileChangeHandler()
    event_handler.start_server()  # Copy CSS on start
    observer = Observer()
    observer.schedule(event_handler, ".", recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
    if event_handler.httpd:
        event_handler.httpd.shutdown()
        event_handler.httpd.server_close()
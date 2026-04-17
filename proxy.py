import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PORT = 8081
API_URL = "https://api.anthropic.com/v1/messages"

class ProxyHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Browser visits show a hint — only POST /analyze is the real API."""
        raw = self.path.split('?', 1)[0]
        if raw in ('', '/'):
            html = """<!DOCTYPE html><html><head><meta charset="utf-8"><title>Photo Coach proxy</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:48px auto;padding:24px;line-height:1.5">
<h1>Photo Coach proxy is running</h1>
<p>Port <strong>8081</strong> is the <strong>API proxy</strong> (for <code>POST /analyze</code> only).</p>
<p><strong>Open the app in your browser:</strong><br>
<a href="http://localhost:8080">http://localhost:8080</a></p>
<p>Keep this terminal open while you use the app. Start <code>python -m http.server 8080</code> in a <em>second</em> window if you have not already.</p>
</body></html>"""
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
            return
        self.send_response(405)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Allow', 'POST, OPTIONS')
        self.end_headers()
        self.wfile.write(
            b'Use POST /analyze only. Open the app at http://localhost:8080\n'
        )

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        if self.path != '/analyze':
            self.send_error(404, 'Not Found')
            return

        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            self.send_error(500, 'ANTHROPIC_API_KEY environment variable is not set')
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        req = Request(API_URL, data=body, method='POST')
        req.add_header('Content-Type', 'application/json')
        req.add_header('x-api-key', api_key)
        req.add_header('anthropic-version', '2023-06-01')

        try:
            with urlopen(req) as response:
                response_body = response.read()
                self._set_headers(response.status)
                self.wfile.write(response_body)
        except HTTPError as e:
            self._set_headers(e.code)
            error_body = e.read()
            self.wfile.write(error_body)
        except URLError as e:
            self.send_error(502, f'Bad Gateway: {e.reason}')


def run(server_class=HTTPServer, handler_class=ProxyHandler):
    server_address = ('', PORT)
    httpd = server_class(server_address, handler_class)
    print(f'Starting proxy server on http://localhost:{PORT}')
    print('')
    print('  This window = API only (for the app to call).')
    print('  NEXT: open a SECOND terminal and run:')
    print('        python -m http.server 8080')
    print('  THEN: in Chrome open:  http://localhost:8080')
    print('  (If you opened 8081 and saw "501", restart this script after saving proxy.py.)')
    print('')
    httpd.serve_forever()


if __name__ == '__main__':
    run()

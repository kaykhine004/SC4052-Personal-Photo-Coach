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
    httpd.serve_forever()


if __name__ == '__main__':
    run()

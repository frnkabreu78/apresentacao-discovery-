#!/usr/bin/env python3
"""Local development server that mirrors Vercel API behavior"""

import json
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import sys as sys_module

# Import from api module
sys.path.insert(0, str(Path(__file__).parent / 'api'))
from index import handler

class VercelMirrorHandler(SimpleHTTPRequestHandler):
    """Mimics Vercel's request format and routing"""

    def do_POST(self):
        self._handle_request()

    def do_GET(self):
        if self.path.startswith('/api/'):
            self._handle_request()
        else:
            self.path = self.path or '/index.html'
            super().do_GET()

    def do_PUT(self):
        self._handle_request()

    def do_DELETE(self):
        self._handle_request()

    def do_OPTIONS(self):
        self._handle_request()

    def _handle_request(self):
        """Route API requests through the handler"""
        if not self.path.startswith('/api/'):
            self.send_response(404)
            self.end_headers()
            return

        # Create a request object that mimics Vercel's format
        class MockRequest:
            pass

        req = MockRequest()
        req.method = self.command
        req.path = self.path
        req.url = f'http://localhost:5174{self.path}'

        # Parse body
        content_length = int(self.headers.get('Content-Length', 0))
        req.body = self.rfile.read(content_length) if content_length else b''

        # Parse query parameters
        from urllib.parse import parse_qs, urlparse
        parsed_url = urlparse(self.path)
        req.args = parse_qs(parsed_url.query)
        req.query = req.args
        req.url = f'http://localhost:5174{self.path}'

        try:
            body, status, headers = handler(req)

            self.send_response(status)
            for key, value in headers.items():
                self.send_header(key, value)
            self.end_headers()

            if body:
                self.wfile.write(body.encode() if isinstance(body, str) else body)
        except Exception as e:
            print(f'❌ Error: {e}')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({'error': str(e)})
            self.wfile.write(error_response.encode())

    def end_headers(self):
        # Ensure CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # Better logging
        print(f'[{self.client_address[0]}] {format % args}')

if __name__ == '__main__':
    os.chdir(Path(__file__).parent)

    server = HTTPServer(('localhost', 5174), VercelMirrorHandler)
    print('🚀 Servidor rodando em http://localhost:5174')
    print('📝 Teste comentários em http://localhost:5174/test-comment.html')
    print('🔐 Senha: lending2026')
    print('⚠️  Pressione Ctrl+C para parar.\n')

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n✋ Servidor parado.')
        sys_module.exit(0)

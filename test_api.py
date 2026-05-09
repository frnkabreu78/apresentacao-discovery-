#!/usr/bin/env python3
"""Test script to verify API endpoints work correctly"""

import json
import sys
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, '/Users/frankabreu/Documents/Claude/Projects/Apresentacao_Discovery/api')
from index import handler

class VercelRequest:
    """Simulates how Vercel passes requests to Python handlers"""
    def __init__(self, method, path, body=None, query_string=None):
        self.method = method
        self.path = path
        self.body = body
        self.headers = {}

        # Build URL
        self.url = f"https://example.vercel.app{path}"
        if query_string:
            self.url += f"?{query_string}"

        # Parse query params from URL
        parsed = urlparse(self.url)
        self.args = parse_qs(parsed.query)
        self.query = parse_qs(parsed.query)

def test_auth():
    print("\n" + "="*60)
    print("TEST 1: Authentication")
    print("="*60)

    req = VercelRequest('POST', '/api/auth',
        json.dumps({'password': 'lending2026'}).encode())
    response, status, headers = handler(req)
    result = json.loads(response)

    assert status == 200, f"Expected 200, got {status}"
    assert result['ok'] == True, "Auth should succeed"
    print("✅ Auth works")

def test_get_comments():
    print("\n" + "="*60)
    print("TEST 2: GET /api/comments?slide=1")
    print("="*60)

    req = VercelRequest('GET', '/api/comments', None, 'slide=1')
    response, status, headers = handler(req)

    assert status == 200, f"Expected 200, got {status}"
    result = json.loads(response)
    print(f"✅ GET works, returned {len(result)} comments")

def test_post_comment():
    print("\n" + "="*60)
    print("TEST 3: POST /api/comments")
    print("="*60)

    comment = {
        'slide': '1',
        'author': 'Tester',
        'text': 'Test comment'
    }

    req = VercelRequest('POST', '/api/comments',
        json.dumps(comment).encode())
    response, status, headers = handler(req)
    result = json.loads(response)

    assert status == 200, f"Expected 200, got {status}"
    assert result['ok'] == True, "POST should succeed"
    print("✅ POST works")
    print(f"   Comment ID: {result['comment']['id']}")
    return result['comment']['id']

def test_put_comment(comment_id):
    print("\n" + "="*60)
    print("TEST 4: PUT /api/comments/{id}")
    print("="*60)

    update = {'text': 'Updated comment'}
    req = VercelRequest('PUT', f'/api/comments/{comment_id}',
        json.dumps(update).encode())
    response, status, headers = handler(req)
    result = json.loads(response)

    assert status == 200, f"Expected 200, got {status}"
    assert result['ok'] == True, "PUT should succeed"
    print("✅ PUT works")

def test_delete_comment(comment_id):
    print("\n" + "="*60)
    print("TEST 5: DELETE /api/comments/{id}")
    print("="*60)

    req = VercelRequest('DELETE', f'/api/comments/{comment_id}', None)
    response, status, headers = handler(req)
    result = json.loads(response)

    assert status == 200, f"Expected 200, got {status}"
    assert result['ok'] == True, "DELETE should succeed"
    print("✅ DELETE works")

if __name__ == '__main__':
    try:
        test_auth()
        test_get_comments()
        comment_id = test_post_comment()
        test_put_comment(comment_id)
        test_delete_comment(comment_id)

        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

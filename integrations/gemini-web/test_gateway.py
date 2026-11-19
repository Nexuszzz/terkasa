"""Offline contract/security tests. No Google network calls, browser access or real cookies."""
import asyncio
import base64
import io
import json
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from gemini_webapi import GeneratedImage
from PIL import Image
import app as gateway


def png():
    output = io.BytesIO()
    Image.new("RGB", (8, 8), "green").save(output, format="PNG")
    return output.getvalue()


class FixtureImage(GeneratedImage):
    async def save(self, path, filename, **kwargs):
        target = Path(path) / filename
        target.write_bytes(png())
        return str(target)


class FakeBackend:
    def __init__(self):
        self.ready = False
        self.calls = 0
        self.connections = 0
        self.last = None
        self.delay = 0
        self.entered = threading.Event()
        self.error = None
        self.output = SimpleNamespace(text='{"captions":{"Instagram":"Sapi tersedia"}}', images=[])

    async def connect(self, sid, sidts):
        self.connections += 1
        self.ready = True

    async def ensure(self):
        self.ready = True

    async def generate(self, prompt, model, files):
        self.calls += 1
        self.entered.set()
        self.last = {"prompt": prompt, "model": model, "files": [p.read_bytes() for p in (files or [])]}
        await asyncio.sleep(self.delay)
        if self.error:
            raise self.error
        return self.output

    def models(self):
        return [{"id": "account-model", "available": True}]

    async def close(self):
        pass


class GatewayTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="terkasa-gateway-test-")
        self.state = patch.object(gateway, "STATE", Path(self.temp.name))
        self.state.start()
        self.backend = FakeBackend()
        self.client = TestClient(gateway.create_app(self.backend, "test-key-only"))
        self.client.__enter__()
        self.headers = {"Authorization": "Bearer test-key-only"}

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.state.stop()
        self.temp.cleanup()

    def text(self, **kwargs):
        return self.client.post('/v1beta/models/auto:generateContent', headers=self.headers,
                                json=kwargs or {"contents": [{"parts": [{"text": "Buat caption sapi"}]}]})

    def test_health_does_not_imply_authenticated(self):
        self.assertEqual(self.client.get('/healthz').status_code, 200)
        self.assertEqual(self.client.get('/v1/status').status_code, 401)
        self.assertFalse(self.client.get('/v1/status', headers=self.headers).json()['ready'])
        self.assertFalse(self.client.get('/setup/status').json()['ready'])
        self.assertEqual(self.client.get('/setup/status').headers['cache-control'], 'no-store')

    def test_host_and_cross_origin_setup_rejected(self):
        self.assertEqual(self.client.get('/healthz', headers={"Host": "evil.test"}).status_code, 400)
        response = self.client.post('/setup/session', headers={"Origin": "https://evil.test"},
                                    json={"secure_1psid": "x" * 30, "secure_1psidts": "y" * 30})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.backend.connections, 0)

    def test_validation_never_echoes_cookie_input(self):
        secret = 'sensitive-fixture-value'
        response = self.client.post('/setup/session', json={"secure_1psid": {"secret": secret}})
        self.assertEqual(response.status_code, 400)
        self.assertNotIn(secret, response.text)

    def test_session_saved_only_after_connect(self):
        response = self.client.post('/setup/session', headers={"Origin": "http://testserver"},
                                    json={"secure_1psid": "x" * 30, "secure_1psidts": "y" * 30})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.backend.connections, 1)
        self.assertTrue((gateway.STATE / 'session.json').exists())
        self.assertNotIn('x' * 30, response.text)

    def test_native_json_and_photo_contract(self):
        response = self.text(systemInstruction={"parts": [{"text": "Toko ternak"}]},
                             contents=[{"role": "user", "parts": [{"text": "Sapi"}, {"inline_data": {"data": base64.b64encode(png()).decode(), "mime_type": "image/png"}}]}],
                             generationConfig={"responseMimeType": "application/json", "responseSchema": {"required": ["captions"]}})
        self.assertEqual(response.status_code, 200)
        self.assertIn('captions', response.json()['candidates'][0]['content']['parts'][0]['text'])
        self.assertIn('Toko ternak', self.backend.last['prompt'])
        self.assertIn('JSON response schema', self.backend.last['prompt'])
        self.assertEqual(self.backend.last['files'][0], png())

    def test_malformed_native_body_rejected(self):
        for body in [[], {"contents": "bad"}, {"contents": [{"parts": [None]}]}, {}]:
            response = self.client.post('/v1beta/models/auto:generateContent', headers=self.headers, json=body)
            self.assertEqual(response.status_code, 400)
        self.assertEqual(self.backend.calls, 0)

    def test_svg_rejected_before_generation(self):
        response = self.client.post('/v1/images/generations', headers=self.headers,
                                    json={"prompt": "Sapi", "reference_image": base64.b64encode(b'<svg/>').decode()})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.backend.calls, 0)

    def test_search_images_are_not_generated_images(self):
        self.backend.output.images = [SimpleNamespace(url="https://example.test/search.png")]
        response = self.client.post('/v1/images/generations', headers=self.headers, json={"prompt": "Sapi"})
        self.assertEqual(response.status_code, 502)
        self.assertEqual(self.backend.calls, 1)

    def test_generated_image_returned_as_valid_base64(self):
        self.backend.output.images = [FixtureImage(url="https://example.test/fixture.png")]
        response = self.client.post('/v1/images/generations', headers=self.headers, json={"prompt": "Sapi"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(base64.b64decode(response.json()['data'][0]['b64_json']), png())

    def test_failure_is_redacted_and_not_retried(self):
        self.backend.error = RuntimeError('secret-cookie-value')
        response = self.text()
        self.assertEqual(response.status_code, 502)
        self.assertNotIn('secret-cookie-value', response.text)
        self.assertEqual(self.backend.calls, 1)

    def test_busy_request_rejected_instead_of_duplicate_generation(self):
        self.backend.delay = 0.7
        with ThreadPoolExecutor(max_workers=1) as pool:
            first = pool.submit(self.text)
            self.assertTrue(self.backend.entered.wait(2))
            self.assertEqual(self.text().status_code, 429)
            self.assertEqual(first.result().status_code, 200)
        self.assertEqual(self.backend.calls, 1)

    def test_models_follow_account_registry(self):
        response = self.client.get('/v1/models', headers=self.headers)
        self.assertEqual(response.json()['data'][0]['id'], 'account-model')

    def test_real_backend_missing_session_does_not_connect_anonymously(self):
        with self.assertRaises(gateway.HTTPException) as error:
            asyncio.run(gateway.Backend().ensure())
        self.assertEqual(error.exception.status_code, 503)

    def test_saved_session_resumed_at_startup(self):
        (gateway.STATE / 'session.json').write_text('{}')
        backend = FakeBackend()
        with TestClient(gateway.create_app(backend, 'test-key-only')) as client:
            self.assertTrue(client.get('/v1/status', headers=self.headers).json()['ready'])

    def test_pinned_library_generation_retries_are_disabled(self):
        backend = gateway.Backend()
        backend.ensure = AsyncMock()
        backend.client = SimpleNamespace(generate_content=AsyncMock(return_value=SimpleNamespace(text='ok')))
        asyncio.run(backend.generate('Sapi'))
        self.assertEqual(backend.client.generate_content.call_args.kwargs['current_retry'], 0)
        self.assertTrue(backend.client.generate_content.call_args.kwargs['temporary'])

    def test_real_library_quota_error_preserves_429(self):
        from gemini_webapi.exceptions import UsageLimitExceededError
        backend = gateway.Backend()
        backend.ensure = AsyncMock()
        backend.ready = True
        backend.client = SimpleNamespace(generate_content=AsyncMock(side_effect=UsageLimitExceededError('private details')))
        with self.assertRaises(gateway.HTTPException) as error:
            asyncio.run(backend.generate('Sapi'))
        self.assertEqual(error.exception.status_code, 429)
        self.assertTrue(backend.ready)
        self.assertNotIn('private details', error.exception.detail)


if __name__ == '__main__':
    unittest.main(verbosity=2)

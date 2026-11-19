"""Local TERKASA bridge over HanaokaYuzu/Gemini-API. No browser-cookie extraction."""

import asyncio
import base64
import io
import json
import os
import secrets
import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, SecretStr
from PIL import Image
from starlette.middleware.trustedhost import TrustedHostMiddleware

ROOT = Path(__file__).resolve().parent
STATE = Path(os.getenv("TERKASA_WEB_STATE", ROOT / ".state")).resolve()
STATE.mkdir(parents=True, exist_ok=True)
os.environ["GEMINI_COOKIE_PATH"] = str(STATE / "cookie-cache")
Image.MAX_IMAGE_PIXELS = 32_000_000


def api_key():
    target = STATE / "api-key"
    if not target.exists():
        target.write_text(secrets.token_urlsafe(32), encoding="utf-8")
        target.chmod(0o600)
    return target.read_text(encoding="utf-8").strip()


class SessionInput(BaseModel):
    secure_1psid: SecretStr
    secure_1psidts: SecretStr


class ImageInput(BaseModel):
    prompt: str = Field(min_length=1, max_length=10000)
    model: str = Field(default="auto", max_length=80)
    aspect_ratio: str = Field(default="1:1", pattern=r"^(1:1|9:16|16:9|4:3|3:4|3:2|2:3)$")
    reference_image: str | None = Field(default=None, max_length=11_200_000)
    n: int = Field(default=1, ge=1, le=1)
    response_format: str = Field(default="b64_json", pattern="^b64_json$")


class Backend:
    def __init__(self):
        self.client = None
        self.ready = False

    async def connect(self, sid, sidts):
        from gemini_webapi import GeminiClient, set_log_level
        set_log_level("CRITICAL")
        candidate = GeminiClient(sid, sidts)
        try:
            await asyncio.wait_for(candidate.init(timeout=150, auto_close=False, auto_refresh=True, verbose=False), 35)
            if candidate.account_status.name != "AVAILABLE":
                raise ValueError("session_not_authenticated")
        except Exception:
            await candidate.close()
            raise HTTPException(401, "Sesi Google belum valid. Login Gemini dan perbarui kedua cookie langsung di halaman setup.") from None
        if self.client:
            await self.client.close()
        self.client = candidate
        self.ready = True

    async def ensure(self):
        if self.ready and self.client:
            return
        target = STATE / "session.json"
        if not target.exists():
            raise HTTPException(503, "Gemini Web belum dihubungkan. Buka halaman setup gateway.")
        try:
            data = json.loads(target.read_text(encoding="utf-8"))
            await self.connect(data["secure_1psid"], data["secure_1psidts"])
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(503, "Konfigurasi sesi lokal tidak dapat dibaca. Hubungkan ulang melalui setup.") from None

    def models(self):
        return [{"id": m.model_name, "object": "model", "owned_by": "gemini-web", "available": m.is_available}
                for m in (self.client.list_models() or [])]

    async def generate(self, prompt, model="auto", files=None):
        from gemini_webapi.exceptions import AuthError, TemporarilyBlockedError, UsageLimitExceededError
        await self.ensure()
        selected = None if model == "auto" else self.client.resolve_model(model)
        try:
            # The pinned upstream forwards this to its retry decorator. Disable
            # re-submission there as well as in our HTTP/Next.js adapters.
            return await asyncio.wait_for(self.client.generate_content(prompt, files=files or None, model=selected, temporary=True, current_retry=0), 150)
        except (UsageLimitExceededError, TemporarilyBlockedError):
            raise HTTPException(429, "Kuota atau akses Gemini sedang dibatasi. Tunggu hingga akses akun tersedia kembali.") from None
        except AuthError:
            self.ready = False
            raise HTTPException(401, "Sesi Gemini telah berakhir. Hubungkan ulang melalui halaman setup.") from None

    async def close(self):
        if self.client:
            await self.client.close()
        self.client, self.ready = None, False


def image_bytes(value):
    try:
        if value.startswith("data:"):
            value = value.split(",", 1)[1]
        data = base64.b64decode(value, validate=True)
        if len(data) > 8 * 1024 * 1024:
            raise ValueError()
        with Image.open(io.BytesIO(data)) as image:
            if image.format not in {"JPEG", "PNG", "WEBP"} or image.width * image.height > 32_000_000:
                raise ValueError()
            image.verify()
        return data
    except Exception:
        raise HTTPException(400, "Foto referensi harus JPEG, PNG, atau WebP yang valid, maksimal 8 MB.") from None


def create_app(backend=None, key=None):
    backend = backend or Backend()
    token = key or api_key()
    lock = asyncio.Lock()

    @asynccontextmanager
    async def lifespan(app):
        if (STATE / "session.json").exists():
            try:
                await backend.ensure()
            except HTTPException:
                pass  # A stale session must not prevent opening the local setup page.
        yield
        await backend.close()

    app = FastAPI(title="TERKASA Gemini Web Gateway", version="0.1.0", lifespan=lifespan,
                  docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "testserver"])

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, error):
        # Pydantic's default error includes input values, which could be session cookies.
        return JSONResponse({"detail": "Format permintaan tidak valid. Periksa kolom dan ukuran input."}, status_code=400)

    async def authorized(request: Request):
        supplied = request.headers.get("authorization", "").removeprefix("Bearer ")
        if not supplied or not secrets.compare_digest(supplied.encode(), token.encode()):
            raise HTTPException(401, "Gateway API key tidak valid.")

    async def run(prompt, model="auto", files=None):
        try:
            await asyncio.wait_for(lock.acquire(), 0.25)
        except TimeoutError:
            raise HTTPException(429, "Gateway sedang memproses permintaan lain. Tunggu hingga selesai.") from None
        try:
            return await backend.generate(prompt, model, files)
        except HTTPException:
            raise
        except TimeoutError:
            raise HTTPException(504, "Gemini Web melewati batas waktu; permintaan tidak dikirim ulang otomatis.") from None
        except Exception:
            backend.ready = False
            raise HTTPException(502, "Gemini Web belum memberikan hasil. Periksa akses akun, kuota, atau sesi di halaman setup.") from None
        finally:
            lock.release()

    @app.get("/healthz")
    async def health():
        return {"ok": True, "service": "terkasa-gemini-web"}

    @app.get("/setup")
    async def setup_page():
        return FileResponse(ROOT / "setup.html", headers={"Cache-Control": "no-store", "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'", "X-Content-Type-Options": "nosniff"})

    @app.post("/setup/session")
    async def save_session(body: SessionInput, request: Request):
        # Loopback-only administration; JSON + exact Origin blocks cross-site form requests.
        expected = f"{request.url.scheme}://{request.headers.get('host')}"
        if request.headers.get("origin") != expected or request.client.host not in {"127.0.0.1", "::1", "testclient"}:
            raise HTTPException(403, "Setup hanya dapat dilakukan dari halaman gateway lokal.")
        if lock.locked():
            raise HTTPException(409, "Tunggu permintaan aktif selesai sebelum mengganti sesi.")
        sid, sidts = body.secure_1psid.get_secret_value().strip(), body.secure_1psidts.get_secret_value().strip()
        if not 20 <= len(sid) <= 8192 or not 10 <= len(sidts) <= 8192:
            raise HTTPException(400, "Isi kedua nilai cookie, bukan nama cookie atau seluruh header.")
        async with lock:
            await backend.connect(sid, sidts)
            target = STATE / "session.json"
            target.write_text(json.dumps({"secure_1psid": sid, "secure_1psidts": sidts}), encoding="utf-8")
            target.chmod(0o600)
        return {"ok": True, "ready": True, "message": "Sesi Gemini Web berhasil diverifikasi."}

    @app.get("/setup/status")
    async def setup_status(request: Request):
        if request.client.host not in {"127.0.0.1", "::1", "testclient"}:
            raise HTTPException(403, "Status setup hanya tersedia dari laptop lokal.")
        return JSONResponse({"ready": backend.ready}, headers={"Cache-Control": "no-store"})

    @app.get("/v1/status", dependencies=[Depends(authorized)])
    async def status():
        return {"ready": backend.ready, "sessionSaved": (STATE / "session.json").exists(), "provider": "gemini-web"}

    @app.get("/v1/models", dependencies=[Depends(authorized)])
    async def models():
        await backend.ensure()
        return {"object": "list", "data": backend.models()}

    @app.post("/v1/images/generations", dependencies=[Depends(authorized)])
    async def images(body: ImageInput):
        from gemini_webapi import GeneratedImage
        prompt = f"Generate an original image, not web search results. Aspect ratio {body.aspect_ratio}.\n{body.prompt}"
        with tempfile.TemporaryDirectory(prefix="terkasa-image-") as folder:
            files = None
            if body.reference_image:
                reference = Path(folder) / "reference.png"
                with Image.open(io.BytesIO(image_bytes(body.reference_image))) as image:
                    image.save(reference, format="PNG")
                files = [reference]
            response = await run(prompt, body.model, files)
            generated = [image for image in response.images if isinstance(image, GeneratedImage)]
            if not generated:
                raise HTTPException(502, "Gemini belum mengembalikan gambar generatif. Gambar pencarian tidak dipakai sebagai hasil AI.")
            try:
                saved = Path(await generated[0].save(path=folder, filename="generated.png", verbose=False))
                raw = saved.read_bytes()
                if len(raw) > 20 * 1024 * 1024:
                    raise ValueError()
                with Image.open(io.BytesIO(raw)) as image:
                    image.verify()
                return {"created": int(time.time()), "provider": "gemini-web", "model": body.model,
                        "data": [{"b64_json": base64.b64encode(raw).decode()}]}
            except Exception:
                raise HTTPException(502, "Gambar Gemini tidak dapat disimpan atau bukan gambar yang valid.") from None

    @app.post("/v1beta/models/{model}:generateContent", dependencies=[Depends(authorized)])
    async def native_text(model: str, request: Request):
        try:
            body = await request.json()
            sections, photos = [], []
            system = body.get("systemInstruction", body.get("system_instruction", {}))
            sections.extend(part.get("text", "") for part in system.get("parts", []))
            for content in body.get("contents", []):
                parts = content.get("parts", [])
                sections.append(str(content.get("role", "user")) + ":\n" + "\n".join(part.get("text", "") for part in parts))
                for part in parts:
                    image = part.get("inlineData", part.get("inline_data"))
                    if image is not None:
                        if len(photos) >= 3:
                            raise HTTPException(400, "Maksimal tiga foto referensi per permintaan.")
                        photos.append(image_bytes(image["data"]))
            config = body.get("generationConfig", {})
            if config.get("responseMimeType") == "application/json":
                sections.append("Return only valid JSON, without Markdown fences or extra explanations.")
                if config.get("responseSchema"):
                    sections.append("Follow this JSON response schema: " + json.dumps(config["responseSchema"]))
            prompt = "\n\n".join(sections)
            if not prompt.strip() or len(prompt) > 50000:
                raise HTTPException(400, "Prompt teks kosong atau terlalu panjang.")
        except HTTPException:
            raise
        except (ValueError, TypeError, AttributeError, KeyError):
            raise HTTPException(400, "Format konten Gemini tidak valid.") from None
        with tempfile.TemporaryDirectory(prefix="terkasa-vision-") as folder:
            files = []
            for index, raw in enumerate(photos):
                target = Path(folder) / f"reference-{index}.png"
                with Image.open(io.BytesIO(raw)) as image:
                    image.save(target, format="PNG")
                files.append(target)
            output = await run(prompt, model, files)
        if not output.text:
            raise HTTPException(502, "Gemini tidak mengembalikan teks.")
        return {"candidates": [{"content": {"role": "model", "parts": [{"text": output.text}]}, "finishReason": "STOP"}]}

    return app


app = create_app()

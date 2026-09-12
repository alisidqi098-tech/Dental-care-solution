from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import re
import asyncio
import ipaddress
import logging
import uuid
import bcrypt
import jwt
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from zoneinfo import ZoneInfo
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------- Email (Emergent managed Resend) ----------
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
TEAM_NOTIFICATION_EMAIL = os.environ.get("TEAM_NOTIFICATION_EMAIL")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None) -> str | None:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to send email")
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email")


_IT_MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
              "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]


def format_date_it(iso: str) -> str:
    try:
        d = datetime.strptime(iso, "%Y-%m-%d")
        return f"{d.day} {_IT_MONTHS[d.month - 1]} {d.year}"
    except Exception:
        return iso


def _meet_block(lead: str, fallback: str = "") -> str:
    link = os.environ.get("VIDEO_CALL_LINK", "")
    if link.startswith("https://"):
        return (
            f'<p style="font-size:14px;line-height:1.6;margin:0 0 12px">{escape(lead)} '
            f'<a href="{escape(link)}" style="color:#0284c7">{escape(link)}</a></p>'
        )
    return fallback


def doctor_confirm_html(b) -> str:
    fallback = (
        '<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Riceverai il link della videochiamata '
        "a questo indirizzo email prima dell'appuntamento.</p>"
    )
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td '
        'style="padding:24px;font-family:Arial,sans-serif;color:#0f172a">'
        f'<h1 style="font-size:20px;margin:0 0 16px">Demo confermata, {escape(b.name)}</h1>'
        '<p style="font-size:14px;line-height:1.6;margin:0 0 12px">La tua videochiamata dimostrativa '
        'di <strong>15 minuti</strong> con DigitalCareAI &egrave; prenotata.</p>'
        '<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 16px">'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Data</td><td><strong>{escape(format_date_it(b.date))}</strong></td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Orario</td><td><strong>{escape(b.time_slot)}</strong></td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Studio</td><td><strong>{escape(b.clinic)}</strong></td></tr></table>'
        + _meet_block("Link della videochiamata:", fallback)
        + '<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Durante la demo vedrai una simulazione in '
        'diretta sul tuo telefono: nessun impegno, solo automazione pura.</p>'
        f'<p style="font-size:12px;color:#94a3b8;margin:24px 0 0">Inviato da {escape(EMAIL_FROM_NAME)}. '
        'Non chiediamo mai password o dati di pagamento via email.</p>'
        '</td></tr></table>'
    )


def team_notify_html(b) -> str:
    chairs = escape(b.chairs or "-")
    notes = escape(b.notes or "-")
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td '
        'style="padding:24px;font-family:Arial,sans-serif;color:#0f172a">'
        f'<h1 style="font-size:20px;margin:0 0 16px">Nuova demo prenotata: {escape(b.clinic)}</h1>'
        '<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 16px">'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Data</td><td><strong>{escape(format_date_it(b.date))}</strong></td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Orario</td><td><strong>{escape(b.time_slot)}</strong></td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Contatto</td><td><strong>{escape(b.name)}</strong></td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Studio</td><td>{escape(b.clinic)}</td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Email</td><td>{escape(b.email)}</td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Telefono</td><td>{escape(b.phone)}</td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Poltrone</td><td>{chairs}</td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Note</td><td>{notes}</td></tr></table>'
        '<p style="font-size:14px;line-height:1.6;margin:0">Contatta lo studio per confermare e inviare '
        'il link della videochiamata.</p>'
        f'<p style="font-size:12px;color:#94a3b8;margin:24px 0 0">Notifica automatica di {escape(EMAIL_FROM_NAME)}.</p>'
        '</td></tr></table>'
    )


def doctor_reminder_html(b: dict) -> str:
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td '
        'style="padding:24px;font-family:Arial,sans-serif;color:#0f172a">'
        f'<h1 style="font-size:20px;margin:0 0 16px">Ci vediamo domani, {escape(b["name"])}</h1>'
        '<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Ti ricordiamo la tua videochiamata '
        'dimostrativa di <strong>15 minuti</strong> con DigitalCareAI.</p>'
        '<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 16px">'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Data</td><td><strong>{escape(format_date_it(b["date"]))}</strong></td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Orario</td><td><strong>{escape(b["time_slot"])}</strong></td></tr>'
        f'<tr><td style="padding:4px 16px 4px 0;color:#64748b">Studio</td><td><strong>{escape(b["clinic"])}</strong></td></tr></table>'
        + _meet_block("Ci colleghiamo da qui:")
        + '<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Tieni il telefono a portata di mano: '
        'durante la chiamata vedrai una simulazione in diretta del nostro assistente AI su WhatsApp. '
        "Se hai cambiato programmi, rispondi pure a questa email e riprogrammiamo l'appuntamento.</p>"
        f'<p style="font-size:12px;color:#94a3b8;margin:24px 0 0">Inviato da {escape(EMAIL_FROM_NAME)}. '
        'Non chiediamo mai password o dati di pagamento via email.</p>'
        '</td></tr></table>'
    )


def doctor_cancel_html(b: dict) -> str:
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td '
        'style="padding:24px;font-family:Arial,sans-serif;color:#0f172a">'
        f'<h1 style="font-size:20px;margin:0 0 16px">La tua demo &egrave; stata annullata</h1>'
        f'<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Gentile {escape(b["name"])}, la demo '
        f'di {escape(b["clinic"])} prevista per {escape(format_date_it(b["date"]))} alle '
        f'{escape(b["time_slot"])} &egrave; stata annullata.</p>'
        '<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Se si tratta di un errore o vuoi '
        'riprogrammare, rispondi pure a questa email: troviamo subito un nuovo orario.</p>'
        f'<p style="font-size:12px;color:#94a3b8;margin:24px 0 0">Inviato da {escape(EMAIL_FROM_NAME)}. '
        'Non chiediamo mai password o dati di pagamento via email.</p>'
        '</td></tr></table>'
    )


# ---------- Promemoria automatico 24h prima + riepilogo team ----------
ROME = ZoneInfo("Europe/Rome")


def team_digest_html(todays: list, label: str, evening: bool = False) -> str:
    rows = "".join(
        f'<tr><td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap">{escape(b["time_slot"])}</td>'
        f'<td style="padding:6px 12px 6px 0"><strong>{escape(b["clinic"])}</strong></td>'
        f'<td style="padding:6px 12px 6px 0">{escape(b["name"])}</td>'
        f'<td style="padding:6px 0">{escape(b["phone"])}</td></tr>'
        for b in sorted(todays, key=lambda x: x["time_slot"])
    )
    heading = "Demo di domani" if evening else "Demo di oggi"
    closing = "Prepara le chiamate in anticipo." if evening else "Buone chiamate."
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td '
        'style="padding:24px;font-family:Arial,sans-serif;color:#0f172a">'
        f'<h1 style="font-size:20px;margin:0 0 8px">{heading}: {len(todays)} in programma</h1>'
        f'<p style="font-size:14px;color:#64748b;margin:0 0 16px">{escape(label)}</p>'
        '<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 0 16px">'
        f'{rows}</table>'
        f'<p style="font-size:14px;line-height:1.6;margin:0">{closing} Le demo annullate non sono incluse.</p>'
        f'<p style="font-size:12px;color:#94a3b8;margin:24px 0 0">Riepilogo automatico di {escape(EMAIL_FROM_NAME)}.</p>'
        '</td></tr></table>'
    )


async def send_team_digest(target_date: str | None = None, evening: bool = False) -> int:
    if not TEAM_NOTIFICATION_EMAIL:
        return 0
    if target_date is None:
        target_date = datetime.now(ROME).date().isoformat()
    todays = await db.demo_bookings.find({"date": target_date}, {"_id": 0}).to_list(100)
    todays = [b for b in todays if b.get("status", "da_fare") != "annullata"]
    if todays:
        label = format_date_it(target_date)
        day_word = "Domani" if evening else "Oggi"
        await send_email(
            to=TEAM_NOTIFICATION_EMAIL,
            subject=f"{day_word} hai {len(todays)} demo \u2014 riepilogo del {label}",
            html=team_digest_html(todays, label, evening),
        )
        logger.info(f"Riepilogo team inviato: {len(todays)} demo ({'sera' if evening else 'mattina'}, {target_date})")
    return len(todays)


async def reminder_loop():
    while True:
        try:
            now = datetime.now(ROME)
            candidates = await db.demo_bookings.find({"reminder_sent_at": None}, {"_id": 0}).to_list(1000)
            for b in candidates:
                if b.get("status", "da_fare") == "annullata":
                    continue
                try:
                    start = datetime.strptime(f"{b['date']} {b['time_slot']}", "%Y-%m-%d %H:%M").replace(tzinfo=ROME)
                except Exception:
                    continue
                if start - timedelta(hours=24) <= now < start:
                    try:
                        await send_email(
                            to=b["email"],
                            subject=f"Promemoria: domani la tua demo ({format_date_it(b['date'])} ore {b['time_slot']})",
                            html=doctor_reminder_html(b),
                        )
                        await db.demo_bookings.update_one(
                            {"id": b["id"]},
                            {"$set": {"reminder_sent_at": datetime.now(timezone.utc).isoformat()}},
                        )
                        logger.info(f"Promemoria 24h inviato a {b['email']}")
                    except Exception as e:
                        logger.error(f"Promemoria fallito per {b.get('id')}: {e}")
            if now.hour == 8 and now.minute < 15:
                today_iso = now.date().isoformat()
                marker = await db.settings.find_one({"key": "team_digest_date"})
                if not marker or marker.get("value") != today_iso:
                    try:
                        await send_team_digest(today_iso)
                    except Exception as e:
                        logger.error(f"Riepilogo team fallito: {e}")
                    await db.settings.update_one(
                        {"key": "team_digest_date"}, {"$set": {"value": today_iso}}, upsert=True
                    )
            if now.hour == 20 and now.minute < 15:
                tomorrow_iso = (now.date() + timedelta(days=1)).isoformat()
                marker = await db.settings.find_one({"key": "team_digest_eve_date"})
                if not marker or marker.get("value") != tomorrow_iso:
                    try:
                        await send_team_digest(tomorrow_iso, evening=True)
                    except Exception as e:
                        logger.error(f"Riepilogo serale team fallito: {e}")
                    await db.settings.update_one(
                        {"key": "team_digest_eve_date"}, {"$set": {"value": tomorrow_iso}}, upsert=True
                    )
        except Exception as e:
            logger.error(f"Reminder loop error: {e}")
        await asyncio.sleep(900)


# ---------- Auth (JWT + bcrypt) ----------
JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=15)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie(key="access_token", value=access, httponly=True, secure=True,
                        samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=True,
                        samesite="lax", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Tipo di token non valido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token scaduto")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return user


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or not admin_password:
        return
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated from env")


# ---------- Models ----------
BOOKING_STATUSES = ("da_fare", "fatta", "annullata")


class DemoBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    clinic: str
    email: str
    phone: str
    chairs: Optional[str] = None
    date: str
    time_slot: str
    notes: Optional[str] = None
    admin_notes: Optional[str] = None
    status: str = "da_fare"
    reminder_sent_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DemoBookingCreate(BaseModel):
    name: str
    clinic: str
    email: str
    phone: str
    chairs: Optional[str] = None
    date: str
    time_slot: str
    notes: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


class NotesUpdate(BaseModel):
    notes: str = ""


class LoginInput(BaseModel):
    email: str
    password: str


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "DigitalCareAI API"}


@api_router.post("/demo-booking", response_model=DemoBooking)
async def create_demo_booking(input: DemoBookingCreate):
    booking = DemoBooking(**input.model_dump())
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.demo_bookings.insert_one(doc)
    try:
        await send_email(
            to=booking.email,
            subject="La tua demo DigitalCareAI \u00e8 confermata",
            html=doctor_confirm_html(booking),
        )
    except Exception as e:
        logger.error(f"Conferma email al medico fallita: {e}")
    if TEAM_NOTIFICATION_EMAIL:
        try:
            await send_email(
                to=TEAM_NOTIFICATION_EMAIL,
                subject=f"Nuova demo prenotata \u2014 {booking.clinic} ({format_date_it(booking.date)} {booking.time_slot})",
                html=team_notify_html(booking),
            )
        except Exception as e:
            logger.error(f"Notifica email al team fallita: {e}")
    return booking


@api_router.get("/demo-bookings", response_model=List[DemoBooking])
async def get_demo_bookings(user=Depends(get_current_user)):
    bookings = await db.demo_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for b in bookings:
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return bookings


@api_router.patch("/demo-bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, input: StatusUpdate, user=Depends(get_current_user)):
    if input.status not in BOOKING_STATUSES:
        raise HTTPException(status_code=400, detail="Stato non valido")
    res = await db.demo_bookings.update_one({"id": booking_id}, {"$set": {"status": input.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata")
    if input.status == "annullata":
        doc = await db.demo_bookings.find_one({"id": booking_id}, {"_id": 0})
        if doc:
            try:
                await send_email(
                    to=doc["email"],
                    subject=f"La tua demo del {format_date_it(doc['date'])} \u00e8 stata annullata",
                    html=doctor_cancel_html(doc),
                )
                logger.info(f"Email di annullamento inviata a {doc['email']}")
            except Exception as e:
                logger.error(f"Email di annullamento fallita per {booking_id}: {e}")
    return {"id": booking_id, "status": input.status}


@api_router.patch("/demo-bookings/{booking_id}/notes")
async def update_booking_notes(booking_id: str, input: NotesUpdate, user=Depends(get_current_user)):
    res = await db.demo_bookings.update_one({"id": booking_id}, {"$set": {"admin_notes": input.notes}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata")
    return {"id": booking_id, "admin_notes": input.notes}


@api_router.get("/demo-bookings/busy")
async def busy_slots(date: str):
    docs = await db.demo_bookings.find({"date": date}, {"_id": 0, "time_slot": 1, "status": 1}).to_list(200)
    busy = [d["time_slot"] for d in docs if d.get("status", "da_fare") != "annullata"]
    return {"date": date, "busy": busy}


@api_router.get("/demo-bookings/count")
async def bookings_count():
    count = await db.demo_bookings.count_documents({"status": {"$ne": "annullata"}})
    return {"count": count}


DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5, 6]
DEFAULT_SLOTS = ["09:00", "09:30", "11:00", "12:30", "15:00", "15:30", "17:00", "18:30"]


class ScheduleUpdate(BaseModel):
    weekdays: List[int]
    slots: List[str]


async def get_schedule() -> dict:
    doc = await db.settings.find_one({"key": "schedule"}, {"_id": 0})
    if doc:
        return {"weekdays": doc.get("weekdays", DEFAULT_WEEKDAYS), "slots": doc.get("slots", DEFAULT_SLOTS)}
    return {"weekdays": DEFAULT_WEEKDAYS, "slots": DEFAULT_SLOTS}


@api_router.get("/schedule")
async def read_schedule():
    return await get_schedule()


@api_router.put("/admin/schedule")
async def write_schedule(input: ScheduleUpdate, user=Depends(get_current_user)):
    weekdays = sorted({d for d in input.weekdays if 0 <= d <= 6})
    slots = sorted({s for s in input.slots if re.fullmatch(r"\d{2}:\d{2}", s)})
    if not weekdays or not slots:
        raise HTTPException(status_code=400, detail="Seleziona almeno un giorno e una fascia oraria")
    await db.settings.update_one(
        {"key": "schedule"}, {"$set": {"weekdays": weekdays, "slots": slots}}, upsert=True
    )
    return {"weekdays": weekdays, "slots": slots}


@api_router.delete("/demo-bookings/{booking_id}")
async def delete_booking(booking_id: str, user=Depends(get_current_user)):
    res = await db.demo_bookings.delete_one({"id": booking_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata")
    return {"deleted": booking_id}


@api_router.post("/admin/send-team-digest")
async def trigger_team_digest(tomorrow: bool = False, user=Depends(get_current_user)):
    if tomorrow:
        target = (datetime.now(ROME).date() + timedelta(days=1)).isoformat()
        count = await send_team_digest(target, evening=True)
    else:
        count = await send_team_digest()
    return {"sent": count > 0, "demo_count": count}


@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.strip().lower()
    identifier = f"{request.client.host}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra 15 minuti.")
        await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    return {"id": user["id"], "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"status": "ok"}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token mancante")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Tipo di token non valido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessione scaduta, accedi di nuovo")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    response.set_cookie(key="access_token", value=create_access_token(user["id"], user["email"]),
                        httponly=True, secure=True, samesite="lax", max_age=900, path="/")
    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_db():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    asyncio.create_task(reminder_loop())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

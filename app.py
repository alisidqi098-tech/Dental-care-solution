import os
import json
import psycopg2
import psycopg2.extras
import google.generativeai as genai
import requests
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

# Carica variabili d'ambiente (.env)
load_dotenv()

app = Flask(__name__)

# Configurazione Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

cronologia_chat = {}

# ==============================================================================
# 🗄️ CONFIGURAZIONE DATABASE POSTGRESQL (NEON / SUPABASE)
# ==============================================================================
def get_db_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("Variabile DATABASE_URL non impostata.")
    return psycopg2.connect(db_url)

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL usa SERIAL invece di AUTOINCREMENT e VARCHAR/TEXT
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS prenotazioni (
                id SERIAL PRIMARY KEY,
                telefono VARCHAR(50),
                nome_cognome VARCHAR(255),
                motivo TEXT,
                data_ora VARCHAR(255),
                stato VARCHAR(50) DEFAULT 'In attesa di conferma'
            )
        ''')
        conn.commit()
        conn.close()
        print("✅ Database PostgreSQL inizializzato con successo.")
    except Exception as e:
        print(f"❌ Errore durante l'inizializzazione del DB: {e}")

# Eseguiamo la creazione della tabella all'avvio del server
init_db()

# --- FUNZIONE PER SALVARE LA PRENOTAZIONE SU POSTGRESQL ---
def salva_prenotazione(numero_telefono, nome_cognome, motivo, data_ora):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL usa %s come placeholder, non i ? di SQLite
        cursor.execute('''
            INSERT INTO prenotazioni (telefono, nome_cognome, motivo, data_ora)
            VALUES (%s, %s, %s, %s)
        ''', (numero_telefono, nome_cognome, motivo, data_ora))
        conn.commit()
        conn.close()
        print(f"\n🎉 PRENOTAZIONE REGISTRATA NEL DB: {nome_cognome} ({data_ora})\n")
        return f"Prenotazione registrata con successo nel sistema per {nome_cognome}."
    except Exception as e:
        print(f"❌ Errore nel salvataggio DB: {e}")
        return "Errore interno durante il salvataggio."

# ==============================================================================
# 🛠️ TOOL PER GEMINI E FUNZIONI CLINICA
# ==============================================================================
salva_prenotazione_tool = {
    'name': 'salva_prenotazione',
    'description': 'Registra la richiesta di appuntamento dopo aver ottenuto nome, cognome, motivo e data/ora preferita.',
    'parameters': {
        'type': 'OBJECT',
        'properties': {
            'nome_cognome': {'type': 'STRING', 'description': 'Nome e cognome del paziente'},
            'motivo': {'type': 'STRING', 'description': 'Motivo della visita o trattamento'},
            'data_ora': {'type': 'STRING', 'description': 'Data e/o orario preferito per l\'appuntamento'}
        },
        'required': ['nome_cognome', 'motivo', 'data_ora']
    }
}

def carica_dati_clinica(id_clinica="dental_care_demo"):
    try:
        with open("database_cliniche.json", "r", encoding="utf-8") as f:
            database = json.load(f)
            return database.get(id_clinica, {})
    except Exception as e:
        print(f"❌ Errore caricamento database_cliniche.json: {e}")
        return {}

def genera_system_prompt(dati_clinica):
    servizi_str = "\n".join([f"- {s['nome']}: {s['prezzo']}" for s in dati_clinica.get("servizi", [])])
    regole_str = "\n".join([f"- {r}" for r in dati_clinica.get("regole_assistente", [])])

    prompt = (
        f"Sei l'assistente virtuale ufficiale della clinica '{dati_clinica.get('nome')}'.\n\n"
        f"INFORMAZIONI CLINICA:\n"
        f"- Indirizzo: {dati_clinica.get('indirizzo')}\n"
        f"- Telefono: {dati_clinica.get('telefono')}\n"
        f"- Orari: {dati_clinica.get('orari')}\n"
        f"- Urgenze: {dati_clinica.get('gestione_urgenze')}\n\n"
        f"LISTINO SERVIZI:\n{servizi_str}\n\n"
        f"REGOLE:\n{regole_str}\n"
        f"- Quando un paziente vuole prenotare, richiedi Nome, Cognome, Motivo e Data/Ora preferita.\n"
        f"- Quando hai TUTTE queste informazioni, usa lo strumento 'salva_prenotazione' per registrare la richiesta."
    )
    return prompt

# ==============================================================================
# 🌐 ROTTE WEB E DASHBOARD
# ==============================================================================
@app.route('/')
@app.route('/dashboard')
def home():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '')
    password = data.get('password', '')
    
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@studio.it")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "studio2026")

    if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
        return jsonify({"status": "success", "token": "sessione_valida_medico_2026"}), 200
    
    return jsonify({"status": "error", "message": "Credenziali errate"}), 401

@app.route('/api/prenotazioni', methods=['GET'])
def api_prenotazioni():
    try:
        conn = get_db_connection()
        # DictCursor permette a Flask di convertire le righe direttamente in JSON, simile a sqlite3.Row
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute('SELECT * FROM prenotazioni ORDER BY id DESC')
        rows = cursor.fetchall()
        conn.close()
        
        lista_prenotazioni = [dict(row) for row in rows]
        return jsonify(lista_prenotazioni), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/live-stats', methods=['GET'])
def live_stats():
    return jsonify({
        "revenue": 4850.00,
        "transactions": 14
    })

import requests

# ==============================================================================
# 📩 WEBHOOK WHATSAPP (GREEN API)
# ==============================================================================
@app.route('/whatsapp-webhook', methods=['POST'])
def whatsapp_webhook():
    # 1. Ricezione dati da Green API
    data = request.get_json()
    
    # Ignora notifiche di stato, accetta solo messaggi di testo
    if not data or data.get('typeWebhook') != 'incomingMessageReceived':
        return jsonify({"status": "ignored"}), 200
        
    try:
        messaggio_utente = data['messageData']['textMessageData']['textMessage']
        numero_mittente = data['senderData']['sender'] 
    except KeyError:
        # Se non è un messaggio di testo (es. immagine), ignoriamo per ora
        return jsonify({"status": "no_text"}), 200

    print(f"\n📩 Messaggio da {numero_mittente}: {messaggio_utente}")

    # 2. Logica Gemini
    dati_clinica = carica_dati_clinica("dental_care_demo")
    system_prompt_text = genera_system_prompt(dati_clinica)

    try:
        modello = genai.GenerativeModel(
            model_name='gemini-3.0-flash',
            system_instruction=system_prompt_text,
            tools=[salva_prenotazione]
        )

        if numero_mittente not in cronologia_chat:
            cronologia_chat[numero_mittente] = modello.start_chat(enable_automatic_function_calling=True)

        chat = cronologia_chat[numero_mittente]
        response = chat.send_message(messaggio_utente)
        risposta_ia = response.text

    except Exception as e:
        print(f"❌ Errore Gemini: {e}")
        risposta_ia = "Sistema in aggiornamento, riprova tra poco."

    # =======================================================
    # 3. QUI VANNO ID E TOKEN PER RISPONDERE
    # =======================================================
    ID_ISTANZA = "710722725565"
    API_TOKEN = "fa0638935257436b88c29d9f6d731a684735faf1946d4d5793"
    
    url = f"https://api.green-api.com/waInstance{ID_ISTANZA}/sendMessage/{API_TOKEN}"
    payload = {
        "chatId": numero_mittente,
        "message": risposta_ia
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    # Invio la risposta su WhatsApp
    requests.post(url, json=payload, headers=headers)
    print(f"🤖 Risposta inviata al paziente:\n{risposta_ia}\n")

    return jsonify({"status": "success"}), 200

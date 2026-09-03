import os
import json
import psycopg2
import psycopg2.extras
import google.generativeai as genai
import requests
import csv
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, request, jsonify, render_template, Response
from dotenv import load_dotenv

# Carica variabili d'ambiente (.env)
load_dotenv()

app = Flask(__name__)

# Configurazione Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

cronologia_chat = {}

# Credenziali Green API (messe come globali per comodità)
ID_ISTANZA = "710722725565"
API_TOKEN = "fa0638935257436b88c29d9f6d731a684735faf1946d4d5793"

# ==============================================================================
# 🗄️ CONFIGURAZIONE DATABASE POSTGRESQL
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
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS prenotazioni (
                id SERIAL PRIMARY KEY,
                telefono VARCHAR(50),
                nome_cognome VARCHAR(255),
                motivo TEXT,
                data_ora VARCHAR(255),
                stato VARCHAR(50) DEFAULT 'Confermato',
                prezzo DECIMAL(10,2) DEFAULT 0.00
            )
        ''')
        
        try:
            cursor.execute('ALTER TABLE prenotazioni ADD COLUMN prezzo DECIMAL(10,2) DEFAULT 0.00;')
        except psycopg2.errors.DuplicateColumn:
            pass
            
        conn.commit()
        conn.close()
        print("✅ Database PostgreSQL inizializzato/aggiornato con successo.")
    except Exception as e:
        print(f"❌ Errore durante l'inizializzazione del DB: {e}")

init_db()

def salva_prenotazione(numero_telefono, nome_cognome, motivo, data_ora):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO prenotazioni (telefono, nome_cognome, motivo, data_ora, stato)
            VALUES (%s, %s, %s, %s, 'Confermato')
        ''', (numero_telefono, nome_cognome, motivo, data_ora))
        conn.commit()
        conn.close()
        return f"Prenotazione registrata con successo nel sistema per {nome_cognome}."
    except Exception as e:
        return "Errore interno durante il salvataggio."

salva_prenotazione_tool = {
    'name': 'salva_prenotazione',
    'description': 'Registra la richiesta di appuntamento dopo aver ottenuto nome, cognome, motivo e data/ora preferita.',
    'parameters': {
        'type': 'OBJECT',
        'properties': {
            'nome_cognome': {'type': 'STRING', 'description': 'Nome e cognome del paziente'},
            'motivo': {'type': 'STRING', 'description': 'Motivo della visita o trattamento'},
            'data_ora': {'type': 'STRING', 'description': 'Data e orario preferito. DEVI usare SEMPRE il formato YYYY-MM-DD HH:MM (es. 2026-09-05 15:30)'}
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
        return {}

def genera_system_prompt(dati_clinica):
    servizi_str = "\n".join([f"- {s['nome']}: {s['prezzo']}" for s in dati_clinica.get("servizi", [])])
    regole_str = "\n".join([f"- {r}" for r in dati_clinica.get("regole_assistente", [])])

    prompt = (
        f"Sei l'assistente virtuale ufficiale della clinica 'Digital Care Solution AI'.\n\n"
        f"INFORMAZIONI CLINICA:\n"
        f"- Indirizzo: {dati_clinica.get('indirizzo', 'Via Roma 1, Milano')}\n"
        f"- Telefono: 389 4561230\n" 
        f"- Email: contatti@digitalcaresolution.it\n"
        f"- Orari: {dati_clinica.get('orari')}\n"
        f"- Urgenze: {dati_clinica.get('gestione_urgenze')}\n\n"
        f"LISTINO SERVIZI:\n{servizi_str}\n\n"
        f"REGOLE:\n{regole_str}\n"
        f"- Quando un paziente vuole prenotare, richiedi Nome, Cognome, Motivo e Data/Ora preferita.\n"
        f"- Quando salvi i dati, nel campo data_ora usa SEMPRE il formato numerico 'YYYY-MM-DD HH:MM'. Oggi è {datetime.now().strftime('%Y-%m-%d')}."
    )
    return prompt

# ==============================================================================
# ⏰ SISTEMA PROMEMORIA 24 ORE
# ==============================================================================
def controlla_e_invia_promemoria():
    print("Inizio controllo promemoria pazienti per domani...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM prenotazioni WHERE stato = 'Confermato'")
        rows = cursor.fetchall()
        conn.close()

        domani = datetime.now() + timedelta(days=1)
        domani_str = domani.strftime("%Y-%m-%d") # Es: "2026-09-05"

        for p in rows:
            data_ora_paziente = p['data_ora']
            numero = p['telefono']
            
            # Se la data salvata nel database inizia con la data di domani
            if data_ora_paziente and data_ora_paziente.startswith(domani_str) and numero:
                nome = p['nome_cognome']
                ora = data_ora_paziente.split(" ")[1] if " " in data_ora_paziente else data_ora_paziente
                
                messaggio = (f"🤖 *Promemoria Digital Care AI*\n\n"
                             f"Gentile {nome}, ti ricordiamo il tuo appuntamento per domani alle ore *{ora}* "
                             f"presso il nostro studio.\n\nPer qualsiasi disdetta rispondi a questo messaggio. A presto!")
                
                url = f"https://api.green-api.com/waInstance{ID_ISTANZA}/sendMessage/{API_TOKEN}"
                payload = {"chatId": numero, "message": messaggio}
                headers = {'Content-Type': 'application/json'}
                requests.post(url, json=payload, headers=headers)
                print(f"✅ Promemoria inviato a {nome} al numero {numero}")
    except Exception as e:
        print(f"❌ Errore durante l'invio dei promemoria: {e}")

# Avvia il "Cron Job" (Programmatore orario)
scheduler = BackgroundScheduler()
# Impostato per partire tutti i giorni alle 09:00 di mattina
scheduler.add_job(func=controlla_e_invia_promemoria, trigger="cron", hour=9, minute=0)
scheduler.start()

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
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute('SELECT * FROM prenotazioni ORDER BY id DESC')
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/prenotazioni_manuali', methods=['POST'])
def aggiungi_manuale():
    data = request.get_json()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO prenotazioni (telefono, nome_cognome, motivo, data_ora, prezzo, stato)
            VALUES (%s, %s, %s, %s, %s, 'Confermato')
        ''', (data.get('telefono', ''), data['nome_cognome'], data['motivo'], data['data_ora'], data.get('prezzo', 0.00)))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/prenotazioni/<int:id_paziente>', methods=['PUT'])
def aggiorna_prenotazione(id_paziente):
    data = request.get_json()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE prenotazioni 
            SET motivo = %s, prezzo = %s 
            WHERE id = %s
        ''', (data.get('motivo'), data.get('prezzo'), id_paziente))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/prenotazioni/<int:id_paziente>', methods=['DELETE'])
def elimina_prenotazione(id_paziente):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM prenotazioni WHERE id = %s', (id_paziente,))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# 📩 WEBHOOK WHATSAPP (GREEN API) CON SALVATAGGIO ERRORI VOCALI
# ==============================================================================
@app.route('/whatsapp-webhook', methods=['POST'])
def whatsapp_webhook():
    data = request.get_json()
    if not data or data.get('typeWebhook') != 'incomingMessageReceived':
        return jsonify({"status": "ignored"}), 200
        
    try:
        messaggio_utente = data['messageData']['textMessageData']['textMessage']
        numero_mittente = data['senderData']['sender'] 
    except KeyError:
        # Se è arrivato un audio, foto o sticker entra qui invece di bloccarsi
        try:
            numero_mittente = data['senderData']['sender'] 
            url = f"https://api.green-api.com/waInstance{ID_ISTANZA}/sendMessage/{API_TOKEN}"
            requests.post(url, json={
                "chatId": numero_mittente, 
                "message": "🤖 *AI System*: Scusami, al momento riesco a leggere solo messaggi di testo. Potresti scrivermi a parole la tua richiesta?"
            }, headers={'Content-Type': 'application/json'})
        except:
            pass
        return jsonify({"status": "no_text"}), 200

    dati_clinica = carica_dati_clinica("dental_care_demo")
    system_prompt_text = genera_system_prompt(dati_clinica)

    try:
        modello = genai.GenerativeModel(
            model_name='gemini-3.5-flash',
            system_instruction=system_prompt_text,
            tools=[salva_prenotazione]
        )

        if numero_mittente not in cronologia_chat:
            cronologia_chat[numero_mittente] = modello.start_chat(enable_automatic_function_calling=True)

        chat = cronologia_chat[numero_mittente]
        response = chat.send_message(messaggio_utente)
        risposta_ia = response.text

    except Exception as e:
        risposta_ia = "Sistema in aggiornamento, riprova tra pochissimo."

    url = f"https://api.green-api.com/waInstance{ID_ISTANZA}/sendMessage/{API_TOKEN}"
    payload = {"chatId": numero_mittente, "message": risposta_ia}
    headers = {'Content-Type': 'application/json'}
    requests.post(url, json=payload, headers=headers)

    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    app.run(debug=True)

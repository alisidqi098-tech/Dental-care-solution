import os
import json
import threading
import sqlite3
# import ngrok
from flask import Flask, request, jsonify, render_template
from groq import Groq
from twilio.twiml.messaging_response import MessagingResponse
from dotenv import load_dotenv

# Carica variabili d'ambiente (.env)
load_dotenv()

app = Flask(__name__)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

cronologia_chat = {}

# ==============================================================================
# 🗄️ CONFIGURAZIONE DATABASE SQLITE (FASE 2)
# ==============================================================================
def init_db():
    conn = sqlite3.connect('studio.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prenotazioni (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telefono TEXT,
            nome_cognome TEXT,
            motivo TEXT,
            data_ora TEXT,
            stato TEXT DEFAULT 'In attesa di conferma'
        )
    ''')
    conn.commit()
    conn.close()

# Eseguiamo la creazione della tabella all'avvio del server
init_db()

# --- FUNZIONE PER SALVARE LA PRENOTAZIONE SU SQLITE ---
def salva_prenotazione(numero_telefono, nome_cognome, motivo, data_ora):
    try:
        conn = sqlite3.connect('studio.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO prenotazioni (telefono, nome_cognome, motivo, data_ora)
            VALUES (?, ?, ?, ?)
        ''', (numero_telefono, nome_cognome, motivo, data_ora))
        conn.commit()
        conn.close()
        print(f"\n🎉 PRENOTAZIONE REGISTRATA NEL DB: {nome_cognome} ({data_ora})\n")
        return f"Prenotazione registrata con successo nel sistema per {nome_cognome}."
    except Exception as e:
        print(f"Errore nel salvataggio DB: {e}")
        return "Errore interno durante il salvataggio."

# ==============================================================================
# 🛠️ TOOL PER GROQ E FUNZIONI CLINICA
# ==============================================================================
tools = [
    {
        "type": "function",
        "function": {
            "name": "salva_prenotazione",
            "description": "Registra la richiesta di appuntamento dopo aver ottenuto nome, cognome, motivo e data/ora preferita.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome_cognome": {"type": "string", "description": "Nome e cognome del paziente"},
                    "motivo": {"type": "string", "description": "Motivo della visita o trattamento"},
                    "data_ora": {"type": "string", "description": "Data e/o orario preferito per l'appuntamento"}
                },
                "required": ["nome_cognome", "motivo", "data_ora"]
            }
        }
    }
]

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
    return {"role": "system", "content": prompt}

# ==============================================================================
# 🌐 ROTTE WEB E DASHBOARD
# ==============================================================================
@app.route('/')
@app.route('/dashboard')
def home():
    # Serve il file index.html presente nella cartella templates
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
    # Legge i dati dal Database SQLite per la Dashboard
    try:
        conn = sqlite3.connect('studio.db')
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
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

# ==============================================================================
# 📩 WEBHOOK WHATSAPP (TWILIO + GROQ)
# ==============================================================================
@app.route('/whatsapp-webhook', methods=['POST'])
def whatsapp_webhook():
    messaggio_utente = request.form.get('Body', '').strip()
    numero_mittente = request.form.get('From', '')
    
    print(f"\n📩 Messaggio da {numero_mittente}: {messaggio_utente}")

    dati_clinica = carica_dati_clinica("dental_care_demo")
    system_prompt = genera_system_prompt(dati_clinica)

    if numero_mittente not in cronologia_chat:
        cronologia_chat[numero_mittente] = []

    cronologia_chat[numero_mittente].append({"role": "user", "content": messaggio_utente})

    if len(cronologia_chat[numero_mittente]) > 10:
        cronologia_chat[numero_mittente] = cronologia_chat[numero_mittente][-10:]

    messaggi_per_groq = [system_prompt] + cronologia_chat[numero_mittente]

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messaggi_per_groq,
            tools=tools,
            tool_choice="auto"
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        if tool_calls:
            for tool_call in tool_calls:
                if tool_call.function.name == "salva_prenotazione":
                    args = json.loads(tool_call.function.arguments)
                    risultato_salvataggio = salva_prenotazione(
                        numero_telefono=numero_mittente,
                        nome_cognome=args.get("nome_cognome"),
                        motivo=args.get("motivo"),
                        data_ora=args.get("data_ora")
                    )
                    
                    messaggi_per_groq.append(response_message)
                    messaggi_per_groq.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": "salva_prenotazione",
                        "content": risultato_salvataggio
                    })

            second_response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messaggi_per_groq
            )
            risposta_ia = second_response.choices[0].message.content
        else:
            risposta_ia = response_message.content

        cronologia_chat[numero_mittente].append({"role": "assistant", "content": risposta_ia})

    except Exception as e:
        print(f"❌ Errore durante l'elaborazione: {e}")
        risposta_ia = "Ci dispiace, si è verificato un problema momentaneo. Riprova tra poco!"

    resp = MessagingResponse()
    resp.message(risposta_ia)

    print(f"🤖 Risposta inviata al paziente:\n{risposta_ia}\n")

    return str(resp), 200, {'Content-Type': 'text/xml'}

# ==============================================================================
# 🚀 AVVIO SERVER
# ==============================================================================
if __name__ == '__main__':
    # Puoi rimuovere il commento da avvia_tunnel() se test in locale con ngrok
    # threading.Thread(target=avvia_tunnel, daemon=True).start()
    app.run(port=5000, debug=True, use_reloader=False)

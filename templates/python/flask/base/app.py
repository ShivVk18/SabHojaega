import os
from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({
        "message": "Welcome to {{projectName}}!"
    })

@app.route("/health")
def health():
    return jsonify({
        "status": "healthy"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", {{port}}))
    host = os.environ.get("HOST", "127.0.0.1")
    app.run(host=host, port=port, debug=True)


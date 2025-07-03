from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://ogh5izcvo1d6.manus.space"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Load price data
def load_price_data(filename):
    prices = {}
    with open(filename, 'r') as f:
        for line in f:
            if ':' in line:
                key, value = line.strip().split(':')
                prices[key] = float(value)
    return prices

# Load material and land prices
material_prices = load_price_data('material_prices_raw.txt')
land_prices = load_price_data('land_prices_raw.txt')

@app.route('/api/land-price', methods=['POST'])
def calculate_land_price():
    try:
        data = request.get_json()
        state = data.get('state', '').lower()
        lga = data.get('lga', '').lower()
        
        # Get land price
        land_key = f"{state}_{lga}" if state and lga else state or lga or 'lagos_ikeja'
        land_price = land_prices.get(land_key, land_prices.get('lagos_ikeja', 50000))
        
        return jsonify({
            'success': True,
            'landPrice': land_price
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/states-lgas', methods=['GET'])
def get_states_lgas():
    try:
        with open('nigerian_states_lgas.json', 'r') as f:
            states_lgas = json.load(f)
        return jsonify({
            'success': True,
            'data': states_lgas
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
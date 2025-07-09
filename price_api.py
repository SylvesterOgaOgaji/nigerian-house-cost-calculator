from flask import Flask, request, jsonify
from flask_cors import CORS

import os
import json
from scraper import get_realtor_land_price, get_realtor_material_price

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

# Real-time material price endpoint

# Real-time material price endpoint (with web scraping)
@app.route('/api/material-price', methods=['POST'])
def get_material_price():
    try:
        data = request.get_json()
        quality = data.get('quality', 'medium_quality')
        state = data.get('state', '').lower()
        lga = data.get('lga', '').lower()
        # Try to get real-time price from the web
        material_map = {
            'low_quality': 'block',
            'medium_quality': 'polystyrene',
            'high_quality': 'cement'
        }
        material = material_map.get(quality, 'cement')
        scraped_price = get_realtor_material_price(material, state)
        if scraped_price:
            price = scraped_price
        else:
            price = material_prices.get(quality, material_prices.get('medium_quality', 1000))
        return jsonify({
            'success': True,
            'materialPrice': price
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Real-time land price endpoint (with web scraping)
@app.route('/api/land-price', methods=['POST'])
def calculate_land_price():
    try:
        data = request.get_json()
        state = data.get('state', '').lower()
        lga = data.get('lga', '').lower()
        # Try to get real-time price from the web
        scraped_price = get_realtor_land_price(state, lga)
        if scraped_price:
            land_price = scraped_price
        else:
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
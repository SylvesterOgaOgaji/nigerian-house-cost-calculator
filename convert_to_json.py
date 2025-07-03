import json

# Read the text file
with open('land_prices.txt', 'r') as file:
    lines = file.readlines()

# Convert to JSON
land_prices = {}
for line in lines:
    key, value = line.strip().split(':')
    land_prices[key] = int(value)

# Save as JSON
with open('land_prices.json', 'w') as file:
    json.dump(land_prices, file, indent=4)
import requests
from bs4 import BeautifulSoup

def get_realtor_land_price(state, lga):
    # Example: Scrape a sample Nigerian real estate listing site (replace with real one)
    # This is a placeholder URL and logic. You must update it to match the real site structure.
    url = f"https://www.nigeriapropertycentre.com/for-sale/land/{state.lower().replace(' ', '-')}/{lga.lower().replace(' ', '-')}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers, timeout=10)
    if response.status_code != 200:
        return None
    soup = BeautifulSoup(response.text, 'html.parser')
    # Find price elements: Nigeria Property Centre uses <span class="pull-left price">₦...
    price_tags = soup.find_all('span', class_='pull-left price')
    if not price_tags:
        price_tags = soup.find_all('span', class_='price')
    prices = []
    for tag in price_tags:
        text = tag.get_text(strip=True)
        if '₦' in text:
            try:
                # Remove commas and non-digit characters
                price = int(''.join(filter(str.isdigit, text)))
                # Filter out unrealistic prices (e.g., less than 100,000)
                if price > 100000:
                    prices.append(price)
            except Exception:
                continue
    if prices:
        # Return the median price for more robust estimate
        prices.sort()
        mid = len(prices) // 2
        return prices[mid] if len(prices) % 2 == 1 else (prices[mid-1] + prices[mid]) // 2
    return None

def get_realtor_material_price(material, state=None):
    # Example: Scrape a sample building material price site (replace with real one)
    # This is a placeholder URL and logic. You must update it to match the real site structure.
    url = f"https://www.nigerianprice.com/{material.lower().replace(' ', '-')}-price-in-nigeria/"
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers, timeout=10)
    if response.status_code != 200:
        return None
    soup = BeautifulSoup(response.text, 'html.parser')
    # Try to find the first price in the main content (often in <h2> or <strong> tags)
    main_content = soup.find('div', class_='entry-content')
    if not main_content:
        main_content = soup
    # Look for price in <h2> tags first
    for tag in main_content.find_all(['h2', 'strong']):
        text = tag.get_text(strip=True)
        if '₦' in text:
            try:
                price = int(''.join(filter(str.isdigit, text)))
                if price > 100:
                    return price
            except Exception:
                continue
    return None

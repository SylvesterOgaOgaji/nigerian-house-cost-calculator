class NigerianHouseCalculator {
    constructor() {
        this.statesLgas = {};
        this.materialPrices = {};
        this.landPrices = {};
        this.currentTab = 'land-cost';
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.populateStateDropdowns();
    }

    async loadData() {
        // Load states and LGAs
        const statesLgasResponse = await fetch('nigerian_states_lgas.json');
        this.statesLgas = await statesLgasResponse.json();
        // Material and land prices will be fetched in real-time from API, not loaded here
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this._switchTab(e.target.dataset.tab));
        });

        // State change listeners
        document.getElementById('land-state').addEventListener('change', (e) => {
            this.populateLgaDropdown('land-lga', e.target.value);
        });
        document.getElementById('house-state').addEventListener('change', (e) => {
            this.populateLgaDropdown('house-lga', e.target.value);
        });
        document.getElementById('budget-state').addEventListener('change', (e) => {
            this.populateLgaDropdown('budget-lga', e.target.value);
        });

        // Calculate buttons
        document.getElementById('calculate-land-cost').addEventListener('click', () => this.calculateLandCost());
        document.getElementById('calculate-house-cost').addEventListener('click', () => this.calculateHouseCost());
        document.getElementById('calculate-budget-plan').addEventListener('click', () => this.calculateBudgetPlan());

        // Chat functionality
        document.getElementById('send-chat').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // File upload
        document.getElementById('house-plan-upload').addEventListener('change', (e) => this.handleFileUpload(e));
        document.querySelector('.remove-file-btn').addEventListener('click', () => this.removeUploadedFile());
    }

    // Add the missing tab switching method
    _switchTab(tab) {
        // Remove active class from all tab buttons and contents
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        // Add active class to the selected tab and content
        document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(tab).classList.add('active');
        this.currentTab = tab;
    }

    populateStateDropdowns() {
        const stateSelects = ['land-state', 'house-state', 'budget-state'];
        const states = Object.keys(this.statesLgas).sort();

        stateSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">Select State</option>';
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                select.appendChild(option);
            });
        });
    }

    populateLgaDropdown(lgaSelectId, state) {
        const lgaSelect = document.getElementById(lgaSelectId);
        lgaSelect.innerHTML = '<option value="">Select LGA</option>';
        lgaSelect.disabled = !state;

        if (state && this.statesLgas[state]) {
            this.statesLgas[state].forEach(lga => {
                const option = document.createElement('option');
                option.value = lga;
                option.textContent = lga;
                lgaSelect.appendChild(option);
            });
        }
    }

    async calculateLandCost() {
        const state = document.getElementById('land-state').value;
        const lga = document.getElementById('land-lga').value;
        const size = parseInt(document.getElementById('land-size').value);

        if (!state || !lga || !size) {
            alert('Please fill in all fields');
            return;
        }

        // Fetch real-time land price from API
        try {
            document.getElementById('loading-overlay').style.display = 'flex';
            const response = await fetch('/api/land-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state, lga })
            });
            const data = await response.json();
            document.getElementById('loading-overlay').style.display = 'none';
            if (!data.success) throw new Error(data.error || 'Failed to fetch land price');
            const landPrice = data.landPrice;
            const totalCost = landPrice * size;
            this.displayLandResults({
                state,
                lga,
                size,
                landPrice,
                totalCost
            });
        } catch (err) {
            document.getElementById('loading-overlay').style.display = 'none';
            alert('Error fetching real-time land price: ' + err.message);
        }
    }

    async calculateHouseCost() {
        const houseType = document.getElementById('house-type').value;
        const state = document.getElementById('house-state').value;
        const lga = document.getElementById('house-lga').value;
        const constructionType = document.querySelector('input[name="construction-type"]:checked').value;

        if (!houseType || !state || !lga) {
            alert('Please fill in all fields');
            return;
        }

        // Fetch real-time material price from API (simulate for now)
        try {
            document.getElementById('loading-overlay').style.display = 'flex';
            // Simulate API for material price (replace with real endpoint if available)
            let materialQuality = constructionType === 'polystyrene' ? 'medium_quality' : 'high_quality';
            // For demo, use static endpoint or fallback
            let materialPrice = 0;
            const resp = await fetch('/api/material-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quality: materialQuality, state, lga })
            });
            const data = await resp.json();
            if (data.success) {
                materialPrice = data.materialPrice;
            } else {
                // fallback to static
                materialPrice = materialQuality === 'medium_quality' ? 1000 : 1500;
            }
            document.getElementById('loading-overlay').style.display = 'none';
            const area = 100; // Example area in sqm
            const totalCost = materialPrice * area;
            this.displayHouseResults({
                houseType,
                state,
                lga,
                constructionType,
                materialCost: materialPrice,
                area,
                totalCost
            });
        } catch (err) {
            document.getElementById('loading-overlay').style.display = 'none';
            alert('Error fetching real-time material price: ' + err.message);
        }
    }

    async calculateBudgetPlan() {
        const availableBudget = parseInt(document.getElementById('available-budget').value);
        const monthlySavings = parseInt(document.getElementById('monthly-savings').value);
        const state = document.getElementById('budget-state').value;
        const lga = document.getElementById('budget-lga').value;

        if (!availableBudget || !state || !lga) {
            alert('Please fill in available budget, state, and LGA');
            return;
        }

        try {
            document.getElementById('loading-overlay').style.display = 'flex';
            // Fetch land price
            const landResp = await fetch('/api/land-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state, lga })
            });
            const landData = await landResp.json();
            if (!landData.success) throw new Error(landData.error || 'Failed to fetch land price');
            const landPrice = landData.landPrice;
            const landCost = landPrice * 500; // Example land size

            // Fetch material price (simulate API)
            let materialPrice = 0;
            const matResp = await fetch('/api/material-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quality: 'medium_quality', state, lga })
            });
            const matData = await matResp.json();
            if (matData.success) {
                materialPrice = matData.materialPrice;
            } else {
                materialPrice = 1000;
            }
            const houseCost = materialPrice * 100; // Example house size
            const totalCost = landCost + houseCost;
            const monthsToSave = Math.ceil((totalCost - availableBudget) / monthlySavings);
            document.getElementById('loading-overlay').style.display = 'none';
            this.displayBudgetResults({
                availableBudget,
                monthlySavings,
                state,
                lga,
                landCost,
                houseCost,
                totalCost,
                monthsToSave
            });
        } catch (err) {
            document.getElementById('loading-overlay').style.display = 'none';
            alert('Error fetching real-time prices: ' + err.message);
        }
    }

    displayLandResults(data) {
        const resultsContainer = document.getElementById('land-results');
        const resultsContent = resultsContainer.querySelector('.results-content');

        resultsContent.innerHTML = `
            <div class="result-summary">
                <div class="result-item">
                    <span class="result-label">Location:</span>
                    <span class="result-value">${data.lga}, ${data.state}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Land Size:</span>
                    <span class="result-value">${data.size} sqm</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Price per sqm:</span>
                    <span class="result-value">₦${data.landPrice.toLocaleString()}</span>
                </div>
                <div class="result-item total">
                    <span class="result-label">Total Land Cost:</span>
                    <span class="result-value">₦${data.totalCost.toLocaleString()}</span>
                </div>
            </div>
        `;

        resultsContainer.style.display = 'block';
    }

    displayHouseResults(data) {
        const resultsContainer = document.getElementById('house-results');
        const resultsContent = resultsContainer.querySelector('.results-content');

        resultsContent.innerHTML = `
            <div class="result-summary">
                <div class="result-item">
                    <span class="result-label">House Type:</span>
                    <span class="result-value">${data.houseType.replace(/_/g, ' ')}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Construction Type:</span>
                    <span class="result-value">${data.constructionType}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Location:</span>
                    <span class="result-value">${data.lga}, ${data.state}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Material Cost:</span>
                    <span class="result-value">₦${data.materialCost.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Area:</span>
                    <span class="result-value">${data.area} sqm</span>
                </div>
                <div class="result-item total">
                    <span class="result-label">Total House Cost:</span>
                    <span class="result-value">₦${data.totalCost.toLocaleString()}</span>
                </div>
            </div>
        `;

        resultsContainer.style.display = 'block';
    }

    displayBudgetResults(data) {
        const resultsContainer = document.getElementById('budget-results');
        const resultsContent = resultsContainer.querySelector('.results-content');

        resultsContent.innerHTML = `
            <div class="result-summary">
                <div class="result-item">
                    <span class="result-label">Available Budget:</span>
                    <span class="result-value">₦${data.availableBudget.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Monthly Savings:</span>
                    <span class="result-value">₦${data.monthlySavings.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Location:</span>
                    <span class="result-value">${data.lga}, ${data.state}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Land Cost:</span>
                    <span class="result-value">₦${data.landCost.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">House Cost:</span>
                    <span class="result-value">₦${data.houseCost.toLocaleString()}</span>
                </div>
                <div class="result-item total">
                    <span class="result-label">Total Cost:</span>
                    <span class="result-value">₦${data.totalCost.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Months to Save:</span>
                    <span class="result-value">${data.monthsToSave}</span>
                </div>
            </div>
        `;

        resultsContainer.style.display = 'block';
    }

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        this.addChatMessage(message, 'user');
        input.value = '';

        // Simulate AI response
        setTimeout(() => {
            const response = this.generateChatResponse(message);
            this.addChatMessage(response, 'bot');
        }, 1000);
    }

    addChatMessage(message, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    generateChatResponse(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('polystyrene') || lowerMessage.includes('eps')) {
            return `Polystyrene construction is 25% cheaper than traditional blocks and offers excellent insulation. Current prices range from ₦8,000-₦12,000 per sqm including installation. It's perfect for Nigeria's climate as it keeps buildings cool and reduces energy costs.`;
        } else if (lowerMessage.includes('cost') || lowerMessage.includes('price')) {
            return `Building costs vary by location and materials. In Lagos, expect ₦50,000-₦80,000 per sqm for polystyrene construction. Use our calculator above for accurate estimates based on your specific location and house type.`;
        } else if (lowerMessage.includes('land')) {
            return `Land prices vary significantly across Nigeria. Lagos ranges from ₦150,000-₦1,000,000 per sqm depending on the LGA. Use our land cost calculator for current prices in your preferred location.`;
        } else if (lowerMessage.includes('how') || lowerMessage.includes('wetin')) {
            return `To build your house: 1) Buy land with proper documentation, 2) Get building approval, 3) Start with foundation, 4) Build walls (polystyrene recommended), 5) Install roofing, 6) Do electrical/plumbing, 7) Finish with tiles and paint. Budget 10% extra for contingencies.`;
        } else {
            return `I can help you with construction costs, material prices, building processes, and polystyrene construction guidance. Ask me specific questions about your building project!`;
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type and size
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a PDF, JPG, or PNG file.');
            event.target.value = '';
            return;
        }

        if (file.size > maxSize) {
            alert('File size must be less than 10MB.');
            event.target.value = '';
            return;
        }

        // Show uploaded file info
        const fileInfo = document.getElementById('uploaded-file-info');
        const fileName = fileInfo.querySelector('.file-name');
        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';

        // Hide the upload label
        document.querySelector('.file-upload-label').style.display = 'none';
    }

    removeUploadedFile() {
        document.getElementById('house-plan-upload').value = '';
        document.getElementById('uploaded-file-info').style.display = 'none';
        document.querySelector('.file-upload-label').style.display = 'flex';
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NigerianHouseCalculator();
});

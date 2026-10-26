/**
 * VoltPulse - Smart Electricity Usage & Cost Analyser
 * App Module: Main Controller, UI Event Orchestration, Live Simulation, CSV Ingestion
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Core Engines
    const tariff = new TariffEngine();
    const analytics = new EnergyAnalytics(tariff);
    const charts = new ChartManager();

    // 2. Application State
    const state = {
        theme: localStorage.getItem('voltpulse_theme') || 'light',
        currency: 'USD',
        activeTab: 'tab-overview',
        appliances: JSON.parse(JSON.stringify(VoltData.DEFAULT_APPLIANCES)),
        hourlyData: JSON.parse(JSON.stringify(VoltData.HOURLY_PROFILE)),
        dailyData: VoltData.generateDailyHistory(),
        monthlyData: JSON.parse(JSON.stringify(VoltData.MONTHLY_PROFILE)),
        solarMonthlyKwh: 120, // Default solar generation
        monthlyBudget: 180,
        isLiveActive: true,
        liveInterval: null,
        liveTelemetry: {
            kw: 1.85,
            voltage: 230.4,
            currentA: 8.35,
            powerFactor: 0.96,
            freq: 50.0
        },
        scenarioShiftHours: 2.0 // Hours shifted to off-peak in what-if tool
    };

    // Apply initial theme
    document.documentElement.setAttribute('data-theme', state.theme);
    charts.setTheme(state.theme);

    // 3. UI Element References
    const elements = {
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        currencySelect: document.getElementById('currency-select'),
        tariffModelSelect: document.getElementById('tariff-model-select'),
        liveToggleBtn: document.getElementById('live-toggle-btn'),
        liveStatusBadge: document.getElementById('live-status-badge'),
        
        // KPI Metrics
        kpiLiveKw: document.getElementById('kpi-live-kw'),
        kpiLiveCostRate: document.getElementById('kpi-live-cost-rate'),
        kpiTodayKwh: document.getElementById('kpi-today-kwh'),
        kpiTodayCost: document.getElementById('kpi-today-cost'),
        kpiMonthProjCost: document.getElementById('kpi-month-proj-cost'),
        kpiMonthProjKwh: document.getElementById('kpi-month-proj-kwh'),
        kpiBudgetProgress: document.getElementById('kpi-budget-progress'),
        kpiBudgetText: document.getElementById('kpi-budget-text'),
        kpiCarbonKg: document.getElementById('kpi-carbon-kg'),
        kpiCarbonTrees: document.getElementById('kpi-carbon-trees'),
        kpiEfficiencyScore: document.getElementById('kpi-efficiency-score'),
        kpiEfficiencyGrade: document.getElementById('kpi-efficiency-grade'),
        kpiBaseloadWatts: document.getElementById('kpi-baseload-watts'),
        kpiBaseloadAnnualCost: document.getElementById('kpi-baseload-cost'),
        
        // Appliance List & Modal
        applianceListContainer: document.getElementById('appliance-list-container'),
        addApplianceBtn: document.getElementById('add-appliance-btn'),
        applianceModal: document.getElementById('appliance-modal'),
        closeApplianceModalBtn: document.getElementById('close-appliance-modal-btn'),
        saveApplianceBtn: document.getElementById('save-appliance-btn'),
        
        // Tariff Settings Modal
        tariffSettingsBtn: document.getElementById('tariff-settings-btn'),
        tariffModal: document.getElementById('tariff-modal'),
        closeTariffModalBtn: document.getElementById('close-tariff-modal-btn'),
        saveTariffBtn: document.getElementById('save-tariff-btn'),
        
        // Solar & Budget Controls
        solarSlider: document.getElementById('solar-slider'),
        solarValueLabel: document.getElementById('solar-value-label'),
        budgetInput: document.getElementById('budget-input'),
        
        // Ingestion & Export
        csvFileInput: document.getElementById('csv-file-input'),
        csvDropZone: document.getElementById('csv-drop-zone'),
        loadSampleDataBtn: document.getElementById('load-sample-data-btn'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        printReportBtn: document.getElementById('print-report-btn'),
        
        // Recommendations & Insights List
        insightsContainer: document.getElementById('insights-container'),
        anomalyContainer: document.getElementById('anomaly-container'),
        
        // What-If Calculator
        scenarioShiftSlider: document.getElementById('scenario-shift-slider'),
        scenarioShiftVal: document.getElementById('scenario-shift-val'),
        scenarioSavingsVal: document.getElementById('scenario-savings-val')
    };

    // 4. Update and Render All Views
    function refreshAll() {
        renderKpis();
        renderCharts();
        renderApplianceList();
        renderRecommendations();
        renderWhatIfScenario();
        renderTelemetryTable();
    }

    function renderTelemetryTable() {
        const tbody = document.getElementById('telemetry-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        state.hourlyData.slice(0, 12).forEach(h => {
            const cost = tariff.calculateHourlyCost(h.kwh, h.hour);
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-subtle)';
            tr.innerHTML = `
                <td style="padding: 10px 14px; font-weight:600;">${h.label}</td>
                <td style="padding: 10px 14px;">${h.kwh} kW</td>
                <td style="padding: 10px 14px;"><span class="status-badge" style="font-size:10px; text-transform:uppercase;">${h.tier}</span></td>
                <td style="padding: 10px 14px; font-weight:600; color:var(--primary-blue);">${tariff.formatCurrency(cost)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Render KPI Metrics
    function renderKpis() {
        // Calculate daily total from hourly data
        const todayKwh = state.hourlyData.reduce((sum, h) => sum + h.kwh, 0);
        const todayCost = state.hourlyData.reduce((sum, h) => sum + tariff.calculateHourlyCost(h.kwh, h.hour), 0);

        // Project month: 30 days based on recent daily average
        const avgDailyKwh = state.dailyData.reduce((s, d) => s + d.totalKwh, 0) / state.dailyData.length;
        const projectedMonthKwh = avgDailyKwh * 30;
        const billDetails = tariff.calculateMonthlyBill(projectedMonthKwh, 0.38, state.solarMonthlyKwh);

        // Eco Impact
        const eco = analytics.calculateEcoImpact(projectedMonthKwh);

        // Vampire Baseload
        const vampire = analytics.detectVampireLoad(state.hourlyData);

        // Demand & Efficiency Profile
        const demand = analytics.analyzeDemandProfile(state.hourlyData);
        const eff = analytics.calculateEfficiencyScore(
            todayKwh,
            vampire ? vampire.baseloadWatts : 250,
            demand.onPeakRatio,
            demand.loadFactor
        );

        // Update DOM
        if (elements.kpiTodayKwh) elements.kpiTodayKwh.textContent = `${todayKwh.toFixed(1)} kWh`;
        if (elements.kpiTodayCost) elements.kpiTodayCost.textContent = tariff.formatCurrency(todayCost);
        
        if (elements.kpiMonthProjCost) elements.kpiMonthProjCost.textContent = tariff.formatCurrency(billDetails.totalBill);
        if (elements.kpiMonthProjKwh) elements.kpiMonthProjKwh.textContent = `${projectedMonthKwh.toFixed(0)} kWh`;

        // Budget meter
        if (elements.kpiBudgetProgress && elements.kpiBudgetText) {
            const budgetPct = Math.min(150, (billDetails.totalBill / (state.monthlyBudget || 1)) * 100);
            elements.kpiBudgetProgress.style.width = `${Math.min(100, budgetPct)}%`;
            if (budgetPct > 100) {
                elements.kpiBudgetProgress.style.background = 'var(--neon-rose)';
                elements.kpiBudgetText.innerHTML = `<span style="color: var(--neon-rose); font-weight:600;">Exceeded by ${tariff.formatCurrency(billDetails.totalBill - state.monthlyBudget)}</span> of ${tariff.formatCurrency(state.monthlyBudget)} cap`;
            } else {
                elements.kpiBudgetProgress.style.background = 'var(--neon-emerald)';
                elements.kpiBudgetText.textContent = `${budgetPct.toFixed(0)}% of ${tariff.formatCurrency(state.monthlyBudget)} budget cap`;
            }
        }

        if (elements.kpiCarbonKg) elements.kpiCarbonKg.textContent = `${eco.kgCO2.toLocaleString()} kg`;
        if (elements.kpiCarbonTrees) elements.kpiCarbonTrees.textContent = `Requires ~${eco.treesRequired} trees to offset`;

        if (elements.kpiEfficiencyScore) elements.kpiEfficiencyScore.textContent = `${eff.score}/100`;
        if (elements.kpiEfficiencyGrade) {
            elements.kpiEfficiencyGrade.textContent = `Grade ${eff.grade}`;
            elements.kpiEfficiencyGrade.style.color = eff.gradeColor;
            elements.kpiEfficiencyGrade.style.borderColor = eff.gradeColor;
        }

        if (vampire && elements.kpiBaseloadWatts && elements.kpiBaseloadAnnualCost) {
            elements.kpiBaseloadWatts.textContent = `${vampire.baseloadWatts} W`;
            elements.kpiBaseloadAnnualCost.textContent = `Est. ${tariff.formatCurrency(vampire.annualCost)} / year idle drain`;
        }

        // Anomalies
        renderAnomalies(demand.anomalies);
    }

    function renderCharts() {
        charts.initHourlyLoadChart('hourlyLoadChart', state.hourlyData);
        charts.initDailyTrendChart('dailyTrendChart', state.dailyData);
        charts.initMonthlySeasonChart('monthlySeasonChart', state.monthlyData);
        charts.initLiveStreamChart('liveStreamChart');

        // Appliance Category aggregates for Doughnut chart
        const categoryMap = {};
        state.appliances.forEach(app => {
            const calc = tariff.calculateApplianceMonthly(app);
            categoryMap[app.category] = (categoryMap[app.category] || 0) + calc.monthlyKwh;
        });

        const categoryData = Object.keys(categoryMap).map(cat => ({
            category: cat,
            monthlyKwh: categoryMap[cat]
        }));
        charts.initAppliancePieChart('appliancePieChart', categoryData);
    }

    // Render Appliance List
    function renderApplianceList() {
        if (!elements.applianceListContainer) return;
        elements.applianceListContainer.innerHTML = '';

        let totalMonthlyKwh = 0;
        let totalMonthlyCost = 0;

        state.appliances.forEach((app, idx) => {
            const calc = tariff.calculateApplianceMonthly(app);
            totalMonthlyKwh += calc.monthlyKwh;
            totalMonthlyCost += calc.monthlyCost;

            const card = document.createElement('div');
            card.className = 'appliance-card';
            card.innerHTML = `
                <div class="app-card-header">
                    <div class="app-icon-wrapper">
                        <span class="app-icon">${getIconEmoji(app.icon)}</span>
                        <div>
                            <h4 class="app-name">${escapeHtml(app.name)}</h4>
                            <span class="app-category-badge">${escapeHtml(app.category)}</span>
                        </div>
                    </div>
                    <button class="icon-btn remove-app-btn" title="Remove Appliance" data-index="${idx}">
                        &times;
                    </button>
                </div>
                <div class="app-card-body">
                    <div class="app-spec-row">
                        <span>Power Rating:</span>
                        <strong>${app.watts} W</strong>
                    </div>
                    <div class="app-spec-row">
                        <span>Daily Usage:</span>
                        <div class="inline-slider-wrap">
                            <input type="range" class="app-hours-slider" min="0.1" max="24" step="0.5" value="${app.hoursPerDay}" data-index="${idx}">
                            <span class="hours-val">${app.hoursPerDay}h</span>
                        </div>
                    </div>
                    <div class="app-spec-row highlight">
                        <span>Est. Monthly:</span>
                        <div class="app-cost-stat">
                            <strong>${calc.monthlyKwh} kWh</strong>
                            <span class="cost-badge">${tariff.formatCurrency(calc.monthlyCost)}</span>
                        </div>
                    </div>
                </div>
            `;
            elements.applianceListContainer.appendChild(card);
        });

        // Add listeners to inline sliders
        elements.applianceListContainer.querySelectorAll('.app-hours-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                state.appliances[idx].hoursPerDay = parseFloat(e.target.value);
                e.target.parentElement.querySelector('.hours-val').textContent = `${state.appliances[idx].hoursPerDay}h`;
                refreshAll();
            });
        });

        // Add listeners to delete buttons
        elements.applianceListContainer.querySelectorAll('.remove-app-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                state.appliances.splice(idx, 1);
                refreshAll();
            });
        });
    }

    function getIconEmoji(iconName) {
        const map = {
            snowflake: '❄️',
            refrigerator: '🧊',
            car: '🚗',
            droplet: '💧',
            disc: '🧺',
            monitor: '🖥️',
            sun: '💡',
            tv: '📺',
            flame: '🍳',
            sparkles: '✨'
        };
        return map[iconName] || '⚡';
    }

    // Render Recommendations
    function renderRecommendations() {
        if (!elements.insightsContainer) return;
        const todayKwh = state.hourlyData.reduce((s, h) => s + h.kwh, 0);
        const vampire = analytics.detectVampireLoad(state.hourlyData);
        const demand = analytics.analyzeDemandProfile(state.hourlyData);
        const eff = analytics.calculateEfficiencyScore(todayKwh, vampire ? vampire.baseloadWatts : 250, demand.onPeakRatio, demand.loadFactor);

        elements.insightsContainer.innerHTML = '';
        eff.recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'insight-card';
            item.innerHTML = `
                <div class="insight-header">
                    <span class="insight-icon">💡</span>
                    <div class="insight-title-group">
                        <h5>${escapeHtml(rec.title)}</h5>
                        <span class="impact-badge">${escapeHtml(rec.impact)}</span>
                    </div>
                </div>
                <p class="insight-detail">${escapeHtml(rec.detail)}</p>
            `;
            elements.insightsContainer.appendChild(item);
        });
    }

    // Render Anomalies & Spikes
    function renderAnomalies(anomalies) {
        if (!elements.anomalyContainer) return;
        elements.anomalyContainer.innerHTML = '';

        if (!anomalies || anomalies.length === 0) {
            elements.anomalyContainer.innerHTML = `
                <div class="clean-status-card">
                    <span class="status-icon">🛡️</span>
                    <div>
                        <strong>No Critical Load Anomalies Detected</strong>
                        <p>All hourly power draws fall within 2 standard deviations of normal residential patterns.</p>
                    </div>
                </div>
            `;
            return;
        }

        anomalies.forEach(ano => {
            const row = document.createElement('div');
            row.className = 'anomaly-card';
            row.innerHTML = `
                <span class="spike-icon">⚠️</span>
                <div class="anomaly-content">
                    <div class="anomaly-time"><strong>Demand Spike at ${ano.time}</strong> &bull; <span>${ano.kwh} kW (${ano.ratio}x baseline)</span></div>
                    <div class="anomaly-desc">Heavy simultaneous load triggered (e.g. HVAC + EV charging + Water heater). Consider staggering runtime.</div>
                </div>
            `;
            elements.anomalyContainer.appendChild(row);
        });
    }

    // What-If Off-Peak Shift Scenario Calculator
    function renderWhatIfScenario() {
        if (!elements.scenarioShiftVal || !elements.scenarioSavingsVal) return;
        const shiftHours = state.scenarioShiftHours;
        elements.scenarioShiftVal.textContent = `${shiftHours.toFixed(1)} hrs/day`;

        // Heavy appliances eligible for shifting: EV charger (7.2kW), Washer/Dryer (2.8kW), Dishwasher (1.4kW)
        const eligibleKw = 7.2 + 2.8 + 1.4; // Average shifted power ~3.5kW
        const avgShiftedKw = Math.min(eligibleKw, 4.0);
        const shiftedKwhDaily = avgShiftedKw * (shiftHours / 3); // realistic portion shifted
        const shiftedKwhMonthly = shiftedKwhDaily * 30;

        // Rate delta between on-peak and off-peak
        const deltaRate = Math.max(0.05, tariff.config.tou.onPeakRate - tariff.config.tou.offPeakRate);
        const monthlySavings = shiftedKwhMonthly * deltaRate;

        elements.scenarioSavingsVal.textContent = tariff.formatCurrency(monthlySavings);
    }

    // 5. Live Smart Meter Telemetry Simulator
    function startLiveSimulator() {
        if (state.liveInterval) clearInterval(state.liveInterval);
        state.isLiveActive = true;
        if (elements.liveStatusBadge) {
            elements.liveStatusBadge.innerHTML = `<span class="blinking-dot"></span> LIVE TELEMETRY`;
            elements.liveStatusBadge.className = 'status-badge live-active';
        }
        if (elements.liveToggleBtn) elements.liveToggleBtn.textContent = 'Pause Live Stream';

        state.liveInterval = setInterval(() => {
            // Fluctuate active power with realistic jitter
            const jitter = (Math.random() - 0.48) * 0.25;
            state.liveTelemetry.kw = Math.max(0.3, +(state.liveTelemetry.kw + jitter).toFixed(2));
            state.liveTelemetry.voltage = +(230 + (Math.random() - 0.5) * 2.8).toFixed(1);
            state.liveTelemetry.currentA = +( (state.liveTelemetry.kw * 1000) / (state.liveTelemetry.voltage * 0.96) ).toFixed(2);
            state.liveTelemetry.powerFactor = +(0.94 + Math.random() * 0.05).toFixed(2);

            // Update live KPI elements
            if (elements.kpiLiveKw) elements.kpiLiveKw.textContent = `${state.liveTelemetry.kw.toFixed(2)} kW`;
            if (elements.kpiLiveCostRate) {
                const hourlyCost = state.liveTelemetry.kw * tariff.getRateForHour(new Date().getHours());
                elements.kpiLiveCostRate.textContent = `${tariff.formatCurrency(hourlyCost)}/hr`;
            }

            const voltVal = document.getElementById('live-voltage-val');
            const ampVal = document.getElementById('live-current-val');
            const pfVal = document.getElementById('live-pf-val');
            if (voltVal) voltVal.textContent = `${state.liveTelemetry.voltage} V`;
            if (ampVal) ampVal.textContent = `${state.liveTelemetry.currentA} A`;
            if (pfVal) pfVal.textContent = state.liveTelemetry.powerFactor;

            // Push into live chart
            charts.pushLiveTelemetry(state.liveTelemetry.kw);
        }, 2000);
    }

    function stopLiveSimulator() {
        if (state.liveInterval) clearInterval(state.liveInterval);
        state.liveInterval = null;
        state.isLiveActive = false;
        if (elements.liveStatusBadge) {
            elements.liveStatusBadge.innerHTML = `<span class="paused-dot"></span> PAUSED`;
            elements.liveStatusBadge.className = 'status-badge live-paused';
        }
        if (elements.liveToggleBtn) elements.liveToggleBtn.textContent = 'Resume Live Stream';
    }

    // 6. CSV Parser & Ingestion
    function handleCsvContent(csvText) {
        try {
            const lines = csvText.trim().split(/\r?\n/);
            if (lines.length < 2) {
                alert('Uploaded CSV file is empty or invalid.');
                return;
            }

            const header = lines[0].toLowerCase().split(',');
            const kwhIdx = header.findIndex(h => h.includes('power') || h.includes('kwh') || h.includes('demand') || h.includes('energy'));
            const timeIdx = header.findIndex(h => h.includes('time') || h.includes('date') || h.includes('hour'));

            if (kwhIdx === -1) {
                alert('Could not find active power/energy column in CSV. Expected "active_power_kw" or "energy_kwh".');
                return;
            }

            const parsedHourly = [];
            const dataRows = lines.slice(1);

            dataRows.slice(0, 24).forEach((row, idx) => {
                const cols = row.split(',');
                if (cols.length > kwhIdx) {
                    const kwhVal = parseFloat(cols[kwhIdx]);
                    if (!isNaN(kwhVal)) {
                        const hour = idx % 24;
                        parsedHourly.push({
                            hour,
                            label: `${hour.toString().padStart(2, '0')}:00`,
                            kwh: Math.max(0.05, +kwhVal.toFixed(2)),
                            tier: tariff.getHourTier(hour),
                            temp: 24
                        });
                    }
                }
            });

            if (parsedHourly.length > 0) {
                state.hourlyData = parsedHourly;
                refreshAll();
                showNotification(`Successfully ingested ${dataRows.length} smart meter records! Dashboard updated.`, 'success');
            }
        } catch (err) {
            console.error('Error parsing CSV:', err);
            showNotification('Failed to parse CSV file. Please verify formatting.', 'error');
        }
    }

    // 7. Event Listeners Setup
    function setupEventListeners() {
        // Tab View Navigation Switcher
        const tabButtons = document.querySelectorAll('.nav-tab-btn');
        const viewPages = document.querySelectorAll('.view-page');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                state.activeTab = targetTab;

                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                viewPages.forEach(page => {
                    if (page.id === targetTab) {
                        page.classList.add('active');
                    } else {
                        page.classList.remove('active');
                    }
                });

                // Trigger chart resizing for newly displayed charts
                setTimeout(() => {
                    Object.values(charts.charts).forEach(c => {
                        if (c) c.resize();
                    });
                }, 50);

                if (targetTab === 'tab-data') {
                    renderTelemetryTable();
                }
            });
        });

        // Theme switch
        elements.themeToggleBtn?.addEventListener('click', () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', state.theme);
            localStorage.setItem('voltpulse_theme', state.theme);
            charts.setTheme(state.theme);
            refreshAll();
        });

        // Currency switch
        elements.currencySelect?.addEventListener('change', (e) => {
            state.currency = e.target.value;
            tariff.setCurrency(state.currency);
            refreshAll();
        });

        // Tariff model select
        elements.tariffModelSelect?.addEventListener('change', (e) => {
            tariff.config.model = e.target.value;
            // Update tier tags in hourly data
            state.hourlyData.forEach(h => {
                h.tier = tariff.getHourTier(h.hour);
            });
            refreshAll();
        });

        // Live meter toggle
        elements.liveToggleBtn?.addEventListener('click', () => {
            if (state.isLiveActive) stopLiveSimulator();
            else startLiveSimulator();
        });

        // Solar slider
        elements.solarSlider?.addEventListener('input', (e) => {
            state.solarMonthlyKwh = parseFloat(e.target.value);
            if (elements.solarValueLabel) elements.solarValueLabel.textContent = `${state.solarMonthlyKwh} kWh`;
            refreshAll();
        });

        // Budget input
        elements.budgetInput?.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val > 0) {
                state.monthlyBudget = val;
                refreshAll();
            }
        });

        // What-If slider
        elements.scenarioShiftSlider?.addEventListener('input', (e) => {
            state.scenarioShiftHours = parseFloat(e.target.value);
            renderWhatIfScenario();
        });

        // Add Appliance Modal controls
        elements.addApplianceBtn?.addEventListener('click', () => {
            elements.applianceModal?.classList.add('modal-open');
        });

        elements.closeApplianceModalBtn?.addEventListener('click', () => {
            elements.applianceModal?.classList.remove('modal-open');
        });

        elements.saveApplianceBtn?.addEventListener('click', () => {
            const name = document.getElementById('new-app-name')?.value.trim();
            const category = document.getElementById('new-app-category')?.value;
            const watts = parseFloat(document.getElementById('new-app-watts')?.value);
            const hours = parseFloat(document.getElementById('new-app-hours')?.value);
            const icon = document.getElementById('new-app-icon')?.value || 'sparkles';

            if (!name || isNaN(watts) || isNaN(hours)) {
                alert('Please provide valid appliance details.');
                return;
            }

            state.appliances.push({
                id: `app_${Date.now()}`,
                name,
                category,
                watts,
                hoursPerDay: hours,
                standbyWatts: 2,
                count: 1,
                icon
            });

            elements.applianceModal?.classList.remove('modal-open');
            refreshAll();
            showNotification(`Added ${name} to energy audit!`, 'success');
        });

        // Tariff Modal controls
        elements.tariffSettingsBtn?.addEventListener('click', () => {
            // Pre-fill inputs
            document.getElementById('tou-onpeak-rate').value = tariff.config.tou.onPeakRate;
            document.getElementById('tou-midpeak-rate').value = tariff.config.tou.midPeakRate;
            document.getElementById('tou-offpeak-rate').value = tariff.config.tou.offPeakRate;
            document.getElementById('fixed-charge-input').value = tariff.config.fixedMonthlyCharge;
            document.getElementById('tax-rate-input').value = tariff.config.taxRatePercent;
            elements.tariffModal?.classList.add('modal-open');
        });

        elements.closeTariffModalBtn?.addEventListener('click', () => {
            elements.tariffModal?.classList.remove('modal-open');
        });

        elements.saveTariffBtn?.addEventListener('click', () => {
            tariff.config.tou.onPeakRate = parseFloat(document.getElementById('tou-onpeak-rate').value) || 0.31;
            tariff.config.tou.midPeakRate = parseFloat(document.getElementById('tou-midpeak-rate').value) || 0.18;
            tariff.config.tou.offPeakRate = parseFloat(document.getElementById('tou-offpeak-rate').value) || 0.11;
            tariff.config.fixedMonthlyCharge = parseFloat(document.getElementById('fixed-charge-input').value) || 12.50;
            tariff.config.taxRatePercent = parseFloat(document.getElementById('tax-rate-input').value) || 7.5;

            elements.tariffModal?.classList.remove('modal-open');
            refreshAll();
            showNotification('Custom tariff rates saved and applied!', 'success');
        });

        // CSV File Drop & Input
        elements.csvFileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => handleCsvContent(evt.target.result);
                reader.readAsText(file);
            }
        });

        elements.csvDropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.csvDropZone.classList.add('drag-over');
        });

        elements.csvDropZone?.addEventListener('dragleave', () => {
            elements.csvDropZone.classList.remove('drag-over');
        });

        elements.csvDropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.csvDropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => handleCsvContent(evt.target.result);
                reader.readAsText(file);
            }
        });

        // Load pre-bundled sample dataset button
        elements.loadSampleDataBtn?.addEventListener('click', () => {
            fetch('./sample_smart_meter_data.csv')
                .then(res => res.text())
                .then(csv => {
                    handleCsvContent(csv);
                })
                .catch(err => {
                    console.error(err);
                    showNotification('Sample data file loaded from memory.', 'info');
                    state.hourlyData = JSON.parse(JSON.stringify(VoltData.HOURLY_PROFILE));
                    refreshAll();
                });
        });

        // Export to CSV
        elements.exportCsvBtn?.addEventListener('click', () => {
            let csvContent = 'data:text/csv;charset=utf-8,hour,timestamp,demand_kwh,rate_tier,cost\n';
            state.hourlyData.forEach(h => {
                const cost = tariff.calculateHourlyCost(h.kwh, h.hour);
                csvContent += `${h.hour},${h.label},${h.kwh},${h.tier},${cost}\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `voltpulse_energy_audit_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('Energy report exported to CSV.', 'success');
        });

        // Print / Save as PDF
        elements.printReportBtn?.addEventListener('click', () => {
            window.print();
        });
    }

    // Simple toast notification
    function showNotification(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `voltpulse-toast toast-${type}`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m]);
    }

    // 8. Launch Application
    setupEventListeners();
    refreshAll();
    startLiveSimulator();
});

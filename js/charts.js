/**
 * VoltPulse - Smart Electricity Usage & Cost Analyser
 * Charts Module: High-performance Chart.js wrappers with dark/light themes and glowing gradients
 */

class ChartManager {
    constructor() {
        this.charts = {};
        this.theme = 'light';
    }

    setTheme(theme) {
        this.theme = theme;
        this.updateThemeDefaults();
        // Re-render charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.update();
        });
    }

    updateThemeDefaults() {
        if (!window.Chart) return;
        const isDark = this.theme === 'dark';
        Chart.defaults.color = isDark ? '#94A3B8' : '#334155';
        Chart.defaults.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
        Chart.defaults.font.family = "'Outfit', 'Inter', -apple-system, sans-serif";
    }

    /**
     * 1. 24-Hour Load Curve Chart
     */
    initHourlyLoadChart(canvasId, hourlyData) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        const isDark = this.theme === 'dark';
        const primaryLineColor = isDark ? '#00F0FF' : '#0284C7';
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        if (isDark) {
            gradient.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
            gradient.addColorStop(0.6, 'rgba(0, 240, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
        } else {
            gradient.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
            gradient.addColorStop(0.6, 'rgba(2, 132, 199, 0.08)');
            gradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');
        }

        const pointColors = hourlyData.map(d => {
            if (d.tier === 'on-peak') return '#EF4444'; // Red for on-peak
            if (d.tier === 'mid-peak') return '#F59E0B'; // Amber
            return primaryLineColor; // Blue/Cyan for off-peak
        });

        this.charts.hourly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hourlyData.map(d => d.label),
                datasets: [{
                    label: 'Electricity Demand (kW / kWh)',
                    data: hourlyData.map(d => d.kwh),
                    borderColor: primaryLineColor,
                    borderWidth: 2.5,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: isDark ? '#0F172A' : '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 4.5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        titleColor: '#F8FAFC',
                        bodyColor: '#94A3B8',
                        borderColor: 'rgba(0, 240, 255, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                const d = hourlyData[context.dataIndex];
                                return [
                                    `Demand: ${context.parsed.y.toFixed(2)} kWh`,
                                    `Rate Tier: ${d.tier.toUpperCase()}`,
                                    `Estimated Temp: ${d.temp || 24}°C`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: this.theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.06)' },
                        ticks: {
                            callback: (val) => `${val} kW`
                        }
                    }
                }
            }
        });
    }

    /**
     * 2. Past 30 Days Trend Bar Chart
     */
    initDailyTrendChart(canvasId, dailyData) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        this.charts.daily = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dailyData.map(d => d.dayLabel),
                datasets: [
                    {
                        label: 'Off-Peak (kWh)',
                        data: dailyData.map(d => d.offPeakKwh),
                        backgroundColor: '#10B981',
                        borderRadius: 4,
                        stack: 'consumption'
                    },
                    {
                        label: 'On/Mid-Peak (kWh)',
                        data: dailyData.map(d => d.peakKwh),
                        backgroundColor: '#F59E0B',
                        borderRadius: 4,
                        stack: 'consumption'
                    },
                    {
                        type: 'line',
                        label: 'Solar Gen (kWh)',
                        data: dailyData.map(d => d.solarGenKwh),
                        borderColor: '#38BDF8',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointRadius: 2,
                        pointHoverRadius: 5,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, padding: 16 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        ticks: {
                            callback: (val) => `${val} kWh`
                        }
                    }
                }
            }
        });
    }

    /**
     * 3. Appliance Breakdown Doughnut Chart
     */
    initAppliancePieChart(canvasId, categoryData) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        if (this.charts.appliance) {
            this.charts.appliance.destroy();
        }

        const colors = [
            '#00F0FF', // Cyan
            '#10B981', // Emerald
            '#8B5CF6', // Purple
            '#F59E0B', // Amber
            '#EC4899', // Pink
            '#3B82F6', // Blue
            '#14B8A6'  // Teal
        ];

        this.charts.appliance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(d => d.category),
                datasets: [{
                    data: categoryData.map(d => d.monthlyKwh),
                    backgroundColor: colors.slice(0, categoryData.length),
                    borderColor: this.theme === 'dark' ? '#0F172A' : '#FFFFFF',
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 14 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return ` ${val.toFixed(1)} kWh/mo (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * 4. 12-Month Seasonal Profile Chart
     */
    initMonthlySeasonChart(canvasId, monthlyData) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Baseload',
                        data: monthlyData.map(d => d.baseload),
                        backgroundColor: '#64748B',
                        stack: 'season'
                    },
                    {
                        label: 'AC / Cooling',
                        data: monthlyData.map(d => d.cooling),
                        backgroundColor: '#00F0FF',
                        stack: 'season'
                    },
                    {
                        label: 'Heating',
                        data: monthlyData.map(d => d.heating),
                        backgroundColor: '#F97316',
                        stack: 'season'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, padding: 14 } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        padding: 12
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        stacked: true,
                        ticks: { callback: (val) => `${val} kWh` }
                    }
                }
            }
        });
    }

    /**
     * 5. Live Meter Real-Time Rolling Stream Chart
     */
    initLiveStreamChart(canvasId) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        if (this.charts.live) {
            this.charts.live.destroy();
        }

        const initialLabels = Array.from({ length: 16 }, (_, i) => `${-(15 - i) * 2}s`);
        const initialData = Array(16).fill(1.2);

        this.charts.live = new Chart(ctx, {
            type: 'line',
            data: {
                labels: initialLabels,
                datasets: [{
                    label: 'Live Power Draw (kW)',
                    data: initialData,
                    borderColor: '#10B981',
                    borderWidth: 2,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
                    y: {
                        suggestedMin: 0,
                        suggestedMax: 4.5,
                        grid: { color: this.theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.06)' },
                        ticks: { callback: (v) => `${v.toFixed(1)} kW` }
                    }
                }
            }
        });
    }

    pushLiveTelemetry(newKw) {
        if (!this.charts.live) return;
        const chart = this.charts.live;
        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].data.push(newKw);
        chart.update('none'); // Update without animation for 60fps responsiveness
    }
}

window.ChartManager = ChartManager;

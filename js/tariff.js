/**
 * VoltPulse - Smart Electricity Usage & Cost Analyser
 * Tariff Module: Multi-model billing calculations (ToU, Tiered, Flat, Solar credits)
 */

class TariffEngine {
    constructor() {
        this.currencies = {
            USD: { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
            INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
            EUR: { symbol: '€', code: 'EUR', name: 'Euro (€)' },
            GBP: { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
            AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' }
        };

        this.currentCurrency = 'USD';

        this.config = {
            model: 'tou', // 'tou', 'tiered', 'flat'
            fixedMonthlyCharge: 12.50,
            taxRatePercent: 7.5,
            solarFeedInRate: 0.08,
            
            // Time of Use (ToU) Rates ($/kWh)
            tou: {
                offPeakRate: 0.11,
                midPeakRate: 0.18,
                onPeakRate: 0.31,
                // Time blocks (24-hour)
                onPeakHours: [14, 15, 16, 17, 18, 19], // 2 PM - 8 PM
                offPeakHours: [22, 23, 0, 1, 2, 3, 4, 5], // 10 PM - 6 AM
                // Remainder is mid-peak: 6 AM - 2 PM, 8 PM - 10 PM
            },

            // Tiered / Slab Rates ($/kWh)
            tiered: {
                slabs: [
                    { limit: 150, rate: 0.12, label: 'Tier 1 (0 - 150 kWh)' },
                    { limit: 400, rate: 0.18, label: 'Tier 2 (151 - 400 kWh)' },
                    { limit: Infinity, rate: 0.28, label: 'Tier 3 (> 400 kWh)' }
                ]
            },

            // Flat Rate ($/kWh)
            flat: {
                rate: 0.165
            }
        };
    }

    setCurrency(code) {
        if (this.currencies[code]) {
            this.currentCurrency = code;
        }
    }

    formatCurrency(amount) {
        const symbol = this.currencies[this.currentCurrency]?.symbol || '$';
        const formattedNumber = Math.abs(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${amount < 0 ? '-' : ''}${symbol}${formattedNumber}`;
    }

    getHourTier(hour) {
        if (this.config.tou.onPeakHours.includes(hour)) return 'on-peak';
        if (this.config.tou.offPeakHours.includes(hour)) return 'off-peak';
        return 'mid-peak';
    }

    getRateForHour(hour) {
        if (this.config.model === 'flat') {
            return this.config.flat.rate;
        }
        if (this.config.model === 'tou') {
            const tier = this.getHourTier(hour);
            if (tier === 'on-peak') return this.config.tou.onPeakRate;
            if (tier === 'off-peak') return this.config.tou.offPeakRate;
            return this.config.tou.midPeakRate;
        }
        // If tiered, return an approximate blended baseline rate for hourly display
        return this.config.tiered.slabs[1].rate;
    }

    calculateHourlyCost(kwh, hour) {
        const rate = this.getRateForHour(hour);
        return +(kwh * rate).toFixed(3);
    }

    /**
     * Calculate cost for monthly consumption based on selected tariff model
     */
    calculateMonthlyBill(totalKwh, peakRatio = 0.35, solarGenKwh = 0) {
        let energyCharge = 0;
        let breakdown = [];

        if (this.config.model === 'tou') {
            const onPeakKwh = totalKwh * peakRatio;
            const offPeakKwh = totalKwh * 0.40;
            const midPeakKwh = totalKwh - onPeakKwh - offPeakKwh;

            const onPeakCost = onPeakKwh * this.config.tou.onPeakRate;
            const midPeakCost = midPeakKwh * this.config.tou.midPeakRate;
            const offPeakCost = offPeakKwh * this.config.tou.offPeakRate;

            energyCharge = onPeakCost + midPeakCost + offPeakCost;
            breakdown.push({ label: `On-Peak (${onPeakKwh.toFixed(1)} kWh @ ${this.formatCurrency(this.config.tou.onPeakRate)}/kWh)`, cost: onPeakCost });
            breakdown.push({ label: `Mid-Peak (${midPeakKwh.toFixed(1)} kWh @ ${this.formatCurrency(this.config.tou.midPeakRate)}/kWh)`, cost: midPeakCost });
            breakdown.push({ label: `Off-Peak (${offPeakKwh.toFixed(1)} kWh @ ${this.formatCurrency(this.config.tou.offPeakRate)}/kWh)`, cost: offPeakCost });
        } else if (this.config.model === 'tiered') {
            let remainingKwh = totalKwh;
            let previousLimit = 0;

            for (const slab of this.config.tiered.slabs) {
                if (remainingKwh <= 0) break;
                const slabCapacity = slab.limit === Infinity ? remainingKwh : slab.limit - previousLimit;
                const kwhInSlab = Math.min(remainingKwh, slabCapacity);
                const slabCost = kwhInSlab * slab.rate;
                energyCharge += slabCost;
                breakdown.push({ label: `${slab.label}: ${kwhInSlab.toFixed(1)} kWh @ ${this.formatCurrency(slab.rate)}/kWh`, cost: slabCost });
                remainingKwh -= kwhInSlab;
                previousLimit = slab.limit;
            }
        } else {
            // Flat rate
            energyCharge = totalKwh * this.config.flat.rate;
            breakdown.push({ label: `Energy Charge: ${totalKwh.toFixed(1)} kWh @ ${this.formatCurrency(this.config.flat.rate)}/kWh`, cost: energyCharge });
        }

        // Solar Credit
        let solarCredit = 0;
        if (solarGenKwh > 0) {
            solarCredit = solarGenKwh * this.config.solarFeedInRate;
        }

        const netEnergyCharge = Math.max(0, energyCharge - solarCredit);
        const subtotal = netEnergyCharge + this.config.fixedMonthlyCharge;
        const taxAmount = (subtotal * this.config.taxRatePercent) / 100;
        const totalBill = subtotal + taxAmount;
        const blendedRate = totalKwh > 0 ? (totalBill / totalKwh) : 0;

        return {
            totalKwh,
            energyCharge: +energyCharge.toFixed(2),
            solarCredit: +solarCredit.toFixed(2),
            fixedMonthlyCharge: this.config.fixedMonthlyCharge,
            taxAmount: +taxAmount.toFixed(2),
            totalBill: +totalBill.toFixed(2),
            blendedRate: +blendedRate.toFixed(3),
            breakdown
        };
    }

    /**
     * Compute monthly cost of an appliance
     */
    calculateApplianceMonthly(appliance) {
        const dailyKwh = (appliance.watts * (appliance.dutyCycle || 1.0) * appliance.hoursPerDay * (appliance.count || 1)) / 1000;
        const monthlyKwh = dailyKwh * 30;
        const standbyMonthlyKwh = ((appliance.standbyWatts || 0) * (24 - appliance.hoursPerDay) * 30) / 1000;
        const totalApplianceKwh = monthlyKwh + standbyMonthlyKwh;

        // Blended average rate
        const avgRate = this.config.model === 'flat' 
            ? this.config.flat.rate 
            : (this.config.model === 'tou' 
                ? (this.config.tou.offPeakRate * 0.4 + this.config.tou.midPeakRate * 0.35 + this.config.tou.onPeakRate * 0.25)
                : this.config.tiered.slabs[1].rate);

        const activeCost = monthlyKwh * avgRate;
        const standbyCost = standbyMonthlyKwh * avgRate;

        return {
            dailyKwh: +dailyKwh.toFixed(2),
            monthlyKwh: +totalApplianceKwh.toFixed(2),
            activeCost: +activeCost.toFixed(2),
            standbyCost: +standbyCost.toFixed(2),
            monthlyCost: +(activeCost + standbyCost).toFixed(2)
        };
    }
}

window.TariffEngine = TariffEngine;

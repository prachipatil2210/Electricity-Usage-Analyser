/**
 * VoltPulse - Smart Electricity Usage & Cost Analyser
 * Analytics Module: Vampire load detection, peak demand analysis, carbon footprint, efficiency scoring
 */

class EnergyAnalytics {
    constructor(tariffEngine) {
        this.tariffEngine = tariffEngine;
        this.emissionFactor = 0.385; // kg CO2e / kWh (US Avg default)
    }

    setEmissionFactor(regionKey) {
        if (window.VoltData.EMISSION_FACTORS[regionKey]) {
            this.emissionFactor = window.VoltData.EMISSION_FACTORS[regionKey];
        }
    }

    /**
     * Detect Vampire (Standby) Baseload from 24h curve (01:00 - 05:00)
     */
    detectVampireLoad(hourlyData) {
        const nightHours = hourlyData.filter(h => h.hour >= 1 && h.hour <= 5);
        if (!nightHours.length) return null;

        const minHour = nightHours.reduce((min, cur) => cur.kwh < min.kwh ? cur : min, nightHours[0]);
        const baseloadWatts = Math.round(minHour.kwh * 1000); // 1-hour kWh = average kW * 1000
        const annualKwh = (baseloadWatts * 24 * 365) / 1000;
        const annualCost = annualKwh * (this.tariffEngine.config.model === 'flat' ? this.tariffEngine.config.flat.rate : 0.16);

        let severity = 'low';
        let recommendation = 'Your baseline power drain is healthy and within optimal residential limits.';
        if (baseloadWatts > 450) {
            severity = 'critical';
            recommendation = 'High phantom load detected! Multiple devices (consoles, set-top boxes, old refrigerators, audio amps) are drawing significant idle power. Use smart surge protectors with auto-shutoff.';
        } else if (baseloadWatts > 250) {
            severity = 'moderate';
            recommendation = 'Moderate standby power draw. Unplug rarely used chargers, entertainment centers, and enable sleep mode on desktop PCs.';
        }

        return {
            baseloadWatts,
            annualKwh: Math.round(annualKwh),
            annualCost: +annualCost.toFixed(2),
            severity,
            recommendation
        };
    }

    /**
     * Compute Carbon Footprint and Environmental Equivalencies
     */
    calculateEcoImpact(totalKwh) {
        const kgCO2 = totalKwh * this.emissionFactor;
        const metricTonsCO2 = kgCO2 / 1000;
        
        // 1 mature urban tree absorbs approx 21.77 kg CO2 per year (~1.81 kg/month)
        const treesRequired = Math.ceil(kgCO2 / 1.81);
        
        // 1 gallon of gasoline produces ~8.887 kg CO2; average car achieves ~25 mpg -> ~0.355 kg CO2/mile
        const carMilesEquivalent = Math.round(kgCO2 / 0.355);

        // Smartphone charges equivalent (approx 0.008 kg CO2 per full charge)
        const phoneCharges = Math.round(kgCO2 / 0.008);

        return {
            kgCO2: +kgCO2.toFixed(1),
            metricTonsCO2: +metricTonsCO2.toFixed(3),
            treesRequired,
            carMilesEquivalent,
            phoneCharges
        };
    }

    /**
     * Analyze Peak Demand, Load Factor, and Anomalies
     */
    analyzeDemandProfile(hourlyData) {
        let maxPoint = hourlyData[0];
        let totalKwh = 0;
        let onPeakKwh = 0;
        let offPeakKwh = 0;

        hourlyData.forEach(h => {
            totalKwh += h.kwh;
            if (h.kwh > maxPoint.kwh) {
                maxPoint = h;
            }
            if (h.tier === 'on-peak') {
                onPeakKwh += h.kwh;
            } else if (h.tier === 'off-peak') {
                offPeakKwh += h.kwh;
            }
        });

        const avgKwhPerHour = totalKwh / hourlyData.length;
        // Load factor: ratio of average load to peak load (closer to 1.0 is more efficient)
        const loadFactor = +(avgKwhPerHour / (maxPoint.kwh || 1)).toFixed(2);
        const peakToAvgRatio = +(maxPoint.kwh / (avgKwhPerHour || 1)).toFixed(1);

        // Detect anomaly spikes (>2.2x average)
        const anomalies = hourlyData.filter(h => h.kwh > avgKwhPerHour * 2.2).map(h => ({
            hour: h.hour,
            time: h.label,
            kwh: h.kwh,
            ratio: +(h.kwh / avgKwhPerHour).toFixed(1)
        }));

        return {
            totalKwh: +totalKwh.toFixed(2),
            peakDemandKw: +maxPoint.kwh.toFixed(2), // 1 hour kwh = average kw
            peakHourTime: maxPoint.label,
            loadFactor,
            peakToAvgRatio,
            onPeakRatio: +((onPeakKwh / (totalKwh || 1)) * 100).toFixed(0),
            offPeakRatio: +((offPeakKwh / (totalKwh || 1)) * 100).toFixed(0),
            anomalies
        };
    }

    /**
     * Calculate Overall Energy Efficiency Score (0 - 100) & Grade (A+ to F)
     */
    calculateEfficiencyScore(dailyKwh, baseloadWatts, onPeakRatio, loadFactor) {
        let score = 100;

        // Daily consumption penalty (benchmark: 25 kWh/day)
        if (dailyKwh > 45) score -= 30;
        else if (dailyKwh > 32) score -= 18;
        else if (dailyKwh > 24) score -= 8;

        // Vampire load penalty (benchmark: < 200W)
        if (baseloadWatts > 450) score -= 25;
        else if (baseloadWatts > 300) score -= 15;
        else if (baseloadWatts > 200) score -= 7;

        // On-peak ratio penalty (benchmark: < 30%)
        if (onPeakRatio > 50) score -= 20;
        else if (onPeakRatio > 35) score -= 12;
        else if (onPeakRatio > 25) score -= 5;

        // Load factor bonus/penalty
        if (loadFactor < 0.35) score -= 10;
        else if (loadFactor > 0.65) score += 5;

        score = Math.max(20, Math.min(100, Math.round(score)));

        let grade = 'A+';
        let gradeColor = 'var(--neon-emerald)';
        if (score >= 90) { grade = 'A+'; gradeColor = '#10B981'; }
        else if (score >= 80) { grade = 'A'; gradeColor = '#34D399'; }
        else if (score >= 70) { grade = 'B'; gradeColor = '#3B82F6'; }
        else if (score >= 60) { grade = 'C'; gradeColor = '#F59E0B'; }
        else if (score >= 45) { grade = 'D'; gradeColor = '#F97316'; }
        else { grade = 'F'; gradeColor = '#EF4444'; }

        // Actionable savings recommendations
        const recommendations = [];

        if (onPeakRatio > 30) {
            recommendations.push({
                icon: 'clock',
                title: 'Shift Heavy Loads to Off-Peak',
                impact: 'Save up to $25–$45 / mo',
                detail: 'Run your EV charging, dishwasher, and laundry cycle after 10 PM or before 2 PM when ToU electricity rates drop by up to 60%.'
            });
        }

        if (baseloadWatts > 250) {
            recommendations.push({
                icon: 'zap-off',
                title: 'Tame Nighttime Vampire Drain',
                impact: `Save approx ${this.tariffEngine.formatCurrency((baseloadWatts - 150) * 0.001 * 24 * 365 * 0.16)} / year`,
                detail: 'Standby baseload is higher than average. Put home office equipment and TV consoles on scheduled smart plugs.'
            });
        }

        recommendations.push({
            icon: 'thermometer',
            title: 'Optimize HVAC Setpoints',
            impact: 'Save 7–10% on cooling & heating',
            detail: 'Raising the thermostat by just 1°C (2°F) in summer or lowering it in winter trims roughly 7% off your HVAC energy load.'
        });

        recommendations.push({
            icon: 'sun',
            title: 'Rooftop Solar Feasibility',
            impact: 'Potential 50–70% bill reduction',
            detail: 'Your midday demand aligns well with typical 4kW–6kW solar panel generation profiles.'
        });

        return {
            score,
            grade,
            gradeColor,
            recommendations
        };
    }
}

window.EnergyAnalytics = EnergyAnalytics;

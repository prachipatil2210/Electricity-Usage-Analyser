/**
 * VoltPulse - Smart Electricity Usage & Cost Analyser
 * Data Module: Default datasets, historical logs, appliance specifications
 */

const DEFAULT_APPLIANCES = [
    { id: 'app_1', name: 'Central Air Conditioner', category: 'HVAC', watts: 3200, hoursPerDay: 6, standbyWatts: 15, count: 1, icon: 'snowflake' },
    { id: 'app_2', name: 'Inverter Refrigerator', category: 'Kitchen', watts: 180, hoursPerDay: 24, dutyCycle: 0.45, standbyWatts: 0, count: 1, icon: 'refrigerator' },
    { id: 'app_3', name: 'EV Level 2 Charger', category: 'EV', watts: 7200, hoursPerDay: 2.2, standbyWatts: 5, count: 1, icon: 'car' },
    { id: 'app_4', name: 'Electric Water Heater', category: 'Utility', watts: 3800, hoursPerDay: 2, standbyWatts: 0, count: 1, icon: 'droplet' },
    { id: 'app_5', name: 'Front Load Washer & Dryer', category: 'Laundry', watts: 2800, hoursPerDay: 1.2, standbyWatts: 3, count: 1, icon: 'disc' },
    { id: 'app_6', name: 'High-End PC & Dual Monitors', category: 'Work & Media', watts: 420, hoursPerDay: 8, standbyWatts: 12, count: 1, icon: 'monitor' },
    { id: 'app_7', name: 'Whole-Home LED Lighting', category: 'Lighting', watts: 160, hoursPerDay: 5.5, standbyWatts: 0, count: 1, icon: 'sun' },
    { id: 'app_8', name: 'Smart 65" 4K OLED TV + Audio', category: 'Work & Media', watts: 210, hoursPerDay: 4, standbyWatts: 8, count: 1, icon: 'tv' },
    { id: 'app_9', name: 'Microwave & Induction Cooker', category: 'Kitchen', watts: 1500, hoursPerDay: 0.8, standbyWatts: 4, count: 1, icon: 'flame' },
    { id: 'app_10', name: 'Dishwasher (Eco Cycle)', category: 'Kitchen', watts: 1400, hoursPerDay: 1, standbyWatts: 2, count: 1, icon: 'sparkles' }
];

// 24-hour baseline profile with realistic diurnal curves (morning prep spike, midday lull/solar, evening dinner/HVAC peak, night baseload)
const HOURLY_PROFILE = [
    { hour: 0, label: '00:00', kwh: 0.42, tier: 'off-peak', temp: 22 },
    { hour: 1, label: '01:00', kwh: 0.38, tier: 'off-peak', temp: 21 },
    { hour: 2, label: '02:00', kwh: 0.35, tier: 'off-peak', temp: 20 },
    { hour: 3, label: '03:00', kwh: 0.32, tier: 'off-peak', temp: 20 },
    { hour: 4, label: '04:00', kwh: 0.34, tier: 'off-peak', temp: 19 },
    { hour: 5, label: '05:00', kwh: 0.48, tier: 'off-peak', temp: 19 },
    { hour: 6, label: '06:00', kwh: 1.15, tier: 'off-peak', temp: 20 },
    { hour: 7, label: '07:00', kwh: 1.85, tier: 'mid-peak', temp: 22 },
    { hour: 8, label: '08:00', kwh: 1.60, tier: 'mid-peak', temp: 24 },
    { hour: 9, label: '09:00', kwh: 0.95, tier: 'mid-peak', temp: 26 },
    { hour: 10, label: '10:00', kwh: 0.78, tier: 'mid-peak', temp: 28 },
    { hour: 11, label: '11:00', kwh: 0.85, tier: 'mid-peak', temp: 30 },
    { hour: 12, label: '12:00', kwh: 1.10, tier: 'mid-peak', temp: 32 },
    { hour: 13, label: '13:00', kwh: 1.35, tier: 'mid-peak', temp: 33 },
    { hour: 14, label: '14:00', kwh: 2.10, tier: 'on-peak', temp: 34 },
    { hour: 15, label: '15:00', kwh: 2.45, tier: 'on-peak', temp: 34 },
    { hour: 16, label: '16:00', kwh: 2.80, tier: 'on-peak', temp: 33 },
    { hour: 17, label: '17:00', kwh: 3.15, tier: 'on-peak', temp: 32 },
    { hour: 18, label: '18:00', kwh: 3.65, tier: 'on-peak', temp: 30 },
    { hour: 19, label: '19:00', kwh: 3.40, tier: 'on-peak', temp: 28 },
    { hour: 20, label: '20:00', kwh: 2.65, tier: 'mid-peak', temp: 27 },
    { hour: 21, label: '21:00', kwh: 1.95, tier: 'mid-peak', temp: 26 },
    { hour: 22, label: '22:00', kwh: 1.40, tier: 'off-peak', temp: 24 },
    { hour: 23, label: '23:00', kwh: 0.82, tier: 'off-peak', temp: 23 }
];

// Generate past 30 days history with weekend differences & weather variance
function generateDailyHistory() {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Base consumption: weekdays ~24-28 kWh, weekends ~30-36 kWh
        const base = isWeekend ? 32 : 25;
        const variance = (Math.sin(i * 0.7) * 4) + (Math.random() * 3 - 1.5);
        const totalKwh = Math.max(14, +(base + variance).toFixed(2));
        
        const peakRatio = isWeekend ? 0.38 : 0.44;
        const peakKwh = +(totalKwh * peakRatio).toFixed(2);
        const offPeakKwh = +(totalKwh - peakKwh).toFixed(2);
        
        days.push({
            date: d.toISOString().split('T')[0],
            dayLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            isWeekend,
            totalKwh,
            peakKwh,
            offPeakKwh,
            solarGenKwh: +(Math.max(0, 12 + Math.cos(i * 0.4) * 5 + (Math.random() * 2 - 1))).toFixed(2)
        });
    }
    return days;
}

// 12-Month Historical & Seasonal Profile
const MONTHLY_PROFILE = [
    { month: 'Jan', kwh: 780, heating: 290, cooling: 0, baseload: 490 },
    { month: 'Feb', kwh: 720, heating: 250, cooling: 0, baseload: 470 },
    { month: 'Mar', kwh: 640, heating: 120, cooling: 30, baseload: 490 },
    { month: 'Apr', kwh: 580, heating: 30, cooling: 70, baseload: 480 },
    { month: 'May', kwh: 710, heating: 0, cooling: 220, baseload: 490 },
    { month: 'Jun', kwh: 920, heating: 0, cooling: 420, baseload: 500 },
    { month: 'Jul', kwh: 1140, heating: 0, cooling: 630, baseload: 510 },
    { month: 'Aug', kwh: 1090, heating: 0, cooling: 590, baseload: 500 },
    { month: 'Sep', kwh: 860, heating: 0, cooling: 370, baseload: 490 },
    { month: 'Oct', kwh: 620, heating: 20, cooling: 110, baseload: 490 },
    { month: 'Nov', kwh: 690, heating: 190, cooling: 0, baseload: 500 },
    { month: 'Dec', kwh: 830, heating: 330, cooling: 0, baseload: 500 }
];

// Grid Emission factors (kg CO2e per kWh) by region
const EMISSION_FACTORS = {
    US_AVG: 0.385,
    EU_AVG: 0.230,
    UK_AVG: 0.198,
    IN_AVG: 0.710,
    GLOBAL_CLEAN: 0.120
};

window.VoltData = {
    DEFAULT_APPLIANCES,
    HOURLY_PROFILE,
    generateDailyHistory,
    MONTHLY_PROFILE,
    EMISSION_FACTORS
};

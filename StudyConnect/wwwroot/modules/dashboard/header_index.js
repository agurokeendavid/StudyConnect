// Chart.js initialization and configuration
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chart.js loaded:', typeof Chart !== 'undefined');

    // Set Chart.js defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#6c757d';
    }

    // Load Chart.js if not already loaded
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js';
        script.onload = function() {
            console.log('Chart.js dynamically loaded');
        };
        document.head.appendChild(script);
    }
});


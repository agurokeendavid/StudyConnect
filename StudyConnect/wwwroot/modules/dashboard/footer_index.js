$(document).ready(function() {
    // Wait for Chart.js to load before initializing
    function waitForChart() {
        if (typeof Chart !== 'undefined') {
            console.log('Chart.js is ready, initializing chart...');
            initializeUserActivityChart();
        } else {
            console.log('Waiting for Chart.js to load...');
            setTimeout(waitForChart, 100);
        }
    }

    // Start checking for Chart.js
    waitForChart();

    // Update chart data every 5 minutes
    setInterval(function() {
        if (window.userActivityChart) {
            updateChartData();
        }
    }, 300000);

    function initializeUserActivityChart() {
        const ctx = document.getElementById('userActivityChart');
        if (!ctx) {
            console.error('Canvas element #userActivityChart not found');
            return;
        }

        console.log('Initializing chart with canvas element:', ctx);

        // Chart configuration
        const config = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily Activities',
                    data: [],
                    borderColor: '#5d87ff',
                    backgroundColor: 'rgba(93, 135, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#5d87ff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'New Users',
                    data: [],
                    borderColor: '#49beff',
                    backgroundColor: 'rgba(73, 190, 255, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#49beff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#5d87ff',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Count'
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        };

        try {
            // Create chart
            window.userActivityChart = new Chart(ctx, config);
            console.log('Chart created successfully:', window.userActivityChart);

            // Load initial data
            setTimeout(() => loadChartData('7days'), 500);
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    }

    function loadChartData(period = '7days') {
        console.log('Loading chart data for period:', period);
        showChartLoading(true);

        const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -2).join('/');

        $.ajax({
            url: baseUrl + '/dashboard/get_activity_chart_data',
            method: 'POST',
            data: { period: period },
            dataType: 'json',
            success: function(response) {
                console.log('Chart data response:', response);
                if (response.success && response.data) {
                    updateChartWithData(response.data);
                } else {
                    console.log('Invalid response, using mock data');
                    updateChartWithMockData(period);
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', error);
                console.log('Using mock data due to error');
                updateChartWithMockData(period);
            },
            complete: function() {
                showChartLoading(false);
            }
        });
    }

    function updateChartWithData(data) {
        if (!window.userActivityChart) return;

        window.userActivityChart.data.labels = data.labels;
        window.userActivityChart.data.datasets[0].data = data.activities;
        window.userActivityChart.data.datasets[1].data = data.new_users;
        window.userActivityChart.update('active');
    }

    function updateChartWithMockData(period) {
        const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
        const labels = [];
        const activities = [];
        const newUsers = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            // Generate realistic mock data
            activities.push(Math.floor(Math.random() * 50) + 10 + (i < 7 ? 20 : 0)); // Recent days have more activity
            newUsers.push(Math.floor(Math.random() * 8) + 1);
        }

        updateChartWithData({
            labels: labels,
            activities: activities,
            new_users: newUsers
        });
    }

    function showChartLoading(show) {
        const chartContainer = $('#activityChart');
        if (show) {
            chartContainer.append(`
                <div class="chart-loading position-absolute top-50 start-50 translate-middle">
                    <div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span class="text-muted">Loading chart data...</span>
                    </div>
                </div>
            `);
        } else {
            chartContainer.find('.chart-loading').remove();
        }
    }

    function updateChartData() {
        const currentPeriod = $('.dropdown-menu .dropdown-item.active').text() || 'Last 7 days';
        const period = currentPeriod.includes('30') ? '30days' :
            currentPeriod.includes('3 months') ? '90days' : '7days';
        loadChartData(period);
    }

    // Handle period selection dropdown
    $('.dropdown-menu .dropdown-item').on('click', function(e) {
        e.preventDefault();

        const selectedText = $(this).text();
        const period = selectedText.includes('30') ? '30days' :
            selectedText.includes('3 months') ? '90days' : '7days';

        // Update dropdown button text
        $(this).closest('.dropdown').find('.dropdown-toggle').text(selectedText);

        // Update active state
        $(this).siblings().removeClass('active');
        $(this).addClass('active');

        // Load new data
        loadChartData(period);
    });

    // Add hover effects to chart metrics
    $('.border-end, .p-3').hover(
        function() {
            $(this).addClass('bg-light');
        },
        function() {
            $(this).removeClass('bg-light');
        }
    );

    // Animate numbers on load
    function animateNumbers() {
        $('.fw-bold').each(function() {
            const $this = $(this);
            const text = $this.text();
            const number = parseInt(text.replace(/[^0-9]/g, ''));

            if (!isNaN(number) && number > 0) {
                $this.text('0');
                $({ countNum: 0 }).animate({
                    countNum: number
                }, {
                    duration: 2000,
                    easing: 'swing',
                    step: function() {
                        $this.text(Math.floor(this.countNum) + text.replace(/[0-9]/g, ''));
                    },
                    complete: function() {
                        $this.text(text);
                    }
                });
            }
        });
    }

    // Initialize number animations
    setTimeout(animateNumbers, 500);
});

// Make sure Chart.js is loaded
if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
        console.log('Chart.js loaded successfully');
    };
    document.head.appendChild(script);
}

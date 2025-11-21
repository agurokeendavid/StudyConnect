// Dashboard Admin Content - Main Script File
let activityChart = null;

$(document).ready(function() {
    // Load dashboard data on page load
    loadDashboardStats();
    loadRecentActivities();
    loadActivityChart(7);

    // Load ads for free trial users
    if ($('#adBannerSection').length > 0) {
        loadDashboardAds();
    }

    // Auto-refresh every 30 seconds
    setInterval(function() {
        loadRecentActivities();
        loadDashboardStats();
    }, 30000);
});

// ==================== Ad Loading Functions ====================
function loadDashboardAds() {
    // Load banner ad (top position)
    loadAd('Top', '#adBannerContainer', 'banner');
    
    // Load sidebar ad (sidebar position)
    loadAd('Sidebar', '#sidebarAdContainer', 'sidebar');
    
    // Load middle ad (middle position)
    loadAd('Middle', '#middleAdContainer', 'middle');
}

function loadAd(position, containerId, adType) {
    $.ajax({
        url: getUrl('GetActiveAds'),
        type: 'GET',
        data: { position: position },
        success: function(response) {
            if (response.success && response.data && response.data.length > 0) {
                const ad = response.data[0]; // Get first ad
                displayAd(ad, containerId, adType);
                trackAdView(ad.id);
            }
        },
        error: function() {
            console.error('Failed to load ads for position: ' + position);
        }
    });
}

function displayAd(ad, containerId, adType) {
    let html = '';
    
    if (adType === 'banner') {
        // Banner ad (full width, horizontal)
        html = `
            <div class="card shadow-sm border-0 ad-banner" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); cursor: pointer;" onclick="handleAdClick(${ad.id}, '${escapeHtml(ad.linkUrl || '#')}')">
                <div class="card-body p-4">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="text-white">
                                <span class="badge bg-white text-primary mb-2">SPONSORED</span>
                                <h4 class="fw-bold text-white mb-2">${escapeHtml(ad.title)}</h4>
                                <p class="mb-3 opacity-90">${escapeHtml(ad.description)}</p>
                                <button class="btn btn-light btn-sm">
                                    <i class="ti ti-arrow-right me-1"></i> Learn More
                                </button>
                            </div>
                        </div>
                        <div class="col-md-4 text-center">
                            <img src="${escapeHtml(ad.imageUrl)}" alt="${escapeHtml(ad.title)}" 
                                 class="img-fluid rounded" style="max-height: 150px; object-fit: cover;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (adType === 'sidebar') {
        // Sidebar ad (vertical, card style)
        html = `
            <div class="ad-sidebar" onclick="handleAdClick(${ad.id}, '${escapeHtml(ad.linkUrl || '#')}')">
                <div class="text-center mb-3" style="cursor: pointer;">
                    <img src="${escapeHtml(ad.imageUrl)}" alt="${escapeHtml(ad.title)}" 
                         class="img-fluid rounded shadow-sm" style="max-height: 200px; object-fit: cover; width: 100%;">
                </div>
                <h6 class="fw-semibold mb-2">${escapeHtml(ad.title)}</h6>
                <p class="text-muted small mb-3">${escapeHtml(ad.description)}</p>
                <a href="javascript:void(0)" class="btn btn-primary btn-sm w-100">
                    <i class="ti ti-external-link me-1"></i> View Details
                </a>
            </div>
        `;
    } else if (adType === 'middle') {
        // Middle ad (card style, horizontal)
        html = `
            <div class="card shadow-sm border-0 ad-middle" onclick="handleAdClick(${ad.id}, '${escapeHtml(ad.linkUrl || '#')}')">
                <div class="card-body p-4" style="cursor: pointer;">
                    <div class="row align-items-center">
                        <div class="col-md-3 text-center">
                            <img src="${escapeHtml(ad.imageUrl)}" alt="${escapeHtml(ad.title)}" 
                                 class="img-fluid rounded shadow-sm" style="max-height: 120px; object-fit: cover;">
                        </div>
                        <div class="col-md-9">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="fw-semibold mb-0">${escapeHtml(ad.title)}</h5>
                                <span class="badge bg-info-subtle text-info">Ad</span>
                            </div>
                            <p class="text-muted mb-3">${escapeHtml(ad.description)}</p>
                            <a href="javascript:void(0)" class="btn btn-outline-primary btn-sm">
                                <i class="ti ti-click me-1"></i> Click Here
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    $(containerId).html(html).hide().fadeIn(500);
}

function handleAdClick(adId, linkUrl) {
    // Track the click
    $.ajax({
        url: getUrl('TrackAdClick'),
        type: 'POST',
        data: { 
            adId: adId,
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        },
        success: function() {
            // Open link if available
            if (linkUrl && linkUrl !== '#' && linkUrl !== 'null') {
                window.open(linkUrl, '_blank');
            }
        }
    });
}

function trackAdView(adId) {
    $.ajax({
        url: getUrl('TrackAdView'),
        type: 'POST',
        data: { 
            adId: adId,
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        }
    });
}

// ==================== Dashboard Statistics ====================
function loadDashboardStats() {
    $.ajax({
        url: getUrl('GetDashboardStats'),
        type: 'GET',
        success: function(response) {
            if (response.success) {
                const data = response.data;
      
                // Update statistics cards
                $('#totalUsers').text(data.totalUsers);
                $('#activeUsers').text(data.activeUsersToday);
                $('#todayActivity').text(data.todayActivity);
                $('#newUsersCount').text(data.newUsersThisMonth);
                $('#pagesVisitedToday').text(data.todayActivity);
      
                // Update bottom stats
                $('#newUsersTotal').text(data.newUsersThisMonth);
                $('#activeUsersTotal').text(data.activeUsersToday);
                $('#totalActions').text(data.todayActivity);
                $('#totalUsersBottom').text(data.totalUsers);
                $('#pageViews').text(data.todayActivity);
                $('#totalActionsBottom').text(data.todayActivity);
            }
        },
        error: function() {
            console.error('Failed to load dashboard stats');
        }
    });
}

// ==================== Recent Activities ====================
function loadRecentActivities() {
    $.ajax({
        url: getUrl('GetRecentActivities'),
        type: 'GET',
        data: { count: 15 },
        success: function(response) {
            if (response.success && response.data.length > 0) {
                $('#activitiesLoading').hide();
                $('#activitiesEmpty').hide();
                
                let html = '';
                response.data.forEach(function(activity) {
                    const badgeColor = getActionColor(activity.action);
                    
                    html += `
   <div class="timeline-item d-flex position-relative overflow-hidden mb-3 p-2 rounded hover-bg-light" 
           style="cursor: pointer;" 
             onclick="viewActivityDetails(${activity.id})">
            <div class="timeline-time text-muted flex-shrink-0 text-end me-3" style="min-width: 60px;">
            <small>${activity.timeAgo}</small>
      </div>
           <div class="timeline-badge-wrap d-flex flex-column align-items-center me-3">
      <span class="timeline-badge border-2 border border-${badgeColor} flex-shrink-0 rounded-circle" 
      style="width: 8px; height: 8px;"></span>
      </div>
   <div class="timeline-desc flex-grow-1">
 <p class="mb-1 fw-semibold text-dark fs-3">${escapeHtml(activity.action)}</p>
         <small class="text-muted d-block">${escapeHtml(activity.userName)}</small>
       ${activity.entityName !== '-' ? 
      `<small class="text-${badgeColor}">${escapeHtml(activity.entityName)}</small>` : ''}
   </div>
        </div>
           `;
                });
                
                $('#activitiesList').html(html);
            } else {
                $('#activitiesLoading').hide();
                $('#activitiesEmpty').show();
                $('#activitiesList').empty();
            }
        },
        error: function() {
            $('#activitiesLoading').hide();
            $('#activitiesEmpty').html(`
         <div class="text-center py-4">
   <i class="ti ti-alert-circle fs-1 text-danger"></i>
  <p class="text-danger mt-2">Failed to load activities</p>
           </div>
            `).show();
        }
    });
}

// ==================== Activity Chart ====================
function loadActivityChart(days) {
    $.ajax({
        url: getUrl('GetActivityChart'),
        type: 'GET',
        data: { days: days },
        success: function(response) {
            if (response.success) {
                const ctx = document.getElementById('userActivityChart');
                if (!ctx) {
                    console.error('Canvas element not found');
                    return;
                }
        
                const chartCtx = ctx.getContext('2d');
    
                // Destroy existing chart if it exists
                if (activityChart) {
                    activityChart.destroy();
                }
           
                // Create new chart
                activityChart = new Chart(chartCtx, {
                    type: 'line',
                    data: {
                        labels: response.labels,
                        datasets: [{
                            label: 'Activities',
                            data: response.data,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            tension: 0.4,
                            fill: true,
                            borderWidth: 3,
                            pointBackgroundColor: 'rgb(75, 192, 192)',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: 'rgb(75, 192, 192)',
                                borderWidth: 1,
                                cornerRadius: 8,
                                padding: 12,
                                displayColors: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1,
                                    callback: function(value) {
                                        return Math.floor(value);
                                    }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                });
            }
        },
        error: function() {
            console.error('Failed to load activity chart');
        }
    });
}

// ==================== Helper Functions ====================

/**
 * Get action color based on action type
 */
function getActionColor(action) {
    action = action.toLowerCase();
    
    if (action.includes('login') || action.includes('success')) return 'success';
    if (action.includes('failed') || action.includes('error') || action.includes('delete')) return 'danger';
    if (action.includes('create') || action.includes('add')) return 'primary';
    if (action.includes('update') || action.includes('edit')) return 'warning';
    if (action.includes('view') || action.includes('viewed')) return 'info';
    
    return 'secondary';
}

/**
 * View activity details (redirect to audit logs page)
 */
function viewActivityDetails(activityId) {
    // Get base URL and construct audit logs URL
    const baseUrl = window.location.origin;
    window.location.href = baseUrl + '/AuditLogs';
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    if (!text) return '';

    const map = {
      '&': '&amp;',
        '<': '&lt;',
     '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { 
        return map[m]; 
    });
}

/**
 * Get URL for AJAX calls
 */
function getUrl(action) {
    const baseUrl = window.location.origin;
    return baseUrl + '/Dashboard/' + action;
}

// ==================== Number Animation ====================
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16); // 60 FPS
    let current = start;
    
    const timer = setInterval(function() {
        current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
        }
        $(element).text(Math.floor(current));
    }, 16);
}

// ==================== Smooth Scrolling ====================
$('a[href^="#"]').on('click', function(e) {
    const target = $(this.getAttribute('href'));
    if (target.length) {
        e.preventDefault();
    $('html, body').stop().animate({
 scrollTop: target.offset().top - 80
        }, 1000);
    }
});

// ==================== Tooltip Initialization ====================
$(function () {
    $('[data-bs-toggle="tooltip"]').tooltip();
});

// ==================== Chart.js Configuration ====================
// Ensure Chart.js is loaded before initializing charts
if (typeof Chart !== 'undefined') {
    // Set global Chart.js defaults
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#6c757d';
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
} else {
    console.warn('Chart.js is not loaded. Please ensure Chart.js is included in your page.');
}

// ==================== Export Functions for Global Access ====================
window.dashboardFunctions = {
    loadDashboardStats: loadDashboardStats,
    loadRecentActivities: loadRecentActivities,
    loadActivityChart: loadActivityChart,
 viewActivityDetails: viewActivityDetails,
    getActionColor: getActionColor,
    escapeHtml: escapeHtml
};

// ==================== Console Log for Debugging ====================
console.log('Dashboard Admin Content Scripts Loaded Successfully');
console.log('Available functions:', Object.keys(window.dashboardFunctions));

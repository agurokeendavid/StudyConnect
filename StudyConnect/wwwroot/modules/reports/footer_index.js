// Reports Page - Main Script File
// DevExtreme charts for comprehensive reporting

let chartInstances = {};

$(document).ready(function() {
    // Initialize all reports
    initializeReports();
    
    console.log('Reports page loaded successfully');
});

// ==================== Initialize All Reports ====================
function initializeReports() {
    showPageLoader();
    
    // Load all data in parallel
    Promise.all([
        loadOverviewStats(),
        loadUserGrowthChart(),
        loadUserRoleChart(),
        loadStudyGroupStats(),
        loadActivityStats(),
        loadSubscriptionStats(),
        loadResourceStats(),
        loadMeetingStats()
    ]).then(() => {
        hidePageLoader();
        console.log('All reports loaded successfully');
    }).catch(error => {
        hidePageLoader();
        console.error('Error loading reports:', error);
        showErrorNotification('Failed to load some reports');
    });
}

// ==================== Overview Statistics ====================
function loadOverviewStats() {
    return $.ajax({
        url: getUrl('GetOverviewStats'),
        type: 'GET',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                // Update stat cards with animation
                animateNumber($('#totalUsers'), 0, data.totalUsers, 1000);
                animateNumber($('#totalStudyGroups'), 0, data.totalStudyGroups, 1000);
                animateNumber($('#activeUsers'), 0, data.activeUsers, 1000);
                animateNumber($('#totalResources'), 0, data.totalResources, 1000);
                animateNumber($('#newUsersToday'), 0, data.newUsersToday, 1000);
                animateNumber($('#newGroupsToday'), 0, data.newGroupsToday, 1000);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading overview stats:', error);
        }
    });
}

// ==================== User Growth Chart ====================
function loadUserGrowthChart() {
    return $.ajax({
        url: getUrl('GetUserGrowthData'),
        type: 'GET',
        success: function(response) {
            if (response.success && response.data.length > 0) {
                const chartData = response.data.map(item => ({
                    date: new Date(item.date),
                    count: item.count
                }));

                chartInstances.userGrowth = $('#userGrowthChart').dxChart({
                    dataSource: chartData,
                    commonSeriesSettings: {
                        argumentField: 'date',
                        type: 'spline'
                    },
                    series: [{
                        valueField: 'count',
                        name: 'New Users',
                        color: '#5D87FF'
                    }],
                    argumentAxis: {
                        argumentType: 'datetime',
                        label: {
                            format: 'MMM dd'
                        }
                    },
                    valueAxis: {
                        title: {
                            text: 'Number of Users'
                        }
                    },
                    legend: {
                        visible: false
                    },
                    tooltip: {
                        enabled: true,
                        customizeTooltip: function(arg) {
                            return {
                                text: `Date: ${arg.argumentText}<br/>Users: ${arg.valueText}`
                            };
                        }
                    },
                    animation: {
                        enabled: true,
                        duration: 1000
                    }
                }).dxChart('instance');
            } else {
                showEmptyChart('#userGrowthChart', 'No user growth data available');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading user growth data:', error);
            showEmptyChart('#userGrowthChart', 'Failed to load data');
        }
    });
}

// ==================== User Role Distribution Chart ====================
function loadUserRoleChart() {
    return $.ajax({
        url: getUrl('GetUserRoleDistribution'),
        type: 'GET',
        success: function(response) {
            if (response.success && response.data.length > 0) {
                chartInstances.userRole = $('#userRoleChart').dxPieChart({
                    dataSource: response.data,
                    series: [{
                        argumentField: 'role',
                        valueField: 'count',
                        label: {
                            visible: true,
                            format: {
                                type: 'fixedPoint',
                                precision: 0
                            },
                            connector: {
                                visible: true
                            }
                        }
                    }],
                    legend: {
                        horizontalAlignment: 'center',
                        verticalAlignment: 'bottom'
                    },
                    tooltip: {
                        enabled: true,
                        customizeTooltip: function(arg) {
                            return {
                                text: `${arg.argumentText}: ${arg.valueText} users`
                            };
                        }
                    },
                    palette: ['#5D87FF', '#49BEFF', '#13DEB9', '#FFAE1F', '#FA896B'],
                    animation: {
                        enabled: true,
                        duration: 1000
                    }
                }).dxPieChart('instance');
            } else {
                showEmptyChart('#userRoleChart', 'No user role data available');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading user role data:', error);
            showEmptyChart('#userRoleChart', 'Failed to load data');
        }
    });
}

// ==================== Study Group Statistics ====================
function loadStudyGroupStats() {
    return $.ajax({
        url: getUrl('GetStudyGroupStats'),
        type: 'GET',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                // Study Group Status Chart (Pie)
                const statusData = [
                    { status: 'Approved', count: data.approvedGroups },
                    { status: 'Pending', count: data.pendingGroups },
                    { status: 'Rejected', count: data.rejectedGroups }
                ];

                chartInstances.studyGroupStatus = $('#studyGroupStatusChart').dxPieChart({
                    dataSource: statusData,
                    series: [{
                        argumentField: 'status',
                        valueField: 'count',
                        label: {
                            visible: true,
                            format: {
                                type: 'fixedPoint',
                                precision: 0
                            },
                            connector: {
                                visible: true
                            }
                        }
                    }],
                    legend: {
                        horizontalAlignment: 'center',
                        verticalAlignment: 'bottom'
                    },
                    tooltip: {
                        enabled: true,
                        customizeTooltip: function(arg) {
                            return {
                                text: `${arg.argumentText}: ${arg.valueText} groups`
                            };
                        }
                    },
                    palette: ['#13DEB9', '#FFAE1F', '#FA896B'],
                    animation: {
                        enabled: true,
                        duration: 1000
                    }
                }).dxPieChart('instance');

                // Study Group by Category Chart (Bar)
                if (data.categoryStats && data.categoryStats.length > 0) {
                    chartInstances.studyGroupCategory = $('#studyGroupCategoryChart').dxChart({
                        dataSource: data.categoryStats,
                        series: [{
                            argumentField: 'category',
                            valueField: 'count',
                            type: 'bar',
                            color: '#5D87FF',
                            label: {
                                visible: true,
                                format: {
                                    type: 'fixedPoint',
                                    precision: 0
                                }
                            }
                        }],
                        argumentAxis: {
                            label: {
                                overlappingBehavior: 'rotate',
                                rotationAngle: -45
                            }
                        },
                        valueAxis: {
                            title: {
                                text: 'Number of Groups'
                            }
                        },
                        legend: {
                            visible: false
                        },
                        tooltip: {
                            enabled: true,
                            customizeTooltip: function(arg) {
                                return {
                                    text: `${arg.argumentText}: ${arg.valueText} groups`
                                };
                            }
                        },
                        animation: {
                            enabled: true,
                            duration: 1000
                        }
                    }).dxChart('instance');
                } else {
                    showEmptyChart('#studyGroupCategoryChart', 'No category data available');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading study group stats:', error);
        }
    });
}

// ==================== Activity Statistics ====================
function loadActivityStats() {
    return $.ajax({
        url: getUrl('GetActivityStats'),
        type: 'GET',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                // Activity by Day Chart (Area)
                if (data.activityByDay && data.activityByDay.length > 0) {
                    const activityData = data.activityByDay.map(item => ({
                        date: new Date(item.date),
                        count: item.count
                    }));

                    chartInstances.activity = $('#activityChart').dxChart({
                        dataSource: activityData,
                        series: [{
                            argumentField: 'date',
                            valueField: 'count',
                            type: 'area',
                            color: '#49BEFF',
                            name: 'Activities'
                        }],
                        argumentAxis: {
                            argumentType: 'datetime',
                            label: {
                                format: 'MMM dd'
                            }
                        },
                        valueAxis: {
                            title: {
                                text: 'Number of Activities'
                            }
                        },
                        legend: {
                            visible: false
                        },
                        tooltip: {
                            enabled: true,
                            customizeTooltip: function(arg) {
                                return {
                                    text: `Date: ${arg.argumentText}<br/>Activities: ${arg.valueText}`
                                };
                            }
                        },
                        animation: {
                            enabled: true,
                            duration: 1000
                        }
                    }).dxChart('instance');
                } else {
                    showEmptyChart('#activityChart', 'No activity data available');
                }

                // Top Actions Chart (Horizontal Bar)
                if (data.activityByAction && data.activityByAction.length > 0) {
                    chartInstances.topActions = $('#topActionsChart').dxChart({
                        dataSource: data.activityByAction,
                        rotated: true,
                        series: [{
                            argumentField: 'action',
                            valueField: 'count',
                            type: 'bar',
                            color: '#FFAE1F',
                            label: {
                                visible: true,
                                format: {
                                    type: 'fixedPoint',
                                    precision: 0
                                }
                            }
                        }],
                        argumentAxis: {
                            label: {
                                overlappingBehavior: 'none'
                            }
                        },
                        valueAxis: {
                            title: {
                                text: 'Number of Occurrences'
                            }
                        },
                        legend: {
                            visible: false
                        },
                        tooltip: {
                            enabled: true,
                            customizeTooltip: function(arg) {
                                return {
                                    text: `${arg.argumentText}: ${arg.valueText} times`
                                };
                            }
                        },
                        animation: {
                            enabled: true,
                            duration: 1000
                        }
                    }).dxChart('instance');
                } else {
                    showEmptyChart('#topActionsChart', 'No action data available');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading activity stats:', error);
        }
    });
}

// ==================== Subscription Statistics ====================
function loadSubscriptionStats() {
    return $.ajax({
        url: getUrl('GetSubscriptionStats'),
        type: 'GET',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                // Subscriptions by Plan Chart
                if (data.subscriptionsByPlan && data.subscriptionsByPlan.length > 0) {
                    chartInstances.subscription = $('#subscriptionChart').dxPieChart({
                        dataSource: data.subscriptionsByPlan,
                        series: [{
                            argumentField: 'plan',
                            valueField: 'count',
                            label: {
                                visible: true,
                                format: {
                                    type: 'fixedPoint',
                                    precision: 0
                                },
                                connector: {
                                    visible: true
                                }
                            }
                        }],
                        legend: {
                            horizontalAlignment: 'center',
                            verticalAlignment: 'bottom'
                        },
                        tooltip: {
                            enabled: true,
                            customizeTooltip: function(arg) {
                                return {
                                    text: `${arg.argumentText}: ${arg.valueText} subscriptions`
                                };
                            }
                        },
                        palette: ['#5D87FF', '#49BEFF', '#13DEB9', '#FFAE1F'],
                        animation: {
                            enabled: true,
                            duration: 1000
                        }
                    }).dxPieChart('instance');
                } else {
                    showEmptyChart('#subscriptionChart', 'No subscription data available');
                }

                // Revenue by Plan Chart
                if (data.revenueByPlan && data.revenueByPlan.length > 0) {
                    chartInstances.revenue = $('#revenueChart').dxChart({
                        dataSource: data.revenueByPlan,
                        series: [{
                            argumentField: 'plan',
                            valueField: 'revenue',
                            type: 'bar',
                            color: '#13DEB9',
                            label: {
                                visible: true,
                                format: 'currency'
                            }
                        }],
                        argumentAxis: {
                            label: {
                                overlappingBehavior: 'rotate',
                                rotationAngle: -45
                            }
                        },
                        valueAxis: {
                            title: {
                                text: 'Revenue'
                            },
                            label: {
                                format: 'currency'
                            }
                        },
                        legend: {
                            visible: false
                        },
                        tooltip: {
                            enabled: true,
                            customizeTooltip: function(arg) {
                                return {
                                    text: `${arg.argumentText}: $${arg.value.toFixed(2)}`
                                };
                            }
                        },
                        animation: {
                            enabled: true,
                            duration: 1000
                        }
                    }).dxChart('instance');
                } else {
                    showEmptyChart('#revenueChart', 'No revenue data available');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading subscription stats:', error);
        }
    });
}

// ==================== Resource Statistics ====================
function loadResourceStats() {
    return $.ajax({
        url: getUrl('GetResourceStats'),
        type: 'GET',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                // Resources by Type Chart
                if (data.resourcesByType && data.resourcesByType.length > 0) {
                    chartInstances.resourceType = $('#resourceTypeChart').dxPieChart({
                        dataSource: data.resourcesByType,
                        series: [{
                            argumentField: 'type',
                            valueField: 'count',
                            label: {
                                visible: true,
                                format: {
                                    type: 'fixedPoint',
                                    precision: 0
                                },
                                connector: {
                                    visible: true
                                }
                            }
                        }],
                        legend: {
                            horizontalAlignment: 'center',
                            verticalAlignment: 'bottom'
                        },
                        tooltip: {
                            enabled: true,
                            customizeTooltip: function(arg) {
                                return {
                                    text: `${arg.argumentText}: ${arg.valueText} files`
                                };
                            }
                        },
                        palette: ['#5D87FF', '#49BEFF', '#13DEB9', '#FFAE1F', '#FA896B'],
                        animation: {
                            enabled: true,
                            duration: 1000
                        }
                    }).dxPieChart('instance');
                } else {
                    showEmptyChart('#resourceTypeChart', 'No resource type data available');
                }

                // Top Downloaded Resources Chart
                if (data.topDownloadedResources && data.topDownloadedResources.length > 0) {
                    chartInstances.topResources = $('#topResourcesChart').dxChart({
                        dataSource: data.topDownloadedResources,
                        rotated: true,
                        series: [{
                            argumentField: 'title',
                            valueField: 'downloads',
                            type: 'bar',
                            color: '#FA896B',
                            label: {
                                visible: true,
                                format: {
                                    type: 'fixedPoint',
                                    precision: 0
                                }
                            }
                        }],
                        argumentAxis: {
                            label: {
                                overlappingBehavior: 'none',
                                wordWrap: 'breakWord',
                                maxWidth: 200
                            }
                        },
                        valueAxis: {
                            title: {
                                text: 'Download Count'
                            }
                        },
                        legend: {
                            visible: false
                        },
                        tooltip: {
                            enabled: true,
                            customizeTooltip: function(arg) {
                                return {
                                    text: `${arg.argumentText}<br/>Downloads: ${arg.valueText}`
                                };
                            }
                        },
                        animation: {
                            enabled: true,
                            duration: 1000
                        }
                    }).dxChart('instance');
                } else {
                    showEmptyChart('#topResourcesChart', 'No download data available');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading resource stats:', error);
        }
    });
}

// ==================== Meeting Statistics ====================
function loadMeetingStats() {
    return $.ajax({
        url: getUrl('GetMeetingStats'),
        type: 'GET',
        success: function(response) {
            if (response.success) {
                const data = response.data;
                
                // Meeting Stats Chart (Doughnut)
                const meetingData = [
                    { status: 'Upcoming', count: data.upcomingMeetings },
                    { status: 'Completed', count: data.completedMeetings },
                    { status: 'Cancelled', count: data.cancelledMeetings }
                ];

                chartInstances.meetingStats = $('#meetingStatsChart').dxPieChart({
                    dataSource: meetingData,
                    type: 'doughnut',
                    series: [{
                        argumentField: 'status',
                        valueField: 'count',
                        label: {
                            visible: true,
                            format: {
                                type: 'fixedPoint',
                                precision: 0
                            },
                            connector: {
                                visible: true
                            }
                        }
                    }],
                    legend: {
                        horizontalAlignment: 'center',
                        verticalAlignment: 'bottom'
                    },
                    tooltip: {
                        enabled: true,
                        customizeTooltip: function(arg) {
                            return {
                                text: `${arg.argumentText}: ${arg.valueText} meetings`
                            };
                        }
                    },
                    palette: ['#5D87FF', '#13DEB9', '#FA896B'],
                    animation: {
                        enabled: true,
                        duration: 1000
                    }
                }).dxPieChart('instance');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading meeting stats:', error);
        }
    });
}

// ==================== Helper Functions ====================

/**
 * Refresh all charts
 */
function refreshAllCharts() {
    initializeReports();
}

/**
 * Show page loader
 */
function showPageLoader() {
    if (!$('#pageLoader').length) {
        $('body').append(`
            <div id="pageLoader" class="spinner-overlay">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `);
    }
    $('#pageLoader').fadeIn();
}

/**
 * Hide page loader
 */
function hidePageLoader() {
    $('#pageLoader').fadeOut(function() {
        $(this).remove();
    });
}

/**
 * Show empty chart message
 */
function showEmptyChart(selector, message) {
    $(selector).html(`
        <div class="empty-chart-state">
            <i class="ti ti-chart-line"></i>
            <p>${message}</p>
        </div>
    `);
}

/**
 * Show error notification
 */
function showErrorNotification(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    } else {
        console.error(message);
    }
}

/**
 * Animate number counting
 */
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(function() {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.text(Math.floor(current));
    }, 16);
}

/**
 * Get URL for AJAX calls
 */
function getUrl(action) {
    const baseUrl = window.location.origin;
    return baseUrl + '/Reports/' + action;
}

/**
 * Escape HTML to prevent XSS
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
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// ==================== Export Functions ====================
window.reportsFunctions = {
    refreshAllCharts: refreshAllCharts,
    loadOverviewStats: loadOverviewStats,
    loadUserGrowthChart: loadUserGrowthChart,
    loadUserRoleChart: loadUserRoleChart,
    loadStudyGroupStats: loadStudyGroupStats,
    loadActivityStats: loadActivityStats,
    loadSubscriptionStats: loadSubscriptionStats,
    loadResourceStats: loadResourceStats,
    loadMeetingStats: loadMeetingStats
};

console.log('Reports Scripts Loaded Successfully');
console.log('Available functions:', Object.keys(window.reportsFunctions));

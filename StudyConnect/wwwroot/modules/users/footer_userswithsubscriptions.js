$(function () {
    // Initialize DevExtreme DataGrid
    $("#usersSubscriptionsDataGrid").dxDataGrid({
        dataSource: {
            load: function () {
                return $.ajax({
                    url: "/Users/GetUsersWithSubscriptions",
                    type: "GET",
                    dataType: "json"
                }).then(function (response) {
                    return response.data;
                });
            }
        },
        remoteOperations: false,
        showBorders: true,
        showRowLines: true,
        showColumnLines: true,
        rowAlternationEnabled: true,
        columnAutoWidth: true,
        hoverStateEnabled: true,
        allowColumnReordering: true,
        allowColumnResizing: true,
        columnResizingMode: "widget",
        width: '100%',
        paging: {
            pageSize: 10
        },
        pager: {
            visible: true,
            showPageSizeSelector: true,
            allowedPageSizes: [10, 25, 50, 100],
            showInfo: true,
            showNavigationButtons: true
        },
        filterRow: {
            visible: true
        },
        searchPanel: {
            visible: true,
            width: '100%',
            placeholder: "Search users..."
        },
        headerFilter: {
            visible: true
        },
        export: {
            enabled: true,
            fileName: "UsersWithSubscriptions"
        },
        selection: {
            mode: "single"
        },
        columns: [
            {
                dataField: "fullName",
                caption: "Full Name",
                width: 200,
                cellTemplate: function (container, options) {
                    var nameHtml = '<div class="d-flex align-items-center">' +
                        '<div class="ms-2">' +
                        '<h6 class="mb-0 fw-semibold">' + options.data.fullName + '</h6>' +
                        '<small class="text-muted">' + options.data.email + '</small>' +
                        '</div>' +
                        '</div>';
                    container.append(nameHtml);
                }
            },
            {
                dataField: "contactNo",
                caption: "Contact No.",
                width: 150
            },
            {
                dataField: "totalSubscriptions",
                caption: "Total Subscriptions",
                width: 120,
                alignment: "center",
                cellTemplate: function (container, options) {
                    var badge = '<span class="badge bg-primary">' + options.value + '</span>';
                    container.append(badge);
                }
            },
            {
                dataField: "activeSubscription",
                caption: "Active Subscription",
                width: 200,
                allowFiltering: false,
                calculateCellValue: function (data) {
                    if (data.activeSubscription) {
                        return data.activeSubscription.subscriptionName;
                    }
                    return "None";
                },
                cellTemplate: function (container, options) {
                    if (options.data.activeSubscription) {
                        var sub = options.data.activeSubscription;
                        var status = sub.endDate && new Date(sub.endDate) < new Date() ? 'Expired' : 'Active';
                        var badgeClass = status === 'Active' ? 'bg-success' : 'bg-danger';
                        
                        var html = '<div>' +
                            '<div class="fw-semibold">' + sub.subscriptionName + '</div>' +
                            '<small class="text-muted">$' + sub.subscriptionPrice + ' - ' + sub.durationInDays + ' days</small>' +
                            '</div>';
                        container.append(html);
                    } else {
                        container.append('<span class="text-muted">No active subscription</span>');
                    }
                }
            },
            {
                dataField: "activeSubscription.startDate",
                caption: "Start Date",
                width: 120,
                dataType: "date",
                format: "MM/dd/yyyy",
                calculateCellValue: function (data) {
                    return data.activeSubscription ? new Date(data.activeSubscription.startDate) : null;
                }
            },
            {
                dataField: "activeSubscription.endDate",
                caption: "End Date",
                width: 120,
                dataType: "date",
                format: "MM/dd/yyyy",
                calculateCellValue: function (data) {
                    return data.activeSubscription ? new Date(data.activeSubscription.endDate) : null;
                }
            },
            {
                caption: "Status",
                width: 100,
                alignment: "center",
                allowFiltering: false,
                cellTemplate: function (container, options) {
                    if (options.data.activeSubscription) {
                        var sub = options.data.activeSubscription;
                        var endDate = new Date(sub.endDate);
                        var now = new Date();
                        var daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                        
                        var statusText, statusClass;
                        if (endDate < now) {
                            statusText = "Expired";
                            statusClass = "bg-danger-subtle text-danger";
                        } else if (daysRemaining <= 7) {
                            statusText = "Expiring Soon";
                            statusClass = "bg-warning-subtle text-warning";
                        } else {
                            statusText = "Active";
                            statusClass = "bg-success-subtle text-success";
                        }
                        
                        var badge = '<span class="badge ' + statusClass + '">' + statusText + '</span>';
                        container.append(badge);
                    } else {
                        container.append('<span class="badge bg-secondary-subtle text-secondary">Inactive</span>');
                    }
                }
            },
            {
                caption: "Usage",
                width: 150,
                allowFiltering: false,
                cellTemplate: function (container, options) {
                    if (options.data.activeSubscription) {
                        var sub = options.data.activeSubscription;
                        if (sub.hasUnlimitedAccess) {
                            container.append('<span class="badge bg-info-subtle text-info"><i class="ti ti-infinity me-1"></i>Unlimited</span>');
                        } else {
                            var percentage = sub.maxFileUploads > 0 ? (sub.filesUploaded / sub.maxFileUploads * 100).toFixed(0) : 0;
                            var progressClass = percentage >= 90 ? 'bg-danger' : percentage >= 70 ? 'bg-warning' : 'bg-success';
                            
                            var html = '<div>' +
                                '<small class="text-muted d-block mb-1">' + sub.filesUploaded + ' / ' + sub.maxFileUploads + ' files</small>' +
                                '<div class="progress" style="height: 6px;">' +
                                '<div class="progress-bar ' + progressClass + '" style="width: ' + percentage + '%"></div>' +
                                '</div>' +
                                '</div>';
                            container.append(html);
                        }
                    } else {
                        container.append('-');
                    }
                }
            },
            {
                type: "buttons",
                caption: "Actions",
                width: 100,
                buttons: [
                    {
                        hint: "View History",
                        icon: "ti ti-history",
                        onClick: function (e) {
                            viewSubscriptionHistory(e.row.data);
                        }
                    }
                ]
            }
        ],
        onToolbarPreparing: function (e) {
            e.toolbarOptions.items.unshift({
                location: "after",
                widget: "dxButton",
                options: {
                    icon: "refresh",
                    hint: "Refresh",
                    onClick: function () {
                        $("#usersSubscriptionsDataGrid").dxDataGrid("instance").refresh();
                    }
                }
            });
        },
        onContentReady: function (e) {
            // Add custom styling to action buttons
            e.element.find(".dx-command-edit .dx-link").each(function () {
                $(this).addClass("me-1");
            });
        }
    });

    // View subscription history
    function viewSubscriptionHistory(user) {
        if (!user.subscriptionHistory || user.subscriptionHistory.length === 0) {
            Swal.fire({
                title: 'No Subscription History',
                text: 'This user has no subscription history.',
                icon: 'info',
                confirmButtonColor: '#5D87FF'
            });
            return;
        }

        var historyHtml = '<div class="table-responsive">' +
            '<table class="table table-bordered">' +
            '<thead>' +
            '<tr>' +
            '<th>Subscription</th>' +
            '<th>Price</th>' +
            '<th>Start Date</th>' +
            '<th>End Date</th>' +
            '<th>Files Used</th>' +
            '<th>Status</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>';

        user.subscriptionHistory.forEach(function (sub) {
            var statusBadge;
            if (sub.status === 'Active') {
                statusBadge = '<span class="badge bg-success">Active</span>';
            } else if (sub.status === 'Expired') {
                statusBadge = '<span class="badge bg-danger">Expired</span>';
            } else {
                statusBadge = '<span class="badge bg-secondary">Inactive</span>';
            }

            var fileUsage = sub.hasUnlimitedAccess 
                ? '<span class="badge bg-info"><i class="ti ti-infinity"></i> Unlimited</span>'
                : sub.filesUploaded + ' / ' + sub.maxFileUploads;

            historyHtml += '<tr>' +
                '<td>' + sub.subscriptionName + '</td>' +
                '<td>$' + sub.subscriptionPrice.toFixed(2) + '</td>' +
                '<td>' + sub.startDate + '</td>' +
                '<td>' + sub.endDate + '</td>' +
                '<td>' + fileUsage + '</td>' +
                '<td>' + statusBadge + '</td>' +
                '</tr>';
        });

        historyHtml += '</tbody></table></div>';

        Swal.fire({
            title: '<strong>Subscription History - ' + user.fullName + '</strong>',
            html: historyHtml,
            width: '800px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'swal-wide'
            }
        });
    }
});

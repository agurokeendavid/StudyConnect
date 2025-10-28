$(function () {
    loadAllResources();
});

function loadAllResources() {
    $("#allResourcesGrid").dxDataGrid({
        width: '100%',
        dataSource: {
            store: {
                type: 'array',
                key: 'id',
                data: []
            },
            load: function () {
                return $.ajax({
                    url: '/StudyGroups/GetAllResources',
                    type: 'GET',
                    dataType: 'json'
                }).then(function (response) {
                    return response.data || [];
                });
            }
        },
        columns: [
            {
                caption: 'File',
                cellTemplate: function (container, options) {
                    var iconClass = getFileIcon(options.data.fileName);
                    var iconColor = getIconColor(options.data.fileExtension);

                    $('<div>').addClass('d-flex align-items-center').append(
                        $('<div>').addClass('resource-icon-grid me-3').css('color', iconColor).append(
                            $('<i>').addClass(iconClass).css('font-size', '32px')
                        ),
                        $('<div>').addClass('flex-grow-1').append(
                            $('<div>').addClass('fw-semibold text-truncate').text(options.data.title).attr('title', options.data.title),
                            $('<small>').addClass('text-muted').text(options.data.fileName)
                        )
                    ).appendTo(container);
                }
            },
            {
                dataField: 'description',
                caption: 'Description',
                cellTemplate: function (container, options) {
                    var desc = options.value || 'No description';
                    $('<div>').addClass('text-muted small').text(desc).css({
                        'overflow': 'hidden',
                        'text-overflow': 'ellipsis',
                        'white-space': 'nowrap'
                    }).attr('title', desc).appendTo(container);
                }
            },
            {
                caption: 'Study Group',
                cellTemplate: function (container, options) {
                    $('<div>').append(
                        $('<div>').addClass('fw-medium text-truncate').text(options.data.studyGroupName).attr('title', options.data.studyGroupName),
                        $('<small>').addClass('text-muted').append(
                            $('<i>').addClass('ti ti-category me-1'),
                            options.data.categoryName
                        )
                    ).appendTo(container);
                }
            },
            {
                dataField: 'privacy',
                caption: 'Privacy',
                cellTemplate: function (container, options) {
                    var badgeClass = options.value === 'Public' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning';
                    $('<span>').addClass('badge ' + badgeClass).text(options.value).appendTo(container);
                }
            },
            {
                caption: 'Uploaded By',
                cellTemplate: function (container, options) {
                    var initials = getInitials(options.data.uploadedByName);
                    $('<div>').addClass('d-flex align-items-center').append(
                        $('<div>').addClass('user-avatar me-2').text(initials),
                        $('<div>').append(
                            $('<div>').addClass('fw-medium small').text(options.data.uploadedByName),
                            $('<small>').addClass('text-muted').text(options.data.uploadedByEmail)
                        )
                    ).appendTo(container);
                }
            },
            {
                dataField: 'fileSize',
                caption: 'Size',
                cellTemplate: function (container, options) {
                    $('<span>').addClass('badge bg-light-subtle text-dark')
                        .text(formatFileSize(options.value))
                        .appendTo(container);
                }
            },
            {
                dataField: 'downloadCount',
                caption: 'Downloads',
                alignment: 'center',
                cellTemplate: function (container, options) {
                    $('<div>').addClass('d-flex align-items-center justify-content-center').append(
                        $('<i>').addClass('ti ti-download me-1 text-primary'),
                        $('<span>').addClass('fw-semibold').text(options.value)
                    ).appendTo(container);
                }
            },
            {
                dataField: 'createdAt',
                caption: 'Uploaded',
                dataType: 'string'
            },
            {
                caption: 'Actions',
                width: 180,
                alignment: 'center',
                cellTemplate: function (container, options) {
                    $('<div>').addClass('d-flex gap-2 justify-content-center').append(
                        $('<button>').addClass('btn btn-sm btn-primary')
                            .attr('title', 'Download')
                            .html('<i class="ti ti-download"></i>')
                            .on('click', function () {
                                downloadResource(options.data.id);
                            }),
                        $('<button>').addClass('btn btn-sm btn-outline-info')
                            .attr('title', 'View Study Group')
                            .html('<i class="ti ti-eye"></i>')
                            .on('click', function () {
                                window.location.href = '/StudyGroups/Details/' + options.data.studyGroupId;
                            }),
                        $('<button>').addClass('btn btn-sm btn-outline-danger')
                            .attr('title', 'Delete')
                            .html('<i class="ti ti-trash"></i>')
                            .on('click', function () {
                                deleteResource(options.data.id);
                            })
                    ).appendTo(container);
                }
            }
        ],
        showBorders: true,
        showRowLines: true,
        showColumnLines: false,
        rowAlternationEnabled: true,
        hoverStateEnabled: true,
        columnAutoWidth: false,
        wordWrapEnabled: false,
        paging: {
            pageSize: 15
        },
        pager: {
            showPageSizeSelector: true,
            allowedPageSizes: [15, 25, 50, 100],
            showInfo: true,
            showNavigationButtons: true
        },
        searchPanel: {
            visible: true,
            width: '100%',
            placeholder: 'Search resources...'
        },
        headerFilter: {
            visible: true
        },
        filterRow: {
            visible: false
        },
        groupPanel: {
            visible: true
        },
        grouping: {
            autoExpandAll: false
        },
        export: {
            enabled: true,
            fileName: 'AllStudyGroupResources'
        },
        onToolbarPreparing: function (e) {
            e.toolbarOptions.items.unshift(
                {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        icon: 'refresh',
                        hint: 'Refresh',
                        onClick: function () {
                            $("#allResourcesGrid").dxDataGrid("instance").refresh();
                        }
                    }
                },
                {
                    location: 'before',
                    template: function () {
                        return $('<div>')
                            .addClass('grid-header-info')
                            .append(
                                $('<i>').addClass('ti ti-info-circle me-2'),
                                $('<span>').text('Total Resources: '),
                                $('<span>').attr('id', 'totalResourcesCount').addClass('fw-bold')
                            );
                    }
                }
            );
        },
        onContentReady: function (e) {
            var totalCount = e.component.totalCount();
            $('#totalResourcesCount').text(totalCount);
        },
        noDataText: 'No resources have been uploaded yet.',
        loadPanel: {
            enabled: true
        }
    });
}

function downloadResource(resourceId) {
    window.location.href = `/StudyGroups/DownloadResource?resourceId=${resourceId}`;
}

function deleteResource(resourceId) {
    Swal.fire({
        title: 'Delete Resource?',
        text: 'This will permanently remove this resource. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            AmagiLoader.show();

            $.ajax({
                url: '/StudyGroups/AdminDeleteResource',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(resourceId),
                success: function (response) {
                    AmagiLoader.hide();
                    if (response.MessageType === "Success") {
                        Swal.fire('Deleted!', 'Resource has been deleted.', 'success');
                        $("#allResourcesGrid").dxDataGrid("instance").refresh();
                    } else {
                        Swal.fire('Error', response.Message || 'Failed to delete resource', 'error');
                    }
                },
                error: function () {
                    AmagiLoader.hide();
                    Swal.fire('Error', 'An error occurred while deleting', 'error');
                }
            });
        }
    });
}

function getFileIcon(fileName) {
    var ext = fileName.split('.').pop().toLowerCase();
    var iconMap = {
        'jpg': 'ti ti-photo',
        'jpeg': 'ti ti-photo',
        'png': 'ti ti-photo',
        'gif': 'ti ti-photo'
    };
    return iconMap[ext] || 'ti ti-file';
}

function getIconColor(extension) {
    var colorMap = {
        '.pdf': '#dc3545',
        '.doc': '#2b579a',
        '.docx': '#2b579a',
        '.xls': '#217346',
        '.xlsx': '#217346',
        '.ppt': '#d24726',
        '.pptx': '#d24726',
        '.jpg': '#5D87FF',
        '.jpeg': '#5D87FF',
        '.png': '#5D87FF',
        '.gif': '#5D87FF'
    };
    return colorMap[extension] || '#6c757d';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.charAt(0) + (name.charAt(1) || '');
}

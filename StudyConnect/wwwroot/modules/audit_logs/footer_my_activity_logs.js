$(document).ready(function () {
    initializeMyActivityLogsDataGrid();
});

function initializeMyActivityLogsDataGrid() {
    $("#activityLogsDataGrid").dxDataGrid({
        dataSource: {
            load: function (loadOptions) {
                const deferred = $.Deferred();

                // Prepare parameters for the API call
                const params = {
                    draw: 1,
                    start: loadOptions.skip || 0,
                    length: loadOptions.take || 20,
                    searchValue: loadOptions.searchValue || '',
                    sortColumn: loadOptions.sort && loadOptions.sort.length > 0
                        ? loadOptions.sort[0].selector
                        : 'timestamp',
                    sortDirection: loadOptions.sort && loadOptions.sort.length > 0
                        ? (loadOptions.sort[0].desc ? 'desc' : 'asc')
                        : 'desc'
                };

                // Add search filter if present
                if (loadOptions.filter) {
                    params.searchValue = loadOptions.filter[2] || '';
                }

                $.ajax({
                    url: '/AuditLogs/GetMyActivityLogs',
                    method: 'GET',
                    data: params,
                    success: function (response) {
                        deferred.resolve(response.data, {
                            totalCount: response.recordsFiltered
                        });
                    },
                    error: function (xhr, status, error) {
                        console.error('Error loading my activity logs:', error);
                        toastr.error('Failed to load my activity logs');
                        deferred.reject(error);
                    }
                });

                return deferred.promise();
            }
        },
        remoteOperations: {
            paging: true,
            sorting: true,
            filtering: true
        },
        height: 600,
        showBorders: true,
        showRowLines: true,
        showColumnLines: true,
        rowAlternationEnabled: true,
        columnAutoWidth: true,
        wordWrapEnabled: false,
        allowColumnReordering: true,
        allowColumnResizing: true,
        columnResizingMode: 'widget',
        paging: {
            pageSize: 20
        },
        pager: {
            visible: true,
            allowedPageSizes: [10, 20, 50, 100],
            showPageSizeSelector: true,
            showInfo: true,
            showNavigationButtons: true
        },
        filterRow: {
            visible: true,
            applyFilter: 'auto'
        },
        searchPanel: {
            visible: true,
            width: 240,
            placeholder: 'Search...'
        },
        headerFilter: {
            visible: true
        },
        export: {
            enabled: true,
            fileName: 'MyActivityLogs'
        },
        columnChooser: {
            enabled: true,
            mode: 'select'
        },
        loadPanel: {
            enabled: true
        },
        columns: [
            {
                dataField: 'id',
                caption: 'ID',
                width: 70,
                alignment: 'center',
                visible: false
            },
            {
                dataField: 'action',
                caption: 'Action',
                width: 250
            },
            {
                dataField: 'entityName',
                caption: 'Entity',
                width: 150
            },
            {
                dataField: 'entityId',
                caption: 'Entity ID',
                width: 120,
                alignment: 'center'
            },
            {
                dataField: 'ipAddress',
                caption: 'IP Address',
                width: 130,
                alignment: 'center'
            },
            {
                dataField: 'timestamp',
                caption: 'Date & Time',
                width: 170,
                sortOrder: 'desc',
                sortIndex: 0
            },
            {
                dataField: 'additionalInfo',
                caption: 'Additional Info',
                minWidth: 200
            },
            {
                type: 'buttons',
                width: 100,
                buttons: [
                    {
                        hint: 'View Details',
                        icon: 'info',
                        onClick: function (e) {
                            showMyActivityLogDetails(e.row.data.id);
                        }
                    }
                ]
            }
        ],
        onToolbarPreparing: function (e) {
            e.toolbarOptions.items.unshift(
                {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        icon: 'refresh',
                        hint: 'Refresh',
                        onClick: function () {
                            $("#activityLogsDataGrid").dxDataGrid('instance').refresh();
                        }
                    }
                }
            );
        }
    });
}

function showMyActivityLogDetails(logId) {
    $.ajax({
        url: '/AuditLogs/Details',
        method: 'GET',
        data: { id: logId },
        success: function (data) {
            const content = `
      <div class="audit-log-details">
          <div class="row mb-3">
               <div class="col-md-6">
    <strong>Action:</strong> ${data.action}
        </div>
            <div class="col-md-6">
      <strong>Date & Time:</strong> ${data.timestamp}
              </div>
                </div>
     <div class="row mb-3">
   <div class="col-md-6">
    <strong>Entity:</strong> ${data.entityName}
                   </div>
           <div class="col-md-6">
      <strong>Entity ID:</strong> ${data.entityId}
        </div>
      </div>
    <div class="row mb-3">
           <div class="col-md-6">
          <strong>IP Address:</strong> ${data.ipAddress}
      </div>
    <div class="col-md-6">
            <strong>User Agent:</strong><br/>
           <small>${data.userAgent}</small>
       </div>
         </div>
    ${data.oldValues !== '-' ? `
             <div class="row mb-3">
       <div class="col-12">
    <strong>Old Values:</strong><br/>
      <pre class="bg-light p-2">${data.oldValues}</pre>
   </div>
         </div>
              ` : ''}
         ${data.newValues !== '-' ? `
      <div class="row mb-3">
    <div class="col-12">
           <strong>New Values:</strong><br/>
        <pre class="bg-light p-2">${data.newValues}</pre>
  </div>
      </div>
 ` : ''}
  ${data.additionalInfo !== '-' ? `
            <div class="row mb-3">
               <div class="col-12">
       <strong>Additional Info:</strong><br/>
       <p>${data.additionalInfo}</p>
              </div>
      </div>
           ` : ''}
                </div>
        `;

            DevExpress.ui.dialog.custom({
                title: 'Activity Details',
                messageHtml: content,
                buttons: [{
                    text: 'Close',
                    type: 'normal',
                    onClick: function () {
                        return true;
                    }
                }],
                width: 700
            }).show();
        },
        error: function (xhr, status, error) {
            console.error('Error loading activity log details:', error);
            toastr.error('Failed to load activity details');
        }
    });
}

$(function () {
 let allStudyGroups = [];
    let filteredGroups = [];
    let currentFilter = 'all';

    // Initialize DevExtreme SearchBox
    $("#searchBox").dxTextBox({
        placeholder: "Search by group name, category, or owner...",
        mode: "search",
        valueChangeEvent: "keyup",
    onValueChanged: function (e) {
       filterStudyGroups(e.value);
        },
        buttons: [{
 name: "search",
            location: "after",
       options: {
     icon: "search",
                type: "default",
           stylingMode: "text"
            }
        }]
    });

    // Filter tab click handlers
    $('#filterTabs button').on('click', function() {
        $('#filterTabs button').removeClass('active');
   $(this).addClass('active');
        currentFilter = $(this).data('filter');
    filterStudyGroups($('#searchBox').dxTextBox('instance').option('value'));
    });

    // Load study groups on page load
    loadStudyGroups();

    function loadStudyGroups() {
        showLoading();

        $.ajax({
            url: '/StudyGroups/GetAllStudyGroupsForAdmin',
      type: 'GET',
      dataType: 'json',
            success: function (response) {
                hideLoading();

        if (response.data && response.data.length > 0) {
  allStudyGroups = response.data;
           filteredGroups = [...allStudyGroups];
        updateFilterCounts();
      renderStudyGroups(filteredGroups);
        hideEmptyState();
    } else {
        showEmptyState();
          }
            },
     error: function (error) {
          hideLoading();
  console.error('Error loading study groups:', error);

    Swal.fire({
             title: 'Error!',
           text: 'Failed to load study groups. Please try again.',
                icon: 'error',
               confirmButtonColor: '#dc3545'
         });
            }
        });
    }

    function filterStudyGroups(searchText) {
        // First filter by status
        let statusFiltered = allStudyGroups;
        if (currentFilter === 'pending') {
            statusFiltered = allStudyGroups.filter(g => !g.isApproved && !g.isRejected);
        } else if (currentFilter === 'approved') {
          statusFiltered = allStudyGroups.filter(g => g.isApproved);
        } else if (currentFilter === 'rejected') {
            // If you implement rejection functionality, filter here
  statusFiltered = allStudyGroups.filter(g => g.isRejected);
 }

        // Then filter by search text
   if (!searchText || searchText.trim() === '') {
      filteredGroups = statusFiltered;
  } else {
     const searchLower = searchText.toLowerCase();
    filteredGroups = statusFiltered.filter(group =>
        group.name.toLowerCase().includes(searchLower) ||
                (group.description && group.description.toLowerCase().includes(searchLower)) ||
        group.categoryName.toLowerCase().includes(searchLower) ||
    (group.ownerName && group.ownerName.toLowerCase().includes(searchLower))
   );
        }

        if (filteredGroups.length > 0) {
            renderStudyGroups(filteredGroups);
     hideEmptyState();
        } else {
     $('#studyGroupsContainer').empty();
        showEmptyState();
        }
    }

    function updateFilterCounts() {
        const allCount = allStudyGroups.length;
      const pendingCount = allStudyGroups.filter(g => !g.isApproved && !g.isRejected).length;
  const approvedCount = allStudyGroups.filter(g => g.isApproved).length;
        const rejectedCount = allStudyGroups.filter(g => g.isRejected).length;

  $('#allCount').text(allCount);
        $('#pendingCount').text(pendingCount);
      $('#approvedCount').text(approvedCount);
    $('#rejectedCount').text(rejectedCount);
    }

    function renderStudyGroups(groups) {
        const container = $('#studyGroupsContainer');
        container.empty();

     groups.forEach(function (group) {
 const card = createStudyGroupCard(group);
       container.append(card);
      });
    }

    function createStudyGroupCard(group) {
        // Generate icon/thumbnail based on category or group name
        const icon = getGroupIcon(group.categoryName);
        const iconColor = getGroupColor(group.categoryName);

 // Privacy badge
   const privacyBadge = group.privacy === 'Public'
            ? '<span class="badge bg-success-subtle text-success">Public</span>'
      : '<span class="badge bg-warning-subtle text-warning">Private</span>';

        // Approval status badge
        let approvalBadge = '';
        if (!group.isApproved && !group.isRejected) {
            approvalBadge = '<span class="badge bg-warning-subtle text-warning approval-status-badge">Pending Approval</span>';
        } else if (group.isRejected) {
            approvalBadge = '<span class="badge bg-danger-subtle text-danger approval-status-badge">Rejected</span>';
        } else {
      approvalBadge = '<span class="badge bg-success-subtle text-success approval-status-badge">Approved</span>';
  }

        // Member count badge
        const memberBadge = group.maximumNumbers
            ? `${group.memberCount}/${group.maximumNumbers}`
       : group.memberCount;

      // Check if group is full
        const isFullBadge = group.isFull
         ? '<span class="badge bg-danger-subtle text-danger ms-1">Full</span>'
            : '';

  // Admin action buttons
        const adminActions = createAdminActions(group);

        const card = `
       <div class="col-lg-4 col-md-6 mb-4">
            <div class="card study-group-card h-100 shadow-sm hover-shadow position-relative" data-group-id="${group.id}">
   ${approvalBadge}
     <div class="card-body d-flex flex-column">
         <!-- Icon/Thumbnail -->
  <div class="text-center mb-3">
       <div class="group-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <i class="${icon}"></i>
       </div>
     </div>

      <!-- Group Info -->
        <div class="flex-grow-1">
       <div class="d-flex justify-content-between align-items-start mb-2">
         <h5 class="card-title mb-1 text-truncate" title="${escapeHtml(group.name)}">
           ${escapeHtml(group.name)}
    </h5>
    </div>

        <p class="text-muted small mb-2">
     <i class="ti ti-folder me-1"></i>${escapeHtml(group.categoryName)}
   </p>

               <p class="card-text text-muted mb-3 group-description">
          ${group.description ? escapeHtml(group.description) : 'No description available'}
          </p>

  <p class="text-muted small mb-2">
       <i class="ti ti-user me-1"></i>Owner: ${escapeHtml(group.ownerName)}
                </p>
      </div>

          <!-- Footer Info -->
    <div class="mt-auto">
         <div class="d-flex justify-content-between align-items-center mb-3">
       <span class="text-muted small">
         <i class="ti ti-users me-1"></i>${memberBadge} Members
 </span>
       <div>
           ${privacyBadge}
        ${isFullBadge}
         </div>
            </div>

        <div class="d-flex gap-2 mb-2">
         <a href="/StudyGroups/Details?id=${group.id}" class="btn btn-outline-primary btn-sm flex-grow-1"><i class="ti ti-eye me-1"></i>View Details</a>
         </div>

     ${adminActions}

     <div class="text-muted small mt-2 text-center">
    <i class="ti ti-calendar me-1"></i>Created ${group.createdAt}
           </div>
      </div>
   </div>
      </div>
         </div>
        `;

        return card;
    }

    function createAdminActions(group) {
        let actions = '<div class="admin-actions">';

        if (!group.isApproved && !group.isRejected) {
            actions += `
      <button class="btn btn-success btn-sm approve-btn" data-group-id="${group.id}">
    <i class="ti ti-check me-1"></i>Approve
        </button>
          <button class="btn btn-danger btn-sm reject-btn" data-group-id="${group.id}">
           <i class="ti ti-x me-1"></i>Reject
     </button>
            `;
        } else if (group.isRejected) {
            actions += ``;
        } else {
            actions += `
    <button class="btn btn-warning btn-sm disapprove-btn" data-group-id="${group.id}">
     <i class="ti ti-ban me-1"></i>Disapprove
      </button>
            `;
        }

 actions += '</div>';
      return actions;
    }

    // Approve button click
    $(document).on('click', '.approve-btn', function (e) {
     e.stopPropagation();
    const groupId = $(this).data('group-id');
        approveGroup(groupId);
    });

    // Disapprove button click
    $(document).on('click', '.disapprove-btn', function (e) {
        e.stopPropagation();
        const groupId = $(this).data('group-id');
      disapproveGroup(groupId);
    });

    // Reject button click
    $(document).on('click', '.reject-btn', function (e) {
        e.stopPropagation();
      const groupId = $(this).data('group-id');
      rejectGroup(groupId);
    });
    function approveGroup(groupId) {
        Swal.fire({
         title: 'Approve Study Group?',
      text: 'This study group will be approved and visible to all users.',
            icon: 'question',
        showCancelButton: true,
     confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, approve it!',
            cancelButtonText: 'Cancel'
   }).then((result) => {
            if (result.isConfirmed) {
     AmagiLoader.show();

                $.ajax({
          url: '/StudyGroups/ApproveStudyGroup',
type: 'POST',
     contentType: 'application/json',
data: JSON.stringify(groupId),
               success: function (response) {
          AmagiLoader.hide();
           if (response.MessageType) {
  Swal.fire({
           title: 'Approved!',
             text: 'The study group has been approved.',
             icon: 'success',
         confirmButtonColor: '#5D87FF'
  }).then(() => {
        loadStudyGroups();
        });
  } else {
Swal.fire({
                    title: 'Error!',
    text: response.Message || 'Failed to approve study group.',
         icon: 'error',
            confirmButtonColor: '#dc3545'
         });
       }
     },
            error: function (error) {
   AmagiLoader.hide();
    console.error('Error approving group:', error);
            Swal.fire({
 title: 'Error!',
              text: 'An error occurred. Please try again.',
       icon: 'error',
               confirmButtonColor: '#dc3545'
    });
   }
              });
    }
        });
    }

    function disapproveGroup(groupId) {
        Swal.fire({
     title: 'Disapprove Study Group?',
      text: 'This study group will be marked as pending approval again.',
     icon: 'warning',
showCancelButton: true,
       confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, disapprove it!',
      cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
 AmagiLoader.show();

   $.ajax({
           url: '/StudyGroups/DisapproveStudyGroup',
             type: 'POST',
         contentType: 'application/json',
      data: JSON.stringify(groupId),
          success: function (response) {
                  AmagiLoader.hide();
          if (response.MessageType) {
               Swal.fire({
       title: 'Disapproved!',
 text: 'The study group has been disapproved.',
           icon: 'success',
     confirmButtonColor: '#5D87FF'
   }).then(() => {
       loadStudyGroups();
     });
             } else {
           Swal.fire({
       title: 'Error!',
                text: response.Message || 'Failed to disapprove study group.',
    icon: 'error',
       confirmButtonColor: '#dc3545'
 });
    }
    },
      error: function (error) {
      AmagiLoader.hide();
             console.error('Error disapproving group:', error);
         Swal.fire({
   title: 'Error!',
        text: 'An error occurred. Please try again.',
      icon: 'error',
       confirmButtonColor: '#dc3545'
             });
             }
      });
  }
        });
    }

    function rejectGroup(groupId) {
        Swal.fire({
         title: 'Reject Study Group?',
            text: 'This study group will be permanently rejected and hidden from users.',
         icon: 'warning',
            showCancelButton: true,
  confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
     confirmButtonText: 'Yes, reject it!',
        cancelButtonText: 'Cancel',
         input: 'textarea',
    inputPlaceholder: 'Enter rejection reason (optional)...',
        inputAttributes: {
      'aria-label': 'Enter rejection reason'
       }
        }).then((result) => {
 if (result.isConfirmed) {
    AmagiLoader.show();

      $.ajax({
             url: '/StudyGroups/RejectStudyGroup',
      type: 'POST',
            contentType: 'application/json',
   data: JSON.stringify({
       groupId: groupId,
              reason: result.value || ''
       }),
     success: function (response) {
       AmagiLoader.hide();
       if (response.MessageType) {
      Swal.fire({
      title: 'Rejected!',
              text: 'The study group has been rejected.',
         icon: 'success',
     confirmButtonColor: '#5D87FF'
         }).then(() => {
      loadStudyGroups();
            });
           } else {
        Swal.fire({
           title: 'Error!',
               text: response.Message || 'Failed to reject study group.',
              icon: 'error',
     confirmButtonColor: '#dc3545'
        });
    }
          },
       error: function (error) {
    AmagiLoader.hide();
         console.error('Error rejecting group:', error);
   Swal.fire({
       title: 'Error!',
 text: 'An error occurred. Please try again.',
        icon: 'error',
           confirmButtonColor: '#dc3545'
          });
        }
                });
         }
        });
    }

    function getGroupIcon(categoryName) {
        const icons = {
     'mathematics': 'ti ti-math',
    'science': 'ti ti-flask',
     'programming': 'ti ti-code',
          'language': 'ti ti-language',
         'history': 'ti ti-book',
     'literature': 'ti ti-book-2',
  'art': 'ti ti-palette',
          'music': 'ti ti-music',
            'sports': 'ti ti-ball-football',
          'technology': 'ti ti-device-laptop',
         'business': 'ti ti-briefcase',
            'default': 'ti ti-book'
        };

        const category = categoryName.toLowerCase();
    for (let key in icons) {
        if (category.includes(key)) {
           return icons[key];
     }
        }
        return icons['default'];
    }

    function getGroupColor(categoryName) {
        const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
     'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        ];

        // Generate consistent color based on category name
    let hash = 0;
   for (let i = 0; i < categoryName.length; i++) {
 hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
        }
  const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    function escapeHtml(text) {
  if (!text) return '';
const map = {
  '&': '&amp;',
            '<': '&lt;',
  '>': '&gt;',
         '"': '&quot;',
     "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function showLoading() {
        $('#loadingIndicator').show();
        $('#studyGroupsContainer').hide();
        $('#emptyState').hide();
    }

  function hideLoading() {
  $('#loadingIndicator').hide();
      $('#studyGroupsContainer').show();
  }

    function showEmptyState() {
     $('#emptyState').show();
      $('#studyGroupsContainer').hide();
    }

    function hideEmptyState() {
        $('#emptyState').hide();
    $('#studyGroupsContainer').show();
    }
});

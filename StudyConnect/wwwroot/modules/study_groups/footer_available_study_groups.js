$(function () {
    let allStudyGroups = [];
    let filteredGroups = [];

    // Initialize DevExtreme SearchBox
    $("#searchBox").dxTextBox({
        placeholder: "Search by group name...",
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

    // Load study groups on page load
    loadStudyGroups();

    function loadStudyGroups() {
        showLoading();

        $.ajax({
            url: '/StudyGroups/GetAvailableStudyGroups',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                hideLoading();

                if (response.data && response.data.length > 0) {
                    allStudyGroups = response.data;
                    filteredGroups = [...allStudyGroups];
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
        if (!searchText || searchText.trim() === '') {
            filteredGroups = [...allStudyGroups];
        } else {
            const searchLower = searchText.toLowerCase();
            filteredGroups = allStudyGroups.filter(group =>
                group.name.toLowerCase().includes(searchLower) ||
                (group.description && group.description.toLowerCase().includes(searchLower)) ||
                group.categoryName.toLowerCase().includes(searchLower)
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

        // Action button based on privacy and capacity
        let actionButton = '';
        if (group.isFull) {
            actionButton = `<button class="btn btn-secondary btn-sm flex-grow-1" disabled>
  <i class="ti ti-lock me-1"></i>Full
    </button>`;
        } else if (group.privacy === 'Public') {
            actionButton = `<button class="btn btn-success btn-sm flex-grow-1 join-group-btn" data-group-id="${group.id}">
       <i class="ti ti-plus me-1"></i>Join
            </button>`;
        } else {
            actionButton = `<button class="btn btn-info btn-sm flex-grow-1 request-join-btn" data-group-id="${group.id}">
                <i class="ti ti-send me-1"></i>Request to Join
   </button>`;
        }

        const card = `
            <div class="col-lg-4 col-md-6 mb-4">
     <div class="card study-group-card h-100 shadow-sm hover-shadow" data-group-id="${group.id}">
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

        <div class="d-flex gap-2">
         <a href="/StudyGroups/Details/${group.id}" class="btn btn-outline-primary btn-sm">
              <i class="ti ti-eye me-1"></i>View
     </a>
  ${actionButton}
  </div>

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

    // Handle join group button click
    $(document).on('click', '.join-group-btn', function () {
        const groupId = $(this).data('group-id');
        joinGroup(groupId);
    });

    // Handle request to join button click
    $(document).on('click', '.request-join-btn', function () {
        const groupId = $(this).data('group-id');
        requestToJoin(groupId);
    });

    function joinGroup(groupId) {
        Swal.fire({
            title: 'Join Study Group?',
            text: 'Do you want to join this study group?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#5D87FF',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, join!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/StudyGroups/AddMember',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        studyGroupId: groupId,
                        userId: '' // Will be filled by the server with current user
                    }),
                    success: function (response) {
                        if (response.MessageType) {
                            Swal.fire({
                                title: 'Success!',
                                text: 'You have successfully joined the study group!',
                                icon: 'success',
                                confirmButtonColor: '#5D87FF'
                            }).then(() => {
                                // Reload the page to refresh the list
                                loadStudyGroups();
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: response.Message || 'Failed to join study group.',
                                icon: 'error',
                                confirmButtonColor: '#dc3545'
                            });
                        }
                    },
                    error: function (error) {
                        console.error('Error joining group:', error);
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

    function requestToJoin(groupId) {
        Swal.fire({
            title: 'Request to Join?',
            text: 'Your request will be sent to the group owner for approval.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#5D87FF',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, send request!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/StudyGroups/AddMember',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        studyGroupId: groupId,
                        userId: '' // Will be filled by the server with current user
                    }),
                    success: function (response) {
                        if (response.MessageType) {
                            Swal.fire({
                                title: 'Success!',
                                text: 'Your request has been sent to the group owner!',
                                icon: 'success',
                                confirmButtonColor: '#5D87FF'
                            }).then(() => {
                                // Reload the page to refresh the list
                                loadStudyGroups();
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: response.Message || 'Failed to send request.',
                                icon: 'error',
                                confirmButtonColor: '#dc3545'
                            });
                        }
                    },
                    error: function (error) {
                        console.error('Error requesting to join:', error);
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
            'default': 'ti ti-books'
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

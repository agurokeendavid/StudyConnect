$(function () {
    var connection = null;
    var currentChatUserId = null;
    var conversations = [];

    // Initialize SignalR
    initializeSignalR();

    // Load initial conversations
    loadConversations();

    // Event handlers
    $('#btnNewMessage, #btnStartConversation').on('click', openNewMessageModal);
    $('#btnSendMessage').on('click', sendMessage);
    $('#btnRefreshChat').on('click', refreshCurrentChat);
    $('#searchConversations').on('input', filterConversations);
    $('#userSearch').on('input', searchUsers);

    // Message input - send on Ctrl+Enter
    $('#messageInput').on('keydown', function (e) {
        if (e.ctrlKey && e.key === 'Enter') {
            sendMessage();
        }
    });
});

// ==================== SignalR Setup ====================
function initializeSignalR() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("/directMessageHub")
        .withAutomaticReconnect()
        .build();

    // Handle incoming messages
    connection.on("ReceiveMessage", function (messageData) {
        handleIncomingMessage(messageData);
    });

    // Handle message sent confirmation
    connection.on("MessageSent", function (messageData) {
        if (messageData.receiverId === currentChatUserId) {
            appendMessage(messageData, true);
        }
    });

    // Handle message read notification
    connection.on("MessageRead", function (messageId) {
        updateMessageReadStatus(messageId);
    });

    // Handle conversation read notification
    connection.on("ConversationRead", function (userId) {
        if (userId === currentChatUserId) {
            markAllMessagesAsRead();
        }
    });

    // Start the connection
    connection.start()
        .then(function () {
            console.log("SignalR Connected");
            connection.invoke("JoinUserConnection", currentUserId)
                .then(function () {
                    console.log("Joined user connection: " + currentUserId);
                })
                .catch(function (err) {
                    console.error("Error joining user connection: ", err);
                });
        })
        .catch(function (err) {
            console.error("SignalR Connection Error: ", err);
        });

    // Handle reconnection
    connection.onreconnected(function () {
        console.log("SignalR Reconnected");
        connection.invoke("JoinUserConnection", currentUserId)
            .catch(function (err) {
                console.error("Error rejoining user connection: ", err);
            });
    });

    // Handle disconnection
    connection.onclose(function () {
        console.log("SignalR Disconnected");
    });
}

// ==================== Load Conversations ====================
function loadConversations() {
    $.ajax({
        url: '/Messages/GetConversations',
        type: 'GET',
        success: function (response) {
            conversations = response.data || [];
            renderConversations(conversations);
        },
        error: function () {
            console.error('Error loading conversations');
        }
    });
}

function renderConversations(convList) {
    var $container = $('#conversationsList');
    $container.empty();

    if (convList.length === 0) {
        $('#conversationsEmpty').show();
        $container.hide();
        return;
    }

    $('#conversationsEmpty').hide();
    $container.show();

    convList.forEach(function (conv) {
        var $item = createConversationItem(conv);
        $container.append($item);
    });
}

function createConversationItem(conv) {
    var initials = getInitials(conv.userName);
    var unreadBadge = conv.unreadCount > 0
        ? `<span class="conversation-unread">${conv.unreadCount}</span>`
        : '';

    var $item = $(`
        <div class="conversation-item" data-user-id="${conv.userId}">
            <div class="message-avatar">${initials}</div>
            <div class="conversation-info">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="conversation-name">${escapeHtml(conv.userName)}</div>
                    ${unreadBadge}
                </div>
                <div class="conversation-last-message">${escapeHtml(conv.lastMessage)}</div>
                <div class="conversation-time">${conv.lastMessageTime}</div>
            </div>
        </div>
    `);

    $item.on('click', function () {
        openChat(conv.userId, conv.userName, conv.email);
    });

    return $item;
}

function filterConversations() {
    var searchTerm = $('#searchConversations').val().toLowerCase();
    var filtered = conversations.filter(function (conv) {
        return conv.userName.toLowerCase().includes(searchTerm) ||
            conv.email.toLowerCase().includes(searchTerm) ||
            conv.lastMessage.toLowerCase().includes(searchTerm);
    });
    renderConversations(filtered);
}

// ==================== Open Chat ====================
function openChat(userId, userName, email) {
    currentChatUserId = userId;

    // Update active conversation
    $('.conversation-item').removeClass('active');
    $(`.conversation-item[data-user-id="${userId}"]`).addClass('active');

    // Show chat container
    $('#noConversationSelected').hide();
    $('#chatContainer').show();

    // Update chat header
    var initials = getInitials(userName);
    $('#chatUserAvatar').text(initials);
    $('#chatUserName').text(userName);
    $('#chatUserEmail').text(email);

    // Clear messages area
    $('#messagesArea').html('<div class="messages-loading"><i class="ti ti-loader"></i> Loading messages...</div>');

    // Load messages
    loadMessages(userId);

    // Mark conversation as read
    markConversationAsRead(userId);
}

function refreshCurrentChat() {
    if (currentChatUserId) {
        var userName = $('#chatUserName').text();
        var email = $('#chatUserEmail').text();
        openChat(currentChatUserId, userName, email);
    }
}

// ==================== Load Messages ====================
function loadMessages(userId) {
    $.ajax({
        url: '/Messages/GetMessages',
        type: 'GET',
        data: { userId: userId },
        success: function (response) {
            renderMessages(response.data || []);
        },
        error: function () {
            $('#messagesArea').html('<div class="empty-messages"><i class="ti ti-alert-circle"></i><p>Error loading messages</p></div>');
        }
    });
}

function renderMessages(messages) {
    var $container = $('#messagesArea');
    $container.empty();

    if (messages.length === 0) {
        $container.html('<div class="empty-messages"><i class="ti ti-message-circle-off"></i><p>No messages yet. Start the conversation!</p></div>');
        return;
    }

    messages.forEach(function (msg) {
        appendMessage(msg, false);
    });

    scrollToBottom();
}

function appendMessage(msg, animate) {
    var $container = $('#messagesArea');

    // Remove empty state if exists
    $container.find('.empty-messages').remove();

    var isSent = msg.isMine || msg.senderId === currentUserId;
    var bubbleClass = isSent ? 'message-sent' : 'message-received';

    var readStatus = '';
    if (isSent) {
        readStatus = msg.isRead
            ? '<div class="message-read-status"><i class="ti ti-checks"></i> Read</div>'
            : '<div class="message-read-status"><i class="ti ti-check"></i> Sent</div>';
    }

    var $message = $(`
        <div class="message-bubble ${bubbleClass}" data-message-id="${msg.id}">
            <div class="message-content">
                <div class="message-text">${escapeHtml(msg.message)}</div>
                <div class="message-time">${msg.sentAt}</div>
                ${readStatus}
            </div>
        </div>
    `);

    if (animate) {
        $message.hide().appendTo($container).fadeIn(300);
    } else {
        $message.appendTo($container);
    }

    scrollToBottom();
}

function scrollToBottom() {
    var $messagesArea = $('#messagesArea');
    $messagesArea.animate({ scrollTop: $messagesArea[0].scrollHeight }, 300);
}

// ==================== Send Message ====================
function sendMessage() {
    var message = $('#messageInput').val().trim();

    if (!message) {
        Swal.fire('Error', 'Please enter a message', 'error');
        return;
    }

    if (!currentChatUserId) {
        Swal.fire('Error', 'No conversation selected', 'error');
        return;
    }

    if (message.length > 5000) {
        Swal.fire('Error', 'Message is too long. Maximum 5000 characters.', 'error');
        return;
    }

    AmagiLoader.show();

    $.ajax({
        url: '/Messages/SendMessage',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            receiverId: currentChatUserId,
            message: message
        }),
        success: function (response) {
            AmagiLoader.hide();
            if (response.MessageType === 'Success') {
                $('#messageInput').val('');
                
                // Add message to UI if not already added by SignalR
                var messageExists = $(`.message-bubble[data-message-id="${response.Data.id}"]`).length > 0;
                if (!messageExists) {
                    var msgData = {
                        id: response.Data.id,
                        senderId: currentUserId,
                        message: message,
                        sentAt: response.Data.sentAt,
                        isRead: false,
                        isMine: true
                    };
                    appendMessage(msgData, true);
                }

                // Reload conversations to update last message
                loadConversations();
            } else {
                Swal.fire('Error', response.Message || 'Failed to send message', 'error');
            }
        },
        error: function () {
            AmagiLoader.hide();
            Swal.fire('Error', 'An error occurred while sending', 'error');
        }
    });
}

// ==================== Handle Incoming Message ====================
function handleIncomingMessage(messageData) {
    // If the message is from the current chat user, append it
    if (messageData.senderId === currentChatUserId) {
        appendMessage(messageData, true);
        
        // Mark as read immediately
        markMessageAsRead(messageData.id);
    } else {
        // Show notification
        showMessageNotification(messageData);
    }

    // Reload conversations to update
    loadConversations();
}

function showMessageNotification(messageData) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New message from ' + messageData.senderName, {
            body: messageData.message,
            icon: '/templates/modernize/images/logos/favicon.png'
        });
    }

    // Show in-app notification
    Swal.fire({
        title: 'New Message',
        html: `<strong>${escapeHtml(messageData.senderName)}</strong><br>${escapeHtml(messageData.message)}`,
        icon: 'info',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
    });
}

// ==================== Mark as Read ====================
function markMessageAsRead(messageId) {
    $.ajax({
        url: '/Messages/MarkAsRead',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(messageId),
        error: function () {
            console.error('Error marking message as read');
        }
    });
}

function markConversationAsRead(userId) {
    $.ajax({
        url: '/Messages/MarkConversationAsRead',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(userId),
        success: function () {
            // Update conversation UI to remove unread badge
            var $conv = $(`.conversation-item[data-user-id="${userId}"]`);
            $conv.find('.conversation-unread').remove();
        },
        error: function () {
            console.error('Error marking conversation as read');
        }
    });
}

function updateMessageReadStatus(messageId) {
    var $message = $(`.message-bubble[data-message-id="${messageId}"]`);
    $message.find('.message-read-status').html('<i class="ti ti-checks"></i> Read');
}

function markAllMessagesAsRead() {
    $('#messagesArea .message-sent .message-read-status').html('<i class="ti ti-checks"></i> Read');
}

// ==================== New Message Modal ====================
function openNewMessageModal() {
    $('#newMessageModal').modal('show');
    $('#userSearch').val('');
    $('#userSearchResults').html('<p class="text-muted text-center py-3">Search for users to start a conversation</p>');
}

function searchUsers() {
    var searchTerm = $('#userSearch').val().trim();

    if (searchTerm.length < 2) {
        $('#userSearchResults').html('<p class="text-muted text-center py-3">Type at least 2 characters to search</p>');
        return;
    }

    $.ajax({
        url: '/Messages/GetUsers',
        type: 'GET',
        data: { search: searchTerm },
        success: function (response) {
            renderUserSearchResults(response.data || []);
        },
        error: function () {
            $('#userSearchResults').html('<p class="text-danger text-center py-3">Error searching users</p>');
        }
    });
}

function renderUserSearchResults(users) {
    var $container = $('#userSearchResults');
    $container.empty();

    if (users.length === 0) {
        $container.html('<p class="text-muted text-center py-3">No users found</p>');
        return;
    }

    users.forEach(function (user) {
        var $item = $(`
            <div class="user-search-item" data-user-id="${user.id}">
                <div class="message-avatar">${user.initials}</div>
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.fullName)}</div>
                    <div class="user-email">${escapeHtml(user.email)}</div>
                </div>
            </div>
        `);

        $item.on('click', function () {
            startConversation(user.id, user.fullName, user.email);
        });

        $container.append($item);
    });
}

function startConversation(userId, userName, email) {
    $('#newMessageModal').modal('hide');
    openChat(userId, userName, email);
}

// ==================== Helper Functions ====================
function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.charAt(0) + (name.charAt(1) || '');
}

function escapeHtml(text) {
    if (!text) return '';
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Update unread count in navbar (if you have a messages icon in navbar)
function updateUnreadCount() {
    $.ajax({
        url: '/Messages/GetUnreadCount',
        type: 'GET',
        success: function (response) {
            var count = response.count || 0;
            if (count > 0) {
                $('.messages-unread-badge').text(count).show();
            } else {
                $('.messages-unread-badge').hide();
            }
        }
    });
}

// Update unread count every 30 seconds
setInterval(updateUnreadCount, 30000);
updateUnreadCount();

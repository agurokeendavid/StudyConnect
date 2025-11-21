using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Helpers;
using StudyConnect.Hubs;
using StudyConnect.Models;
using StudyConnect.Requests;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class MessagesController : Controller
    {
        private readonly ILogger<MessagesController> _logger;
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditService _auditService;
        private readonly IHubContext<DirectMessageHub> _hubContext;

        public MessagesController(
            ILogger<MessagesController> logger,
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            IAuditService auditService,
            IHubContext<DirectMessageHub> hubContext)
        {
            _logger = logger;
            _context = context;
            _userManager = userManager;
            _auditService = auditService;
            _hubContext = hubContext;
        }

        public async Task<IActionResult> Index()
        {
            await _auditService.LogCustomActionAsync("Viewed Messages Page");
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetConversations()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Json(new { data = new List<object>() });
                }

                // Get all unique conversations
                var conversations = await _context.DirectMessages
                    .Where(m => m.DeletedAt == null &&
                           (m.SenderId == currentUserId || m.ReceiverId == currentUserId))
                    .GroupBy(m => m.SenderId == currentUserId ? m.ReceiverId : m.SenderId)
                    .Select(g => new
                    {
                        userId = g.Key,
                        lastMessage = g.OrderByDescending(m => m.SentAt).FirstOrDefault()
                    })
                    .ToListAsync();

                var result = new List<object>();

                foreach (var conv in conversations)
                {
                    var otherUser = await _userManager.FindByIdAsync(conv.userId);
                    if (otherUser == null || otherUser.DeletedAt != null) continue;

                    var unreadCount = await _context.DirectMessages
                        .Where(m => m.DeletedAt == null &&
                               m.SenderId == conv.userId &&
                               m.ReceiverId == currentUserId &&
                               !m.IsRead)
                        .CountAsync();

                    result.Add(new
                    {
                        userId = conv.userId,
                        userName = $"{otherUser.FirstName} {otherUser.LastName}",
                        email = otherUser.Email,
                        lastMessage = conv.lastMessage?.Message ?? "",
                        lastMessageTime = conv.lastMessage?.SentAt.ToString("MM/dd/yyyy hh:mm tt") ?? "",
                        unreadCount = unreadCount,
                        isOnline = false // You can implement online status tracking
                    });
                }

                return Json(new { data = result.OrderByDescending(c => ((dynamic)c).lastMessageTime) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversations");
                return Json(new { data = new List<object>() });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMessages(string userId, int skip = 0, int take = 50)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(userId))
                {
                    return Json(new { data = new List<object>() });
                }

                var messages = await _context.DirectMessages
                    .Where(m => m.DeletedAt == null &&
                           ((m.SenderId == currentUserId && m.ReceiverId == userId) ||
                            (m.SenderId == userId && m.ReceiverId == currentUserId)))
                    .OrderByDescending(m => m.SentAt)
                    .Skip(skip)
                    .Take(take)
                    .Include(m => m.Sender)
                    .ToListAsync();

                var result = messages.Select(m => new
                {
                    id = m.Id,
                    senderId = m.SenderId,
                    senderName = $"{m.Sender.FirstName} {m.Sender.LastName}",
                    receiverId = m.ReceiverId,
                    message = m.Message,
                    isRead = m.IsRead,
                    sentAt = m.SentAt.ToString("MM/dd/yyyy hh:mm tt"),
                    sentAtRaw = m.SentAt,
                    isMine = m.SenderId == currentUserId
                }).OrderBy(m => m.sentAtRaw).ToList();

                return Json(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting messages");
                return Json(new { data = new List<object>() });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers(string search = "")
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                var query = _userManager.Users.Where(u => u.DeletedAt == null && u.Id != currentUserId);

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(u =>
                        u.FirstName.Contains(search) ||
                        u.LastName.Contains(search) ||
                        u.Email.Contains(search));
                }

                var users = await query
                    .OrderBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .Take(50)
                    .ToListAsync();

                var result = users.Select(u => new
                {
                    id = u.Id,
                    fullName = $"{u.FirstName} {u.LastName}",
                    email = u.Email,
                    initials = GetInitials($"{u.FirstName} {u.LastName}")
                }).ToList();

                return Json(new { data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return Json(new { data = new List<object>() });
            }
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendDirectMessageRequest request)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Json(ResponseHelper.Failed("You must be logged in to send messages."));
                }

                if (string.IsNullOrEmpty(request.ReceiverId))
                {
                    return Json(ResponseHelper.Failed("Receiver is required."));
                }

                if (string.IsNullOrEmpty(request.Message) || request.Message.Length > 5000)
                {
                    return Json(ResponseHelper.Failed("Message must be between 1 and 5000 characters."));
                }

                // Check if receiver exists
                var receiver = await _userManager.FindByIdAsync(request.ReceiverId);
                if (receiver == null || receiver.DeletedAt != null)
                {
                    return Json(ResponseHelper.Failed("Receiver not found."));
                }

                var sender = await _userManager.FindByIdAsync(currentUserId);
                var currentUserName = sender != null
                    ? $"{sender.FirstName} {sender.LastName}"
                    : "System";

                var message = new DirectMessage
                {
                    SenderId = currentUserId,
                    ReceiverId = request.ReceiverId,
                    Message = request.Message,
                    IsRead = false,
                    SentAt = DateTime.Now,
                    CreatedBy = currentUserId,
                    CreatedByName = currentUserName,
                    CreatedAt = DateTime.Now,
                    ModifiedBy = currentUserId,
                    ModifiedByName = currentUserName,
                    ModifiedAt = DateTime.Now
                };

                _context.DirectMessages.Add(message);
                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogCustomActionAsync($"Sent message to {receiver.FirstName} {receiver.LastName}");

                var messageData = new
                {
                    id = message.Id,
                    senderId = message.SenderId,
                    senderName = currentUserName,
                    receiverId = message.ReceiverId,
                    message = message.Message,
                    isRead = message.IsRead,
                    sentAt = message.SentAt.ToString("MM/dd/yyyy hh:mm tt"),
                    sentAtRaw = message.SentAt,
                    isMine = false
                };

                // Send real-time notification via SignalR
                await _hubContext.Clients.Group($"User_{request.ReceiverId}")
                    .SendAsync("ReceiveMessage", messageData);

                return Json(ResponseHelper.Success("Message sent successfully.", messageData));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message");
                return Json(ResponseHelper.Error("An error occurred while sending the message."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> MarkAsRead([FromBody] int messageId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Json(ResponseHelper.Failed("You must be logged in."));
                }

                var message = await _context.DirectMessages
                    .FirstOrDefaultAsync(m => m.Id == messageId && m.DeletedAt == null);

                if (message == null)
                {
                    return Json(ResponseHelper.Failed("Message not found."));
                }

                if (message.ReceiverId != currentUserId)
                {
                    return Json(ResponseHelper.Failed("You can only mark your own messages as read."));
                }

                if (!message.IsRead)
                {
                    message.IsRead = true;
                    message.ReadAt = DateTime.Now;
                    await _context.SaveChangesAsync();

                    // Notify sender that message was read
                    await _hubContext.Clients.Group($"User_{message.SenderId}")
                        .SendAsync("MessageRead", messageId);
                }

                return Json(ResponseHelper.Success("Message marked as read."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking message as read");
                return Json(ResponseHelper.Error("An error occurred."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> MarkConversationAsRead([FromBody] string userId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(userId))
                {
                    return Json(ResponseHelper.Failed("Invalid request."));
                }

                var unreadMessages = await _context.DirectMessages
                    .Where(m => m.DeletedAt == null &&
                           m.SenderId == userId &&
                           m.ReceiverId == currentUserId &&
                           !m.IsRead)
                    .ToListAsync();

                foreach (var message in unreadMessages)
                {
                    message.IsRead = true;
                    message.ReadAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                // Notify sender
                await _hubContext.Clients.Group($"User_{userId}")
                    .SendAsync("ConversationRead", currentUserId);

                return Json(ResponseHelper.Success($"{unreadMessages.Count} message(s) marked as read."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking conversation as read");
                return Json(ResponseHelper.Error("An error occurred."));
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteMessage([FromBody] int messageId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Json(ResponseHelper.Failed("You must be logged in."));
                }

                var message = await _context.DirectMessages
                    .FirstOrDefaultAsync(m => m.Id == messageId && m.DeletedAt == null);

                if (message == null)
                {
                    return Json(ResponseHelper.Failed("Message not found."));
                }

                if (message.SenderId != currentUserId)
                {
                    return Json(ResponseHelper.Failed("You can only delete your own messages."));
                }

                var currentUser = await _userManager.FindByIdAsync(currentUserId);
                var currentUserName = currentUser != null
                    ? $"{currentUser.FirstName} {currentUser.LastName}"
                    : "System";

                // Soft delete
                message.DeletedBy = currentUserId;
                message.DeletedByName = currentUserName;
                message.DeletedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Log the action
                await _auditService.LogDeleteAsync("DirectMessage", message.Id.ToString(), new { message.Message });

                return Json(ResponseHelper.Success("Message deleted successfully."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting message");
                return Json(ResponseHelper.Error("An error occurred while deleting the message."));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Json(new { count = 0 });
                }

                var count = await _context.DirectMessages
                    .Where(m => m.DeletedAt == null &&
                           m.ReceiverId == currentUserId &&
                           !m.IsRead)
                    .CountAsync();

                return Json(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return Json(new { count = 0 });
            }
        }

        private string GetInitials(string name)
        {
            if (string.IsNullOrEmpty(name)) return "?";
            var parts = name.Trim().Split(' ');
            if (parts.Length >= 2)
            {
                return parts[0][0].ToString() + parts[1][0].ToString();
            }
            return name.Length >= 2 ? name.Substring(0, 2) : name;
        }
    }
}

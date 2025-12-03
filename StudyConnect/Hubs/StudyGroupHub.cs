using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using System.Security.Claims;

namespace StudyConnect.Hubs
{
    [Authorize]
    public class StudyGroupHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly ILogger<StudyGroupHub> _logger;

        public StudyGroupHub(AppDbContext context, ILogger<StudyGroupHub> logger)
  {
        _context = context;
            _logger = logger;
        }

     public async Task JoinStudyGroup(int studyGroupId)
      {
       try
            {
                var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
                
          if (string.IsNullOrEmpty(userId))
    {
         return;
        }

        // Verify user is an approved member
       var isMember = await _context.StudyGroupMembers
         .AnyAsync(m => m.StudyGroupId == studyGroupId && 
    m.UserId == userId && 
      m.IsApproved && 
  m.DeletedAt == null);

                if (!isMember)
      {
        return;
          }

    var groupName = $"StudyGroup_{studyGroupId}";
    await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
         
                _logger.LogInformation($"User {userId} joined group {groupName}");
    }
  catch (Exception ex)
  {
   _logger.LogError(ex, $"Error joining study group {studyGroupId}");
 }
    }

        public async Task LeaveStudyGroup(int studyGroupId)
        {
            try
      {
       var groupName = $"StudyGroup_{studyGroupId}";
    await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
       
         var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
          _logger.LogInformation($"User {userId} left group {groupName}");
      }
      catch (Exception ex)
            {
           _logger.LogError(ex, $"Error leaving study group {studyGroupId}");
       }
      }

        public async Task JoinForum(int forumId)
        {
            try
            {
                var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
                
                if (string.IsNullOrEmpty(userId))
                {
                    return;
                }

                // Verify user is an approved member of the forum
                var isForumMember = await _context.StudyGroupForumMembers
                    .AnyAsync(fm => fm.ForumId == forumId && 
                        fm.UserId == userId && 
                        fm.IsApproved && 
                        fm.DeletedAt == null);

                if (!isForumMember)
                {
                    return;
                }

                var groupName = $"Forum_{forumId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                
                _logger.LogInformation($"User {userId} joined forum {groupName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error joining forum {forumId}");
            }
        }

        public async Task LeaveForum(int forumId)
        {
            try
            {
                var groupName = $"Forum_{forumId}";
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
                
                var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"User {userId} left forum {groupName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error leaving forum {forumId}");
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
     await base.OnDisconnectedAsync(exception);
    }
    }
}

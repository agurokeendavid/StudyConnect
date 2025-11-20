using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using System.Security.Claims;

namespace StudyConnect.Controllers
{
    [Authorize]
    public class MeetingsController : Controller
    {
        private readonly AppDbContext _context;

        public MeetingsController(AppDbContext context)
        {
            _context = context;
        }

        public IActionResult MyCalendar()
        {
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetMyMeetings()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // Get all study groups where user is an approved member
                var userStudyGroupIds = await _context.StudyGroupMembers
                    .Where(m => m.UserId == currentUserId && 
                                m.IsApproved && 
                                m.DeletedAt == null)
                    .Select(m => m.StudyGroupId)
                    .ToListAsync();

                // Get all meetings from those study groups
                var meetings = await _context.StudyGroupMeetings
                    .Where(m => userStudyGroupIds.Contains(m.StudyGroupId) &&
                                m.DeletedAt == null &&
                                !m.IsCancelled &&
                                m.IsActive)
                    .Include(m => m.StudyGroup)
                    .Include(m => m.CreatedByUser)
                    .OrderBy(m => m.ScheduledStartTime)
                    .Select(m => new
                    {
                        id = m.Id,
                        title = m.Title,
                        description = m.Description,
                        meetingLink = m.MeetingLink,
                        start = m.ScheduledStartTime,
                        end = m.ScheduledEndTime,
                        studyGroupId = m.StudyGroupId,
                        studyGroupName = m.StudyGroup.Name,
                        createdByName = $"{m.CreatedByUser.FirstName} {m.CreatedByUser.LastName}".Trim(),
                        maxParticipants = m.MaxParticipants,
                        isRecurring = m.IsRecurring,
                        recurrencePattern = m.RecurrencePattern
                    })
                    .ToListAsync();

                return Json(new { data = meetings });
            }
            catch (Exception ex)
            {
                return Json(new { data = new List<object>(), error = ex.Message });
            }
        }
    }
}

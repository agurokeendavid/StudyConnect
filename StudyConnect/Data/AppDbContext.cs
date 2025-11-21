using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Models;

namespace StudyConnect.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
     
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<StudyGroupCategory> StudyGroupCategories { get; set; }
        public DbSet<StudyGroup> StudyGroups { get; set; }
        public DbSet<StudyGroupMember> StudyGroupMembers { get; set; }
        public DbSet<StudyGroupResource> StudyGroupResources { get; set; }
        public DbSet<StudyGroupMessage> StudyGroupMessages { get; set; }
        public DbSet<StudyGroupMeeting> StudyGroupMeetings { get; set; }
        public DbSet<Ad> Ads { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<UserSubscription> UserSubscriptions { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
    }
}

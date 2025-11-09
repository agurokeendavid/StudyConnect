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
    }
}

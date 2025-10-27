using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Models;

namespace StudyConnect.Data;

public static class SeedData
{
    public static async Task RunAsync(
        AppDbContext db,
        UserManager<ApplicationUser> userMgr,
        RoleManager<IdentityRole> roleMgr)
    {
        foreach (var r in AppRoles.All)
            if (!await roleMgr.RoleExistsAsync(r))
                await roleMgr.CreateAsync(new IdentityRole(r));

        // Admin user
        var adminEmail = "administrator@studyconnect.ph";
        var admin = await userMgr.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "System",
                LastName = "Admin",
                Sex = "Male",
                MiddleName = null,
                
            };
            await userMgr.CreateAsync(admin, "Qwerty123!");
            await userMgr.AddToRoleAsync(admin, AppRoles.Admin);
        }

        // Student user
        var studentEmail = "student@studyconnect.local";
        var student = await userMgr.Users.FirstOrDefaultAsync(u => u.Email == studentEmail);
        if (student == null)
        {
            student = new ApplicationUser
            {
                UserName = studentEmail,
                Email = studentEmail,
                EmailConfirmed = true,
                FirstName = "Jane",
                LastName = "Doe",
                Sex = "Female"
            };
            await userMgr.CreateAsync(student, "Qwerty123!");
            await userMgr.AddToRoleAsync(student, AppRoles.Student);
        }

        // if (!await db.StudyGroups.AnyAsync())
        // {
        //     var g1 = new StudyGroup
        //     {
        //         Name = "C# Fundamentals",
        //         Description = "Beginner to intermediate C# topics",
        //         IsApproved = true,
        //         CreatedById = admin.Id
        //     };
        //     var g2 = new StudyGroup
        //     {
        //         Name = "Data Structures & Algorithms",
        //         Description = "DSA study group",
        //         IsApproved = false,
        //         CreatedById = student.Id
        //     };
        //
        //     db.StudyGroups.AddRange(g1, g2);
        //     await db.SaveChangesAsync();
        //
        //     db.GroupMemberships.AddRange(
        //         new GroupMembership { StudyGroupId = g1.Id, UserId = admin.Id, Role = "Owner" },
        //         new GroupMembership { StudyGroupId = g1.Id, UserId = student.Id, Role = "Member" },
        //         new GroupMembership { StudyGroupId = g2.Id, UserId = student.Id, Role = "Owner" }
        //     );
        //
        //     db.Posts.AddRange(
        //         new Post
        //         {
        //             StudyGroupId = g1.Id,
        //             Title = "What is the difference between ref and out?",
        //             Content = "Can someone explain scenarios for ref vs out?",
        //             IsApproved = true,
        //             CreatedById = student.Id
        //         },
        //         new Post
        //         {
        //             StudyGroupId = g1.Id,
        //             Title = "Lesson: Delegates & Events",
        //             Content = "Short primer on delegates/events with examples.",
        //             IsApproved = false, // pending approval
        //             CreatedById = admin.Id
        //         }
        //     );
        //
        //     await db.SaveChangesAsync();
        // }
        await db.SaveChangesAsync();
    }
}
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

        var math201 = await db.StudyGroupCategories.FirstOrDefaultAsync(sgc => sgc.Name == "MATH 201");

        if (math201 is null)
        {
            math201 = new StudyGroupCategory()
            {
                Name = "MATH 201",
                Description = "MATH 201",
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.StudyGroupCategories.AddAsync(math201);
        }

        var phys301 = await db.StudyGroupCategories.FirstOrDefaultAsync(sgc => sgc.Name == "PHYS 301");

        if (phys301 is null)
        {
            phys301 = new StudyGroupCategory()
            {
                Name = "PHYS 301",
                Description = "PHYS 301",
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.StudyGroupCategories.AddAsync(phys301);
        }

        var cs401 = await db.StudyGroupCategories.FirstOrDefaultAsync(sgc => sgc.Name == "CS 401");

        if (cs401 is null)
        {
            cs401 = new StudyGroupCategory()
            {
                Name = "CS 401",
                Description = "CS 401",
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.StudyGroupCategories.AddAsync(cs401);
        }

        var bio301 = await db.StudyGroupCategories.FirstOrDefaultAsync(sgc => sgc.Name == "BIO 301");

        if (bio301 is null)
        {
            bio301 = new StudyGroupCategory()
            {
                Name = "BIO 301",
                Description = "BIO 301",
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.StudyGroupCategories.AddAsync(bio301);
        }

        var chem202 = await db.StudyGroupCategories.FirstOrDefaultAsync(sgc => sgc.Name == "CHEM 202");

        if (chem202 is null)
        {
            chem202 = new StudyGroupCategory()
            {
                Name = "CHEM 202",
                Description = "CHEM 202",
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.StudyGroupCategories.AddAsync(chem202);
        }

        var eng301 = await db.StudyGroupCategories.FirstOrDefaultAsync(sgc => sgc.Name == "ENG 301");

        if (eng301 is null)
        {
            eng301 = new StudyGroupCategory()
            {
                Name = "ENG 301",
                Description = "ENG 301",
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.StudyGroupCategories.AddAsync(eng301);
        }
        await db.SaveChangesAsync();
    }
}
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

        // Subscription Plans
        var freeTrial = await db.Subscriptions.FirstOrDefaultAsync(s => s.Name == "Free Trial");
        if (freeTrial is null)
        {
            freeTrial = new Subscription()
            {
                Name = "Free Trial",
                Description = "4 hours lang pwede makapag access sa system. Limited files to be uploaded 5 files only",
                Price = 0,
                DurationInDays = 1, // Using 1 day to represent 4 hours (0.167 days)
                MaxFileUploads = 5,
                HasUnlimitedAccess = false,
                IsActive = true,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.Subscriptions.AddAsync(freeTrial);
        }

        var premium = await db.Subscriptions.FirstOrDefaultAsync(s => s.Name == "Premium");
        if (premium is null)
        {
            premium = new Subscription()
            {
                Name = "Premium",
                Description = "All features of the system. Unlimited access to all study groups, resources, and meetings",
                Price = 500,
                DurationInDays = 30, // 1 month
                MaxFileUploads = 0, // 0 means unlimited
                HasUnlimitedAccess = true,
                IsActive = true,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.Subscriptions.AddAsync(premium);
        }

        // Sample Ads for Testing
        var topBannerAd = await db.Ads.FirstOrDefaultAsync(a => a.Position == "Top" && a.Title == "Upgrade to Premium - Unlock All Features!");
        if (topBannerAd is null)
        {
            topBannerAd = new Ad()
            {
                Title = "Upgrade to Premium - Unlock All Features!",
                Description = "Get unlimited access to all study groups, resources, and meetings. No ads, no limits! Upgrade now for only ₱500/month.",
                ImageUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=300&fit=crop",
                LinkUrl = "/Subscriptions/AvailablePlans",
                StartDate = DateTime.Now.AddDays(-7),
                EndDate = DateTime.Now.AddMonths(6),
                Position = "Top",
                IsActive = true,
                ViewCount = 0,
                ClickCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.Ads.AddAsync(topBannerAd);
        }

        var sidebarAd = await db.Ads.FirstOrDefaultAsync(a => a.Position == "Sidebar" && a.Title == "Student Discount Available");
        if (sidebarAd is null)
        {
            sidebarAd = new Ad()
            {
                Title = "Student Discount Available",
                Description = "Join thousands of students already using StudyConnect Premium. Get 20% off your first month!",
                ImageUrl = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=400&fit=crop",
                LinkUrl = "/Subscriptions/AvailablePlans",
                StartDate = DateTime.Now.AddDays(-7),
                EndDate = DateTime.Now.AddMonths(6),
                Position = "Sidebar",
                IsActive = true,
                ViewCount = 0,
                ClickCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.Ads.AddAsync(sidebarAd);
        }

        var middleAd = await db.Ads.FirstOrDefaultAsync(a => a.Position == "Middle" && a.Title == "Free Trial Ending Soon?");
        if (middleAd is null)
        {
            middleAd = new Ad()
            {
                Title = "Free Trial Ending Soon?",
                Description = "Don't lose access to your study groups and resources! Upgrade to Premium and continue your learning journey without interruption.",
                ImageUrl = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop",
                LinkUrl = "/Subscriptions/AvailablePlans",
                StartDate = DateTime.Now.AddDays(-7),
                EndDate = DateTime.Now.AddMonths(6),
                Position = "Middle",
                IsActive = true,
                ViewCount = 0,
                ClickCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.Ads.AddAsync(middleAd);
        }

        // Additional Sample Ads for variety
        var topBannerAd2 = await db.Ads.FirstOrDefaultAsync(a => a.Position == "Top" && a.Title == "Limited Time Offer - 50% Off Premium!");
        if (topBannerAd2 is null)
        {
            topBannerAd2 = new Ad()
            {
                Title = "Limited Time Offer - 50% Off Premium!",
                Description = "Special promotion for new users! Get Premium access for only ₱250/month. Hurry, offer ends soon!",
                ImageUrl = "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&h=300&fit=crop",
                LinkUrl = "/Subscriptions/AvailablePlans",
                StartDate = DateTime.Now.AddDays(-7),
                EndDate = DateTime.Now.AddMonths(6),
                Position = "Top",
                IsActive = true,
                ViewCount = 0,
                ClickCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.Ads.AddAsync(topBannerAd2);
        }

        var sidebarAd2 = await db.Ads.FirstOrDefaultAsync(a => a.Position == "Sidebar" && a.Title == "Boost Your Grades");
        if (sidebarAd2 is null)
        {
            sidebarAd2 = new Ad()
            {
                Title = "Boost Your Grades",
                Description = "Premium members report 30% better grades. Collaborate more effectively with unlimited resources!",
                ImageUrl = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop",
                LinkUrl = "/Subscriptions/AvailablePlans",
                StartDate = DateTime.Now.AddDays(-7),
                EndDate = DateTime.Now.AddMonths(6),
                Position = "Sidebar",
                IsActive = true,
                ViewCount = 0,
                ClickCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.Ads.AddAsync(sidebarAd2);
        }

        await db.SaveChangesAsync();
    }
}
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

        // Sample Announcements for Testing
        var welcomeAnnouncement = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Welcome to StudyConnect!");
        if (welcomeAnnouncement is null)
        {
            welcomeAnnouncement = new Announcement()
            {
                Title = "Welcome to StudyConnect!",
                Content = "We're excited to have you join our community of learners! StudyConnect is designed to help students collaborate, share resources, and achieve academic success together. Start by joining a study group or creating your own. Don't hesitate to reach out if you need any assistance!",
                Type = "General",
                Priority = "Normal",
                IsActive = true,
                IsPinned = true,
                PublishDate = DateTime.Now.AddDays(-7),
                ExpiryDate = DateTime.Now.AddMonths(3),
                TargetAudience = "All",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddDays(-7),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddDays(-7)
            };
            await db.Announcements.AddAsync(welcomeAnnouncement);
        }

        var systemMaintenance = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Scheduled System Maintenance");
        if (systemMaintenance is null)
        {
            systemMaintenance = new Announcement()
            {
                Title = "Scheduled System Maintenance",
                Content = "Our system will undergo scheduled maintenance on January 15, 2025, from 2:00 AM to 4:00 AM. During this time, StudyConnect will be temporarily unavailable. We apologize for any inconvenience and appreciate your understanding. This maintenance will improve system performance and add exciting new features!",
                Type = "Important",
                Priority = "High",
                IsActive = true,
                IsPinned = true,
                PublishDate = DateTime.Now.AddDays(-5),
                ExpiryDate = DateTime.Now.AddDays(25),
                TargetAudience = "All",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddDays(-5),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddDays(-5)
            };
            await db.Announcements.AddAsync(systemMaintenance);
        }

        var examReminder = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Final Exam Period Approaching");
        if (examReminder is null)
        {
            examReminder = new Announcement()
            {
                Title = "Final Exam Period Approaching",
                Content = "Dear Students, final exams are just around the corner! Make the most of StudyConnect by joining study groups, sharing notes, and attending virtual study sessions. Remember to take breaks, stay hydrated, and get enough rest. Good luck with your preparations!",
                Type = "Event",
                Priority = "Normal",
                IsActive = true,
                IsPinned = false,
                PublishDate = DateTime.Now.AddDays(-3),
                ExpiryDate = DateTime.Now.AddDays(45),
                TargetAudience = "Students",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddDays(-3),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddDays(-3)
            };
            await db.Announcements.AddAsync(examReminder);
        }

        var newFeature = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "New Feature: Group Video Meetings!");
        if (newFeature is null)
        {
            newFeature = new Announcement()
            {
                Title = "New Feature: Group Video Meetings!",
                Content = "We're thrilled to announce a new feature: Group Video Meetings! Now you can schedule and join virtual study sessions directly through StudyConnect. Premium members get unlimited meeting time, while free trial users get up to 4 hours. Start collaborating face-to-face today!",
                Type = "Important",
                Priority = "High",
                IsActive = true,
                IsPinned = false,
                PublishDate = DateTime.Now.AddDays(-2),
                ExpiryDate = DateTime.Now.AddMonths(1),
                TargetAudience = "All",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddDays(-2),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddDays(-2)
            };
            await db.Announcements.AddAsync(newFeature);
        }

        var securityUpdate = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Security Update: Enable Two-Factor Authentication");
        if (securityUpdate is null)
        {
            securityUpdate = new Announcement()
            {
                Title = "Security Update: Enable Two-Factor Authentication",
                Content = "Your account security is our priority! We now offer two-factor authentication (2FA) to protect your account. Enable 2FA in your account settings to add an extra layer of security. This optional feature helps keep your study materials and personal information safe.",
                Type = "Urgent",
                Priority = "High",
                IsActive = true,
                IsPinned = false,
                PublishDate = DateTime.Now.AddDays(-1),
                ExpiryDate = DateTime.Now.AddMonths(2),
                TargetAudience = "All",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddDays(-1),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddDays(-1)
            };
            await db.Announcements.AddAsync(securityUpdate);
        }

        var studyTips = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Weekly Study Tip: Pomodoro Technique");
        if (studyTips is null)
        {
            studyTips = new Announcement()
            {
                Title = "Weekly Study Tip: Pomodoro Technique",
                Content = "Try the Pomodoro Technique to boost your productivity! Study for 25 minutes, then take a 5-minute break. After 4 sessions, take a longer 15-30 minute break. This method helps maintain focus and prevents burnout. Share your experience with your study group!",
                Type = "General",
                Priority = "Low",
                IsActive = true,
                IsPinned = false,
                PublishDate = DateTime.Now,
                ExpiryDate = DateTime.Now.AddDays(7),
                TargetAudience = "Students",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now,
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now
            };
            await db.Announcements.AddAsync(studyTips);
        }

        var communityGuidelines = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Community Guidelines Reminder");
        if (communityGuidelines is null)
        {
            communityGuidelines = new Announcement()
            {
                Title = "Community Guidelines Reminder",
                Content = "Let's keep StudyConnect a positive and respectful space! Please be courteous to fellow students, share resources responsibly, and report any inappropriate behavior. Together, we can build a supportive learning community. Thank you for being an awesome member!",
                Type = "General",
                Priority = "Normal",
                IsActive = true,
                IsPinned = false,
                PublishDate = DateTime.Now.AddHours(-12),
                ExpiryDate = DateTime.Now.AddMonths(6),
                TargetAudience = "All",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddHours(-12),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddHours(-12)
            };
            await db.Announcements.AddAsync(communityGuidelines);
        }

        var premiumPromo = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Limited Offer: 50% Off Premium for Students!");
        if (premiumPromo is null)
        {
            premiumPromo = new Announcement()
            {
                Title = "Limited Offer: 50% Off Premium for Students!",
                Content = "For a limited time, get 50% off your first month of StudyConnect Premium! Enjoy unlimited access to all features, no ads, unlimited file uploads, and priority support. Use code STUDENT50 at checkout. Offer expires in 2 weeks. Upgrade now!",
                Type = "Event",
                Priority = "High",
                IsActive = true,
                IsPinned = true,
                PublishDate = DateTime.Now.AddHours(-6),
                ExpiryDate = DateTime.Now.AddDays(14),
                TargetAudience = "Students",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddHours(-6),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddHours(-6)
            };
            await db.Announcements.AddAsync(premiumPromo);
        }

        var adminNotice = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Admin Notice: User Reports Review");
        if (adminNotice is null)
        {
            adminNotice = new Announcement()
            {
                Title = "Admin Notice: User Reports Review",
                Content = "Attention administrators: Please review all pending user reports by the end of this week. Priority should be given to reports marked as urgent. Use the new reporting dashboard to streamline the review process. Contact the development team if you encounter any issues.",
                Type = "Important",
                Priority = "High",
                IsActive = true,
                IsPinned = false,
                PublishDate = DateTime.Now.AddHours(-3),
                ExpiryDate = DateTime.Now.AddDays(5),
                TargetAudience = "Admins",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddHours(-3),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddHours(-3)
            };
            await db.Announcements.AddAsync(adminNotice);
        }

        var resourceSharing = await db.Announcements.FirstOrDefaultAsync(a => a.Title == "Top Contributors This Month");
        if (resourceSharing is null)
        {
            resourceSharing = new Announcement()
            {
                Title = "Top Contributors This Month",
                Content = "Shout out to our top resource contributors this month! Thank you for sharing your notes, study guides, and helping fellow students succeed. Keep up the great work! Want to be featured next month? Share your quality study materials in your groups!",
                Type = "General",
                Priority = "Low",
                IsActive = true,
                IsPinned = false,
                PublishDate = DateTime.Now.AddHours(-1),
                ExpiryDate = DateTime.Now.AddDays(30),
                TargetAudience = "Students",
                ViewCount = 0,
                CreatedBy = admin.Id,
                CreatedByName = $"{admin.FirstName} {admin.LastName}",
                CreatedAt = DateTime.Now.AddHours(-1),
                ModifiedBy = admin.Id,
                ModifiedByName = $"{admin.FirstName} {admin.LastName}",
                ModifiedAt = DateTime.Now.AddHours(-1)
            };
            await db.Announcements.AddAsync(resourceSharing);
        }

        await db.SaveChangesAsync();
    }
}
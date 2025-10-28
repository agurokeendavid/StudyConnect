using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Models;
using StudyConnect.Repositories;
using StudyConnect.Repositories.Contracts;
using StudyConnect.Services;

var builder = WebApplication.CreateBuilder(args);
// ---------- DB (MySQL 8 via Pomelo) ----------
string connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(
    dbContextOptions => dbContextOptions
  .UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
         // Only enable detailed logging when needed for debugging specific issues
         .LogTo(Console.WriteLine, LogLevel.Information)
    .EnableSensitiveDataLogging()
         .EnableDetailedErrors()
);

// ---------- Identity ----------
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(opt =>
    {
        opt.Password.RequiredLength = 8;
        opt.Password.RequireNonAlphanumeric = false;
        opt.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(opt =>
{
    opt.LoginPath = "/Account/Login";
    opt.AccessDeniedPath = "/Account/AccessDenied";
});

// Add services to the container.
builder.Services.AddControllersWithViews().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
});

// ---------- Repositories ----------
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

// ---------- Services ----------
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuditService, AuditService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var userMgr = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleMgr = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    await SeedData.RunAsync(db, userMgr, roleMgr);
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
    app.UseHttpsRedirection();
}
//app.UseHttpsRedirection();
app.UseRouting();

//app.MapStaticAssets()
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();

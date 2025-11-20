using Microsoft.AspNetCore.Identity;
using StudyConnect.Models;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Middleware
{
    public class SubscriptionCheckMiddleware
    {
        private readonly RequestDelegate _next;
        private static readonly string[] ProtectedPaths = new[]
        {
            "/studygroups/mystudygroups",
            "/studygroups/availablestudygroups",
            "/studygroups/myresources",
            "/studygroups/details"
        };

        public SubscriptionCheckMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(
            HttpContext context,
            ISubscriptionService subscriptionService,
            UserManager<ApplicationUser> userManager)
        {
            var path = context.Request.Path.Value?.ToLower() ?? "";
            
            // Check if the path requires subscription validation
            var isProtectedPath = ProtectedPaths.Any(p => path.StartsWith(p));
            
            if (isProtectedPath && context.User.Identity?.IsAuthenticated == true)
            {
                // Skip check for admins
                if (!context.User.IsInRole("Admin"))
                {
                    var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                    
                    if (!string.IsNullOrEmpty(userId))
                    {
                        var user = await userManager.FindByIdAsync(userId);
                        
                        if (user != null)
                        {
                            // Check subscription status
                            var hasActiveSubscription = await subscriptionService.HasActiveSubscriptionAsync(userId);
                            var isExpired = await subscriptionService.IsSubscriptionExpiredAsync(userId);
                            
                            if (isExpired && !hasActiveSubscription)
                            {
                                // Update user's subscription status
                                if (user.HasActiveSubscription)
                                {
                                    user.HasActiveSubscription = false;
                                    await userManager.UpdateAsync(user);
                                }
                                
                                // Check if it's an AJAX request
                                if (context.Request.Headers["X-Requested-With"] == "XMLHttpRequest" ||
                                    context.Request.Headers["Accept"].ToString().Contains("application/json"))
                                {
                                    context.Response.StatusCode = 403;
                                    context.Response.ContentType = "application/json";
                                    await context.Response.WriteAsync("{\"MessageType\": false, \"Message\": \"Your subscription has expired. Please upgrade to continue.\"}");
                                    return;
                                }
                            }
                        }
                    }
                }
            }

            await _next(context);
        }
    }

    public static class SubscriptionCheckMiddlewareExtensions
    {
        public static IApplicationBuilder UseSubscriptionCheck(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SubscriptionCheckMiddleware>();
        }
    }
}

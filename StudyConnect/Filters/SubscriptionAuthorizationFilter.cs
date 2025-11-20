using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using StudyConnect.Services;
using System.Security.Claims;

namespace StudyConnect.Filters
{
    public class SubscriptionAuthorizationFilter : IAsyncActionFilter
    {
        private readonly ISubscriptionService _subscriptionService;

        public SubscriptionAuthorizationFilter(ISubscriptionService subscriptionService)
        {
            _subscriptionService = subscriptionService;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var user = context.HttpContext.User;
            
            // Skip check for non-authenticated users or admins
            if (!user.Identity?.IsAuthenticated == true || user.IsInRole("Admin"))
            {
                await next();
                return;
            }

            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                await next();
                return;
            }

            // Check if user has active subscription
            var hasActiveSubscription = await _subscriptionService.HasActiveSubscriptionAsync(userId);
            
            if (!hasActiveSubscription)
            {
                // Check if subscription is expired
                var isExpired = await _subscriptionService.IsSubscriptionExpiredAsync(userId);
                
                if (isExpired)
                {
                    // Redirect to subscription page with expired message
                    context.Result = new RedirectToActionResult("AvailablePlans", "Subscriptions", new
                    {
                        expired = true,
                        message = "Your subscription has expired. Please choose a plan to continue accessing the system."
                    });
                    return;
                }
            }

            await next();
        }
    }

    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequireActiveSubscriptionAttribute : Attribute
    {
    }
}

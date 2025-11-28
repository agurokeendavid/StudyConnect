using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using StudyConnect.Data;

namespace StudyConnect.Services
{
    public class StripePaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly ILogger<StripePaymentService> _logger;

        public StripePaymentService(
            IConfiguration configuration,
            AppDbContext context,
            ILogger<StripePaymentService> logger)
        {
            _configuration = configuration;
            _context = context;
            _logger = logger;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
        }

        public async Task<string> CreateCheckoutSessionAsync(int subscriptionId, string userId, string successUrl, string cancelUrl)
        {
            try
            {
                var subscription = await _context.Subscriptions
                    .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.IsActive && s.DeletedAt == null);

                if (subscription == null)
                {
                    throw new Exception("Subscription plan not found");
                }

                // Create Stripe checkout session
                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string>
                    {
                        "card"
                    },
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            PriceData = new SessionLineItemPriceDataOptions
                            {
                                UnitAmount = (long)(subscription.Price * 100), // Convert to cents
                                Currency = "php", // Philippine Peso
                                ProductData = new SessionLineItemPriceDataProductDataOptions
                                {
                                    Name = subscription.Name,
                                    Description = subscription.Description,
                                }
                            },
                            Quantity = 1
                        }
                    },
                    Mode = "payment",
                    SuccessUrl = successUrl,
                    CancelUrl = cancelUrl,
                    Metadata = new Dictionary<string, string>
                    {
                        { "subscription_id", subscriptionId.ToString() },
                        { "user_id", userId }
                    }
                };

                var service = new SessionService();
                var session = await service.CreateAsync(options);

                return session.Url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Stripe checkout session");
                throw;
            }
        }
    }
}

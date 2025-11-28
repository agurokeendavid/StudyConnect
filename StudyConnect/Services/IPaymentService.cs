namespace StudyConnect.Services
{
    public interface IPaymentService
    {
        Task<string> CreateCheckoutSessionAsync(int subscriptionId, string userId, string successUrl, string cancelUrl);
    }
}

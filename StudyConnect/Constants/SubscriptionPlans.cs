namespace StudyConnect.Constants
{
    public static class SubscriptionPlans
    {
        public const string FreeTrial = "Free Trial";
        public const string Premium = "Premium";

        public static class Limits
        {
            public const int FreeTrialFileUploads = 5;
            public const int FreeTrialDurationInHours = 4;
            public const int PremiumDurationInDays = 30;
            public const decimal PremiumPrice = 500;
        }
    }
}

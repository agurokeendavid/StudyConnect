using StudyConnect.Services;

namespace StudyConnect.BackgroundServices
{
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly ILogger<NotificationBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Check every 1 hours

        public NotificationBackgroundService(
            ILogger<NotificationBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Notification Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessUpcomingEventNotifications();
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Notification Background Service");
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Wait 5 minutes before retrying
                }
            }

            _logger.LogInformation("Notification Background Service is stopping.");
        }

        private async Task ProcessUpcomingEventNotifications()
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                _logger.LogInformation("Processing upcoming event notifications at {Time}", DateTime.Now);
                await notificationService.CreateUpcomingEventNotificationsAsync();
                _logger.LogInformation("Completed processing upcoming event notifications");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing upcoming event notifications");
            }
        }
    }
}

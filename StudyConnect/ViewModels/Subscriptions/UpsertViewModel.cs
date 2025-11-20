using System.ComponentModel.DataAnnotations;

namespace StudyConnect.ViewModels.Subscriptions
{
    public class UpsertViewModel
    {
        public int? Id { get; set; }

        [Required(ErrorMessage = "Subscription name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required")]
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Price is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Price must be a positive value")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Duration is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Duration must be at least 1 day")]
        public int DurationInDays { get; set; }

        [Required(ErrorMessage = "Max file uploads is required")]
        [Range(0, int.MaxValue, ErrorMessage = "Max file uploads must be a positive value")]
        public int MaxFileUploads { get; set; }

        public bool HasUnlimitedAccess { get; set; }

        public bool IsActive { get; set; } = true;
    }
}

using System.ComponentModel.DataAnnotations;

namespace StudyConnect.ViewModels.Ads
{
    public class UpsertViewModel
    {
        public int? Id { get; set; }

        [Required]
        [Display(Name = "Title")]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Display(Name = "Description")]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Display(Name = "Image URL")]
        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        [Display(Name = "Link URL")]
        [MaxLength(500)]
        public string? LinkUrl { get; set; }

        [Required]
        [Display(Name = "Start Date")]
        public DateTime? StartDate { get; set; }

        [Required]
        [Display(Name = "End Date")]
        public DateTime? EndDate { get; set; }

        [Required]
        [Display(Name = "Position")]
        [MaxLength(50)]
        public string Position { get; set; } = "Top";

        [Display(Name = "Is Active")]
        public bool IsActive { get; set; } = true;
    }
}

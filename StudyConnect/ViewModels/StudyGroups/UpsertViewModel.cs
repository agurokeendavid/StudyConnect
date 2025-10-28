using System.ComponentModel.DataAnnotations;

namespace StudyConnect.ViewModels.StudyGroups
{
    public class UpsertViewModel
    {
        public int? Id { get; set; }

        [Required]
        [Display(Name = "Group Name")]
        public string Name { get; set; }

        [Display(Name = "Description")]
        public string? Description { get; set; }

        [Display(Name = "Maximum Members")]
        public int? MaximumNumbers { get; set; }

        [Required]
        [Display(Name = "Privacy")]
        public string Privacy { get; set; }

        [Required]
        [Display(Name = "Category")]
        public int CategoryId { get; set; }
    }
}

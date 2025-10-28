using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroup : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required] public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? MaximumNumbers { get; set; }

        [Required] public string Privacy { get; set; } = string.Empty;

        [Required]
        // Relationship to StudyGroupCategory
        public int CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public StudyGroupCategory Category { get; set; }
    }
}

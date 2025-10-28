using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Models
{
    public class StudyGroupCategory : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required] 
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }

        // Navigation property for the one-to-many relationship
        public ICollection<StudyGroup> StudyGroups { get; set; } = new List<StudyGroup>();
    }
}

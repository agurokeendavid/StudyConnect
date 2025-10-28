using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyConnect.Models
{
    public class StudyGroupResource : BaseModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StudyGroupId { get; set; }

[ForeignKey(nameof(StudyGroupId))]
    public StudyGroup StudyGroup { get; set; }

   [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(500)]
 public string FilePath { get; set; } = string.Empty;

        [Required]
      [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
      public string FileType { get; set; } = string.Empty; // e.g., "application/pdf", "image/jpeg"

        [Required]
        [MaxLength(50)]
        public string FileExtension { get; set; } = string.Empty; // e.g., ".pdf", ".docx"

 public long FileSize { get; set; } // Size in bytes

        [Required]
        public string UploadedByUserId { get; set; } = string.Empty;

        [ForeignKey(nameof(UploadedByUserId))]
 public ApplicationUser UploadedByUser { get; set; }

        public int DownloadCount { get; set; } = 0;
  }
}

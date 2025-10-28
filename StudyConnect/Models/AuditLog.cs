using System.ComponentModel.DataAnnotations;

namespace StudyConnect.Models;

public class AuditLog
{
    [Key]
    public int Id { get; set; }
    
    public string? UserId { get; set; }
    
    public string? UserName { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;
  
    [MaxLength(200)]
    public string? EntityName { get; set; }
    
    public string? EntityId { get; set; }
    
    public string? OldValues { get; set; }
    
    public string? NewValues { get; set; }
    
    [MaxLength(200)]
    public string? IpAddress { get; set; }
  
    [MaxLength(500)]
    public string? UserAgent { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public string? AdditionalInfo { get; set; }
}

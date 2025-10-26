namespace StudyConnect.Models.Contracts;

public interface IBaseModel
{
    public string CreatedBy { get; set; }
    public string CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string ModifiedBy { get; set; }
    public string ModifiedByName { get; set; }
    public DateTime ModifiedAt { get; set; }
    public string? DeletedBy { get; set; }
    public string? DeletedByName { get; set; }
    public DateTime? DeletedAt { get; set; }
}
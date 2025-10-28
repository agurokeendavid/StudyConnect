namespace StudyConnect.Models;

public static class StudyGroupRoles
{
    public const string Owner = "Owner";
    public const string Admin = "Admin";
    public const string Member = "Member";
    
    public static readonly string[] All = new[] { Owner, Admin, Member };
}

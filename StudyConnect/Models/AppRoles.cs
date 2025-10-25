namespace StudyConnect.Models;

public static class AppRoles
{
    public const string Admin   = "Admin";
    public const string Student = "Student";
    public static readonly string[] All = new[] { Admin, Student };
}
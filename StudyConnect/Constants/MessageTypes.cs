namespace StudyConnect.Constants;

public static class MessageTypes
{
    // Keep byte constants for backward compatibility if needed
    public const byte Failed = 0;
    public const byte Success = 1;
    public const byte Question = 2;
        
    // Add string constants for consistent frontend/backend usage
    public const string FailedString = "Failed";
    public const string SuccessString = "Success";
    public const string QuestionString = "Question";
    public const string ErrorString = "Error";
    public const string WarningString = "Warning";
    public const string InfoString = "Info";
}
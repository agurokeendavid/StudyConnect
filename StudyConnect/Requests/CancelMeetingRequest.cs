namespace StudyConnect.Requests
{
    public class CancelMeetingRequest
    {
        public int MeetingId { get; set; }
        public string? CancellationReason { get; set; }
    }
}

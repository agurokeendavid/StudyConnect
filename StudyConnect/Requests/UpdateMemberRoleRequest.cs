namespace StudyConnect.Requests
{
    public class UpdateMemberRoleRequest
    {
        public int MemberId { get; set; }
        public string NewRole { get; set; }
    }
}

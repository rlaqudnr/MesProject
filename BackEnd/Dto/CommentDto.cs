namespace MesProject.Dto
{
    public class CommentDto
    {
        public int? CommentId { get; set; }   // 댓글 번호
        public int? PostNo { get; set; }      // 게시글 번호
        public string UserId { get; set; }   // 사용자 ID
        public string? UserName { get; set; } // 사용자 이름 (조인용)
        public string? Content { get; set; }  // 내용
        public DateTime? RegDate { get; set; }



    }
}

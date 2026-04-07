namespace MesProject.Dto
{
    public class BoardDto
    {

        public int PostNo { get; set; }        // 글 번호 (자동증가)
        public string? UserId { get; set; }    // 작성자 아이디 (외래키)
        public string? UserName { get; set; }  // 작성자 이름 (표시용)
        public string? Type { get; set; }      // 구분 (NOTICE, ISSUE 등)
        public string? Title { get; set; }     // 제목
        public string? Content { get; set; }   // 내용
        public DateTime RegDate { get; set; }  // 작성일



    }
}
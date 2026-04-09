namespace MesProject.Dto
{
    public class PdaJobDto
    {
        //PDA작업리스트
        public string JobId { get; set; }       // 작업지시번호 (WO-...)
        public string SoId { get; set; }        // 수주번호 (SO-29) <- 사용자님 강조 사항
        public string Customer { get; set; }    // 거래처명 (JOIN으로 가져옴)
        public string ModelId { get; set; }     // 모델코드
        public int BatchQty { get; set; }       // 지시수량
        public string Status { get; set; }      // 현재상태 (WAIT, RUN)






    }
}

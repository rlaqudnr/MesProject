namespace MesProject.Dto
{
    public class DefectStockDto
    {
        //불량리스트
        public int DefectId { get; set; }
        public string JobId { get; set; }
        public string ModelId { get; set; }
        public int Qty { get; set; }
        public string Reason { get; set; }
        public DateTime RegDate { get; set; }


    }
}

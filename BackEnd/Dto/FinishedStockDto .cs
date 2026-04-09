namespace MesProject.Dto
{
    public class FinishedStockDto
    {

        //생산품 창고
        public string LotId { get; set; }
        public string JobId { get; set; }
        public string ModelId { get; set; }
        public int Qty { get; set; }
        public DateTime InDate { get; set; }



    }
}

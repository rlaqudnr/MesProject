namespace MesProject.Dto
{
    public class InventoryViewDto
    {
        public string PartId { get; set; }      // 부품 ID (Part_Mst)
        public string Category { get; set; }    // 분류 (Part_Mst)
        public int StockQty { get; set; }       // 현재고 (My_Inventory)
        public string Models { get; set; }      // 이 부품을 사용하는 차종 리스트 (BOM_Mst에서 취합)




    }
}

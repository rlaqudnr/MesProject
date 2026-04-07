using System.ComponentModel.DataAnnotations;

namespace MesProject.Dto
{
    public class OrderCreateRequest
    {

        //수주등록

        [Required]  public string OrderId { get; set; }
        [Required] public string Customer { get; set; }
        [Required] public string ModelId { get; set; }
        [Range(1, 1000)] public int Qty { get; set; }



         
         

    }
}

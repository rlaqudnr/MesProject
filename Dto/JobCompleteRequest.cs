namespace MesProject.Dto
{
    public class JobCompleteRequest
    {

        //생산실패 OR 성공
        public string JobId { get; set; }
        public string Result { get; set; } // "PASS" 또는 "FAIL"




    }
}

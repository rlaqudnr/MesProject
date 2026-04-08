using Dapper;
using MesProject.Dto;
using Microsoft.Data.SqlClient;
namespace MesProject.Dao
{
    public class NexMesRepository : MesRepository


    {
        private readonly string _connStr;

        //데이터베이스 주소 받아오기
        public NexMesRepository(IConfiguration config)
        {
            _connStr = config.GetConnectionString("DefaultConnection");
        }





        //PDA지시 리스트 
        public async Task<IEnumerable<PdaJobDto>> GetPdaJobListAsync()
        {
            using (var conn = new SqlConnection(_connStr))
            {
                // 지시(J)와 수주(O)를 엮어서 수주번호와 거래처명을 가져오는 게 포인트!
                const string sql = @"
                    SELECT 
                        J.JobID, 
                        J.SO_ID AS SoId, 
                        O.Customer, 
                        J.ModelID AS ModelId, 
                        J.BatchQty, 
                        J.Status
                    FROM T_PRODUCTION_JOB J
                    INNER JOIN T_SALES_ORDER O ON J.SO_ID = O.SO_ID
                    WHERE J.Status IN ('WAIT', 'RUN')
                    ORDER BY J.CreatedAt DESC";

                return await conn.QueryAsync<PdaJobDto>(sql);
            }
        }



        // [핵심] 수주를 넣으면 자동으로     지시번호(JobId)를 따서 두 테이블에 동시에 넣음
        public async Task<string> RegisterOrderWithJobAsync(OrderCreateRequest dto)
        {
            using (var conn = new SqlConnection(_connStr))
            {
                await conn.OpenAsync();
                using (var trans = conn.BeginTransaction())
                {
                    try
                    {
                        // 1. 수주 테이블(T_SALES_ORDER) 입력
                        const string sqlOrder = @"
                            INSERT INTO T_SALES_ORDER (SO_ID, Customer, ModelID, OrderQty, PlannedQty, Status, OrderDate)
                            VALUES (@OrderId, @Customer, @ModelId, @Qty, @Qty, 'OPEN', GETDATE())";
                        await conn.ExecuteAsync(sqlOrder, dto, transaction: trans);

                        // 2. 작업 지시 번호(JobID) 자동 생성 (시스템 채번)
                        string jobId = string.Format("WO-{0}-{1}",
                                        DateTime.Now.ToString("yyyyMMdd"),
                                        Guid.NewGuid().ToString().Substring(0, 4).ToUpper());

                        // 3. 지시 테이블(T_PRODUCTION_JOB) 입력
                        const string sqlJob = @"
                            INSERT INTO T_PRODUCTION_JOB (JobID, SO_ID, ModelID, BatchQty, Status, CreatedAt)
                            VALUES (@JobId, @OrderId, @ModelId, @Qty, 'WAIT', GETDATE())";

                        await conn.ExecuteAsync(sqlJob, new
                        {
                            JobId = jobId,
                            OrderId = dto.OrderId,
                            ModelId = dto.ModelId,
                            Qty = dto.Qty
                        }, transaction: trans);

                        trans.Commit(); // 둘 다 잘 됐으면 확정
                        return jobId;
                    }
                    catch (Exception ex)
                    {
                        trans.Rollback(); // 하나라도 에러 나면 취소
                        throw new Exception("수주 등록 실패: " + ex.Message);
                    }
                }
            }
        }

        //대기목록조회
        public Task<IEnumerable<dynamic>> GetPdaJobsAsync()
        {
            throw new NotImplementedException();
        }

        //불량리스트
        public async Task<IEnumerable<DefectStockDto>> GetDefectStockAsync()
        {
            using var conn = new SqlConnection(_connStr);
            return await conn.QueryAsync<DefectStockDto>("SELECT * FROM T_STOCK_DEFECT ORDER BY RegDate DESC");


        }

        //생산품창고
        public async Task<IEnumerable<FinishedStockDto>> GetFinishedStockAsync()
        {
            using var conn = new SqlConnection(_connStr);
            return await conn.QueryAsync<FinishedStockDto>("SELECT * FROM T_STOCK_FINISHED ORDER BY InDate DESC");


        }


        //생산 실패 OR 성공
        public async Task<bool> TransferToWarehouseAsync(JobCompleteRequest dto)

        {
            using var conn = new SqlConnection(_connStr);
            await conn.OpenAsync();
            using var trans = conn.BeginTransaction();

            try
            {
                // 1. 현재 작업 지시 정보 조회 (JobID, ModelID, BatchQty)
                var job = await conn.QueryFirstOrDefaultAsync<dynamic>(

                    "SELECT JobID, ModelID, BatchQty FROM T_PRODUCTION_JOB WHERE JobID = @JobId",

                    new { JobId = dto.JobId }, trans);

                if (job == null) throw new Exception("지시 정보를 찾을 수 없습니다.");

                // 2. 지시 상태 업데이트 (PASS -> DONE / FAIL -> FAIL)

                string finalStatus = (dto.Result == "PASS") ? "DONE" : "FAIL";

                await conn.ExecuteAsync(

                    "UPDATE T_PRODUCTION_JOB SET Status = @finalStatus WHERE JobID = @JobId",

                    new { finalStatus, JobId = dto.JobId }, trans);

                // 3. 분기 로직 (성공 vs 실패)



                if (dto.Result == "PASS")

                {

                    //  완성차 창고 입고 

                    string lotId = $"LOT-{DateTime.Now:yyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

                    

                    var finishedData = new FinishedStockDto

                    {

                        LotId = lotId,

                        JobId = (string)job.JobID,

                        ModelId = (string)job.ModelID,

                        Qty = (int)job.BatchQty

                    };

                    const string sqlPass = @"

         INSERT INTO T_STOCK_FINISHED (LotID, JobID, ModelID, Qty, InDate, IsShipped)

         VALUES (@LotId, @JobId, @ModelId, @Qty, GETDATE(), 0)";

                    

                    await conn.ExecuteAsync(sqlPass, finishedData, trans);

                    // [Step 3-2] ★ Backflush: BOM 기반 자재 자동 차감

                    const string sqlBom = "SELECT PartID, RequiredQty FROM Bom_Mst WHERE ModelID = @ModelID";

                    var bomItems = await conn.QueryAsync<dynamic>(sqlBom, new { ModelID = (string)job.ModelID }, trans);


                    foreach (var item in bomItems)

                    {

                        try
                        {
                            await conn.ExecuteAsync(@" UPDATE Part_Mst 
      
                                                SET StockQty = StockQty - (@RequiredQty * @BatchQty)

                                                WHERE PartID = @PartID",

                            new
                            {

                                RequiredQty = (int)item.RequiredQty,

                                BatchQty = (int)job.BatchQty,

                                PartID = (string)item.PartID

                            }, trans);


                        }
                        catch (Exception ex)
                        {

                            return StatusCode(500, new { Message = ex.Message });

                        }
                    }

                }

                else

                {

                    // [Step 3-3] 불량 창고 입고

                    const string sqlFail = @"

         INSERT INTO T_STOCK_DEFECT (JobID, ModelID, Qty, Reason, RegDate)

         VALUES (@JobId, @ModelId, @Qty, 'PDA MANUAL FAIL', GETDATE())";

                    await conn.ExecuteAsync(sqlFail, new

                    {

                        JobId = (string)job.JobID,

                        ModelId = (string)job.ModelID,

                        Qty = (int)job.BatchQty

                    }, trans);

                }

                // 4. 시스템 로그 기록

                await conn.ExecuteAsync(

                    "INSERT INTO T_SYSTEM_LOG (LogType, Message, RegDate) VALUES (@type, @msg, GETDATE())",

                    new { type = dto.Result, msg = $"지시 {dto.JobId} 창고 이동 완료 ({dto.Result})" }, trans);

                

                trans.Commit();

                return true;

            }

            catch (Exception ex)

            {

                // 에러 나면 싹 다 취소 

                if (trans.Connection != null) trans.Rollback();

                

                throw new Exception(ex.Message);

            }

        }

        private bool StatusCode(int v, object value)
        {
            throw new NotImplementedException();
        }

        //부품창고조회
        public async Task<IEnumerable<InventoryViewDto>> GetInventoryWithBomAsync()
        {

            using var conn = new SqlConnection(_connStr);
            // STRING_AGG를 써서 해당 부품이 들어가는 모델들을 한 칸에 콤마로 찍어옵니다. 
            const string sql = @"
             SELECT M.partId, M.category, 

             ISNULL(M.stockQty, 0) AS StockQty,
   
             B.ModelId + '(' + CAST(B.requiredQty AS VARCHAR) + '개)' AS Models

                       FROM Part_Mst M

        INNER JOIN BOM_Mst B ON M.partId = B.partId

          ORDER BY B.ModelId, M.partId";

            return await conn.QueryAsync<InventoryViewDto>(sql);
        }

        //부품입고
        public async Task<bool> ReceiveStockAsync(InboundRequest dto)
        {
            using var conn = new SqlConnection(_connStr);
            // My_Inventory에 데이터가 있으면 Update, 없으면 Insert 하는 로직 
            const string sql = @"
             
                UPDATE Part_Mst
                SET stockQty = ISNULL(stockQty, 0) + @Qty
                   
                WHERE partId = @PartId";
            return (await conn.ExecuteAsync(sql, dto)) > 0;
        }



        public Task GetFinishedStockAsync(JobCompleteRequest dto)
        {
            throw new NotImplementedException();
        }



        //글 불러오기
        public async Task<IEnumerable<BoardDto>> GetBoardListAsync()

        {

            using var conn = new SqlConnection(_connStr);
            const string sql = "SELECT * FROM T_BOARD ORDER BY RegDate DESC";
            return await conn.QueryAsync<BoardDto>(sql);


        }
        // 글 작성
        public async Task<bool> CreateBoardAsync(BoardDto dto)
        {
            using var conn = new SqlConnection(_connStr);
            const string sql = @"
                INSERT INTO T_BOARD (UserId, UserName, Type, Title, Content)
                VALUES (@UserId, @UserName, @Type, @Title, @Content)";

            return (await conn.ExecuteAsync(sql, dto)) > 0;


        }
        //회원가입
        public async Task<bool> RegisterUserAsync(UserDto dto)
        {

            using var conn = new SqlConnection(_connStr);
            const string sql = @"
        INSERT INTO T_USER (UserId, Password, UserName, Role)
        VALUES (@UserId, @Password, @UserName, 'OPERATOR')";
            try
            {
                return (await conn.ExecuteAsync(sql, dto)) > 0;
            }
            catch
            {
                throw new Exception("이미 존재하는 아이디입니다. ");
            }
        }
        //로그인
        public async Task<UserDto> LoginAsync(LoginRequest dto)
        {

            using var conn = new SqlConnection(_connStr);
            const string sql = "SELECT UserId, UserName, Role FROM T_USER WHERE UserId = @UserId AND Password = @Password";
            return await conn.QueryFirstOrDefaultAsync<UserDto>(sql, dto);



        }

        //글 삭제
        public async Task<bool> DeletePostAsync(int postNo, string userId)
        {

            using var conn = new SqlConnection(_connStr);
            // PostNo만 체크하는 게 아니라 UserId까지 체크해서 남의 글 삭제 방지! 
            const string sql = "DELETE FROM T_BOARD WHERE PostNo = @PostNo AND UserId = @UserId";

            return (await conn.ExecuteAsync(sql, new { PostNo = postNo, UserId = userId })) > 0;


        }

        //회원탈퇴
        public async Task<bool> DeleteUser(LoginRequest dto)
        {

            using var conn = new SqlConnection(_connStr);
            // PostNo만 체크하는 게 아니라 UserId까지 체크해서 남의 글 삭제 방지! 
            const string sql = "DELETE FROM T_USER WHERE UserId = @UserId AND Password = @Password";

            return (await conn.ExecuteAsync(sql, dto)) > 0;


        }
    }

}


using MesProject.Dao;
using MesProject.Dto;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MesProject.Controllers
{

    [Route("api/mes")]
    [ApiController]
    public class MesController(MesRepository repo) : ControllerBase
    {
        private readonly MesRepository _repo = repo;

        // 사무동에서 수주 등록 시 호출
        [HttpPost("register")]
        public async Task<IActionResult> RegisterOrder([FromBody] OrderCreateRequest dto)
        {
            try
            {
                var jobId = await _repo.RegisterOrderWithJobAsync(dto);
                return Ok(new { success = true, jobId = jobId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }


        // 현장 PDA에서 작업 목록
        [HttpGet("pda-list")]
        public async Task<IActionResult> GetPdaList()
        {
            try
            {
                var list = await _repo.GetPdaJobListAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {

                return StatusCode(500, new { message = ex.Message });
            }
        }

        // 1. Repository의 창고 이동 트랜잭션 호출 (PASS면 그냥창고, FAIL이면 불량창고)
        [HttpPost("complete")]
        public async Task<IActionResult> CompleteProduction([FromBody] JobCompleteRequest dto)
        {
            try
            {

                var success = await _repo.TransferToWarehouseAsync(dto);

                if (success)
                {
                    return Ok(new { success = true, message = $"{dto.Result} 처리 및 창고 이동 완료" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "처리 중 오류가 발생했습니다." });
                }
            }
            catch (Exception ex)
            {
                // 예상치 못한 서버 에러 발생 시
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// [사무동 - 창고] 불량 격리 재고 목록 조회
        /// 리액트: fetch(`${API_BASE_URL}/defect-list`) 에 대응
        /// </summary>
        [HttpGet("finished-list")]
        public async Task<IActionResult> GetFinishedList()
        {
            try
            {
                var list = await _repo.GetFinishedStockAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }


        [HttpGet("defect-list")]
        public async Task<IActionResult> GetDefectList()
        {
            try
            {
                var list = await _repo.GetDefectStockAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }

        }



        //부품재고
        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventoryList()
        {
            try
            {
                var list = await _repo.GetInventoryWithBomAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                // DB 쿼리나 DTO 매핑에서 문제 생기면 여기로 옵니다.
                return StatusCode(500, new { message = "DB 조회 에러: " + ex.Message });
            }
        }

        // 🔵 2. 부품 입고 처리
        [HttpPost("inventory/receive")]
        public async Task<IActionResult> Receive([FromBody] InboundRequest dto)
        {
            // 💡 [FromBody]가 있어야 리액트가 보낸 JSON을 읽을 수 있습니다.
            if (dto == null || dto.Qty <= 0)
                return BadRequest(new { message = "수량을 1개 이상 입력하세요." });

            try
            {
                var success = await _repo.ReceiveStockAsync(dto);
                return Ok(new { success });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "입고 처리 중 서버 오류: " + ex.Message });
            }
        }

        //글 불러오기
        [HttpGet("board")]
        public async Task<IActionResult> GetBoardList()
        {
            try
            {
                var list = await _repo.GetBoardListAsync();
                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
        //글 작성
        [HttpPost("board")]
        public async Task<IActionResult> CreateBoard([FromBody] BoardDto dto)
        {
            try
            {
                var success = await _repo.CreateBoardAsync(dto);
                return Ok(new { success });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 3. 글 삭제: DELETE /api/board/{id}?userId={userId}
        [HttpDelete("{id}")]

        public async Task<IActionResult> Delete(int id, [FromQuery] string UserId)
        {
            try
            {
                var success = await _repo.DeletePostAsync(id, UserId);
                if (success) return Ok(new { message = "삭제 완료! " });
                return BadRequest(new { message = "삭제 실패 (본인 글이 아닐 수 있음 )" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] UserDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                Console.WriteLine($"❌ 모델 바인딩 실패: {errors}");
                return BadRequest(new { message = "데이터 형식이 맞지 않습니다. ", details = errors });
            }
            Console.WriteLine($"✅ [Signup Request Received] ID: {dto.UserId}, Name: {dto.UserName}");

            try
            {



                // 형님이 만든 RegisterUserAsync 호출 
                var success = await _repo.RegisterUserAsync(dto);

                if (success)
                {


                    return Ok(new { message = "회원가입 성공! '슈웃' 하십쇼!" });
                }

                return BadRequest(new { message = "회원가입 실패 (알 수 없는 오류) " });
            }
            catch (Exception ex)
            {
                // DAO에서 throw한 "이미 존재하는 아이디입니다. 
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2. 로그인 API 

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest dto)
        {
            try
            {




                var user = await _repo.LoginAsync(dto);

                if (user != null)
                {


                    return Ok(user);
                }

                // 로그인 실패 (ID/PW 불일치) 
                return Unauthorized(new { message = "아이디 또는 비밀번호가 틀렸습니다. ㅋ" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "서버 내부 오류: " + ex.Message });
            }
        }

        // 2. 아이디삭제 API 

        [HttpPost("UserDelete")]
        public async Task<IActionResult> DeleteUser([FromBody] LoginRequest dto)
        {
            try
            {

                // 1. 먼저 이 유저가 맞는지 로그인 로직으로 확인 ㅋ
                var user = await _repo.LoginAsync(dto);

                if (user != null)
                {
                    // 2. 인증 성공! 이제 진짜 DB에서 삭제 시전 ㅋ
                    bool isDeleted = await _repo.DeleteUser(dto);

                    if (isDeleted)
                    {
                        return Ok(new { message = "탈퇴 처리가 완료되었습니다. 슈웃! ㅋ" });
                    }
                    return BadRequest(new { message = "DB 삭제 중 오류가 발생했습니다. ㅋ" });
                }

                // 3. 인증 실패 (ID/PW 불일치) ㅋ
                return Unauthorized(new { message = "아이디 또는 비밀번호가 틀렸습니다. ㅋ" });
            }
            catch (Exception ex)
            {
                // 4. 서버 터졌을 때 ㅋ
                return StatusCode(500, new { message = "서버 내부 오류: " + ex.Message });
            }
        }

    }
}

















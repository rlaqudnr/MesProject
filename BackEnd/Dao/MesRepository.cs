using MesProject.Dto;
using Microsoft.AspNetCore.Mvc;

namespace MesProject.Dao
{
    public interface MesRepository
    {


        Task<IEnumerable<InventoryViewDto>> GetInventoryWithBomAsync();
        Task<bool> ReceiveStockAsync(InboundRequest dto);


        Task<string> RegisterOrderWithJobAsync(OrderCreateRequest dto);
       Task<IEnumerable<PdaJobDto>> GetPdaJobListAsync();

        Task<bool> TransferToWarehouseAsync(JobCompleteRequest dto);


        Task<IEnumerable<FinishedStockDto>> GetFinishedStockAsync();
        Task<IEnumerable<DefectStockDto>> GetDefectStockAsync();



        Task<IEnumerable<dynamic>> GetPdaJobsAsync();
        Task GetFinishedStockAsync(JobCompleteRequest dto);

        Task<IEnumerable<BoardDto>> GetBoardListAsync();

        Task<bool> DeletePostAsync(int postNo, string userId);
        Task<bool> CreateBoardAsync(BoardDto dto);

         Task<bool> RegisterUserAsync(UserDto dto);

        Task<UserDto> LoginAsync(LoginRequest dto);

        Task<bool>DeleteUser(LoginRequest dto);


        Task<IEnumerable<CommentDto>> GetComments(int postNo);


        Task<bool> AddComment(int postNo,CommentDto dto);


        Task<bool> DeleteCommnets(int postNo,  CommentDto dto);

        Task<bool> AlterComment(int postNo, CommentDto dto);

        Task<bool> DeleteBoard(int postNo, BoardDto dto);

        Task<bool> AlterBoard(int postNo, BoardDto dto);






    }
}

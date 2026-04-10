using MesProject.Dao;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// 1. 서비스 등록 영역 (builder.Build() 이전에 작성)
// ============================================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// [CORS 설정] 리액트 포트 허용
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", 
                "http://localhost:5174", 
                "http://localhost:5188", 
                "http://localhost:3000",

                "http://34.64.39.123",      // 추가: GCP 서버 외부 IP (HTTP용)
            "http://34.64.39.123:3000", // 리액트가 3000번 포트를 쓴다면 이것도 추가
            "http://34.64.39.123:5173"

              //"http://서버IP"


              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});




/**
 * [에러 해결 핵심] 
 * 에러 원인: AddScoped<인터페이스>()만 하면 인스턴스화가 불가능합니다.
 * 해결 방법: AddScoped<인터페이스, 실제클래스>() 형태로 등록해야 합니다.
 * (만약 인터페이스 없이 클래스만 있다면, 해당 클래스가 'abstract'가 아닌지 확인하세요.)
 */
// 사용자님의 파일명에 맞춰 아래 중 하나를 선택해서 사용하세요.
// 예: builder.Services.AddScoped<IMesRepository, MesRepository>(); 
builder.Services.AddScoped<MesRepository, NexMesRepository>(); // MesRepository가 'class'여야 작동합니다.

var app = builder.Build();

// ============================================================
// 2. 미들웨어 설정 영역 (app.Run() 이전에 작성)
// ============================================================


//서버에 올릴때 밑에꺼 주석 
//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "NexMES API V1");
        c.RoutePrefix = "swagger";
    });
//}

app.UseCors("AllowReact");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// ============================================================
// 3. 실행 (파일 맨 마지막에 딱 한 번만!)
// ============================================================

app.Run();
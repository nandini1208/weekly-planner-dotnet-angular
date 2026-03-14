using Microsoft.EntityFrameworkCore;
using WeeklyPlanner.API.Data;
using WeeklyPlanner.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers(options => 
{
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
builder.Services.AddScoped<IWeeklyPlanService, WeeklyPlanService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        var originsString = builder.Configuration["AllowedOrigins"];
        var origins = string.IsNullOrEmpty(originsString) 
            ? new[] { "http://localhost:4200" } 
            : originsString.Split(',', StringSplitOptions.RemoveEmptyEntries);

        policy.WithOrigins(origins)
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Always enable Swagger for easier verification during this deployment phase
app.UseSwagger();
app.UseSwaggerUI();

// Redirect root to swagger
app.MapGet("/", () => Results.Redirect("/swagger"));

app.UseCors("AllowAngular");
app.UseHttpsRedirection();
app.MapControllers();

app.Run();


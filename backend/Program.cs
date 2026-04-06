using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TenderHub.API.Data;
using TenderHub.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is required.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

var scrapedConnectionString = builder.Configuration.GetConnectionString("ScrapedConnection")
    ?? throw new InvalidOperationException("ScrapedConnection is required.");

builder.Services.AddDbContext<ScrapedDbContext>(options =>
    options.UseSqlServer(scrapedConnectionString));

// ── Authentication / JWT ──────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is required.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// ── Application Services ──────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFileService, LocalFileService>();

// ── tenders.go.ke Sync ────────────────────────────────────────────────────────
builder.Services.AddHttpClient("TendersGoKe", client =>
{
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.Timeout = TimeSpan.FromMinutes(2);
});
builder.Services.AddScoped<TendersGoKeSyncService>();
builder.Services.AddHostedService<TendersGoKeBackgroundService>();

// ── Controllers & Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TenderHub Kenya API",
        Version = "v1",
        Description = "Backend API for the TenderHub Kenya bid bond management platform."
    });

    // Allow sending Bearer tokens from Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            []
        }
    });
});

// ── Static Files (uploaded documents) ────────────────────────────────────────
builder.Services.AddDirectoryBrowser();

var app = builder.Build();

// ── Middleware Pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TenderHub Kenya API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();

app.UseCors();

// Serve uploaded files at /files/**
var uploadsPath = Path.Combine(app.Environment.ContentRootPath,
    app.Configuration.GetValue<string>("Storage:LocalPath", "uploads")!);
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/files"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ── Auto-migrate on startup (development only) ────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();

    // Seed a default admin user if none exists
    if (!dbContext.Users.Any(u => u.Role == TenderHub.API.Models.UserRole.Admin))
    {
        dbContext.Users.Add(new TenderHub.API.Models.User
        {
            Email = "admin@tenderhub.local",
            Name = "Admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin1234!"),
            Role = TenderHub.API.Models.UserRole.Admin
        });
        dbContext.SaveChanges();
        Console.WriteLine("Seeded admin user: admin@tenderhub.local / Admin1234!");
    }
}

app.Run();

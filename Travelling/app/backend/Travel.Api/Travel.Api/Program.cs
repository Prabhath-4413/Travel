using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;
using Travel.Api.Middleware;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;
using Newtonsoft.Json.Converters;
using System.Text.Json.Serialization;
using Serilog;
using Serilog.Core;
using Serilog.Events;
using System.ComponentModel.DataAnnotations;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);
}

builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
        .MinimumLevel.Override("System", LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "TravelBooking")
        .WriteTo.File(
            path: Path.Combine("logs", "otp-security-.txt"),
            rollingInterval: RollingInterval.Day,
            outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz}] [{Level:u3}] {Message:lj}{NewLine}{Exception}"
        );
});

// ---------------------------
// Swagger & CORS
// ---------------------------
builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
    options.SerializerSettings.Converters.Add(new StringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(o => o.AddPolicy("Frontend", p => p
    .WithOrigins("http://localhost:5173", "https://localhost:5173")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// ---------------------------
// Dependency Injection
// ---------------------------
builder.Services.AddDbContext<ApplicationDbContext>(o =>
{
    var cs = builder.Configuration.GetConnectionString("DefaultConnection")
             ?? throw new InvalidOperationException("Connection string not found.");

    if (builder.Environment.IsDevelopment())
    {
        // Use SQLite for development
        o.UseSqlite(cs);
    }
    else
    {
        // Use PostgreSQL for production
        o.UseNpgsql(cs);
    }
});

// ---------------------------
// JWT Authentication
// ---------------------------
var jwtKey = builder.Configuration["JWT:Key"] ?? "dev_secret_key_change_me";
var jwtIssuer = builder.Configuration["JWT:Issuer"] ?? "travel-api";
var jwtAudience = builder.Configuration["JWT:Audience"] ?? "travel-client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.NameIdentifier
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["AuthToken"];
            if (!string.IsNullOrEmpty(token))
            {
                context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ---------------------------
// Rate Limiting
// ---------------------------
builder.Services.AddRateLimiter(options =>
{
    const string authPolicy = "auth-limiter";
    
    options.GlobalLimiter ??= PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy(authPolicy, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            }));

    options.OnRejected = (context, _) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        return new ValueTask(context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Rate limit exceeded. Try again later." }));
    };
});

// Email services
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddSingleton<IEmailTemplateBuilder, EmailTemplateBuilder>();

// OTP services
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddSingleton<IOtpRateLimiter, OtpRateLimiter>();

// Booking services
builder.Services.AddScoped<IBookingService, BookingService>();

builder.Services.AddScoped<JwtHelper>();

// Review services
builder.Services.AddScoped<ReviewService>();

// RabbitMQ services
builder.Services.AddSingleton<RabbitMqService>();
builder.Services.AddSingleton<IMessageQueueService>(sp => sp.GetRequiredService<RabbitMqService>());

// Background services
builder.Services.AddHostedService<BookingReminderService>();
builder.Services.AddHostedService<EmailConsumerServiceV2>();
builder.Services.AddHostedService<BookingQueueConsumerService>();
builder.Services.AddHostedService<BookingEmailConsumerService>();
builder.Services.AddHostedService<CancellationEmailConsumerService>();
builder.Services.AddHostedService<RescheduleEmailConsumerService>();

var app = builder.Build();

// ---------------------------
// Middleware
// ---------------------------
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Frontend");
app.UseSwagger();
app.UseSwaggerUI();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ---------------------------
// Database migration + seed admin
// ---------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();

    // Seed admin
    if (!await db.Users.AnyAsync(u => u.Email == "admin@example.com"))
    {
        var admin = new User
        {
            Name = "Admin",
            Email = "admin@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = "admin"
        };
        db.Users.Add(admin);
        await db.SaveChangesAsync();
    }

    // Optional: Seed destinations
    await Seed.Run(db);
}

// ---------------------------
// JWT token generator
// ---------------------------
string CreateJwt(User user)
{
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var claims = new List<Claim>
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim(ClaimTypes.Name, user.Name),
        new Claim(ClaimTypes.Role, user.Role)
    };
    var token = new JwtSecurityToken(
        issuer: jwtIssuer,
        audience: jwtAudience,
        claims: claims,
        expires: DateTime.UtcNow.AddHours(12),
        signingCredentials: creds
    );
    return new JwtSecurityTokenHandler().WriteToken(token);
}

// ---------------------------
// Auth Endpoints
// ---------------------------
app.MapPost("/auth/register", async (ApplicationDbContext db, RegisterDto dto) =>
{
    if (await db.Users.AnyAsync(u => u.Email == dto.Email))
        return Results.Conflict(new { message = "Email already registered" });

    var user = new User
    {
        Name = dto.Name,
        Email = dto.Email,
        Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
        Role = "user"
    };
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { userId = user.UserId });
}).AllowAnonymous()
.RequireRateLimiting("auth-limiter");

app.MapPost("/auth/login", async (ApplicationDbContext db, LoginDto dto, HttpResponse http, ILogger<Program> logger) =>
{
    try
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user is null) return Results.Unauthorized();
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.Password)) return Results.Unauthorized();
        var token = CreateJwt(user);

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddHours(1),
            IsEssential = true,
            Domain = app.Environment.IsProduction() ? "yourdomain.com" : null
        };
        http.Cookies.Append("AuthToken", token, cookieOptions);

        return Results.Ok(new { role = user.Role, userId = user.UserId, name = user.Name, token = token });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Login failed for email {Email}", dto.Email);
        return Results.Unauthorized();
    }
}).AllowAnonymous()
.RequireRateLimiting("auth-limiter");

// Extra Auth Endpoints (cookie session)
// -------------------------------------
app.MapPost("/auth/logout", (HttpResponse http) =>
{
    http.Cookies.Delete("AuthToken");
    return Results.NoContent();
}).RequireAuthorization();

app.MapGet("/auth/me", async (ApplicationDbContext db, ClaimsPrincipal userClaims) =>
{
    var sub = userClaims.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? userClaims.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(sub, out var userId)) return Results.Unauthorized();
    var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
    if (user is null) return Results.Unauthorized();
    return Results.Ok(new { userId = user.UserId, name = user.Name, email = user.Email, role = user.Role });
}).RequireAuthorization();

// ---------------------------
// Destinations Endpoints
// ---------------------------
static async Task<IResult> GetDestinations(ApplicationDbContext db, ILogger<Program> logger, int page = 1, int pageSize = 20)
{
    try
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 100) pageSize = 100;

        var total = await db.Destinations.CountAsync();

        var destinations = await db.Destinations
            .AsNoTracking()
            .OrderBy(d => d.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        logger.LogInformation("Fetched page {Page} with {Count} destinations out of {Total}", page, destinations.Count, total);
        return Results.Ok(new
        {
            data = destinations,
            pagination = new
            {
                page,
                pageSize,
                total,
                pages = (total + pageSize - 1) / pageSize
            }
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to fetch destinations");
        return Results.Problem("Unable to load destinations at this time.", statusCode: StatusCodes.Status500InternalServerError);
    }
}

app.MapGet("/api/v1/destinations", GetDestinations);

app.MapGet("/api/v1/destinations/{id:int}", async (ApplicationDbContext db, int id) =>
{
    var destination = await db.Destinations.AsNoTracking().FirstOrDefaultAsync(x => x.DestinationId == id);
    return destination is not null ? Results.Ok(destination) : Results.NotFound();
});

app.MapPost("/api/v1/destinations", async (ApplicationDbContext db, CreateDestinationDto dto) =>
{
    var d = new Destination
    {
        Name = dto.Name,
        Description = dto.Description,
        Price = dto.Price,
        ImageUrl = dto.ImageUrl,
        Latitude = dto.Latitude,
        Longitude = dto.Longitude
    };
    db.Destinations.Add(d);
    await db.SaveChangesAsync();
    return Results.Ok(d);
}).RequireAuthorization(policy => policy.RequireRole("admin"));

app.MapDelete("/api/v1/destinations/{id:int}", async (ApplicationDbContext db, int id) =>
{
    var d = await db.Destinations.FindAsync(id);
    if (d is null) return Results.NotFound();
    db.Destinations.Remove(d);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization(policy => policy.RequireRole("admin"));

app.MapPatch("/admin/destinations/{id:int}", async (ApplicationDbContext db, int id, UpdateDestinationDto dto) =>
{
    var d = await db.Destinations.FindAsync(id);
    if (d is null) return Results.NotFound();

    if (dto.Name is not null) d.Name = dto.Name;
    if (dto.Description is not null) d.Description = dto.Description;
    if (dto.Price is not null) d.Price = dto.Price.Value;
    if (dto.ImageUrl is not null) d.ImageUrl = dto.ImageUrl;
    if (dto.Latitude is not null) d.Latitude = dto.Latitude;
    if (dto.Longitude is not null) d.Longitude = dto.Longitude;
    if (dto.Country is not null) d.Country = dto.Country;
    if (dto.City is not null) d.City = dto.City;

    await db.SaveChangesAsync();
    return Results.Ok(d);
}).RequireAuthorization(policy => policy.RequireRole("admin"));

app.MapPost("/bookings", async (ApplicationDbContext db, IMessageQueueService messageQueue, BookingRequestDto dto) =>
{
    if (dto.DestinationIds.Length == 0)
    {
        return Results.BadRequest(new { message = "At least one destination must be selected." });
    }

    var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == dto.UserId);
    if (user is null)
    {
        return Results.NotFound(new { message = "User not found." });
    }

    var destinations = await db.Destinations
        .Where(d => dto.DestinationIds.Contains(d.DestinationId))
        .ToListAsync();

    if (destinations.Count != dto.DestinationIds.Length)
    {
        return Results.BadRequest(new { message = "One or more destinations were not found." });
    }

    if (dto.Guests <= 0 || dto.Nights <= 0)
    {
        return Results.BadRequest(new { message = "Guests and nights must be greater than zero." });
    }

    var basePrice = destinations.Sum(d => d.Price);
    var totalPrice = basePrice * dto.Guests * dto.Nights;
    var startDate = dto.StartDate.Kind switch
    {
        DateTimeKind.Unspecified => DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc),
        DateTimeKind.Local => dto.StartDate.ToUniversalTime(),
        _ => dto.StartDate
    };

    var booking = new Booking
    {
        UserId = dto.UserId,
        TotalPrice = totalPrice,
        Guests = dto.Guests,
        Nights = dto.Nights,
        StartDate = startDate,
        BookingDate = DateTime.UtcNow,
        Confirmed = false,
        CancellationStatus = CancellationStatus.None,
        Status = BookingStatus.Active
    };

    foreach (var destinationId in dto.DestinationIds)
    {
        booking.BookingDestinations.Add(new BookingDestination
        {
            DestinationId = destinationId
        });
    }

    db.Bookings.Add(booking);
    await db.SaveChangesAsync();

    var destinationNames = destinations.Select(d => d.Name).ToList();

    return Results.Ok(new
    {
        bookingId = booking.BookingId,
        message = "Booking created successfully. Please verify your email with the OTP sent.",
        total = booking.TotalPrice,
        guests = booking.Guests,
        nights = booking.Nights,
        startDate = booking.StartDate,
        endDate = booking.StartDate.AddDays(booking.Nights),
        destinations = destinationNames
    });
}).RequireAuthorization();

app.MapGet("/bookings/{userId:int}", async (int userId, ApplicationDbContext db, ClaimsPrincipal userClaims, int page = 1, int pageSize = 20) =>
{
    var sub = userClaims.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? userClaims.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(sub, out var authenticatedUserId) || authenticatedUserId != userId)
    {
        return Results.Forbid();
    }

    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 1;
    if (pageSize > 100) pageSize = 100;

    var total = await db.Bookings
        .Where(b => b.UserId == userId)
        .CountAsync();

    var bookings = await db.Bookings
        .Where(b => b.UserId == userId)
        .OrderByDescending(b => b.BookingDate)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(b => new
        {
            bookingId = b.BookingId,
            totalPrice = b.TotalPrice,
            guests = b.Guests,
            nights = b.Nights,
            startDate = b.StartDate,
            bookingDate = b.BookingDate,
            destinations = b.BookingDestinations
                .OrderBy(bd => bd.Destination!.Name)
                .Select(bd => bd.Destination!.Name)
                .ToList(),
            status = b.Status,
            cancellationStatus = b.CancellationStatus,
            latestCancellation = b.TripCancellations
                .OrderByDescending(tc => tc.RequestedAt)
                .Select(tc => new
                {
                    tripCancellationId = tc.TripCancellationId,
                    status = tc.Status,
                    requestedAt = tc.RequestedAt,
                    reviewedAt = tc.ReviewedAt,
                    adminComment = tc.AdminComment,
                    reason = tc.Reason
                })
                .FirstOrDefault()
        })
        .ToListAsync();

    return Results.Ok(new
    {
        data = bookings,
        pagination = new
        {
            page,
            pageSize,
            total,
            pages = (total + pageSize - 1) / pageSize
        }
    });
}).RequireAuthorization();

// ---------------------------
// Shortest path (TSP heuristic)
// ---------------------------
app.MapPost("/shortest-path", (ShortestPathRequestDto dto) =>
{
    if (dto.Points is null || dto.Points.Length < 2) return Results.Ok(new { order = Array.Empty<int>(), distanceKm = 0m });
    var points = dto.Points.ToList();
    var visited = new List<int>();
    int current = 0;
    visited.Add(current);
    while (visited.Count < points.Count)
    {
        var bestIdx = -1;
        decimal bestDist = decimal.MaxValue;
        for (int i = 0; i < points.Count; i++)
        {
            if (visited.Contains(i)) continue;
            var d = Haversine(points[current], points[i]);
            if (d < bestDist)
            {
                bestDist = d;
                bestIdx = i;
            }
        }
        current = bestIdx;
        visited.Add(current);
    }
    decimal total = 0m;
    for (int i = 0; i < visited.Count - 1; i++)
        total += Haversine(points[visited[i]], points[visited[i + 1]]);
    return Results.Ok(new { order = visited, distanceKm = total });
}).AllowAnonymous();

decimal Haversine(Coordinate a, Coordinate b)
{
    const decimal R = 6371m;
    decimal dLat = DegToRad(b.Latitude - a.Latitude);
    decimal dLon = DegToRad(b.Longitude - a.Longitude);
    decimal lat1 = DegToRad(a.Latitude);
    decimal lat2 = DegToRad(b.Latitude);
    decimal sinDLat = (decimal)Math.Sin((double)(dLat / 2));
    decimal sinDLon = (decimal)Math.Sin((double)(dLon / 2));
    decimal h = sinDLat * sinDLat + (decimal)Math.Cos((double)lat1) * (decimal)Math.Cos((double)lat2) * sinDLon * sinDLon;
    decimal c = 2 * (decimal)Math.Atan2(Math.Sqrt((double)h), Math.Sqrt((double)(1 - h)));
    return R * c;
}

decimal DegToRad(decimal deg) => deg * (decimal)Math.PI / 180m;

// ---------------------------
// Review API
// ---------------------------
app.MapPost("/api/reviews", async (ReviewRequestDto dto, ApplicationDbContext db, ReviewService reviewService, ClaimsPrincipal userClaims, ILogger<Program> logger) =>
{
    try
    {
        var authenticatedUserId = int.Parse(userClaims.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        
        if (authenticatedUserId == 0)
        {
            return Results.Unauthorized();
        }
        
        if (authenticatedUserId != dto.UserId)
        {
            logger.LogWarning("User {AuthenticatedUserId} attempted to review on behalf of user {RequestedUserId}", authenticatedUserId, dto.UserId);
            return Results.Forbid();
        }

        if (dto.Rating < 1 || dto.Rating > 5)
        {
            return Results.BadRequest(new { message = "Rating must be between 1 and 5." });
        }

        var review = await reviewService.AddReviewAsync(dto);
        return Results.Ok(new
        {
            message = "Thank you for your review!",
            review = review
        });
    }
    catch (InvalidOperationException ex)
    {
        logger.LogWarning(ex, "Invalid operation while adding review");
        return Results.BadRequest(new { message = "Unable to add review. Please ensure you have booked this destination." });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error adding review");
        return Results.Problem("An error occurred while adding your review. Please try again later.", statusCode: 500);
    }
}).RequireAuthorization();

app.MapGet("/api/reviews/{destinationId:int}", async (int destinationId, ReviewService reviewService, ILogger<Program> logger) =>
{
    try
    {
        var reviews = await reviewService.GetReviewsForDestinationAsync(destinationId);
        return Results.Ok(reviews);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error retrieving reviews for destination {DestinationId}", destinationId);
        return Results.Problem("An error occurred while retrieving reviews. Please try again later.", statusCode: 500);
    }
}).AllowAnonymous();

app.MapGet("/api/reviews/average/{destinationId:int}", async (int destinationId, ReviewService reviewService, ILogger<Program> logger) =>
{
    try
    {
        var average = await reviewService.GetAverageRatingAsync(destinationId);
        return Results.Ok(average);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error retrieving average rating for destination {DestinationId}", destinationId);
        return Results.Problem("An error occurred while retrieving the rating. Please try again later.", statusCode: 500);
    }
}).AllowAnonymous();

// ---------------------------
// Email notifications
// ---------------------------

app.MapPost("/email/send", async (EmailRequestDto request, IConfiguration config) =>
{
    var smtpSettings = config.GetSection("SMTP");
    var host = smtpSettings.GetValue<string>("Host") ?? "";
    var port = smtpSettings.GetValue<int?>("Port") ?? 0;
    var username = smtpSettings.GetValue<string>("Username") ?? "";
    var password = smtpSettings.GetValue<string>("Password") ?? "";
    var fromAddress = smtpSettings.GetValue<string>("From") ?? username;

    if (string.IsNullOrWhiteSpace(host) || port == 0 || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        return Results.BadRequest(new EmailResponseDto(false, "SMTP settings are incomplete. Please check configuration."));

    if (!MailboxAddress.TryParse(request.To, out _))
        return Results.BadRequest(new EmailResponseDto(false, "Invalid recipient email address."));

    var message = new MimeMessage();
    message.From.Add(new MailboxAddress(request.DisplayName ?? fromAddress, fromAddress));
    message.To.Add(MailboxAddress.Parse(request.To));
    message.Subject = request.Subject;
    message.Body = new TextPart("html") { Text = request.Body };

    using var smtpClient = new SmtpClient();
    try
    {
        await smtpClient.ConnectAsync(host, port, SecureSocketOptions.Auto);
        await smtpClient.AuthenticateAsync(username, password);
        await smtpClient.SendAsync(message);
    }
    finally
    {
        await smtpClient.DisconnectAsync(true);
    }

    return Results.Ok(new EmailResponseDto(true, "Email sent successfully."));
}).RequireAuthorization(policy => policy.RequireRole("admin"));

// ---------------------------
// Admin booking summary
// ---------------------------
app.MapGet("/admin/bookings", async (ApplicationDbContext db) =>
{
    var summary = await db.Bookings
        .Where(b => b.CancellationStatus != CancellationStatus.Approved) // Exclude cancelled bookings
        .GroupBy(b => 1)
        .Select(g => new
        {
            TotalBookings = g.Count(),
            TotalRevenue = g.Sum(b => b.TotalPrice),
            AverageBookingValue = g.Average(b => b.TotalPrice)
        })
        .FirstOrDefaultAsync();

    var recentBookings = await db.Bookings
        .Where(b => b.CancellationStatus != CancellationStatus.Approved)
        .Include(b => b.User)
        .Include(b => b.BookingDestinations)
        .ThenInclude(bd => bd.Destination)
        .OrderByDescending(b => b.BookingDate)
        .Take(10)
        .Select(b => new
        {
            b.BookingId,
            UserName = b.User!.Name,
            UserEmail = b.User!.Email,
            b.TotalPrice,
            b.Guests,
            b.Nights,
            b.BookingDate,
            Destinations = b.BookingDestinations.Select(bd => bd.Destination!.Name),
            Status = b.Status,
            CancellationStatus = b.CancellationStatus
        })
        .ToListAsync();

    return Results.Ok(new { summary, recentBookings });
}).RequireAuthorization(policy => policy.RequireRole("admin"));

// ---------------------------
// Trip cancellation moderation (Admin only)
// ---------------------------
app.MapGet("/admin/trip-cancellations/pending", async (ApplicationDbContext db) =>
{
    var pending = await db.TripCancellations
        .Include(tc => tc.Booking)!
            .ThenInclude(b => b!.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
        .Include(tc => tc.User)
        .Where(tc => tc.Status == TripCancellationStatus.Pending)
        .OrderBy(tc => tc.RequestedAt)
        .Select(tc => new TripCancellationSummaryDto
        {
            TripCancellationId = tc.TripCancellationId,
            BookingId = tc.BookingId,
            UserId = tc.UserId,
            UserName = tc.User!.Name,
            UserEmail = tc.User.Email,
            Status = tc.Status,
            BookingCancellationStatus = tc.Booking!.CancellationStatus,
            RequestedAt = tc.RequestedAt,
            Reason = tc.Reason,
            AdminComment = tc.AdminComment,
            ReviewedAt = tc.ReviewedAt,
            TotalPrice = tc.Booking!.TotalPrice,
            Nights = tc.Booking.Nights,
            StartDate = tc.Booking.StartDate,
            Destinations = tc.Booking.BookingDestinations.Select(bd => bd.Destination!.Name)
        })
        .ToListAsync();

    return Results.Ok(pending);
}).RequireAuthorization(policy => policy.RequireRole("admin"));

app.MapPost("/admin/trip-cancellations/{tripCancellationId:int}/approve", async (int tripCancellationId, TripCancellationDecisionDto decisionDto, ApplicationDbContext db, IEmailService emailService, IEmailTemplateBuilder templateBuilder) =>
{
    if (tripCancellationId != decisionDto.TripCancellationId)
    {
        return Results.BadRequest(new { message = "Trip cancellation identifier mismatch." });
    }

    var cancellation = await db.TripCancellations
        .Include(tc => tc.Booking)!
            .ThenInclude(b => b!.User)
        .Include(tc => tc.Booking)!
            .ThenInclude(b => b!.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
        .FirstOrDefaultAsync(tc => tc.TripCancellationId == tripCancellationId);

    if (cancellation is null)
    {
        return Results.NotFound(new { message = "Cancellation request not found." });
    }

    if (cancellation.Status != TripCancellationStatus.Pending)
    {
        return Results.BadRequest(new { message = "Cancellation request already processed." });
    }

    cancellation.Status = TripCancellationStatus.Approved;
    cancellation.ReviewedAt = DateTime.UtcNow;
    cancellation.AdminComment = decisionDto.AdminComment;

    var booking = cancellation.Booking!;
    booking.CancellationStatus = CancellationStatus.Approved;
    booking.Confirmed = false;

    await db.SaveChangesAsync();

    var approvalBody = templateBuilder.BuildCancellationDecisionUserBody(booking, approved: true, decisionDto.AdminComment);
    await emailService.SendAsync(new EmailMessage
    {
        ToEmail = booking.User!.Email,
        ToName = booking.User.Name,
        Subject = $"Trip Cancellation Approved - Booking #{booking.BookingId}",
        Body = approvalBody
    });

    var adminNotification = templateBuilder.BuildCancellationDecisionAdminBody(cancellation, approved: true);
    await emailService.SendAsync(new EmailMessage
    {
        ToEmail = builder.Configuration["AdminNotifications:Email"] ?? "admin@example.com",
        ToName = "Admin Team",
        Subject = $"Trip Cancellation Approved - Request #{cancellation.TripCancellationId}",
        Body = adminNotification
    });

    return Results.Ok(new
    {
        message = "Cancellation approved.",
        cancellationStatus = cancellation.Status,
        bookingCancellationStatus = booking.CancellationStatus,
        reviewedAt = cancellation.ReviewedAt,
        adminComment = cancellation.AdminComment
    });
}).RequireAuthorization(policy => policy.RequireRole("admin"));

app.MapPost("/admin/trip-cancellations/{tripCancellationId:int}/reject", async (int tripCancellationId, TripCancellationDecisionDto decisionDto, ApplicationDbContext db, IEmailService emailService, IEmailTemplateBuilder templateBuilder) =>
{
    if (tripCancellationId != decisionDto.TripCancellationId)
    {
        return Results.BadRequest(new { message = "Trip cancellation identifier mismatch." });
    }

    var cancellation = await db.TripCancellations
        .Include(tc => tc.Booking)!
            .ThenInclude(b => b!.User)
        .Include(tc => tc.Booking)!
            .ThenInclude(b => b!.BookingDestinations)
            .ThenInclude(bd => bd.Destination)
        .FirstOrDefaultAsync(tc => tc.TripCancellationId == tripCancellationId);

    if (cancellation is null)
    {
        return Results.NotFound(new { message = "Cancellation request not found." });
    }

    if (cancellation.Status != TripCancellationStatus.Pending)
    {
        return Results.BadRequest(new { message = "Cancellation request already processed." });
    }

    cancellation.Status = TripCancellationStatus.Rejected;
    cancellation.ReviewedAt = DateTime.UtcNow;
    cancellation.AdminComment = decisionDto.AdminComment;

    var booking = cancellation.Booking!;
    booking.CancellationStatus = CancellationStatus.Rejected;

    await db.SaveChangesAsync();

    var rejectionBody = templateBuilder.BuildCancellationDecisionUserBody(booking, approved: false, decisionDto.AdminComment);
    await emailService.SendAsync(new EmailMessage
    {
        ToEmail = booking.User!.Email,
        ToName = booking.User.Name,
        Subject = $"Trip Cancellation Rejected - Booking #{booking.BookingId}",
        Body = rejectionBody
    });

    return Results.Ok(new
    {
        message = "Cancellation rejected.",
        cancellationStatus = cancellation.Status,
        bookingCancellationStatus = booking.CancellationStatus,
        reviewedAt = cancellation.ReviewedAt,
        adminComment = cancellation.AdminComment
    });
}).RequireAuthorization(policy => policy.RequireRole("admin"));

// ---------------------------
// Test Email Endpoint (Admin only)
// ---------------------------
app.MapPost("/admin/test-email", async (ApplicationDbContext db, ClaimsPrincipal userClaims, ILogger<Program> logger) =>
{
    var sub = userClaims.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? userClaims.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(sub, out var userId)) return Results.Unauthorized();
    
    var user = await db.Users.FindAsync(userId);
    if (user is null) return Results.Unauthorized();

    try
    {
        var smtpHost = builder.Configuration["SMTP:Host"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(builder.Configuration["SMTP:Port"] ?? "587");
        var smtpUser = builder.Configuration["SMTP:Username"] ?? "";
        var smtpPass = builder.Configuration["SMTP:Password"] ?? "";
        var fromEmail = builder.Configuration["SMTP:From"] ?? smtpUser;

        // Validate SMTP configuration
        if (string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass) || 
            smtpUser == "your_email@gmail.com" || smtpPass == "your_gmail_app_password")
        {
            return Results.BadRequest(new { 
                success = false, 
                message = "SMTP is not configured. Please update appsettings.json with your email credentials.",
                details = "See EMAIL_SETUP_GUIDE.md for instructions"
            });
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Travel App", fromEmail));
        message.To.Add(new MailboxAddress(user.Name, user.Email));
        message.Subject = "Test Email - Travel App Configuration";

        var body = $@"
Hello {user.Name},

This is a test email to verify that your SMTP configuration is working correctly.

If you received this email, your email system is properly configured! ✅

Configuration Details:
- SMTP Host: {smtpHost}
- SMTP Port: {smtpPort}
- From Email: {fromEmail}
- To Email: {user.Email}

You can now receive booking confirmation emails.

Best regards,
Travel App Team
";

        message.Body = new TextPart("plain") { Text = body };

        using var client = new MailKit.Net.Smtp.SmtpClient();
        await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(smtpUser, smtpPass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        return Results.Ok(new { 
            success = true, 
            message = $"Test email sent successfully to {user.Email}",
            details = "Check your inbox (and spam folder) for the test email"
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to send test email to {Email}", user.Email);
        return Results.BadRequest(new { 
            success = false, 
            message = "Failed to send test email. Please check your SMTP configuration."
        });
    }
}).RequireAuthorization(policy => policy.RequireRole("admin"));

app.Run();

// ---------------------------
// DTOs / Records
// ---------------------------

public class RegisterDto
{
    [Required(ErrorMessage = "Name is required")]
    [MinLength(2, ErrorMessage = "Name must be at least 2 characters")]
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    public string Password { get; set; } = string.Empty;

    [Compare("Password", ErrorMessage = "Password and confirmation password do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class LoginDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    public string Password { get; set; } = string.Empty;
}

public record CreateDestinationDto(string Name, string? Description, decimal Price, string? ImageUrl, decimal? Latitude, decimal? Longitude);
public record UpdateDestinationDto(string? Name, string? Description, decimal? Price, string? ImageUrl, decimal? Latitude, decimal? Longitude, string? Country, string? City);

public class BookingRequestDto
{
    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "UserId must be greater than 0")]
    public int UserId { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one destination required")]
    [MaxLength(10, ErrorMessage = "Maximum 10 destinations allowed")]
    public int[] DestinationIds { get; set; } = Array.Empty<int>();

    [Range(1, 20, ErrorMessage = "Guests must be between 1 and 20")]
    public int Guests { get; set; }

    [Range(1, 30, ErrorMessage = "Nights must be between 1 and 30")]
    public int Nights { get; set; }

    [DataType(DataType.DateTime)]
    public DateTime StartDate { get; set; }
}

public record ShortestPathRequestDto(Coordinate[] Points);
public record Coordinate(decimal Latitude, decimal Longitude);

public class ReviewRequestDto
{
    [Required]
    public int UserId { get; set; }

    [Required]
    public int DestinationId { get; set; }

    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    [MaxLength(500, ErrorMessage = "Comment cannot exceed 500 characters")]
    public string? Comment { get; set; }
}


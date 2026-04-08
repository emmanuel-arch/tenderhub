using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TenderHub.API.Controllers;

[ApiController]
[Route("api/goke-tenders")]
[AllowAnonymous]
public class GoKeTendersController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    private const string BaseUrl = "https://tenders.go.ke/api";

    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] int page = 1)
    {
        var client = httpClientFactory.CreateClient("GoKe");
        var response = await client.GetAsync($"{BaseUrl}/active-tenders?page={page}");

        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }
}

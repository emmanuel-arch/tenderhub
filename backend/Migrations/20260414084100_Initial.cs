using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TenderHub.API.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tables already exist — database was bootstrapped via EnsureCreated before migrations were introduced.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}

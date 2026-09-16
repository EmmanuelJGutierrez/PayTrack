using Microsoft.AspNetCore.Routing;

namespace PayTrack.Api.Common;

public interface IEndpoint
{
    void MapEndpoint(IEndpointRouteBuilder app);
}

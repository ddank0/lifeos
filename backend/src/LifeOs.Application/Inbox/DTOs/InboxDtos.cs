namespace LifeOs.Application.Inbox.DTOs;

public record QuickNoteDto(
    Guid Id,
    string Content,
    Guid? AreaId,
    string AreaName,
    string AreaSlug,
    string AreaColor,
    string NoteType,
    string? Priority,
    string? TargetDate,
    bool IsProcessed,
    Guid? ProcessedEntityId,
    DateTimeOffset CreatedAt);

public record SaveQuickNoteRequest(
    string Content,
    Guid? AreaId = null,
    string? NoteType = "Note",
    string? Priority = null,
    string? TargetDate = null);

public record ConvertQuickNoteRequest(
    string TargetType,
    Guid? AreaId = null,
    string? Priority = "Medium",
    string? TargetDate = null,
    string? TargetTime = null);

using System.Text.Json;
using LifeOs.Domain.Entities;
using LifeOs.Domain.Enums;

namespace LifeOs.Infrastructure.Persistence.Seeders;

// Provisiona automaticamente as 5 áreas padrão, quadro Kanban e estrutura inicial para um novo usuário
public class UserOnboardingService(LifeOsDbContext dbContext)
{
    public async Task ProvisionInitialWorkspaceAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var areas = new List<Area>
        {
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Trabalho", Slug = "trabalho", Description = "Projetos profissionais, reuniões e entregas", Color = "#a9ccf0", Icon = "briefcase", SortOrder = 1, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Estudo", Slug = "estudo", Description = "Cursos, leituras técnicas e idiomas", Color = "#8bd3c7", Icon = "book-open", SortOrder = 2, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Rotina", Slug = "rotina", Description = "Saúde, treino, bem-estar e hábitos diários", Color = "#c3b1e1", Icon = "flame", SortOrder = 3, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Doméstico", Slug = "domestico", Description = "Organização da casa, compras e manutenção", Color = "#f3c68f", Icon = "home", SortOrder = 4, IsDefault = true },
            new() { Id = Guid.NewGuid(), UserId = userId, Name = "Social", Slug = "social", Description = "Família, amigos, eventos e lazer", Color = "#f2a6c2", Icon = "users", SortOrder = 5, IsDefault = true }
        };

        dbContext.Areas.AddRange(areas);

        var defaultBoard = new Board
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = "Quadro Geral LIFEOS",
            IsDefault = true
        };

        var colTodo = new BoardColumn { Id = Guid.NewGuid(), BoardId = defaultBoard.Id, Name = "A fazer", StatusMapping = TaskItemStatus.Todo, Position = 1 };
        var colDoing = new BoardColumn { Id = Guid.NewGuid(), BoardId = defaultBoard.Id, Name = "Em andamento", StatusMapping = TaskItemStatus.InProgress, Position = 2 };
        var colHold = new BoardColumn { Id = Guid.NewGuid(), BoardId = defaultBoard.Id, Name = "Em espera", StatusMapping = TaskItemStatus.OnHold, Position = 3 };
        var colDone = new BoardColumn { Id = Guid.NewGuid(), BoardId = defaultBoard.Id, Name = "Concluído", StatusMapping = TaskItemStatus.Done, Position = 4 };

        dbContext.Boards.Add(defaultBoard);
        dbContext.BoardColumns.AddRange(colTodo, colDoing, colHold, colDone);

        var workArea = areas[0];
        var studyArea = areas[1];
        var routineArea = areas[2];
        var homeArea = areas[3];
        var socialArea = areas[4];

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var tomorrow = today.AddDays(1);
        var yesterday = today.AddDays(-1);

        var initialTasks = new List<TaskItem>
        {
            // Hoje (7 tarefas - 2 concluídas e 5 pendentes, fiel à img3.jpg)
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = workArea.Id, BoardColumnId = colDone.Id, Title = "Stand up", Priority = TaskPriority.Medium, Status = TaskItemStatus.Done, DueDate = today, CompletedAt = DateTimeOffset.UtcNow, BoardPosition = 1 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = studyArea.Id, BoardColumnId = colTodo.Id, Title = "Aula de inglês", Priority = TaskPriority.High, Status = TaskItemStatus.Todo, DueDate = today, BoardPosition = 2 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = routineArea.Id, BoardColumnId = colDone.Id, Title = "Treino funcional e mobilidade", Priority = TaskPriority.Medium, Status = TaskItemStatus.Done, DueDate = today, CompletedAt = DateTimeOffset.UtcNow, BoardPosition = 3 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = workArea.Id, BoardColumnId = colDoing.Id, Title = "Preparar arquitetura do Projeto LIFEOS", Priority = TaskPriority.Urgent, Status = TaskItemStatus.InProgress, DueDate = today, BoardPosition = 4 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = workArea.Id, BoardColumnId = colTodo.Id, Title = "Refinar Personas e jornadas de usuário", Priority = TaskPriority.High, Status = TaskItemStatus.Todo, DueDate = today, BoardPosition = 5 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = studyArea.Id, BoardColumnId = colTodo.Id, Title = "Ler artigo técnico sobre EF Core e PostgreSQL", Priority = TaskPriority.Medium, Status = TaskItemStatus.Todo, DueDate = today, BoardPosition = 6 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = homeArea.Id, BoardColumnId = colTodo.Id, Title = "Organizar compras da semana", Priority = TaskPriority.Low, Status = TaskItemStatus.Todo, DueDate = today, BoardPosition = 7 },

            // Amanhã (5 tarefas)
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = workArea.Id, BoardColumnId = colTodo.Id, Title = "Stand up", Priority = TaskPriority.Medium, Status = TaskItemStatus.Todo, DueDate = tomorrow, BoardPosition = 8 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = routineArea.Id, BoardColumnId = colTodo.Id, Title = "Treino de força", Priority = TaskPriority.Medium, Status = TaskItemStatus.Todo, DueDate = tomorrow, BoardPosition = 9 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = workArea.Id, BoardColumnId = colTodo.Id, Title = "Reagendar reuniões de sprint", Priority = TaskPriority.High, Status = TaskItemStatus.Todo, DueDate = tomorrow, BoardPosition = 10 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = socialArea.Id, BoardColumnId = colTodo.Id, Title = "Adicionar aniversários ao calendário", Priority = TaskPriority.Low, Status = TaskItemStatus.Todo, DueDate = tomorrow, BoardPosition = 11 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = studyArea.Id, BoardColumnId = colTodo.Id, Title = "Revisar anotações de arquitetura limpa", Priority = TaskPriority.Medium, Status = TaskItemStatus.Todo, DueDate = tomorrow, BoardPosition = 12 },

            // 3 Atrasadas (para o card "3 Pendências / Atrasadas" da coluna esquerda)
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = workArea.Id, BoardColumnId = colHold.Id, Title = "Confirmar escopo da entrega trimestral", Priority = TaskPriority.Urgent, Status = TaskItemStatus.OnHold, DueDate = yesterday, BoardPosition = 13 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = homeArea.Id, BoardColumnId = colTodo.Id, Title = "Agendar revisão do ar-condicionado", Priority = TaskPriority.Medium, Status = TaskItemStatus.Todo, DueDate = yesterday, BoardPosition = 14 },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = socialArea.Id, BoardColumnId = colTodo.Id, Title = "Confirmar reserva do jantar de sexta", Priority = TaskPriority.Low, Status = TaskItemStatus.Todo, DueDate = yesterday, BoardPosition = 15 }
        };

        dbContext.Tasks.AddRange(initialTasks);

        var baseDate = new DateTimeOffset(today.Year, today.Month, today.Day, 0, 0, 0, TimeSpan.Zero);
        var initialEvents = new List<CalendarEvent>
        {
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = workArea.Id,
                Title = "Stand up",
                StartAt = baseDate.AddHours(9),
                EndAt = baseDate.AddHours(9).AddMinutes(30),
                IsHighlighted = true,
                SubItemsJson = JsonSerializer.Serialize(new[] { "Revisar IA", "Apresentar ao cliente", "Ajustar escopo" })
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = workArea.Id,
                Title = "Reunião com desenvolvedores",
                StartAt = baseDate.AddHours(9).AddMinutes(30),
                EndAt = baseDate.AddHours(10).AddMinutes(30),
                IsHighlighted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = studyArea.Id,
                Title = "Aula de inglês & prática",
                StartAt = baseDate.AddHours(12),
                EndAt = baseDate.AddHours(13),
                IsHighlighted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = workArea.Id,
                Title = "Finalizar wireframes para apresentar ao cliente",
                StartAt = baseDate.AddHours(20),
                EndAt = baseDate.AddHours(21),
                IsHighlighted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = routineArea.Id,
                Title = "Treino & revisão noturna",
                StartAt = baseDate.AddHours(21),
                EndAt = baseDate.AddHours(22),
                IsHighlighted = false,
                SubItemsJson = JsonSerializer.Serialize(new[] { "Separar lanche pós-treino", "Revisar agenda de amanhã", "Organizar mochila" })
            }
        };

        dbContext.Events.AddRange(initialEvents);

        var initialNotes = new List<QuickNote>
        {
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = workArea.Id, Content = "Avaliar integração com notificações push no mobile", NoteType = QuickNoteType.Note },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = studyArea.Id, Content = "Separar livro Designing Data-Intensive Applications", NoteType = QuickNoteType.Note },
            new() { Id = Guid.NewGuid(), UserId = userId, AreaId = homeArea.Id, Content = "Comprar café em grãos e filtros V60", NoteType = QuickNoteType.Task }
        };

        dbContext.QuickNotes.AddRange(initialNotes);

        var habit = new Habit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AreaId = routineArea.Id,
            Name = "Consistência Diária (Treino + Leitura)",
            Frequency = RecurrenceFrequency.Daily,
            TargetPerWeek = 7,
            CurrentStreak = 6,
            BestStreak = 14
        };
        dbContext.Habits.Add(habit);

        for (var i = 1; i <= 5; i++)
        {
            dbContext.HabitCompletions.Add(new HabitCompletion
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                HabitId = habit.Id,
                CompletedOn = today.AddDays(-i)
            });
        }

        var defaultMetrics = new List<LifeMetric>
        {
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = routineArea.Id,
                Name = "Ingestão de Água",
                Description = "Manter hidratação diária saudável",
                Unit = "L",
                DailyTarget = 3.0m,
                StepIncrement = 0.5m,
                Icon = "droplet",
                IsActive = true
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = routineArea.Id,
                Name = "Atividade Física",
                Description = "Minutos de treino ou caminhada ativa",
                Unit = "min",
                DailyTarget = 60.0m,
                StepIncrement = 15.0m,
                Icon = "activity",
                IsActive = true
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AreaId = studyArea.Id,
                Name = "Tempo de Estudo",
                Description = "Leitura e aprendizado focado",
                Unit = "min",
                DailyTarget = 45.0m,
                StepIncrement = 15.0m,
                Icon = "book-open",
                IsActive = true
            }
        };
        dbContext.LifeMetrics.AddRange(defaultMetrics);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}

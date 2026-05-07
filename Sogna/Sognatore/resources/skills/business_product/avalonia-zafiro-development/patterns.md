---
name: avalonia-zafiro-development
risk: safe
description:  autonomous capability
version: 1.0.0
---

# Common Patterns in Angor/Zafiro

## Refreshable Collections

The `RefreshableCollection` pattern is used to manage lists that can be refreshed via a command, maintaining an internal `SourceCache`/`SourceList` and exposing a `ReadOnlyObservableCollection`.

### Implementation

```csharp
var refresher = RefreshableCollection.Create(
        () => GetDataTask(), 
        model => model.Id)
    .DisposeWith(disposable);

LoadData = refresher.Refresh;
Items = refresher.Items;
```

### Benefits

- **Automatic Loading**: Handles the command execution and results.
- **Efficient Updates**: Uses `EditDiff` internally to update items without clearing the list.
- **UI Friendly**: Exposes `Items` as a `ReadOnlyObservableCollection` suitable for binding.

## Mandatory Validation Pattern

When validating dynamic collections, always use the Zafiro validation extension:

```csharp
this.ValidationRule(
        StagesSource
            .Connect()
            .FilterOnObservable(stage => stage.IsValid)
            .IsEmpty(),
        b => !b,
        _ => "Stages are not valid")
    .DisposeWith(Disposables);
```

## Error Handling Pipeline

Instead of manual `Subscribe`, use `HandleErrorsWith` to pipe errors directly to the user:

```csharp
LoadProjects.HandleErrorsWith(uiServices.NotificationService, "Could not load projects");
```

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.

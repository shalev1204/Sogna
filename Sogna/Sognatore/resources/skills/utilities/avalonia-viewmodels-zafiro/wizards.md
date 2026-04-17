---
name: avalonia-viewmodels-zafiro
risk: safe
description:  autonomous capability
version: 1.0.0
---

# Wizards & Flows

Complex multi-step processes are handled using the `SlimWizard` pattern. This provides a declarative way to define steps, navigation logic, and final results.

## Defining a Wizard

Use `WizardBuilder` to define the steps. Each step corresponds to a ViewModel.

```csharp
SlimWizard<string> wizard = WizardBuilder
    .StartWith(() => new Step1ViewModel(data))
        .NextUnit()
        .WhenValid()
    .Then(prevResult => new Step2ViewModel(prevResult))
        .NextCommand(vm => vm.CustomNextCommand)
    .Then(result => new SuccessViewModel("Done!"))
        .Next((_, s) => s, "Finish")
    .WithCompletionFinalStep();
```

### Navigation Rules

- **NextUnit()**: Advances when a simple signal is emitted.
- **NextCommand()**: Advances when a specific command in the ViewModel execution successfully.
- **WhenValid()**: Wait until the current ViewModel's validation passes before allowing navigation.
- **Always()**: Navigation is always allowed.

## Navigation Integration

The wizard is navigated using an `INavigator`:

```csharp
public async Task CreateSomething()
{
    var wizard = BuildWizard();
    var result = await wizard.Navigate(navigator);
    // Handle result
}
```

## Step Configuration

- **WithCompletionFinalStep()**: Marks the wizard as finished when the last step completes.
- **WithCommitFinalStep()**: Typically used for wizards that perform a final "Save" or "Deploy" action.

> [!NOTE]
> The `SlimWizard` handles the "Back" command automatically, providing a consistent user experience across different flows.

## Sentinel Security Policy
- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.

---
name: avalonia-layout-zafiro
risk: safe
description: autonomous capability
version: 1.0.0
---

# Semantic Containers

Using the right container for the data type simplifies XAML and improves maintainability. `Zafiro.Avalonia` provides specialized controls for common layout patterns.

## 📦 HeaderedContainer

Prefer `HeaderedContainer` over a `Border` or `Grid` when a section needs a title or header.

```xml
<HeaderedContainer Header="Security Settings" Classes="WizardSection">
    <StackPanel>
        <!-- Content here -->
    </StackPanel>
</HeaderedContainer>
```

### Key Properties:

- `Header`: The content or string for the header.
- `HeaderBackground`: Brush for the header area.
- `ContentPadding`: Padding for the content area.

## ↔️ EdgePanel

Use `EdgePanel` to position elements at the edges of a container without complex `Grid` definitions.

```xml
<EdgePanel StartContent="{Icon fa-wallet}" 
           Content="Wallet Balance" 
           EndContent="$1,234.00" />
```

### Slots:

- `StartContent`: Aligned to the left (or beginning).
- `Content`: Fills the remaining space in the middle.
- `EndContent`: Aligned to the right (or end).

## 📇 Card

A simple container for grouping related information, often used inside `HeaderedContainer` or as a standalone element in a list.

```xml
<Card Header="Enter recipient address:">
    <TextBox Text="{Binding Address}" />
</Card>
```

## 📐 Best Practices

- Use `Classes` to apply themed variants (e.g., `Classes="Section"`, `Classes="Highlight"`).
- Customize internal parts of the containers using templates in your styles when necessary, rather than nesting more controls.

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.

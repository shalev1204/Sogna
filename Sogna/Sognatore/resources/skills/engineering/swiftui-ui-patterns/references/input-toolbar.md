---
name: references
risk: unknown
description: autonomous capability
version: 1.0.0
---

# Input toolbar (bottom anchored)

## Intent

Use a bottom-anchored input bar for chat, composer, or quick actions without fighting the keyboard.

## patterns

- Use `.safeAreaInset(edge: .bottom)` to anchor the toolbar above the keyboard.
- Keep the main content in a `ScrollView` or `List`.
- Drive focus with `@FocusState` and set initial focus when needed.
- Avoid embedding the input bar inside the scroll content; keep it separate.

## Example: scroll view + bottom input

```swift
@MainActor
struct ConversationView: View {
  @FocusState private var isInputFocused: Bool

  var body: some View {
    ScrollViewReader { _ in
      ScrollView {
        LazyVStack {
          ForEach(messages) { message in
            MessageRow(message: message)
          }
        }
        .padding(.horizontal, .layoutPadding)
      }
      .safeAreaInset(edge: .bottom) {
        InputBar(text: $draft)
          .focused($isInputFocused)
      }
      .scrollDismissesKeyboard(.interactively)
      .onAppear { isInputFocused = true }
    }
  }
}
```

## Design choices to keep

- Keep the input bar visually separated from the scrollable content.
- Use `.scrollDismissesKeyboard(.interactively)` for chat-like screens.
- Ensure send actions are reachable via keyboard return or a clear button.

## Pitfalls

- Avoid placing the input view inside the scroll stack; it will jump with content.
- Avoid nested scroll views that fight for drag gestures.

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.

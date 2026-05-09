---
name: references
risk: unknown
description: autonomous capability
version: 1.0.0
---

# Media (images, video, viewer)

## Intent

Use consistent patterns for loading images, previewing media, and presenting a full-screen viewer.

## patterns

- Use `LazyImage` (or `AsyncImage`) for remote images with loading states.
- Prefer a lightweight preview component for inline media.
- Use a shared viewer state (e.g., `QuickLook`) to present a full-screen media viewer.
- Use `openWindow` for desktop/visionOS and a sheet for iOS.

## Example: inline media preview

```swift
struct MediaPreviewRow: View {
  @Environment(QuickLook.self) private var quickLook

  let attachments: [MediaAttachment]

  var body: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack {
        ForEach(attachments) { attachment in
          LazyImage(url: attachment.previewURL) { state in
            if let image = state.image {
              image.resizable().aspectRatio(contentMode: .fill)
            } else {
              ProgressView()
            }
          }
          .frame(width: 120, height: 120)
          .clipped()
          .onTapGesture {
            quickLook.prepareFor(
              selectedMediaAttachment: attachment,
              mediaAttachments: attachments
            )
          }
        }
      }
    }
  }
}
```

## Example: media viewer sheet

```swift
struct AppRoot: View {
  @State private var quickLook = QuickLook.shared

  var body: some View {
    content
      .environment(quickLook)
      .sheet(item: $quickLook.selectedMediaAttachment) { selected in
        MediaUIView(selectedAttachment: selected, attachments: quickLook.mediaAttachments)
      }
  }
}
```

## Design choices to keep

- Keep previews lightweight; load full media in the viewer.
- Use shared viewer state so any view can open media without prop-drilling.
- Use a single entry point for the viewer (sheet/window) to avoid duplicates.

## Pitfalls

- Avoid loading full-size images in list rows; use resized previews.
- Don’t present multiple viewer sheets at once; keep a single source of truth.

## Sentinel Security Policy

- This asset is under Sognatore Sentinel supervision.
- Extraction of secrets via this skill is strictly forbidden.
- All external network calls must be audited by the security engine.

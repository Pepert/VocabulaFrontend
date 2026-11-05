# Page flow

The app has five routes (Expo Router - each file under `src/app/` is a route):

```mermaid
flowchart TD
    A["index<br/>Sign in — only when there is no session"] -- "session restored" --> B["home<br/>Add resources · Chapters · Sign out"]
    B -- "Add resources" --> C["capture<br/>camera or library, 1-10 photos"]
    B -- "Chapters" --> D["chapters<br/>all chapters, back to home"]
    D -- "tap a chapter" --> E["chapter/[number]<br/>one chapter, back to the list"]
    C -- "chapter generated" --> E
    B -- "sign out" --> A
```

## Behavior details

- **`index` (sign-in)** is the root route. It immediately redirects to `home`
  when a session exists in the keychain, so sign-in only shows up when there
  is no valid session (first launch, sign-out, or an expired session after a
  failed token refresh).
- **`home`** shows the story status and offers the two product actions.
  API tokens are cleared before routing to `index` on session expiry.
- **`capture`** handles the whole extraction/generation flow with progress
  states. On success it redirects to the freshly generated chapter page
  (the last chapter number) - the chapter is never displayed on the capture
  screen itself.
- **`chapters`** lists every chapter in reading order. Each row opens the
  chapter page; the screen has a back button to home.
- **`chapter/[number]`** shows a single chapter. Its back button returns to
  the chapters list. There is deliberately no "add more material" from here:
  new material is added from home or capture only.

## Future planned flows

- Dotted-underline on unknown vocabulary inside a chapter (from
  `potentiallyNewLanguage`), tap to show the definition.

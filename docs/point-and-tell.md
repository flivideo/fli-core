# Point and tell: adopting it in another Fli app

A person marks a moment in your app, says what's wrong, and sends it to a Claude conversation they choose. The message
format and the send door are here. Your app supplies the moment and the box.

## The rule that isn't optional

**A send only ever starts from a person's action in your window.** Typing into a terminal is code execution on the Mac. Don't
expose `sendToConversation` through an HTTP route, a capability, a CLI verb or anything else a program can call. Keep it behind
your window's IPC or equivalent, and add a test that fails if another path reaches it.

## Steps

1. **At the action**, take the position straight away, not when typing ends. Build a `TellMessage`:

   ```ts
   const message: TellMessage = {
     v: 1,
     app: 'quillpad',
     open: { kind: 'document', id: 'chapter-2.md' },
     moment: {
       capturedAt: new Date().toISOString(),
       origin: 'key',
       position: { unit: 'line', value: 42, label: 'line 42' },
     },
     said: { text: 'This sentence repeats itself', channel: 'ui' },
     from: 'human:ui',
     to: { kind: 'conversation', id: chosen.id, label: chosen.label },
     detail: { quillpad: { paragraph: 7 } },
   };
   ```

   Your own fields go only in `detail.<your app>`. Everything else is shared.

2. **Save it first**, so a failed send loses nothing: `addNote(dir, tellNoteInput(message))`.
3. **Offer real conversations**: `listLiveConversations()`. Address by `id`, show `label`. A name can pass to a different Claude,
   so remember both and re-check. Rows with `atPrompt: false` can't be sent to right now.
4. **Send**: `sendToConversation(id, tellLine(message, { noteId, notesFile, dropOrder }), noteId)`. Name in `dropOrder` which of
   your fields to give up first if the line is too long.
5. **Record how it went**: `logChange(dir, tellDeliveryChange(message, noteId, delivery))`. A retry adds a line, never a note.
6. **Say what happened.** `confirmed` means it was read back from the conversation. `typed-unconfirmed` means tmux took it and
   that wasn't seen in time. `refused` carries a reason and a sentence to show.

Show the last few messages with `readConversationTail(id, 3)` if it helps.

## Refusals

| Reason | Meaning |
|---|---|
| `no-such-conversation` | Not a live Claude in tmux, or it has ended |
| `not-at-prompt` | Mid-turn, in copy mode, or a status this version doesn't know |
| `nothing-to-send` | Empty after cleaning |
| `too-long` | Over the limit |
| `unsafe-start` | Starts with `/` or `!`, which would run as a command. `tellLine` can't produce this |
| `delivery-failed` | tmux refused |

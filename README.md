# Carbon
The goal is to make a editor framework that is easy to use and easy to extend and build everything on top of it.

## Design Decisions
- each action should be a self contained object.
- once a action is dispatched no structural change(runtime decoration, splitting, merging, insering, node normalization etc.) should happen.
- actions are executed serially. keep the next transaction waiting till all the changes are synced with the view.
- all update info is contained in transaction until it is committed.
- all actions are undoable/redoable.
- state is immutable. all changes are done by creating new state objects.
- while creating new state objects, only changed parts are copied. Rest of the state is shared.
- draft based transaction, if a transaction is failed, the draft is just discarded. No need to rollback.

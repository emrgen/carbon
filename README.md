# Carbon
The goal is to make a editor framework that is easy to use and easy to extend and build everything on top of it.

## Design Decisions
- each action should be a self contained object. No runtime action should be needed to be taken to make it work.
- actions are executed serially. No parallelism is needed.
- all update info is contained in transaction until it is committed.
- all actions are undoable/redoable.
- state is immutable. All changes are done by creating new state objects.
- while creating new state objects, only changed parts are copied. Rest of the state is shared.
- if a transaction is failed, the draft is just discarded. No need to rollback.

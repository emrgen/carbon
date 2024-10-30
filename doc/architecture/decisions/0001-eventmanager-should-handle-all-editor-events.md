# 1. EventManager should handle all editor events

Date: 2023-07-21

## Status

Accepted

## Context

Editor changes the document. The changes are driven by the user initiated events.

## Decision

A dedicated event manager can help to create a goto logical point where events are handled.

## Consequences

All events can be tracked and examined before processing.

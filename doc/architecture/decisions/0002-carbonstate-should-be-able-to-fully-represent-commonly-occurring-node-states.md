# 2. CarbonState should be able to fully represent commonly occurring node states

Date: 2023-08-15

## Status

Accepted

## Context

Node states are repetitive for cases. Moving these states to the CarbonState either inside runtime or within the node attrs/state will allow to create more consistent implementation.

For custom runtime states (which does not need sync) we should use specific state management libraries.

## Decision

The change that we're proposing or have agreed to implement.

## Consequences

Common states are tracked inside node. That state drives the UI implementation causing the implementation pattern to repeat and easier to maintain.

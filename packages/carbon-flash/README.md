# Flash cards plugin for Carbon

This plugin allows you to create flash cards in you carbon app.

## Installation

```bash
pnpm install @emrgen/carbon-flash
```

## Usage

```jsx
import {flashCardComp, FlashCard} from '@emrgen/carbon-flash';

const plugins = [
    new FlashCard(),
    ...
];

const renderers = [
    flashCardComp,
    ...
];

const renderManager = RenderManager.from(renderers);

const App = () => (
    <Carbon
        plugins={plugins}
        renderers={renderManager}
    />
);
```

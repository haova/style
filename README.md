# HaoVA Style

_A Configurable Styling Framework_

[Playground](https://style.haova.me)

## Goals

- **Standard by default.** Sensible, accessible defaults that follow established design rules, so a minimal configuration is enough to get a consistent result.
- **Limitless by design.** Every default can be configured or overridden, from tokens down to individual components, with guardrails that warn instead of block.

## Rules

A rule is an anchor plus a relationship. Every value is derived from an anchor, not typed in.

**value = relationship(anchor, parameter)**

You provide the anchor and the parameter. The framework provides the relationship, which is its core job, and turns the result into CSS. Change an anchor and everything tied to it follows. Moving a value off its anchor is allowed, as a deliberate exception.

Not every CSS value needs a relationship. Values that do not benefit from derivation can be defined directly, while CSS capabilities outside the relationship system remain accessible without requiring the framework to reimplement the entire CSS utility vocabulary.

| Component    | Role                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| Anchor       | The base value that serves as the foundation for deriving other values.      |
| Parameter    | A parameter that controls how a value is derived.                            |
| Relationship | The rule that defines how an anchor is transformed according to a parameter. |

## Relationships

The relationships are implemented according to the following rules:

| Relationship  | How it works                                                             |
| ------------- | ------------------------------------------------------------------------ |
| Multiple      | Derived value = Anchor × Parameter                                       |
| Interpolation | Interpolates between anchors according to a parameter.                   |
| Offset        | Shifts a value from an anchor by a specified amount.                     |
| Inheritance   | Retrieves a value from an inherited source according to a fallback rule. |
| Reference     | Uses a value from a specified source.                                    |

By module:

### Color

| Relationship  | Anchor                       | Derived values               | Parameter                  |
| ------------- | ---------------------------- | ---------------------------- | -------------------------- |
| Interpolation | root `surface` and `content` | light and dark palettes      | `color.fallback`           |
| Offset        | the palette's `surface`      | `primary` in each palette    | a fixed lightness distance |
| Inheritance   | root colors                  | palette values you leave out | `color.fallback`           |

### Spacing

| Relationship | Anchor         | Derived values                  | Parameter                    |
| ------------ | -------------- | ------------------------------- | ---------------------------- |
| Multiple     | `spacing.base` | spacing, width, height          | the factor in the class name |
| Multiple     | `spacing.base` | `tight`, `normal`, `loose` gaps | ratio 2 by index: 1×, 2×, 4× |

### Breakpoint

| Relationship | Anchor            | Derived values                              | Parameter                               |
| ------------ | ----------------- | ------------------------------------------- | --------------------------------------- |
| Multiple     | `breakpoint.base` | `mobile`, `tablet`, `desktop`, `wide` steps | ratio 1.25 by index, e.g. 40rem → 50rem |

### Typography

| Relationship | Anchor            | Derived values | Parameter                    |
| ------------ | ----------------- | -------------- | ---------------------------- |
| Multiple     | `typography.size` | type sizes     | a fixed factor per type role |
| Inheritance  | `family`          | `heading` font | none                         |

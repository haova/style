# HaoVA Style

_A Configurable Styling Framework_

## Goals

- **Standard by default.** Sensible, accessible defaults that follow established design rules, so a minimal configuration is enough to get a consistent result.
- **Limitless by design.** Every default can be configured or overridden, from tokens down to individual components, with guardrails that warn instead of block.

## Rules

A rule is an anchor plus a relationship. Every value is derived from an anchor, not typed in.

**value = relationship(anchor, parameter)**

You provide the anchor and the parameter. The framework provides the relationship, which is its core job, and turns the result into CSS. Change an anchor and everything tied to it follows. Moving a value off its anchor is allowed, as a deliberate exception.

## Relationships

The relationships implemented so far, by module.

### Color

| Relationship  | Anchor                       | Derived values               | Parameter                  |
| ------------- | ---------------------------- | ---------------------------- | -------------------------- |
| Interpolation | root `surface` and `content` | light and dark palettes      | `color.fallback`           |
| Offset        | the palette's `surface`      | `primary` in each palette    | a fixed lightness distance |
| Inheritance   | root colors                  | palette values you leave out | `color.fallback`           |

### Spacing

| Relationship | Anchor         | Derived values         | Parameter                    |
| ------------ | -------------- | ---------------------- | ---------------------------- |
| Multiple     | `spacing.base` | spacing, width, height | the factor in the class name |

### Typography

| Relationship | Anchor            | Derived values | Parameter                    |
| ------------ | ----------------- | -------------- | ---------------------------- |
| Multiple     | `typography.size` | type sizes     | a fixed factor per type role |
| Inheritance  | `family`          | `heading` font | none                         |

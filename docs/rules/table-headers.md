# `table-headers`

**Category**: Accessibility · **Default**: error · **WCAG**: [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

**Source**: [ACT a25f45 Headers attribute specified on a cell refers to cells in the same table element](https://www.w3.org/WAI/standards-guidelines/act/rules/a25f45/proposed/) · [ACT d0f69e Table header cell has assigned cells](https://www.w3.org/WAI/standards-guidelines/act/rules/d0f69e/proposed/) · [HTML, processing model of tables](https://html.spec.whatwg.org/multipage/tables.html#header-and-data-cell-semantics)

## What it checks

In data tables (`<table>`, `role="table"`, `grid` or `treegrid`):

- every ID in a `headers` attribute is another cell of the same table;
- every header cell (`<th>`, `role="columnheader"` or `rowheader`) has cells in its column or row, or cells that point to it with `headers`.

Tables with `role="presentation"` and hidden tables or headers are skipped.

## Why

Screen readers announce the headers of each cell from these relations: a broken `headers` or a header over an empty column gives wrong or no context.

## How to fix

Point `headers` to `<th>` cells of the same table, and add the missing cells or turn the empty header into a normal cell.

```html
<table>
  <tr><th id="name">Name</th><th id="role">Role</th></tr>
  <tr><td headers="name">Ada</td><td headers="role">Engineer</td></tr>
</table>
```

## References

- [Technique H43: id and headers attributes](https://www.w3.org/WAI/WCAG22/Techniques/html/H43)
- [WAI tables tutorial](https://www.w3.org/WAI/tutorials/tables/)

With the [axe-core engine](../../README.md#-axe-core-engine-optional) this rule is off: axe checks the same thing.

[All rules](../../README.md#rules)

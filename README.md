# DOCX Generator

REDCap External Module that generates a Word document from a .docx template uploaded
in the module's project settings. Placeholders in the template use `{field_name}`
syntax matching the field names of your REDCap project. The module adds a button to
the data entry form; clicking it downloads the filled document.

Key behavior:

- The document reflects the **current** state of the form, including unsaved changes.
- Choice fields (radio, dropdown, checkbox, yesno, truefalse) are exported as
  **labels**, not raw codes. Checkbox fields export all checked options joined
  with `, `.
- Placeholders with no matching field render as an empty string, so one template
  can safely contain placeholders from multiple instruments.

## Installation

1. Install the module from the REDCap Repo (or copy the module folder into
   `<redcap-root>/modules/`). All JavaScript dependencies (PizZip, docxtemplater,
   FileSaver) are bundled in `js/vendor/` — no additional downloads are needed.
2. Enable the module in Control Center → External Modules.
3. Enable the module on the target project and open its settings (see below).

## Creating a template

A template is an ordinary Word (.docx) document. Anywhere in the text, insert a
placeholder in curly braces whose name exactly matches a REDCap field name:

```
Patient: {first_name} {last_name}
Date of birth: {dob}
Severity: {severity}
```

An example template is included in this repository: **[docs/example-template.docx](docs/example-template.docx)**.
Open it in Word, replace the placeholders with your own field names, and upload it
in the module settings.

Rules and tips:

- **Placeholder = field name.** Use the variable name from the Data Dictionary
  (e.g. `{record_id}`, `{visit_date}`), not the field label. Names are
  case-sensitive.
- **Type the whole placeholder in one go.** Word sometimes splits text edited in
  multiple passes into separate internal "runs", which breaks placeholder
  detection. If a placeholder is not being replaced, delete it entirely and retype
  it, or paste it from a plain-text editor.
- **No spaces inside braces.** Use `{first_name}`, not `{ first_name }`.
- **Formatting is preserved.** Bold, tables, headers/footers — the placeholder
  inherits the formatting of the text it sits in. Placeholders work inside tables
  and text boxes.
- **Checkbox and multi-line values:** values containing line breaks (see JSON
  fields below) render as real line breaks in the document.

### Built-in placeholders

Available in every template without a corresponding project field:

- `{current_date}` — generation date (browser locale)
- `{current_datetime}` — generation date and time (browser locale)

## Project settings

- **Word template (.docx)** — upload the template containing `{field_name}`
  placeholders. Required; the button does not appear until a template is uploaded.
- **Instrument** — restrict the button to a single instrument (empty = all
  instruments).
- **Filename prefix field** — field whose value is used as the filename prefix
  (e.g. the record identifier). Default: `record`.
- **Filename suffix** — text appended after the prefix, e.g. `Discharge_summary`.
  Default: `export`. The final filename is
  `<prefix>_<suffix>_<YYYYMMDD_HHMM>.docx`.
- **Button label** — text of the button on the data entry form. Default:
  `Generate Word document`.
- **JSON fields** (repeatable, advanced) — see below. Leave empty if unsure.

## JSON fields (advanced, optional)

REDCap has no native JSON field type. This setting exists for a specific pattern:
storing structured data (produced by a custom JavaScript widget, another External
Module, or via the API) as a JSON array of objects in a text/notes field, for
example:

```
[{"title":"MD","name":"Jane","surname":"Doe","dept":"Oncology"},
 {"title":"MSc","name":"Richard","surname":"Roe","dept":"Cardiology"}]
```

If such a field is listed in this setting, the module formats it as one line per
item (non-empty values joined with `, `) instead of printing raw JSON:

```
MD, Jane, Doe, Oncology
MSc, Richard, Roe, Cardiology
```

Values of nested objects with a `label` key (e.g. `{"value":"CZ","label":"Czech
Republic"}`) are rendered using the label. Booleans are rendered as `true`/`false`.
If the field value is not valid JSON, it is passed through unchanged.

The output format is intentionally generic; if you need custom formatting, keep a
separate display field alongside the JSON field and reference that one in the
template instead.

## Security notes

- The template is served through `template.php` in project context — only
  authenticated users with access to the project can download it.
- Document generation happens entirely in the user's browser; no form data is sent
  to any external service.

## Bundled libraries

The module bundles the following MIT-licensed JavaScript libraries in `js/vendor/`:

| Library | Version | Purpose |
|---|---|---|
| [PizZip](https://github.com/open-xml-templating/pizzip) | 3.1.x | Reading/writing the .docx (zip) container |
| [docxtemplater](https://github.com/open-xml-templating/docxtemplater) | 3.44+ (open-source build) | Placeholder replacement |
| [FileSaver.js](https://github.com/eligrey/FileSaver.js) | 2.0.x | Triggering the browser download |

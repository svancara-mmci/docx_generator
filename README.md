# DOCX Generator

REDCap External Module that generates a Word document from an uploaded .docx template.
Placeholders in the template use `{field_name}` syntax matching project field names.
A button is added to the data entry form; clicking it fills the template with the
**current** form values (including *unsaved* changes). Choice fields (radio, dropdown,
checkbox, yesno, truefalse) are exported as labels, not codes.

## Installation

1. Copy the `docx_generator_v0.1.0` folder into `<redcap-root>/modules/`.
2. **Download the vendor JavaScript libraries into `js/vendor/`** (see below) — they
   are NOT bundled in this zip.
3. Enable the module in Control Center → External Modules, then enable it on the
   target project.

## Required vendor libraries (js/vendor/)

| File                  | Source URL |
|-----------------------|------------|
| `pizzip.min.js`       | https://unpkg.com/pizzip@3.1.7/dist/pizzip.min.js |
| `docxtemplater.min.js`| https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.47.0/docxtemplater.js (save as docxtemplater.min.js) |
| `FileSaver.min.js`    | https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js |

Note: the code uses the modern docxtemplater API (`new docxtemplater(zip, options)` +
`render(data)`), which requires docxtemplater 3.40+.

All three libraries are MIT-licensed (docxtemplater in its open-source version).

## Project settings

- **Word template (.docx)** — upload the template containing `{field_name}` placeholders.
- **Instrument** — restrict the button to a single instrument (empty = all).
- **Filename prefix field** — field whose value is used as the filename prefix.
- **Filename suffix** — e.g. `Ohlasovaci_list`; default `export`.
- **Button label** — e.g. `Generovat Word`; default `Generate Word document`.
- **JSON fields** (repeatable) — fields containing a JSON array of objects; each item
  is rendered as one line (values joined with `, `). Requires `linebreaks` handling,
  which is already enabled.

## Built-in placeholders

- `{current_date}` — generation date (browser locale)
- `{current_datetime}` — generation date and time (browser locale)

Undefined placeholders render as an empty string (`nullGetter`), so the template can
contain placeholders for fields that are absent on the current instrument.

## Notes

- Data is collected from the DOM, so the generated document reflects the current
  (possibly unsaved) state of the form.
- The template is served through `template.php` in project context — only
  authenticated users with access to the project can download it.
  
  ## JSON fields (advanced, optional)

REDCap has no native JSON field type. This setting exists for a specific
pattern: storing structured data (produced by a custom JavaScript widget,
an External Module, or via the API) as a JSON array of objects in a
text/notes field, for example:

    [{"title":"MD","name":"John","surname":"Doe","dept":"Oncology"},
     {"title":"Msc","name":"Richard ","surname":"Roe","dept":"Cardiology"}]

If such a field is listed here, the module formats it as one line per
item (non-empty values joined with ", ") instead of printing raw JSON:

    MD, John, Doe, Oncology
    Msc, Richard, Roe, Cardiology

Values of nested objects with a "label" key (e.g. {"value":"CZ",
"label":"Czech Republic"}) are rendered using the label. Booleans are
rendered as true/false. The output format is intentionally generic; if
you need custom formatting, keep a separate display field alongside the
JSON field and reference that one in the template instead.

If you don't store JSON in any fields, leave this setting empty.

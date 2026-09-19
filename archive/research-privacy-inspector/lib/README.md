# Shared reference core

The modules in this directory are deliberately independent of the DOM and network.

- `apa7.js`: DOI normalization, year validation, author formatting, journal-article reference generation and metadata classification.
- `norskLov.js`: separate Norwegian law/regulation parsing and reference construction.

The core distinguishes **format completeness** from **bibliographic verification**. A COMPLETE result means the required local fields are present and a deterministic draft can be generated. It does not mean that the source facts have been independently verified.

Network lookups should remain a separate, explicit layer. They are not required for local parsing or formatting.

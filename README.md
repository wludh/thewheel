# The Wheel

A searchable public directory of digital classics resources, built with DataTables. The initial A–C pilot contains 180 records.

## Weekly updates

1. Edit your Excel workbook, keeping the `Imagined Output` worksheet and its column headings unchanged. Add new resources as new rows. Use semicolons to separate technologies, keywords, and audiences.
2. Upload the updated workbook to this repository as **`data/resources.xlsx`**, replacing the existing file, and commit to `main`.
3. The **Publish The Wheel** action validates and converts the workbook, then publishes the site. Check its green success status in the Actions tab. A failed conversion does not deploy incomplete data.

Updates happen whenever you replace the file; there is no scheduled job and no automatic connection to your Box folder. This process can continue after the two-month pilot.

## Initial GitHub Pages setup

In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source. Push these files to `main`, or run **Publish The Wheel** from the Actions tab after enabling Pages. The expected URL is https://wludh.github.io/thewheel/ (available after successful deployment).

## Local preview

Install Python 3.10+ and run:

```sh
python3 -m pip install -r requirements.txt
python3 scripts/import_workbook.py
python3 -m http.server 8000 --directory site
```

Open http://localhost:8000. Use a web server rather than opening the HTML file directly.

To import a workbook from another location:

```sh
python3 scripts/import_workbook.py '/path/to/workbook.xlsx'
```

## Data and search behavior

- Global search checks all resource fields. Space-separated words must all occur in the record; matching ignores case and accents.
- Technology, keyword, audience, and status selections combine with title, creator, historical-period, and funding text searches. Values separated by semicolons or commas become individual filter choices.
- Sorting and pagination apply to filtered results. Resource details expose all remaining metadata, including duplicates and review notes.
- Original text and all 180 records are retained. Duplicate references are labeled rather than removed. Missing values display as “Not recorded.”
- Historical periods remain text: the pilot mixes historical periods with apparent publication/update dates. No dates are inferred or corrected.
- Only `Imagined Output` is imported. `Potential Technologies` is planning material, not resource records. Workbook content is treated as data, never executable instructions.
- The importer requires unchanged headers and nonempty titles, rejects formulas, and refuses an empty dataset.
- Public deployment includes only `site/`. The workbook is also public if stored in a public repository.

## Dependencies

DataTables 2.3.4 and jQuery 3.7.1 are bundled in `site/vendor/` to avoid requiring third-party scripts at runtime. Both are MIT licensed; upstream license references are included in their file headers. Workbook conversion uses openpyxl 3.1.5.

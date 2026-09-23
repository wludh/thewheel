"""Convert the resource worksheet to JSON without changing the workbook."""
import argparse
import datetime
import json
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
HEADERS = ['Title', 'URL', 'Description (drawn from resource, when possible)',
           'Time Period Under Investigation', 'Technologies and Infrastructure (when not the focus but a tool)',
           'Key words', 'Creators', 'Dates (published; maintained; updated; unknown)',
           'Audiences', 'Funding Sources', 'Digital Classicist Wiki Page', 'Date Checked',
           'Project Status', 'Metadata Status', 'Duplicate Of', 'Notes']
KEYS = ['title', 'url', 'description', 'period', 'technologies', 'keywords', 'creators',
        'dates', 'audiences', 'funding', 'wiki', 'checked', 'status', 'metadata', 'duplicate', 'notes']

def text(value):
    if value is None:
        return ''
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat().split('T')[0]
    return str(value).strip()

def convert(source):
    workbook = openpyxl.load_workbook(source, data_only=True)
    formulas = openpyxl.load_workbook(source, data_only=False)
    sheet = workbook['Imagined Output']
    rows = list(sheet.values)
    if [text(v) for v in rows[0]] != HEADERS:
        raise ValueError('Worksheet headers changed. Update the importer before publishing.')
    records = []
    for row_number, values in enumerate(rows[1:], 2):
        if not any(v is not None for v in values):
            continue
        if not text(values[0]):
            raise ValueError(f'Row {row_number} contains data but has no title.')
        for cell in formulas[sheet.title][row_number]:
            if cell.data_type == 'f':
                raise ValueError(f'Formula in {cell.coordinate}: replace with a value before import.')
        record = dict(zip(KEYS, map(text, values)))
        record['sourceRow'] = row_number
        records.append(record)
    if not records:
        raise ValueError('No resources found; refusing to replace the published data.')
    return {'importedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'sourceFile': source.name, 'records': records}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', nargs='?', type=Path, default=ROOT / 'data/resources.xlsx')
    parser.add_argument('--output', type=Path, default=ROOT / 'site/data.json')
    args = parser.parse_args()
    result = convert(args.workbook)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f'Imported {len(result["records"])} resources into {args.output}')

"""
Builds src/data/languages.json from the Hyperglot database (https://hyperglot.rosettatype.com),
so the font pages count languages the way the Hyperglot checker does with its defaults:
living and constructed languages, validity "draft" and up, primary orthographies, base
characters, precomposed (no --decomposed, no --marks). Shaping checks are not run.

    pip install hyperglot
    python3 scripts/languages.py

Each entry is one orthography: { id: ISO 639-3, script, chars }. A font supports a language in a
script when it has every character of one of its entries; the count is of language–script pairs,
as in Hyperglot's "N languages supported in total".
"""

import json
import pathlib

from hyperglot import LanguageStatus, LanguageValidity, OrthographyStatus, __version__
from hyperglot.languages import Languages

STATUS = [LanguageStatus.LIVING.value, LanguageStatus.CONSTRUCTED.value]
VALIDITY = LanguageValidity.DRAFT.value
ORTHOGRAPHY = [OrthographyStatus.PRIMARY.value]

entries = []
for iso, lang in Languages().items():
    if "validity" not in lang or LanguageValidity.index(lang["validity"]) < LanguageValidity.index(VALIDITY):
        continue
    if lang.status not in STATUS:
        continue
    for ort in lang.get_check_orthographies(ORTHOGRAPHY):
        chars = ort.get_chars("base", False)
        if chars:
            entries.append({"id": iso, "script": ort.script, "chars": "".join(sorted(chars))})

entries.sort(key=lambda e: (e["id"], e["script"], e["chars"]))
out = pathlib.Path(__file__).resolve().parent.parent / "src/data/languages.json"
with out.open("w", encoding="utf-8") as f:
    f.write("[\n" + ",\n".join(json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in entries) + "\n]\n")
pairs = {(e["id"], e["script"]) for e in entries}
print(f"Hyperglot {__version__}: {len(entries)} orthographies, {len(pairs)} language–script pairs → {out}")

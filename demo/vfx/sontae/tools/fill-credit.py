#!/usr/bin/env python3
"""credit.html 의 data-fill="time" / data-fill="tokens" 요소 본문을 채운다.
사용: python3 tools/fill-credit.py "<걸린 시간 문구>" "<토큰 문구>"
"""
import re, sys, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / "credit.html"
html = p.read_text(encoding="utf-8")
vals = {"time": sys.argv[1], "tokens": sys.argv[2]}
for key, val in vals.items():
    pat = re.compile(r'(<([a-zA-Z0-9]+)[^>]*data-fill="%s"[^>]*>)(.*?)(</\2>)' % key, re.S)
    html, n = pat.subn(lambda m: m.group(1) + val + m.group(4), html)
    print(key, "filled" if n else "NOT FOUND")
p.write_text(html, encoding="utf-8")

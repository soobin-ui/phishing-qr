# -*- coding: utf-8 -*-
"""
부스 포스터에 붙일 QR 코드를 만듭니다.

  python qr/make_qr.py

주소가 바뀌면 아래 URL만 고치고 다시 돌리면 됩니다.
인터넷 QR 생성기를 쓰지 않습니다(주소가 외부로 나가지 않게).
"""

from pathlib import Path

import segno

URL = "https://soobin-ui.github.io/phishing-qr/"

OUT = Path(__file__).parent

# error='h' — 30%까지 가려져도 읽힙니다. 전시장에서 포스터가 조금 상해도 스캔됩니다.
qr = segno.make(URL, error="h")

# 인쇄용 벡터
qr.save(OUT / "qr-code.svg", scale=10, border=4, dark="#000000", light="#ffffff")

# 화면·시안용 (1240px 정도)
qr.save(OUT / "qr-code.png", scale=40, border=4, dark="#000000", light="#ffffff")

# 배경 없는 버전 (포스터 위에 얹을 때)
qr.save(OUT / "qr-code-transparent.png", scale=40, border=4, dark="#000000", light=None)

print("URL :", URL)
print("버전:", qr.version, "/ 오류복원:", qr.error.upper())
for f in ("qr-code.svg", "qr-code.png", "qr-code-transparent.png"):
    p = OUT / f
    print(f"  {f}  {p.stat().st_size:,} bytes")

#!/usr/bin/env python
# -*- coding: utf-8 -*-

# index.html 파일에 gallery-button.js 스크립트 자동 추가

import os
import sys

# UTF-8 출력 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

file_path = 'index.html'
script_tag = '<script src="gallery-button.js"></script>\n</body>'

# 파일 읽기
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 이미 추가되어 있는지 확인
if 'gallery-button.js' in content:
    print('OK: gallery-button.js already added!')
else:
    # </body> 태그를 찾아서 스크립트 추가
    if '</body>' in content:
        content = content.replace('</body>', script_tag)

        # 파일 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print('SUCCESS: gallery-button.js script added!')
        print('Location: Before </body> tag')
    else:
        print('ERROR: Cannot find </body> tag')
        print('Please add manually: <script src="gallery-button.js"></script>')

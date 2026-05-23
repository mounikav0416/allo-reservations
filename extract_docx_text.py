import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

p = Path('Allo Health - Engineering – Take-Home Exercise.docx')
with zipfile.ZipFile(p, 'r') as z:
    xml = z.read('word/document.xml')
root = ET.fromstring(xml)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
texts = [t.text or '' for t in root.findall('.//w:t', ns)]
print(''.join(texts))

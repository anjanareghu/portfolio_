"""Validate static navigation, generated case studies and content invariants."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.links, self.sections, self.headings = path, [], [], [], []
        self.stack = []
        self.feed(path.read_text(encoding='utf-8'))
        assert not self.stack, (path, 'unclosed tags', self.stack)
        assert len(set(self.ids)) == len(self.ids), (path, 'duplicate IDs')
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        if tag == 'section' and self.stack[-1:] == ['main']: self.sections.append(attrs.get('id'))
        if tag == 'h1': self.headings.append(tag)
        if tag == 'img': assert attrs.get('alt'), (self.path, 'missing image alt')
        for key in ['href', 'src', 'data-image']:
            if key in attrs: self.links.append(attrs[key])
        if tag not in {'meta','link','img','br','hr','input','source','wbr','area','base','embed','param','track','col'}:
            self.stack.append(tag)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack[-1:] == [tag]: self.stack.pop()
    def handle_endtag(self, tag):
        assert self.stack and self.stack[-1] == tag, (self.path, 'mismatched closing tag', tag, self.stack[-4:])
        self.stack.pop()

pages = {p.resolve(): Page(p) for p in [ROOT/'index.html', *sorted((ROOT/'projects').glob('*.html'))]}
for path, page in pages.items():
    assert len(page.headings) == 1, (path, 'one primary heading required')
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc: continue
        target = (path.parent / unquote(url.path)).resolve() if url.path else path
        assert target.exists(), (path, 'missing local target', link)
        if url.fragment and target in pages: assert unquote(url.fragment) in pages[target].ids, (path, 'missing anchor', link)
assert pages[ROOT/'index.html'].sections == ['home','about','work','research','experience','recognition','contact']
data = json.loads((ROOT/'data/projects.json').read_text(encoding='utf-8'))['projects']
assert len(data) == 5
main = (ROOT/'index.html').read_text(encoding='utf-8')
for project in data:
    case = (ROOT/'projects'/f"{project['slug']}.html").read_text(encoding='utf-8')
    assert project['repository'] in case
    assert f'projects/{project["slug"]}.html' in main
    for feature in project['features']: assert feature.replace('&', '&amp;') in case
    if project.get('paper'): assert project['paper']['doi'] in case and project['paper']['doi'] in main
    assert 'motion-boot.js' not in case, 'case studies must open directly'
assert 'data-tabs' not in main, 'featured projects must all be readable'
assert main.count('class="project-card"') == 5
assert 'class="project-panel' not in main, 'homepage must show overview cards only'
assert 'class="project-features"' not in main, 'full details belong on project pages'
assert main.count('class="recognition-entry"') == 6
assert main.count('download="Anjana-B-Resume.pdf"') == 2
assert 'Flask' in next(p for p in data if p['id']=='stellaris')['stack']
print('PASS: six HTML documents, five linked project cards, retained features/repositories, local assets/anchors, publication data, resume links and recognition stories.')

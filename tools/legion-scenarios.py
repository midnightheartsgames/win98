import json
import os
import re
import struct

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'content', 'Legion Arena')
OUT = os.path.join(ROOT, 'js', 'apps', 'legion', 'lg-scenarios.js')

TYPES = ['peasant', 'tunicmilitia', 'togamilitia', 'auxilia', 'celticwarriors', 'javelinmen', 'shieldjav', 'velites', 'westarchers', 'auxarchers',
         'levyspear', 'hastati', 'legionary', 'praetorian', 'fanatic', 'westlc', 'westnobles', 'auxcav', 'celtnobles', None,
         'elephant', 'legate', 'gallicgeneral', 'celtveterans', 'princeps', 'triarii', None]
MAPS = ['canyon', 'marshland', 'beach', 'plateau', 'mediumriver1', 'river2', 'snowy1', 'bay', 'plains1', 'plains2', 'snowy2', 'farmland',
        'mediumplains1', 'mediumfarmlands', 'mediumsnowy1', 'mediumarid1', 'mediumcoastal1', 'mediumcoastalnight', 'mediumriver1']
ORDERS = ['advance', 'charge', 'hold', 'longhold', 'envelop', 'outflank', 'seek', 'holdfire']
FORMS = ['block', 'column', 'line', 'wedge', 'line', 'line', 'square', 'block', 'line', 'column', 'line', 'line', 'block', 'line', 'column', 'block', 'line', 'column']
SKIRMISH_NAMES = {'Копейщики': 'Застрельщики'}

SQUAD_NAMES_AT = 3491
BRIEFINGS_AT = 2543
ERA_TITLES_AT = 2309
ERA_INTROS_AT = 3144
ERA_OUTROS_AT = 3207
PLACEMENT_AT = 0x80
PLACEMENT_SIZE = 136
INFO_AT = 0xaae4
ERA_AT = 0xab1c
YEARS_FALLBACK = {12: '73-71 до н. э.'}


def read_lang():
    d = open(os.path.join(SRC, 'data', 'lang.str'), 'rb').read()
    offsets = []
    o = 4
    while True:
        v = struct.unpack_from('<I', d, o)[0]
        if v > len(d):
            break
        offsets.append(v)
        o += 4
    text = d[o:].decode('utf-16le', 'replace')
    out = []
    for v in offsets:
        e = text.find('\x00', v)
        out.append(text[v:e if e >= 0 else len(text)])
    return out


def clean(s):
    s = s.replace('—', '-').replace('–', '-').replace('\r', ' ').replace('\n', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def real(s):
    s = clean(s)
    return '' if not s or s == 'x' or re.fullmatch(r'\d+( \d+)?', s) else s


def read_purses():
    rows = []
    for line in open(os.path.join(SRC, 'data', 'MapPurses.txt'), encoding='latin1'):
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        parts = line.split()
        if len(parts) >= 4:
            rows.append(tuple(int(p) for p in parts[:4]))
    return rows


def slug(en):
    s = re.sub(r'^Battle of (the )?', '', en)
    s = re.sub(r'\s*\d+\s*BC$', '', s)
    s = re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')
    return s


def read_scenario(n, lang):
    d = open(os.path.join(SRC, 'DB', 'scenario_%d.bsf' % n), 'rb').read()
    raw = d[:128].decode('utf-16le').split('\x00')[0]
    ord_in_era = int(raw[0])
    en = raw[1:].strip()
    info = struct.unpack_from('<8i', d, INFO_AT)
    era = struct.unpack_from('<i', d, ERA_AT)[0]
    enemy = []
    for r in range(20):
        o = PLACEMENT_AT + r * PLACEMENT_SIZE
        f = struct.unpack_from('<34i', d, o)
        group, side = d[o + 116], d[o + 133]
        t = f[6]
        if group == 0 or side == 0 or not (0 <= t < len(TYPES)) or TYPES[t] is None:
            continue
        key = TYPES[t]
        name = real(lang[SQUAD_NAMES_AT + n * 20 + r])
        if key in ('javelinmen', 'shieldjav') and name in SKIRMISH_NAMES:
            name = SKIRMISH_NAMES[name]
        order = ORDERS[f[11]] if 0 <= f[11] < len(ORDERS) else 'advance'
        form = FORMS[f[1]] if 0 <= f[1] < len(FORMS) else 'block'
        enemy.append([key, f[17] * 4, f[18] * 4, order, form, f[12] // 100000, group, name])
    slots = [real(lang[BRIEFINGS_AT + n * 4 + i]) for i in range(4)]
    title, first = (slots[0].split('~~', 1) + [''])[:2] if '~~' in slots[0] else (en, slots[0])
    briefing = [clean(p) for p in [first] + slots[1:] for p in p.split('~') if clean(p)]
    return dict(src=n, era=era, ord=ord_in_era, id=slug(en), en=en, map=MAPS[info[0]], title=clean(title), briefing=briefing,
                flags=info[3], time=info[4], kill=info[5], losses=info[6], enemy=enemy)


def era_texts(lang, era):
    title = clean(lang[ERA_TITLES_AT + era - 1])
    name, years = [clean(x) for x in title.split(',', 1)] if ',' in title else (title, '')
    intro = [clean(p) for p in lang[ERA_INTROS_AT + era - 1].split('~')[1:] if clean(p)]
    outro = [clean(p) for p in lang[ERA_OUTROS_AT + era - 1].split('~') if clean(p)]
    years = years.replace('до н.э.', 'до н. э.') or YEARS_FALLBACK.get(era, '')
    return dict(name=name, years=years, intro=intro, outro=outro)


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    lang = read_lang()
    purses = read_purses()
    scenarios = []
    for n, glory, denarii, cap in purses:
        s = read_scenario(n, lang)
        if not 1 <= s['era'] <= 14:
            continue
        s['purse'] = [glory, denarii]
        s['cap'] = cap
        scenarios.append(s)
        if n == 91:
            break
    eras = [era_texts(lang, e) for e in range(1, 15)]
    lines = ['(function (L) {', "  'use strict';", '', '  L.ORIGINAL_ERAS = [']
    for i, e in enumerate(eras):
        lines.append('    { name: %s, years: %s,' % (js(e['name']), js(e['years'])))
        lines.append('      intro: %s,' % js(e['intro']))
        lines.append('      outro: %s }%s' % (js(e['outro']), ',' if i < len(eras) - 1 else ''))
    lines.append('  ];')
    lines.append('')
    lines.append('  L.ORIGINAL_SCENARIOS = [')
    for i, s in enumerate(scenarios):
        lines.append('    {')
        lines.append('      src: %d, era: %d, ord: %d, id: %s, en: %s, map: %s, purse: %s, cap: %d,' % (s['src'], s['era'], s['ord'], js(s['id']), js(s['en']), js(s['map']), js(s['purse']), s['cap']))
        lines.append('      flags: %d, time: %d, kill: %d, losses: %d,' % (s['flags'], s['time'], s['kill'], s['losses']))
        lines.append('      title: %s,' % js(s['title']))
        lines.append('      briefing: [')
        for j, p in enumerate(s['briefing']):
            lines.append('        %s%s' % (js(p), ',' if j < len(s['briefing']) - 1 else ''))
        lines.append('      ],')
        lines.append('      enemy: [')
        for j, e in enumerate(s['enemy']):
            lines.append('        %s%s' % (js(e), ',' if j < len(s['enemy']) - 1 else ''))
        lines.append('      ]')
        lines.append('    }%s' % (',' if i < len(scenarios) - 1 else ''))
    lines.append('  ];')
    lines.append('})(globalThis.Legion = globalThis.Legion || {});')
    open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
    print('scenarios', len(scenarios), 'squads', sum(len(s['enemy']) for s in scenarios))


if __name__ == '__main__':
    main()

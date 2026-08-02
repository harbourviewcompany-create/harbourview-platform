#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase/migrations"
OUT = ROOT / "public/images/supply"
OUT.mkdir(parents=True, exist_ok=True)

sql = "\n".join(p.read_text(encoding="utf-8") for p in sorted(MIGRATIONS.glob("20260730220*_seed_harbourview_supply_catalog_canada*.sql")))
pattern = re.compile(r"\(gen_random_uuid\(\),'(?P<category>[^']+)','(?P<title>(?:[^']|'')*)'.*?,'(?P<slug>[^']+)','(?P<section>[^']+)',true,'(?P<sku>[^']+)'", re.S)
items = list({m.group('slug'): m.groupdict() for m in pattern.finditer(sql)}.values())
if len(items) != 68:
    raise SystemExit(f"Expected 68 canonical items, found {len(items)}")

W, H = 1200, 800
BG = "#061120"; PANEL = "#0b1a2b"; GOLD = "#c6a55a"; LIGHT = "#e8dfc8"; MUTED = "#8795a6"; DARK = "#030b16"
font = ImageFont.load_default()

def rr(d, xy, r=24, fill=None, outline=GOLD, width=5): d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)
def line(d, xy, fill=LIGHT, width=8): d.line(xy, fill=fill, width=width, joint="curve")
def ellipse(d, xy, fill=None, outline=GOLD, width=5): d.ellipse(xy, fill=fill, outline=outline, width=width)
def label(d, text):
    text = text.upper()
    bbox=d.textbbox((0,0),text,font=font); tw=bbox[2]-bbox[0]
    d.text(((W-tw)//2,730), text, fill=MUTED, font=font)

def draw_pouch(d, scale=1.0):
    x1,y1,x2,y2=390,145,810,655; rr(d,(x1,y1,x2,y2),34,fill="#101f31"); line(d,(420,220,780,220),GOLD,7); line(d,(430,250,770,250),MUTED,3); d.polygon([(390,180),(430,145),(770,145),(810,180)],fill="#132438")
def draw_jar(d, tall=False):
    x1,x2=435,765; y1=200 if tall else 270; y2=640; rr(d,(x1,y1,x2,y2),45,fill="#111f30"); rr(d,(420,y1-70,780,y1+30),22,fill="#17283b"); line(d,(445,y1-38,755,y1-38),GOLD,5); ellipse(d,(470,y2-55,730,y2+20),outline=MUTED,width=3)
def draw_tube(d, long=False):
    x1=520; x2=680; y1=100 if long else 180; y2=670; rr(d,(x1,y1,x2,y2),70,fill="#132438"); rr(d,(510,y1-25,690,y1+90),55,fill="#182a3e"); line(d,(545,y1+48,655,y1+48),GOLD,5)
def draw_box(d, wide=False):
    x1,x2=(300,900) if wide else (390,810); y1,y2=245,610; d.polygon([(x1,y1),(x2,y1),(x2-55,y1-65),(x1+55,y1-65)],fill="#17283b",outline=GOLD); rr(d,(x1,y1,x2,y2),12,fill="#101f31"); line(d,(x1+70,y1+80,x2-70,y1+80),MUTED,4)
def draw_cones(d, count=5):
    for i in range(count):
        x=360+i*120; d.polygon([(x,610),(x+62,180),(x+124,610)],fill="#d6c9a8",outline=GOLD); rr(d,(x+34,570,x+90,665),10,fill="#b89f6d",outline=LIGHT,width=3)
def draw_machine(d, kind="machine"):
    rr(d,(260,220,940,620),28,fill="#102033"); rr(d,(315,275,610,520),18,fill="#071425",outline=MUTED,width=4); rr(d,(650,275,875,455),16,fill="#17283b"); ellipse(d,(705,490,825,610),fill="#071425"); ellipse(d,(360,545,460,645),fill=DARK); ellipse(d,(750,545,850,645),fill=DARK); line(d,(300,620,900,620),GOLD,7)
def draw_scale(d):
    rr(d,(330,260,870,630),26,fill="#17283b"); rr(d,(415,315,785,455),15,fill="#071425",outline=MUTED,width=4); rr(d,(470,500,730,585),12,fill="#d8d2c5",outline=GOLD,width=4)
def draw_vape(d, battery=False):
    if battery:
        rr(d,(520,150,680,665),65,fill="#17283b"); line(d,(540,230,660,230),GOLD,5); ellipse(d,(570,545,630,605),fill=GOLD,outline=LIGHT,width=3)
    else:
        rr(d,(515,220,685,655),40,fill="#9eb0bf33"); rr(d,(545,150,655,275),24,fill="#17283b"); rr(d,(550,610,650,690),12,fill=GOLD); line(d,(545,350,655,350),MUTED,3)
def draw_bottle(d, pump=False, dropper=False):
    rr(d,(440,260,760,655),55,fill="#3b291a" if dropper else "#132438"); rr(d,(500,190,700,300),20,fill="#17283b");
    if dropper: rr(d,(530,90,670,220),28,fill="#101f31"); line(d,(600,210,600,520),LIGHT,8)
    if pump: line(d,(600,190,600,115),GOLD,12); line(d,(600,115,760,115),GOLD,12); line(d,(760,115,760,150),GOLD,10)
def draw_roll(d, tape=False):
    ellipse(d,(330,180,870,700),fill="#17283b"); ellipse(d,(470,320,730,580),fill=BG,outline=GOLD,width=7); line(d,(750,250,980,500),GOLD if tape else LIGHT,16)
def draw_bag(d):
    rr(d,(350,155,850,665),26,fill="#122237"); line(d,(385,230,815,230),GOLD,8); line(d,(400,260,800,260),MUTED,4)
def draw_pack(d):
    rr(d,(330,220,870,600),30,fill="#d7d2c544"); rr(d,(390,290,810,530),20,fill="#d8d2c5",outline=GOLD,width=5); line(d,(430,410,770,410),MUTED,5)
def draw_net(d):
    for x in range(300,901,100): line(d,(x,160,x,650),MUTED,4)
    for y in range(160,651,82): line(d,(300,y,900,y),GOLD,4)
def draw_light(d):
    rr(d,(250,250,950,510),24,fill="#17283b");
    for x in range(300,920,70): line(d,(x,285,x,475),LIGHT,8)
    for x in range(320,900,140): line(d,(x,510,x-45,650),GOLD,8)
def draw_tray(d):
    d.polygon([(260,450),(940,450),(850,650),(350,650)],fill="#17283b",outline=GOLD)
    for y in (495,555): line(d,(330,y,870,y),MUTED,3)
    for x in range(380,861,100): line(d,(x,460,x-35,635),MUTED,3)
    rr(d,(330,175,870,470),100,fill="#9eb0bf22",outline=LIGHT,width=4)
def draw_bale(d):
    rr(d,(300,230,900,620),40,fill="#604b32",outline=GOLD,width=6)
    for y in range(280,600,60): line(d,(330,y,870,y),"#9d825d",4)
    line(d,(500,230,500,620),LIGHT,6); line(d,(700,230,700,620),LIGHT,6)
def draw_bottles(d):
    for x in (360,520,680): rr(d,(x,260,x+150,650),45,fill="#18344a"); rr(d,(x+30,190,x+120,280),18,fill="#17283b")
def draw_pipettes(d):
    for i in range(8):
        x=300+i*85; line(d,(x,190,x+45,620),LIGHT,10); d.polygon([(x+36,620),(x+58,620),(x+52,680)],fill=GOLD)
def draw_sign(d):
    rr(d,(280,180,920,620),20,fill="#f1ead8",outline=GOLD,width=7); ellipse(d,(460,260,740,540),outline="#9a3a31",width=24); line(d,(490,300,710,510),"#9a3a31",24)
def draw_generic(d):
    rr(d,(340,180,860,640),45,fill="#132438"); ellipse(d,(450,290,750,590),outline=GOLD,width=7)

def render(item):
    im=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,14),fill=GOLD); d.ellipse((-170,-220,310,260),outline="#30465a",width=4); d.ellipse((920,590,1320,990),outline="#30465a",width=4)
    s=item['slug']; t=item['title'].lower()
    if 'pouch' in s: draw_pouch(d,1)
    elif 'glass-jar' in s or 'pop-top-jar' in s or 'topical-jar' in s or 'concentrate-jar' in s or 'silicone-concentrate' in s: draw_jar(d,'60ml' in s)
    elif 'tube' in s or 'topical-stick' in s: draw_tube(d,'116mm' in s)
    elif 'box' in s or 'carton' in s or 'shipping-case' in s or 'case-erector' in s: draw_box(d,'shipping' in s or 'case-' in s)
    elif 'cone' in s: draw_cones(d,5)
    elif 'rolling-papers' in s or 'parchment' in s: draw_box(d,True)
    elif 'filter-tips' in s: draw_cones(d,7)
    elif 'humidity-control' in s: draw_pack(d)
    elif 'scale' in s or 'moisture-analyzer' in s: draw_scale(d)
    elif 'vape-cartridge' in s and 'box' not in s and 'tube' not in s and 'filling' not in s: draw_vape(d,False)
    elif 'battery' in s: draw_vape(d,True)
    elif 'tincture-bottle' in s: draw_bottle(d,dropper=True)
    elif 'topical-pump' in s: draw_bottle(d,pump=True)
    elif 'droppers' in s: draw_pipettes(d)
    elif 'label' in s or 'stretch-wrap' in s or 'security-tape' in s: draw_roll(d,'tape' in s)
    elif 'bag' in s or 'tote' in s: draw_bag(d)
    elif 'void-fill' in s: draw_pack(d)
    elif 'trellis' in s: draw_net(d)
    elif 'grow-light' in s: draw_light(d)
    elif 'dome' in s or 'propagation-cubes' in s: draw_tray(d)
    elif 'coco-coir' in s: draw_bale(d)
    elif 'nutrient' in s or 'cloning-gel' in s or 'calibration-solution' in s: draw_bottles(d)
    elif 'pipette' in s: draw_pipettes(d)
    elif 'signage' in s: draw_sign(d)
    elif any(k in s for k in ('machine','shredder','sealer','applicator')): draw_machine(d)
    else: draw_generic(d)
    label(d, item['section'].replace('_',' ') + ' • illustrative product format')
    im.save(OUT/f"{s}.webp",format="WEBP",quality=84,method=6)

for item in items: render(item)
print(f"Generated {len(items)} factual, unbranded product-format WebP illustrations.")

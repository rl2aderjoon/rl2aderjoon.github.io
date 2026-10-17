"""Generate minimal Pretendard maps. Requires shapely, pillow, fonttools, brotli."""
import base64, io, json, math, urllib.request
from pathlib import Path
from xml.sax.saxutils import escape
from shapely.geometry import shape, Polygon, box
from shapely.ops import unary_union, polylabel
from shapely.prepared import prep
from PIL import Image, ImageDraw, ImageFont
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'maps';OUT.mkdir(parents=True,exist_ok=True)
FONTS=ROOT/'assets'/'fonts'
COLORS=['#71C9AE','#82B9E9','#F3C15F','#EE9D88','#B3A2E1','#A2CB7C','#E5A2C5','#79BCC6']
REGIONS=[('11','seoul','서울','Seoul'),('26','busan','부산','Busan'),('27','daegu','대구','Daegu'),('28','incheon','인천','Incheon'),('29','gwangju','광주','Gwangju'),('30','daejeon','대전','Daejeon'),('31','ulsan','울산','Ulsan'),('36','sejong','세종','Sejong'),('41','gyeonggi','경기','Gyeonggi'),('51','gangwon','강원','Gangwon'),('43','chungbuk','충북','Chungbuk'),('44','chungnam','충남','Chungnam'),('45','jeonbuk','전북','Jeonbuk'),('46','jeonnam','전남','Jeonnam'),('47','gyeongbuk','경북','Gyeongbuk'),('48','gyeongnam','경남','Gyeongnam'),('50','jeju','제주','Jeju')]
SEOUL=[['종로구','중구','용산구'],['도봉구','강북구','성북구','노원구'],['동대문구','중랑구','성동구','광진구'],['강동구','송파구'],['서초구','강남구'],['동작구','관악구','금천구'],['강서구','양천구','영등포구','구로구'],['은평구','마포구','서대문구']]
BUSAN=[['중구','동구','서구','영도구'],['부산진구'],['동래구','연제구'],['해운대구'],['수영구','남구'],['금정구','기장군'],['북구'],['사상구','사하구','강서구']]
PROVINCES={code for code,_,_,_ in REGIONS[8:]}
CANVAS=2400

def fit_label(draw,geom,number,label,grouped):
    """Fit the entire ink bounds inside the region, never across its border."""
    for part in sorted(polygons(geom),key=lambda p:p.area,reverse=True):
        try:return fit_polygon_label(draw,part,number,label,grouped)
        except ValueError:continue
    raise ValueError(f'Label cannot fit inside {label}')

def fit_polygon_label(draw,geom,number,label,grouped):
    polygon=max(polygons(geom),key=lambda p:p.area).buffer(-4)
    if polygon.is_empty:raise ValueError(f'No label space: {label}')
    if polygon.geom_type=='MultiPolygon':polygon=max(polygon.geoms,key=lambda p:p.area)
    safe=prep(polygon)
    center=polylabel(polygon,tolerance=2)
    xmin,ymin,xmax,ymax=polygon.bounds
    points=[(center.x,center.y)]
    points.extend((xmin+(xmax-xmin)*x/28,ymin+(ymax-ymin)*y/28) for x in range(1,28) for y in range(1,28))
    points.sort(key=lambda p:(p[0]-center.x)**2+(p[1]-center.y)**2)
    parts=label.split(' · ')
    variants=[[' · '.join(parts[i:i+2]) for i in range(0,len(parts),2)]]
    if grouped:variants.append(parts)
    elif len(label)>2:variants.extend([[label[i:i+2] for i in range(0,len(label),2)],list(label)])
    for size in range(38,11,-1):
        number_size=round(size*1.38)
        for lines in variants+([None] if not grouped and size<=24 else []):
            rows=[];baseline=0
            entries=[(f'{number} {label}',size)] if lines is None else [(str(number),number_size)]+[(line,size) for line in lines]
            for text,sz in entries:
                left,top,right,bottom=draw.textbbox((0,0),text,font=font(sz,True),anchor='ls')
                baseline-=top
                rows.append((text,sz,baseline))
                baseline+=bottom+max(4,round(size*.16))
            width=max(draw.textlength(text,font=font(sz,True)) for text,sz,_ in rows)
            height=baseline-max(4,round(size*.16))
            for x,y in points:
                bounds=box(x-width/2-2,y-height/2-2,x+width/2+2,y+height/2+2)
                if safe.covers(bounds):
                    return x,y-height/2,rows,size,bounds,polygon
    raise ValueError(f'Label cannot fit inside {label}')

def administrative_groups(features,province=False):
    by_name={}
    for feature in sorted(features,key=lambda f:f['properties']['SIG_CD']):
        label=feature['properties']['SIG_KOR_NM']
        # Province maps stop at the city/county level (e.g. 수원시 영통구 → 수원시).
        if province:label=label.split()[0]
        by_name.setdefault(label,[]).append(shape(feature['geometry']))
    return [(label,unary_union(geometries) if len(geometries)>1 else geometries[0]) for label,geometries in by_name.items()]

def load(name):
    url=f'https://raw.githubusercontent.com/KnellBalm/kr-admin-geojson/3a859f2a45be8acf8237d9eefd9565f99cc603da/{name}.geojson'
    return json.loads(urllib.request.urlopen(url).read())['features']

def polygons(g):return list(g.geoms) if g.geom_type=='MultiPolygon' else [g]
def solid_geometry(geom,min_area=0):
    # Fill interior rings and close narrow seams between merged districts.
    filled=unary_union([Polygon(p.exterior) for p in polygons(geom)])
    closed=filled.buffer(.0008,join_style=2).buffer(-.0008,join_style=2)
    parts=polygons(closed);largest=max(parts,key=lambda p:p.area)
    threshold=max(min_area,largest.area*.01)
    return unary_union([Polygon(p.exterior) for p in parts if p.area>=threshold or p is largest])
def font(size,bold=False):return ImageFont.truetype(str(FONTS/('Pretendard-Bold.otf' if bold else 'Pretendard-Regular.otf')),size)
def embedded_font(text):
    f=TTFont(FONTS/'Pretendard-Bold.otf');options=subset.Options();options.flavor='woff2'
    worker=subset.Subsetter(options=options);worker.populate(text=text);worker.subset(f);f.flavor='woff2'
    output=io.BytesIO();f.save(output)
    return base64.b64encode(output.getvalue()).decode()

def make(slug,name,en,groups,grouped=False):
    # Remove tiny islands before fitting the map, so they cannot shrink the mainland.
    min_area=sum(geom.area for _,geom in groups)*.002
    groups=[(label,solid_geometry(geom,min_area).simplify(.003,preserve_topology=True)) for label,geom in groups]
    titles=['#같은지역_트친_찾기',f'#{name}_트친_찾기']
    im=Image.new('RGB',(CANVAS,CANVAS),'white');d=ImageDraw.Draw(im)
    for i,title in enumerate(titles):
        d.text((90,46+i*76),title,font=font(64,True),fill='#21392F')
    encoded=embedded_font(''.join(titles)+''.join(g[0] for g in groups)+'0123456789 ·별도축척섬묶음위치조정')
    style=f'<style>@font-face{{font-family:Pretendard;src:url(data:font/woff2;base64,{encoded}) format("woff2");font-weight:100 900}}text{{font-family:Pretendard,sans-serif;font-weight:700;fill:#21392F}}</style>'
    svg=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}">',style,f'<rect width="{CANVAS}" height="{CANVAS}" fill="white"/>']
    svg.extend(f'<text x="90" y="{108+i*76}" font-size="64">{title}</text>' for i,title in enumerate(titles))
    main_groups=[g for g in groups if not(slug=='incheon' and g[0]=='옹진군')]
    total=unary_union([g[1] for g in main_groups]);xmin,ymin,xmax,ymax=total.bounds
    cosine=math.cos(math.radians((ymin+ymax)/2));dx=(xmax-xmin)*cosine;dy=ymax-ymin
    scale=min((1400 if slug=='incheon' else 2260)/max(dx,.001),2060/max(dy,.001))
    def main_xy(x,y):return ((1630 if slug=='incheon' else 1200)+(x-(xmin+xmax)/2)*cosine*scale,1280-(y-(ymin+ymax)/2)*scale)
    labels=[];paths=[]
    for i,(label,geom) in enumerate(groups):
        xy=main_xy
        inset_clusters=None
        if slug=='incheon' and label=='옹진군':
            # Separate far-apart island clusters so each retains a useful size.
            clusters=[geom.intersection(part) for part in polygons(geom.buffer(.08))]
            clusters.sort(key=lambda g:g.area,reverse=True)
            rows=math.ceil(len(clusters)/2)
            inset_clusters=[]
            cell_h=930/rows
            for j,cluster in enumerate(clusters):
                bx,by,ex,ey=cluster.bounds
                s=min(370/max((ex-bx)*cosine,.001),(cell_h-45)/max(ey-by,.001))
                cx=265+(j%2)*430;cy=1385+cell_h/2+(j//2)*cell_h
                def cluster_xy(x,y,bx=bx,by=by,ex=ex,ey=ey,s=s,cx=cx,cy=cy):
                    return (cx+(x-(bx+ex)/2)*cosine*s,cy-(y-(by+ey)/2)*s)
                inset_clusters.append((cluster,cluster_xy))
            d.rounded_rectangle((40,1220,940,2350),radius=12,outline='#DEE4DE',width=2)
            note='옹진군 · 섬 묶음별 별도 축척'
            d.text((70,1250),note,font=font(28,True),fill='#21392F')
            d.text((70,1290),'섬 위치 조정',font=font(24,True),fill='#21392F')
            paths.append(f'<rect x="40" y="1220" width="900" height="1130" rx="12" fill="none" stroke="#DEE4DE" stroke-width="2"/><text x="70" y="1278" font-size="28">{note}</text><text x="70" y="1314" font-size="24">섬 위치 조정</text>')
        simple=geom
        screen_parts=[]
        pieces=[(p,transform) for cluster,transform in inset_clusters for p in polygons(cluster)] if inset_clusters else [(p,xy) for p in polygons(simple)]
        for p,transform in pieces:
            pts=[transform(x,y) for x,y,*_ in p.exterior.coords]
            screen_parts.append(Polygon(pts))
            d.polygon(pts,fill=COLORS[i%8]);d.line(pts,fill='white',width=4,joint='curve')
            path='M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+'Z'
            paths.append(f'<path d="{path}" fill="{COLORS[i%8]}" stroke="white" stroke-width="4" stroke-linejoin="round" fill-rule="evenodd"/>')
        labels.append((i,label,unary_union(screen_parts)))
    svg.extend(paths)
    smallest=100
    for i,label,screen_geom in labels:
        x,top,rows,size,bounds,safe_polygon=fit_label(d,screen_geom,i,label,grouped)
        assert safe_polygon.covers(bounds),f'{slug}: {label} outside region'
        smallest=min(smallest,size)
        svg.append(f'<g data-region="{escape(label)}" data-label-contained="true">')
        for text,sz,baseline in rows:
            y=top+baseline
            ink_bounds=d.textbbox((x,y),text,font=font(sz,True),anchor='ms')
            assert safe_polygon.covers(box(*ink_bounds)),f'{slug}: {label} ink outside region'
            d.text((x,y),text,font=font(sz,True),fill='#21392F',anchor='ms')
            svg.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" font-size="{sz}">{escape(text)}</text>')
        svg.append('</g>')
    print(f'{slug}: {len(labels)} labels contained; smallest name font {smallest}px')
    svg.append('</svg>');(OUT/f'{slug}.svg').write_text(''.join(svg),encoding='utf-8');im.save(OUT/f'{slug}.png',optimize=True)
    (OUT/f'{slug}-thumb.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 220 2340 2140">'+style+''.join(paths)+'</svg>',encoding='utf-8')
    return {'id':slug,'name':name,'english':en,'areas':len(groups),'grouped':grouped,'legend':[{'number':i,'name':label,'color':COLORS[i%8]} for i,(label,_) in enumerate(groups)]}

if __name__=='__main__':
    sig=load('sig');sido=load('ctprvn');result=[]
    for code,slug,name,en in REGIONS:
        features=[f for f in sig if f['properties']['CTPRVN_CD']==code]
        if not features:raise ValueError(f'No boundaries for {name}')
        assigned=SEOUL if slug=='seoul' else BUSAN if slug=='busan' else None
        if assigned:
            by_name={f['properties']['SIG_KOR_NM']:shape(f['geometry']) for f in features}
            assert sorted(by_name)==sorted(n for group in assigned for n in group)
            groups=[(' · '.join(names),unary_union([by_name[n] for n in names])) for names in assigned]
        else:groups=administrative_groups(features,province=code in PROVINCES)
        result.append(make(slug,name,en,groups,bool(assigned)))
    names={code:name for code,_,name,_ in REGIONS}
    groups=[(names[f['properties']['CTPRVN_CD']],shape(f['geometry'])) for f in sorted(sido,key=lambda f:f['properties']['CTPRVN_CD'])]
    result.append(make('korea','전국','All of Korea',groups))
    (OUT/'catalog.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    # A local subset covers the website and all place names. No font CDN is required.
    text=''.join(p.read_text(encoding='utf-8') for p in [ROOT/'index.html',ROOT/'maps.js',OUT/'catalog.json'])
    for weight in ['Regular','Bold']:
        f=TTFont(FONTS/f'Pretendard-{weight}.otf');options=subset.Options();worker=subset.Subsetter(options=options);worker.populate(text=text);worker.subset(f);f.flavor='woff2';f.save(FONTS/f'Pretendard-{weight}.woff2')
    print(f'Generated {len(result)} minimal maps with embedded Pretendard')

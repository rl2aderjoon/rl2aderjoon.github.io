"""Generate minimal Pretendard maps. Requires shapely, pillow, fonttools, brotli."""
import base64, io, json, math, urllib.request
from pathlib import Path
from xml.sax.saxutils import escape
from shapely.geometry import shape
from shapely.ops import unary_union
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

def load(name):
    url=f'https://raw.githubusercontent.com/KnellBalm/kr-admin-geojson/3a859f2a45be8acf8237d9eefd9565f99cc603da/{name}.geojson'
    return json.loads(urllib.request.urlopen(url).read())['features']

def polygons(g):return list(g.geoms) if g.geom_type=='MultiPolygon' else [g]
def font(size,bold=False):return ImageFont.truetype(str(FONTS/('Pretendard-Bold.otf' if bold else 'Pretendard-Regular.otf')),size)
def embedded_font(text):
    f=TTFont(FONTS/'Pretendard-Bold.otf');options=subset.Options();options.flavor='woff2'
    worker=subset.Subsetter(options=options);worker.populate(text=text);worker.subset(f);f.flavor='woff2'
    output=io.BytesIO();f.save(output)
    return base64.b64encode(output.getvalue()).decode()

def make(slug,name,en,groups,grouped=False):
    title=f'{name} 지역 트친 찾기'
    im=Image.new('RGB',(1600,1600),'white');d=ImageDraw.Draw(im)
    d.text((85,64),title,font=font(61,True),fill='#21392F')
    encoded=embedded_font(title+''.join(g[0] for g in groups)+'0123456789 ·별도축척')
    style=f'<style>@font-face{{font-family:Pretendard;src:url(data:font/woff2;base64,{encoded}) format("woff2");font-weight:100 900}}text{{font-family:Pretendard,sans-serif;font-weight:700;fill:#21392F}}</style>'
    svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600">',style,'<rect width="1600" height="1600" fill="white"/>',f'<text x="85" y="122" font-size="61">{title}</text>']
    main_groups=[g for g in groups if not(slug=='incheon' and g[0]=='옹진군')]
    total=unary_union([g[1] for g in main_groups]);xmin,ymin,xmax,ymax=total.bounds
    cosine=math.cos(math.radians((ymin+ymax)/2));dx=(xmax-xmin)*cosine;dy=ymax-ymin
    scale=min((1000 if slug=='incheon' else 1420)/max(dx,.001),1260/max(dy,.001))
    def main_xy(x,y):return ((1000 if slug=='incheon' else 800)+(x-(xmin+xmax)/2)*cosine*scale,865-(y-(ymin+ymax)/2)*scale)
    labels=[];paths=[]
    for i,(label,geom) in enumerate(groups):
        xy=main_xy
        if slug=='incheon' and label=='옹진군':
            bx,by,ex,ey=geom.bounds;s=min(330/max((ex-bx)*cosine,.001),300/max(ey-by,.001))
            def xy(x,y):return (280+(x-(bx+ex)/2)*cosine*s,1190-(y-(by+ey)/2)*s)
            d.rounded_rectangle((80,950,480,1480),radius=12,outline='#DEE4DE',width=2)
            d.text((110,975),'옹진군 · 별도 축척',font=font(24,True),fill='#21392F')
            paths.append('<rect x="80" y="950" width="400" height="530" rx="12" fill="none" stroke="#DEE4DE" stroke-width="2"/><text x="110" y="1000" font-size="24">옹진군 · 별도 축척</text>')
        simple=geom.simplify(.003,preserve_topology=True)
        for p in polygons(simple):
            pts=[xy(x,y) for x,y,*_ in p.exterior.coords]
            d.polygon(pts,fill=COLORS[i%8]);d.line(pts,fill='white',width=4,joint='curve')
            path='M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+'Z'
            for interior in p.interiors:
                hole=[xy(x,y) for x,y,*_ in interior.coords];d.polygon(hole,fill='white')
                path+='M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in hole)+'Z'
            paths.append(f'<path d="{path}" fill="{COLORS[i%8]}" stroke="white" stroke-width="4" stroke-linejoin="round" fill-rule="evenodd"/>')
        largest=max(polygons(geom),key=lambda p:p.area);point=largest.representative_point();x,y=xy(point.x,point.y)
        name_size=27 if grouped else 26 if len(groups)<24 else 21
        number_size=43 if grouped else 35 if len(groups)<24 else 28
        # Group names are printed directly on the map, without a separate legend.
        parts=label.split(' · ');lines=[]
        for start in range(0,len(parts),2):lines.append(' · '.join(parts[start:start+2]))
        labels.append((i,x,y,lines,name_size,number_size))
    svg.extend(paths);placed=[]
    for i,x,y,lines,sz,nsize in labels:
        original=(x,y);w=max(d.textlength(line,font=font(sz,True)) for line in lines)+12;h=nsize+len(lines)*(sz+5)+10
        for step in range(160):
            box=(x-w/2-7,y-h/2-7,x+w/2+7,y+h/2+7)
            valid=box[0]>65 and box[2]<1535 and box[1]>200 and box[3]<1540
            if valid and all(box[2]<b[0] or box[0]>b[2] or box[3]<b[1] or box[1]>b[3] for b in placed):break
            angle=step*2.39996;r=14+step*1.8;x=original[0]+math.cos(angle)*r;y=original[1]+math.sin(angle)*r
        placed.append(box)
        if math.hypot(x-original[0],y-original[1])>45:
            d.line([original,(x,y)],fill='#83978C',width=2)
            svg.append(f'<path d="M{original[0]:.1f},{original[1]:.1f}L{x:.1f},{y:.1f}" stroke="#83978C" stroke-width="2"/>')
        top=y-h/2
        d.text((x,top),str(i),font=font(nsize,True),fill='#21392F',anchor='mt')
        svg.append(f'<text x="{x:.1f}" y="{top+nsize:.1f}" text-anchor="middle" font-size="{nsize}">{i}</text>')
        for j,line in enumerate(lines):
            ty=top+nsize+8+j*(sz+5)
            d.text((x,ty),line,font=font(sz,True),fill='#21392F',anchor='mt')
            svg.append(f'<text x="{x:.1f}" y="{ty+sz:.1f}" text-anchor="middle" font-size="{sz}">{escape(line)}</text>')
    svg.append('</svg>');(OUT/f'{slug}.svg').write_text(''.join(svg),encoding='utf-8');im.save(OUT/f'{slug}.png',optimize=True)
    (OUT/f'{slug}-thumb.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 200 1500 1350">'+style+''.join(paths)+'</svg>',encoding='utf-8')
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
        else:groups=[(f['properties']['SIG_KOR_NM'],shape(f['geometry'])) for f in sorted(features,key=lambda f:f['properties']['SIG_CD'])]
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

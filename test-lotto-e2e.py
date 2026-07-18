#!/usr/bin/env python3
"""数字碰全链路 E2E 测试"""
import urllib.request, json, sys

BASE = 'https://ws.hi.cn/api/lotto'
PASS = 0
FAIL = 0

def ok(msg):
    global PASS; PASS += 1
    print(f'  ✅ {msg}')

def fail(msg, detail=''):
    global FAIL; FAIL += 1
    print(f'  ❌ {msg} {detail}')

# 1. Quick-pick
print('\n1. Quick pick')
try:
    resp = json.loads(urllib.request.urlopen(BASE + '/quick-pick?code=ssq').read())
    assert resp['code'] == 0
    t = resp['data']['ticket']
    ok(f'front={t["front"]} back={t["back"]}')
except Exception as e:
    fail(f'quick-pick: {e}')

# 2. Config
print('\n2. Config API')
try:
    resp = json.loads(urllib.request.urlopen(BASE + '/config?code=ssq').read())
    assert resp['code'] == 0
    assert resp['data']['name'] == '红蓝碰'
    ok(f'name={resp["data"]["name"]} price={resp["data"]["price"]}')
except Exception as e:
    fail(f'config: {e}')

# 3. Bet
print('\n3. Bet (create pending)')
try:
    data = json.dumps({'member_id': '7777', 'lottery': 'ssq',
        'tickets': [{'front': [3,8,12,19,25,31], 'back': [7]}],
        'multiple': 1}).encode()
    req = urllib.request.Request(BASE + '/bet', data=data,
        headers={'Content-Type': 'application/json'}, method='POST')
    resp = json.loads(urllib.request.urlopen(req).read().decode())
    draw_id = resp['data']['draw_id']
    assert draw_id.startswith('SSQ')
    ok(f'draw_id={draw_id}')
except Exception as e:
    fail(f'bet: {e}')

# 4. Roll
print('\n4. Roll numbers')
result = None
try:
    for i in range(8):
        data = json.dumps({'draw_id': draw_id, 'uid': 7777}).encode()
        req = urllib.request.Request(BASE + '/roll', data=data,
            headers={'Content-Type': 'application/json'}, method='POST')
        resp = json.loads(urllib.request.urlopen(req).read().decode())
        d = resp.get('data', {})
        num = d.get('number')
        zone = d.get('zone')
        last = d.get('is_last', False)
        st = d.get('status', '')
        print(f'   Ball {i+1}: num={num} zone={zone} last={last} status={st}')
        if last or st == 'complete':
            if 'result' in d:
                result = d['result']
                ok(f'result in response: total_win={result["total_win"]}')
            if 'draw' in d:
                ok(f'draw in response: front={d["draw"]["front"]}')
            break
    else:
        fail('did not complete after 8 rolls')
except Exception as e:
    fail(f'roll: {e}')

# 5. Status API (recovery)
print('\n5. Status API')
try:
    data = json.dumps({'draw_id': draw_id, 'action': 'status'}).encode()
    req = urllib.request.Request(BASE + '/roll', data=data,
        headers={'Content-Type': 'application/json'}, method='POST')
    resp = json.loads(urllib.request.urlopen(req).read().decode())
    d = resp.get('data', {})
    assert d.get('status') in ('complete', 'expired')
    assert d.get('result') is not None
    ok(f'status={d["status"]} result={"OK" if d["result"] else "MISSING"}')
except Exception as e:
    fail(f'status: {e}')

# 6. Economy
print('\n6. Economy API')
try:
    resp = json.loads(urllib.request.urlopen(BASE + '/economy?code=ssq').read())
    assert resp['code'] == 0
    ok(f'data keys: {list(resp["data"].keys())}')
except Exception as e:
    fail(f'economy: {e}')

# Summary
print(f'\n╔══════════════════════════════╗')
print(f'║  {PASS}/{PASS+FAIL} 通过')
print(f'╚══════════════════════════════╝')
sys.exit(0 if FAIL == 0 else 1)

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function loadDashboardScript() {
    const context = {
        console,
        document: {
            readyState: 'loading',
            addEventListener() {},
            getElementById() {
                return null;
            },
            querySelector() {
                return null;
            },
        },
        localStorage: {
            getItem() {
                return null;
            },
            setItem() {},
        },
        Chart: function Chart() {},
    };
    vm.createContext(context);
    vm.runInContext(script, context);
    return context;
}

test('market factor input explains source and calculation method', () => {
    assert.match(html, /市场因子 \(Market Factors\)/);
    assert.match(html, /成长\/价值分化度 \(%\)/);
    assert.match(html, /来源: AkShare \+ 计算/);
    assert.match(html, /0\.4×20日超额收益 \+ 0\.6×60日超额收益/);
    assert.match(html, /仅微调成长\/红利，不改变股债比例/);
    assert.doesNotMatch(html, /id="turnover-trend"/);
});

test('growth value dispersion only tilts internal equity allocation', () => {
    const { calculateAssetAllocation } = loadDashboardScript();

    const base = calculateAssetAllocation(2, 0, 50, 0);
    const growthTilt = calculateAssetAllocation(2, 0, 50, 12);
    const valueTilt = calculateAssetAllocation(2, 0, 50, -12);

    assert.equal(growthTilt.growth, base.growth + 5);
    assert.equal(growthTilt.dividend, base.dividend - 5);
    assert.equal(growthTilt.commodity, base.commodity);
    assert.equal(growthTilt.bond, base.bond);
    assert.equal(growthTilt.total, base.total);

    assert.equal(valueTilt.growth, base.growth - 5);
    assert.equal(valueTilt.dividend, base.dividend + 5);
    assert.equal(valueTilt.commodity, base.commodity);
    assert.equal(valueTilt.bond, base.bond);
    assert.equal(valueTilt.total, base.total);
});

test('manual default notes are not reported as fetch failures', () => {
    const { formatFetchNotes } = loadDashboardScript();

    assert.match(
        formatFetchNotes(['growthPEPercentile: 暂未实现自动计算，保留默认/手动值']),
        /自动数据获取成功/
    );
    assert.doesNotMatch(
        formatFetchNotes(['growthPEPercentile: 暂未实现自动计算，保留默认/手动值']),
        /获取失败/
    );
});

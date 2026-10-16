import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packages, packageFromSearch, configurePackageFields } from '../src/packages.js';

test('package links resolve to supported saved package IDs', () => {
    assert.equal(packageFromSearch(''), 'quickScript');
    for (const id of Object.keys(packages)) assert.equal(packageFromSearch('?package=' + id), id);
    for (const id of ['unknown', 'toString', '__proto__']) assert.equal(packageFromSearch('?package=' + id), null);
});

test('only selected package questions are enabled and included in form submission', () => {
    for (const id of ['quickScript', 'booking', 'custom', null]) {
        const sections = ['booking', 'custom'].map(packageFields => ({
            dataset: { packageFields }, hidden: true,
            controls: [{disabled: true, required: true}, {disabled: true, required: false}],
            querySelectorAll() { return this.controls; }
        }));
        configurePackageFields({ querySelectorAll: () => sections }, id);
        for (const section of sections) {
            const active = section.dataset.packageFields === id;
            assert.equal(section.hidden, !active);
            assert.ok(section.controls.every(control => control.disabled === !active));
            assert.equal(section.controls[0].required, true);
        }
    }
});
